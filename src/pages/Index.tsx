import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { api, type User, type ChatItem, type MsgItem } from "@/lib/api";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 86400 && d.getDate() === now.getDate())
    return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800) return d.toLocaleDateString("ru", { weekday: "short" });
  return d.toLocaleDateString("ru", { day: "numeric", month: "short" });
};
const nowStr = () => new Date().toISOString();

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Ava({ name, size = 40, color, online }: { name: string; size?: number; color?: string; online?: boolean }) {
  const COLORS = ["#3d6b52","#4a7c62","#2d5c44","#537d63","#3e6f55"];
  const bg = color || COLORS[(name.codePointAt(0) ?? 0) % COLORS.length];
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div className="flex items-center justify-center rounded-full text-white font-semibold select-none overflow-hidden"
        style={{ width: size, height: size, background: bg, fontSize: Math.round(size * 0.36) }}>
        {initials}
      </div>
      {online !== undefined && (
        <div className="absolute bottom-0 right-0 rounded-full border-2 border-background"
          style={{ width: Math.round(size * 0.27), height: Math.round(size * 0.27), background: online ? "#4ade80" : "#9ca3af" }} />
      )}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type = "info" }: { msg: string; type?: "info" | "error" }) {
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[999] px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg animate-bounce-in pointer-events-none
      ${type === "error" ? "bg-destructive text-destructive-foreground" : "bg-foreground text-background"}`}>
      {msg}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div>
      {label && <p className="text-xs text-muted-foreground mb-1 font-medium">{label}</p>}
      <input className="w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition placeholder:text-muted-foreground" {...props} />
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition">
            <Icon name="X" size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onSuccess }: { onSuccess: (user: User, token: string) => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [login, setLogin] = useState({ login: "", password: "" });
  const [reg, setReg] = useState({ display_name: "", username: "", phone: "", password: "" });

  const doLogin = async () => {
    if (!login.login || !login.password) { setError("Заполните все поля"); return; }
    setLoading(true); setError("");
    try {
      const res = await api.auth.login(login);
      localStorage.setItem("avo_token", res.token);
      onSuccess(res.user, res.token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setLoading(false); }
  };

  const doRegister = async () => {
    if (!reg.display_name || !reg.username || !reg.phone || !reg.password) { setError("Заполните все поля"); return; }
    if (reg.username.length < 3) { setError("Username минимум 3 символа"); return; }
    if (reg.password.length < 6) { setError("Пароль минимум 6 символов"); return; }
    setLoading(true); setError("");
    try {
      const res = await api.auth.register(reg);
      localStorage.setItem("avo_token", res.token);
      onSuccess(res.user, res.token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen chat-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-[28px] bg-[#3a3a3a] flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-4xl">🥑</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Avocado</h1>
          <p className="text-muted-foreground text-sm mt-1">Защищённый мессенджер</p>
        </div>
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          <div className="flex border-b border-border">
            {(["login", "register"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-3 text-sm font-medium transition ${tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {t === "login" ? "Войти" : "Создать аккаунт"}
              </button>
            ))}
          </div>
          <div className="p-5 space-y-3">
            {tab === "login" ? (
              <>
                <Field label="Телефон или username" placeholder="+7... или @username" value={login.login}
                  onChange={e => setLogin(p => ({ ...p, login: e.target.value }))} />
                <Field label="Пароль" type="password" placeholder="••••••" value={login.password}
                  onChange={e => setLogin(p => ({ ...p, password: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && doLogin()} />
              </>
            ) : (
              <>
                <Field label="Имя" placeholder="Иван Иванов" value={reg.display_name}
                  onChange={e => setReg(p => ({ ...p, display_name: e.target.value }))} />
                <Field label="Username" placeholder="ivan (латиница)" value={reg.username}
                  onChange={e => setReg(p => ({ ...p, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() }))} />
                <Field label="Телефон" placeholder="+79991234567" value={reg.phone}
                  onChange={e => setReg(p => ({ ...p, phone: e.target.value }))} />
                <Field label="Пароль" type="password" placeholder="Минимум 6 символов" value={reg.password}
                  onChange={e => setReg(p => ({ ...p, password: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && doRegister()} />
              </>
            )}
            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
            <button onClick={tab === "login" ? doLogin : doRegister} disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition active:scale-95 disabled:opacity-60 mt-1">
              {loading ? "Загрузка..." : tab === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
          <Icon name="Lock" size={11} /> End-to-end шифрование
        </p>
      </div>
    </div>
  );
}

// ─── New Chat Modal ───────────────────────────────────────────────────────────
function NewChatModal({ onClose, onCreated, notify }: {
  onClose: () => void; onCreated: (id: number) => void;
  notify: (m: string, t?: "info" | "error") => void;
}) {
  const [tab, setTab] = useState<"private" | "group" | "channel">("private");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const create = async () => {
    setLoading(true);
    try {
      const res = await api.chats.create(
        tab === "private"
          ? { type: "private", peer_username: username.replace("@", "") }
          : { type: tab, name, description: desc }
      );
      onCreated(res.chat_id);
      onClose();
    } catch (e: unknown) {
      notify(e instanceof Error ? e.message : "Ошибка", "error");
    } finally { setLoading(false); }
  };

  const TABS: { id: "private" | "group" | "channel"; icon: string; label: string }[] = [
    { id: "private", icon: "MessageCircle", label: "Чат" },
    { id: "group", icon: "Users", label: "Группа" },
    { id: "channel", icon: "Radio", label: "Канал" },
  ];

  return (
    <Modal title="Новый чат" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition ${tab === t.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground/50"}`}>
              <Icon name={t.icon} size={18} />
              {t.label}
            </button>
          ))}
        </div>
        {tab === "private" ? (
          <Field label="Username" placeholder="@username" value={username} onChange={e => setUsername(e.target.value)} />
        ) : (
          <>
            <Field label={tab === "group" ? "Название группы" : "Название канала"} placeholder="Введите название..." value={name} onChange={e => setName(e.target.value)} />
            <Field label="Описание (необязательно)" placeholder="О чём..." value={desc} onChange={e => setDesc(e.target.value)} />
          </>
        )}
        <button onClick={create} disabled={loading}
          className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60">
          {loading ? "Создание..." : "Создать"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Find People Modal ────────────────────────────────────────────────────────
function FindPeopleModal({ onClose, onStartChat }: {
  onClose: () => void; onStartChat: (username: string) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: number; username: string; display_name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.auth.search(q.replace("@", ""));
        setResults(res.users);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <Modal title="Найти людей" onClose={onClose}>
      <div className="space-y-3">
        <Field placeholder="Username или имя..." value={q} onChange={e => setQ(e.target.value)} />
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {loading && <p className="text-center text-xs text-muted-foreground py-4">Поиск...</p>}
          {!loading && q.length >= 2 && results.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">Никого не найдено</p>
          )}
          {results.map(u => (
            <button key={u.id} onClick={() => { onStartChat(u.username); onClose(); }}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition text-left">
              <Ava name={u.display_name} size={38} />
              <div>
                <p className="text-sm font-medium">{u.display_name}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
function AdminPanel({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const notify = (m: string) => { setToastMsg(m); setTimeout(() => setToastMsg(null), 2500); };

  useEffect(() => {
    api.auth.adminUsers().then(r => setUsers(r.users)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const freeze = async (id: number, frozen: boolean) => {
    await api.auth.adminFreeze(id, frozen);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, frozen } : u));
    notify(frozen ? "Заморожен" : "Разморожен");
  };

  return (
    <main className="flex-1 flex flex-col min-w-0">
      {toastMsg && <Toast msg={toastMsg} />}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 glass sticky top-0 z-10">
        <button onClick={onBack} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition">
          <Icon name="ChevronLeft" size={18} />
        </button>
        <Icon name="Shield" size={16} className="text-primary" />
        <h2 className="font-semibold">Панель администратора</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Всего", val: users.length, icon: "Users", c: "text-blue-500" },
            { label: "Активных", val: users.filter(u => !u.frozen).length, icon: "UserCheck", c: "text-green-500" },
            { label: "Заморожено", val: users.filter(u => u.frozen).length, icon: "Snowflake", c: "text-cyan-500" },
            { label: "Админов", val: users.filter(u => u.is_admin).length, icon: "ShieldCheck", c: "text-primary" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <Icon name={s.icon} size={18} className={`${s.c} mx-auto mb-1`} />
              <p className="text-xl font-bold">{s.val}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border">
            <h3 className="text-sm font-semibold">Пользователи</h3>
          </div>
          {loading ? (
            <p className="text-center text-muted-foreground text-sm py-8">Загрузка...</p>
          ) : (
            <div className="divide-y divide-border">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Ava name={u.display_name} size={38} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{u.display_name}</span>
                      {u.is_admin && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-medium">Админ</span>}
                      {u.frozen && <span className="text-[10px] bg-cyan-500/15 text-cyan-600 px-1.5 py-0.5 rounded font-medium">Заморожен</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">@{u.username} · {u.phone}</p>
                  </div>
                  <button onClick={() => freeze(u.id, !u.frozen)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex-shrink-0 ${u.frozen ? "bg-green-500/15 text-green-600" : "bg-cyan-500/15 text-cyan-600"}`}>
                    {u.frozen ? "Разморозить" : "Заморозить"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {[
            { icon: "Activity", label: "Сервер", value: "Работает" },
            { icon: "HardDrive", label: "БД", value: "PostgreSQL" },
            { icon: "Lock", label: "Шифрование", value: "E2E включено" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-2.5">
              <Icon name={item.icon} size={14} className="text-muted-foreground" />
              <span className="flex-1 text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-medium text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ user, onBack, onLogout, theme, setTheme }: {
  user: User; onBack: () => void; onLogout: () => void;
  theme: "dark" | "light"; setTheme: (t: "dark" | "light") => void;
}) {
  return (
    <main className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 glass sticky top-0 z-10">
        <button onClick={onBack} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition">
          <Icon name="ChevronLeft" size={18} />
        </button>
        <h2 className="font-semibold">Настройки</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full space-y-3">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <Ava name={user.display_name} size={60} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user.display_name}</p>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <p className="text-xs text-muted-foreground mt-0.5">ID: {user.id}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {[
            { label: "Имя", val: user.display_name },
            { label: "Username", val: `@${user.username}` },
            { label: "Телефон", val: user.phone },
            { label: "ID", val: String(user.id) },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-muted-foreground">{r.label}</span>
              <span className="text-sm font-medium">{r.val}</span>
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium">Оформление</p>
          <div className="flex gap-2">
            {([
              { id: "light", icon: "Sun", label: "Светлая" },
              { id: "dark", icon: "Moon", label: "Тёмная" },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTheme(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm transition ${theme === t.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                <Icon name={t.icon} size={15} />{t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onLogout}
          className="w-full bg-destructive/10 border border-destructive/20 text-destructive rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/15 transition">
          <Icon name="LogOut" size={15} /> Выйти из аккаунта
        </button>
      </div>
    </main>
  );
}

// ─── Chat View ────────────────────────────────────────────────────────────────
function ChatView({ chat, user, onBack }: { chat: ChatItem; user: User; onBack: () => void }) {
  const [msgs, setMsgs] = useState<MsgItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const STICKERS = ["🥑","🌿","✨","🎉","❤️","😂","🔥","💯","🌸","🎵","👾","🦋","🍃","💚","🌙","⭐"];

  const fetchMsgs = useCallback(async () => {
    try {
      const res = await api.chats.messages(chat.id);
      setMsgs(res.messages);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [chat.id]);

  useEffect(() => { fetchMsgs(); }, [fetchMsgs]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => {
    const t = setInterval(fetchMsgs, 3000);
    return () => clearInterval(t);
  }, [fetchMsgs]);

  const send = async (content: string, type = "text") => {
    if (!content.trim() && type === "text") return;
    setSending(true);
    const optimistic: MsgItem = {
      id: Date.now(), chat_id: chat.id, user_id: user.id, type,
      content, encrypted: true, created_at: nowStr(),
      display_name: user.display_name, username: user.username,
    };
    setMsgs(p => [...p, optimistic]);
    setInput(""); setShowStickers(false);
    if (textRef.current) textRef.current.style.height = "auto";
    try { await api.chats.send(chat.id, content, type); }
    catch { /* optimistic shown */ }
    finally { setSending(false); }
  };

  const chatName = chat.type === "private" ? (chat.peer_name || "Чат") : (chat.name || "Без названия");
  const chatSub = chat.type === "private"
    ? (chat.peer_username ? `@${chat.peer_username}` : "")
    : `${chat.member_count} участников`;

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/80 glass sticky top-0 z-10">
        <button onClick={onBack} className="md:hidden w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center">
          <Icon name="ChevronLeft" size={18} />
        </button>
        <Ava name={chatName} size={36} online={chat.type === "private"} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{chatName}</p>
          <p className="text-xs text-muted-foreground">{chatSub}</p>
        </div>
        <button className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition text-muted-foreground">
          <Icon name="MoreVertical" size={16} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 py-1 bg-primary/5 border-b border-primary/10">
        <Icon name="Lock" size={10} className="text-primary" />
        <span className="text-[11px] text-primary/70">End-to-end шифрование</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 chat-bg space-y-2"
        onClick={() => setShowStickers(false)}>
        {loading && <p className="text-center text-muted-foreground text-sm py-8">Загрузка...</p>}
        {!loading && msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40 py-12">
            <Icon name="MessageCircle" size={36} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Нет сообщений</p>
          </div>
        )}
        {msgs.map(msg => {
          const isMine = msg.user_id === user.id;
          return (
            <div key={msg.id} className={`flex items-end gap-1.5 animate-slide-up ${isMine ? "justify-end" : "justify-start"}`}>
              {!isMine && <Ava name={msg.display_name} size={26} />}
              <div className={`max-w-[72%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                {!isMine && chat.type !== "private" && (
                  <span className="text-[11px] text-primary font-medium mb-0.5 px-1">@{msg.username}</span>
                )}
                {msg.type === "sticker" ? (
                  <div className="text-4xl p-0.5 animate-bounce-in">{msg.content}</div>
                ) : (
                  <div className={`px-3.5 py-2 ${isMine ? "bubble-out" : "bubble-in"}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                )}
                <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? "justify-end" : "justify-start"}`}>
                  {msg.encrypted && <Icon name="Lock" size={9} className={isMine ? "text-white/40" : "text-muted-foreground/50"} />}
                  <span className={`text-[10px] ${isMine ? "text-white/50" : "text-muted-foreground"}`}>{fmtTime(msg.created_at)}</span>
                  {isMine && <Icon name="CheckCheck" size={10} className="text-white/50" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {showStickers && (
        <div className="border-t border-border bg-card p-3 animate-slide-up" onClick={e => e.stopPropagation()}>
          <div className="grid grid-cols-8 gap-1">
            {STICKERS.map(s => (
              <button key={s} onClick={() => send(s, "sticker")}
                className="text-2xl p-1.5 hover:bg-muted rounded-xl transition hover:scale-110 active:scale-90">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-3 py-2.5 bg-card border-t border-border">
        <div className="flex items-end gap-2">
          <button onClick={() => setShowStickers(p => !p)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition ${showStickers ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}>
            {showStickers ? "✕" : "😊"}
          </button>
          <div className="flex-1 bg-input border border-border rounded-2xl px-3 py-2">
            <textarea ref={textRef}
              className="w-full bg-transparent text-sm outline-none resize-none max-h-28 leading-relaxed placeholder:text-muted-foreground"
              placeholder="Сообщение..."
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 112) + "px";
              }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            />
          </div>
          <button onClick={() => send(input)} disabled={!input.trim() || sending}
            className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 transition hover:opacity-90 active:scale-90 disabled:opacity-40">
            <Icon name="Send" size={15} className="text-primary-foreground" />
          </button>
        </div>
      </div>
    </main>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <main className="flex-1 hidden md:flex flex-col items-center justify-center chat-bg gap-4">
      <div className="w-20 h-20 rounded-[24px] bg-[#3a3a3a] flex items-center justify-center shadow-lg">
        <span className="text-4xl">🥑</span>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold">Avocado</h2>
        <p className="text-muted-foreground text-sm mt-1">Выберите чат или создайте новый</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name="Lock" size={11} className="text-primary" />
        End-to-end шифрование
      </div>
    </main>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ user, chats, activeChatId, onSelect, onNewChat, onFindPeople, onSettings, onAdmin, loading, theme, setTheme }: {
  user: User; chats: ChatItem[]; activeChatId: number | null; loading: boolean;
  onSelect: (id: number) => void; onNewChat: () => void; onFindPeople: () => void;
  onSettings: () => void; onAdmin: () => void;
  theme: "dark" | "light"; setTheme: (t: "dark" | "light") => void;
}) {
  const [q, setQ] = useState("");
  const filtered = chats.filter(c => {
    const name = c.type === "private" ? (c.peer_name || "") : (c.name || "");
    return name.toLowerCase().includes(q.toLowerCase());
  });
  const getChatName = (c: ChatItem) => c.type === "private" ? (c.peer_name || "Личный чат") : (c.name || "Без названия");
  const getChatSub = (c: ChatItem) => {
    if (c.last_message) return c.last_message.length > 36 ? c.last_message.slice(0, 36) + "…" : c.last_message;
    return c.type === "private" ? "Нет сообщений" : `${c.member_count} участников`;
  };
  const typeIcon = (type: string) => type === "channel" ? "Radio" : type === "group" ? "Users" : null;

  return (
    <aside className="w-full md:w-72 flex-shrink-0 flex flex-col sidebar-bg border-r border-border h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <button onClick={onSettings} className="flex-shrink-0 hover:opacity-80 transition">
          <Ava name={user.display_name} size={36} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate leading-tight">{user.display_name}</p>
          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
        </div>
        <div className="flex gap-0.5">
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition text-muted-foreground">
            <Icon name={theme === "dark" ? "Sun" : "Moon"} size={15} />
          </button>
          {user.is_admin && (
            <button onClick={onAdmin}
              className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition text-muted-foreground hover:text-primary">
              <Icon name="Shield" size={15} />
            </button>
          )}
          <button onClick={onSettings}
            className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition text-muted-foreground">
            <Icon name="Settings" size={15} />
          </button>
        </div>
      </div>

      {/* Search + actions */}
      <div className="px-3 py-2 space-y-2">
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-1.5">
          <Icon name="Search" size={13} className="text-muted-foreground" />
          <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Поиск..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={onFindPeople}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-muted hover:bg-accent text-xs font-medium text-muted-foreground transition">
            <Icon name="UserSearch" size={13} />Найти людей
          </button>
          <button onClick={onNewChat}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold transition hover:opacity-90">
            <Icon name="Plus" size={13} />Новый чат
          </button>
        </div>
      </div>

      {/* Chats list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {loading && (
          <div className="space-y-1 p-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
                <div className="w-11 h-11 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  <div className="h-2.5 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 opacity-40">
            <Icon name="MessageCircle" size={28} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Нет чатов</p>
          </div>
        )}
        {filtered.map(c => (
          <button key={c.id} onClick={() => onSelect(c.id)}
            className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl transition text-left ${activeChatId === c.id ? "bg-primary/12" : "hover:bg-muted/70"}`}>
            <Ava name={getChatName(c)} size={44} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 min-w-0">
                  {typeIcon(c.type) && <Icon name={typeIcon(c.type)!} size={11} className="text-muted-foreground flex-shrink-0" />}
                  <span className="text-sm font-medium truncate">{getChatName(c)}</span>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{fmtTime(c.last_time)}</span>
              </div>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <span className="text-xs text-muted-foreground truncate">{getChatSub(c)}</span>
                {c.unread > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
                    {c.unread > 99 ? "99+" : c.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
type Panel = "chat" | "settings" | "admin";

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [panel, setPanel] = useState<Panel>("chat");
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    (localStorage.getItem("avo_theme") as "dark" | "light") || "dark"
  );
  const [showNewChat, setShowNewChat] = useState(false);
  const [showFindPeople, setShowFindPeople] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"info" | "error">("info");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);

  const notify = useCallback((msg: string, type: "info" | "error" = "info") => {
    setToastMsg(msg); setToastType(type);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("avo_theme", theme);
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem("avo_token");
    if (!token) { setAuthLoading(false); return; }
    api.auth.me().then(r => setUser(r.user)).catch(() => localStorage.removeItem("avo_token")).finally(() => setAuthLoading(false));
  }, []);

  const loadChats = useCallback(async () => {
    setChatsLoading(true);
    try {
      const res = await api.chats.list();
      setChats(res.chats);
    } catch { /* ignore */ }
    finally { setChatsLoading(false); }
  }, []);

  useEffect(() => { if (user) loadChats(); }, [user, loadChats]);
  useEffect(() => {
    if (!user) return;
    const t = setInterval(loadChats, 5000);
    return () => clearInterval(t);
  }, [user, loadChats]);

  const handleLogout = async () => {
    await api.auth.logout().catch(() => {});
    localStorage.removeItem("avo_token");
    setUser(null); setChats([]); setActiveChatId(null);
  };

  const handleChatSelect = (id: number) => {
    setActiveChatId(id); setPanel("chat"); setMobileSidebarOpen(false);
  };

  const handleNewChatCreated = (chatId: number) => {
    loadChats(); handleChatSelect(chatId); notify("Чат создан");
  };

  const handleStartChatWithUser = async (username: string) => {
    try {
      const res = await api.chats.create({ type: "private", peer_username: username });
      handleNewChatCreated(res.chat_id);
    } catch (e: unknown) {
      notify(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center chat-bg">
        <div className="w-14 h-14 rounded-2xl bg-[#3a3a3a] flex items-center justify-center animate-pulse">
          <span className="text-3xl">🥑</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSuccess={(u, t) => { localStorage.setItem("avo_token", t); setUser(u); }} />;
  }

  const activeChat = chats.find(c => c.id === activeChatId);
  const showSidebar = mobileSidebarOpen || !activeChatId;

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {toastMsg && <Toast msg={toastMsg} type={toastType} />}
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onCreated={handleNewChatCreated} notify={notify} />}
      {showFindPeople && <FindPeopleModal onClose={() => setShowFindPeople(false)} onStartChat={handleStartChatWithUser} />}

      <div className={`${showSidebar ? "flex" : "hidden"} md:flex flex-col w-full md:w-72 flex-shrink-0 h-full`}>
        <Sidebar
          user={user} chats={chats} activeChatId={activeChatId}
          loading={chatsLoading && chats.length === 0}
          onSelect={handleChatSelect}
          onNewChat={() => setShowNewChat(true)}
          onFindPeople={() => setShowFindPeople(true)}
          onSettings={() => { setPanel("settings"); setMobileSidebarOpen(false); }}
          onAdmin={() => { setPanel("admin"); setMobileSidebarOpen(false); }}
          theme={theme} setTheme={setTheme}
        />
      </div>

      <div className={`${showSidebar ? "hidden md:flex" : "flex"} flex-1 flex-col min-w-0 h-full`}>
        {panel === "settings" ? (
          <SettingsPanel user={user} onBack={() => { setPanel("chat"); setMobileSidebarOpen(true); }}
            onLogout={handleLogout} theme={theme} setTheme={setTheme} />
        ) : panel === "admin" && user.is_admin ? (
          <AdminPanel onBack={() => { setPanel("chat"); setMobileSidebarOpen(true); }} />
        ) : activeChatId && activeChat ? (
          <ChatView chat={activeChat} user={user} onBack={() => { setActiveChatId(null); setMobileSidebarOpen(true); }} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
