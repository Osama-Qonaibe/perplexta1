import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  Sparkles, Upload, Plus, ChevronRight, ChevronLeft, 
  Palette, LayoutTemplate, Sliders, ArrowUpRight, 
  Languages, Camera, Smartphone, Monitor, Video, CreditCard,
  FolderHeart, Star, Trash2, Copy, Search, Filter, ShieldCheck,
  User as UserIcon, Crown, FolderOpen, Image as ImageIcon,
  FileText, Sparkle, RefreshCw, Layers, Check, ExternalLink,
  Edit3, ArrowRight, UploadCloud, Award
} from 'lucide-react';
import { ArtifactImageEditor, CanvasElement, EditorFilters } from '../components/chat/artifacts/ArtifactImageEditor';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { resolveImageUrl } from '../utils/imageResolver';
import { toast } from '@/design-system';
import { 
  StudioProject, 
  getUserStudioProjects, 
  saveUserStudioProject, 
  deleteUserStudioProject, 
  duplicateUserStudioProject, 
  toggleFavoriteStudioProject 
} from '../data/rataqProjects';
import { 
  StudioUploadItem, 
  getStoredStudioUploads,
  getUploadsFromDB,
  getStudioSessionFromDB,
  clearStudioSessionFromDB
} from '../data/rataqUploads';
import { 
  StudioBrandKit, 
  getStoredBrandKit 
} from '../data/rataqBrandKit';
import { PublicGuestLanding } from '../components/PublicGuestLanding';
import { RataqRepoTemplates, RataqRepoTemplate } from '../data/templates';
import { convertRataqTemplateToCanvasElements } from '../utils/rataqTemplateLoader';
import { CreatorRegistrationModal } from '../components/creators/CreatorRegistrationModal';
import { TemplatePreviewModal } from '../components/creators/TemplatePreviewModal';
import { getStoredCreators, getStoredMarketplaceTemplates, recordTemplateUse, MarketplaceTemplate } from '../data/rinexCreators';
import { UNIFIED_PUBLIC_TEMPLATES, PublicTemplateItem } from '../data/publicTemplatesData';

interface CanvasPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  width: number;
  height: number;
  icon: React.ReactNode;
  aspectRatio: string;
  category: 'social' | 'marketing' | 'print' | 'custom';
}

const CANVAS_PRESETS: CanvasPreset[] = [
  {
    id: 'instagram_post',
    nameAr: 'منشور إنستغرام مربع',
    nameEn: 'Instagram Post (Square)',
    width: 1080,
    height: 1080,
    icon: <Camera className="w-5 h-5 text-[var(--accent)]" />,
    aspectRatio: '1:1',
    category: 'social'
  },
  {
    id: 'instagram_story',
    nameAr: 'ستوري وريلز عمودي',
    nameEn: 'Story & Reels (9:16)',
    width: 1080,
    height: 1920,
    icon: <Smartphone className="w-5 h-5 text-[var(--accent)]" />,
    aspectRatio: '9:16',
    category: 'social'
  },
  {
    id: 'web_banner',
    nameAr: 'بانر عريض للمواقع',
    nameEn: 'Landscape Banner (16:9)',
    width: 1920,
    height: 1080,
    icon: <Monitor className="w-5 h-5 text-[var(--accent)]" />,
    aspectRatio: '16:9',
    category: 'marketing'
  },
  {
    id: 'youtube_thumbnail',
    nameAr: 'صورة يوتيوب مصغرة',
    nameEn: 'YouTube Thumbnail',
    width: 1280,
    height: 720,
    icon: <Video className="w-5 h-5 text-[var(--accent)]" />,
    aspectRatio: '16:9',
    category: 'marketing'
  },
  {
    id: 'business_card',
    nameAr: 'بطاقة أعمال / غلاف',
    nameEn: 'Business Card / Card',
    width: 1200,
    height: 630,
    icon: <CreditCard className="w-5 h-5 text-[var(--accent)]" />,
    aspectRatio: '1.91:1',
    category: 'marketing'
  }
];

const PUBLIC_TEMPLATES: PublicTemplateItem[] = UNIFIED_PUBLIC_TEMPLATES;

const PUBLIC_STUDIO_FEATURES = [
  {
    icon: <Layers className="w-5 h-5 text-[var(--accent)]" />,
    titleAr: 'محرر متعدد الصفحات (Multi-Page Canvas)',
    titleEn: 'Multi-Page Canvas System',
    descAr: 'إضافة وتنظيم وتنسيق صفحات متعددة داخل مساحة عمل مرنة مع التمرير السلس بين الصفحات.',
    descEn: 'Create, reorder, and edit stacked multi-page canvases seamlessly.'
  },
  {
    icon: <Sparkles className="w-5 h-5 text-[var(--accent)]" />,
    titleAr: 'المحو السحري وتنقية الخلفيات',
    titleEn: 'AI Magic Eraser & Inpainting',
    descAr: 'إزالة الأجسام غير المرغوبة وترميم خلفية الصور بالذكاء الاصطناعي بنقرة واحدة.',
    descEn: 'Instantly remove unwanted objects and repair background textures.'
  },
  {
    icon: <Edit3 className="w-5 h-5 text-[var(--accent)]" />,
    titleAr: 'خطوط عربية وتشكيل نصوص احترافي',
    titleEn: 'Arabic Calligraphy & Typography',
    descAr: 'مكتبة خطوط عربية فاخرة مع التحكم في ظلال النصوص، الحدود، والتشكيل الجمالي.',
    descEn: 'Curated Arabic fonts with precise text shadows, strokes, and letter spacing.'
  },
  {
    icon: <UploadCloud className="w-5 h-5 text-[var(--accent)]" />,
    titleAr: 'تصدير عالي الدقة 4K بدون علامات مائية',
    titleEn: 'High-Res 4K Exporting',
    descAr: 'حفظ واستخراج التصميمات بصيغ PNG, WEBP, PDF, SVG عالية الجودة مباشرة.',
    descEn: 'Export high-definition graphics in PNG, WEBP, PDF, and SVG vector formats.'
  }
];

function parseTemplateDimensions(dimStr?: string): { width: number; height: number } | undefined {
  if (!dimStr) return undefined;
  const match = dimStr.match(/(\d+)\s*[×xX*]\s*(\d+)/);
  if (match) {
    const w = parseInt(match[1], 10);
    const h = parseInt(match[2], 10);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      return { width: w, height: h };
    }
  }
  return undefined;
}

export const ImageStudioPage: React.FC = () => {
  const { language, setLanguage, dir, theme, siteSettings, user, setIsAuthModalOpen } = useAppContext();
  const isAr = language === 'ar' || dir === 'rtl';
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.loadMarketplaceTemplate) {
      const tpl = location.state.loadMarketplaceTemplate;
      const newId = `project-marketplace-${tpl.id}-${Date.now()}`;
      setActiveProjectId(newId);
      setActiveInitialElements(tpl.elements || []);
      setActiveInitialFilters(undefined);
      const templateSize = ((tpl as any).width && (tpl as any).height) ? { width: (tpl as any).width, height: (tpl as any).height } : parseTemplateDimensions(tpl.dimensions);
      if (templateSize) setActiveInitialImageSize(templateSize);
      setActiveImageArtifact({
        id: newId,
        title: isAr ? tpl.titleAr : tpl.titleEn,
        content: tpl.canvasBackground || tpl.thumbnail || tpl.src
      });
      // Clear location state after processing to avoid reload trigger
      window.history.replaceState({}, document.title);
    } else if (user) {
      try {
        const pendingTplId = sessionStorage.getItem('pending_studio_template');
        const pendingTplPayload = sessionStorage.getItem('pending_studio_template_payload');
        if (pendingTplPayload || pendingTplId) {
          const allTpls = getStoredMarketplaceTemplates();
          let tpl = pendingTplPayload ? JSON.parse(pendingTplPayload) : null;
          if (!tpl && pendingTplId) {
            tpl = allTpls.find(t => t.id === pendingTplId) || (PUBLIC_TEMPLATES.find(t => t.id === pendingTplId) as any);
          }
          if (tpl) {
            recordTemplateUse(tpl.id);
            const newId = `project-pending-${tpl.id}-${Date.now()}`;
            setActiveProjectId(newId);

            let loadedElements = tpl.elements || [];
            let loadedBg = tpl.canvasBackground || tpl.thumbnail || tpl.src;
            let loadedSize = ((tpl as any).width && (tpl as any).height) ? { width: (tpl as any).width, height: (tpl as any).height } : parseTemplateDimensions(tpl.dimensions);

            if (tpl.repoTemplate) {
              const converted = convertRataqTemplateToCanvasElements(tpl.repoTemplate);
              loadedElements = converted.elements;
              loadedBg = converted.canvasBackground || converted.previewUrl;
              loadedSize = { width: converted.width, height: converted.height };
            }

            setActiveInitialElements(loadedElements);
            setActiveInitialFilters(undefined);
            if (loadedSize) setActiveInitialImageSize(loadedSize);
            setActiveImageArtifact({
              id: newId,
              title: isAr ? (tpl.titleAr || tpl.title) : (tpl.titleEn || tpl.title),
              content: loadedBg
            });
            toast.success(
              isAr 
                ? 'تم فتح القالب المطلوب في مساحتك الإبداعية المحمية بنجاح!' 
                : 'Requested template initialized in your protected workspace!'
            );
          }
          sessionStorage.removeItem('pending_studio_template');
          sessionStorage.removeItem('pending_studio_template_payload');
        }
      } catch (e) {}
    }
  }, [location.state, user, isAr]);

  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState<boolean>(false);
  const [previewTemplate, setPreviewTemplate] = useState<MarketplaceTemplate | null>(null);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<'all' | 'community' | 'marketing' | 'reels' | 'story' | 'social' | 'repo'>('all');

  const isUserRegisteredCreator = useMemo(() => {
    if (!user) return false;
    const creators = getStoredCreators();
    return creators.some(c => 
      (c.email && (c as any).email === user.email) ||
      (c.name && c.name.toLowerCase() === user.name.toLowerCase()) ||
      ((user as any)?.username && c.username.toLowerCase() === (user as any).username.toLowerCase())
    );
  }, [user]);

  const logo = theme === 'dark' ? siteSettings?.logoBase64 : (siteSettings?.logoLightBase64 || siteSettings?.logoBase64);

  // Active Tab State (Default to 'templates' for guest showcase or 'projects' for logged-in users)
  const [activeTab, setActiveTab] = useState<'projects' | 'templates' | 'presets' | 'brand' | 'uploads' | 'features'>(() => user ? 'projects' : 'templates');
  const [projectSearchQuery, setProjectSearchQuery] = useState<string>('');
  const [projectFilterFavorite, setProjectFilterFavorite] = useState<boolean>(false);

  // Public Landing Category Filter State (Guest Mode)
  const [publicCategoryFilter, setPublicCategoryFilter] = useState<'all' | 'reels' | 'story' | 'marketing' | 'social' | 'youtube' | 'cards'>('all');

  const filteredPublicTemplates = useMemo(() => {
    if (publicCategoryFilter === 'all') return PUBLIC_TEMPLATES;
    return PUBLIC_TEMPLATES.filter(t => t.category === publicCategoryFilter);
  }, [publicCategoryFilter]);

  // User Isolated Projects & Assets State
  const [projects, setProjects] = useState<StudioProject[]>(() => getUserStudioProjects(user?.id));
  const [uploads, setUploads] = useState<StudioUploadItem[]>(() => getStoredStudioUploads(user?.id));
  const [brandKit, setBrandKit] = useState<StudioBrandKit>(() => getStoredBrandKit(user?.id, siteSettings));

  // Sync projects and brandkit when user changes
  useEffect(() => {
    setProjects(getUserStudioProjects(user?.id));
    setUploads(getStoredStudioUploads(user?.id));
    getUploadsFromDB(user?.id).then((items) => {
      if (items && items.length > 0) {
        setUploads(items);
      }
    });
    setBrandKit(getStoredBrandKit(user?.id, siteSettings));
  }, [user?.id, siteSettings]);

  // Guard activeTab for guest users (Strict guest isolation)
  useEffect(() => {
    if (!user && (activeTab === 'projects' || activeTab === 'brand' || activeTab === 'uploads')) {
      setActiveTab('templates');
    }
  }, [user, activeTab]);

  // Custom Dimension State
  const [customW, setCustomW] = useState<number>(1080);
  const [customH, setCustomH] = useState<number>(1080);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);

  // Active Editor Session State (Immediate synchronous restore to ensure zero flicker or data loss on refresh/reload)
  const [activeImageArtifact, setActiveImageArtifact] = useState<{ id: string; title: string; content: string } | null>(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('rataq_studio_session_active') === 'true') {
        const stored = localStorage.getItem('rataq_studio_session_artifact');
        if (stored) return JSON.parse(stored);
      }
    } catch {}
    return null;
  });

  const [activeInitialElements, setActiveInitialElements] = useState<CanvasElement[] | undefined>(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('rataq_studio_session_active') === 'true') {
        const stored = localStorage.getItem('rataq_studio_session_elements');
        if (stored) return JSON.parse(stored);
      }
    } catch {}
    return undefined;
  });

  const [activeInitialFilters, setActiveInitialFilters] = useState<EditorFilters | undefined>(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('rataq_studio_session_active') === 'true') {
        const stored = localStorage.getItem('rataq_studio_session_filters');
        if (stored) return JSON.parse(stored);
      }
    } catch {}
    return undefined;
  });

  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('rataq_studio_session_active') === 'true') {
        return localStorage.getItem('rataq_studio_session_projectId') || undefined;
      }
    } catch {}
    return undefined;
  });

  const [activeInitialPages, setActiveInitialPages] = useState<any[] | undefined>(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('rataq_studio_session_active') === 'true') {
        const stored = localStorage.getItem('rataq_studio_session_pages');
        if (stored) return JSON.parse(stored);
      }
    } catch {}
    return undefined;
  });

  const [activeInitialCurrentPageIndex, setActiveInitialCurrentPageIndex] = useState<number | undefined>(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('rataq_studio_session_active') === 'true') {
        const stored = localStorage.getItem('rataq_studio_session_currentPageIndex');
        if (stored) return parseInt(stored, 10);
      }
    } catch {}
    return undefined;
  });

  const [activeInitialImageSize, setActiveInitialImageSize] = useState<{ width: number; height: number } | undefined>(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('rataq_studio_session_active') === 'true') {
        const stored = localStorage.getItem('rataq_studio_session_imageSize');
        if (stored) return JSON.parse(stored);
      }
    } catch {}
    return undefined;
  });

  // Restore previous active canvas session on refresh / reload
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // 1. Try restoring from unlimited IndexedDB first (bypasses localStorage limits completely)
        const dbSession = await getStudioSessionFromDB();
        if (dbSession && dbSession.artifact && dbSession.elements) {
          setActiveProjectId(dbSession.projectId);
          setActiveImageArtifact(dbSession.artifact);
          setActiveInitialElements(dbSession.elements);
          if (dbSession.filters) setActiveInitialFilters(dbSession.filters);
          if (dbSession.imageSize) setActiveInitialImageSize(dbSession.imageSize);
          if (dbSession.pages) setActiveInitialPages(dbSession.pages);
          if (dbSession.currentPageIndex !== undefined) {
            setActiveInitialCurrentPageIndex(dbSession.currentPageIndex);
          }
          toast.success(
            isAr 
              ? 'تم استعادة جلستك التصميمية السابقة تلقائياً بنجاح! 🔄' 
              : 'Your previous canvas design session was successfully restored! 🔄'
          );
          return;
        }

        // 2. Fallback to localStorage if no IndexedDB session exists
        const sessionActive = localStorage.getItem('rataq_studio_session_active');
        if (sessionActive === 'true') {
          const storedProjId = localStorage.getItem('rataq_studio_session_projectId') || undefined;
          const storedArtifact = localStorage.getItem('rataq_studio_session_artifact');
          const storedElements = localStorage.getItem('rataq_studio_session_elements');
          const storedFilters = localStorage.getItem('rataq_studio_session_filters');
          const storedImageSize = localStorage.getItem('rataq_studio_session_imageSize');
          const storedPages = localStorage.getItem('rataq_studio_session_pages');
          const storedCurrentPageIndex = localStorage.getItem('rataq_studio_session_currentPageIndex');

          if (storedArtifact && storedElements) {
            setActiveProjectId(storedProjId);
            setActiveImageArtifact(JSON.parse(storedArtifact));
            setActiveInitialElements(JSON.parse(storedElements));
            if (storedFilters) {
              setActiveInitialFilters(JSON.parse(storedFilters));
            }
            if (storedImageSize) {
              setActiveInitialImageSize(JSON.parse(storedImageSize));
            }
            if (storedPages) {
              setActiveInitialPages(JSON.parse(storedPages));
            }
            if (storedCurrentPageIndex) {
              setActiveInitialCurrentPageIndex(parseInt(storedCurrentPageIndex) || 0);
            }
            toast.success(
              isAr 
                ? 'تم استعادة جلستك التصميمية السابقة تلقائياً بنجاح! 🔄' 
                : 'Your previous canvas design session was successfully restored! 🔄'
            );
          }
        }
      } catch (err) {
        console.warn('Failed to restore active canvas session:', err);
      }
    };

    restoreSession();
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered Projects for Current User
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = !projectSearchQuery.trim() || 
        p.title.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
        p.tags?.some(t => t.toLowerCase().includes(projectSearchQuery.toLowerCase()));
      const matchesFav = !projectFilterFavorite || p.isFavorite;
      return matchesSearch && matchesFav;
    });
  }, [projects, projectSearchQuery, projectFilterFavorite]);

  // Helper to open an existing project
  const handleOpenProject = (project: StudioProject) => {
    if (!user) {
      toast.error(isAr ? 'حفاظاً على أمان بياناتك، يرجى تسجيل الدخول أو إنشاء حساب جديد لتحديد مالك لمشروعك' : 'For security, please log in to set a project owner');
      setIsAuthModalOpen(true);
      return;
    }
    setActiveProjectId(project.id);
    setActiveInitialElements(project.elements || []);
    setActiveInitialFilters(project.filters);
    setActiveImageArtifact({
      id: project.id,
      title: project.title,
      content: project.canvasBackground || project.previewUrl
    });
    toast.success(isAr ? `تم فتح مشروع "${project.title}"` : `Opened project "${project.title}"`);
  };

  // Helper to create blank solid canvas image
  const handleCreateBlankCanvas = (width: number, height: number, title: string, bg = '#0f172a') => {
    if (!user) {
      toast.error(isAr ? 'حفاظاً على أمان بياناتك، يرجى تسجيل الدخول أو إنشاء حساب جديد لتحديد مالك لمشروعك' : 'For security, please log in to set a project owner');
      setIsAuthModalOpen(true);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, width, height);
    }
    const dataUrl = canvas.toDataURL('image/png');
    const newId = `project-${Date.now()}`;
    
    setActiveProjectId(newId);
    setActiveInitialElements([]);
    setActiveInitialFilters(undefined);
    setActiveImageArtifact({
      id: newId,
      title,
      content: dataUrl
    });
    toast.success(isAr ? `تم إنشاء مساحة عمل جديدة (${width} × ${height})` : `Created new canvas (${width} × ${height})`);
  };

  // Upload Local Image File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast.error(isAr ? 'حفاظاً على أمان بياناتك، يرجى تسجيل الدخول أولاً لتحديد مالك للمشروع وحفظ صورتك المرفوعة' : 'Please log in first to set a project owner and upload images');
      setIsAuthModalOpen(true);
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(isAr ? 'يرجى اختيار ملف صورة صالح' : 'Please upload a valid image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const newId = `project-upload-${Date.now()}`;
          setActiveProjectId(newId);
          setActiveInitialElements([]);
          setActiveInitialFilters(undefined);
          setActiveImageArtifact({
            id: newId,
            title: file.name.replace(/\.[^/.]+$/, ''),
            content: ev.target.result as string
          });
          toast.success(isAr ? 'تم فتح الصورة في استوديو رينكس' : 'Image loaded into studio');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Project Actions
  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    const updated = deleteUserStudioProject(user?.id, projectId);
    setProjects(updated);
    toast.success(isAr ? 'تم حذف المشروع من محفظتك' : 'Project deleted from portfolio');
  };

  const handleDuplicateProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    const updated = duplicateUserStudioProject(user?.id, projectId);
    setProjects(updated);
    toast.success(isAr ? 'تم تكرار المشروع بنجاح' : 'Project duplicated successfully');
  };

  const handleToggleFavorite = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    const updated = toggleFavoriteStudioProject(user?.id, projectId);
    setProjects(updated);
  };

  // If editor is active, render full-screen RATAQ Studio workspace
  if (activeImageArtifact) {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-[var(--surface-page)] flex flex-col overflow-hidden select-none">
        <ArtifactImageEditor
          artifact={activeImageArtifact}
          initialElements={activeInitialElements}
          initialFilters={activeInitialFilters}
          initialImageSize={activeInitialImageSize}
          projectId={activeProjectId}
          initialPages={activeInitialPages}
          initialCurrentPageIndex={activeInitialCurrentPageIndex}
          onSaveProject={(savedProject) => {
            setProjects(getUserStudioProjects(user?.id));
          }}
          onClose={() => {
            try {
              localStorage.removeItem('rataq_studio_session_active');
              localStorage.removeItem('rataq_studio_session_projectId');
              localStorage.removeItem('rataq_studio_session_artifact');
              localStorage.removeItem('rataq_studio_session_elements');
              localStorage.removeItem('rataq_studio_session_filters');
              localStorage.removeItem('rataq_studio_session_imageSize');
              localStorage.removeItem('rataq_studio_session_designTitle');
              localStorage.removeItem('rataq_studio_session_pages');
              localStorage.removeItem('rataq_studio_session_currentPageIndex');
              clearStudioSessionFromDB();
            } catch (e) {}
            setActiveImageArtifact(null);
            setActiveProjectId(undefined);
            setActiveInitialElements(undefined);
            setActiveInitialFilters(undefined);
            setActiveInitialImageSize(undefined);
            setActiveInitialPages(undefined);
            setActiveInitialCurrentPageIndex(undefined);
            setProjects(getUserStudioProjects(user?.id));
          }}
          isFullscreen={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe bg-[var(--surface-page)] text-[var(--text-primary)] font-sans pb-28 md:pb-20 transition-theme flex flex-col">
      
      {/* Top Header Navigation (Perplexta Unified Standard) */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[var(--surface-page)]/95 border-b border-[var(--border-default)] pt-[env(safe-area-inset-top,0px)] transition-theme shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Unified Logo & Morphing Exit Button */}
            <button 
              type="button"
              onClick={() => navigate('/studio')} 
              className="group/logo-btn relative w-8 h-8 rounded-shape-sm overflow-hidden border border-[var(--border-default)] hover:border-[var(--accent-foreground)]/60 bg-transparent hover:bg-[var(--surface-subtle)] transition-all duration-fast flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 shadow-2xs before:absolute before:-inset-1.5 before:content-['']"
              title={isAr ? 'الخروج والعودة للاستوديو العام' : 'Exit to Studio Hub'}
              aria-label={isAr ? 'الخروج والعودة للاستوديو العام' : 'Exit to Studio Hub'}
            >
              {/* Normal Logo */}
              <div className="w-full h-full p-1 flex items-center justify-center transition-all duration-base group-hover/logo-btn:opacity-0 group-hover/logo-btn:scale-75">
                <img 
                  src={resolveImageUrl(logo, 'general') || '/brand/default-logo.svg'} 
                  alt={isAr ? "استوديو رينكس" : "Rinex Studio"} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/brand/default-logo.svg';
                  }}
                />
              </div>

              {/* Glassy Outward Exit Arrow on Hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 group-hover/logo-btn:opacity-100 group-hover/logo-btn:scale-100 transition-all duration-fast pointer-events-none bg-[var(--surface-subtle)]">
                <div className="w-6 h-6 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] flex items-center justify-center shadow-2xs">
                  {dir === 'rtl' ? <ChevronRight size={14} className="stroke-[2.5]" /> : <ChevronLeft size={14} className="stroke-[2.5]" />}
                </div>
              </div>
            </button>

            {/* Studio Title */}
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] leading-tight tracking-tight">
                {isAr ? 'استوديو رينكس' : 'Rinex Studio'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="w-8 h-8 rounded-shape-sm border border-[var(--border-default)] hover:border-[var(--border-accent)] bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer"
              title={language === 'ar' ? 'English' : 'العربية'}
            >
              <Languages size={14} />
            </button>
            <ThemeToggleButton 
              variant="icon-button" 
              size="sm" 
              className="!w-8 !h-8 !rounded-shape-sm !border-[var(--border-default)] hover:!border-[var(--border-accent)] !bg-transparent hover:!bg-[var(--surface-subtle)] !text-[var(--text-secondary)] hover:!text-[var(--text-primary)] transition-all duration-150" 
            />
          </div>
        </div>
      </header>

      {/* Main Studio Landing Hub */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6">
        
        {/* 1. Unauthenticated Public Guest Landing Showcase OR Sovereign User Creator Workspace */}
        {!user ? (
          <PublicGuestLanding />
        ) : (
          <div className="space-y-6">
            {/* Creator Profile Banner */}
            <section className="p-5 sm:p-6 rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xs relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                {/* User Avatar / Profile Icon */}
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-shape-md overflow-hidden bg-[var(--surface-subtle)] border-2 border-[var(--border-accent)] flex items-center justify-center text-[var(--accent)] font-bold text-xl shadow-sm flex-shrink-0">
                    {user?.avatar ? (
                      <img src={resolveImageUrl(user.avatar, 'avatar')} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-7 h-7 text-[var(--accent)]" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -end-1 w-5 h-5 rounded-full bg-[var(--fg-success)] border-2 border-[var(--surface-card)] flex items-center justify-center text-white" title={isAr ? 'الحساب نشط ومتصل' : 'Account Active'}>
                    <Check size={10} className="stroke-[3]" />
                  </div>
                </div>

                {/* Profile Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] tracking-tight">
                      {user?.name || (isAr ? 'مصمم رينكس المبدع' : 'Rinex Creative Designer')}
                    </h2>
                    <span className="px-2 py-0.5 rounded-shape-xs bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1">
                      <Crown size={11} />
                      <span>{user?.subscription?.plan_name_ar || (isAr ? 'باقة المصممين PRO' : 'PRO Creator')}</span>
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {user?.email || (isAr ? 'حساب تصميم شخصي معزول ومحفوظ سحابياً' : 'Isolated personal creator workspace')}
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-[var(--text-muted)] font-mono">
                    <span>📁 {projects.length} {isAr ? 'تصميم خاص' : 'Designs'}</span>
                    <span>•</span>
                    <span>🎨 {brandKit.logos.length} {isAr ? 'شعارات براند' : 'Brand Logos'}</span>
                    <span>•</span>
                    <span>☁️ {uploads.length} {isAr ? 'ملفات مرفوعة' : 'Uploads'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Hub Actions */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-start md:justify-end flex-wrap">
                {/* Dynamic Creator Hub / Registration CTA */}
                {isUserRegisteredCreator ? (
                  <button
                    type="button"
                    onClick={() => navigate('/settings/creators-hub')}
                    className="h-9 px-3.5 rounded-shape-sm bg-gradient-to-r from-purple-600 to-[var(--accent)] text-slate-950 hover:brightness-110 font-black text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                    title={isAr ? 'لوحة تحكم الأرباح والإحصائيات الخاصة بك' : 'Your Creator Earnings & Analytics Dashboard'}
                  >
                    <Award size={14} className="text-slate-950 fill-current" />
                    <span>{isAr ? 'لوحة تحكم المبدع' : 'Creator Dashboard'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsRegistrationModalOpen(true)}
                    className="h-9 px-3.5 rounded-shape-sm bg-gradient-to-r from-amber-500 via-[var(--accent)] to-purple-600 text-slate-950 hover:brightness-110 font-black text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                    title={isAr ? 'انضم لشبكة صناع محتوى رينكس وابدأ الربح ($50 مكافأة)' : 'Join Rinex Creators Network & Earn ($50 Bonus)'}
                  >
                    <Sparkles size={13} className="animate-pulse text-slate-950 fill-current" />
                    <span>{isAr ? 'سجل كمبدع معتمد ($50)' : 'Become Creator ($50)'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[var(--border-accent)] text-[var(--text-primary)] font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  <Upload size={13} className="text-[var(--accent)]" />
                  <span>{isAr ? 'رفع صورة وتعديلها' : 'Upload Image'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(true)}
                  className="h-9 px-3.5 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 font-bold text-xs flex items-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <Sliders size={13} />
                  <span>{isAr ? 'مقاس مخصص' : 'Custom Size'}</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </section>

        {/* 2. Navigation Tabs (Canva Style Menu Bar) */}
        <section className="flex items-center justify-between border-b border-[var(--border-default)] pb-2 overflow-x-auto no-scrollbar gap-2">
          <div className="flex items-center gap-1.5 min-w-max">
            {user ? (
              /* LOGGED IN USER TABS */
              <>
                {/* Tab 1: My Personal Projects */}
                <button
                  type="button"
                  onClick={() => setActiveTab('projects')}
                  className={`h-9 px-3.5 rounded-shape-sm text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'projects'
                      ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <FolderHeart size={14} />
                  <span>{isAr ? 'مشاريعي وتصميماتي الخاصة' : 'My Designs & Projects'}</span>
                  <span className={`px-1.5 py-0.2 rounded-shape-xs text-[10px] font-mono ${
                    activeTab === 'projects' ? 'bg-white/20 text-white' : 'bg-[var(--surface-subtle)] text-[var(--text-muted)]'
                  }`}>
                    {projects.length}
                  </span>
                </button>

                {/* Tab 2: Pro Templates */}
                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  className={`h-9 px-3.5 rounded-shape-sm text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'templates'
                      ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <Palette size={14} />
                  <span>{isAr ? 'قوالب رينكس الاحترافية' : 'Pro Templates'}</span>
                </button>

                {/* Tab 3: Presets & Platforms */}
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className={`h-9 px-3.5 rounded-shape-sm text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'presets'
                      ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <LayoutTemplate size={14} />
                  <span>{isAr ? 'مقاسات المنصات' : 'Canvas Sizes'}</span>
                </button>

                {/* Tab 4: Brand Kit */}
                <button
                  type="button"
                  onClick={() => setActiveTab('brand')}
                  className={`h-9 px-3.5 rounded-shape-sm text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'brand'
                      ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <Sparkles size={14} />
                  <span>{isAr ? 'العلامة التجارية والهوية' : 'Brand Kit'}</span>
                </button>

                {/* Tab 5: My Uploads */}
                <button
                  type="button"
                  onClick={() => setActiveTab('uploads')}
                  className={`h-9 px-3.5 rounded-shape-sm text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'uploads'
                      ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <UploadCloud size={14} />
                  <span>{isAr ? 'مكتبة المرفوعات' : 'Uploads Library'}</span>
                </button>
              </>
            ) : (
              /* GUEST PUBLIC VISITORS ONLY TABS */
              <>
                {/* Public Tab 1: Ready Templates */}
                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  className={`h-9 px-3.5 rounded-shape-sm text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'templates'
                      ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <Palette size={14} />
                  <span>{isAr ? 'قوالب ونماذج جاهزة' : 'Ready Templates'}</span>
                </button>

                {/* Public Tab 2: Canvas Preset Sizes */}
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className={`h-9 px-3.5 rounded-shape-sm text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'presets'
                      ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <LayoutTemplate size={14} />
                  <span>{isAr ? 'أبعاد ومقاسات الكانفاس' : 'Canvas Sizes'}</span>
                </button>

                {/* Public Tab 3: Studio Features */}
                <button
                  type="button"
                  onClick={() => setActiveTab('features')}
                  className={`h-9 px-3.5 rounded-shape-sm text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'features'
                      ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <Sparkles size={14} />
                  <span>{isAr ? 'مميزات وإمكانيات الاستوديو' : 'Studio Features'}</span>
                </button>
              </>
            )}
          </div>
        </section>

        {/* 3. TAB CONTENT VIEWS */}

        {/* TAB 1: MY PROJECTS (Personal Isolated Portfolio) */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--surface-subtle)] p-3 rounded-shape-md border border-[var(--border-default)]">
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث في مشاريعك وتصميماتك...' : 'Search your designs...'}
                  className="w-full ps-9 pe-3 py-1.5 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setProjectFilterFavorite(prev => !prev)}
                  className={`h-8 px-3 rounded-shape-sm text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    projectFilterFavorite 
                      ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' 
                      : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Star size={13} className={projectFilterFavorite ? 'fill-amber-500' : ''} />
                  <span>{isAr ? 'المفضلة فقط' : 'Favorites'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateBlankCanvas(1080, 1080, isAr ? 'تصميم جديد' : 'New Design')}
                  className="h-8 px-3 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs hover:opacity-90 active:scale-95"
                >
                  <Plus size={13} />
                  <span>{isAr ? 'مشروع جديد' : 'New Project'}</span>
                </button>
              </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
              <div className="p-12 text-center rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-muted)] flex items-center justify-center mx-auto">
                  <FolderHeart size={20} />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {isAr ? 'لا توجد مشاريع مطابقة للبحث' : 'No projects found'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  {isAr ? 'ابدأ الآن بإنشاء تصميم جديد أو تعديل أحد القوالب الجاهزة وحفظه في ملفك الشخصي.' : 'Start by creating a new design or editing a template and saving to your account.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleCreateBlankCanvas(1080, 1080, isAr ? 'تصميم جديد' : 'New Design')}
                  className="h-8 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-2xs hover:opacity-90 active:scale-95"
                >
                  <Plus size={13} />
                  <span>{isAr ? 'إنشاء أول مشروع' : 'Create First Project'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProjects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleOpenProject(proj)}
                    className="group rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--border-default))] overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col active:scale-[0.99]"
                  >
                    {/* Thumbnail Preview */}
                    <div className="h-44 w-full bg-[var(--surface-subtle)] overflow-hidden relative flex items-center justify-center p-2">
                      <img
                        src={proj.previewUrl}
                        alt={proj.title}
                        className="max-h-full max-w-full object-contain rounded-shape-xs group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      
                      {/* Top Badges */}
                      <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded-shape-xs bg-[var(--surface-card)]/90 text-[var(--text-primary)] border border-[var(--border-default)] backdrop-blur-xs shadow-2xs">
                          {proj.width} × {proj.height}
                        </span>
                        {proj.elements && proj.elements.length > 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-shape-xs bg-[var(--accent)] text-white shadow-2xs">
                            {proj.elements.length} {isAr ? 'عنصر' : 'layers'}
                          </span>
                        )}
                      </div>

                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(e, proj.id)}
                        className={`absolute top-2.5 end-2.5 w-7 h-7 rounded-shape-xs flex items-center justify-center transition-all backdrop-blur-xs border ${
                          proj.isFavorite
                            ? 'bg-amber-500/90 text-white border-amber-600'
                            : 'bg-[var(--surface-card)]/80 text-[var(--text-muted)] hover:text-amber-500 border-[var(--border-default)]'
                        }`}
                        title={isAr ? 'المفضلة' : 'Favorite'}
                      >
                        <Star size={12} className={proj.isFavorite ? 'fill-white' : ''} />
                      </button>
                    </div>

                    {/* Project Meta & Action Footer */}
                    <div className="p-3 bg-[var(--surface-card)] border-t border-[var(--border-default)] space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                            {proj.title}
                          </h4>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                            {isAr ? 'آخر تعديل: ' : 'Updated: '}
                            {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[var(--border-default)] text-[10px]">
                        <span className="text-[var(--accent)] font-bold flex items-center gap-1 group-hover:underline">
                          <Edit3 size={11} />
                          <span>{isAr ? 'متابعة التعديل' : 'Edit Project'}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleDuplicateProject(e, proj.id)}
                            className="p-1 rounded-shape-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
                            title={isAr ? 'تكرار المشروع' : 'Duplicate'}
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteProject(e, proj.id)}
                            className="p-1 rounded-shape-xs text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title={isAr ? 'حذف المشروع' : 'Delete'}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRO & CREATOR TEMPLATES (UNIFIED TEMPLATES ENGINE) */}
        {activeTab === 'templates' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-4">
              <div>
                <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                  <Palette size={18} className="text-[var(--accent)]" />
                  <span>{isAr ? 'سوق وقوالب رينكس الإبداعية الجاهزة للتعديل:' : 'Rinex Pro & Creator Design Templates:'}</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {isAr ? 'تصفح قوالب المبدعين والمستودع، عاين القالب أو افتحه مباشرة لتعديل كافة نصوصه وطبقاته.' : 'Browse creator and official templates with full editable layers and vector graphics.'}
                </p>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {[
                  { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                  { id: 'marketing', labelAr: 'بوسترات تسويقية', labelEn: 'Marketing' },
                  { id: 'reels', labelAr: 'فيديو وريلز', labelEn: 'Reels' },
                  { id: 'story', labelAr: 'قصص واستوري', labelEn: 'Stories' },
                  { id: 'social', labelAr: 'مواقع التواصل', labelEn: 'Social Media' },
                  { id: 'repo', labelAr: 'المستودع الرسمي', labelEn: 'Official Repo' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTemplateCategoryFilter(cat.id as any)}
                    className={`h-8 px-3 rounded-shape-sm text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      templateCategoryFilter === cat.id
                        ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] shadow-xs'
                        : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
                    }`}
                  >
                    {isAr ? cat.labelAr : cat.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates Grid: Community Creators & Official Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* 1. Community Marketplace Templates */}
              {(templateCategoryFilter === 'all' || templateCategoryFilter === 'marketing' || templateCategoryFilter === 'reels' || templateCategoryFilter === 'story' || templateCategoryFilter === 'social') &&
                getStoredMarketplaceTemplates()
                  .filter(m => {
                    if (templateCategoryFilter === 'all') return true;
                    return m.category === templateCategoryFilter;
                  })
                  .map(tpl => (
                    <div
                      key={tpl.id}
                      className="group rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--border-default))] overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
                    >
                      {/* Image Thumbnail Container */}
                      <div className="h-44 w-full bg-slate-950/40 overflow-hidden relative group/thumb">
                        <img
                          src={tpl.thumbnail}
                          alt={tpl.titleEn}
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <span className="absolute top-2.5 end-2.5 px-2 py-0.5 text-[9px] font-bold rounded-shape-xs bg-slate-950/80 text-white border border-white/10 backdrop-blur-xs">
                          {tpl.dimensions}
                        </span>
                        <span className="absolute top-2.5 start-2.5 px-2 py-0.5 text-[9px] font-black rounded-shape-xs bg-[var(--accent)] text-slate-950 shadow-xs">
                          {isAr ? tpl.categoryLabelAr : tpl.category}
                        </span>

                        {/* Hover Overlay with Preview and Use Quick Buttons */}
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3 backdrop-blur-[2px]">
                          <button
                            type="button"
                            onClick={() => setPreviewTemplate(tpl)}
                            className="px-3 py-2 rounded-shape-sm bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] text-xs font-bold transition-transform active:scale-95 cursor-pointer shadow"
                          >
                            {isAr ? 'معاينة القالب' : 'Preview'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!user) {
                                try {
                                  sessionStorage.setItem('pending_studio_template', tpl.id);
                                  sessionStorage.setItem('pending_studio_template_payload', JSON.stringify(tpl));
                                } catch (e) {}
                                toast.info(isAr ? 'حفاظاً على أمان بياناتك، يرجى تسجيل الدخول أو إنشاء حساب لتحديد مالك لمشروعك وبدء التعديل.' : 'Please log in or register to customize this template.');
                                setIsAuthModalOpen(true);
                                return;
                              }
                              const newId = `project-marketplace-${tpl.id}-${Date.now()}`;
                              setActiveProjectId(newId);
                              setActiveInitialElements(tpl.elements || []);
                              setActiveInitialFilters(undefined);
                              const templateSize = ((tpl as any).width && (tpl as any).height) ? { width: (tpl as any).width, height: (tpl as any).height } : parseTemplateDimensions(tpl.dimensions);
                              if (templateSize) setActiveInitialImageSize(templateSize);
                              setActiveImageArtifact({
                                id: newId,
                                title: isAr ? tpl.titleAr : tpl.titleEn,
                                content: tpl.canvasBackground || tpl.thumbnail
                              });
                              recordTemplateUse(tpl.id);
                              toast.success(isAr ? `تم تحميل قالب "${tpl.titleAr}" مع كافة طبقاته القابلة للتعديل!` : `Loaded "${tpl.titleEn}" with editable layers!`);
                            }}
                            className="px-3 py-2 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] text-xs font-black transition-transform active:scale-95 cursor-pointer shadow flex items-center gap-1.5"
                          >
                            <span>{isAr ? 'استخدم القالب' : 'Use Template'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Card Content & Creator Attribution */}
                      <div className="p-3.5 flex flex-col justify-between flex-1 bg-[var(--surface-card)] space-y-2.5">
                        <div>
                          <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                            {isAr ? tpl.titleAr : tpl.titleEn}
                          </h4>
                          <p className="text-[10px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                            {isAr ? tpl.descriptionAr : tpl.descriptionEn}
                          </p>
                        </div>

                        {/* Creator Footer Pill */}
                        <div className="flex items-center justify-between pt-1 border-t border-[var(--border-default)]/60 text-[10px]">
                          <button
                            type="button"
                            onClick={() => navigate(`/creator/${tpl.creatorUsername.replace('@', '')}`)}
                            className="flex items-center gap-1.5 text-start hover:opacity-80 transition-opacity cursor-pointer min-w-0"
                          >
                            <img
                              src={tpl.creatorAvatar}
                              alt={tpl.creatorName}
                              className="w-4 h-4 rounded-full object-cover border border-[var(--border-default)] shrink-0"
                            />
                            <span className="font-bold text-[var(--text-secondary)] truncate max-w-[90px]">
                              {tpl.creatorName}
                            </span>
                          </button>

                          <div className="flex items-center gap-2 font-mono font-bold text-[var(--text-muted)] shrink-0">
                            <span className="flex items-center gap-0.5 text-amber-500">
                              <Star size={10} className="fill-amber-500" />
                              <span>{tpl.rating}</span>
                            </span>
                            <span>•</span>
                            <span>{tpl.usesCount.toLocaleString()} {isAr ? 'استخدام' : 'uses'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

              {/* 2. Repository & System Presets */}
              {(templateCategoryFilter === 'all' || templateCategoryFilter === 'repo') &&
                PUBLIC_TEMPLATES.map((tpl: PublicTemplateItem) => (
                  <div
                    key={tpl.id}
                    onClick={() => {
                      if (!user) {
                        sessionStorage.setItem('pending_studio_template', tpl.id);
                        toast.info(isAr ? 'حفاظاً على أمان بياناتك، يرجى تسجيل الدخول أو إنشاء حساب لتحديد مالك لمشروعك قبل البدء' : 'For security, please log in to assign an owner before customizing');
                        setIsAuthModalOpen(true);
                        return;
                      }
                      const newId = `project-template-${tpl.id}-${Date.now()}`;
                      setActiveProjectId(newId);
                      
                      if (tpl.repoTemplate) {
                        const converted = convertRataqTemplateToCanvasElements(tpl.repoTemplate);
                        setActiveInitialElements(converted.elements);
                        setActiveInitialFilters(undefined);
                        setActiveInitialImageSize({ width: converted.width, height: converted.height });
                        setActiveImageArtifact({
                          id: newId,
                          title: isAr ? tpl.titleAr : tpl.titleEn,
                          content: converted.canvasBackground || converted.previewUrl
                        });
                      } else {
                        setActiveInitialElements(tpl.elements || []);
                        setActiveInitialFilters(undefined);
                        const templateSize = ((tpl as any).width && (tpl as any).height) ? { width: (tpl as any).width, height: (tpl as any).height } : parseTemplateDimensions(tpl.dimensions);
                        if (templateSize) setActiveInitialImageSize(templateSize);
                        setActiveImageArtifact({
                          id: newId,
                          title: isAr ? tpl.titleAr : tpl.titleEn,
                          content: tpl.canvasBackground || tpl.src
                        });
                      }
                      toast.success(isAr ? `تم تحميل قالب "${tpl.titleAr}" مع كافة عناصره القابلة للتعديل!` : `Loaded template "${tpl.titleEn}" with editable layers!`);
                    }}
                    className="group rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--border-default))] overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col active:scale-[0.99]"
                  >
                    <div className="h-44 w-full bg-[var(--surface-subtle)] overflow-hidden relative">
                      <img
                        src={tpl.src}
                        alt={tpl.titleEn}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-2.5 end-2.5 px-2 py-0.5 text-[9px] font-bold rounded-shape-xs bg-[var(--surface-card)]/90 text-[var(--text-primary)] border border-[var(--border-default)] backdrop-blur-xs">
                        {tpl.tag}
                      </span>
                    </div>

                    <div className="p-3 flex items-center justify-between bg-[var(--surface-card)]">
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                          {isAr ? tpl.titleAr : tpl.titleEn}
                        </h4>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {isAr ? 'انقر لفتح وتعديل القالب' : 'Click to customize in editor'}
                        </span>
                      </div>
                      <ArrowUpRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: CANVAS SIZES & PRESETS */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <LayoutTemplate size={16} className="text-[var(--accent)]" />
                  <span>{isAr ? 'مقاسات منصات التواصل الاجتماعي والطباعة:' : 'Standard Platform Dimensions:'}</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {isAr ? 'اختر مقاساً قياسياً أو أدخل أبعاداً مخصصة لفتح مساحة عمل مطابقة تماماً للمنصة.' : 'Choose a standard preset or enter custom dimensions.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {CANVAS_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleCreateBlankCanvas(preset.width, preset.height, isAr ? preset.nameAr : preset.nameEn)}
                  className="p-4 rounded-shape-md bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--border-default))] transition-all cursor-pointer flex flex-col justify-between group shadow-2xs space-y-3 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-shape-sm bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] border border-[color-mix(in_oklab,var(--accent)_20%,transparent)] text-[var(--accent)] flex items-center justify-center group-hover:bg-[color-mix(in_oklab,var(--accent)_15%,transparent)] transition-all duration-fast">
                      {preset.icon}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-muted)]">
                      {preset.aspectRatio}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      {isAr ? preset.nameAr : preset.nameEn}
                    </h4>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] block mt-0.5">
                      {preset.width} × {preset.height} px
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BRAND KIT (Personal Brand Hub) */}
        {activeTab === 'brand' && (
          <div className="space-y-6">
            <div className="p-5 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[var(--accent)]" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {isAr ? 'العلامة التجارية وهوية البراند الخاصة بك' : 'Your Personal Brand Kit'}
                  </h3>
                </div>
                <span className="text-[11px] text-[var(--text-muted)] font-medium">
                  {isAr ? 'تطبق تلقائياً على تصميماتك ومحرر رينكس' : 'Synchronized with your personal editor'}
                </span>
              </div>

              {/* Brand Logos */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[var(--text-secondary)]">
                  {isAr ? '1. شعارات الهوية الرسمية (Logos & Seals)' : '1. Brand Logos & Seals'}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {brandKit.logos.map((l) => (
                    <div key={l.id} className="p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex flex-col items-center justify-center text-center space-y-2">
                      <div className="w-16 h-16 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] p-1.5 flex items-center justify-center">
                        <img src={l.url} alt={l.titleAr} className="max-w-full max-h-full object-contain" />
                      </div>
                      <span className="text-[11px] font-bold text-[var(--text-primary)] line-clamp-1">{l.titleAr}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brand Color Palette */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-default)]">
                <h4 className="text-xs font-bold text-[var(--text-secondary)]">
                  {isAr ? '2. لوحة ألوان الهوية (Brand Color Palette)' : '2. Color Palette'}
                </h4>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {[brandKit.colors.primary, brandKit.colors.secondary, brandKit.colors.accent, brandKit.colors.dark, brandKit.colors.light, ...(brandKit.colors.custom || [])].map((c: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-1.5 px-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                      <div className="w-5 h-5 rounded-full border border-black/20 shadow-2xs" style={{ backgroundColor: c }} />
                      <span className="text-[11px] font-mono font-bold text-[var(--text-primary)]">{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brand Typography */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-default)]">
                <h4 className="text-xs font-bold text-[var(--text-secondary)]">
                  {isAr ? '3. خطوط الهوية المعتمدة (Brand Typography)' : '3. Brand Fonts'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">{isAr ? 'خط العناوين الرئيسية' : 'Heading Font'}</span>
                    <span className="text-xs font-bold text-[var(--text-primary)] font-mono">{brandKit.fonts.heading}</span>
                  </div>
                  <div className="p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">{isAr ? 'خط النصوص والفقرات' : 'Body Font'}</span>
                    <span className="text-xs font-bold text-[var(--text-primary)] font-mono">{brandKit.fonts.body}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MY UPLOADS */}
        {activeTab === 'uploads' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <UploadCloud size={16} className="text-[var(--accent)]" />
                  <span>{isAr ? 'الملفات والمرفوعات المحفوظة بحسابك:' : 'Uploaded Assets in Account:'}</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {isAr ? 'الصور والخطوط ومقاطع الفيديو ومستندات PDF الخاصة بحسابك والمتاحة في المحرر.' : 'Images, fonts, videos, and PDFs uploaded to your account.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-3 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs hover:opacity-90 active:scale-95"
              >
                <Upload size={13} />
                <span>{isAr ? 'رفع ملف جديد' : 'Upload Asset'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {uploads.map((item) => (
                <div key={item.id} className="p-3 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] space-y-2 shadow-2xs">
                  <div className="h-28 w-full rounded-shape-xs bg-[var(--surface-subtle)] flex items-center justify-center overflow-hidden">
                    {item.type === 'image' && <img src={item.url} alt={item.name} className="max-w-full max-h-full object-contain" />}
                    {item.type === 'font' && <div className="text-lg font-bold text-[var(--accent)]">Aa</div>}
                    {item.type === 'video' && <Video className="w-8 h-8 text-[var(--accent)]" />}
                    {item.type === 'pdf' && <FileText className="w-8 h-8 text-rose-500" />}
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1">{item.name}</h5>
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                      <span className="uppercase font-mono">{item.type}</span>
                      <span>{item.size || ''}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: PUBLIC STUDIO FEATURES SHOWCASE */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Sparkles size={16} className="text-[var(--accent)]" />
                  <span>{isAr ? 'إمكانيات ومميزات استوديو رينكس السيادي:' : 'Sovereign Studio Capabilities:'}</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {isAr ? 'استكشف الميزات والتقنيات المدعومة داخل ساحة العمل التفاعلية.' : 'Explore supported tools and creative technologies.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PUBLIC_STUDIO_FEATURES.map((feat, idx) => (
                <div key={idx} className="p-4 rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] space-y-2 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                      {feat.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">
                        {isAr ? feat.titleAr : feat.titleEn}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                        {isAr ? feat.descAr : feat.descEn}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
          </div>
        )}

      </main>

      {/* Custom Canvas Dimension Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-[var(--text-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2.5">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-[var(--text-primary)]">
                <Sliders size={14} className="text-[var(--accent)]" />
                <span>{isAr ? 'إنشاء مساحة بمقاس مخصص' : 'Custom Canvas Dimensions'}</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--text-secondary)]">{isAr ? 'العرض (بكسل)' : 'Width (px)'}</label>
                <input
                  type="number"
                  value={customW}
                  onChange={(e) => setCustomW(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[var(--text-secondary)]">{isAr ? 'الارتفاع (بكسل)' : 'Height (px)'}</label>
                <input
                  type="number"
                  value={customH}
                  onChange={(e) => setCustomH(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="h-8 px-3 rounded-shape-sm text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCustomModalOpen(false);
                  handleCreateBlankCanvas(customW || 1080, customH || 1080, isAr ? `مساحة ${customW}×${customH}` : `${customW}x${customH} Canvas`);
                }}
                className="h-8 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] font-bold text-xs cursor-pointer shadow-2xs hover:opacity-90 active:scale-95"
              >
                {isAr ? 'إنشاء مساحة العمل' : 'Create Canvas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Platform Sovereign Footer */}
      <footer className="pt-8 pb-4 space-y-3 text-center border-t border-[var(--border-default)] mt-12 max-w-6xl mx-auto w-full px-4">
        <p className="text-xs text-[var(--text-muted)] font-mono">
          {language === 'ar' ? 'جميع الحقوق محفوظة 2025-2026 بيربليكستا' : '© 2025-2026 PERPLEXTA. All rights reserved.'}
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-[var(--text-muted)]">
          <button onClick={() => navigate('/terms')} className="hover:text-[var(--text-primary)] transition-colors cursor-pointer">
            {language === 'ar' ? 'الشروط والأحكام' : 'Terms of Service'}
          </button>
          <span>•</span>
          <button onClick={() => navigate('/privacy')} className="hover:text-[var(--text-primary)] transition-colors cursor-pointer">
            {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </button>
          <span>•</span>
          <button onClick={() => navigate('/about')} className="hover:text-[var(--text-primary)] transition-colors cursor-pointer">
            {language === 'ar' ? 'عن المنصة' : 'About Platform'}
          </button>
        </div>
      </footer>

      {/* Creator Registration Protocol Modal */}
      <CreatorRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
      />

      {/* Interactive Template Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </div>
  );
};
