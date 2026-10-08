import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Plus, Trash2, Edit2, Save, X, Loader2, Info, User, AlertTriangle, Sparkles, MessageSquare, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { ActionConfirmationModal } from './ActionConfirmationModal';
import { toast, SelectDropdown } from '@/design-system';

interface Memory {
  id: number;
  fact: string;
  category: string;
  source: 'user' | 'ai' | 'consolidated';
  created_at: string;
  updated_at: string;
  chat_id?: number | string;
  chat_title?: string;
}

interface MemoryCenterProps {
  memories: Memory[];
  isLoading: boolean;
  onAdd: (fact: string, category?: string) => Promise<void>;
  onUpdate: (id: number, fact: string, category?: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onPrune?: () => Promise<void>;
  onRefresh?: () => void;
  dir: 'rtl' | 'ltr';
  theme: 'dark' | 'light' | 'system';
  stickyOffset?: number;
}

export const MemoryCenter: React.FC<MemoryCenterProps> = ({ 
  memories, 
  isLoading, 
  onAdd, 
  onUpdate, 
  onDelete, 
  onPrune,
  onRefresh,
  dir, 
  theme,
  stickyOffset = 0
}) => {
  const { t } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editCategory, setEditCategory] = useState('general');
  const [isPruning, setIsPruning] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [isPruneConfirmOpen, setIsPruneConfirmOpen] = useState(false);
  const [deletingMemory, setDeletingMemory] = useState<Memory | null>(null);

  const categories = [
    { id: 'all', label: t('all') || (dir === 'rtl' ? 'الكل' : 'All') },
    { id: 'identity', label: t('identity') || (dir === 'rtl' ? 'الهوية والشخصية' : 'Identity & Personal') },
    { id: 'technical', label: t('technical') || (dir === 'rtl' ? 'بيئة وتقنيات العمل' : 'Tech Stack') },
    { id: 'preference', label: t('preference') || (dir === 'rtl' ? 'التفضيلات والقواعد' : 'Preferences & Rules') },
    { id: 'project', label: t('project') || (dir === 'rtl' ? 'المشاريع الحالية' : 'Active Projects') },
    { id: 'professional', label: t('professional') || (dir === 'rtl' ? 'المهنة والدور' : 'Role & Profession') },
    { id: 'general', label: t('general') || (dir === 'rtl' ? 'حقائق عامة' : 'General Facts') },
  ];

  const filteredMemories = filterCategory === 'all' 
    ? memories 
    : memories.filter(m => {
        if (filterCategory === 'identity' && (m.category === 'personal' || m.category === 'identity')) return true;
        return m.category === filterCategory;
      });

  const MEMORY_LIMIT = 50;
  const memoryCount = memories.length;
  const isLimitReached = memoryCount >= MEMORY_LIMIT;
  const usagePercentage = Math.min(100, (memoryCount / MEMORY_LIMIT) * 100);

  const handleSaveNew = async () => {
    if (!newValue.trim()) return;
    if (isLimitReached) {
      toast.error(t('memoryLimitReached') || 'Memory limit reached');
      return;
    }
    await onAdd(newValue, newCategory);
    setNewValue('');
    setIsAdding(false);
  };

  const handlePrune = () => {
    if (!onPrune) return;
    setIsPruneConfirmOpen(true);
  };

  const handlePruneConfirm = async () => {
    setIsPruneConfirmOpen(false);
    if (!onPrune) return;
    setIsPruning(true);
    try {
      await onPrune();
    } finally {
      setIsPruning(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMemory) return;
    try {
      await onDelete(deletingMemory.id);
    } finally {
      setDeletingMemory(null);
    }
  };

  const handleSaveEdit = async (id: number) => {
    if (!editValue.trim()) return;
    await onUpdate(id, editValue, editCategory);
    setEditingId(null);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Sticky Top Toolbar */}
      <div 
        className="sticky z-30 pt-2 pb-3 backdrop-blur-md bg-[var(--surface-page)]/90 border-b border-[var(--border-default)] transition-all"
        style={{ top: stickyOffset }}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-[var(--text-primary)]">
              {t('memoryCenter') || (dir === 'rtl' ? 'مركز الذاكرة' : 'Memory Center')}
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">
              {dir === 'rtl' 
                ? 'الحقائق والتفضيلات التي تعلمها المساعد عنك.' 
                : 'Facts and preferences the assistant has learned about you.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button 
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                title={dir === 'rtl' ? 'مزامنة وتحديث الذاكرة' : 'Sync & Refresh Memory'}
                className="flex items-center justify-center p-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--bg-accent-muted)] hover:border-[var(--border-accent)]/20 text-[var(--text-primary)] hover:text-[var(--fg-accent)] transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin text-[var(--fg-accent)]' : ''} />
              </button>
            )}
            <button 
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex items-center justify-center gap-1 px-4 py-2 bg-[var(--accent)] hover:opacity-90 text-[var(--fg-on-emphasis)] rounded-[var(--radius-sm)] font-bold text-xs transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>{t('addFact') || (dir === 'rtl' ? 'إضافة حقيقة' : 'Add Fact')}</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map((cat, cIdx) => (
            <button
              key={`mem-cat-btn-${cat.id}-${cIdx}`}
              type="button"
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1 rounded-[var(--radius-xs)] text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer border ${
                filterCategory === cat.id
                  ? 'bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border-[var(--border-accent)]/30'
                  : 'bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-accent-muted)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Memory Capacity Indicator */}
        <div 
          className={`p-3 rounded-[var(--radius-sm)] border transition-all mt-2.5 ${
            isLimitReached 
              ? 'bg-amber-500/5 border-amber-500/30'
              : 'bg-[var(--surface-card)] border-[var(--border-default)]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-[var(--radius-xs)] flex items-center justify-center shrink-0 ${
                isLimitReached ? 'bg-amber-500/20 text-amber-400' : 'bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]/20'
              }`}>
                <BrainCircuit size={14} />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[var(--text-primary)] leading-tight">{t('memoryCapacity') || (dir === 'rtl' ? 'سعة الذاكرة' : 'Memory Capacity')}</h3>
                <p className="text-[10px] text-[var(--text-muted)] font-bold">
                  {memoryCount} / {MEMORY_LIMIT} {dir === 'rtl' ? 'حقائق' : 'facts'}
                </p>
              </div>
            </div>
            
            {isLimitReached && (
              <button 
                type="button"
                onClick={handlePrune}
                disabled={isPruning}
                className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-[var(--radius-xs)] text-[10px] font-bold border border-amber-500/30 cursor-pointer transition-all"
              >
                {isPruning ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                <span>{t('prune') || (dir === 'rtl' ? 'تنظيف' : 'Prune')}</span>
              </button>
            )}
          </div>

          <div className="w-full h-1.5 bg-[var(--surface-subtle)] rounded-full overflow-hidden border border-[var(--border-default)]">
            <motion.div 
              className={`h-full rounded-full ${
                isLimitReached ? 'bg-amber-500' : 'bg-[var(--accent)]'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${usagePercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {isLimitReached && (
            <div className="mt-2 flex items-start gap-1">
              <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-400/90 leading-relaxed font-medium">
                {dir === 'rtl' 
                  ? 'وصلت للحد الأقصى. يرجى تنظيف الذاكرة للمتابعة.' 
                  : 'Memory full. Please prune to continue.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Auto-update Indicator */}
      <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--border-accent)]/20 bg-[var(--bg-accent-muted)] flex items-start gap-2">
        <Info className="text-[var(--fg-accent)] shrink-0 mt-0.5" size={15} />
        <p className="text-[11px] sm:text-xs text-[var(--text-muted)] leading-relaxed font-medium">
          {dir === 'rtl' 
            ? 'يقوم المساعد بتحديث هذه الذاكرة تلقائياً (AI)، ويمكنك إضافة حقائق بنفسك (User).' 
            : 'Assistant updates memory automatically (AI), or you can add facts manually (User).'}
        </p>
      </div>

      {/* Add New Memory Card */}
      {isAdding && (
        <div className="p-4 sm:p-5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <SelectDropdown
                size="sm"
                label={t('category') || (dir === 'rtl' ? 'التصنيف' : 'Category')}
                value={newCategory}
                onChange={(val) => setNewCategory(val)}
                dir={dir}
                options={categories.filter(c => c.id !== 'all').map(cat => ({
                  value: cat.id,
                  label: cat.label
                }))}
              />
            </div>
          </div>
          <textarea
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={dir === 'rtl' ? 'ما الذي يجب أن يتذكره المساعد؟' : 'What should the assistant remember?'}
            className="w-full p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] resize-none h-24 text-xs"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button 
              type="button"
              onClick={() => { setIsAdding(false); setNewValue(''); }}
              className="px-4 py-1.5 rounded-[var(--radius-sm)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-all cursor-pointer"
            >
              {t('cancel') || (dir === 'rtl' ? 'إلغاء' : 'Cancel')}
            </button>
            <button 
              type="button"
              onClick={handleSaveNew}
              disabled={!newValue.trim()}
              className="px-4 py-1.5 rounded-[var(--radius-sm)] text-xs font-bold bg-[var(--accent)] hover:opacity-90 text-[var(--fg-on-emphasis)] transition-all disabled:opacity-50 cursor-pointer"
            >
              {t('save') || (dir === 'rtl' ? 'حفظ' : 'Save')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 text-[var(--fg-accent)] animate-spin" />
          <p className="text-xs text-[var(--text-muted)] animate-pulse">{t('loadingMemory') || (dir === 'rtl' ? 'جاري تحميل الذاكرة...' : 'Loading memory...')}</p>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="p-10 rounded-[var(--radius-md)] border border-dashed border-[var(--border-default)] bg-[var(--surface-card)] flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-[var(--radius-sm)] bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]/20 flex items-center justify-center mb-4">
            <BrainCircuit size={28} />
          </div>
          <h3 className="text-sm font-bold mb-1 text-[var(--text-primary)]">{t('noResults') || (dir === 'rtl' ? 'لا توجد عناصر' : 'No memories found')}</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm leading-relaxed">
            {dir === 'rtl' 
              ? 'لا توجد حقائق في هذا التصنيف حالياً.' 
              : 'No facts found in this category yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMemories.map((memory, mIdx) => (
            <div 
              key={`mem-item-${memory.id || mIdx}-${mIdx}`} 
              className="group p-4 sm:p-5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--border-accent)]/20 transition-all"
            >
              {editingId === memory.id ? (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <SelectDropdown
                        size="sm"
                        value={editCategory}
                        onChange={(val) => setEditCategory(val)}
                        dir={dir}
                        options={categories.filter(c => c.id !== 'all').map(cat => ({
                          value: cat.id,
                          label: cat.label
                        }))}
                      />
                    </div>
                  </div>
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full p-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-accent)] resize-none h-24 text-xs"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button 
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-all cursor-pointer"
                    >
                      <X size={13} />
                      <span>{t('cancel') || (dir === 'rtl' ? 'إلغاء' : 'Cancel')}</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleSaveEdit(memory.id)}
                      disabled={!editValue.trim()}
                      className="flex items-center gap-1 px-3.5 py-1.5 bg-[var(--accent)] hover:opacity-90 text-[var(--fg-on-emphasis)] rounded-[var(--radius-sm)] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Save size={13} />
                      <span>{t('save') || (dir === 'rtl' ? 'حفظ' : 'Save')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-2 flex-wrap">
                      {memory.source === 'user' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-xs)] bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase tracking-wider">
                          <User size={10} />
                          {dir === 'rtl' ? 'بواسطة المستخدم' : 'User Added'}
                        </span>
                      ) : memory.source === 'consolidated' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-xs)] bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold uppercase tracking-wider">
                          <Sparkles size={10} />
                          {dir === 'rtl' ? 'ملخص مدمج' : 'Consolidated Summary'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-xs)] bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]/20 text-[9px] font-bold uppercase tracking-wider">
                          <BrainCircuit size={10} />
                          {dir === 'rtl' ? 'تعلم آلي' : 'AI Learned'}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-[var(--radius-xs)] text-[9px] font-bold uppercase tracking-wider bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-muted)]">
                        {categories.find(c => c.id === memory.category)?.label || memory.category}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-[var(--text-primary)] font-medium" dir="auto">
                      {memory.fact}
                    </p>
                    <div className="text-[10px] text-[var(--text-muted)] mt-2 flex items-center flex-wrap gap-1">
                      <span>
                        {new Date(memory.created_at).toLocaleString(dir === 'rtl' ? 'ar-EG' : 'en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {memory.updated_at !== memory.created_at && (
                        <>
                          <span className="opacity-40">•</span>
                          <span>{dir === 'rtl' ? 'تم التعديل' : 'Updated'}</span>
                        </>
                      )}
                      {memory.chat_id && (
                        <>
                          <span className="opacity-40">•</span>
                          <Link 
                            to={`/chat/${memory.chat_id}`}
                            className="inline-flex items-center gap-1 text-[var(--fg-accent)] hover:text-[var(--fg-accent)] font-bold hover:underline"
                            title={dir === 'rtl' ? 'انتقال إلى المحادثة المصدر' : 'Go to source thread'}
                          >
                            <MessageSquare size={10} />
                            <span>
                              {dir === 'rtl' ? 'المصدر: ' : 'Source: '}
                              "{memory.chat_title || `#${memory.chat_id}`}"
                            </span>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-all shrink-0">
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingId(memory.id);
                        setEditValue(memory.fact);
                        setEditCategory(memory.category);
                      }}
                      className="p-1.5 rounded-[var(--radius-xs)] text-[var(--text-muted)] hover:text-[var(--fg-accent)] hover:bg-[var(--bg-accent-muted)] transition-all cursor-pointer"
                      title={dir === 'rtl' ? 'تعديل' : 'Edit'}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDeletingMemory(memory)}
                      className="p-1.5 rounded-[var(--radius-xs)] text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title={dir === 'rtl' ? 'حذف' : 'Delete'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reusable Memory Prune Confirmation Modal */}
      <ActionConfirmationModal
        isOpen={isPruneConfirmOpen}
        onClose={() => setIsPruneConfirmOpen(false)}
        onConfirm={handlePruneConfirm}
        variant="danger"
        title={{
          ar: 'تطهير سعة الذاكرة؟',
          en: 'Prune Memory Capacity?'
        }}
        description={{
          ar: 'سيتم حذف أقدم 10 حقائق أو معلومات مسجلة كليا لتحرير سعة إضافية بشكل فوري. لا يمكن التراجع عن هذا الإجراء.',
          en: 'This will permanently discard the 10 oldest remembered facts or settings to reclaim storage immediately. This process cannot be undone.'
        }}
        confirmLabel={{
          ar: 'تطهير وتحرير السعة',
          en: 'Prune & Reclaim'
        }}
      />

      {/* Reusable Individual Memory Delete Confirmation Modal */}
      <ActionConfirmationModal
        isOpen={!!deletingMemory}
        onClose={() => setDeletingMemory(null)}
        onConfirm={handleDeleteConfirm}
        variant="danger"
        title={{
          ar: 'حذف هذه الحقيقة؟',
          en: 'Delete this fact?'
        }}
        description={{
          ar: 'هل أنت متأكد من رغبتك في إزالة هذه الحقيقة المعينة من ذاكرة المساعد الذكي؟',
          en: 'Are you sure you want to discard this specific fact from the smart assistant\'s memory base?'
        }}
        extraContent={deletingMemory ? (
          <div className="p-3 rounded-[var(--radius-sm)] text-xs leading-relaxed break-all text-start border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] italic">
            "{deletingMemory.fact}"
          </div>
        ) : undefined}
      />
    </div>
  );
};

