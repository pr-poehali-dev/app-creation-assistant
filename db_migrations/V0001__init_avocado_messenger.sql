
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(32) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_color VARCHAR(7) DEFAULT '#2d8c4e',
  bio TEXT DEFAULT '',
  two_fa BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  frozen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('private','group','channel')),
  name VARCHAR(100),
  description TEXT DEFAULT '',
  avatar_color VARCHAR(7) DEFAULT '#2d8c4e',
  owner_id INTEGER REFERENCES users(id) ON UPDATE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_members (
  chat_id INTEGER REFERENCES chats(id) ON UPDATE CASCADE,
  user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE,
  role VARCHAR(10) DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES chats(id) ON UPDATE CASCADE,
  user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE,
  type VARCHAR(10) NOT NULL DEFAULT 'text' CHECK (type IN ('text','image','voice','video','sticker')),
  content TEXT,
  encrypted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_reactions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON UPDATE CASCADE,
  user_id INTEGER REFERENCES users(id) ON UPDATE CASCADE,
  emoji VARCHAR(8) NOT NULL,
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
