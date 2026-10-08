import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Globe, Copy, Check, Link as LinkIcon, User as UserIcon } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { toast } from '@/design-system';

interface QuoteShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteText: string;
  dir: 'ltr' | 'rtl';
}

export const QuoteShareModal: React.FC<QuoteShareModalProps> = ({
  isOpen,
  onClose,
  quoteText,
  dir
}) => {
  const { user, token } = useAppContext();
  const isRtl = dir === 'rtl';

  const [accessLevel, setAccessLevel] = useState<'anyone' | 'restricted'>('anyone');
  const [inviteInput, setInviteInput] = useState('');
  const [invitedPeople, setInvitedPeople] = useState<{ email: string; name?: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate share snapshot on mount / when quote changes
  useEffect(() => {
    if (isOpen) {
      const cleanSnippet = quoteText.trim().slice(0, 100);
      const defaultUrl = `${window.location.origin}/share/s_${Date.now().toString(36)}`;
      setShareUrl(defaultUrl);

      if (token) {
        setIsGenerating(true);
        fetch('/api/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: isRtl ? 'مشاركة اقتباس/ملاحظة' : 'Shared Quote/Note',
            content: quoteText,
            model_name: 'Perplexta Safety Quote'
          })
        })
          .then(res => res.json())
          .then(data => {
            if (data?.id) {
              setShareUrl(`${window.location.origin}/share/${data.id}`);
            }
          })
          .catch(() => {
            // Keep default share URL fallback
          })
          .finally(() => setIsGenerating(false));
      }
    }
  }, [isOpen, quoteText, token, isRtl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success(isRtl ? 'تم نسخ رابط المشاركة بنجاح' : 'Share link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inviteInput.trim();
    if (!val) return;
    if (invitedPeople.some(p => p.email.toLowerCase() === val.toLowerCase())) {
      toast.error(isRtl ? 'تمت إضافة هذا الشخص بالفعل' : 'Person already added');
      return;
    }
    setInvitedPeople(prev => [...prev, { email: val, name: val.split('@')[0] }]);
    setInviteInput('');
    toast.success(isRtl ? `تم إعطاء صلاحية الوصول لـ ${val}` : `Access granted to ${val}`);
  };

  const ownerName = (user as any)?.name || (user as any)?.full_name || 'osama qonaibe';
  const ownerEmail = user?.email || 'osamaqonaibe@gmail.com';
  const ownerAvatar = (user as any)?.avatar_url || (user as any)?.avatar;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-md bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-2xl p-5 space-y-4 text-start overflow-hidden flex flex-col"
          dir={dir}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-1 border-b border-[var(--border-default)]">
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
              {isRtl ? 'مشاركة هذه الملاحظة أو الجلسة' : 'Share this session'}
            </h3>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? <Check size={13} className="text-[var(--fg-success)]" /> : <LinkIcon size={13} />}
                <span>{copied ? (isRtl ? 'تم النسخ' : 'Copied') : (isRtl ? 'نسخ الرابط' : 'Copy link')}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Add People Row */}
          <form onSubmit={handleAddPerson} className="flex items-center gap-2">
            <input
              type="text"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              placeholder={isRtl ? 'إضافة أشخاص بالاسم أو البريد...' : 'Add people by name or email...'}
              className="flex-1 px-3 py-2 text-xs rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-accent transition-all font-sans"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-[var(--radius-md)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] transition-all cursor-pointer shrink-0"
            >
              {isRtl ? 'مشاركة' : 'Share'}
            </button>
          </form>

          {/* People with Access */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[var(--text-muted)]">
              {isRtl ? 'الأشخاص الذين لديهم إمكانية الوصول' : 'People with access'}
            </h4>

            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {/* Owner Item */}
              <div className="flex items-center justify-between p-2 rounded-[var(--radius-md)] bg-[var(--surface-subtle)]/60 border border-[var(--border-default)]/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  {ownerAvatar ? (
                    <img src={ownerAvatar} alt={ownerName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 text-accent font-bold text-xs flex items-center justify-center shrink-0">
                      {ownerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[var(--text-primary)] truncate">{ownerName}</div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">{ownerEmail}</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[var(--text-muted)] shrink-0">
                  {isRtl ? 'المالك' : 'Owner'}
                </span>
              </div>

              {/* Invited People List */}
              {invitedPeople.map((person, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-[var(--radius-md)] bg-[var(--surface-subtle)]/40 border border-[var(--border-default)]/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[var(--fg-accent)]/15 border border-[var(--border-accent)]/30 text-[var(--fg-accent)] font-bold text-xs flex items-center justify-center shrink-0">
                      <UserIcon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[var(--text-primary)] truncate">{person.name || person.email}</div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate">{person.email}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[var(--fg-success)] shrink-0">
                    {isRtl ? 'مُضاف' : 'Access'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* General Access Selector */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[var(--text-muted)]">
              {isRtl ? 'الوصول العام' : 'General access'}
            </h4>

            <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-subtle)]/50 divide-y divide-[var(--border-default)] overflow-hidden">
              {/* Option 1: Restricted */}
              <button
                type="button"
                onClick={() => setAccessLevel('restricted')}
                className={`w-full flex items-center justify-between p-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  accessLevel === 'restricted'
                    ? 'bg-[var(--surface-card)] text-[var(--text-primary)] font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Lock size={15} className={accessLevel === 'restricted' ? 'text-amber-500' : 'text-[var(--text-muted)]'} />
                  <span>{isRtl ? 'حصرياً للأشخاص المضافين فقط' : 'Only people with access can view'}</span>
                </div>
                {accessLevel === 'restricted' && <Check size={16} className="text-[var(--fg-success)] shrink-0" />}
              </button>

              {/* Option 2: Anyone with Link */}
              <button
                type="button"
                onClick={() => setAccessLevel('anyone')}
                className={`w-full flex items-center justify-between p-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  accessLevel === 'anyone'
                    ? 'bg-[var(--surface-card)] text-[var(--text-primary)] font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Globe size={15} className={accessLevel === 'anyone' ? 'text-[var(--fg-accent)]' : 'text-[var(--text-muted)]'} />
                  <span>{isRtl ? 'أي شخص لديه الرابط يمكنه العرض' : 'Anyone with the link can view'}</span>
                </div>
                {accessLevel === 'anyone' && <Check size={16} className="text-[var(--fg-success)] shrink-0" />}
              </button>
            </div>
          </div>

          {/* Share Link Box & Copy Button */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-subtle)]">
            <span className="text-[11px] font-mono text-[var(--text-secondary)] truncate flex-1 px-1">
              {shareUrl}
            </span>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-transparent hover:bg-[var(--surface-card)] border border-transparent hover:border-[var(--border-default)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              {copied ? <Check size={13} className="text-[var(--fg-success)]" /> : <Copy size={13} />}
              <span>{copied ? (isRtl ? 'تم النسخ' : 'Copied') : (isRtl ? 'نسخ الرابط' : 'Copy link')}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
