import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Lock, Camera, Edit2, ShieldCheck, CreditCard, Check, X, Loader2, Languages, Monitor, Archive, Trash2, AlertTriangle, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { resolveImageUrl } from '../utils/imageResolver';
import { ThemeToggleButton } from './ThemeToggleButton';
import { StoryArchive } from './StoryArchive';
import { toast } from '@/design-system';

interface AccountSettingsProps {
  user: any;
  onUpdate: (updates: any) => void;
  dir: 'rtl' | 'ltr';
  theme: 'dark' | 'light' | 'system';
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ user, onUpdate, dir, theme, showToast }) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, token, setIsOperationPending, language, setLanguage, logout } = useAppContext();

  useEffect(() => {
    setAvatarLoadError(false);
  }, [user?.avatar]);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    if (showToast) {
      showToast(message, type);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast.success(message);
    }
  };

  useEffect(() => {
    setIsOperationPending(isUploading || editingField !== null);
  }, [isUploading, editingField, setIsOperationPending]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_AVATAR_SIZE) {
      notify(dir === 'rtl' ? 'حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)' : 'Image is too large (Max 5MB)', 'error');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        if (data.user) {
          onUpdate(data.user);
        } else {
          onUpdate({ avatar: data.url });
        }
      } else {
        notify(data.error || t('saveFailed'), 'error');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      notify(t('saveFailed'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleSave = async () => {
    if (!editingField) return;
    
    if (editingField === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editValue)) {
        notify(dir === 'rtl' ? 'بريد إلكتروني غير صالح' : 'Invalid email address', 'error');
        return;
      }
    }

    if (editingField === 'password' && editValue.length > 0 && editValue.length < 8) {
      notify(dir === 'rtl' ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters', 'error');
      return;
    }

    await onUpdate({ [editingField]: editValue });
    setEditingField(null);
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        notify(dir === 'rtl' ? 'تم حذف حسابك بنجاح. سيتم تحويلك الآن.' : 'Account deleted successfully. Logging out.', 'success');
        setIsDeleteDialogOpen(false);
        setTimeout(() => {
          logout(true);
        }, 600);
      } else {
        notify(data.error || (dir === 'rtl' ? 'فشل حذف الحساب' : 'Failed to delete account'), 'error');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      notify(dir === 'rtl' ? 'حدث خطأ أثناء محاولة حذف الحساب' : 'Error deleting account', 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const renderEditableField = (label: string, field: string, value: string, icon: React.ReactNode, type: string = 'text', multiline: boolean = false) => {
    const isEditing = editingField === field;

    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between py-3.5 sm:py-4 border-b border-[var(--border-default)] group gap-3">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="p-2 sm:p-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] group-hover:bg-[var(--bg-accent-muted)] transition-all duration-fast shrink-0 border border-transparent group-hover:border-[var(--border-accent)]/20">
            {React.cloneElement(icon as React.ReactNode as React.ReactElement<{ size?: number; className?: string }>, { size: 16 })}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{label}</p>
            {isEditing ? (
              multiline ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full p-2.5 rounded-[var(--radius-sm)] border border-[var(--border-default)] focus:border-[var(--border-accent)] focus:ring-1 focus:ring-[var(--border-accent)]/30 outline-none transition-all font-medium bg-[var(--surface-subtle)] text-[var(--text-primary)] min-h-[90px] text-xs sm:text-sm"
                  autoFocus
                />
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave();
                  }}
                  className="w-full max-w-md"
                >
                  <input
                    type={type}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full p-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] focus:border-[var(--border-accent)] focus:ring-1 focus:ring-[var(--border-accent)]/30 outline-none transition-all font-bold bg-[var(--surface-subtle)] text-[var(--text-primary)] text-xs sm:text-sm"
                    autoFocus
                  />
                </form>
              )
            ) : (
              <p className={`font-bold text-[var(--text-primary)] tracking-tight truncate ${multiline ? 'text-xs sm:text-sm whitespace-pre-wrap leading-relaxed' : 'text-xs sm:text-sm'}`}>
                {field === 'password' ? '••••••••' : (value || t('none'))}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 shrink-0">
          {isEditing ? (
            <div className="flex gap-1">
              <button 
                type="button"
                onClick={handleSave}
                className="p-2 text-[var(--fg-accent)] hover:bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/20 rounded-[var(--radius-sm)] transition-all duration-fast cursor-pointer"
              >
                <Check size={16} />
              </button>
              <button 
                type="button"
                onClick={() => setEditingField(null)}
                className="p-2 text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-[var(--radius-sm)] transition-all duration-fast cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => handleStartEdit(field, field === 'password' ? '' : value)}
              className="text-[var(--text-secondary)] hover:text-[var(--fg-accent)] text-xs font-bold flex items-center gap-1 transition-all duration-fast px-3 py-1.5 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)]/25 border border-[var(--border-default)] hover:border-[var(--border-accent)]/40 cursor-pointer active:scale-95 select-none"
            >
              <Edit2 size={13} />
              <span>{t('edit').toUpperCase()}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const kycStatus = user.kyc_status === 'verified' ? t('verified') : (user.kyc_status === 'pending' ? t('kycPending') : t('kycNone'));
  const planName = user.subscription ? (dir === 'rtl' ? user.subscription.plan_name_ar || user.subscription.plan_name_en : user.subscription.plan_name_en) : t('freeOnly');

  return (
    <div className="space-y-4 sm:space-y-6 relative max-w-4xl mx-auto pb-12">
      
      {/* SECTION 1: Profile & Account Information Card */}
      <div className="ide-card p-3.5 sm:p-6 shadow-xs space-y-1">
        <div className="flex items-center gap-2 sm:gap-3 pb-3 border-b border-[var(--border-default)] mb-1">
          <div className="text-[var(--fg-accent)] shrink-0 flex items-center justify-center">
            <User size={18} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">
              <span className="sm:hidden">{dir === 'rtl' ? 'الملف الشخصي' : 'Profile'}</span>
              <span className="hidden sm:inline">{dir === 'rtl' ? 'الملف الشخصي والحساب' : 'Profile & Account'}</span>
            </h2>
            <p className="hidden sm:block text-xs text-[var(--text-muted)] font-medium">
              {dir === 'rtl' ? 'إدارة بياناتك الشخصية وبيانات الاعتماد' : 'Manage your personal details and credentials'}
            </p>
          </div>
        </div>

        {/* Avatar Section */}
        <div className="flex items-center justify-between py-3 sm:py-4 border-b border-[var(--border-default)] group">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="relative shrink-0">
              {user.avatar && !avatarLoadError ? (
                <img 
                  src={resolveImageUrl(user.avatar, 'avatar')} 
                  alt="Avatar" 
                  onError={() => setAvatarLoadError(true)}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-shape-sm object-cover border transition-all duration-fast"
                  style={{ borderColor: user.subscription?.plan_color || 'var(--border-default)' }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div 
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] group-hover:border-[var(--border-accent)]/30 transition-all duration-fast"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={18} />}
                </div>
              )}
              <div 
                className="absolute -bottom-1 -right-1 p-1 sm:p-1.5 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-xs text-[var(--text-secondary)] hover:text-[var(--fg-accent)] cursor-pointer hover:border-[var(--border-accent)]/50 active:scale-95 transition-all shadow-2xs" 
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? <Loader2 size={10} className="animate-spin" /> : <Camera size={10} />}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{t('avatar')}</p>
              <div className="flex flex-wrap items-center gap-1">
                {user.subscription?.plan_name_en && (
                  <span className="px-2 py-0.5 rounded-shape-xs text-[9px] font-bold uppercase tracking-wider border border-[var(--border-default)] text-[var(--text-primary)]">
                    {user.subscription.plan_name_en}
                  </span>
                )}
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                   ID_{user.id?.toString().slice(-4)}
                </span>
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-[var(--text-secondary)] hover:text-[var(--fg-accent)] text-xs font-bold flex items-center gap-1 transition-all duration-fast p-2 sm:px-3 sm:py-1.5 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)]/25 border border-[var(--border-default)] hover:border-[var(--border-accent)]/40 shrink-0 cursor-pointer active:scale-95 select-none"
            title={t('edit')}
          >
            <Edit2 size={13} className="sm:hidden" />
            <span className="hidden sm:inline">{t('edit').toUpperCase()}</span>
          </button>
        </div>

        {renderEditableField(t('userName'), 'name', user.name || '', <User size={16} />)}
        {renderEditableField(t('email'), 'email', user.email || '', <Mail size={16} />, 'email')}
        {renderEditableField(t('password'), 'password', '', <Lock size={16} />, 'password')}

        <div className="flex items-center justify-between py-3 sm:py-4 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] text-[var(--text-muted)] shrink-0 border border-transparent">
              <ShieldCheck size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{t('kycStatus')}</p>
              <p className="font-bold text-xs sm:text-sm tracking-wider uppercase text-[var(--text-primary)] flex items-center gap-1 truncate">
                {kycStatus}
                {user.kyc_status === 'verified' && <Check size={14} className="text-[var(--fg-success)] shrink-0" />}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] text-[var(--text-muted)] shrink-0 border border-transparent">
              <CreditCard size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{t('currentPlan')}</p>
              <p className="font-bold text-xs sm:text-sm tracking-wider text-[var(--text-primary)] uppercase flex items-center gap-1 truncate">
                {planName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Preferences & Appearance Card */}
      <div className="ide-card p-3.5 sm:p-6 shadow-xs space-y-1">
        <div className="flex items-center gap-2 sm:gap-3 pb-3 border-b border-[var(--border-default)] mb-1">
          <div className="p-1.5 sm:p-2 rounded-[var(--radius-xs)] bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/20 text-[var(--fg-accent)] shrink-0">
            <Monitor size={16} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">
              {dir === 'rtl' ? 'التفضيلات والمظهر' : 'Preferences & Appearance'}
            </h2>
            <p className="hidden sm:block text-xs text-[var(--text-muted)] font-medium">
              {dir === 'rtl' ? 'تخصيص لغة المنصة والثيم والسمات البصرية' : 'Customize platform language, theme, and visual styling'}
            </p>
          </div>
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-between py-3 sm:py-4 border-b border-[var(--border-default)] group gap-2">
           <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] text-[var(--text-muted)] shrink-0 border border-transparent">
                <Languages size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{t('languagePreference') || 'Platform Language'}</p>
                <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">{language === 'ar' ? 'العربية' : 'English'}</p>
              </div>
           </div>
           <div className="flex gap-1 p-1 bg-[var(--surface-subtle)] rounded-[var(--radius-sm)] border border-[var(--border-default)] shrink-0">
              <button 
                type="button"
                onClick={() => setLanguage('ar')}
                className={`px-3 py-1 rounded-[var(--radius-xs)] text-[10px] font-bold uppercase tracking-wider transition-all duration-fast cursor-pointer ${language === 'ar' ? 'bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/30 text-[var(--fg-accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                العربية
              </button>
              <button 
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-[var(--radius-xs)] text-[10px] font-bold uppercase tracking-wider transition-all duration-fast cursor-pointer ${language === 'en' ? 'bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/30 text-[var(--fg-accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                English
              </button>
           </div>
        </div>

        {/* Theme Selection */}
        <div className="flex items-center justify-between py-3 sm:py-4 border-b border-[var(--border-default)] group gap-2">
           <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] text-[var(--text-muted)] shrink-0 border border-transparent">
                <Monitor size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{t('themePreference')}</p>
                <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)] uppercase truncate">{theme === 'system' ? t('systemMode') : theme === 'dark' ? t('darkMode') : t('lightMode')}</p>
              </div>
           </div>
           <div className="shrink-0 scale-90 sm:scale-100">
             <ThemeToggleButton variant="segmented" />
           </div>
        </div>

        {/* Email Notifications */}
        <div className="flex items-center justify-between py-3 sm:py-4 border-b border-[var(--border-default)] group gap-2">
           <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] text-[var(--text-muted)] shrink-0 border border-transparent">
                <Mail size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{dir === 'rtl' ? 'إشعارات البريد' : 'Email Notifications'}</p>
                <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)] uppercase truncate">{user.email_notifications !== false ? (dir === 'rtl' ? 'مفعل' : 'Enabled') : (dir === 'rtl' ? 'معطل' : 'Disabled')}</p>
              </div>
           </div>
           <div className="flex gap-1 p-1 bg-[var(--surface-subtle)] rounded-[var(--radius-sm)] border border-[var(--border-default)] shrink-0">
              <button 
                type="button"
                onClick={() => onUpdate({ email_notifications: true })}
                className={`px-3 py-1 rounded-[var(--radius-xs)] text-[10px] font-bold uppercase tracking-wider transition-all duration-fast cursor-pointer ${user.email_notifications !== false ? 'bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/30 text-[var(--fg-accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                {dir === 'rtl' ? 'تفعيل' : 'Enable'}
              </button>
              <button 
                type="button"
                onClick={() => onUpdate({ email_notifications: false })}
                className={`px-3 py-1 rounded-[var(--radius-xs)] text-[10px] font-bold uppercase tracking-wider transition-all duration-fast cursor-pointer ${
                  user.email_notifications === false 
                    ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {dir === 'rtl' ? 'تعطيل' : 'Disable'}
              </button>
           </div>
        </div>

        {/* Aggressive Data Saver & Content Compression Toggle */}
        <div className="flex items-center justify-between py-3 sm:py-4 group gap-2">
           <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] text-[var(--text-muted)] shrink-0 border border-transparent">
                <Zap size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
                  {dir === 'rtl' ? 'توفير البيانات والضغط الفائق' : 'Aggressive Data Saver & Compression'}
                </p>
                <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)] uppercase truncate">
                  {user.data_saver ? (dir === 'rtl' ? 'مفعل (مستوى 9)' : 'Enabled (Level 9)') : (dir === 'rtl' ? 'معطل (قياسي)' : 'Disabled (Standard)')}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5 hidden sm:block">
                  {dir === 'rtl' 
                    ? 'ضغط البيانات والشبكة بأقصى كثافة لتسريع الاستجابة على الاتصالات المحدودة' 
                    : 'Level 9 maximum compression for slow or metered mobile connections'}
                </p>
              </div>
           </div>
           <div className="flex gap-1 p-1 bg-[var(--surface-subtle)] rounded-[var(--radius-sm)] border border-[var(--border-default)] shrink-0">
              <button 
                type="button"
                onClick={() => {
                  document.cookie = "data_saver=true; path=/; max-age=31536000; SameSite=Lax";
                  localStorage.setItem('data_saver_enabled', 'true');
                  onUpdate({ data_saver: true });
                  notify(dir === 'rtl' ? 'تم تفعيل وضع توفير البيانات والضغط الفائق' : 'Data Saver & Aggressive Compression enabled');
                }}
                className={`px-3 py-1 rounded-[var(--radius-xs)] text-[10px] font-bold uppercase tracking-wider transition-all duration-fast cursor-pointer ${user.data_saver ? 'bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/30 text-[var(--fg-accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                {dir === 'rtl' ? 'تفعيل' : 'Enable'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  document.cookie = "data_saver=false; path=/; max-age=31536000; SameSite=Lax";
                  localStorage.setItem('data_saver_enabled', 'false');
                  onUpdate({ data_saver: false });
                  notify(dir === 'rtl' ? 'تم إيقاف وضع توفير البيانات' : 'Data Saver disabled');
                }}
                className={`px-3 py-1 rounded-[var(--radius-xs)] text-[10px] font-bold uppercase tracking-wider transition-all duration-fast cursor-pointer ${
                  !user.data_saver 
                    ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {dir === 'rtl' ? 'تعطيل' : 'Disable'}
              </button>
           </div>
        </div>
      </div>

      {/* SECTION 3: Archive & Data Card */}
      <div className="ide-card p-3.5 sm:p-6 shadow-xs space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 sm:gap-3 pb-3 border-b border-[var(--border-default)]">
          <div className="p-1.5 sm:p-2 rounded-[var(--radius-xs)] bg-[var(--bg-accent-muted)] border border-[var(--border-accent)]/20 text-[var(--fg-accent)] shrink-0">
            <Archive size={16} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">
              {dir === 'rtl' ? 'أرشيف القصص والبيانات' : 'Stories & Data Archive'}
            </h2>
            <p className="hidden sm:block text-xs text-[var(--text-muted)] font-medium">
              {dir === 'rtl' ? 'استعراض المحتوى والأرشيف المؤقت' : 'Review archived stories and temporary records'}
            </p>
          </div>
        </div>
        <div className="pt-1">
          <StoryArchive dir={dir} token={token} showToast={showToast} />
        </div>
      </div>

      {/* SECTION 4: Danger Zone (Account Deletion) */}
      <div className="p-3.5 sm:p-5 rounded-[var(--radius-md)] border border-rose-500/20 bg-rose-500/[0.03] transition-all">
        <div className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-[var(--radius-sm)] bg-rose-500/10 text-rose-400 shrink-0 border border-rose-500/20">
              <Trash2 size={16} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-400 truncate">
                {dir === 'rtl' ? 'حذف الحساب نهائياً' : 'Permanent Account Deletion'}
              </h4>
              <p className="hidden sm:block text-xs text-[var(--text-muted)] leading-relaxed max-w-xl mt-0.5">
                {dir === 'rtl'
                  ? 'عند حذف حسابك، سيتم محو جميع بياناتك ومحادثاتك وسجلاتك ومحفظتك بالكامل. هذا الإجراء نهائي ولا يمكن التراجع عنه.'
                  : 'Once deleted, all your profile data, chats, records, and wallet history will be permanently erased. This action is irreversible.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="px-3.5 py-2 rounded-[var(--radius-sm)] text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all duration-fast shrink-0 shadow-xs cursor-pointer"
          >
            {dir === 'rtl' ? 'حذف الحساب' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Dialog */}
      <AnimatePresence>
        {isDeleteDialogOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--surface-overlay)] backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-5 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2 rounded-[var(--radius-xs)] bg-rose-500/10 border border-rose-500/20 shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                  {dir === 'rtl' ? 'تأكيد حذف الحساب' : 'Confirm Account Deletion'}
                </h3>
              </div>

              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {dir === 'rtl'
                  ? 'هل أنت متأكد تماماً من رغبتك في حذف حسابك؟ سيتم حذف جميع بياناتك ومحادثاتك وسجلاتك فوراً وبشكل لا يمكن استرداده لاحقاً.'
                  : 'Are you absolutely sure you want to delete your account? All your data, chats, and records will be permanently erased and cannot be recovered.'}
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="px-3.5 py-2 rounded-[var(--radius-sm)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] transition-all duration-fast cursor-pointer"
                >
                  {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-[var(--radius-sm)] text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all duration-fast flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isDeletingAccount && <Loader2 size={14} className="animate-spin" />}
                  {dir === 'rtl' ? 'حذف نهائي' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
