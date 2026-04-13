// ─── Types ───────────────────────────────────────────────────────────────────
export type Theme = "dark" | "light";
export type View = "chat" | "settings" | "admin" | "login" | "register" | "2fa";
export type MessageType = "text" | "image" | "voice" | "video" | "sticker";

export interface Message {
  id: string;
  from: string;
  text?: string;
  type: MessageType;
  time: string;
  encrypted?: boolean;
  reactions?: Record<string, string[]>;
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  verified?: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  avatar: string;
  frozen: boolean;
  joined: string;
  twoFa: boolean;
}

export interface CurrentUser {
  name: string;
  avatar: string;
  twoFa: boolean;
  isAdmin: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
export const STICKERS = ["🥑","🌿","✨","🎉","❤️","😂","🔥","💯","🌸","🎵","👾","🦋","🍃","💚","🌙","⭐","🎯","🍀","🌊","🦋"];

export const INITIAL_CHATS: Chat[] = [
  { id:"1", name:"Алиса Смирнова", avatar:"АС", lastMsg:"Привет! Как дела? 🌿", time:"14:32", unread:3, online:true, verified:true },
  { id:"2", name:"Дмитрий Козлов", avatar:"ДК", lastMsg:"Встреча завтра в 10:00", time:"13:15", unread:0, online:false },
  { id:"3", name:"Команда Avocado", avatar:"🥑", lastMsg:"Обновление 2.0 вышло!", time:"12:00", unread:5, online:true },
  { id:"4", name:"Маша Иванова", avatar:"МИ", lastMsg:"Окей, договорились 👍", time:"Вчера", unread:0, online:true },
  { id:"5", name:"Антон Белов", avatar:"АБ", lastMsg:"🎙 Голосовое сообщение", time:"Вчера", unread:1, online:false },
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  "1": [
    { id:"m1", from:"them", text:"Привет! Давно не общались 😊", type:"text", time:"14:20", encrypted:true },
    { id:"m2", from:"me", text:"О, привет! Был занят работой", type:"text", time:"14:21", encrypted:true },
    { id:"m3", from:"them", text:"🌿", type:"sticker", time:"14:22" },
    { id:"m4", from:"me", text:"Как дела?", type:"text", time:"14:30", encrypted:true },
    { id:"m5", from:"them", text:"Привет! Как дела? 🌿", type:"text", time:"14:32", encrypted:true, reactions:{"❤️":["me"]} },
  ],
  "2": [
    { id:"m1", from:"them", text:"Встреча завтра в 10:00, не забудь", type:"text", time:"13:15", encrypted:true },
    { id:"m2", from:"me", text:"Помню, буду 👍", type:"text", time:"13:16", encrypted:true },
  ],
  "3": [
    { id:"m1", from:"them", text:"🥑 Добро пожаловать в Avocado!", type:"text", time:"09:00" },
    { id:"m2", from:"them", text:"Версия 2.0 — шифрование, стикеры, темы!", type:"text", time:"09:01" },
    { id:"m3", from:"them", text:"Обновление 2.0 вышло!", type:"text", time:"12:00" },
  ],
};

export const MOCK_USERS: AdminUser[] = [
  { id:"u1", name:"Алиса Смирнова", avatar:"АС", frozen:false, joined:"01.01.2024", twoFa:true },
  { id:"u2", name:"Дмитрий Козлов", avatar:"ДК", frozen:false, joined:"15.03.2024", twoFa:false },
  { id:"u3", name:"Маша Иванова", avatar:"МИ", frozen:true, joined:"20.05.2024", twoFa:true },
  { id:"u4", name:"Антон Белов", avatar:"АБ", frozen:false, joined:"10.07.2024", twoFa:false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const uid = () => Math.random().toString(36).slice(2);
export const nowTime = () => new Date().toLocaleTimeString("ru", { hour:"2-digit", minute:"2-digit" });

// ─── Shared UI: AvatarCircle ──────────────────────────────────────────────────
export function AvatarCircle({ text, size = 40, online }: { text:string; size?:number; online?:boolean }) {
  const colors = ["#2d8c4e","#1a7a3a","#3da05a","#45b565","#27924a","#16813a"];
  const color = colors[(text.codePointAt(0) ?? 0) % colors.length];
  return (
    <div className="relative flex-shrink-0" style={{ width:size, height:size }}>
      <div className="flex items-center justify-center rounded-full text-white font-bold select-none"
        style={{ width:size, height:size, background:color, fontSize:size*0.38 }}>
        {text}
      </div>
      {online !== undefined && (
        <div className="absolute bottom-0 right-0 rounded-full border-2 border-background"
          style={{ width:size*0.28, height:size*0.28, background: online ? "#4ade80" : "#6b7280" }} />
      )}
    </div>
  );
}

// ─── Shared UI: Toast ─────────────────────────────────────────────────────────
export function Toast({ msg }: { msg:string }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium shadow-xl animate-bounce-in pointer-events-none">
      {msg}
    </div>
  );
}
