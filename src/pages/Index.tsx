import { useState, useRef, useEffect } from "react";
import {
  Toast,
  type Theme, type View, type MessageType, type Message, type Chat, type CurrentUser,
  INITIAL_CHATS, INITIAL_MESSAGES, MOCK_USERS,
  uid, nowTime,
} from "@/components/messenger/types";
import { AuthScreen, TwoFaScreen } from "@/components/messenger/AuthScreens";
import { Sidebar } from "@/components/messenger/Sidebar";
import { ChatPanel } from "@/components/messenger/ChatPanel";

export default function Index() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [view, setView] = useState<View>("login");
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ name: "Вы", avatar: "ВЫ", twoFa: false, isAdmin: false });
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminUsers, setAdminUsers] = useState(MOCK_USERS);
  const [loginForm, setLoginForm] = useState({ phone: "", pass: "" });
  const [regForm, setRegForm] = useState({ name: "", phone: "", pass: "" });
  const [twoFaCode, setTwoFaCode] = useState("");
  const [settingsTab, setSettingsTab] = useState<"profile" | "security" | "notifications" | "appearance">("profile");
  const [editName, setEditName] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [showEmojiReact, setShowEmojiReact] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChatId]);

  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if (isRecording) {
      t = setInterval(() => setRecordTime(p => p + 1), 1000);
    } else {
      setRecordTime(0);
    }
    return () => clearInterval(t);
  }, [isRecording]);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const sendMessage = (type: MessageType = "text", text?: string) => {
    if (!activeChatId) return;
    const content = text ?? input.trim();
    if (!content && type === "text") return;
    const msg: Message = { id: uid(), from: "me", text: content || undefined, type, time: nowTime(), encrypted: true };
    setMessages(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), msg] }));
    setChats(prev => prev.map(c => c.id === activeChatId
      ? { ...c, lastMsg: type === "sticker" ? content || "Стикер" : content || "📎 Вложение", time: nowTime(), unread: 0 }
      : c));
    setInput("");
    setShowStickers(false);
    setShowAttach(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleFileUpload = (type: "image" | "video") => {
    if (!activeChatId) return;
    const label = type === "image" ? "📷 Фото" : "🎥 Видео";
    const msg: Message = { id: uid(), from: "me", text: label, type, time: nowTime(), encrypted: true };
    setMessages(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), msg] }));
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, lastMsg: label, time: nowTime() } : c));
    setShowAttach(false);
    notify(type === "image" ? "Фото отправлено 📷" : "Видео отправлено 🎥");
  };

  const sendVoice = () => {
    if (!activeChatId || !isRecording) return;
    setIsRecording(false);
    const msg: Message = { id: uid(), from: "me", type: "voice", time: nowTime(), encrypted: true };
    setMessages(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), msg] }));
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, lastMsg: "🎙 Голосовое", time: nowTime() } : c));
    notify("Голосовое отправлено 🎙");
  };

  const addReaction = (msgId: string, emoji: string) => {
    if (!activeChatId) return;
    setMessages(prev => ({
      ...prev,
      [activeChatId]: prev[activeChatId].map(m => m.id !== msgId ? m : {
        ...m, reactions: { ...(m.reactions || {}), [emoji]: [...((m.reactions || {})[emoji] || []), "me"] }
      })
    }));
    setShowEmojiReact(null);
  };

  const handleLogin = () => {
    if (!loginForm.phone || !loginForm.pass) { notify("Заполните все поля"); return; }
    const isAdmin = loginForm.pass === "admin123";
    const name = isAdmin ? "Администратор" : "Пользователь";
    const avatar = isAdmin ? "АД" : loginForm.phone.slice(-2);
    setCurrentUser({ name, avatar, twoFa: false, isAdmin });
    setView("chat");
    notify("Добро пожаловать в Avocado! 🥑");
  };

  const handleRegister = () => {
    if (!regForm.name || !regForm.phone || !regForm.pass) { notify("Заполните все поля"); return; }
    setCurrentUser({ name: regForm.name, avatar: regForm.name.slice(0, 2).toUpperCase(), twoFa: false, isAdmin: false });
    setView("chat");
    notify(`Добро пожаловать, ${regForm.name}! 🥑`);
  };

  const handleTwoFa = () => {
    if (twoFaCode.length === 6) { setView("chat"); notify("Вход подтверждён 🔐"); }
    else notify("Введите 6 цифр");
  };

  const activeChat = chats.find(c => c.id === activeChatId);
  const chatMessages = activeChatId ? (messages[activeChatId] || []) : [];

  // ── Auth screens ──────────────────────────────────────────────────────────
  if (view === "login" || view === "register") {
    return (
      <AuthScreen
        view={view}
        setView={setView}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        regForm={regForm}
        setRegForm={setRegForm}
        onLogin={handleLogin}
        onRegister={handleRegister}
        notification={notification}
      />
    );
  }

  if (view === "2fa") {
    return (
      <TwoFaScreen
        twoFaCode={twoFaCode}
        setTwoFaCode={setTwoFaCode}
        onConfirm={handleTwoFa}
        onBack={() => setView("login")}
        notification={notification}
      />
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {notification && <Toast msg={notification} />}
      <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" />

      <Sidebar
        currentUser={currentUser}
        chats={chats}
        activeChatId={activeChatId}
        searchQuery={searchQuery}
        theme={theme}
        mobileSidebar={mobileSidebar}
        setActiveChatId={(id) => {
          setActiveChatId(id);
          setShowStickers(false);
          setShowAttach(false);
        }}
        setMobileSidebar={setMobileSidebar}
        setSearchQuery={setSearchQuery}
        setTheme={setTheme}
        setView={setView}
        setSettingsTab={setSettingsTab}
      />

      <ChatPanel
        view={view}
        activeChat={activeChat}
        chatMessages={chatMessages}
        currentUser={currentUser}
        adminUsers={adminUsers}
        input={input}
        showStickers={showStickers}
        showAttach={showAttach}
        showEmojiReact={showEmojiReact}
        isRecording={isRecording}
        recordTime={recordTime}
        settingsTab={settingsTab}
        editName={editName}
        theme={theme}
        messagesEndRef={messagesEndRef}
        textareaRef={textareaRef}
        setInput={setInput}
        setShowStickers={setShowStickers}
        setShowAttach={setShowAttach}
        setShowEmojiReact={setShowEmojiReact}
        setIsRecording={setIsRecording}
        setSettingsTab={setSettingsTab}
        setEditName={setEditName}
        setCurrentUser={setCurrentUser}
        setTheme={setTheme}
        setView={setView}
        setActiveChatId={setActiveChatId}
        setMobileSidebar={setMobileSidebar}
        setAdminUsers={setAdminUsers}
        sendMessage={sendMessage}
        sendVoice={sendVoice}
        handleFileUpload={handleFileUpload}
        addReaction={addReaction}
        notify={notify}
      />
    </div>
  );
}
