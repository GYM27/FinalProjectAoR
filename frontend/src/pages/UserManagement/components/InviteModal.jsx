import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function InviteModal({ inviteModalOpen, setInviteModalOpen, handleInviteUser }) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');

    const handleSendInvite = (e) => {
        e.preventDefault();
        if (email) {
            handleInviteUser({ email });
            setEmail('');
        }
    };

    if (!inviteModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-700/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-cyan-400">mail</span>
                        {t('users.inviteModal.title')}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">{t('users.inviteModal.description')}</p>
                </div>

                <form onSubmit={handleSendInvite} className="p-6">

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-300 uppercase tracking-widest mb-2" htmlFor="email">
                            {t('users.inviteModal.emailLabel')}
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('users.inviteModal.emailPlaceholder')}
                            className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-500 transition-all placeholder-slate-600"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setInviteModalOpen(false)}
                            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-bold uppercase tracking-wider text-xs"
                        >
                            {t('users.inviteModal.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-cyan-500/20 transition-all"
                        >
                            {t('users.inviteModal.send')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}