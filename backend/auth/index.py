"""Авторизация: регистрация, вход, получение профиля, поиск пользователей"""
import json, os, secrets, hashlib
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def make_token() -> str:
    return secrets.token_hex(32)

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
        # POST /register
        if method == 'POST' and path.endswith('/register'):
            username = (body.get('username') or '').strip().lower()
            phone = (body.get('phone') or '').strip()
            password = body.get('password') or ''
            display_name = (body.get('display_name') or '').strip()

            if not all([username, phone, password, display_name]):
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
            if len(username) < 3:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Username минимум 3 символа'})}
            if len(password) < 6:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Пароль минимум 6 символов'})}

            pw_hash = hash_password(password)
            tok = make_token()
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                try:
                    cur.execute("""
                        INSERT INTO users (username, phone, password_hash, display_name)
                        VALUES (%s, %s, %s, %s) RETURNING id, username, display_name, phone, is_admin, frozen, created_at
                    """, (username, phone, pw_hash, display_name))
                    user = dict(cur.fetchone())
                    cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user['id'], tok))
                    conn.commit()
                except psycopg2.errors.UniqueViolation:
                    conn.rollback()
                    return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Такой username или телефон уже занят'})}
            user['created_at'] = str(user['created_at'])
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'token': tok, 'user': user})}

        # POST /login
        if method == 'POST' and path.endswith('/login'):
            login = (body.get('login') or '').strip()
            password = body.get('password') or ''
            pw_hash = hash_password(password)
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, username, display_name, phone, is_admin, frozen, created_at
                    FROM users WHERE (username = %s OR phone = %s) AND password_hash = %s
                """, (login.lower(), login, pw_hash))
                user = cur.fetchone()
                if not user:
                    return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный логин или пароль'})}
                user = dict(user)
                if user.get('frozen'):
                    return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Аккаунт заморожен'})}
                tok = make_token()
                cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user['id'], tok))
                conn.commit()
            user['created_at'] = str(user['created_at'])
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'token': tok, 'user': user})}

        # GET /me
        if method == 'GET' and path.endswith('/me'):
            user = get_user_by_token(conn, token)
            if not user:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            u = dict(user)
            u['created_at'] = str(u['created_at'])
            u.pop('password_hash', None)
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': u})}

        # GET /search?q=username
        if method == 'GET' and path.endswith('/search'):
            q = (event.get('queryStringParameters') or {}).get('q', '').strip()
            if len(q) < 2:
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': []})}
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, username, display_name, avatar_color, bio
                    FROM users WHERE username ILIKE %s OR display_name ILIKE %s LIMIT 20
                """, (f'%{q}%', f'%{q}%'))
                users = [dict(r) for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': users})}

        # GET /admin/users  (только для админов)
        if method == 'GET' and path.endswith('/admin/users'):
            user = get_user_by_token(conn, token)
            if not user or not user.get('is_admin'):
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id, username, display_name, phone, is_admin, frozen, created_at FROM users ORDER BY id DESC")
                users = [dict(r) for r in cur.fetchall()]
            for u in users:
                u['created_at'] = str(u['created_at'])
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': users})}

        # POST /admin/freeze
        if method == 'POST' and path.endswith('/admin/freeze'):
            admin = get_user_by_token(conn, token)
            if not admin or not admin.get('is_admin'):
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Нет доступа'})}
            target_id = body.get('user_id')
            frozen = body.get('frozen', True)
            with conn.cursor() as cur:
                cur.execute("UPDATE users SET frozen = %s WHERE id = %s", (frozen, target_id))
                conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        # POST /logout
        if method == 'POST' and path.endswith('/logout'):
            with conn.cursor() as cur:
                cur.execute("UPDATE sessions SET expires_at = NOW() WHERE token = %s", (token,))
                conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
    finally:
        conn.close()
