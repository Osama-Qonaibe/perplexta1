import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bookmark, MessageSquare, Edit3, Settings, BellOff, Bell,
  Handshake, Languages, Info, Calendar, Code, Archive,
  Trash2, EyeOff, Flag, Copy, Check, X, Sparkles,
  Users, Globe, Lock, CheckCircle2, Loader2
} from 'lucide-react';
import { BulletinAd } from '../../server/db/types';
import { toast } from '@/design-system';
import { SCROLL_STYLES, HOVER_STYLES } from '../styles/scrollStyles';

export interface PostOptionsMenuProps {
  ad: BulletinAd;
  user: any;
  token?: string | null;
  isRtl: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSaveAd?: (ad: BulletinAd) => void;
  onEditAd?: (ad: BulletinAd) => void;
  onArchiveAd?: (ad: BulletinAd) => void;
  onTrashAd?: (ad: BulletinAd) => void;
  onUpdateAd?: (updatedAd: Partial<BulletinAd> & { id: number }) => void;
  onReportAd?: (ad: BulletinAd) => void;
  onHideAd?: (adId: number) => void;
  onBoostAd?: (ad: BulletinAd) => void;
  dropdownAlign?: 'left' | 'right';
  className?: string;
}

type ActiveModal =
  | 'who_can_comment'
  | 'audience'
  | 'partnership'
  | 'ai_content'
  | 'edit_date'
  | 'embed'
  | 'archive_confirm'
  | 'trash_confirm'
  | 'report'
  | null;

const REPORT_CATEGORIES = [
  {
    id: 'fraud',
    titleAr: 'احتيال، سكام أو عروض مضللة',
    titleEn: 'Fraud, Scam or Misleading Offers',
    descAr: 'إعلانات وهمية، طلبات أموال غير مشروعة، أو روابط صيد وتضليل تجاري',
    descEn: 'Fake ads, illegal money requests, or phishing and scam links',
    icon: '🛡️'
  },
  {
    id: 'hate_speech',
    titleAr: 'خطاب كراهية، تنمر أو مضايقة',
    titleEn: 'Hate Speech, Bullying or Harassment',
    descAr: 'إساءة موجهة، تنمر شخصي، شتم، أو تحريض على أفراد أو جماعات',
    descEn: 'Targeted abuse, personal bullying, or incitement against individuals or groups',
    icon: '⚠️'
  },
  {
    id: 'violence',
    titleAr: 'عنف، تهديد أو محتوى خطير',
    titleEn: 'Violence, Threat or Dangerous Content',
    descAr: 'مشاهد عنف جسدي، تهديد بالخدمات، أو التحريض على أفعال خطرة',
    descEn: 'Physical violence scenes, threats, or incitement to dangerous activities',
    icon: '🚫'
  },
  {
    id: 'adult',
    titleAr: 'محتوى غير لائق أو مخل بالآداب',
    titleEn: 'Inappropriate or Adult Content',
    descAr: 'صور، مقاطع فيديو، أو نصوص تخالف الذوق العام والتعليمات الأخلاقية للمنصة',
    descEn: 'Photos, videos, or texts violating community moral standards',
    icon: '🔞'
  },
  {
    id: 'misinformation',
    titleAr: 'معلومات مضللة أو إشاعات كاذبة',
    titleEn: 'Misinformation or Fake News',
    descAr: 'ادعاءات مفبركة، تزوير للحقائق، أو نشر إشاعات لإثارة الفتنة والخداع',
    descEn: 'Fabricated claims, altered facts, or spreading rumors to deceive',
    icon: '📰'
  },
  {
    id: 'copyright',
    titleAr: 'انتهاك حقوق الملكية الفكرية والعلامة',
    titleEn: 'Intellectual Property Violation',
    descAr: 'انتحال شخصية، استخدام شعارات بدون إذن، أو سرقة وتكرار محتوى مملوك',
    descEn: 'Impersonation, unauthorized brand logos, or stolen copyrighted content',
    icon: '⚖️'
  },
  {
    id: 'other',
    titleAr: 'سبب آخر (اذكر التفاصيل للرقابة)',
    titleEn: 'Other Reason (Specify details for moderation)',
    descAr: 'أي أسباب وملاحظات أخرى تنتهك سياسات شروط الاستخدام لمنصة بيربليكستا',
    descEn: 'Any other reasons violating platform terms and conditions',
    icon: '📝'
  }
];

const menuVariants = {
  closed: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.08, ease: [0.16, 1, 0.3, 1] as any }
  },
  open: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.10, ease: [0.16, 1, 0.3, 1] as any }
  }
};

export const PostOptionsMenu: React.FC<PostOptionsMenuProps> = ({
  ad,
  user,
  token,
  isRtl,
  isOpen,
  onClose,
  onSaveAd,
  onEditAd,
  onArchiveAd,
  onTrashAd,
  onUpdateAd,
  onReportAd,
  onHideAd,
  dropdownAlign,
  className = ''
}) => {
  const isOwner = Boolean(
    user?.id && (
      user.id === ad.user_id ||
      ((ad as any).page_owner_id && user.id === (ad as any).page_owner_id) ||
      ((ad as any).owner_id && user.id === (ad as any).owner_id) ||
      user.role === 'admin' ||
      user.role === 'superadmin' ||
      user.is_admin === true
    )
  );
  
  const [isSaved, setIsSaved] = useState(Boolean(ad.user_has_saved));
  const [isMuted, setIsMuted] = useState(Boolean(ad.is_muted_notifications));
  const [allowTranslation, setAllowTranslation] = useState(ad.allow_translation !== false);
  const [isAiGenerated, setIsAiGenerated] = useState(Boolean(ad.is_ai_generated));
  const [whoCanComment, setWhoCanComment] = useState(ad.who_can_comment || 'anyone');
  const [audience, setAudience] = useState(ad.audience || 'public');
  const [partnershipCode, setPartnershipCode] = useState(ad.partnership_code || '');
  const [partnershipBrand, setPartnersBrand] = useState(ad.partnership_brand || '');
  const [isPartnership, setIsPartnership] = useState(Boolean(ad.is_partnership));
  const [dateInput, setDateInput] = useState(() => {
    try {
      const d = new Date(ad.created_at || Date.now());
      return d.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  });

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [reportReason, setReportReason] = useState('fraud');
  const [reportDetails, setReportDetails] = useState('');

  const handleSendReport = async () => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً للإبلاغ عن المحتوى' : 'Please log in first to report content');
      return;
    }
    const catObj = REPORT_CATEGORIES.find(c => c.id === reportReason) || REPORT_CATEGORIES[0];
    const categoryTitle = isRtl ? catObj.titleAr : catObj.titleEn;

    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/bulletin/ads/${ad.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: categoryTitle,
          details: reportDetails.trim() || undefined
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(
          data.message ||
          (isRtl
            ? 'تم إرسال بلاغك بنجاح للرقابة والإدارة، وسيتم اتخاذ الإجراء المناسب'
            : 'Report submitted successfully to administration')
        );
        if (onReportAd) onReportAd(ad);
        setActiveModal(null);
        setReportDetails('');
      } else {
        toast.error(data.error || (isRtl ? 'فشل إرسال البلاغ' : 'Failed to submit report'));
      }
    } catch (err) {
      toast.error(isRtl ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
    } finally {
      setIsActionLoading(false);
    }
  };

  useEffect(() => {
    setIsSaved(Boolean(ad.user_has_saved));
    setIsMuted(Boolean(ad.is_muted_notifications));
    setAllowTranslation(ad.allow_translation !== false);
    setIsAiGenerated(Boolean(ad.is_ai_generated));
    setWhoCanComment(ad.who_can_comment || 'anyone');
    setAudience(ad.audience || 'public');
    setPartnershipCode(ad.partnership_code || '');
    setPartnersBrand(ad.partnership_brand || '');
    setIsPartnership(Boolean(ad.is_partnership));
  }, [ad]);

  if (!isOpen && !activeModal) return null;

  const handleToggleSave = async () => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }
    if (onSaveAd) {
      onSaveAd(ad);
      setIsSaved(!isSaved);
      onClose();
      return;
    }
    try {
      setIsActionLoading(true);
      const res = await fetch(`/api/bulletin/ads/${ad.id}/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIsSaved(data.saved);
        toast.success(data.message);
        onUpdateAd?.({ id: ad.id, user_has_saved: data.saved });
      } else {
        toast.error(data.error || (isRtl ? 'فشل حفظ المنشور' : 'Failed to save post'));
      }
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء حفظ المنشور' : 'Error saving post');
    } finally {
      setIsActionLoading(false);
      onClose();
    }
  };

  const handleToggleNotifications = async () => {
    if (!token) {
      toast.error(isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first');
      return;
    }
    try {
      setIsActionLoading(true);
      const res = await fetch(`/api/bulletin/ads/${ad.id}/toggle-notifications`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIsMuted(data.is_muted);
        toast.success(data.message);
        onUpdateAd?.({ id: ad.id, is_muted_notifications: data.is_muted });
      } else {
        toast.error(data.error || (isRtl ? 'فشل تغيير الإعدادات' : 'Failed to change settings'));
      }
    } catch {
      toast.error(isRtl ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setIsActionLoading(false);
      onClose();
    }
  };

  const handleSaveWhoCanComment = async (val: string) => {
    if (!token) return;
    try {
      setIsActionLoading(true);
      const res = await fetch(`/api/bulletin/ads/${ad.id}/who-can-comment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ who_can_comment: val })
      });
      const data = await res.json();
      if (data.success) {
        setWhoCanComment(val);
        toast.success(data.message || (isRtl ? 'تم تحديث إعدادات التعليق' : 'Comment settings updated'));
        onUpdateAd?.({ id: ad.id, who_can_comment: val });
        setActiveModal(null);
      } else {
        toast.error(data.error || (isRtl ? 'فشل الحفظ' : 'Failed to save'));
      }
    } catch {
      toast.error(isRtl ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveAudience = async (val: string) => {
    if (!token) return;
    try {
      setIsActionLoading(true);
      const res = await fetch(`/api/bulletin/ads/${ad.id}/audience`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ audience: val })
      });
      const data = await res.json();
      if (data.success) {
        setAudience(val);
        toast.success(data.message || (isRtl ? 'تم تعديل جمهور المنشور' : 'Audience updated'));
        onUpdateAd?.({ id: ad.id, audience: val });
        setActiveModal(null);
      } else {
        toast.error(data.error || (isRtl ? 'فشل التعديل' : 'Failed to update'));
      }
    } catch {
      toast.error(isRtl ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSavePartnership = async () => {
    if (!token) return;
    try {
      setIsActionLoading(true);
      const res = await fetch(`/api/bulletin/ads/${ad.id}/partnership-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          partnership_code: partnershipCode,
          is_partnership: isPartnership,
          partnership_brand: partnershipBrand
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || (isRtl ? 'تم حفظ بيانات الشراكة' : 'Partnership saved'));
        onUpdateAd?.({
          id: ad.id,
          partnership_code: data.partnership_code,
          is_partnership: data.is_partnership,
          partnership_brand: data.partnership_brand
        });
        setActiveModal(null);
      } else {
        toast.error(data.error || (isRtl ? 'فشل الحفظ' : 'Failed to save'));
      }
    } catch {
      toast.error(isRtl ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleTranslation = async () => {
    if (!token) return;
    try {
      setIsActionLoading(true);
      const newVal = !allowTranslation;
      const res = await fetch(`/api/bulletin/ads/${ad.id}/toggle-translation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ allow_translation: newVal })
      });
      const data = await res.json();
      if (data.success) {
        setAllowTranslation(data.allow_translation);
        toast.success(data.message);
        onUpdateAd?.({ id: ad.id, allow_translation: data.allow_translation });
      }
    } catch {
      toast.error(isRtl ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setIsActionLoading(false);
      onClose();
    }
  };

  const handleToggleAi = async (forcedVal?: boolean) => {
    if (!token) return;
    try {
      setIsActionLoading(true);
      const newVal = forcedVal !== undefined ? forcedVal : !isAiGenerated;
      const res = await fetch(`/api/bulletin/ads/${ad.id}/toggle-ai`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_ai_generated: newVal })
      });
      const data = await res.json();
      if (data.success) {
        setIsAiGenerated(data.is_ai_generated);
        toast.success(data.message);
        onUpdateAd?.({ id: ad.id, is_ai_generated: data.is_ai_generated });
        setActiveModal(null);
      }
    } catch {
      toast.error(isRtl ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveDate = async () => {
    if (!token || !dateInput) return;
    try {
      setIsActionLoading(true);
      const iso = new Date(dateInput).toISOString();
      const res = await fetch(`/api/bulletin/ads/${ad.id}/date`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ created_at: iso })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || (isRtl ? 'تم تحديث تاريخ المنشور' : 'Date updated'));
        onUpdateAd?.({ id: ad.id, created_at: iso });
        setActiveModal(null);
      } else {
        toast.error(data.error || (isRtl ? 'فشل تحديث التاريخ' : 'Failed to update date'));
      }
    } catch {
      toast.error(isRtl ? 'تاريخ غير صالح' : 'Invalid date');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!token) return;
    try {
      setIsActionLoading(true);
      const res = await fetch(`/api/bulletin/ads/${ad.id}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        if (onArchiveAd) {
          onArchiveAd(ad);
        } else {
          onUpdateAd?.({ id: ad.id, status: 'archived' });
        }
        setActiveModal(null);
        onClose();
      } else {
        toast.error(data.error || (isRtl ? 'فشل نقل المنشور إلى الأرشيف' : 'Failed to archive post'));
      }
    } catch {
      toast.error(isRtl ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmTrash = async () => {
    if (!token) return;
    try {
      setIsActionLoading(true);
      const res = await fetch(`/api/bulletin/ads/${ad.id}/trash`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        if (onTrashAd) {
          onTrashAd(ad);
        } else {
          onUpdateAd?.({ id: ad.id, status: 'trash' });
        }
        setActiveModal(null);
        onClose();
      } else {
        toast.error(data.error || (isRtl ? 'فشل نقل المنشور إلى سلة المهملات' : 'Failed to trash post'));
      }
    } catch {
      toast.error(isRtl ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const embedCode = `<iframe src="${window.location.origin}/viralbook?embed=1&ad=${ad.id}" width="500" height="650" frameborder="0" scrolling="no" allowtransparency="true" style="border:none;overflow:hidden;border-radius:16px;max-width:100%;"></iframe>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    toast.success(isRtl ? 'تم نسخ رمز التضمين إلى الحافظة' : 'Embed code copied to clipboard');
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const copyPartnershipCode = () => {
    const code = partnershipCode || `PRP-PARTNER-AD-${ad.id}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success(isRtl ? 'تم نسخ رمز الشراكة' : 'Partnership code copied');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const alignClass = dropdownAlign === 'right'
    ? 'right-0'
    : dropdownAlign === 'left'
    ? 'left-0'
    : isRtl ? 'left-0' : 'right-0';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        />
      )}

      <AnimatePresence>
        {isOpen && (() => {
          const ownerMainItems = [
            {
              id: 'save',
              label: isSaved
                ? (isRtl ? 'إلغاء حفظ المنشور' : 'Unsave post')
                : (isRtl ? 'حفظ المنشور' : 'Save post'),
              icon: Bookmark,
              iconColor: isSaved ? 'text-accent fill-accent' : 'text-[var(--text-muted)]',
              action: handleToggleSave
            },
            {
              id: 'comments',
              label: isRtl ? 'من يمكنه التعليق على المنشور؟' : 'Who can comment on this post?',
              icon: MessageSquare,
              action: () => {
                onClose();
                setActiveModal('who_can_comment');
              }
            },
            {
              id: 'edit',
              label: isRtl ? 'تعديل المنشور' : 'Edit post',
              icon: Edit3,
              action: () => {
                onClose();
                if (onEditAd) onEditAd(ad);
              }
            },
            {
              id: 'audience',
              label: isRtl ? 'تعديل الجمهور' : 'Edit audience',
              icon: Settings,
              action: () => {
                onClose();
                setActiveModal('audience');
              }
            },
            {
              id: 'notifications',
              label: isMuted
                ? (isRtl ? 'تشغيل الإشعارات' : 'Turn on notifications')
                : (isRtl ? 'إيقاف الإشعارات' : 'Turn off notifications'),
              icon: isMuted ? Bell : BellOff,
              iconColor: isMuted ? 'text-accent' : 'text-[var(--text-muted)]',
              action: handleToggleNotifications
            },
            {
              id: 'partnership',
              label: isRtl ? 'رمز إعلان الشراكة' : 'Partnership ad code',
              icon: Handshake,
              action: () => {
                onClose();
                setActiveModal('partnership');
              }
            },
            {
              id: 'translation',
              label: allowTranslation
                ? (isRtl ? 'إيقاف الترجمة' : 'Turn off translation')
                : (isRtl ? 'تشغيل الترجمة' : 'Turn on translation'),
              icon: Languages,
              action: handleToggleTranslation
            },
            {
              id: 'ai_content',
              label: isRtl ? 'محتوى ذكاء اصطناعي' : 'AI content details',
              icon: Info,
              action: () => {
                onClose();
                setActiveModal('ai_content');
              }
            },
            {
              id: 'date',
              label: isRtl ? 'تعديل التاريخ' : 'Edit date',
              icon: Calendar,
              action: () => {
                onClose();
                setActiveModal('edit_date');
              }
            },
            {
              id: 'embed',
              label: isRtl ? 'تضمين المنشور' : 'Embed post',
              icon: Code,
              action: () => {
                onClose();
                setActiveModal('embed');
              }
            }
          ];

          const ownerBottomItems = [
            {
              id: 'archive',
              label: isRtl ? 'نقل إلى الأرشيف' : 'Move to archive',
              icon: Archive,
              action: () => {
                onClose();
                setActiveModal('archive_confirm');
              }
            },
            {
              id: 'trash',
              label: isRtl ? 'نقل إلى سلة المهملات' : 'Move to trash',
              icon: Trash2,
              isDestructive: true,
              action: () => {
                onClose();
                setActiveModal('trash_confirm');
              }
            }
          ];

          const guestMainItems = [
            {
              id: 'save',
              label: isSaved
                ? (isRtl ? 'إلغاء حفظ المنشور' : 'Unsave post')
                : (isRtl ? 'حفظ المنشور' : 'Save post'),
              icon: Bookmark,
              iconColor: isSaved ? 'text-accent fill-accent' : 'text-[var(--text-muted)]',
              action: handleToggleSave
            },
            {
              id: 'notifications',
              label: isMuted
                ? (isRtl ? 'تشغيل الإشعارات' : 'Turn on notifications')
                : (isRtl ? 'إيقاف الإشعارات' : 'Turn off notifications'),
              icon: isMuted ? Bell : BellOff,
              iconColor: isMuted ? 'text-accent' : 'text-[var(--text-muted)]',
              action: handleToggleNotifications
            },
            {
              id: 'translation',
              label: allowTranslation
                ? (isRtl ? 'إيقاف الترجمة' : 'Turn off translation')
                : (isRtl ? 'تشغيل الترجمة' : 'Turn on translation'),
              icon: Languages,
              action: handleToggleTranslation
            },
            {
              id: 'ai_content',
              label: isRtl ? 'محتوى ذكاء اصطناعي' : 'AI content details',
              icon: Info,
              action: () => {
                onClose();
                setActiveModal('ai_content');
              }
            },
            {
              id: 'embed',
              label: isRtl ? 'تضمين المنشور' : 'Embed post',
              icon: Code,
              action: () => {
                onClose();
                setActiveModal('embed');
              }
            }
          ];

          const guestBottomItems = [
            {
              id: 'hide',
              label: isRtl ? 'إخفاء هذا المنشور' : 'Hide this post',
              icon: EyeOff,
              action: () => {
                onClose();
                onHideAd?.(ad.id);
              }
            },
            {
              id: 'report',
              label: isRtl ? 'إبلاغ عن محتوى غير لائق' : 'Report inappropriate content',
              icon: Flag,
              isDestructive: true,
              action: () => {
                onClose();
                setActiveModal('report');
              }
            }
          ];

          const mainList = isOwner ? ownerMainItems : guestMainItems;
          const bottomList = isOwner ? ownerBottomItems : guestBottomItems;

          const sortedMain = [...mainList].sort((a, b) => {
            const lenA = a.label.trim().length;
            const lenB = b.label.trim().length;
            return lenA !== lenB ? lenA - lenB : a.label.localeCompare(b.label);
          });

          const sortedBottom = [...bottomList].sort((a, b) => {
            const lenA = a.label.trim().length;
            const lenB = b.label.trim().length;
            return lenA !== lenB ? lenA - lenB : a.label.localeCompare(b.label);
          });

          return (
            <motion.div
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className={`absolute top-full mt-1 ${alignClass} ${alignClass === 'right-0' ? 'origin-top-right' : 'origin-top-left'} w-max min-w-[185px] sm:min-w-[205px] max-w-[calc(100vw-24px)] rounded-shape-md border border-[var(--border-main)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xl p-1 z-[100] text-xs font-medium flex flex-col gap-0.5 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 transition-colors duration-fast ${SCROLL_STYLES.dropdown} max-h-[68vh] sm:max-h-[78vh] overflow-y-auto ${className}`}
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {/* Hierarchically Sorted Main Actions (Pyramid: Shortest to Longest) */}
              {sortedMain.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    className={`group w-full h-[32px] min-h-[32px] flex items-center gap-2 px-2.5 py-1 rounded-shape-xs border border-transparent transition-all duration-fast cursor-pointer select-none text-start bg-transparent ${HOVER_STYLES.dropdownItem}`}
                  >
                    <Icon size={13.5} className={`${item.iconColor || 'text-[var(--text-muted)]'} group-hover:text-[var(--fg-accent)] shrink-0 transition-colors duration-fast`} />
                    <span className="truncate min-w-0 flex-1 text-[11.5px] sm:text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors duration-fast">
                      {item.label}
                    </span>
                  </button>
                );
              })}

              <div className="my-0.5 h-px bg-[var(--border-default)]/70 mx-1" />

              {/* Hierarchically Sorted Bottom Actions */}
              {sortedBottom.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.action}
                    className={`group w-full h-[32px] min-h-[32px] flex items-center gap-2 px-2.5 py-1 rounded-shape-xs border border-transparent transition-all duration-fast cursor-pointer select-none text-start ${
                      item.isDestructive
                        ? 'bg-transparent hover:bg-rose-500/10 text-rose-500'
                        : `bg-transparent ${HOVER_STYLES.dropdownItem}`
                    }`}
                  >
                    <Icon size={13.5} className={`${item.isDestructive ? 'text-rose-500 group-hover:text-rose-400' : 'text-[var(--text-muted)] group-hover:text-[var(--fg-accent)]'} shrink-0 transition-colors duration-fast`} />
                    <span className={`truncate min-w-0 flex-1 text-[11.5px] sm:text-xs ${item.isDestructive ? 'font-bold text-rose-500 group-hover:text-rose-400' : 'font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'} transition-colors duration-fast`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* DIALOG MODALS */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {activeModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--surface-overlay)] backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md bg-[var(--surface-card)] text-[var(--text-primary)] rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-2xl p-4 sm:p-5 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
              {/* Close Button Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)] mb-3">
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  {activeModal === 'who_can_comment' && (isRtl ? 'من يمكنه التعليق؟' : 'Who can comment?')}
                  {activeModal === 'audience' && (isRtl ? 'تعديل الجمهور' : 'Edit audience')}
                  {activeModal === 'partnership' && (isRtl ? 'إعلان شراكة' : 'Partnership Ad')}
                  {activeModal === 'ai_content' && (isRtl ? 'محتوى ذكاء اصطناعي' : 'AI Content')}
                  {activeModal === 'edit_date' && (isRtl ? 'تعديل تاريخ النشر' : 'Edit publication date')}
                  {activeModal === 'embed' && (isRtl ? 'تضمين المنشور' : 'Embed post')}
                  {activeModal === 'archive_confirm' && (isRtl ? 'نقل إلى الأرشيف' : 'Move to archive')}
                  {activeModal === 'trash_confirm' && (isRtl ? 'نقل إلى سلة المهملات' : 'Move to trash')}
                  {activeModal === 'report' && (isRtl ? 'الإبلاغ الرقابي عن محتوى مخالف' : 'Report Content Violation')}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  aria-label={isRtl ? 'إغلاق' : 'Close'}
                  className="w-7 h-7 rounded-shape-sm flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border border-transparent hover:border-[var(--border-default)] transition-all duration-fast cursor-pointer shadow-2xs"
                >
                  <X size={14} />
                </button>
              </div>

              {/* 1. Modal: Who Can Comment */}
              {activeModal === 'who_can_comment' && (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--text-muted)] mb-2">
                    {isRtl
                      ? 'اختر من يمكنه التعليق على هذا المنشور:'
                      : 'Choose who is allowed to comment on your post:'}
                  </p>

                  {[
                    { id: 'anyone', titleAr: 'الجميع', titleEn: 'Public / Anyone', descAr: 'يمكن لأي شخص مسجل التعليق', descEn: 'Anyone registered can comment' },
                    { id: 'followers', titleAr: 'المتابعون فقط', titleEn: 'Followers only', descAr: 'يمكن لمتابعي صفحتك فقط التعليق', descEn: 'Only your followers can comment' },
                    { id: 'mentioned', titleAr: 'المشار إليهم فقط', titleEn: 'Mentioned profiles only', descAr: 'فقط من قمت بالإشارة إليهم', descEn: 'Only users mentioned with @' },
                    { id: 'nobody', titleAr: 'إيقاف التعليقات', titleEn: 'Turn off comments', descAr: 'تعطيل التعليقات بالكامل', descEn: 'Nobody can add new comments' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSaveWhoCanComment(opt.id)}
                      disabled={isActionLoading}
                      className={`w-full flex items-center justify-between p-2.5 rounded-shape-sm border transition-all duration-fast text-start cursor-pointer ${
                        whoCanComment === opt.id
                          ? 'border-accent/60 bg-accent/10'
                          : 'border-[var(--border-default)] hover:bg-[var(--surface-subtle)] hover:border-accent/40'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2.5 rtl:pr-0 rtl:pl-2.5">
                        <div className="font-bold text-xs text-[var(--text-primary)]">
                          {isRtl ? opt.titleAr : opt.titleEn}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          {isRtl ? opt.descAr : opt.descEn}
                        </div>
                      </div>
                      {whoCanComment === opt.id && (
                        <CheckCircle2 size={16} className="text-accent shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* 2. Modal: Audience */}
              {activeModal === 'audience' && (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--text-muted)] mb-2">
                    {isRtl
                      ? 'حدد من يمكنه رؤية هذا المنشور:'
                      : 'Choose who can view this post:'}
                  </p>

                  {[
                    { id: 'public', icon: Globe, titleAr: 'عام (الجميع)', titleEn: 'Public', descAr: 'مرئي للجميع على المنصة', descEn: 'Anyone on or off Perplexta' },
                    { id: 'friends', icon: Users, titleAr: 'المتابعون فقط', titleEn: 'Followers only', descAr: 'متابعو ملفك أو صفحتك فقط', descEn: 'Your followers on Perplexta' },
                    { id: 'only_me', icon: Lock, titleAr: 'أنا فقط (خاص)', titleEn: 'Only me', descAr: 'مرئي لك وحدك', descEn: 'Only you can see this post' },
                  ].map((opt) => {
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSaveAudience(opt.id)}
                        disabled={isActionLoading}
                        className={`w-full flex items-center justify-between p-2.5 rounded-shape-sm border transition-all duration-fast text-start cursor-pointer ${
                          audience === opt.id
                            ? 'border-accent/60 bg-accent/10'
                            : 'border-[var(--border-default)] hover:bg-[var(--surface-subtle)] hover:border-accent/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] shrink-0 shadow-2xs">
                            <IconComp size={15} />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[var(--text-primary)]">
                              {isRtl ? opt.titleAr : opt.titleEn}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                              {isRtl ? opt.descAr : opt.descEn}
                            </div>
                          </div>
                        </div>
                        {audience === opt.id && (
                          <CheckCircle2 size={16} className="text-accent shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 3. Modal: Branded Partnership */}
              {activeModal === 'partnership' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                    <div>
                      <div className="font-bold text-xs text-[var(--text-primary)]">
                        {isRtl ? 'وسم "شراكة مدفوعة"' : 'Paid partnership label'}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {isRtl ? 'إظهار علامة الشراكة فوق المنشور' : 'Display sponsor tag above post'}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isPartnership}
                      onChange={(e) => setIsPartnership(e.target.checked)}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">
                      {isRtl ? 'اسم الراعي أو العلامة التجارية' : 'Sponsor / Brand Name'}
                    </label>
                    <input
                      type="text"
                      value={partnershipBrand}
                      onChange={(e) => setPartnersBrand(e.target.value)}
                      placeholder={isRtl ? 'اسم الراعي' : 'e.g., Brand name'}
                      className="w-full px-3 py-1.5 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-accent/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">
                      {isRtl ? 'رمز إعلان الشراكة' : 'Partnership Ad Code'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={partnershipCode || `PRP-PARTNER-AD-${ad.id}`}
                        className="w-full px-3 py-1.5 h-8 rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] text-xs font-mono font-bold text-[var(--text-primary)]"
                      />
                      <button
                        type="button"
                        onClick={copyPartnershipCode}
                        className="h-8 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] hover:border-accent/40 text-[var(--text-primary)] text-xs font-bold transition-all duration-fast shrink-0 flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                      >
                        {copiedCode ? <Check size={13} className="text-[var(--fg-success)]" /> : <Copy size={13} />}
                        <span>{copiedCode ? (isRtl ? 'تم النسخ' : 'Copied') : (isRtl ? 'نسخ' : 'Copy')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSavePartnership}
                      disabled={isActionLoading}
                      className="w-full h-8 px-4 rounded-shape-sm bg-accent text-white hover:bg-accent/90 text-xs font-bold transition-all duration-fast shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isActionLoading && <Loader2 size={13} className="animate-spin" />}
                      <span>{isRtl ? 'حفظ إعدادات الشراكة' : 'Save Partnership'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Modal: AI Content Disclosure */}
              {activeModal === 'ai_content' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                    <div>
                      <div className="font-bold text-xs text-[var(--text-primary)]">
                        {isRtl ? 'وسم "محتوى ذكاء اصطناعي"' : 'AI Content Label'}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {isRtl ? 'إظهار شارة الذكاء الاصطناعي على المنشور' : 'Show AI badge on post'}
                      </div>
                    </div>
                    {isOwner ? (
                      <input
                        type="checkbox"
                        checked={isAiGenerated}
                        onChange={(e) => handleToggleAi(e.target.checked)}
                        className="w-4 h-4 accent-accent rounded cursor-pointer"
                      />
                    ) : (
                      <span className="font-bold text-xs px-2 py-0.5 rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)]">
                        {isAiGenerated ? (isRtl ? 'مُفعّل' : 'Active') : (isRtl ? 'غير مفعل' : 'Inactive')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 5. Modal: Edit Date */}
              {activeModal === 'edit_date' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-[var(--text-secondary)]">
                      {isRtl ? 'تاريخ ووقت النشر الجديد' : 'New publication date'}
                    </label>
                    <input
                      type="datetime-local"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      className="w-full px-3 py-1.5 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-accent/60"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveDate}
                      disabled={isActionLoading}
                      className="w-full h-8 px-4 rounded-shape-sm bg-accent text-white hover:bg-accent/90 text-xs font-bold transition-all duration-fast shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isActionLoading && <Loader2 size={13} className="animate-spin" />}
                      <span>{isRtl ? 'حفظ التاريخ' : 'Save Date'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 6. Modal: Embed */}
              {activeModal === 'embed' && (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)]">
                    <pre className="text-[11px] font-mono text-[var(--text-primary)] overflow-x-auto whitespace-pre-wrap break-all">
                      {embedCode}
                    </pre>
                  </div>

                  <button
                    type="button"
                    onClick={copyEmbedCode}
                    className="w-full h-8 px-4 rounded-shape-sm bg-accent text-white hover:bg-accent/90 text-xs font-bold transition-all duration-fast shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                  >
                    {copiedEmbed ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedEmbed ? (isRtl ? 'تم النسخ بنجاح!' : 'Copied!') : (isRtl ? 'نسخ رمز التضمين' : 'Copy Embed Code')}</span>
                  </button>
                </div>
              )}

              {/* 7. Modal: Archive Confirm */}
              {activeModal === 'archive_confirm' && (
                <div className="space-y-3">
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {isRtl
                      ? 'هل تريد نقل هذا المنشور إلى الأرشيف؟ يمكنك استعادته في أي وقت من قسم الأرشيف.'
                      : 'Move this post to archive? You can restore it anytime from your archive.'}
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 h-8 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] text-[var(--text-primary)] text-xs font-bold transition-all duration-fast shadow-2xs active:scale-95 cursor-pointer"
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmArchive}
                      disabled={isActionLoading}
                      className="flex-1 h-8 px-3 rounded-shape-sm bg-accent text-white hover:bg-accent/90 text-xs font-bold transition-all duration-fast shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                    >
                      {isActionLoading && <Loader2 size={13} className="animate-spin" />}
                      <span>{isRtl ? 'تأكيد الأرشفة' : 'Confirm Archive'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 8. Modal: Trash Confirm */}
              {activeModal === 'trash_confirm' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-shape-sm bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                    <span className="font-bold block mb-1 text-xs sm:text-sm">
                      {isRtl ? 'نقل المنشور إلى سلة المهملات؟' : 'Move post to trash?'}
                    </span>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {isRtl
                        ? 'سيتم نقل المنشور إلى سلة المهملات، ويمكنك استعادته خلال 30 يوماً.'
                        : 'This post will be moved to trash and can be restored within 30 days.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 h-8 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] text-[var(--text-primary)] text-xs font-bold transition-all duration-fast shadow-2xs active:scale-95 cursor-pointer"
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmTrash}
                      disabled={isActionLoading}
                      className="flex-1 h-8 px-3 rounded-shape-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all duration-fast shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                    >
                      {isActionLoading && <Loader2 size={13} className="animate-spin" />}
                      <span>{isRtl ? 'نقل إلى سلة المهملات' : 'Move to Trash'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 9. Modal: Professional Content Report */}
              {activeModal === 'report' && (
                <div className="space-y-3.5" dir={isRtl ? 'rtl' : 'ltr'}>
                  <div className="p-3 rounded-shape-sm bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                    <span className="font-bold block mb-1 text-xs">
                      {isRtl ? 'الإبلاغ الرقابي الاحترافي عن محتوى مخالف' : 'Professional Content Moderation Report'}
                    </span>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      {isRtl
                        ? 'اختر الفئة الأكثر دقة لوصف المخالفة. سيتم إرسال إشعار فوري وتوثيق بالبريد الإلكتروني للرقابة والإدارة لمراجعة المحتوى.'
                        : 'Select the category that best describes the violation. A notification & email dispatch will be routed to administration.'}
                    </p>
                  </div>

                  {/* Categories list */}
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {REPORT_CATEGORIES.map((cat) => {
                      const isSelected = reportReason === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setReportReason(cat.id)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-shape-sm border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-accent/10 border-accent text-[var(--text-primary)] shadow-2xs'
                              : 'bg-[var(--surface-subtle)] border-[var(--border-default)] hover:bg-[var(--surface-card)] text-[var(--text-secondary)]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="report_reason_group"
                            checked={isSelected}
                            onChange={() => setReportReason(cat.id)}
                            className="mt-0.5 accent-accent cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-primary)]">
                              <span>{cat.icon}</span>
                              <span>{isRtl ? cat.titleAr : cat.titleEn}</span>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">
                              {isRtl ? cat.descAr : cat.descEn}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Details textarea */}
                  <div>
                    <label className="block text-[11px] font-bold mb-1 text-[var(--text-secondary)]">
                      {isRtl ? 'تفاصيل إضافية حول البلاغ (اختياري/موصى به):' : 'Additional details (Optional/Recommended):'}
                    </label>
                    <textarea
                      rows={2}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder={
                        isRtl
                          ? 'أضف هنا أي تفاصيل أو سياق إضافي يساعد قسم الرقابة في سرعة اتخاذ القرار...'
                          : 'Add any extra details or context to help moderation team review quickly...'
                      }
                      className="w-full p-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-accent/60 resize-none"
                    />
                  </div>

                  {/* Footer buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 h-8 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] text-[var(--text-primary)] text-xs font-bold transition-all duration-fast shadow-2xs active:scale-95 cursor-pointer"
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendReport}
                      disabled={isActionLoading}
                      className="flex-1 h-8 px-3 rounded-shape-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all duration-fast shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isActionLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Flag size={13} />
                      )}
                      <span>{isRtl ? 'إرسال البلاغ للرقابة' : 'Submit Report'}</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
  </>
);
};
