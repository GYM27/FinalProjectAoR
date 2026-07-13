import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '../store/useAuthStore';

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { perfil } = useAuthStore();

  const links = [
    { name: t('navbar.dashboard'), path: '/dashboard', icon: 'dashboard', roles: ['MANAGER', 'USER'] },
    { name: t('navbar.history'), path: '/historico', icon: 'history', roles: ['MANAGER', 'USER'] },
    { name: t('navbar.rules'), path: '/rules', icon: 'view_list', roles: ['MANAGER'] },
    { name: t('navbar.users'), path: '/users', icon: 'manage_accounts', roles: ['ADMIN'] },
    { name: t('navbar.definitions'), path: '/definitions', icon: 'settings', roles: ['ADMIN'] },
    { name: 'Metrics', path: '/admin/metrics', icon: 'query_stats', roles: ['ADMIN'] }
  ];

  const visibleLinks = links.filter(link => link.roles.includes(perfil));

  return (
    <nav className="glass-panel border-r border-white/10 w-16 sm:w-20 flex flex-col items-center py-4 sm:py-8 z-40 shrink-0 rounded-none h-full shadow-lg bg-gray-900/50 backdrop-blur-md">
      <div className="flex flex-col gap-6 sm:gap-8 w-full items-center">
        {visibleLinks.map((link) => {
          const isActive = location.pathname.includes(link.path.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex flex-col items-center gap-1 sm:gap-2 group w-full cursor-pointer transition-all duration-300 ease-in-out ${isActive ? 'text-cyan-400' : 'text-gray-400 hover:text-cyan-300'}`}
            >
              <span className={`material-symbols-outlined text-[24px] sm:text-[28px] ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]' : ''}`}>
                {link.icon}
              </span>
              <span className="font-headline-md text-[8px] sm:text-[9px] uppercase tracking-widest font-bold hidden sm:block">
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
