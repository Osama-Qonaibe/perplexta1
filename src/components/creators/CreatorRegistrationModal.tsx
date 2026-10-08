import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Sparkles, CheckCircle2, Award, User, Palette, Globe, 
  Coins, ArrowLeft, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { registerNewCreator } from '../../data/rinexCreators';
import { toast } from '@/design-system';

interface CreatorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatorRegistrationModal: React.FC<CreatorRegistrationModalProps> = ({ isOpen, onClose }) => {
  const { language, dir, user } = useAppContext();
  const navigate = useNavigate();
  const isAr = language === 'ar' || dir === 'rtl';

  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: (user as any)?.username || 'designer_' + Math.floor(Math.random() * 8999 + 1000),
    roleAr: 'مصمم قوالب وهويات بصرية احترافية',
    roleEn: 'Brand & Template Design Specialist',
    bioAr: 'صانع محتوى في شبكة رينكس للإبداع، أبتكر قوالب تسويقية وحركية عالية الجودة لمساعدة رواد الأعمال والمصممين.',
    bioEn: 'Rinex Creative Network member, crafting high-performance visual and motion templates.',
    portfolioUrl: '',
    payoutMethod: 'wallet',
    categories: ['marketing', 'reels', 'story']
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.username.trim()) {
      toast.error(isAr ? 'يرجى إدخال الاسم واسم المستخدم.' : 'Please enter your name and handle.');
      return;
    }

    const createdCreator = registerNewCreator({
      username: formData.username,
      name: formData.name,
      email: user?.email,
      roleAr: formData.roleAr,
      roleEn: formData.roleEn,
      bioAr: formData.bioAr,
      bioEn: formData.bioEn,
      socialLinks: formData.portfolioUrl ? { website: formData.portfolioUrl } : {}
    });

    try {
      localStorage.setItem('last_registered_creator_username', createdCreator.username);
    } catch (e) {}

    toast.success(
      isAr 
        ? `تهانينا! تم اعتماد حسابك كمبدع رسمياً (${createdCreator.name}). تم إضافة مكافأة انضمام بقيمة $50 في رصيدك!` 
        : `Congratulations! Certified as a Rinex Creator. $50 welcome bonus credited!`
    );

    onClose();
    // Navigate immediately to their newly created creator profile
    navigate(`/creator/${createdCreator.username.replace('@', '')}`);
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-xl rounded-shape-xl bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header with gradient banner */}
        <div className="relative p-6 bg-gradient-to-r from-[var(--surface-subtle)] via-[color-mix(in_oklab,var(--accent)_10%,transparent)] to-[var(--surface-subtle)] border-b border-[var(--border-default)]">
          <button
            onClick={onClose}
            className="absolute top-4 end-4 w-8 h-8 rounded-shape-full bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-shape-md bg-gradient-to-tr from-[var(--accent)] to-purple-500 text-slate-950 flex items-center justify-center shadow-md shrink-0 font-black">
              <Award size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[var(--text-primary)]">
                  {isAr ? 'الانضمام لنخبة صناع المحتوى في رينكس' : 'Join Rinex Creators Network'}
                </h3>
                <span className="px-2 py-0.5 rounded-shape-xs bg-[var(--bg-success-muted)] text-[var(--fg-success)] text-[10px] font-black font-mono border border-[color-mix(in_srgb,var(--fg-success)_30%,transparent)]">
                  PRO
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {isAr ? 'ابتكر قوالبك، شاركها مع ملايين المستخدمين، وابدأ جني الأرباح اليومية.' : 'Monetize your design templates and reach millions of creators.'}
              </p>
            </div>
          </div>
        </div>

        {/* Content form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          
          {step === 1 ? (
            <div className="space-y-4">
              
              {/* Creator Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <User size={13} className="text-[var(--accent)]" />
                    <span>{isAr ? 'الاسم الكامل أو التجاري' : 'Creator Name'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isAr ? 'مثال: سارة العتيبي' : 'e.g. Sarah Al-Otaibi'}
                    className="w-full h-10 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] text-xs font-bold outline-none text-[var(--text-primary)] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Sparkles size={13} className="text-purple-400" />
                    <span>{isAr ? 'معرّف البروفايل (Handle)' : 'Username (@handle)'}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[var(--text-muted)]">@</span>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="username"
                      className="w-full h-10 ps-7 pe-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] text-xs font-mono font-bold outline-none text-[var(--text-primary)] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Role Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Palette size={13} className="text-amber-400" />
                  <span>{isAr ? 'التخصص الإبداعي' : 'Specialization Role'}</span>
                </label>
                <input
                  type="text"
                  value={isAr ? formData.roleAr : formData.roleEn}
                  onChange={(e) => setFormData({ ...formData, roleAr: e.target.value, roleEn: e.target.value })}
                  placeholder={isAr ? 'مثال: مصمم قوالب سوشيال ميديا وموشن جرافيك' : 'e.g. Social Media & Motion Designer'}
                  className="w-full h-10 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] text-xs font-bold outline-none text-[var(--text-primary)] transition-all"
                />
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)]">
                  {isAr ? 'نبذة تعريفية مختصرة' : 'Short Bio'}
                </label>
                <textarea
                  rows={3}
                  value={isAr ? formData.bioAr : formData.bioEn}
                  onChange={(e) => setFormData({ ...formData, bioAr: e.target.value, bioEn: e.target.value })}
                  className="w-full p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] text-xs text-[var(--text-secondary)] outline-none leading-relaxed resize-none transition-all"
                />
              </div>

              {/* Portfolio Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Globe size={13} className="text-sky-400" />
                  <span>{isAr ? 'رابط معرض الأعمال (Behance / Portfolio)' : 'Portfolio Link'}</span>
                </label>
                <input
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                  placeholder="https://behance.net/yourprofile"
                  className="w-full h-10 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] text-xs font-mono outline-none text-[var(--text-primary)] transition-all"
                />
              </div>

            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Category Preferences */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-primary)]">
                  {isAr ? 'حدد الفئات التي تبدع في تقديم قوالبها:' : 'Select template categories you create:'}
                </label>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'marketing', labelAr: 'بوسترات تسويقية', labelEn: 'Marketing Posters' },
                    { id: 'reels', labelAr: 'فيديو وريلز 9:16', labelEn: 'Vertical Video Reels' },
                    { id: 'story', labelAr: 'قصص واستوري', labelEn: 'Stories & Statuses' },
                    { id: 'social', labelAr: 'سوشيال ميديا وقنوات', labelEn: 'Social Media & Banners' }
                  ].map(cat => {
                    const isSelected = formData.categories.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-3 rounded-shape-md border text-start flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] border-[var(--accent)] text-[var(--accent)] font-bold'
                            : 'bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-accent)]'
                        }`}
                      >
                        <span className="text-xs">{isAr ? cat.labelAr : cat.labelEn}</span>
                        {isSelected && <CheckCircle2 size={14} className="text-[var(--accent)] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Monetization Perks summary */}
              <div className="p-4 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-3">
                <h4 className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
                  <Coins size={14} className="text-amber-500" />
                  <span>{isAr ? 'ميزات ونظام أرباح صانع محتوى رينكس:' : 'Rinex Creator Earnings & Perks:'}</span>
                </h4>
                
                <ul className="space-y-2 text-[11px] text-[var(--text-secondary)] font-medium">
                  <li className="flex items-center gap-2">
                    <Zap size={12} className="text-[var(--fg-success)] shrink-0" />
                    <span>{isAr ? 'ربح عمولة فورية $0.15 عن كل مرة يتم فيها استخدام قالبه المجاني.' : '$0.15 commission per free template use.'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap size={12} className="text-[var(--fg-success)] shrink-0" />
                    <span>{isAr ? 'نسبة 70% من أرباح القوالب المدفوعة والممتازة (Pro).' : '70% revenue share on Pro paid templates.'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck size={12} className="text-sky-500 shrink-0" />
                    <span>{isAr ? 'توثيق الحساب بالشارة الخضراء وتوفير رابط خاص rinex.com/creator/@username' : 'Verified badge & custom vanity link.'}</span>
                  </li>
                </ul>
              </div>

            </div>
          )}

          {/* Modal Action Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-default)]">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-10 px-4 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold text-xs flex items-center gap-1.5 hover:bg-[var(--surface-inset)] cursor-pointer"
              >
                {isAr ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                <span>{isAr ? 'السابق' : 'Back'}</span>
              </button>
            ) : (
              <div />
            )}

            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-10 px-5 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-md ms-auto"
              >
                <span>{isAr ? 'المتابعة للخطوة التالية' : 'Next Step'}</span>
                {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
              </button>
            ) : (
              <button
                type="submit"
                className="h-10 px-6 rounded-shape-sm bg-gradient-to-r from-[var(--accent)] to-purple-600 text-slate-950 font-black text-xs flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-lg active:scale-95 ms-auto"
              >
                <Award size={15} />
                <span>{isAr ? 'اعتماد الحساب وبدء الربح الآن' : 'Certify & Activate Profile'}</span>
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};
