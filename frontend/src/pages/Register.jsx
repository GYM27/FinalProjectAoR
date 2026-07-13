import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchClient } from '../api/fetchClient';
import { userService } from '../api/userService';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (token) {
      const fetchInvitationEmail = async () => {
        try {
          const data = await fetchClient.get(`/auth/invitation-email?token=${token}`);
          if (data && data.email) {
            setFormData(prev => ({ ...prev, email: data.email }));
          }
        } catch (err) {
          setError(err.message || 'Convite inválido ou expirado.');
        }
      };
      fetchInvitationEmail();
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Client-side validation: confirm passwords
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsNotMatch'));
      return;
    }

    // Password strength validation (Rule 8.2) before sending to server
    if (!PASSWORD_REGEX.test(formData.password)) {
      setError(t('auth.passwordRequirements'));
      return;
    }

    setLoading(true);
    try {
      if (token) {
        await userService.acceptInvite({
          token: token,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });
        alert(t('auth.registerSuccessMsg'));
        navigate('/login');
        return;
      } else {
        await fetchClient.post('/auth/register', formData);
      }
      // Do not redirect automatically: show success message for the user to check their email
      setSuccessMessage(t('auth.registerVerifyMsg'));
    } catch (err) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-on-surface min-h-screen tech-grid font-body-md overflow-x-hidden">
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-[12px] relative py-12">

        {/* Corner Decorative Elements */}
        <div className="fixed top-[24px] left-[24px] border-l-2 border-t-2 border-tech-cyan/40 w-12 h-12 pointer-events-none"></div>
        <div className="fixed top-[24px] right-[24px] border-r-2 border-t-2 border-tech-cyan/40 w-12 h-12 pointer-events-none"></div>
        <div className="fixed bottom-[24px] left-[24px] border-l-2 border-b-2 border-tech-cyan/40 w-12 h-12 pointer-events-none"></div>
        <div className="fixed bottom-[24px] right-[24px] border-r-2 border-b-2 border-tech-cyan/40 w-12 h-12 pointer-events-none"></div>

        <main className="w-full max-w-[400px] flex flex-col items-center relative z-10">

          {/* Branding */}
          <div className="text-center mb-10 w-full">
            <h1 className="font-headline-lg text-[28px] leading-[40px] tracking-tight text-tech-cyan uppercase font-bold drop-shadow-[0_0_8px_rgba(0,218,243,0.3)]">
              VITALISM CORE
            </h1>
            <p className="font-label-caps text-[12px] text-on-surface-variant uppercase mt-2 tracking-widest opacity-80">
              {t('auth.subtitle')}
            </p>
          </div>

          {/* Registration Card */}
          <div className="bg-dark-card border border-outline-variant/20 rounded-xl p-8 w-full shadow-2xl">
            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 font-body-md text-sm text-center">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 font-body-md text-sm text-center space-y-2">
                <p className="font-bold">✓</p>
                <p>{successMessage}</p>
                <Link to="/login" className="inline-block mt-2 text-tech-cyan font-bold underline underline-offset-2 hover:brightness-110">
                  {t('auth.goToLogin')}
                </Link>
              </div>
            )}
            <form onSubmit={handleRegister} className="space-y-5 w-full">

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-label-caps text-[11px] text-tech-cyan font-bold uppercase flex items-center gap-2 tracking-wider" htmlFor="firstName">
                    {t('auth.firstName')}
                  </label>
                  <input
                    className="w-full border text-on-surface font-body-md py-3 px-4 rounded-lg input-focus-glow transition-all outline-none placeholder:text-outline/40 bg-surface-container-lowest border-outline-variant/30"
                    id="firstName"
                    name="firstName"
                    placeholder="primeiro nome"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[11px] text-tech-cyan font-bold uppercase flex items-center gap-2 tracking-wider" htmlFor="lastName">
                    {t('auth.lastName')}
                  </label>
                  <input
                    className="w-full border text-on-surface font-body-md py-3 px-4 rounded-lg input-focus-glow transition-all outline-none placeholder:text-outline/40 bg-surface-container-lowest border-outline-variant/30"
                    id="lastName"
                    name="lastName"
                    placeholder="último nome"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label-caps text-[11px] text-tech-cyan font-bold uppercase flex items-center gap-2 tracking-wider" htmlFor="email">
                  {t('auth.email')}
                  {token && <span className="text-[9px] text-green-400 opacity-80 border border-green-500/30 bg-green-500/10 px-1.5 py-0.5 rounded ml-2">(Do Convite)</span>}
                </label>
                <input
                  className={`w-full border text-on-surface font-body-md py-3 px-4 rounded-lg outline-none placeholder:text-outline/40 transition-all ${token ? 'bg-surface-container-highest border-outline-variant/10 text-outline cursor-not-allowed opacity-60' : 'input-focus-glow bg-surface-container-lowest border-outline-variant/30'}`}
                  id="email"
                  name="email"
                  placeholder="email@instituicao.pt"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={!!token}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-label-caps text-[11px] text-tech-cyan font-bold uppercase flex items-center gap-2 tracking-wider" htmlFor="password">
                    {t('auth.password')}
                  </label>
                  <input
                    className="w-full border text-on-surface font-body-md py-3 px-4 rounded-lg input-focus-glow transition-all outline-none placeholder:text-outline/40 bg-surface-container-lowest border-outline-variant/30"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[11px] text-tech-cyan font-bold uppercase flex items-center gap-2 tracking-wider" htmlFor="confirmPassword">
                    {t('auth.confirmPassword')}
                  </label>
                  <input
                    className="w-full border text-on-surface font-body-md py-3 px-4 rounded-lg input-focus-glow transition-all outline-none placeholder:text-outline/40 bg-surface-container-lowest border-outline-variant/30"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="••••••••"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <button disabled={loading} className="w-full bg-tech-cyan text-on-primary font-headline-md text-[24px] py-3.5 mt-2 rounded-lg transition-all duration-300 hover:brightness-110 hover:scale-[1.01] active:scale-95 shadow-lg shadow-tech-cyan/20 uppercase disabled:opacity-50 disabled:cursor-not-allowed" type="submit">
                {loading ? t('auth.registeringButton') : t('auth.registerButton')}
              </button>

              <div className="flex justify-center items-center mt-8 pt-6 border-t border-outline-variant/20">
                {/* React Router Link pointing back to Login! */}
                <Link to="/login" className="font-label-caps text-[11px] text-on-surface-variant/70 tracking-widest uppercase hover:text-tech-cyan transition-colors cursor-pointer">
                  {t('auth.haveAccount')} <span className="text-tech-cyan font-bold ml-1 border-b border-tech-cyan/20 pb-0.5">{t('auth.loginButton')}</span>
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