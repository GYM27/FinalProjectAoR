import { useState } from "react";
import { Link } from "react-router-dom";
import { fetchClient } from "../api/fetchClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setLoading(true);
    
    try {
      const response = await fetchClient.post('/auth/forgot-password', { email });
      setStatus({ type: "success", message: response.message || "Se o e-mail existir, receberá um link de recuperação em breve." });
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Ocorreu um erro ao processar o pedido." });
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
          <div className="text-center mb-10 w-full">
            <h1 className="font-headline-lg text-[32px] leading-[40px] tracking-tight text-tech-cyan uppercase font-bold drop-shadow-[0_0_8px_rgba(0,218,243,0.3)]">
              VITALISM CORE
            </h1>
            <p className="font-label-caps text-[12px] text-on-surface-variant uppercase mt-2 tracking-widest opacity-80">
              Recuperação de Acesso
            </p>
          </div>

          <div className="bg-dark-card border border-outline-variant/20 rounded-xl p-8 w-full shadow-2xl">
            {status.message && (
              <div className={`mb-6 p-3 border rounded-lg font-body-md text-sm text-center ${
                status.type === 'success' 
                  ? 'bg-tech-cyan/10 border-tech-cyan/50 text-tech-cyan' 
                  : 'bg-red-500/10 border-red-500/50 text-red-500'
              }`}>
                {status.message}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6 w-full">
              <div className="space-y-2">
                <label
                  className="font-label-caps text-[11px] text-tech-cyan font-bold uppercase flex items-center gap-2 tracking-wider"
                  htmlFor="email"
                >
                  E-mail de Registo
                </label>
                <div className="relative">
                  <input
                    className="w-full border text-on-surface font-body-md py-3 px-4 rounded-lg input-focus-glow transition-all outline-none placeholder:text-outline/40 bg-surface-container-lowest border-outline-variant/30"
                    id="email"
                    name="email"
                    placeholder="ex: dr.martins@hospital.pt"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full bg-tech-cyan text-on-primary font-headline-md text-[24px] py-3.5 rounded-lg transition-all duration-300 hover:brightness-110 hover:scale-[1.01] active:scale-95 shadow-lg shadow-tech-cyan/20 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
              >
                {loading ? 'A PROCESSAR...' : 'ENVIAR LINK'}
              </button>

              <div className="flex justify-center items-center mt-8 pt-6 border-t border-outline-variant/20">
                <Link
                  to="/login"
                  className="font-label-caps text-[11px] text-outline hover:text-tech-cyan transition-colors tracking-widest uppercase cursor-pointer"
                >
                  VOLTAR AO LOGIN
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
