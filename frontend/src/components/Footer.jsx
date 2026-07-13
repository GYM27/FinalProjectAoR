import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="py-6 px-4 md:px-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 w-full bg-black/20 shrink-0 mt-auto">
      <div className="flex items-center gap-2 text-center md:text-left">
        <span className="font-headline-md text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          &copy; {new Date().getFullYear()} VITALSIM CORE
        </span>
      </div>

      <div className="flex items-center gap-4 text-center md:text-right">
        <span className="font-headline-md text-[9px] text-gray-500 uppercase tracking-widest">
          {t('footer.challenge', 'DESAFIO FINAL - JAVA AVANÇADO')}
        </span>
      </div>
    </footer>
  );
}
