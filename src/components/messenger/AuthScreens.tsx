import Icon from "@/components/ui/icon";
import { Toast, type View, type CurrentUser } from "./types";

// ─── Login / Register ─────────────────────────────────────────────────────────
interface AuthProps {
  view: "login" | "register";
  setView: (v: View) => void;
  loginForm: { phone: string; pass: string };
  setLoginForm: (f: { phone: string; pass: string }) => void;
  regForm: { name: string; phone: string; pass: string };
  setRegForm: (f: { name: string; phone: string; pass: string }) => void;
  onLogin: () => void;
  onRegister: () => void;
  notification: string | null;
}

export function AuthScreen({
  view, setView,
  loginForm, setLoginForm,
  regForm, setRegForm,
  onLogin, onRegister,
  notification,
}: AuthProps) {
  return (
    <div className="min-h-screen avo-chat-bg flex items-center justify-center p-4">
      {notification && <Toast msg={notification} />}
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 animate-bounce-in">🥑</div>
          <h1 className="text-3xl font-black tracking-tight">Avocado</h1>
          <p className="text-muted-foreground text-sm mt-1">Безопасный мессенджер с E2E шифрованием</p>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-xl border border-border">
          <div className="flex rounded-xl bg-muted p-1 mb-5">
            {(["login", "register"] as const).map(t => (
              <button key={t} onClick={() => setView(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${view === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {t === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          {view === "login" ? (
            <div className="space-y-3">
              <input
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition"
                placeholder="Номер телефона"
                value={loginForm.phone}
                onChange={e => setLoginForm({ ...loginForm, phone: e.target.value })}
              />
              <input
                type="password"
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition"
                placeholder="Пароль"
                value={loginForm.pass}
                onChange={e => setLoginForm({ ...loginForm, pass: e.target.value })}
                onKeyDown={e => e.key === "Enter" && onLogin()}
              />
              <button onClick={onLogin}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold hover:opacity-90 transition active:scale-95">
                Войти
              </button>
              <p className="text-center text-xs text-muted-foreground">Для демо-админа: любой телефон + пароль admin123</p>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition"
                placeholder="Имя и фамилия"
                value={regForm.name}
                onChange={e => setRegForm({ ...regForm, name: e.target.value })}
              />
              <input
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition"
                placeholder="Номер телефона"
                value={regForm.phone}
                onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
              />
              <input
                type="password"
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition"
                placeholder="Придумайте пароль"
                value={regForm.pass}
                onChange={e => setRegForm({ ...regForm, pass: e.target.value })}
                onKeyDown={e => e.key === "Enter" && onRegister()}
              />
              <button onClick={onRegister}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold hover:opacity-90 transition active:scale-95">
                Создать аккаунт
              </button>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 bg-primary/8 rounded-xl p-3">
            <Icon name="Lock" size={13} className="text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">Все сообщения шифруются end-to-end</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 2FA Screen ───────────────────────────────────────────────────────────────
interface TwoFaProps {
  twoFaCode: string;
  setTwoFaCode: (v: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  notification: string | null;
}

export function TwoFaScreen({ twoFaCode, setTwoFaCode, onConfirm, onBack, notification }: TwoFaProps) {
  return (
    <div className="min-h-screen avo-chat-bg flex items-center justify-center p-4">
      {notification && <Toast msg={notification} />}
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h2 className="text-2xl font-bold">Двухфакторная аутентификация</h2>
          <p className="text-muted-foreground text-sm mt-2">Введите 6-значный код</p>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-xl border border-border space-y-4">
          <div className="flex gap-2 justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}
                className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${twoFaCode[i] ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                {twoFaCode[i] || ""}
              </div>
            ))}
          </div>
          <input
            className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-center outline-none focus:ring-2 focus:ring-primary tracking-widest font-mono"
            placeholder="Введите код"
            maxLength={6}
            value={twoFaCode}
            onChange={e => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={e => e.key === "Enter" && onConfirm()}
          />
          <button onClick={onConfirm}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold hover:opacity-90 transition">
            Подтвердить
          </button>
          <button onClick={onBack} className="w-full text-muted-foreground text-sm hover:text-foreground transition">
            ← Назад
          </button>
        </div>
      </div>
    </div>
  );
}
