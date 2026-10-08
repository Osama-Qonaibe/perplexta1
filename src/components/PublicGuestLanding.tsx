import React, { useState } from 'react';
import { 
  Sparkles, Palette, Layers, ShieldCheck, ArrowRight, ArrowUpRight, 
  CheckCircle2, Play, Pause, Users, Lock, ChevronLeft, ChevronDown, LayoutTemplate, 
  Languages, Video, Smartphone, Camera, Monitor, FileText, UploadCloud,
  Sliders, Wand2, Star, Check, Zap, Eye, UserPlus, MessageSquarePlus, MessageSquare,
  X, Image as ImageIcon, Send, Cpu, CpuIcon, Flame, Terminal, Globe, HelpCircle, Loader2, Award
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { resolveImageUrl } from '../utils/imageResolver';
import { toast } from '@/design-system';
import { RataqRepoTemplates, RataqRepoTemplate } from '../data/templates';
import { getStoredUserReviews, saveUserReview, UserReviewItem } from '../data/rataqReviews';
import { getStoredCreators, RinexCreator, getStoredMarketplaceTemplates, MarketplaceTemplate } from '../data/rinexCreators';
import { TemplatePreviewModal } from './creators/TemplatePreviewModal';
import { CreatorRegistrationModal } from './creators/CreatorRegistrationModal';
import { useNavigate } from 'react-router-dom';
import { UNIFIED_PUBLIC_TEMPLATES, PublicTemplateItem } from '../data/publicTemplatesData';

const PUBLIC_TEMPLATES: PublicTemplateItem[] = UNIFIED_PUBLIC_TEMPLATES;

// Official Tech Partner & AI Model Provider Logos with Authentic SVG Vectors
const PARTNER_LOGOS = [
  { 
    name: 'Google Gemini', 
    label: 'Multimodal & Vision AI', 
    color: 'text-blue-500',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.95H1.14v3.15C3.12 21.35 7.23 24 12 24z"/>
        <path fill="#FBBC05" d="M5.28 14.25c-.25-.72-.38-1.5-.38-2.25s.13-1.53.38-2.25V6.6H1.14A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.14 5.4l4.14-3.15z"/>
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.12 2.65 1.14 6.6l4.14 3.15c.95-2.84 3.6-4.95 6.72-4.95z"/>
      </svg>
    )
  },
  { 
    name: 'Anthropic', 
    label: 'Claude Reasoning', 
    color: 'text-amber-500',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.83 3.5H10.17L2 20.5h3.75l1.9-4.1h7.71l1.9 4.1H22L13.83 3.5zm-2.03 9.47L12 8.4l1.9 4.57h-3.8z" fill="#D97706"/>
      </svg>
    )
  },
  { 
    name: 'Groq', 
    label: 'Ultra-Speed LPUs', 
    color: 'text-rose-500',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    name: 'GitHub', 
    label: 'Sovereign Code', 
    color: 'text-slate-200',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fill="#E2E8F0"/>
      </svg>
    )
  },
  { 
    name: 'OpenAI', 
    label: 'GPT & DALL-E', 
    color: 'text-[var(--fg-success)]',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-4.0305-2.6391 6.0416 6.0416 0 0 0-5.007 1.3256A5.989 5.989 0 0 0 9.176 1.545a6.0462 6.0462 0 0 0-5.1974 3.0125 6.0416 6.0416 0 0 0-.5476 5.2536 5.989 5.989 0 0 0-2.313 4.2536 6.0462 6.0462 0 0 0 2.934 5.1636 5.9847 5.9847 0 0 0 2.2155 1.0965 6.0462 6.0462 0 0 0 5.0975-.828 5.989 5.989 0 0 0 4.1947 1.7485 6.0462 6.0462 0 0 0 5.4385-3.3765 5.9847 5.9847 0 0 0 .5157-4.9108 6.0462 6.0462 0 0 0-1.282-2.1444z" stroke="#10B981" strokeWidth="2"/>
      </svg>
    )
  },
  { 
    name: 'Meta', 
    label: 'Llama Open Models', 
    color: 'text-sky-400',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M12 12c-2.5-4-5-6-8-6s-5 3-5 7 2 7 5 7 5.5-3 8-8zm0 0c2.5 4 5 6 8 6s5-3 5-7-2-7-5-7-5.5 3-8 8z" stroke="#38BDF8" strokeWidth="2"/>
      </svg>
    )
  },
  { 
    name: 'Stability AI', 
    label: 'Stable Diffusion', 
    color: 'text-purple-400',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#C084FC" strokeWidth="2"/>
        <path d="M12 3v18M3 12h18" stroke="#C084FC" strokeWidth="2"/>
      </svg>
    )
  },
  { 
    name: 'Ollama', 
    label: 'Local LLM Runner', 
    color: 'text-orange-400',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="12" rx="9" ry="6" stroke="#FB923C" strokeWidth="2"/>
        <circle cx="12" cy="12" r="3" fill="#FB923C"/>
      </svg>
    )
  },
  { 
    name: 'Alibaba Qwen', 
    label: 'Multimodal AI', 
    color: 'text-orange-500',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    name: 'DeepSeek', 
    label: 'Deep Reasoning', 
    color: 'text-blue-400',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  },
  { 
    name: 'Mistral AI', 
    label: 'European Weights', 
    color: 'text-amber-600',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M3 12h18M12 3l9 9-9 9" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    name: 'Cohere', 
    label: 'Enterprise NLP', 
    color: 'text-teal-400',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="#2DD4BF" strokeWidth="2"/>
        <path d="M12 8v8M8 12h8" stroke="#2DD4BF" strokeWidth="2"/>
      </svg>
    )
  },
  { 
    name: 'Hugging Face', 
    label: 'Open ML Hub', 
    color: 'text-yellow-400',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h14M12 5l7 7-7 7" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    name: 'Perplexity', 
    label: 'Neural Search', 
    color: 'text-cyan-400',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#22D3EE" strokeWidth="2"/>
        <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" fill="#22D3EE"/>
      </svg>
    )
  },
  { 
    name: 'xAI Grok', 
    label: 'Realtime Cognition', 
    color: 'text-zinc-100',
    svgIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M4 4l16 16M4 20L20 4" stroke="#F4F4F5" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  }
];

export const PublicGuestLanding: React.FC = () => {
  const navigate = useNavigate();
  const { language, dir, setIsAuthModalOpen, plans, user } = useAppContext();
  const isAr = language === 'ar' || dir === 'rtl';

  const [activeCategory, setActiveCategory] = useState<'all' | 'reels' | 'story' | 'marketing' | 'cards'>('all');
  
  // Hero Video Preview State
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);

  // Reviews & Testimonials State
  const [reviews, setReviews] = useState<UserReviewItem[]>(() => getStoredUserReviews());
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [creators] = useState<RinexCreator[]>(() => getStoredCreators());
  const [previewTemplate, setPreviewTemplate] = useState<MarketplaceTemplate | null>(null);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState<boolean>(false);

  const handleJoinAsCreator = () => {
    if (!user) {
      toast.info(
        isAr 
          ? 'يرجى تسجيل الدخول أو إنشاء حساب للانضمام لشبكة صناع المحتوى وتفعيل مكافأة الـ $50 دولار!' 
          : 'Please sign in or create an account to claim your $50 creator welcome bonus!'
      );
      setIsAuthModalOpen(true);
      return;
    }
    const currentCreators = getStoredCreators();
    const existing = currentCreators.find(c => 
      (user.email && (c as any).email === user.email) ||
      (user.name && c.name.toLowerCase() === user.name.toLowerCase()) ||
      ((user as any)?.username && c.username.toLowerCase() === (user as any).username.toLowerCase())
    );
    if (existing) {
      navigate('/settings/creators-hub');
    } else {
      setIsCreatorModalOpen(true);
    }
  };

  const handleOpenTemplatePreview = (tpl: any) => {
    if (tpl.creatorName) {
      setPreviewTemplate(tpl);
      return;
    }
    const allMarketplace = getStoredMarketplaceTemplates();
    const matched = allMarketplace.find(m => m.id === tpl.id || m.titleEn === tpl.titleEn);
    if (matched) {
      setPreviewTemplate(matched);
      return;
    }
    setPreviewTemplate({
      id: tpl.id,
      creatorId: 'rinex-curated',
      creatorName: isAr ? 'استوديو رينكس الرسمي' : 'Rinex Official Studio',
      creatorUsername: 'rinex_official',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      titleAr: tpl.titleAr,
      titleEn: tpl.titleEn,
      descriptionAr: `قالب تصميم احترافي معتمد من مستودع رينكس الرسمي (${tpl.tag || 'عالي الدقة'})، مجهز بطبقات وتنسيقات قابلة للتعديل مباشرة فور التسجيل.`,
      descriptionEn: `Official professional design template (${tpl.tag || 'HD'}) with full customizable layers.`,
      thumbnail: tpl.src || tpl.thumbnail,
      category: (tpl.category === 'all' ? 'marketing' : tpl.category) as any,
      categoryLabelAr: tpl.categoryLabelAr || 'تسويقي',
      dimensions: tpl.dimensions || '1080 × 1080',
      priceType: 'free',
      price: 0,
      viewsCount: 16800,
      usesCount: 4750,
      rating: 4.9,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
      elements: tpl.elements || [],
      canvasBackground: tpl.canvasBackground
    });
  };

  // Review Submission Form State
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRole, setReviewerRole] = useState('');
  const [reviewerRating, setReviewerRating] = useState<number>(5);
  const [reviewerComment, setReviewerComment] = useState('');
  const [reviewerMediaUrl, setReviewerMediaUrl] = useState('');

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Contact Us Form State
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactReason, setContactReason] = useState('suggestion');
  const [contactMessage, setContactMessage] = useState('');
  const [contactFile, setContactFile] = useState<File | null>(null);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Newsletter Subscription State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribedNewsletter, setIsSubscribedNewsletter] = useState(false);

  // Selected Plan Cycles State for pricing cards
  const [selectedPlanCycles, setSelectedPlanCycles] = useState<Record<string, 'monthly' | 'annual'>>({});

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactMessage.trim()) {
      toast.error(isAr ? 'يرجى إدخال الاسم ورسالة الاتصال' : 'Please provide name and message');
      return;
    }

    const lowerMsg = contactMessage.toLowerCase();
    const hasCodeOrUrl = lowerMsg.includes('http://') || lowerMsg.includes('https://') || lowerMsg.includes('www.') || lowerMsg.includes('<script') || lowerMsg.includes('select *') || lowerMsg.includes('drop table') || lowerMsg.includes('eval(');
    if (hasCodeOrUrl) {
      toast.error(isAr ? 'عذراً، يُمنع إرسال روابط أو أكواد برمجية في رسائل الاتصال لأسباب أمنية.' : 'Links, URLs, and code snippets are strictly prohibited for security reasons.');
      return;
    }

    setIsSubmittingContact(true);
    setTimeout(() => {
      setIsSubmittingContact(false);
      setContactName('');
      setContactRole('');
      setContactMessage('');
      setContactFile(null);
      toast.success(isAr ? 'تم إرسال رسالتك بنجاح! سيتم الرد عليك قريباً من قبل فريق الإدارة.' : 'Your message has been sent successfully!');
    }, 800);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      toast.error(isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      return;
    }
    setIsSubscribedNewsletter(true);
    toast.success(isAr ? 'تم اشتراكك بنجاح في نشرة التحديثات الدورية!' : 'Successfully subscribed to our newsletter!');
  };

  const safeText = (val: any, fallback: string = '') => {
    if (!val) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      return isAr ? (val.textAr || val.ar || val.name || val.title || JSON.stringify(val)) : (val.textEn || val.en || val.name || val.title || JSON.stringify(val));
    }
    return String(val);
  };

  const safeList = (list: any) => {
    if (!list) return [];
    if (Array.isArray(list)) {
      return list.map(item => safeText(item));
    }
    if (typeof list === 'object') {
      return Object.values(list).map(item => safeText(item));
    }
    return [safeText(list)];
  };

  const displayPlans = plans && plans.length > 0 ? plans : [
    {
      id: 'free',
      nameAr: 'الباقة المجانية',
      nameEn: 'Free Plan',
      monthlyPrice: 0,
      annualPrice: 0,
      descriptionAr: 'البداية المثالية لاستكشاف أدوات استوديو رينكس وتصاميم الكانفاس',
      descriptionEn: 'Perfect start to explore Rinex Studio canvas tools',
      featuresAr: ['5 مشاريع تصميم شهرياً', 'تصدير قياسي بدون علامة', 'قوالب رينكس الأساسية'],
      featuresEn: ['5 designs per month', 'Standard export without watermark', 'Core Rinex templates']
    },
    {
      id: 'pro',
      nameAr: 'باقة المصممين الاحترافية PRO',
      nameEn: 'PRO Creator Plan',
      monthlyPrice: 19,
      annualPrice: 15,
      descriptionAr: 'للمصممين وصناع المحتوى المحترفين، مع قدرات غير محدودة ومحركات الذكاء الاصطناعي',
      descriptionEn: 'For professional creators with unlimited AI & multi-page canvas',
      featuresAr: ['مشاريع وتصميمات غير محدودة', 'تصدير 4K فائق الجودة', 'جميع محركات الذكاء الاصطناعي', 'إزالة الخلفية السحرية بالذكاء الاصطناعي'],
      featuresEn: ['Unlimited designs', '4K Ultra-HD export', 'All AI engines', 'Magical background removal']
    },
    {
      id: 'enterprise',
      nameAr: 'باقة المؤسسات والشركات السيادية',
      nameEn: 'Enterprise Sovereign Plan',
      monthlyPrice: 49,
      annualPrice: 39,
      descriptionAr: 'أقصى درجات القوة والأمان المخصص للفرق، الشركات، والوكالات الإعلانية الكبرى',
      descriptionEn: 'Maximum power and custom security for teams and agencies',
      featuresAr: ['مساحة عمل فريق عمل مشتركة', 'دعم فني أولوي على مدار الساعة', 'تخصيص كامل للهوية التجارية', 'تشفير بيانات عالي المستوى'],
      featuresEn: ['Team workspace collaboration', '24/7 priority support', 'Full brand kit customisation', 'High-grade data encryption']
    }
  ];

  const userPlans = (plans && plans.length > 0 ? plans : displayPlans).filter((p: any) => {
    const name = safeText(p.nameAr || p.nameEn || p.name || '').toLowerCase();
    const slug = safeText(p.id || '').toLowerCase();
    return !name.includes('مطور') && !name.includes('developer') && !name.includes('api') && !slug.includes('dev') && !slug.includes('api');
  });

  const faqItems = [
    {
      qAr: 'ما هي منصة استوديو رينكس السيادية؟',
      qEn: 'What is Rinex Sovereign Studio Platform?',
      aAr: 'منصة متكاملة لتصميم وإنتاج المحتوى البصري (ريلز، بوسترات، قصص، ومقاطع فيديو) بالاعتماد على أحدث نماذج الذكاء الاصطناعي ومحرك كانفا متعدد الصفحات.',
      aEn: 'An integrated platform for designing and producing visual content powered by state-of-the-art AI models and a multi-page canvas engine.'
    },
    {
      qAr: 'هل بياناتي ومشاريعي التصميمية محمية؟',
      qEn: 'Are my data and design projects secure?',
      aAr: 'نعم بالتاكيد. جميع المشاريع والمرفوعات معزولة بالكامل لكل مستخدم مع تشفير متطور (AES-256) وضمان عدم مشاركة أي بيانات مع أطراف خارجية.',
      aEn: 'Yes, absolutely. All projects and uploads are completely isolated per user with advanced encryption and zero third-party sharing.'
    },
    {
      qAr: 'كيف يمكنني البدء في استخدام الاستوديو؟',
      qEn: 'How can I start using the studio?',
      aAr: 'فقط اضغط على "ابدأ مجاناً" أو اختر أي قالب جاهز، وسيعمل النظام على توجيهك لإنشاء مساحتك الإبداعية الخاصة في ثوانٍ معدودة.',
      aEn: 'Simply click "Start Free" or choose any ready template, and the system will guide you to create your dedicated creative workspace in seconds.'
    },
    {
      qAr: 'هل يدعم الاستوديو التصدير بجودة 4K؟',
      qEn: 'Does the studio support 4K export?',
      aAr: 'نعم، يدعم الاستوديو تصدير التصاميم بجودة عالية ودقة 4K بدون أي علامات مائية وبأعلى معايير الجودة للطباعة والنشر الرقمي.',
      aEn: 'Yes, the studio supports high-resolution 4K design exports without any watermarks for print and digital publishing.'
    },
    {
      qAr: 'ما هي سياسة الاسترداد المعتمدة في المنصة؟',
      qEn: 'What is the refund policy?',
      aAr: 'توفر المنصة سياسة استرداد واضحة ومرنة خلال 14 يوماً من تاريخ الاشتراك في حال وجود خلل تقني غير معالج أو عدم الاستفادة الفعلية من الخدمات.',
      aEn: 'The platform provides a clear and flexible refund policy within 14 days of subscription in case of unaddressed technical issues.'
    },
    {
      qAr: 'هل يمكن النشر على فيرال بوك مباشرة؟',
      qEn: 'Can I publish directly to ViralBook?',
      aAr: 'نعم وبكل تأكيد! يمكنك نشر تصميماتك ومقاطع الريلز مباشرة إلى مجتمع فيرال بوك التفاعلي بضغطة زر واحدة لتشاركها مع الأصدقاء والعملاء.',
      aEn: 'Yes absolutely! You can publish your designs and reels directly to the ViralBook community with a single click.'
    }
  ];

  const filteredTemplates = activeCategory === 'all' 
    ? PUBLIC_TEMPLATES 
    : PUBLIC_TEMPLATES.filter(t => t.category === activeCategory);

  const handleActionRequireAuth = (actionNameAr: string, actionNameEn: string, templateId?: string) => {
    if (templateId) {
      try {
        sessionStorage.setItem('pending_studio_template', templateId);
      } catch (e) {}
    }
    toast.info(
      isAr 
        ? `حفاظاً على أمان بياناتك، وحماية الملكية الفكرية لتصاميمك، ومنع أي استخدام غير مشروع، يلزم إنشاء حساب مجاني أو تسجيل الدخول لتحديد مالك لمشروعك وبدء ${actionNameAr}.` 
        : `For data security, intellectual property protection, and preventing unauthorized use, please sign in or create a free account before ${actionNameEn}.`
    );
    setIsAuthModalOpen(true);
  };

  const handleAddReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewerComment.trim()) {
      toast.error(isAr ? 'يرجى كتابة الاسم والتعليق قبل الإرسال' : 'Please provide name and comment');
      return;
    }

    const updated = saveUserReview({
      name: reviewerName,
      roleAr: reviewerRole || 'مصمم ومبدع محتوى',
      roleEn: reviewerRole || 'Creative Designer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      rating: reviewerRating,
      commentAr: reviewerComment,
      commentEn: reviewerComment,
      mediaType: 'image',
      mediaUrl: reviewerMediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
    });

    setReviews(updated);
    setIsReviewModalOpen(false);
    setReviewerName('');
    setReviewerRole('');
    setReviewerComment('');
    setReviewerMediaUrl('');

    toast.success(isAr ? 'تمت إضافة تقييمك وتجربتك بنجاح! شكرًا لمشاركتك' : 'Review submitted successfully!');
  };

  return (
    <div className="w-full space-y-16 py-4 animate-in fade-in duration-300">
      
      {/* 1. HERO SECTION (القسم الرئيسي مع عرض الشرح المرئي) */}
      <section className="relative overflow-hidden rounded-shape-lg bg-[var(--surface-card)] border border-[color-mix(in_oklab,var(--accent)_30%,var(--border-default))] p-6 sm:p-10 md:p-12 shadow-md">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -end-24 w-96 h-96 bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -start-24 w-96 h-96 bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-start">
            
            {/* Platform Tag Kicker */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-shape-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] text-[var(--accent)] text-xs font-bold shadow-2xs">
              <Sparkles size={14} />
              <span>{isAr ? 'منصة استوديو رينكس السيادية 2026' : 'Rinex Sovereign Studio Platform'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] leading-tight tracking-tight text-balance">
              {isAr 
                ? 'بوابتك الذكية لتصميم المحتوى وإدارته بالذكاء الاصطناعي' 
                : 'Your AI-Powered Sovereign Creative Studio'}
            </h1>

            {/* Subheadline */}
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {isAr 
                ? 'أنشئ تصاميم، ملصقات، ومقاطع فيديو احترافية بضغطة زر واحدة. مساحة عمل مرنة متعددة الصفحات، محو سحري للخلفيات، وحفظ آمن للبيانات.'
                : 'Create posters, reels, and high-impact visual graphics in seconds with an intelligent multi-page canvas engine.'
              }
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-row items-center justify-center lg:justify-start gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="h-10 px-5 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs flex items-center justify-center gap-2 shadow-2xs hover:opacity-95 transition-all active:scale-95 cursor-pointer"
              >
                <UserPlus size={15} />
                <span>{isAr ? 'ابدأ مجاناً' : 'Start Free'}</span>
              </button>

              <a
                href="#templates-showcase"
                className="h-10 px-5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] hover:border-[var(--border-accent)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Palette size={15} className="text-[var(--accent)]" />
                <span>{isAr ? 'استكشف القوالب' : 'Templates'}</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-[var(--border-default)] flex items-center justify-center lg:justify-start gap-4 flex-wrap text-xs text-[var(--text-muted)] font-medium">
              <span className="flex items-center gap-1.5 text-[var(--fg-success)]">
                <ShieldCheck size={14} />
                <span>{isAr ? 'أمان حماية البيانات السيادي' : 'Sovereign Data Security'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Zap size={14} className="text-amber-500" />
                <span>{isAr ? 'تصدير 4K بدون علامة مائية' : '4K Watermark-Free Export'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[var(--accent)]" />
                <span>{isAr ? 'دعم محرر الكانفاس المتعدد' : 'Multi-Page Canvas'}</span>
              </span>
            </div>

            {/* Sovereign Data Security & Ownership Notice */}
            <div className="p-3.5 rounded-shape-md bg-[color-mix(in_oklab,var(--surface-card)_80%,transparent)] border border-[color-mix(in_srgb,var(--fg-success)_30%,transparent)] flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-shape-xs bg-[var(--bg-success-muted)] text-[var(--fg-success)] flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck size={18} />
              </div>
              <div className="text-start space-y-0.5">
                <h4 className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
                  <span>{isAr ? 'بيئة استوديو محمية • التسجيل إلزامي لحفظ ملكيتك' : 'Protected Studio Workspace • Registration Required'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-shape-xs bg-[var(--bg-success-muted)] text-[var(--fg-success)] font-mono font-bold">SSL 256-Bit</span>
                </h4>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {isAr 
                    ? 'حفاظاً على أمان بياناتك، وحماية الملكية الفكرية لتصاميمك، وضمان منع أي استخدام غير مشروع، يتطلب تجربة الاستوديو تسجيل الدخول الفوري وتحديد مالك لمشروعك السحابي.'
                    : 'To safeguard your data privacy, secure intellectual property ownership, and prevent unauthorized usage, registration is required before entering the studio workspace.'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Visual Element (Interactive Explainer Video Mockup) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-shape-md overflow-hidden bg-slate-950 border border-[var(--border-default)] shadow-2xl group">
              {/* Top Video Header Control */}
              <div className="h-9 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between text-slate-400 text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--fg-success)]/80" />
                  <span className="ms-2 font-bold text-slate-200">{isAr ? 'فيديو توضيحي — رحلة العمل في 30 ثانية' : 'Studio Journey in 30 Seconds'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                >
                  {isPlayingVideo ? <Pause size={12} /> : <Play size={12} />}
                </button>
              </div>

              {/* Main Explainer Video / Animated Live Canvas Preview */}
              <div className="relative aspect-video sm:aspect-4/3 bg-slate-900 overflow-hidden flex items-center justify-center">
                {isPlayingVideo ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4" type="video/mp4" />
                    <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80" alt="Preview" />
                  </video>
                ) : (
                  <img 
                    src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80" 
                    alt="Rinex Studio Preview" 
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Interactive Layers Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30 flex flex-col justify-between p-4">
                  <div className="self-end bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-2 rounded-shape-xs shadow-lg text-[10px] text-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[var(--accent)]">
                      <Layers size={12} />
                      <span>{isAr ? 'محرر متعدد الصفحات' : 'Multi-Page Canvas'}</span>
                    </div>
                    <p className="text-[9px] text-slate-400">{isAr ? 'تأطير الريلز والقصص وتصميم البوسترات' : 'Reels, stories, and posters'}</p>
                  </div>

                  <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-shape-sm shadow-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center">
                        <Wand2 size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{isAr ? 'المحو السحري بالذكاء الاصطناعي' : 'AI Magic Eraser'}</h4>
                        <span className="text-[10px] text-slate-400">{isAr ? 'تنقية وتنظيف الخلفية بضغطة واحدة' : 'One-click background removal'}</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleActionRequireAuth('التصميم والتعديل', 'editing')}
                      className="px-3 py-1 rounded bg-[var(--accent)] text-slate-950 font-bold text-[11px] shadow hover:opacity-90 cursor-pointer"
                    >
                      {isAr ? 'تجربة الآن' : 'Try Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. INFINITE MOVING MARQUEE OF TECH PARTNERS & AI LOGOS (شريط الشركاء ومزودي الذكاء الاصطناعي) */}
      <section className="space-y-3 py-2 border-y border-[var(--border-default)] overflow-hidden bg-[var(--surface-subtle)]/50 rounded-shape-md">
        <div className="text-center">
          <span className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase">
            {isAr ? 'منظومة الذكاء الاصطناعي والشراكات التكنولوجية المعتمدة' : 'Powered by Premier AI Models & Cloud Partners'}
          </span>
        </div>

        {/* Infinite Running Marquee Container */}
        <div className="relative w-full overflow-hidden py-3" dir="ltr">
          <div className={`${isAr ? 'animate-marquee-rtl' : 'animate-marquee-ltr'} flex items-center gap-6 sm:gap-10 min-w-max`}>
            {/* Duplicated 4x for 100% continuous seamless infinite looping */}
            {[...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS].map((partner, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 px-4 py-2.5 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xs hover:border-[var(--border-accent)] transition-all cursor-pointer group shrink-0"
              >
                <div className="w-9 h-9 rounded-shape-xs border border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                  {partner.svgIcon}
                </div>
                <div className="flex flex-col text-start">
                  <span className={`text-xs font-black font-mono ${partner.color} tracking-tight`}>{partner.name}</span>
                  <span className="text-[9px] text-[var(--text-muted)] font-medium">{partner.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2.5. BENEFITS & SOCIAL PROOF SUMMARY (إثبات الثقة) */}
      <section className="p-6 sm:p-8 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xs space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--fg-success)]">
            <ShieldCheck size={16} />
            <span>{isAr ? 'معايير الأمان والجودة' : 'Sovereign Trust & Performance'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {isAr ? 'لماذا يختار المصممون وصناع المحتوى استوديو رينكس؟' : 'Why Creators Trust Rinex Studio'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-2">
            <div className="w-9 h-9 rounded-shape-xs bg-[var(--bg-success-muted)] text-[var(--fg-success)] flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">
              {isAr ? 'أمان وحماية البيانات' : 'Strict Data Isolation'}
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {isAr ? 'كل مشروع يرتبط بمالك موثق مع تشفير بيانات معزول يضمن سرية تصميماتك.' : 'Project files are private and securely isolated.'}
            </p>
          </div>

          <div className="p-4 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-2">
            <div className="w-9 h-9 rounded-shape-xs bg-sky-500/15 text-sky-500 flex items-center justify-center font-bold">
              <Zap size={18} />
            </div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">
              {isAr ? 'تحرير فائق السرعة' : 'Sub-second Canvas'}
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {isAr ? 'أداء سلس وسرعة استجابة عالية بدون أي تهنيج أو بطء أثناء المونتاج.' : 'Instant responsive rendering without frame drops.'}
            </p>
          </div>

          <div className="p-4 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-2">
            <div className="w-9 h-9 rounded-shape-xs bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
              <Star size={18} />
            </div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">
              {isAr ? 'تصدير 4K بدون علامات مائية' : 'Watermark-Free 4K'}
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {isAr ? 'حمّل أعمالك بصيغ PNG, SVG, PDF بوضوحائق وبدون أي علامات مائية إجبارية.' : 'Export pristine high-definition files watermark-free.'}
            </p>
          </div>

          <div className="p-4 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-2">
            <div className="w-9 h-9 rounded-shape-xs bg-indigo-500/15 text-indigo-500 flex items-center justify-center font-bold">
              <Languages size={18} />
            </div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">
              {isAr ? 'خطوط عربية فاخرة' : 'Arabic Typography'}
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {isAr ? 'تشكيلة خطوط تجوال والقاهرة وأميري مع التحكم الكامل بالحدود والظلال.' : 'Curated font collection with shadow and stroke controls.'}
            </p>
          </div>
        </div>
      </section>

      {/* 3. FEATURES / STUDIOS SECTION (عرض الخدمات والأدوات بشكل شبكي - استوديوهات رينكس الأربعة) */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">
            <LayoutTemplate size={14} />
            <span>{isAr ? 'منظومة رينكس الإبداعية' : 'Sovereign Rinex Ecosystem'}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            {isAr ? 'أدوات واستوديوهات متكاملة لابتكار الصور، الفيديو، التطبيقات، والصوتيات' : 'Comprehensive AI Studios for Images, Video, Apps & Audio'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            {isAr ? 'محركات ذكية مدعومة بأحدث نماذج الذكاء الاصطناعي لتنفيذ كافة مشروعاتك الإبداعية والتقنية باحترافية.' : 'Advanced AI-powered engines to execute all your creative and technical projects with professional excellence.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Studio 1: Image Creation & Editing Studio */}
          <div className="p-6 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--border-default))] transition-all shadow-2xs space-y-4 group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-shape-sm bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] text-[var(--accent)] flex items-center justify-center">
                <ImageIcon size={22} />
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
                ENGINE #1
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {isAr ? '1. استوديو إنشاء وتعديل الصور' : '1. Image Creation & Editing Studio'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {isAr 
                  ? 'توليد الصور الاحترافية بالذكاء الاصطناعي، إزالة الخلفيات السحرية، الدمج، وتعديل الطبقات بدقة 4K فائقة.'
                  : 'AI image generation, magic background removal, layer blending, and 4K ultra-HD editing.'
                }
              </p>
            </div>

            <ul className="space-y-2 pt-2 border-t border-[var(--border-default)] text-xs text-[var(--text-muted)]">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--accent)]" />
                <span>{isAr ? 'توليد صور واقعية وفنية بالذكاء الاصطناعي التوليدي' : 'Generative AI image and art creation'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--accent)]" />
                <span>{isAr ? 'أدوات المحو السحري وتعديل الفلاتر المتقدمة' : 'Magic eraser and advanced filter tools'}</span>
              </li>
            </ul>
          </div>

          {/* Studio 2: Video Creation Studio */}
          <div className="p-6 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--border-default))] transition-all shadow-2xs space-y-4 group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-shape-sm bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] text-[var(--accent)] flex items-center justify-center">
                <Video size={22} />
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
                ENGINE #2
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {isAr ? '2. استوديو إنشاء الفيديو' : '2. Video Creation Studio'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {isAr 
                  ? 'صناعة مقاطع الريلز التسويقية، القصص العمودية 9:16، تجميع المقاطع، التقليص السريع، والتصدير السينمائي.'
                  : 'Marketing reels production, 9:16 vertical stories, clip merging, quick trimming, and cinematic export.'
                }
              </p>
            </div>

            <ul className="space-y-2 pt-2 border-t border-[var(--border-default)] text-xs text-[var(--text-muted)]">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--accent)]" />
                <span>{isAr ? 'تجميع مقاطع الفيديو وقص الأجزاء الزائدة بسلاسة' : 'Smooth clip merging and trimming'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--accent)]" />
                <span>{isAr ? 'تصدير مقاطع الريلز والقصص بجودة 4K بدون علامة مائية' : 'Watermark-free 4K reels and story export'}</span>
              </li>
            </ul>
          </div>

          {/* Studio 3: App Creation Studio */}
          <div className="p-6 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--border-default))] transition-all shadow-2xs space-y-4 group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-shape-sm bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] text-[var(--accent)] flex items-center justify-center">
                <Smartphone size={22} />
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
                ENGINE #3
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {isAr ? '3. استوديو إنشاء التطبيقات' : '3. App Creation Studio'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {isAr 
                  ? 'هندسة وبناء واجهات التطبيقات التفاعلية، توليد النماذج الأولية، وتحويل الأفكار إلى برمجيات جاهزة للنشر.'
                  : 'Interactive app UI engineering, prototyping, and transforming ideas into ready-to-deploy software.'
                }
              </p>
            </div>

            <ul className="space-y-2 pt-2 border-t border-[var(--border-default)] text-xs text-[var(--text-muted)]">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--accent)]" />
                <span>{isAr ? 'تصميم وتوليد واجهات التطبيقات الذكية للموبايل والويب' : 'Smart mobile and web UI generation'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--accent)]" />
                <span>{isAr ? 'نماذج أولية تفاعلية وتصدير كود نظيف معتمد' : 'Interactive prototypes with clean code export'}</span>
              </li>
            </ul>
          </div>

          {/* Studio 4: Audio Studio */}
          <div className="p-6 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--border-default))] transition-all shadow-2xs space-y-4 group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-shape-sm bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] text-[var(--accent)] flex items-center justify-center">
                <Wand2 size={22} />
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">
                ENGINE #4
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                {isAr ? '4. استوديو الصوت' : '4. Audio Studio'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {isAr 
                  ? 'هندسة ومعالجة المقاطع الصوتية، توليد التعليق الصوتي بالذكاء الاصطناعي، ومزامنة الإيقاع مع مقاطع الفيديو.'
                  : 'Audio track engineering, AI voiceover generation, and rhythmic synchronization with videos.'
                }
              </p>
            </div>

            <ul className="space-y-2 pt-2 border-t border-[var(--border-default)] text-xs text-[var(--text-muted)]">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--accent)]" />
                <span>{isAr ? 'توليد تعليق صوتي احترافي بلغات متعددة ونبرات واقعية' : 'Professional multi-language AI voiceovers'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--accent)]" />
                <span>{isAr ? 'تنقية الترددات، دمج المؤثرات، وهندسة الصوت السينمائي' : 'Frequency filtering and cinematic audio mastering'}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. TEMPLATES SHOWCASE (قسم القوالب الجاهزة والأمثلة) */}
      <section id="templates-showcase" className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">
              <Palette size={14} />
              <span>{isAr ? 'المكتبة الاحترافية' : 'Pro Template Showcase'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
              {isAr ? 'نماذج وقوالب جاهزة للتعديل المباشر' : 'Ready-to-Edit Design Templates'}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {isAr ? 'انقر على أي قالب لفتح كارت التسجيل المجاني وتعيين مالك لمشروعك ثم البدء بالتعديل.' : 'Select any template to register for free and launch in your workspace.'}
            </p>
          </div>

          {/* Filter Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 w-full sm:w-auto">
            {[
              { id: 'all', labelAr: 'الكل', labelEn: 'All' },
              { id: 'reels', labelAr: 'فيديو وريلز', labelEn: 'Reels' },
              { id: 'story', labelAr: 'استوري 9:16', labelEn: 'Story' },
              { id: 'marketing', labelAr: 'تسويقي', labelEn: 'Marketing' },
              { id: 'youtube', labelAr: 'يوتيوب', labelEn: 'YouTube' },
              { id: 'cards', labelAr: 'بطاقات', labelEn: 'Cards' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as any)}
                className={`h-8 px-3 rounded-shape-sm text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] shadow-xs'
                    : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
                }`}
              >
                {isAr ? cat.labelAr : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => handleOpenTemplatePreview(tpl)}
              className="group rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--border-default))] overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col active:scale-[0.99]"
            >
              <div className="h-52 w-full bg-[var(--surface-subtle)] overflow-hidden relative">
                <img
                  src={tpl.src}
                  alt={tpl.titleEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute top-3 end-3 px-2.5 py-0.5 text-[10px] font-bold rounded-shape-xs bg-slate-950/80 text-white border border-slate-700 backdrop-blur-xs shadow-xs">
                  {tpl.tag}
                </span>

                {/* Hover Overlay Badge */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <span className="px-4 py-2 rounded-shape-sm bg-[var(--accent)] text-slate-950 font-bold text-xs shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <Eye size={14} />
                    <span>{isAr ? 'معاينة القالب والتفاصيل' : 'Preview Template & Details'}</span>
                  </span>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between bg-[var(--surface-card)]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                      {isAr ? tpl.titleAr : tpl.titleEn}
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[9px] text-[var(--fg-success)] font-bold bg-[var(--bg-success-muted)] px-1.5 py-0.2 rounded-shape-xs shrink-0">
                      <ShieldCheck size={9} />
                      <span>{isAr ? 'محمي' : 'Secured'}</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--text-muted)] block">
                    {tpl.dimensions}
                  </span>
                </div>
                <ArrowUpRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4.5. RINEX CREATORS SHOWCASE SECTION (قسم نخبة صناع المحتوى في رينكس والربح من القوالب) */}
      <section className="space-y-8 pt-4">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] px-3 py-1 rounded-shape-full border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] uppercase tracking-wider">
            <Award size={14} />
            <span>{isAr ? 'مجتمع مبدعي رينكس' : 'Rinex Creator Economy'}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            {isAr ? 'انضم إلى نخبة المبدعين وصناع المحتوى في رينكس' : 'Join Our Elite Creator Community'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            {isAr 
              ? 'نظام بيئي متكامل يتيح للمصممين نشر قوالبهم المبتكرة وتحقيق عوائد وأرباح مستمرة بناءً على الاستخدام والمشاهدات اليومية.'
              : 'A powerful hub allowing designers to publish premium templates and generate continuous pay-per-use royalties.'}
          </p>
        </div>

        {/* Creators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {creators.slice(0, 3).map((c) => (
            <div
              key={c.id}
              className="group rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] overflow-hidden shadow-2xs hover:shadow-md hover:border-[var(--accent)]/50 transition-all flex flex-col relative"
            >
              {/* Card top banner style */}
              <div className="h-16 bg-gradient-to-r from-[color-mix(in_oklab,var(--accent)_10%,transparent)] to-[color-mix(in_oklab,var(--accent)_25%,transparent)] border-b border-[var(--border-default)]/50 relative">
                <div className="absolute top-3 end-3">
                  {c.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-shape-full bg-[var(--bg-success-muted)] text-[var(--fg-success)] border border-[color-mix(in_srgb,var(--fg-success)_30%,transparent)] text-[9px] font-black uppercase tracking-wider">
                      {isAr ? 'موثق' : 'VERIFIED'}
                    </span>
                  )}
                </div>
              </div>

              {/* Creator details */}
              <div className="p-5 flex-1 flex flex-col items-center text-center space-y-4 -mt-10">
                <img
                  src={c.avatar}
                  alt={c.name}
                  className="w-16 h-16 rounded-shape-full object-cover border-4 border-[var(--surface-card)] shadow-md"
                />
                
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-black text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    {c.name}
                  </h4>
                  <span className="text-[10px] text-[var(--accent)] font-mono font-bold">@{c.username}</span>
                  <p className="text-[10.5px] text-[var(--text-muted)] font-semibold">{isAr ? c.roleAr : c.roleEn}</p>
                </div>

                {/* Micro Stats Row */}
                <div className="grid grid-cols-2 gap-2 w-full pt-2 border-t border-[var(--border-default)]/60 text-center">
                  <div className="p-1.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)]/50">
                    <span className="text-[10.5px] font-black font-mono block text-[var(--text-primary)]">{Number(c.totalViews).toLocaleString()}</span>
                    <span className="text-[9px] text-[var(--text-muted)] font-bold">{isAr ? 'مشاهدة' : 'Views'}</span>
                  </div>
                  <div className="p-1.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)]/50">
                    <span className="text-[10.5px] font-black font-mono block text-[var(--text-primary)]">{Number(c.totalUses).toLocaleString()}</span>
                    <span className="text-[9px] text-[var(--text-muted)] font-bold">{isAr ? 'استخدام' : 'Uses'}</span>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                  {isAr ? c.bioAr : c.bioEn}
                </p>

                <div className="pt-2 border-t border-[var(--border-default)]/50 w-full">
                  <button
                    onClick={() => navigate(`/creator/${c.username}`)}
                    className="w-full h-8 rounded-shape-xs bg-[var(--surface-subtle)] hover:bg-[var(--surface-inset)] border border-[var(--border-default)] text-[var(--text-primary)] font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <span>{isAr ? 'عرض صفحة المبدع' : 'View Creator Profile'}</span>
                    <ArrowUpRight size={12} />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Creator Join Call to Action Banner */}
        <div className="max-w-7xl mx-auto p-6 sm:p-8 rounded-shape-lg bg-[var(--surface-card)] border border-[color-mix(in_oklab,var(--accent)_30%,var(--border-default))] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 end-0 -mt-8 -me-8 w-32 h-32 bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-1.5 text-center md:text-start relative z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-shape-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
              🔥 {isAr ? 'فرصة حقيقية لصناع المحتوى' : 'Creator Journey'}
            </span>
            <h3 className="text-base sm:text-xl font-black text-[var(--text-primary)] leading-none">
              {isAr ? 'سجل كمصمم وابدأ الربح من قوالبك المبتكرة' : 'Publish Premium Templates & Earn'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              {isAr 
                ? 'هل تصنع قوالب تصميم أو ريلز احترافية؟ انشرها الآن في رينكس واحصل على عوائد ممتازة وعمولات عن كل استخدام ومشاهدة مع لوحة تحكم سحب أرباح مدمجة وآمنة.' 
                : 'Turn your design masterpieces into dynamic streams of royalties. Start publishing templates and unlock passive payouts.'}
            </p>
          </div>

          <button
            onClick={handleJoinAsCreator}
            className="h-10 px-6 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs flex items-center gap-1.5 shadow hover:opacity-95 transition-all cursor-pointer shrink-0"
          >
            <span>{isAr ? 'ابدأ كصانع محتوى واربح' : 'Join as Creator & Earn'}</span>
            <ArrowRight size={14} className={isAr ? 'rotate-180' : ''} />
          </button>
        </div>

      </section>

      {/* 5. INTERACTIVE USER TESTIMONIALS & REVIEWS SECTION (قسم آراء المستخدمين الحية مع إمكانية إضافة مراجعة) */}
      <section className="p-6 sm:p-8 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500">
              <Star size={16} className="fill-amber-500" />
              <span>{isAr ? 'مجتمع مصممي رينكس' : 'Community Testimonials'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
              {isAr ? 'آراء وتجارب صناع المحتوى والمصممين' : 'What Creators Say About RINEX'}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {isAr ? 'تجارب حقيقية لمصممين استخدموا الاستوديو في أعمالهم التسويقية والإبداعية.' : 'Real feedback from designers and digital creators.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className="h-10 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs flex items-center gap-2 cursor-pointer shadow-2xs hover:opacity-90 transition-all active:scale-95"
          >
            <MessageSquarePlus size={16} />
            <span>{isAr ? 'اكتب تجربتك وأضف تصميمك' : 'Share Your Review & Design'}</span>
          </button>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.map((rev) => (
            <div 
              key={rev.id} 
              className="p-5 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-[var(--border-accent)] transition-all flex flex-col justify-between space-y-4 shadow-2xs group"
            >
              <div className="space-y-3">
                {/* User Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={rev.avatar} 
                      alt={rev.name} 
                      className="w-10 h-10 rounded-full object-cover border border-[var(--border-default)]" 
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1">
                        <span>{rev.name}</span>
                        {rev.verified && (
                          <span title={isAr ? 'حساب موثق' : 'Verified'}>
                            <CheckCircle2 size={12} className="text-[var(--fg-success)] fill-[color-mix(in_srgb,var(--fg-success)_20%,transparent)]" />
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        {isAr ? rev.roleAr : rev.roleEn}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} size={12} className="fill-amber-500" />
                    ))}
                  </div>
                </div>

                {/* Comment Text */}
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                  "{isAr ? rev.commentAr : rev.commentEn}"
                </p>
              </div>

              {/* Design Attachment Preview if available */}
              {rev.mediaUrl && (
                <div className="pt-2 border-t border-[var(--border-default)] space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono block">
                    {isAr ? '📷 مرفق تصميم المستخدم:' : '📷 Attached User Showcase:'}
                  </span>
                  <div className="h-28 w-full rounded-shape-xs bg-slate-900 overflow-hidden border border-[var(--border-default)] relative">
                    <img 
                      src={rev.mediaUrl} 
                      alt="User Design" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 5. PRICING SECTION (قسم الأسعار والخطط للمستخدمين) */}
      <section className="space-y-8 py-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">
            <Sparkles size={14} />
            <span>{isAr ? 'الخطط والأسعار' : 'Pricing Plans'}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            {isAr ? 'خطط اشتراك مرنة تناسب كافة الاحتياجات الإبداعية' : 'Flexible Plans for Every Creator'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            {isAr ? 'اختر الباقة المناسبة لمشاريعك مع حماية سيادية تامة وقدرات غير محدودة.' : 'Choose the ideal plan for your projects with full sovereign security.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 items-start">
          {userPlans.map((plan: any, planIdx: number) => {
            const planColor = plan.color || 'var(--fg-accent)';
            const effectiveCycle = selectedPlanCycles[plan.id] || 'monthly';
            const planPrice = effectiveCycle === 'annual' ? (plan.annualPrice || plan.monthlyPrice * 12 * 0.85) : plan.monthlyPrice;
            const savings = plan.isAnnualEnabled !== false && plan.monthlyPrice > 0 ? 17 : 0;

            return (
              <div 
                key={`sub-plan-${plan.id || planIdx}`} 
                className="relative rounded-shape-lg border p-5 md:p-7 flex flex-col transition-all duration-200 bg-[var(--surface-card)] border-[var(--border-default)] hover:border-[var(--border-strong)] shadow-sm group"
                style={{ borderColor: planColor, boxShadow: `0 4px 20px -4px ${planColor}20` }}
              >
                {/* Plan Color Stripe */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5 rounded-t-lg transition-all group-hover:h-2" 
                  style={{ backgroundColor: planColor }}
                />

                {plan.badge && plan.badge !== 'none' && (
                  <div className="absolute top-0 right-5 md:right-7 -translate-y-1/2">
                    <span 
                      className="px-2.5 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wider text-white rounded-shape-xs shadow-sm" 
                      style={{ backgroundColor: planColor }}
                    >
                      {plan.badge.toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="mb-3 pt-1">
                  <h3 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2 text-[var(--text-primary)]">
                    <span 
                      className="w-2.5 h-2.5 rounded-shape-full shrink-0 shadow-xs" 
                      style={{ backgroundColor: planColor }}
                    />
                    <span>{safeText(isAr ? (plan.nameAr || plan.name) : (plan.nameEn || plan.name))}</span>
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {safeText(isAr ? (plan.descriptionAr || plan.description || plan.descAr) : (plan.descriptionEn || plan.description || plan.descEn))}
                  </p>
                </div>

                {/* Billing Cycle Pill Buttons */}
                <div className="p-1 rounded-shape-sm flex items-center bg-[var(--surface-subtle)] border border-[var(--border-default)] mb-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlanCycles(prev => ({ ...prev, [plan.id]: 'monthly' }))}
                    className={`flex-1 py-1.5 px-2 rounded-shape-xs text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      effectiveCycle === 'monthly'
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {isAr ? 'شهري' : 'Monthly'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlanCycles(prev => ({ ...prev, [plan.id]: 'annual' }))}
                    className={`flex-1 py-1.5 px-2 rounded-shape-xs text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      effectiveCycle === 'annual'
                        ? 'bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {isAr ? 'سنوي' : 'Annual'}
                  </button>
                </div>

                <div className="mb-5 text-[var(--text-primary)]">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                      ${planPrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-medium">/ {effectiveCycle === 'annual' ? (isAr ? 'سنوي' : 'Annual') : (isAr ? 'شهري' : 'Monthly')}</span>
                  </div>
                  {effectiveCycle === 'monthly' && savings > 0 && (
                    <div className="mt-1 text-xs font-semibold" style={{ color: planColor }}>
                      {isAr ? `وفر ${savings}% مع الدفع السنوي` : `Save ${savings}% with annual billing`}
                    </div>
                  )}

                  {/* Plan Credits Allowance Badge */}
                  <div className="mt-2.5 p-2 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[var(--text-primary)]">
                      <Sparkles size={14} style={{ color: planColor }} />
                      <span>
                        {Number(
                          effectiveCycle === 'annual'
                            ? (plan.annualCredits || (plan.monthlyCredits ? plan.monthlyCredits * 12 : Math.round((plan.annualPrice || 0) * 1000)))
                            : (plan.monthlyCredits || Math.round((plan.monthlyPrice || 0) * 1000) || 50000)
                        ).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-bold">
                        {isAr ? 'كريديت ذكاء اصطناعي' : 'AI Credits'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-6 relative z-10">
                  {plan.monthlyPrice === 0 ? (
                    <button 
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="col-span-2 py-2.5 md:py-3 min-h-[44px] rounded-shape-sm text-white font-bold text-xs md:text-sm transition-all duration-150 shadow-sm flex items-center justify-center hover:opacity-95 active:scale-[0.98] cursor-pointer"
                      style={{ backgroundColor: planColor, boxShadow: `0 2px 10px 0 ${planColor}35` }}
                    >
                      {isAr ? 'تفعيل الخطة المجانية' : 'Activate Free Plan'}
                    </button>
                  ) : (
                    <>
                      <button 
                        type="button"
                        onClick={() => setIsAuthModalOpen(true)}
                        className="py-2.5 md:py-3 min-h-[44px] rounded-shape-sm text-white font-bold text-xs md:text-sm transition-all duration-150 shadow-sm flex items-center justify-center hover:opacity-95 active:scale-[0.98] cursor-pointer"
                        style={{ backgroundColor: planColor, boxShadow: `0 2px 10px 0 ${planColor}35` }}
                      >
                        {isAr ? 'اشتراك' : 'Subscribe'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsAuthModalOpen(true)}
                        className="py-2.5 md:py-3 min-h-[44px] rounded-shape-sm font-bold text-xs md:text-sm transition-all duration-150 border bg-transparent hover:bg-[var(--surface-subtle)] flex items-center justify-center active:scale-[0.98] cursor-pointer"
                        style={{ borderColor: planColor, color: planColor }}
                      >
                        {isAr ? 'الدفع بالرصيد' : 'Pay with Balance'}
                      </button>
                    </>
                  )}
                </div>

                <div className="space-y-2 pt-3 border-t border-[var(--border-default)]">
                  <div className="text-[11px] font-bold text-[var(--text-muted)] mb-2">
                    {isAr ? 'الميزات والخصائص' : 'Features & Benefits'}
                  </div>
                  {safeList((isAr ? plan.featuresAr : plan.featuresEn) || plan.features || []).map((featText: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <CheckCircle2 size={13} className="text-[var(--fg-success)] shrink-0" />
                      <span>{featText}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. FAQ SECTION (قسم الأسئلة الشائعة بنمط القائمة المطوية الاحترافية - عمودين) */}
      <section className="space-y-8 py-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">
            <HelpCircle size={14} />
            <span>{isAr ? 'الأسئلة الشائعة' : 'FAQ'}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            {isAr ? 'كل ما تحتاج معرفته عن استوديو رينكس' : 'Everything You Need to Know'}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto">
          <div className="space-y-3">
            {faqItems.slice(0, 3).map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-start font-bold text-xs sm:text-sm text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                      <span>{isAr ? faq.qAr : faq.qEn}</span>
                    </span>
                    <ChevronDown size={16} className={`transition-transform duration-200 text-[var(--text-muted)] ${isOpen ? 'rotate-180 text-[var(--accent)]' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--border-default)] bg-[var(--surface-subtle)]/30 animate-in fade-in duration-150">
                      {isAr ? faq.aAr : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            {faqItems.slice(3, 6).map((faq, idx) => {
              const actualIdx = idx + 3;
              const isOpen = openFaqIndex === actualIdx;
              return (
                <div 
                  key={actualIdx} 
                  className="rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : actualIdx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-start font-bold text-xs sm:text-sm text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                      <span>{isAr ? faq.qAr : faq.qEn}</span>
                    </span>
                    <ChevronDown size={16} className={`transition-transform duration-200 text-[var(--text-muted)] ${isOpen ? 'rotate-180 text-[var(--accent)]' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--border-default)] bg-[var(--surface-subtle)]/30 animate-in fade-in duration-150">
                      {isAr ? faq.aAr : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. CONTACT US SECTION (قسم اتصل بنا الفائق مع صورة تعبيرية وشراكة) */}
      <section className="space-y-8 py-8 max-w-7xl mx-auto px-4">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">
            <MessageSquare size={14} />
            <span>{isAr ? 'تواصل معنا' : 'Contact Us'}</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            {isAr ? 'نحن هنا لدعم نجاحك وإجابة استفساراتك' : 'We Are Here to Support Your Success'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            {isAr ? 'أرسل لنا استفسارك، مقترحك، أو طلب الشراكة وسيتم الرد خلال ساعات معدودة.' : 'Send us your inquiry, proposal, or partnership request.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Contact Form Column (7 cols - placed first) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <form onSubmit={handleContactSubmit} className="p-6 sm:p-8 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-default)] shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">{isAr ? 'الاسم الكريم' : 'Full Name'}</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={isAr ? 'مثال: أحمد الملا' : 'John Doe'}
                    className="w-full h-10 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">{isAr ? 'المهنة أو التخصص' : 'Profession / Role'}</label>
                  <input
                    type="text"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    placeholder={isAr ? 'مثال: مصمم واجهات، صانع محتوى' : 'Graphic Designer'}
                    className="w-full h-10 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">{isAr ? 'سبب الاتصال' : 'Contact Reason'}</label>
                  <select
                    value={contactReason}
                    onChange={(e) => setContactReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    <option value="suggestion">{isAr ? '💡 اقتراح تطويري' : '💡 Feature Suggestion'}</option>
                    <option value="partnership">{isAr ? '🤝 طلب شراكة أو تعاون' : '🤝 Partnership Request'}</option>
                    <option value="bug">{isAr ? '🛠️ الإبلاغ عن خلل تقني' : '🛠️ Report Technical Bug'}</option>
                    <option value="career">{isAr ? '💼 بحث عن عمل أو انضمام' : '💼 Career Opportunity'}</option>
                    <option value="other">{isAr ? '💬 استفسار عام آخر' : '💬 General Inquiry'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)]">{isAr ? 'إرفاق ملف أو صورة (اختياري - صور أو PDF فقط)' : 'Attach Image or PDF (Optional)'}</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error(isAr ? 'حجم الملف يجب ألا يتجاوز 10 ميجابايت' : 'File size must not exceed 10MB');
                          return;
                        }
                        setContactFile(file);
                      }
                    }}
                    className="w-full text-xs text-[var(--text-muted)] file:me-3 file:py-2 file:px-3 file:rounded-shape-xs file:border-0 file:text-xs file:font-bold file:bg-[var(--surface-subtle)] file:text-[var(--text-primary)] hover:file:bg-[var(--surface-inset)] cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">{isAr ? 'نص الرسالة (يُمنع رفع الروابط أو الأكواد)' : 'Message (URLs and code snippets are prohibited)'}</label>
                <textarea
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder={isAr ? 'اكتب تفاصيل استفسارك أو طلبك بوضوح...' : 'Write your message details clearly...'}
                  className="w-full p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                <p className="text-[10px] text-[var(--text-muted)]">
                  {isAr ? '⚠️ ملاحظة أمنية: يمنع منعاً باتاً إدراج روابط خارجية أو أكواد برمجية في الرسالة.' : 'Security note: External links and code snippets are strictly prohibited.'}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingContact}
                  className="h-10 px-6 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs shadow-2xs hover:opacity-90 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {isSubmittingContact ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>{isAr ? 'إرسال الرسالة السيادية' : 'Send Secure Message'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Visual Partnership & Support Image Column (5 cols - placed second) */}
          <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
            <div className="relative rounded-shape-lg overflow-hidden border border-[var(--border-default)] shadow-xl group aspect-4/3 lg:aspect-square">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80" 
                alt="Rinex Creative Studio Support & Partnership"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-6 text-white space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs bg-[var(--bg-success-muted)] border border-[color-mix(in_srgb,var(--fg-success)_30%,transparent)] text-[var(--fg-success)] text-[10px] font-bold w-fit">
                  <ShieldCheck size={12} />
                  <span>{isAr ? 'فريق دعم فني معتمد' : 'Verified Support Team'}</span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {isAr ? 'شراكة حقيقية ونمو مستدام لمشاريعك' : 'True Partnership & Sustainable Growth'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isAr ? 'نحن نؤمن بأن نجاحك هو نجاح لمنظومتنا، وفريقنا المتخصص مستعد دوماً لمساعدتك.' : 'We believe your success is our success. Our dedicated team is always ready.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. NEWSLETTER SUBSCRIPTION SECTION (نشرة التحديثات البريدية بعمودين وعكس مكان الصورة) */}
      <section className="space-y-8 py-8 max-w-7xl mx-auto px-4">
        <div className="p-6 sm:p-10 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-default)] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Newsletter Image Column (5 cols - placed first, reversing position) */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="relative rounded-shape-md overflow-hidden border border-[var(--border-default)] shadow-xl group aspect-4/3 lg:aspect-square">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80" 
                  alt="Rinex Creative Studio Updates & Innovation"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-6 text-white space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 text-[10px] font-bold w-fit">
                    <Zap size={12} />
                    <span>{isAr ? 'تحديثات حصرية أسبوعية' : 'Weekly Exclusive Updates'}</span>
                  </div>
                  <h3 className="text-base font-black tracking-tight">
                    {isAr ? 'كن دائماً في طليعة المبدعين وصناع المحتوى' : 'Always Stay Ahead of the Curve'}
                  </h3>
                </div>
              </div>
            </div>

            {/* Newsletter Text & Form Column (7 cols - placed second) */}
            <div className="lg:col-span-7 space-y-4 text-center lg:text-start order-1 lg:order-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-shape-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] text-[var(--accent)] text-xs font-bold">
                <Globe size={14} />
                <span>{isAr ? 'النشرة البريدية الحصرية' : 'Exclusive Newsletter'}</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                {isAr ? 'اشترك في نشرتنا البريدية حول التحديثات' : 'Subscribe to Our Product Updates'}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-xl">
                {isAr ? 'احصل على أحدث القوالب، ميزات الذكاء الاصطناعي، وتحديثات استوديو رينكس مباشرة في بريدك الإلكتروني.' : 'Get the latest templates, AI features, and studio updates directly in your inbox.'}
              </p>

              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={isAr ? 'ادخل بريدك الإلكتروني...' : 'Enter your email...'}
                  className="w-full sm:w-80 h-10 px-4 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto h-10 px-6 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs shadow-2xs hover:opacity-90 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send size={14} />
                  <span>{isAr ? 'اشتراك' : 'Subscribe'}</span>
                </button>
              </form>
              {isSubscribedNewsletter && (
                <p className="text-xs font-bold text-[var(--fg-success)]">
                  {isAr ? '✨ تم اشتراكك بنجاح في النشرة الدورية!' : '✨ Successfully subscribed to the newsletter!'}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 9. BOTTOM CTA SECTION (قسم الدعوة النهائية للعمل الاحترافي - متناسق مع الأقسام السابقة مع صورة حيوية) */}
      <section className="space-y-8 py-8 max-w-7xl mx-auto px-4">
        <div className="p-6 sm:p-10 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-default)] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Text & Button Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4 text-center lg:text-start">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-shape-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] text-[var(--accent)] text-xs font-bold">
                <Sparkles size={14} />
                <span>{isAr ? 'ابدأ رحلتك اليوم' : 'Start Your Journey Today'}</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                {isAr ? 'جاهز لبدء مشروعك الإبداعي الأول؟' : 'Ready to Launch Your First Design?'}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-xl">
                {isAr 
                  ? 'انضم إلينا اليوم مجاناً، وأنشئ مشاريعك بحماية كاملة وتحديد مالك معتمد لتصميماتك دون أي تعقيد.' 
                  : 'Join thousands of creators today. Register for free and get full ownership of your designs.'
                }
              </p>
              <div className="pt-2 flex items-center justify-center lg:justify-start gap-3">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="h-10 px-6 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs shadow-2xs hover:opacity-90 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <UserPlus size={16} />
                  <span>{isAr ? 'إنشاء حساب مجاني الآن' : 'Create Free Account'}</span>
                </button>
              </div>
            </div>

            {/* Visual Launch Image Column (5 cols) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-shape-md overflow-hidden border border-[var(--border-default)] shadow-xl group aspect-4/3 lg:aspect-square">
                <img 
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80" 
                  alt="Launch Creative Project"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-6 text-white space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-shape-xs bg-[var(--bg-success-muted)] border border-[color-mix(in_srgb,var(--fg-success)_30%,transparent)] text-[var(--fg-success)] text-[10px] font-bold w-fit">
                    <ShieldCheck size={12} />
                    <span>{isAr ? 'حماية سيادية واعتماد مالك' : 'Sovereign Ownership'}</span>
                  </div>
                  <h3 className="text-base font-black tracking-tight">
                    {isAr ? 'مستقبل التصميم وصناعة المحتوى يبدأ هنا' : 'The Future of Creation Starts Here'}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEW SUBMISSION MODAL (نافذة إضافة رأي وتصميم) */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-[var(--text-primary)]">
                <MessageSquarePlus size={18} className="text-[var(--accent)]" />
                <span>{isAr ? 'شارك تجربتك مع مجتمع رينكس' : 'Submit Your Review & Design'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-shape-xs hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddReviewSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">{isAr ? 'اسمك الكريم' : 'Your Name'}</label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder={isAr ? 'مثال: محمد الغامدي' : 'John Doe'}
                  className="w-full px-3 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">{isAr ? 'المسمى الوظيفي أو التخصص' : 'Your Role or Specialty'}</label>
                <input
                  type="text"
                  value={reviewerRole}
                  onChange={(e) => setReviewerRole(e.target.value)}
                  placeholder={isAr ? 'مثال: مصمم جرافيك، صانع محتوى' : 'Graphic Designer'}
                  className="w-full px-3 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">{isAr ? 'التقييم' : 'Rating'}</label>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewerRating(star)}
                      className="p-1 text-amber-500 cursor-pointer hover:scale-110 transition-transform"
                    >
                      <Star size={20} className={star <= reviewerRating ? 'fill-amber-500' : 'text-slate-400'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">{isAr ? 'تجربتك ورأيك في الاستوديو' : 'Your Feedback'}</label>
                <textarea
                  required
                  rows={3}
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                  placeholder={isAr ? 'اكتب انطباعك ورأيك في أدوات المنصة والكانفاس...' : 'Share your experience using Rinex Creative Studio...'}
                  className="w-full px-3 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--text-secondary)]">{isAr ? 'رابط صورة تصميمك (اختياري)' : 'Design Showcase Image URL (Optional)'}</label>
                <input
                  type="url"
                  value={reviewerMediaUrl}
                  onChange={(e) => setReviewerMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="h-8 px-3 rounded-shape-sm text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="h-8 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs cursor-pointer shadow-2xs hover:opacity-90 active:scale-95 flex items-center gap-1.5"
                >
                  <Send size={12} />
                  <span>{isAr ? 'نشر التجربة' : 'Submit Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Template Preview Modal for Visitors */}
      <TemplatePreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />

      {/* Certified Creator Registration Modal */}
      <CreatorRegistrationModal
        isOpen={isCreatorModalOpen}
        onClose={() => setIsCreatorModalOpen(false)}
      />

    </div>
  );
};
