import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import {
  AvatarCircle,
  type Chat, type Message, type AdminUser, type CurrentUser,
  type MessageType, type Theme, type View,
  STICKERS,
} from "./types";

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator({ avatar }: { avatar: string }) {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <AvatarCircle text={avatar} size={28} />
      <div className="bubble-in px-4 py-3 flex gap-1 items-center">
        <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground inline-block" />
        <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground inline-block" />
        <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground inline-block" />
      </div>
    </div>
  );
}

// ─── Voice Message ────────────────────────────────────────────────────────────
function VoiceMessage({ isMine }: { isMine: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setProgress(p => {
      if (p >= 100) { setPlaying(false); return 0; }
      return p + 2;
    }), 80);
    return () => clearInterval(t);
  }, [playing]);
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[180px] ${isMine ? "bubble-out" : "bubble-in"}`}>
      <button onClick={() => setPlaying(p => !p)}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition ${isMine ? "bg-white/20 hover:bg-white/30" : "bg-primary/15 hover:bg-primary/25"}`}>
        <Icon name={playing ? "Pause" : "Play"} size={14} className={isMine ? "text-white" : "text-primary"} />
      </button>
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="h-1.5 rounded-full bg-current opacity-20 overflow-hidden">
          <div className="h-full rounded-full bg-current opacity-80 transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
        <span className={`text-[11px] ${isMine ? "text-white/60" : "text-muted-foreground"}`}>
          {playing ? `0:${String(Math.floor(progress * 0.24)).padStart(2, "0")}` : "0:24"}
        </span>
      </div>
      <Icon name="Mic" size={13} className={isMine ? "text-white/60" : "text-muted-foreground"} />
    </div>
  );
}

// ─── Chat View ────────────────────────────────────────────────────────────────
interface ChatViewProps {
  activeChat: Chat;
  chatMessages: Message[];
  input: string;
  showStickers: boolean;
  showAttach: boolean;
  showEmojiReact: string | null;
  isRecording: boolean;
  recordTime: number;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  setInput: (v: string) => void;
  setShowStickers: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowAttach: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowEmojiReact: (v: string | null) => void;
  setIsRecording: (v: boolean) => void;
  sendMessage: (type?: MessageType, text?: string) => void;
  sendVoice: () => void;
  handleFileUpload: (type: "image" | "video") => void;
  addReaction: (msgId: string, emoji: string) => void;
  notify: (msg: string) => void;
  setActiveChatId: (id: string | null) => void;
  setMobileSidebar: (v: boolean) => void;
}

function ChatView({
  activeChat, chatMessages, input, showStickers, showAttach, showEmojiReact,
  isRecording, recordTime, messagesEndRef, textareaRef,
  setInput, setShowStickers, setShowAttach, setShowEmojiReact, setIsRecording,
  sendMessage, sendVoice, handleFileUpload, addReaction, notify,
  setActiveChatId, setMobileSidebar,
}: ChatViewProps) {
  return (
    <main className="flex-1 flex flex-col min-w-0" onClick={() => { setShowEmojiReact(null); }}>
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/60 glass">
        <button
          onClick={() => { setActiveChatId(null); setMobileSidebar(true); }}
          className="md:hidden w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center">
          <Icon name="ChevronLeft" size={18} />
        </button>
        <AvatarCircle text={activeChat.avatar} size={38} online={activeChat.online} />
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">{activeChat.name}</span>
            {activeChat.verified && <Icon name="BadgeCheck" size={13} className="text-primary" />}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {activeChat.online
              ? <><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />онлайн</>
              : "был(а) недавно"}
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => notify("Голосовой звонок... 📞")}
            className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition text-muted-foreground hover:text-primary">
            <Icon name="Phone" size={17} />
          </button>
          <button onClick={() => notify("Видеозвонок... 📹")}
            className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition text-muted-foreground hover:text-primary">
            <Icon name="Video" size={17} />
          </button>
          <button className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition text-muted-foreground hover:text-foreground">
            <Icon name="MoreVertical" size={17} />
          </button>
        </div>
      </div>

      {/* E2E Banner */}
      <div className="flex items-center justify-center gap-1.5 py-1.5 bg-primary/5 border-b border-primary/10">
        <Icon name="Lock" size={11} className="text-primary" />
        <span className="text-xs text-primary/70 font-medium">End-to-end шифрование</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 avo-chat-bg space-y-3"
        onClick={() => { setShowStickers(false); setShowAttach(false); }}>
        {chatMessages.map(msg => {
          const isMine = msg.from === "me";
          return (
            <div key={msg.id} className={`flex items-end gap-2 animate-slide-up ${isMine ? "justify-end" : "justify-start"}`}>
              {!isMine && <AvatarCircle text={activeChat.avatar} size={28} />}
              <div className="max-w-[72%] group relative">
                {msg.type === "sticker" ? (
                  <div className="text-5xl select-none p-1 animate-bounce-in">{msg.text}</div>
                ) : msg.type === "voice" ? (
                  <VoiceMessage isMine={isMine} />
                ) : msg.type === "image" ? (
                  <div className={`${isMine ? "bubble-out" : "bubble-in"} p-3`}>
                    <div className="w-44 h-32 bg-muted/30 rounded-xl flex items-center justify-center">
                      <Icon name="Image" size={30} className={isMine ? "text-white/60" : "text-muted-foreground"} />
                    </div>
                    <p className="text-xs mt-1 opacity-70">{msg.text}</p>
                  </div>
                ) : msg.type === "video" ? (
                  <div className={`${isMine ? "bubble-out" : "bubble-in"} p-3`}>
                    <div className="w-44 h-32 bg-muted/30 rounded-xl flex items-center justify-center relative">
                      <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
                        <Icon name="Play" size={20} className="text-foreground" />
                      </div>
                    </div>
                    <p className="text-xs mt-1 opacity-70">{msg.text}</p>
                  </div>
                ) : (
                  <div className={`px-4 py-2.5 ${isMine ? "bubble-out" : "bubble-in"}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                )}

                {/* Meta */}
                <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                  {msg.encrypted && <Icon name="Lock" size={9} className={isMine ? "text-white/40" : "text-muted-foreground/50"} />}
                  <span className={`text-[10px] ${isMine ? "text-white/50" : "text-muted-foreground"}`}>{msg.time}</span>
                  {isMine && <Icon name="CheckCheck" size={11} className="text-white/50" />}
                </div>

                {/* Reactions */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className={`flex gap-1 mt-1 flex-wrap ${isMine ? "justify-end" : "justify-start"}`}>
                    {Object.entries(msg.reactions).map(([emoji, users]) => (
                      <span key={emoji} className="bg-card border border-border rounded-full px-2 py-0.5 text-xs flex items-center gap-1 shadow-sm">
                        {emoji} <span className="text-muted-foreground text-[10px]">{users.length}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Reaction picker trigger */}
                <button
                  onClick={e => { e.stopPropagation(); setShowEmojiReact(showEmojiReact === msg.id ? null : msg.id); }}
                  className={`absolute ${isMine ? "-left-9" : "-right-9"} top-1 opacity-0 group-hover:opacity-100 transition w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-sm shadow-sm hover:scale-110`}>
                  😊
                </button>
                {showEmojiReact === msg.id && (
                  <div
                    className={`absolute ${isMine ? "right-0" : "left-0"} -top-12 z-30 bg-card border border-border rounded-2xl px-2 py-1.5 flex gap-1 shadow-xl animate-scale-in`}
                    onClick={e => e.stopPropagation()}>
                    {["❤️", "😂", "🔥", "👍", "😮", "😢"].map(e => (
                      <button key={e} onClick={() => addReaction(msg.id, e)} className="text-xl hover:scale-125 transition">{e}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <TypingIndicator avatar={activeChat.avatar} />
        <div ref={messagesEndRef} />
      </div>

      {/* Sticker Picker */}
      {showStickers && (
        <div className="border-t border-border bg-card p-3 animate-slide-up" onClick={e => e.stopPropagation()}>
          <p className="text-xs text-muted-foreground mb-2 font-medium px-1">Стикеры Avocado 🥑</p>
          <div className="grid grid-cols-10 gap-1">
            {STICKERS.map(s => (
              <button key={s} onClick={() => sendMessage("sticker", s)}
                className="text-2xl p-1.5 hover:bg-muted rounded-xl transition hover:scale-110 active:scale-90">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attach Panel */}
      {showAttach && (
        <div className="border-t border-border bg-card p-4 animate-slide-up" onClick={e => e.stopPropagation()}>
          <div className="flex gap-4 justify-center flex-wrap">
            {[
              { icon: "Image", label: "Фото", action: () => handleFileUpload("image"), color: "bg-blue-500/15 text-blue-500" },
              { icon: "Video", label: "Видео", action: () => handleFileUpload("video"), color: "bg-purple-500/15 text-purple-500" },
              { icon: "FileText", label: "Файл", action: () => { notify("Файл прикреплён 📄"); setShowAttach(false); }, color: "bg-orange-500/15 text-orange-500" },
              { icon: "MapPin", label: "Геолокация", action: () => { notify("Локация отправлена 📍"); setShowAttach(false); }, color: "bg-red-500/15 text-red-500" },
              { icon: "Music", label: "Аудио", action: () => { notify("Аудио прикреплено 🎵"); setShowAttach(false); }, color: "bg-green-500/15 text-green-500" },
              { icon: "Contact", label: "Контакт", action: () => { notify("Контакт отправлен 👤"); setShowAttach(false); }, color: "bg-pink-500/15 text-pink-500" },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted transition">
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center`}>
                  <Icon name={item.icon} size={22} />
                </div>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="px-3 py-3 bg-card/80 glass border-t border-border">
        <div className="flex items-end gap-2">
          <button
            onClick={() => { setShowAttach(p => !p); setShowStickers(false); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition flex-shrink-0 ${showAttach ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}>
            <Icon name="Paperclip" size={18} />
          </button>
          <button
            onClick={() => { setShowStickers(p => !p); setShowAttach(false); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition flex-shrink-0 text-lg ${showStickers ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            {showStickers ? "✕" : "😊"}
          </button>
          <div className="flex-1 bg-input border border-border rounded-2xl flex items-end px-3 py-2.5">
            <textarea
              ref={textareaRef}
              className="flex-1 bg-transparent text-sm outline-none resize-none max-h-24 placeholder:text-muted-foreground leading-relaxed"
              placeholder="Написать сообщение..."
              rows={1}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
              }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            />
          </div>
          {input.trim() ? (
            <button onClick={() => sendMessage()}
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center transition hover:opacity-90 active:scale-90 flex-shrink-0 shadow-md">
              <Icon name="Send" size={16} className="text-primary-foreground" />
            </button>
          ) : (
            <button
              onMouseDown={e => { e.preventDefault(); setIsRecording(true); }}
              onMouseUp={sendVoice}
              onTouchStart={() => setIsRecording(true)}
              onTouchEnd={sendVoice}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition flex-shrink-0 relative ${isRecording ? "bg-red-500 text-white" : "hover:bg-muted text-muted-foreground hover:text-primary"}`}>
              {isRecording && <span className="absolute inset-0 rounded-xl bg-red-400 animate-ping opacity-30" />}
              <Icon name="Mic" size={18} />
            </button>
          )}
        </div>
        {isRecording && (
          <div className="flex items-center gap-2 mt-2 px-2 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-500 font-medium">
              Запись {Math.floor(recordTime / 60)}:{String(recordTime % 60).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground">— отпустите для отправки</span>
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Settings View ────────────────────────────────────────────────────────────
interface SettingsViewProps {
  currentUser: CurrentUser;
  settingsTab: "profile" | "security" | "notifications" | "appearance";
  editName: string;
  theme: Theme;
  setSettingsTab: (t: "profile" | "security" | "notifications" | "appearance") => void;
  setEditName: (v: string) => void;
  setCurrentUser: (fn: (p: CurrentUser) => CurrentUser) => void;
  setTheme: (t: Theme) => void;
  setView: (v: View) => void;
  notify: (msg: string) => void;
}

function SettingsView({
  currentUser, settingsTab, editName, theme,
  setSettingsTab, setEditName, setCurrentUser, setTheme, setView, notify,
}: SettingsViewProps) {
  return (
    <main className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-card/50">
        <button onClick={() => setView("chat")} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition">
          <Icon name="ChevronLeft" size={18} />
        </button>
        <h2 className="font-bold text-lg">Настройки</h2>
      </div>

      <div className="flex border-b border-border bg-card/30">
        {([
          { id: "profile", icon: "User", label: "Профиль" },
          { id: "security", icon: "Shield", label: "Безопасность" },
          { id: "notifications", icon: "Bell", label: "Уведомления" },
          { id: "appearance", icon: "Palette", label: "Вид" },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setSettingsTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition ${settingsTab === tab.id ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon name={tab.icon} size={15} />
            <span className="hidden sm:block">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full">
        {settingsTab === "profile" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="relative">
                <AvatarCircle text={currentUser.avatar} size={84} online />
                <button onClick={() => notify("Нажмите для смены фото 📸")}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background hover:opacity-90 transition">
                  <Icon name="Camera" size={13} className="text-primary-foreground" />
                </button>
              </div>
              <p className="font-bold text-xl">{currentUser.name}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border divide-y divide-border">
              <div className="p-4">
                <label className="text-xs text-muted-foreground font-medium">Имя</label>
                <input className="w-full bg-transparent text-sm font-medium outline-none mt-1 focus:text-primary transition"
                  value={editName || currentUser.name} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="p-4">
                <label className="text-xs text-muted-foreground font-medium">Имя в приложении</label>
                <input className="w-full bg-transparent text-sm outline-none mt-1 text-muted-foreground" placeholder="@username" />
              </div>
              <div className="p-4">
                <label className="text-xs text-muted-foreground font-medium">О себе</label>
                <input className="w-full bg-transparent text-sm outline-none mt-1 text-muted-foreground" placeholder="Расскажите о себе..." />
              </div>
            </div>
            {editName && editName !== currentUser.name && (
              <button onClick={() => {
                setCurrentUser(p => ({ ...p, name: editName, avatar: editName.slice(0, 2).toUpperCase() }));
                setEditName(""); notify("Имя обновлено ✅");
              }} className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold hover:opacity-90 transition">
                Сохранить
              </button>
            )}
            <button onClick={() => { setView("login"); notify("До встречи! 👋"); }}
              className="w-full bg-destructive/10 border border-destructive/20 text-destructive rounded-xl py-3 text-sm font-medium hover:bg-destructive/15 transition flex items-center justify-center gap-2">
              <Icon name="LogOut" size={15} />
              Выйти из аккаунта
            </button>
          </div>
        )}

        {settingsTab === "security" && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-card rounded-2xl border border-border divide-y divide-border">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
                    <Icon name="Smartphone" size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Двухфакторная аутентификация</p>
                    <p className="text-xs text-muted-foreground">Дополнительная защита</p>
                  </div>
                </div>
                <button
                  onClick={() => { setCurrentUser(p => ({ ...p, twoFa: !p.twoFa })); notify(!currentUser.twoFa ? "2FA включена 🔐" : "2FA отключена"); }}
                  className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${currentUser.twoFa ? "bg-primary" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${currentUser.twoFa ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
              {[
                { icon: "Lock", title: "E2E шифрование", desc: "Сквозное шифрование всех чатов", active: true },
                { icon: "Eye", title: "Скрыть статус", desc: "Другие не видят «онлайн»", active: false },
                { icon: "EyeOff", title: "Скрыть прочтение", desc: "Не показывать галочки прочтения", active: false },
              ].map(item => (
                <div key={item.title} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                      <Icon name={item.icon} size={17} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => notify(`${item.title} обновлено`)}
                    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${item.active ? "bg-primary" : "bg-muted"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${item.active ? "left-6" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => notify("Пароль изменён 🔑")}
              className="w-full bg-card border border-border rounded-xl py-3 text-sm font-medium hover:bg-muted transition flex items-center justify-center gap-2">
              <Icon name="Key" size={15} />
              Изменить пароль
            </button>
            <button onClick={() => notify("Все сеансы завершены")}
              className="w-full bg-destructive/10 border border-destructive/20 text-destructive rounded-xl py-3 text-sm font-medium hover:bg-destructive/15 transition flex items-center justify-center gap-2">
              <Icon name="LogOut" size={15} />
              Завершить все сеансы
            </button>
          </div>
        )}

        {settingsTab === "notifications" && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-card rounded-2xl border border-border divide-y divide-border">
              {[
                { icon: "MessageSquare", title: "Сообщения", desc: "Уведомления о новых сообщениях", active: true },
                { icon: "Users", title: "Группы", desc: "Упоминания и сообщения в группах", active: true },
                { icon: "Phone", title: "Звонки", desc: "Входящие звонки", active: true },
                { icon: "Volume2", title: "Звук", desc: "Звуковые уведомления", active: true },
                { icon: "Vibrate", title: "Вибрация", desc: "Вибрация при уведомлениях", active: false },
                { icon: "BellOff", title: "Режим тишины", desc: "Отключить все уведомления", active: false },
              ].map(item => (
                <div key={item.title} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                      <Icon name={item.icon} size={17} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => notify(`${item.title} обновлено`)}
                    className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${item.active ? "bg-primary" : "bg-muted"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${item.active ? "left-6" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {settingsTab === "appearance" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <p className="text-sm font-semibold">Тема оформления</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: "dark", label: "Тёмная", icon: "Moon" },
                  { id: "light", label: "Светлая", icon: "Sun" },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setTheme(t.id)}
                    className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all ${theme === t.id ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/50"}`}>
                    <div className={`w-full h-14 rounded-lg flex items-end p-2 gap-1 ${t.id === "dark" ? "bg-gray-900" : "bg-gray-100"}`}>
                      <div className="w-6 h-2 rounded bg-green-500 opacity-90" />
                      <div className={`w-12 h-2 rounded ${t.id === "dark" ? "bg-gray-600" : "bg-gray-300"}`} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Icon name={t.icon} size={13} className={theme === t.id ? "text-primary" : "text-muted-foreground"} />
                      <span className={`text-sm font-medium ${theme === t.id ? "text-primary" : ""}`}>{t.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <p className="text-sm font-semibold">Размер текста</p>
              <div className="flex gap-2">
                {["Мелкий", "Средний", "Крупный"].map((s, i) => (
                  <button key={s} onClick={() => notify(`Размер: ${s}`)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition ${i === 1 ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-muted-foreground/50"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <p className="text-sm font-semibold">Фон чата</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  "bg-gradient-to-br from-green-900 to-emerald-800",
                  "bg-gradient-to-br from-gray-900 to-gray-800",
                  "bg-gradient-to-br from-blue-900 to-indigo-900",
                  "bg-gradient-to-br from-purple-900 to-violet-900",
                ].map((bg, i) => (
                  <button key={i} onClick={() => notify("Фон изменён 🎨")}
                    className={`h-14 rounded-xl ${bg} border-2 border-transparent hover:border-primary transition`} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Admin View ───────────────────────────────────────────────────────────────
interface AdminViewProps {
  adminUsers: AdminUser[];
  setAdminUsers: (fn: (prev: AdminUser[]) => AdminUser[]) => void;
  notify: (msg: string) => void;
  setView: (v: View) => void;
}

function AdminView({ adminUsers, setAdminUsers, notify, setView }: AdminViewProps) {
  const toggleFreeze = (id: string) => {
    const user = adminUsers.find(u => u.id === id);
    setAdminUsers(prev => prev.map(u => u.id === id ? { ...u, frozen: !u.frozen } : u));
    notify(user?.frozen ? `${user.name} разморожен ✅` : `${user?.name} заморожен 🔒`);
  };

  return (
    <main className="flex-1 flex flex-col min-w-0">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-card/50">
        <button onClick={() => setView("chat")} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition">
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div className="w-8 h-8 bg-primary/15 rounded-xl flex items-center justify-center">
          <Icon name="Shield" size={16} className="text-primary" />
        </div>
        <h2 className="font-bold text-lg">Панель администратора</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Всего", value: adminUsers.length, icon: "Users", color: "text-blue-500 bg-blue-500/10" },
            { label: "Активных", value: adminUsers.filter(u => !u.frozen).length, icon: "UserCheck", color: "text-green-500 bg-green-500/10" },
            { label: "Заморожено", value: adminUsers.filter(u => u.frozen).length, icon: "Snowflake", color: "text-cyan-500 bg-cyan-500/10" },
            { label: "С 2FA", value: adminUsers.filter(u => u.twoFa).length, icon: "ShieldCheck", color: "text-primary bg-primary/10" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
              <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}>
                <Icon name={s.icon} size={16} />
              </div>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Users */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Пользователи</h3>
            <button onClick={() => notify("Пользователь добавлен")}
              className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center hover:bg-primary/20 transition">
              <Icon name="Plus" size={14} />
            </button>
          </div>
          <div className="divide-y divide-border">
            {adminUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                <div className="relative">
                  <AvatarCircle text={user.avatar} size={40} />
                  {user.frozen && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-background">
                      <Icon name="Lock" size={9} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{user.name}</span>
                    {user.twoFa && <Icon name="ShieldCheck" size={11} className="text-primary" />}
                    {user.frozen && (
                      <span className="text-[10px] bg-cyan-500/15 text-cyan-600 px-1.5 py-0.5 rounded-md font-medium">Заморожен</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Зарегистрирован {user.joined}</span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => toggleFreeze(user.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${user.frozen ? "bg-green-500/15 text-green-600 hover:bg-green-500/25" : "bg-cyan-500/15 text-cyan-600 hover:bg-cyan-500/25"}`}>
                    {user.frozen ? "Разморозить" : "Заморозить"}
                  </button>
                  <button
                    onClick={() => { setAdminUsers(prev => prev.filter(u => u.id !== user.id)); notify(`${user.name} удалён`); }}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition">
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Info */}
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">Система</h3>
          </div>
          {[
            { icon: "MessageSquare", label: "Сообщений всего", value: "12,840" },
            { icon: "HardDrive", label: "Хранилище", value: "3.2 GB" },
            { icon: "Activity", label: "Нагрузка", value: "12%" },
            { icon: "Shield", label: "Угроз заблокировано", value: "0" },
            { icon: "Clock", label: "Аптайм", value: "99.9%" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-3">
              <Icon name={item.icon} size={15} className="text-muted-foreground" />
              <span className="flex-1 text-sm">{item.label}</span>
              <span className="text-sm font-semibold text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <main className="flex-1 hidden md:flex flex-col items-center justify-center avo-chat-bg gap-5">
      <div className="text-8xl animate-bounce-in">🥑</div>
      <div className="text-center">
        <h2 className="text-3xl font-black">Avocado</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-xs">
          Выберите чат слева, чтобы начать общение.<br />
          Все сообщения защищены E2E шифрованием.
        </p>
      </div>
      <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 text-xs text-muted-foreground shadow-sm">
        <Icon name="Lock" size={12} className="text-primary" />
        End-to-End шифрование активно
      </div>
    </main>
  );
}

// ─── ChatPanel (main export) ──────────────────────────────────────────────────
export interface ChatPanelProps {
  view: View;
  activeChat: Chat | undefined;
  chatMessages: Message[];
  currentUser: CurrentUser;
  adminUsers: AdminUser[];
  input: string;
  showStickers: boolean;
  showAttach: boolean;
  showEmojiReact: string | null;
  isRecording: boolean;
  recordTime: number;
  settingsTab: "profile" | "security" | "notifications" | "appearance";
  editName: string;
  theme: Theme;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  setInput: (v: string) => void;
  setShowStickers: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowAttach: (v: boolean | ((p: boolean) => boolean)) => void;
  setShowEmojiReact: (v: string | null) => void;
  setIsRecording: (v: boolean) => void;
  setSettingsTab: (t: "profile" | "security" | "notifications" | "appearance") => void;
  setEditName: (v: string) => void;
  setCurrentUser: (fn: (p: CurrentUser) => CurrentUser) => void;
  setTheme: (t: Theme) => void;
  setView: (v: View) => void;
  setActiveChatId: (id: string | null) => void;
  setMobileSidebar: (v: boolean) => void;
  setAdminUsers: (fn: (prev: AdminUser[]) => AdminUser[]) => void;
  sendMessage: (type?: MessageType, text?: string) => void;
  sendVoice: () => void;
  handleFileUpload: (type: "image" | "video") => void;
  addReaction: (msgId: string, emoji: string) => void;
  notify: (msg: string) => void;
}

export function ChatPanel(props: ChatPanelProps) {
  const {
    view, activeChat, chatMessages, currentUser, adminUsers,
    input, showStickers, showAttach, showEmojiReact, isRecording, recordTime,
    settingsTab, editName, theme, messagesEndRef, textareaRef,
    setInput, setShowStickers, setShowAttach, setShowEmojiReact, setIsRecording,
    setSettingsTab, setEditName, setCurrentUser, setTheme, setView,
    setActiveChatId, setMobileSidebar, setAdminUsers,
    sendMessage, sendVoice, handleFileUpload, addReaction, notify,
  } = props;

  if (view === "chat" && activeChat) {
    return (
      <ChatView
        activeChat={activeChat}
        chatMessages={chatMessages}
        input={input}
        showStickers={showStickers}
        showAttach={showAttach}
        showEmojiReact={showEmojiReact}
        isRecording={isRecording}
        recordTime={recordTime}
        messagesEndRef={messagesEndRef}
        textareaRef={textareaRef}
        setInput={setInput}
        setShowStickers={setShowStickers}
        setShowAttach={setShowAttach}
        setShowEmojiReact={setShowEmojiReact}
        setIsRecording={setIsRecording}
        sendMessage={sendMessage}
        sendVoice={sendVoice}
        handleFileUpload={handleFileUpload}
        addReaction={addReaction}
        notify={notify}
        setActiveChatId={setActiveChatId}
        setMobileSidebar={setMobileSidebar}
      />
    );
  }

  if (view === "settings") {
    return (
      <SettingsView
        currentUser={currentUser}
        settingsTab={settingsTab}
        editName={editName}
        theme={theme}
        setSettingsTab={setSettingsTab}
        setEditName={setEditName}
        setCurrentUser={setCurrentUser}
        setTheme={setTheme}
        setView={setView}
        notify={notify}
      />
    );
  }

  if (view === "admin") {
    return (
      <AdminView
        adminUsers={adminUsers}
        setAdminUsers={setAdminUsers}
        notify={notify}
        setView={setView}
      />
    );
  }

  return <EmptyState />;
}
