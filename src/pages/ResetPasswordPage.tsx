import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { perplextaPageTransition, toast } from '@/design-system';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useAppContext();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(language === 'ar' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password })
      });
      
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        toast.success(language === 'ar' ? 'تم إعادة تعيين كلمة المرور بنجاح' : 'Password reset successful');
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError(data.error || (language === 'ar' ? 'فشل إعادة تعيين كلمة المرور' : 'Failed to reset password'));
      }
    } catch {
      setError(language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="flex items-center justify-center min-h-screen-safe bg-[var(--surface-page)] p-6">
        <div className="text-center space-y-4">
           <AlertCircle size={48} className="mx-auto text-red-500 opacity-50" />
           <h2 className="text-xl font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('invalidRequest') || 'Invalid Request'}</h2>
           <button onClick={() => navigate('/')} className="text-[var(--fg-accent)] hover:underline text-xs">{t('backToHome') || 'Back to Home'}</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      exit="exit"
      variants={perplextaPageTransition}
      className="flex items-center justify-center min-h-screen-safe bg-[var(--surface-page)] p-6" 
      dir={dir}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] mb-4 shadow-xs">
              <ShieldCheck size={32} className="text-[var(--fg-accent)]" />
           </div>
           <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
             {language === 'ar' ? 'إعادة ضبط كلمة المرور' : 'Reset Password'}
           </h2>
           <p className="text-[var(--text-muted)] mt-2 text-xs">
             {language === 'ar' ? 'قم بتعيين كلمة مرور جديدة قوية لنظامك' : 'Provision a new high-security credential for your account'}
           </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 rounded-shape-md border bg-[var(--surface-subtle)] border-[var(--border-main)] text-center space-y-4"
            >
               <div className="w-12 h-12 rounded-shape-full bg-[var(--status-success-subtle)] border border-[var(--fg-success)]/30 flex items-center justify-center mx-auto">
                 <CheckCircle2 size={24} className="text-[var(--fg-success)]" />
               </div>
               <h3 className="text-xl font-bold text-[var(--fg-success)]">{language === 'ar' ? 'تم التحديث بنجاح' : 'Credential Synchronized'}</h3>
               <p className="text-[var(--text-muted)] text-xs">
                 {language === 'ar' ? 'ستتم إعادة توجيهك إلى تسجيل الدخول خلال لحظات...' : 'Redirecting to secure terminal access shortly...'}
               </p>
               <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--fg-accent)]" />
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 rounded-shape-md shadow-lg border bg-[var(--surface-card)] border-[var(--border-main)] relative overflow-hidden group"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2 text-start">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                      {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Access Key'}
                    </label>
                    <div className="relative group/input">
                      <Lock size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/input:text-[var(--fg-accent)] transition-colors" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 ps-12 pe-4 rounded-shape-sm border bg-[var(--surface-subtle)] border-[var(--border-main)] focus:border-[var(--border-accent)] transition-theme outline-none text-[var(--text-primary)] font-mono text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-start">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                        {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Access Key'}
                    </label>
                    <div className="relative group/input">
                      <Lock size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/input:text-[var(--fg-accent)] transition-colors" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-12 ps-12 pe-4 rounded-shape-sm border bg-[var(--surface-subtle)] border-[var(--border-main)] focus:border-[var(--border-accent)] transition-theme outline-none text-[var(--text-primary)] font-mono text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-shape-xs flex items-center gap-2"
                    >
                      <AlertCircle size={14} />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full min-h-[44px] h-12 bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] rounded-shape-sm font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-theme shadow-xs active:scale-[0.98] cursor-pointer touch-target-44"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {language === 'ar' ? 'تحديث كلمة المرور' : 'Update Credentials'}
                      <ArrowRight size={16} className={language === 'ar' ? 'rotate-180' : ''} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center text-xs font-mono text-[var(--text-muted)]">
           Perplexta Security Engine v2.4
        </div>
      </motion.div>
    </motion.div>
  );
};
