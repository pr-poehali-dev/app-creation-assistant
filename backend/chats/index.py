"""Чаты и сообщения: список чатов, создание, отправка сообщений"""
import json, os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_by_token(conn, token: str):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT u.* FROM users u
            JOIN sessions s ON s.user_id = u.id
            WHERE s.token = %s AND s.expires_at > NOW()
        """, (token,))
        return cur.fetchone()

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    body = json.loads(event.get('body') or '{}')
    token = event.get('headers', {}).get('X-Authorization', '').replace('Bearer ', '')

    conn = get_conn()
    try:
        user = get_user_by_token(conn, token)
        if not user:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
        user_id = user['id']

        # GET /  — список чатов пользователя
        if method == 'GET' and (path.endswith('/chats') or path.rstrip('/').endswith('/chats')):
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT
                        c.id, c.type, c.name, c.description, c.avatar_color, c.created_at,
                        (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
                        (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_time,
                        (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND created_at > COALESCE(
                            (SELECT MAX(created_at) FROM messages WHERE chat_id = c.id AND user_id = %s), '2000-01-01'
                        )) AS unread,
                        CASE WHEN c.type = 'private' THEN (
                            SELECT u.display_name FROM users u
                            JOIN chat_members cm2 ON cm2.user_id = u.id
                            WHERE cm2.chat_id = c.id AND u.id != %s LIMIT 1
                        ) END AS peer_name,
                        CASE WHEN c.type = 'private' THEN (
                            SELECT u.username FROM users u
                            JOIN chat_members cm2 ON cm2.user_id = u.id
                            WHERE cm2.chat_id = c.id AND u.id != %s LIMIT 1
                        ) END AS peer_username,
                        (SELECT COUNT(*) FROM chat_members WHERE chat_id = c.id) AS member_count
                    FROM chats c
                    JOIN chat_members cm ON cm.chat_id = c.id
                    WHERE cm.user_id = %s
                    ORDER BY last_time DESC NULLS LAST
                """, (user_id, user_id, user_id, user_id))
                chats = []
                for row in cur.fetchall():
                    r = dict(row)
                    r['created_at'] = str(r['created_at'])
                    r['last_time'] = str(r['last_time']) if r['last_time'] else None
                    r['unread'] = int(r['unread'] or 0)
                    r['member_count'] = int(r['member_count'] or 0)
                    chats.append(r)
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'chats': chats})}

        # POST /create  — создать чат/группу/канал
        if method == 'POST' and path.endswith('/create'):
            chat_type = body.get('type', 'private')
            name = body.get('name', '')
            description = body.get('description', '')
            peer_username = body.get('peer_username', '')

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if chat_type == 'private':
                    # найти собеседника
                    cur.execute("SELECT id FROM users WHERE username = %s", (peer_username.lower(),))
                    peer = cur.fetchone()
                    if not peer:
                        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Пользователь не найден'})}
                    peer_id = peer['id']
                    # проверить, нет ли уже приватного чата
                    cur.execute("""
                        SELECT c.id FROM chats c
                        JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = %s
                        JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = %s
                        WHERE c.type = 'private'
                    """, (user_id, peer_id))
                    existing = cur.fetchone()
                    if existing:
                        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'chat_id': existing['id']})}
                    cur.execute("INSERT INTO chats (type, owner_id) VALUES ('private', %s) RETURNING id", (user_id,))
                    chat_id = cur.fetchone()['id']
                    cur.execute("INSERT INTO chat_members (chat_id, user_id, role) VALUES (%s, %s, 'owner'), (%s, %s, 'member')",
                                (chat_id, user_id, chat_id, peer_id))
                else:
                    if not name:
                        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Укажите название'})}
                    cur.execute("INSERT INTO chats (type, name, description, owner_id) VALUES (%s, %s, %s, %s) RETURNING id",
                                (chat_type, name, description, user_id))
                    chat_id = cur.fetchone()['id']
                    cur.execute("INSERT INTO chat_members (chat_id, user_id, role) VALUES (%s, %s, 'owner')", (chat_id, user_id))
                conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'chat_id': chat_id})}

        # GET /messages?chat_id=X
        if method == 'GET' and path.endswith('/messages'):
            chat_id = int((event.get('queryStringParameters') or {}).get('chat_id', 0))
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # проверить членство
                cur.execute("SELECT 1 FROM chat_members WHERE chat_id = %s AND user_id = %s", (chat_id, user_id))
                if not cur.fetchone():
                    return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}
                cur.execute("""
                    SELECT m.id, m.chat_id, m.user_id, m.type, m.content, m.encrypted, m.created_at,
                           u.display_name, u.username
                    FROM messages m
                    JOIN users u ON u.id = m.user_id
                    WHERE m.chat_id = %s
                    ORDER BY m.created_at ASC
                    LIMIT 100
                """, (chat_id,))
                msgs = []
                for row in cur.fetchall():
                    r = dict(row)
                    r['created_at'] = str(r['created_at'])
                    msgs.append(r)
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'messages': msgs})}

        # POST /send
        if method == 'POST' and path.endswith('/send'):
            chat_id = body.get('chat_id')
            content = body.get('content', '')
            msg_type = body.get('type', 'text')
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT 1 FROM chat_members WHERE chat_id = %s AND user_id = %s", (chat_id, user_id))
                if not cur.fetchone():
                    return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}
                cur.execute("""
                    INSERT INTO messages (chat_id, user_id, type, content)
                    VALUES (%s, %s, %s, %s) RETURNING id, created_at
                """, (chat_id, user_id, msg_type, content))
                row = cur.fetchone()
                conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'id': row['id'],
                'created_at': str(row['created_at']),
                'user_id': user_id,
                'display_name': user['display_name'],
            })}

        # POST /add_member
        if method == 'POST' and path.endswith('/add_member'):
            chat_id = body.get('chat_id')
            username = (body.get('username') or '').lower()
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                target = cur.fetchone()
                if not target:
                    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Пользователь не найден'})}
                cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (chat_id, target['id']))
                conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
    finally:
        conn.close()
