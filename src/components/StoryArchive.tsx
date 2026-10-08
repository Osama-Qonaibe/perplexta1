import React, { useState, useEffect } from 'react';
import { Archive, RotateCcw, Trash2, Loader2, Play, Image as ImageIcon } from 'lucide-react';
import { getMediaUrl } from '../utils/mediaUtils';
import { useConfirm } from '@/design-system';

interface StoryArchiveProps {
  dir: 'rtl' | 'ltr';
  token: string | null;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const StoryArchive: React.FC<StoryArchiveProps> = ({ dir, token, showToast }) => {
  const confirmDialog = useConfirm();
  const [archivedStories, setArchivedStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArchivedStories = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/bulletin/ads/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.ads) {
        const now = new Date().getTime();
        const expired = data.ads.filter((ad: any) => 
          ad.ad_format === 'story' && 
          ad.expires_at && 
          new Date(ad.expires_at).getTime() < now
        );
        setArchivedStories(expired);
      }
    } catch (err) {
      console.error('Failed to fetch archived stories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedStories();
  }, [token]);

  const handleReshare = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/bulletin/stories/${id}/reshare`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (showToast) showToast(dir === 'rtl' ? 'تمت إعادة نشر القصة بنجاح' : 'Story reshared successfully');
        fetchArchivedStories();
      } else {
        if (showToast) showToast(data.error || 'فشل النشر', 'error');
      }
    } catch (err) {
      if (showToast) showToast('حدث خطأ', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    const isConfirmed = await confirmDialog({
      title: dir === 'rtl' ? 'حذف القصة' : 'Delete Story',
      description: dir === 'rtl' ? 'هل أنت متأكد من حذف هذه القصة؟' : 'Are you sure you want to delete this story?',
      variant: 'danger',
      confirmLabel: dir === 'rtl' ? 'حذف' : 'Delete'
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/bulletin/ads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (showToast) showToast(dir === 'rtl' ? 'تم الحذف' : 'Deleted successfully');
        setArchivedStories(prev => prev.filter(s => s.id !== id));
      } else {
        if (showToast) showToast(data.error || 'فشل الحذف', 'error');
      }
    } catch (err) {
      if (showToast) showToast('حدث خطأ', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin text-[var(--text-muted)]" size={24} />
      </div>
    );
  }

  if (archivedStories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 bg-[var(--surface-subtle)] rounded-[var(--radius-sm)] border border-[var(--border-default)] text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--surface-card)] flex items-center justify-center mb-3 text-[var(--text-muted)] border border-[var(--border-default)]">
          <Archive size={20} />
        </div>
        <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mb-1">
          {dir === 'rtl' ? 'لا توجد قصص مؤرشفة' : 'No Archived Stories'}
        </h3>
        <p className="text-[11px] text-[var(--text-muted)] max-w-sm leading-relaxed">
          {dir === 'rtl' 
            ? 'ستظهر هنا القصص التي انتهت مدة عرضها (24 ساعة)، لتتمكن من إعادة نشرها أو حذفها.' 
            : 'Stories that have expired (after 24 hours) will appear here for you to reshare or delete.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {archivedStories.map((story, sIdx) => (
        <div key={`archived-story-${story.id || sIdx}-${sIdx}`} className="relative aspect-[9/16] rounded-[var(--radius-sm)] overflow-hidden bg-black group border border-[var(--border-default)] shadow-xs">
          {story.video_url ? (
            <video 
              src={getMediaUrl(story.video_url)} 
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <img 
              src={getMediaUrl(story.image_url)} 
              alt="Archived story"
              className="w-full h-full object-cover opacity-60"
            />
          )}
          
          <div className="absolute top-2 left-2 p-1.5 rounded-full bg-black/50 backdrop-blur-xs z-10">
            {story.video_url ? <Play size={12} className="text-white" /> : <ImageIcon size={12} className="text-white" />}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-2.5">
            <span className="text-white/80 text-[9px] mb-2 font-bold flex items-center gap-1">
              <Archive size={11} />
              {new Date(story.created_at).toLocaleDateString(dir === 'rtl' ? 'ar-EG' : 'en-US')}
            </span>
            
            <div className="flex gap-1 w-full">
              <button 
                onClick={() => handleReshare(story.id)}
                className="flex-1 py-1.5 bg-[var(--accent)] hover:opacity-90 text-[var(--fg-on-emphasis)] rounded-[var(--radius-xs)] text-[10px] font-bold flex justify-center items-center gap-1 transition-all cursor-pointer"
                title={dir === 'rtl' ? 'إعادة نشر' : 'Reshare'}
              >
                <RotateCcw size={12} />
              </button>
              <button 
                onClick={() => handleDelete(story.id)}
                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-[var(--radius-xs)] text-[10px] font-bold flex justify-center items-center gap-1 transition-all cursor-pointer"
                title={dir === 'rtl' ? 'حذف نهائي' : 'Delete'}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
