import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { fetchClient } from '../api/fetchClient';

export default function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'alreadyActivated' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No activation token provided in the link.');
      return;
    }

    const ativarConta = async () => {
      try {
        const response = await fetchClient.get(`/auth/ativar?token=${token}`);
        if (response.alreadyActivated) {
          // Account was already activated previously
          setStatus('alreadyActivated');
          setMessage(response.message);
        } else {
          setStatus('success');
          setMessage(response.message || 'Account activated successfully!');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Failed to activate account. The token may be invalid.');
      }
    };

    ativarConta();
  }, [token, navigate]);

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
              Protocolo de Simulação Médica Avançada
            </p>
          </div>

          {/* Activation Card */}
          <div className="bg-dark-card border border-outline-variant/20 rounded-xl p-8 w-full shadow-2xl text-center">

            <p className="font-label-caps text-[11px] text-tech-cyan font-bold uppercase tracking-widest mb-8">
              Ativação de Conta
            </p>

            {/* LOADING */}
            {status === 'loading' && (
              <div className="space-y-6 py-4">
                <div className="w-14 h-14 border-4 border-tech-cyan/20 border-t-tech-cyan rounded-full animate-spin mx-auto"></div>
                <p className="text-on-surface-variant text-sm">A validar o token de ativação...</p>
              </div>
            )}

            {/* SUCCESS */}
            {status === 'success' && (
              <div className="space-y-6 py-4">
                <div className="w-16 h-16 bg-green-500/10 border-2 border-green-500/60 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-400 font-bold">{message}</p>
                <p className="text-sm text-on-surface-variant opacity-70">
                  A redirecionar para o início de sessão...
                </p>
              </div>
            )}

            {/* ALREADY ACTIVATED */}
            {status === 'alreadyActivated' && (
              <div className="space-y-6 py-4">
                <div className="w-16 h-16 bg-tech-cyan/10 border-2 border-tech-cyan/60 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-tech-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-tech-cyan font-bold">{message}</p>
                <Link
                  to="/login"
                  className="inline-block mt-2 font-label-caps text-[11px] text-tech-cyan font-bold uppercase hover:brightness-110 transition-all tracking-widest border-b border-tech-cyan/20 pb-0.5"
                >
                  Ir para o Início de Sessão →
                </Link>
              </div>
            )}

            {/* ERROR */}
            {status === 'error' && (
              <div className="space-y-6 py-4">
                <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500/60 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-red-400">{message}</p>
                <Link
                  to="/login"
                  className="inline-block mt-2 font-label-caps text-[11px] text-tech-cyan font-bold uppercase hover:brightness-110 transition-all tracking-widest border-b border-tech-cyan/20 pb-0.5"
                >
                  Voltar ao Início de Sessão
                </Link>
              </div>
            )}

          </div>

          <div className="mt-12 text-center">
            <p className="font-label-caps text-[10px] text-outline/60 uppercase tracking-widest">
              © 2026 Innovation Lab Management. GRUPO 3 AOR
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
