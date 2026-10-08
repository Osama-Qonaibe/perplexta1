import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Layers, Eye, Star, Coins, Zap, ArrowUpRight, 
  CheckCircle2, Sparkles, User, Palette
} from 'lucide-react';
import { MarketplaceTemplate, recordTemplateUse } from '../../data/rinexCreators';
import { useAppContext } from '../../context/AppContext';
import { toast } from '@/design-system';

interface TemplatePreviewModalProps {
  template: MarketplaceTemplate | null;
  onClose: () => void;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({ template, onClose }) => {
  const { language, dir, user, setIsAuthModalOpen } = useAppContext();
  const navigate = useNavigate();
  const isAr = language === 'ar' || dir === 'rtl';

  if (!template) return null;

  const handleUseTemplate = () => {
    if (!user) {
      try {
        sessionStorage.setItem('pending_studio_template', template.id);
        sessionStorage.setItem('pending_studio_template_payload', JSON.stringify(template));
      } catch (e) {}
      toast.info(
        isAr 
          ? 'حفاظاً على أمان بياناتك، وحماية الملكية الفكرية لتصاميمك، ومنع أي استخدام غير مشروع، يلزم إنشاء حساب مجاني أو تسجيل الدخول لتحديد مالك لمشروعك وبدء تعديل القالب.' 
          : 'For data security and intellectual property protection, please sign in or register to customize this template.'
      );
      onClose();
      setIsAuthModalOpen(true);
      return;
    }

    recordTemplateUse(template.id);
    toast.success(isAr ? `جاري تحميل قالب "${template.titleAr}" إلى استوديو رينكس...` : `Opening "${template.titleEn}" in Studio...`);

    onClose();
    setTimeout(() => {
      navigate('/image-studio', { state: { loadMarketplaceTemplate: template } });
    }, 400);
  };

  const handleViewCreatorProfile = () => {
    onClose();
    navigate(`/creator/${template.creatorUsername.replace('@', '')}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl rounded-shape-xl bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-xs font-bold text-[var(--text-muted)] font-mono">
              {isAr ? 'معاينة قالب استوديو رينكس' : 'Rinex Studio Template Preview'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="touch-target-44 w-8 h-8 rounded-shape-full bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Left Column: High-Res Image Preview (6 cols) */}
            <div className="md:col-span-6 rounded-shape-lg overflow-hidden border border-[var(--border-default)] bg-slate-950/40 relative shadow-inner group">
              <img
                src={template.thumbnail}
                alt={template.titleAr}
                className="w-full h-auto max-h-[340px] object-contain mx-auto"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-2.5 end-2.5 px-2.5 py-1 rounded-shape-xs bg-slate-950/80 text-white font-mono text-[10px] font-bold border border-white/10 backdrop-blur-sm">
                {template.dimensions}
              </span>
            </div>

            {/* Right Column: Template details & Creator Card (6 cols) */}
            <div className="md:col-span-6 space-y-4 text-start">
              
              {/* Kicker category & price badge */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[11px] font-bold text-[var(--accent)]">
                  {isAr ? template.categoryLabelAr : template.category}
                </span>
                {template.priceType === 'free' ? (
                  <span className="px-2.5 py-1 rounded-shape-xs bg-[var(--bg-success-muted)] border border-[color-mix(in_srgb,var(--fg-success)_30%,transparent)] text-[var(--fg-success)] text-[10px] font-black font-mono">
                    {isAr ? 'مجاني' : 'FREE'}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-shape-xs bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10px] font-black font-mono flex items-center gap-1">
                    <Coins size={11} />
                    <span>PRO (${template.price})</span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] leading-snug">
                {isAr ? template.titleAr : template.titleEn}
              </h2>

              {/* Description */}
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {isAr ? template.descriptionAr : template.descriptionEn}
              </p>

              {/* Creator Attribution Card */}
              <button
                type="button"
                onClick={handleViewCreatorProfile}
                className="w-full p-3 rounded-shape-md bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={template.creatorAvatar}
                    alt={template.creatorName}
                    className="w-9 h-9 rounded-full object-cover border border-[var(--border-default)]"
                  />
                  <div className="text-start">
                    <div className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1 group-hover:text-[var(--accent)] transition-colors">
                      <span>{template.creatorName}</span>
                      <CheckCircle2 size={13} className="text-[var(--fg-success)] fill-[color-mix(in_srgb,var(--fg-success)_15%,transparent)]" />
                    </div>
                    <div className="text-[10px] font-mono font-bold text-[var(--text-muted)]">
                      @{template.creatorUsername}
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-[var(--accent)] flex items-center gap-1 group-hover:underline">
                  <span>{isAr ? 'البروفايل' : 'Profile'}</span>
                  <ArrowUpRight size={13} />
                </span>
              </button>

              {/* Views and Usage stats */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]/60">
                  <div className="text-xs font-mono font-black text-[var(--text-primary)]">{template.viewsCount.toLocaleString()}</div>
                  <div className="text-[9px] text-[var(--text-muted)] font-bold">{isAr ? 'مشاهدة' : 'Views'}</div>
                </div>
                <div className="p-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]/60">
                  <div className="text-xs font-mono font-black text-[var(--text-primary)]">{template.usesCount.toLocaleString()}</div>
                  <div className="text-[9px] text-[var(--text-muted)] font-bold">{isAr ? 'استخدام' : 'Uses'}</div>
                </div>
                <div className="p-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]/60">
                  <div className="text-xs font-mono font-black text-amber-500 flex items-center justify-center gap-0.5">
                    <Star size={11} className="fill-amber-500" />
                    <span>{template.rating}</span>
                  </div>
                  <div className="text-[9px] text-[var(--text-muted)] font-bold">{isAr ? 'تقييم' : 'Rating'}</div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Primary Action Footer */}
        <div className="p-4 border-t border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold text-xs hover:bg-[var(--surface-inset)] transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>

          <button
            type="button"
            onClick={handleUseTemplate}
            className="h-10 px-6 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-black text-xs flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Zap size={15} className="fill-current" />
            <span>{isAr ? 'فتح وتعديل القالب في الاستوديو' : 'Edit & Open Template in Studio'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
