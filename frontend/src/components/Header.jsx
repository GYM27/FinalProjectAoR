import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuthStore } from '../store/useAuthStore';
import { fetchClient } from '../api/fetchClient';
import { useDegradedStore } from '../store/useDegradedStore';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { nomeCompleto, logout } = useAuthStore();
  const { isDegradedMode, setDegradedMode } = useDegradedStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [serverStatus, setServerStatus] = useState('ONLINE'); // ONLINE, OFFLINE

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        // Check if the backend is alive by hitting the actuator endpoint
        const response = await fetch('/actuator/health');
        // The backend will always return 200 now, so we parse the JSON to figure out the real state
        if (response.status === 200) {
          const data = await response.json();
          if (data.status === 'UP') {
            setServerStatus('ONLINE');
            setDegradedMode(false);
          } else if (data.status === 'OUT_OF_SERVICE' || data.status === 'DOWN') {
            setServerStatus('ONLINE'); // Keep it online to not block UI entirely
            setDegradedMode(true);
          } else {
            setServerStatus('OFFLINE');
            setDegradedMode(false);
          }
        } else {
          setServerStatus('OFFLINE');
          setDegradedMode(false);
        }
      } catch (error) {
        // If the network request fails, assume the server is fully offline
        setServerStatus('OFFLINE');
      }
    };
    // 1. Do a quick check as soon as the component loads
    checkServerStatus();
    // 2. Keep checking every 30 seconds to stay updated
    const intervalId = setInterval(checkServerStatus, 30000);
    // Clean up the interval when you leave the component
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    try {
      await fetchClient.post('/auth/logout');
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <header className="glass-panel border-b border-white/10 flex justify-between items-center w-full px-4 md:px-12 h-16 shrink-0 z-50 rounded-none bg-gray-900/80 backdrop-blur-md shadow-md">
      <div className="flex items-center gap-2 md:gap-4 truncate">
        <span className="font-display-metric text-[20px] sm:text-[24px] md:text-[32px] text-cyan-400 tracking-tighter font-bold drop-shadow-[0_0_8px_rgba(0,229,255,0.6)] truncate">VITALSIM CORE</span>
      </div>
      {/* Dynamic Status Indicator */}
      <div className="flex items-center gap-2 bg-black/40 p-1.5 md:py-1.5 md:px-4 rounded-full border border-white/5 shadow-inner">
        {serverStatus !== 'OFFLINE' && isDegradedMode ? (
          <span className="material-symbols-outlined text-orange-500 text-[14px] md:text-[16px] drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">
            warning
          </span>
        ) : (
          <div className={`w-2.5 h-2.5 md:w-2 md:h-2 rounded-full shadow-[0_0_8px_currentColor] transition-colors duration-500 ${
              serverStatus === 'OFFLINE' ? 'bg-red-500 text-red-500' 
              : 'bg-[#4ade80] text-[#4ade80]'
            }`}></div>
        )}
        <span className="hidden md:block font-headline-md text-xs text-gray-200 uppercase tracking-widest font-semibold transition-colors duration-500">
          {serverStatus === 'OFFLINE' ? t('header.systemOffline')
            : isDegradedMode ? t('header.systemDegraded')
              : t('header.systemOnline')}
        </span>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        {/* Language Switcher */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => i18n.changeLanguage('pt')}
            className={`px-2 py-1 text-xs font-bold rounded ${i18n.language.startsWith('pt') ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
          >
            PT
          </button>
          <button
            onClick={() => i18n.changeLanguage('en')}
            className={`px-2 py-1 text-xs font-bold rounded ${i18n.language.startsWith('en') ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white'}`}
          >
            EN
          </button>
        </div>
        {/* Use relative positioning here to keep the dropdown aligned */}
        <div className="flex items-center gap-4 relative">

          {/* Toggle the dropdown menu when you click this section */}
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 md:gap-3 bg-white/5 py-1 px-2 md:px-3 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
          >
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
              <span className="material-symbols-outlined text-[16px] md:text-[20px] text-gray-400">person</span>
            </div>
            <span className="font-headline-md text-[10px] md:text-xs text-gray-200 uppercase tracking-widest font-bold hidden sm:block">{nomeCompleto}</span>
            <span className="material-symbols-outlined text-[16px] md:text-[18px] text-gray-400">
              {isDropdownOpen ? 'expand_less' : 'expand_more'}
            </span>
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl py-2 z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-white/5 transition-all flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span className="text-sm font-medium">{t('header.logout')}</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
