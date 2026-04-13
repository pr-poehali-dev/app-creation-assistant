import Icon from "@/components/ui/icon";
import { AvatarCircle, type Chat, type CurrentUser, type Theme, type View } from "./types";

interface SidebarProps {
  currentUser: CurrentUser;
  chats: Chat[];
  activeChatId: string | null;
  searchQuery: string;
  theme: Theme;
  mobileSidebar: boolean;
  setActiveChatId: (id: string) => void;
  setMobileSidebar: (v: boolean) => void;
  setSearchQuery: (v: string) => void;
  setTheme: (t: Theme) => void;
  setView: (v: View) => void;
  setSettingsTab: (t: "profile" | "security" | "notifications" | "appearance") => void;
}

export function Sidebar({
  currentUser, chats, activeChatId, searchQuery, theme, mobileSidebar,
  setActiveChatId, setMobileSidebar, setSearchQuery, setTheme, setView, setSettingsTab,
}: SidebarProps) {
  const filteredChats = chats.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className={`
      ${mobileSidebar || activeChatId === null ? "flex" : "hidden md:flex"}
      w-full md:w-80 flex-shrink-0 flex-col avo-sidebar border-r border-border
    `}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={() => { setView("settings"); setSettingsTab("profile"); }}
          className="hover-scale cursor-pointer">
          <AvatarCircle text={currentUser.avatar} size={42} online={true} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm truncate">{currentUser.name}</span>
            {currentUser.isAdmin && (
              <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-md font-medium flex-shrink-0">Админ</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Icon name="Lock" size={9} className="text-primary" />
            <span>E2E шифрование</span>
          </div>
        </div>
        <div className="flex gap-1">
          {currentUser.isAdmin && (
            <button
              onClick={() => setView("admin")}
              className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition text-muted-foreground hover:text-primary">
              <Icon name="Shield" size={16} />
            </button>
          )}
          <button
            onClick={() => setView("settings")}
            className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition text-muted-foreground hover:text-foreground">
            <Icon name="Settings" size={16} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
          <Icon name="Search" size={14} className="text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Поиск чатов..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Chats list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {filteredChats.map(chat => (
          <button key={chat.id}
            onClick={() => { setActiveChatId(chat.id); setMobileSidebar(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${activeChatId === chat.id ? "bg-primary/10" : "hover:bg-muted/60"}`}>
            <AvatarCircle text={chat.avatar} size={48} online={chat.online} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="font-medium text-sm truncate">{chat.name}</span>
                  {chat.verified && <Icon name="BadgeCheck" size={12} className="text-primary flex-shrink-0" />}
                </div>
                <span className="text-[11px] text-muted-foreground flex-shrink-0">{chat.time}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground truncate">{chat.lastMsg}</span>
                {chat.unread > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">🥑 Avocado v2.0</span>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-1.5 bg-muted rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-muted/80 transition">
          <Icon name={theme === "dark" ? "Sun" : "Moon"} size={12} />
          {theme === "dark" ? "Светлая" : "Тёмная"}
        </button>
      </div>
    </aside>
  );
}
