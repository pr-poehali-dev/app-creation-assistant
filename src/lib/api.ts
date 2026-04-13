const AUTH_URL = "https://functions.poehali.dev/93d82dd6-0835-4ede-93f2-a0e8a4cc1039";
const CHATS_URL = "https://functions.poehali.dev/47d6b47c-050c-4207-a079-d53788dd4eee";

function getToken() { return localStorage.getItem("avo_token") || ""; }

async function req(url: string, path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(url + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(typeof JSON.parse(text) === "string" ? JSON.parse(text) : text); }
  catch { data = JSON.parse(text); }
  if (!res.ok) throw new Error((data as Record<string, string>)?.error || "Ошибка сервера");
  return data;
}

export const api = {
  auth: {
    register: (body: { username: string; phone: string; password: string; display_name: string }) =>
      req(AUTH_URL, "/register", { method: "POST", body: JSON.stringify(body) }) as Promise<{ token: string; user: User }>,
    login: (body: { login: string; password: string }) =>
      req(AUTH_URL, "/login", { method: "POST", body: JSON.stringify(body) }) as Promise<{ token: string; user: User }>,
    me: () => req(AUTH_URL, "/me") as Promise<{ user: User }>,
    search: (q: string) => req(AUTH_URL, `/search?q=${encodeURIComponent(q)}`) as Promise<{ users: UserBrief[] }>,
    logout: () => req(AUTH_URL, "/logout", { method: "POST" }),
    adminUsers: () => req(AUTH_URL, "/admin/users") as Promise<{ users: User[] }>,
    adminFreeze: (user_id: number, frozen: boolean) =>
      req(AUTH_URL, "/admin/freeze", { method: "POST", body: JSON.stringify({ user_id, frozen }) }),
  },
  chats: {
    list: () => req(CHATS_URL, "/chats") as Promise<{ chats: ChatItem[] }>,
    create: (body: { type: string; name?: string; description?: string; peer_username?: string }) =>
      req(CHATS_URL, "/create", { method: "POST", body: JSON.stringify(body) }) as Promise<{ chat_id: number }>,
    messages: (chat_id: number) =>
      req(CHATS_URL, `/messages?chat_id=${chat_id}`) as Promise<{ messages: MsgItem[] }>,
    send: (chat_id: number, content: string, type = "text") =>
      req(CHATS_URL, "/send", { method: "POST", body: JSON.stringify({ chat_id, content, type }) }),
    addMember: (chat_id: number, username: string) =>
      req(CHATS_URL, "/add_member", { method: "POST", body: JSON.stringify({ chat_id, username }) }),
  },
};

export interface User {
  id: number;
  username: string;
  display_name: string;
  phone: string;
  is_admin: boolean;
  frozen: boolean;
  two_fa: boolean;
  avatar_color?: string;
  bio?: string;
  created_at: string;
}

export interface UserBrief {
  id: number;
  username: string;
  display_name: string;
  avatar_color?: string;
  bio?: string;
}

export interface ChatItem {
  id: number;
  type: "private" | "group" | "channel";
  name: string | null;
  description: string;
  avatar_color: string;
  created_at: string;
  last_message: string | null;
  last_time: string | null;
  unread: number;
  peer_name: string | null;
  peer_username: string | null;
  member_count: number;
}

export interface MsgItem {
  id: number;
  chat_id: number;
  user_id: number;
  type: string;
  content: string;
  encrypted: boolean;
  created_at: string;
  display_name: string;
  username: string;
}
