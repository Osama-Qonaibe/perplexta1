import React, { useState } from 'react';
import { safeStorageGet, safeStorageSet } from '@/utils/safeStorage';
import { X, Mail, Lock, Loader2, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { usePerplextaRouter } from '../../hooks/usePerplextaRouter';
import { useAppContext } from '../../context/AppContext';
import { isGoogleAuthHidden } from '../../utils/sectionVisibility';
import { motion, AnimatePresence } from 'motion/react';
import { themeConfig } from '@/design-system';

export interface AuthCardProps {
  onClose?: () => void;
  showCloseButton?: boolean;
  initialMode?: 'login' | 'signup' | 'forgot-password';
  onSuccess?: () => void;
  className?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  onClose,
  showCloseButton = true,
  initialMode = 'login',
  onSuccess,
  className = ''
}) => {
  const { t, dir, loginWithGoogle, login, signup, rememberMe, setRememberMe, siteSettings } = useAppContext();
  const [searchParams] = useSearchParams();
  const { navigate } = usePerplextaRouter();
  const ref = searchParams.get('ref') || safeStorageGet('app_ref') || undefined;

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);

  const handleNavigateLegal = (path: string) => {
    if (onClose) onClose();
    navigate(path);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, language: dir === 'rtl' ? 'ar' : 'en' })
      });
      if (res.ok) {
        setSuccess(
          dir === 'rtl'
            ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
            : 'Password reset link sent to your email.'
        );
      } else {
        setError(dir === 'rtl' ? 'حدث خطأ ما.' : 'An error occurred.');
      }
    } catch {
      setError(dir === 'rtl' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'forgot-password') return handleForgotPassword(e);

    if (!termsAccepted) {
      setError(
        dir === 'rtl'
          ? 'يجب الموافقة على شروط الخدمة وسياسة الخصوصية للمتابعة'
          : 'You must agree to the Terms of Service & Privacy Policy to continue'
      );
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError(dir === 'rtl' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
          setIsLoading(false);
          return;
        }
        const result = await signup(email, password, email.split('@')[0], ref);
        if (!result.success) {
          let errorMsg = result.error || 'Signup failed';
          if (errorMsg === 'User already exists' || errorMsg.includes('already exists')) {
            errorMsg = dir === 'rtl' 
              ? 'البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استعادة كلمة المرور.' 
              : 'This email is already registered. Please log in or reset your password.';
          }
          setError(errorMsg);
        } else {
          if (onSuccess) onSuccess();
          else navigate('/chat');
        }
      } else {
        const result = await login(email, password);
        if (!result.success) {
          let errorMsg = result.error || 'Login failed';
          if (errorMsg === 'Invalid credentials' || errorMsg.includes('credentials') || errorMsg.toLowerCase().includes('invalid email or password')) {
            errorMsg = dir === 'rtl' 
              ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' 
              : 'Invalid email or password.';
          }
          setError(errorMsg);
        } else {
          if (onSuccess) onSuccess();
          else navigate('/chat');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    if (mode !== 'forgot-password' && !termsAccepted) {
      setError(
        dir === 'rtl'
          ? 'يجب الموافقة على شروط الخدمة وسياسة الخصوصية للمتابعة'
          : 'You must agree to the Terms of Service & Privacy Policy to continue'
      );
      return;
    }
    loginWithGoogle();
  };

  return (
    <div
      dir={dir}
      className={`${themeConfig.auth.card} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 end-3.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-theme p-1.5 rounded-shape-xs z-20 cursor-pointer"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      )}

      <div className="text-center mb-4">
        <h2 className={themeConfig.auth.title}>
          {mode === 'login' ? t('login') : mode === 'signup' ? t('signup') : t('forgotPasswordTitle')}
        </h2>
      </div>

      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 10 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className={themeConfig.auth.error}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {success && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 10 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className={themeConfig.auth.success}
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <div className="relative group">
            <div className="absolute inset-y-0 start-3 flex items-center pointer-events-none text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors">
              <Mail size={14} />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${themeConfig.auth.input} ps-9 pe-3`}
              placeholder="name@example.com"
              dir="ltr"
            />
          </div>
        </div>

        {mode !== 'forgot-password' && (
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 start-3 flex items-center pointer-events-none text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors">
                <Lock size={14} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${themeConfig.auth.input} ps-9 pe-3`}
                placeholder="••••••••"
                dir="ltr"
              />
            </div>

            {mode === 'login' && (
              <div className="mt-2.5 flex items-center justify-between px-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={rememberMe}
                      onChange={(e) => {
                        setRememberMe(e.target.checked);
                        safeStorageSet('app_remember_me', e.target.checked ? 'true' : 'false');
                      }}
                    />
                    <div className={themeConfig.auth.checkboxBox}>
                      <svg className="w-2.5 h-2.5 text-[var(--surface-page)] opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                    {t('remember_me')}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                >
                  {t('forgotPassword')}
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'signup' && (
          <div>
            <div className="relative group">
              <div className="absolute inset-y-0 start-3 flex items-center pointer-events-none text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors">
                <Lock size={14} />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`${themeConfig.auth.input} ps-9 pe-3`}
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
          </div>
        )}

        {mode !== 'forgot-password' && (
          <div className="pt-1 px-0.5">
            <div className="flex items-center gap-2 select-none">
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (e.target.checked && error) {
                        setError(null);
                      }
                    }}
                  />
                  <div className={themeConfig.auth.checkboxBox}>
                    <svg className="w-2.5 h-2.5 text-[var(--surface-page)] opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </label>
              <div className="text-xs leading-normal text-[var(--text-secondary)]">
                <span>{dir === 'rtl' ? 'أوافق على ' : 'I agree to the '}</span>
                <button
                  type="button"
                  onClick={() => handleNavigateLegal('/terms')}
                  className="text-[var(--accent)] hover:underline font-bold transition-colors cursor-pointer"
                >
                  {t('termsOfUse')}
                </button>
                <span>{dir === 'rtl' ? ' و ' : ' and '}</span>
                <button
                  type="button"
                  onClick={() => handleNavigateLegal('/privacy')}
                  className="text-[var(--accent)] hover:underline font-bold transition-colors cursor-pointer"
                >
                  {t('privacyPolicy')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading || (mode !== 'forgot-password' && !termsAccepted)}
            className={themeConfig.auth.submitButton}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{t('processing')}...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? t('login') : mode === 'signup' ? t('signup') : t('sendResetLink')}</span>
                <Sparkles size={13} className="opacity-80" />
              </>
            )}
          </motion.button>

          {mode !== 'forgot-password' && !isGoogleAuthHidden(siteSettings?.blocked_paths, typeof window !== 'undefined' && window.innerWidth < 1024) && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleAuth}
              type="button"
              disabled={!termsAccepted}
              className={themeConfig.auth.googleButton}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="font-bold truncate">Google</span>
            </motion.button>
          )}
        </div>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-[var(--text-secondary)]">
          {mode === 'login' ? t('noAccount') : mode === 'signup' ? t('haveAccount') : t('rememberedPassword')}
          <button
            type="button"
            onClick={() => {
              if (mode === 'forgot-password') setMode('login');
              else setMode(mode === 'login' ? 'signup' : 'login');
              setError(null);
            }}
            className="mx-1 text-[var(--accent)] hover:underline font-bold transition-colors cursor-pointer"
          >
            {mode === 'login' ? t('signup') : mode === 'signup' ? t('login') : t('login')}
          </button>
        </p>
      </div>
    </div>
  );
};
