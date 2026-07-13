import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchClient } from "../api/fetchClient";
import { useAuthStore } from "../store/useAuthStore";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState({ type: "", message: "" });
  const [resending, setResending] = useState(false);

  const handleResendActivation = async () => {
    if (!email) return;
    setResending(true);
    setResendStatus({ type: "", message: "" });
    try {
      await fetchClient.post('/auth/resend-activation', { email });
      setResendStatus({ type: "success", message: t('auth.resendSuccess') });
    } catch (err) {
      setResendStatus({ type: "error", message: t('auth.resendError') });
    } finally {
      setResending(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setResendStatus({ type: "", message: "" });
    setLoading(true);
    
    try {
      const response = await fetchClient.post('/auth/login', { email, password });
      
      login(response);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-on-surface min-h-screen tech-grid font-body-md overflow-x-hidden">
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-[12px] relative">
        {/* Corner Decorative Elements */}
        <div className="fixed top-[24px] left-[24px] border-l-2 border-t-2 border-tech-cyan/40 w-12 h-12 pointer-events-none"></div>
        <div className="fixed top-[24px] right-[24px] border-r-2 border-t-2 border-tech-cyan/40 w-12 h-12 pointer-events-none"></div>
        <div className="fixed bottom-[24px] left-[24px] border-l-2 border-b-2 border-tech-cyan/40 w-12 h-12 pointer-events-none"></div>
        <div className="fixed bottom-[24px] right-[24px] border-r-2 border-b-2 border-tech-cyan/40 w-12 h-12 pointer-events-none"></div>

        <main className="w-full max-w-[440px] flex flex-col items-center relative z-10">
          {/* Branding */}
          <div className="text-center mb-10 w-full">
            <h1 className="font-headline-lg text-[32px] leading-[40px] tracking-tight text-tech-cyan uppercase font-bold drop-shadow-[0_0_8px_rgba(0,218,243,0.3)]">
              VITALISM CORE
            </h1>
            <p className="font-label-caps text-[12px] text-on-surface-variant uppercase mt-2 tracking-widest opacity-80">
              {t('auth.subtitle')}
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-dark-card border border-outline-variant/20 rounded-xl p-8 w-full shadow-2xl">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 font-body-md text-sm text-center">
                <p>{error}</p>
                {error.toLowerCase().includes("not activated") && (
                  <button 
                    type="button" 
                    onClick={handleResendActivation}
                    disabled={resending}
                    className="mt-3 w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold py-2 rounded transition-colors"
                  >
                    {resending ? t('auth.resendingButton') : t('auth.resendButton')}
                  </button>
                )}
              </div>
            )}
            {resendStatus.message && (
              <div className={`mb-6 p-3 border rounded-lg font-body-md text-sm text-center ${
                resendStatus.type === 'success' 
                  ? 'bg-tech-cyan/10 border-tech-cyan/50 text-tech-cyan' 
                  : 'bg-red-500/10 border-red-500/50 text-red-500'
              }`}>
                {resendStatus.message}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-6 w-full">
              <div className="space-y-2">
                <label
                  className="font-label-caps text-[11px] text-tech-cyan font-bold uppercase flex items-center gap-2 tracking-wider"
                  htmlFor="username"
                >
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <input
                    className="w-full border text-on-surface font-body-md py-3 px-4 rounded-lg input-focus-glow transition-all outline-none placeholder:text-outline/40 bg-surface-container-lowest border-outline-variant/30"
                    id="username"
                    name="username"
                    placeholder="ex: dr.martins@hospital.pt"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    className="font-label-caps text-[11px] text-tech-cyan font-bold uppercase flex items-center gap-2 tracking-wider"
                    htmlFor="password"
                  >
                    {t('auth.password')}
                  </label>
                </div>
                <div className="relative">
                  <input
                    className="w-full border text-on-surface font-body-md py-3 px-4 rounded-lg input-focus-glow transition-all outline-none placeholder:text-outline/40 bg-surface-container-lowest border-outline-variant/30"
                    id="password"
                    name="password"
                    placeholder="••••••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full bg-tech-cyan text-on-primary font-headline-md text-[24px] py-3.5 rounded-lg transition-all duration-300 hover:brightness-110 hover:scale-[1.01] active:scale-95 shadow-lg shadow-tech-cyan/20 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
              >
                {loading ? t('auth.loggingInButton') : t('auth.loginButton')}
              </button>

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-outline-variant/20">
                <Link
                  to="/forgot-password"
                  className="font-label-caps text-[11px] text-outline hover:text-tech-cyan transition-colors tracking-widest uppercase cursor-pointer"
                >
                  {t('auth.forgotPassword')}
                </Link>
                {/* React Router Link pointing to Register! */}
                <Link
                  to="/register"
                  className="font-label-caps text-[11px] text-tech-cyan font-bold uppercase hover:brightness-110 transition-all tracking-widest border-b border-tech-cyan/20 pb-0.5 cursor-pointer"
                >
                  {t('auth.registerLink')}
                </Link>
              </div>
            </form>
          </div>

          <div className="mt-12 text-center">
            <p className="font-label-caps text-[10px] text-outline/60 uppercase tracking-widest">
              {t('auth.copyright')}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
