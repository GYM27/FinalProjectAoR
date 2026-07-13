import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Navbar from './Navbar';
import { useAuthStore } from '../store/useAuthStore';

export default function MainLayout() {
  const checkSession = useAuthStore(state => state.checkSession);
  const navigate = useNavigate();

  useEffect(() => {
    const intervalId = setInterval(() => {
      const isValid = checkSession();
      if (!isValid) {
        navigate('/login');
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [checkSession, navigate]);

  return (
    <div className="h-screen overflow-hidden bg-gray-900 text-gray-100 font-sans grid grid-rows-[auto_1fr_auto] grid-cols-[auto_1fr]">
      {/* Header ocupando a primeira linha inteira */}
      <div className="col-span-full row-start-1 shrink-0 z-50">
        <Header />
      </div>

      {/* Navbar sempre à esquerda na segunda linha */}
      <div className="col-start-1 row-start-2 shrink-0 z-40 h-full">
        <Navbar />
      </div>

      {/* Container principal de conteúdo */}
      <main className="relative flex flex-col overflow-y-auto overflow-x-hidden min-w-0 w-full col-start-2 row-start-2 h-full">
        {/* Background elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col items-center justify-center">
          {/* Aqui o React Router injeta a página atual */}
          <Outlet />
        </div>
      </main>

      {/* Footer ocupando a última linha inteira */}
      <div className="col-span-full row-start-3 shrink-0 z-50">
        <Footer />
      </div>
    </div>
  );
}
