import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sliders, X, Check, Save, Tag, DollarSign, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface RecommendationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const CATEGORY_OPTIONS = [
  { id: 'development', name_en: 'Software Development & Scripts', name_ar: 'تطوير البرمجيات والسكربتات' },
  { id: 'design', name_en: 'UI/UX & Graphic Design', name_ar: 'التصميم والواجهات والتجربة' },
  { id: 'ai_tools', name_en: 'AI & Automation Tools', name_ar: 'أدوات الذكاء الاصطناعي والأتمتة' },
  { id: 'marketing', name_en: 'Digital Marketing & Growth', name_ar: 'التسويق الرقمي وإدارة الحملات' },
  { id: 'services', name_en: 'Professional Freelance Services', name_ar: 'الخدمات المهنية والمستقلة' },
  { id: 'real_estate', name_en: 'Listings & Opportunities', name_ar: 'العقارات والفرص التجارية' },
  { id: 'business', name_en: 'Business Plans & Strategy', name_ar: 'خطط الأعمال والإستراتيجيات' },
  { id: 'content', name_en: 'Articles, Research & Guides', name_ar: 'المقالات والبحوث والأدلة' },
];

export const RecommendationPreferencesModal: React.FC<RecommendationPreferencesModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const { language, token } = useAppContext();
  const isRtl = language === 'ar';

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && token) {
      fetchPreferences();
    }
  }, [isOpen, token]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/recommendations/preferences', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.preferences) {
        setSelectedCategories(data.preferences.preferred_categories || []);
        if (data.preferences.preferred_price_range?.max) {
          setMaxPrice(data.preferences.preferred_price_range.max);
        }
      }
    } catch (err) {
      console.error('[RecommendationPreferencesModal] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/recommendations/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          preferred_categories: selectedCategories,
          preferred_price_range: { min: 0, max: maxPrice }
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(isRtl ? 'تم حفظ تفضيلات التوصيات بنجاح' : 'Preferences saved successfully');
        if (onSaved) onSaved();
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error('[RecommendationPreferencesModal] Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto overscroll-contain"
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 sm:p-6 shadow-2xl relative overflow-hidden text-[var(--text-primary)] my-auto transform-gpu"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-shape-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                <Sliders size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
                  {isRtl ? 'تخصيص تفضيلات التوصيات' : 'Customize Recommendations'}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] font-medium">
                  {isRtl ? 'حدّد المجالات والنطاق السعري لضبط المقترحات بدقة' : 'Select categories & budget limits to tune your recommendations'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] active:scale-95 transition-theme cursor-pointer"
              title={isRtl ? 'إغلاق' : 'Close'}
            >
              <X size={15} />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-accent">
              <RefreshCw size={24} className="animate-spin" />
              <span className="text-xs text-[var(--text-muted)] font-bold">{isRtl ? 'جاري تحميل التفضيلات...' : 'Loading preferences...'}</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 mb-2">
                  <Tag size={14} className="text-accent" />
                  <span>{isRtl ? 'مجالات الاهتمام المفضّلة' : 'Preferred Categories'}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto custom-scrollbar p-0.5">
                  {CATEGORY_OPTIONS.map(cat => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleToggleCategory(cat.id)}
                        className={`flex items-center justify-between p-2.5 rounded-shape-sm border text-xs font-bold transition-all text-start cursor-pointer active:scale-98 ${
                          isSelected
                            ? 'bg-accent/10 text-accent border-accent/40 shadow-xs'
                            : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-accent/20'
                        }`}
                      >
                        <span className="truncate">{isRtl ? cat.name_ar : cat.name_en}</span>
                        {isSelected && <Check size={14} className="shrink-0 text-accent" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div className="pt-2 border-t border-[var(--border-default)]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <DollarSign size={14} className="text-accent" />
                    <span>{isRtl ? 'الحد الأقصى للميزانية' : 'Maximum Budget Limit'}</span>
                  </label>
                  <span className="px-2 py-0.5 rounded-shape-xs bg-accent/10 border border-accent/20 text-accent font-black text-xs">
                    ${maxPrice} USD
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="10000"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-semibold mt-0.5">
                  <span>$50 USD</span>
                  <span>$10,000+ USD</span>
                </div>
              </div>

              {/* Success Alert */}
              {successMsg && (
                <div className="p-2.5 rounded-shape-sm bg-[var(--fg-success)]/10 border border-[var(--fg-success)]/30 text-xs font-bold text-[var(--fg-success)] flex items-center gap-2">
                  <Check size={14} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 min-h-[38px] rounded-shape-sm border border-[var(--border-default)] hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-xs transition-theme cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 min-h-[38px] rounded-shape-sm bg-accent text-white hover:opacity-90 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  <span>{isRtl ? 'حفظ التفضيلات' : 'Save Preferences'}</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
