import React, { Suspense, useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { VideoResourceProvider } from './context/VideoResourceContext';
import { PwaProvider } from './context/PwaContext';
import { ArtifactProvider } from './context/ArtifactContext';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { injectJsonLdSchema, removeJsonLdSchema } from './utils/seoSchemaBuilder';
import {
  fetchSeoMetadataWithCache,
  fetchSeoRoutesListWithCache,
  getCachedSeoMetadata,
  getCachedSeoRoutesList
} from './utils/seoCache';
import { UnifiedFeedbackProvider } from '@/design-system';

const resolveModule = (m: any, name?: string) => {
  if (!m) return { default: () => null };
  if (m.default) return m;
  if (name && m[name]) return { default: m[name] };
  if (typeof m === 'function') return { default: m };
  return m;
};

const lazyRetry = (componentImport: () => Promise<any>, name?: string) =>
  React.lazy(async () => {
    const pageHasAlreadyBeenReloaded = JSON.parse(
      sessionStorage.getItem('page_reloaded_for_chunk') || 'false'
    );

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const m = await componentImport();
        sessionStorage.removeItem('page_reloaded_for_chunk');
        return resolveModule(m, name);
      } catch (err) {
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 800 * attempt));
        }
      }
    }

    if (!pageHasAlreadyBeenReloaded) {
      sessionStorage.setItem('page_reloaded_for_chunk', 'true');
      window.location.reload();
      return new Promise<any>(() => {});
    }

    return {
      default: () => (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
          <div className="p-4 rounded-[var(--radius-lg)] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 max-w-md">
            <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">عذراً، تعذر تحميل الصفحة</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              تعذر تحميل مكون {name || 'الصفحة'}. يرجى التحقق من اتصالك بالإنترنت أو إعادة تحميل الصفحة.
            </p>
            <button
              onClick={() => {
                sessionStorage.removeItem('page_reloaded_for_chunk');
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-[var(--radius-md)] text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      )
    };
  });

const ChatPage = lazyRetry(() => import('./pages/ChatPage'), 'ChatPage');
const RewardsPage = lazyRetry(() => import('./pages/RewardsPage'), 'RewardsPage');
const SubscriptionPage = lazyRetry(() => import('./pages/SubscriptionPage'), 'SubscriptionPage');
const SettingsPage = lazyRetry(() => import('./pages/SettingsPage'), 'SettingsPage');
const AdminDashboard = lazyRetry(() => import('./pages/AdminDashboard'), 'AdminDashboard');
const Terms = lazyRetry(() => import('./pages/Terms'), 'Terms');
const Privacy = lazyRetry(() => import('./pages/Privacy'), 'Privacy');
const About = lazyRetry(() => import('./pages/About'), 'About');
const Copyright = lazyRetry(() => import('./pages/Copyright'), 'Copyright');
const LegalDocsPage = lazyRetry(() => import('./pages/LegalDocsPage'), 'LegalDocsPage');
const ResetPasswordPage = lazyRetry(() => import('./pages/ResetPasswordPage'), 'ResetPasswordPage');
const GoogleHubPage = lazyRetry(() => import('./pages/GoogleHubPage'));
const BulletinBoardPage = lazyRetry(() => import('./pages/BulletinBoardPage'), 'BulletinBoardPage');
const SharedSnapshotPage = lazyRetry(() => import('./pages/SharedSnapshotPage'), 'SharedSnapshotPage');
const RecommendationsPage = lazyRetry(() => import('./pages/RecommendationsPage'), 'RecommendationsPage');
const StudioPage = lazyRetry(() => import('./pages/StudioPage'), 'StudioPage');
const AudioStudioPage = lazyRetry(() => import('./pages/AudioStudioPage'), 'AudioStudioPage');
const AppStudioPage = lazyRetry(() => import('./pages/AppStudioPage'), 'AppStudioPage');
const AppHubPage = lazyRetry(() => import('./pages/AppHubPage'), 'AppHubPage');
const ImageStudioPage = lazyRetry(() => import('./pages/ImageStudioPage'), 'ImageStudioPage');
const CreatorProfilePage = lazyRetry(() => import('./pages/CreatorProfilePage'), 'CreatorProfilePage');
const CreatorDashboardPage = lazyRetry(() => import('./pages/CreatorDashboardPage'), 'CreatorDashboardPage');
import { IncentiveCard } from './components/IncentiveCard';
import { GoogleAnalytics } from './components/GoogleAnalytics';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { ErrorBoundary } from './components/ErrorBoundary';

import { motion } from 'motion/react';
import { isPathBlocked } from './utils/sectionVisibility';
import { resolveImageUrl } from './utils/imageResolver';
import { GlobalLoadingOverlay } from "./components/GlobalLoadingOverlay";
import { InactivityWarningModal } from './components/InactivityWarningModal';
import { ServiceUpdateToast } from './components/ServiceUpdateToast';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { CriticalResourcePreloader } from './utils/criticalResourcePreloader';
import { DiagnosticMobileOverlay } from './components/DiagnosticMobileOverlay';
import { useThemeCustomizations } from './hooks/useThemeCustomizations';
import { ThemeSync } from './utils/ThemeSync';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthReady } = useAppContext();
  if (!isAuthReady) return null;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthReady } = useAppContext();
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  if (!isAuthReady) return null;
  const isAdmin = user && (['admin'].includes(user.role || '') || (adminEmail && user.email === adminEmail));
  const isSupport = user && ['support'].includes(user.role || '');
  if (!isAdmin && !isSupport) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const SectionRouteGuard = ({ pathKey, children }: { pathKey: string; children: React.ReactNode }) => {
  const { siteSettings } = useAppContext();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  if (isPathBlocked(pathKey, siteSettings?.blocked_paths, isMobile)) {
    return <Navigate to="/chat" replace />;
  }
  return <>{children}</>;
};

const PWAWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme, siteSettings, language } = useAppContext();
  const location = useLocation();
  
  useThemeCustomizations(theme);

  // Monitor theme context changes and delegate to single authoritative writer ThemeSync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    ThemeSync.apply(theme);

    let mediaQueryList: MediaQueryList | null = null;
    let handleSystemChange: (() => void) | null = null;

    if (theme === 'system' && window.matchMedia) {
      mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      handleSystemChange = () => {
        ThemeSync.apply('system');
      };

      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', handleSystemChange);
      } else {
        (mediaQueryList as any).addListener(handleSystemChange);
      }
    }

    return () => {
      if (mediaQueryList && handleSystemChange) {
        if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener('change', handleSystemChange);
        } else {
          (mediaQueryList as any).removeListener(handleSystemChange);
        }
      }
    };
  }, [theme]);

  const [dbRouteSeo, setDbRouteSeo] = useState<any[]>(() => {
    const cached = getCachedSeoRoutesList();
    return cached.hit ? cached.data : [];
  });
  const [dynamicSeoMap, setDynamicSeoMap] = useState<Record<string, any>>(() => {
    if (typeof window === 'undefined') return {};
    const norm = window.location.pathname === '/' ? '/' : window.location.pathname.replace(/\/+$/, '');
    const initialMeta = getCachedSeoMetadata(norm);
    return initialMeta.hit && initialMeta.data ? { [norm]: initialMeta.data } : {};
  });

  useEffect(() => {
    let isCurrent = true;
    fetchSeoRoutesListWithCache().then((routes) => {
      if (isCurrent && routes && routes.length > 0) {
        setDbRouteSeo(routes);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  const currentPath = location.pathname;

  const dynamicBlockedList = siteSettings?.blocked_paths
    ? siteSettings.blocked_paths.split(',').map((p: string) => p.trim()).filter(Boolean)
    : [];

  const isSensitive = [
    '/chat',
    '/admin',
    '/settings',
    '/rewards',
    '/wallet',
    '/reset-password',
    '/admin-sections',
    '/admin/sections',
    ...dynamicBlockedList
  ].some(sensitivePath => {
    const cleanPath = sensitivePath.startsWith('/') ? sensitivePath : '/' + sensitivePath;
    return currentPath === cleanPath || currentPath.startsWith(cleanPath + '/');
  });

  useEffect(() => {
    if (isSensitive) return;
    const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/\/+$/, '');

    // 1. Synchronous Instant Cache Check (Memory / SessionStorage)
    const cached = getCachedSeoMetadata(normalizedPath);
    if (cached.hit) {
      if (cached.data && !dynamicSeoMap[normalizedPath]) {
        setDynamicSeoMap(prev => ({
          ...prev,
          [normalizedPath]: cached.data
        }));
      }
      return;
    }

    // 2. Asynchronous In-Flight Deduplicated Fetch
    let isCurrent = true;
    fetchSeoMetadataWithCache(normalizedPath)
      .then(metadata => {
        if (isCurrent && metadata) {
          setDynamicSeoMap(prev => ({
            ...prev,
            [normalizedPath]: metadata
          }));
        }
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [currentPath, isSensitive]);

  useEffect(() => {
    const updateMetaTag = (attrType: string, attrValue: string, content: string) => {
      if (content === undefined || content === null) return;
      const elements = Array.from(document.querySelectorAll(`meta[${attrType}="${attrValue}"]`));
      if (elements.length === 0) {
        const meta = document.createElement('meta');
        meta.setAttribute(attrType, attrValue);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      } else {
        elements[0].setAttribute('content', content);
        for (let i = 1; i < elements.length; i++) {
          elements[i].remove();
        }
      }
    };

    const updateCanonicalLink = (href: string) => {
      const elements = Array.from(document.querySelectorAll('link[rel="canonical"]'));
      if (elements.length === 0) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        link.setAttribute('href', href);
        document.head.appendChild(link);
      } else {
        elements[0].setAttribute('href', href);
        for (let i = 1; i < elements.length; i++) {
          elements[i].remove();
        }
      }
    };

    const siteName = language === 'ar' ? (siteSettings?.siteNameAr || siteSettings?.siteName) : siteSettings?.siteName;
    const resolvedSiteName = siteName || (language === 'ar' ? 'بيربليكستا' : 'Perplexta');
    const resolvedOGImage = siteSettings?.seoImageUrl ? resolveImageUrl(siteSettings.seoImageUrl, 'general') : '';
    const finalOGImage = resolvedOGImage.startsWith('/') ? `${window.location.origin}${resolvedOGImage}` : resolvedOGImage;
    const currentUrl = window.location.href;

    if (isSensitive) {
      removeJsonLdSchema('jsonld-dynamic-route');
      updateMetaTag('name', 'robots', 'noindex, nofollow, noarchive, nosnippet, max-image-preview:none');
      updateMetaTag('name', 'googlebot', 'noindex, nofollow, noarchive, nosnippet');
      
      const sensitiveTitle = language === 'ar' ? 'بيربليكستا - مساحة عمل محصنة' : 'Perplexta - Secure Workspace';
      const sensitiveDesc = language === 'ar' ? 'صفحة آمنة ومحمية وفق بروتوكولات الأمان لمنصة بيربليكستا.' : 'Secure node with zero crawling, protected under enterprise encryption protocols.';
      
      document.title = sensitiveTitle;
      updateMetaTag('name', 'description', sensitiveDesc);
      updateMetaTag('property', 'og:title', sensitiveTitle);
      updateMetaTag('property', 'og:description', sensitiveDesc);
      updateMetaTag('property', 'og:image', finalOGImage);
      updateMetaTag('property', 'og:url', currentUrl);
      updateMetaTag('property', 'og:site_name', resolvedSiteName);
      updateMetaTag('name', 'twitter:title', sensitiveTitle);
      updateMetaTag('name', 'twitter:description', sensitiveDesc);
      updateMetaTag('name', 'twitter:image', finalOGImage);
      updateMetaTag('name', 'twitter:image:alt', sensitiveTitle);
      updateMetaTag('name', 'keywords', '');
      return;
    }

    updateMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    updateMetaTag('name', 'googlebot', 'index, follow');

    const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/\/$/, '');

    const dynamicSeo = dynamicSeoMap[currentPath] || dynamicSeoMap[normalizedPath];
    const hasActiveDynamicSeo = dynamicSeo && dynamicSeo.is_active !== false;

    const dynamicTitle = hasActiveDynamicSeo
      ? (language === 'ar' ? (dynamicSeo.title_ar || dynamicSeo.title_en) : (dynamicSeo.title_en || dynamicSeo.title_ar))
      : '';
    const dynamicDesc = hasActiveDynamicSeo
      ? (language === 'ar' ? (dynamicSeo.description_ar || dynamicSeo.description_en) : (dynamicSeo.description_en || dynamicSeo.description_ar))
      : '';
    const dynamicKeywords = hasActiveDynamicSeo
      ? (language === 'ar' ? (dynamicSeo.keywords_ar || dynamicSeo.keywords_en) : (dynamicSeo.keywords_en || dynamicSeo.keywords_ar))
      : '';
    const dynamicOgImage = hasActiveDynamicSeo ? dynamicSeo.og_image_url : '';
    const dynamicCanonical = (hasActiveDynamicSeo && dynamicSeo.canonical_url) ? dynamicSeo.canonical_url : '';

    const cleanCur = currentPath.toLowerCase().replace(/^\/+|\/+$/g, '');
    const routeMatch = dbRouteSeo.find(r => {
      if (!r.route || r.is_active === false) return false;
      const cleanR = r.route.toLowerCase().replace(/^\/+|\/+$/g, '');
      return cleanR === cleanCur || r.route === currentPath || r.route === normalizedPath;
    });

    const dbTitle = routeMatch ? (language === 'ar' ? (routeMatch.title_ar || routeMatch.title_en) : (routeMatch.title_en || routeMatch.title_ar)) : '';
    const dbDesc = routeMatch ? (language === 'ar' ? (routeMatch.description_ar || routeMatch.description_en) : (routeMatch.description_en || routeMatch.description_ar)) : '';
    const dbKeywords = routeMatch ? (language === 'ar' ? (routeMatch.keywords_ar || routeMatch.keywords_en) : (routeMatch.keywords_en || routeMatch.keywords_ar)) : '';
    const dbOgImage = routeMatch?.og_image_url;

    let pageTitlePart = '';
    if (currentPath === '/subscription') {
      pageTitlePart = language === 'ar' ? 'خطط الاشتراك والترقيات النخبة' : 'Premium Elite Subscription Plans';
    } else if (currentPath === '/about') {
      pageTitlePart = language === 'ar' ? 'من نحن ورؤية منصة بيربليكستا' : 'About Perplexta Platform & Vision';
    } else if (currentPath === '/terms') {
      pageTitlePart = language === 'ar' ? 'شروط الخدمة والاتفاقية الرقمية' : 'Terms of Service';
    } else if (currentPath === '/privacy') {
      pageTitlePart = language === 'ar' ? 'سياسة الخصوصية وحقوق حماية البيانات' : 'Strict Privacy & Data Security Regulations';
    } else if (currentPath === '/copyright') {
      pageTitlePart = language === 'ar' ? 'حقوق الملكية الفكرية وحماية الابتكار' : 'Intellectual Property & Copyright Policy';
    } else if (currentPath.toLowerCase() === '/studio') {
      pageTitlePart = language === 'ar' ? 'استوديو بيربليكستا' : 'Perplexta Studio';
    } else if (currentPath === '/viralbook' || currentPath.startsWith('/viralbook') || currentPath === '/bulletin' || currentPath.startsWith('/bulletin')) {
      pageTitlePart = language === 'ar' ? 'بيربليكستا بورد - شبكة المحتوى والمنشورات التفاعلية' : 'Perplexta Board - Interactive Social Feed & Community Hub';
    }

    const defaultTitle = pageTitlePart 
      ? `${pageTitlePart} | ${resolvedSiteName}` 
      : `${resolvedSiteName} - ${language === 'ar' ? 'منصة التحليل والذكاء الاصطناعي الفاخر والمستقل' : 'Sovereign High-Performance AI Analysis Platform'}`;

    const siteDesc = language === 'ar' ? (siteSettings?.siteDescriptionAr || siteSettings?.siteDescription) : siteSettings?.siteDescription;
    const resolvedDesc = (language === 'ar' ? siteSettings?.seoDescriptionAr : siteSettings?.seoDescriptionEn) || siteDesc || '';
    const resolvedKeywords = (language === 'ar' ? siteSettings?.keywordsAr : siteSettings?.keywordsEn) || '';

    const finalTitle = dynamicTitle || dbTitle || defaultTitle;
    const finalDesc = dynamicDesc || dbDesc || resolvedDesc;
    const finalKeywords = dynamicKeywords || dbKeywords || resolvedKeywords;
    const rawOGImage = dynamicOgImage || dbOgImage || resolvedOGImage;
    const routeOGImage = rawOGImage.startsWith('/') ? `${window.location.origin}${rawOGImage}` : rawOGImage;
    const cleanOriginPath = `${window.location.origin}${normalizedPath}`;
    const finalCanonical = dynamicCanonical || cleanOriginPath;

    document.title = finalTitle;
    updateMetaTag('name', 'description', finalDesc);
    updateMetaTag('property', 'og:title', finalTitle);
    updateMetaTag('property', 'og:description', finalDesc);
    updateMetaTag('property', 'og:image', routeOGImage);
    updateMetaTag('property', 'og:url', finalCanonical);
    updateMetaTag('property', 'og:site_name', resolvedSiteName);
    updateMetaTag('name', 'twitter:title', finalTitle);
    updateMetaTag('name', 'twitter:description', finalDesc);
    updateMetaTag('name', 'twitter:image', routeOGImage);
    updateMetaTag('name', 'twitter:image:alt', finalTitle);
    updateMetaTag('name', 'keywords', finalKeywords);

    updateCanonicalLink(finalCanonical);

    if (hasActiveDynamicSeo && dynamicSeo.structured_data && typeof dynamicSeo.structured_data === 'object') {
      injectJsonLdSchema('jsonld-dynamic-route', dynamicSeo.structured_data);
    } else {
      removeJsonLdSchema('jsonld-dynamic-route');
    }
  }, [currentPath, isSensitive, siteSettings, language, dbRouteSeo, dynamicSeoMap]);

  const isAdminPath = currentPath.startsWith('/admin');

  return (
    <Suspense fallback={null}>
      <GoogleAnalytics />
      {!isAdminPath && <PwaInstallBanner />}
      {!isAdminPath && (
        <div 
          id="platform-banners-stack"
          className={`fixed z-[9990] flex flex-col gap-2 pointer-events-none transition-all duration-media items-center md:items-start max-w-[calc(100vw-2rem)] md:max-w-[320px] left-1/2 -translate-x-1/2 bottom-[calc(185px+env(safe-area-inset-bottom,0px))] ${
            language === 'ar' 
              ? 'md:left-6 md:right-auto md:translate-x-0 md:bottom-6' 
              : 'md:right-6 md:left-auto md:translate-x-0 md:bottom-6'
          }`}
        >
          <ServiceUpdateToast />
          <CookieConsentBanner />
        </div>
      )}

      {!isAdminPath && <IncentiveCard />}
      {!isAdminPath && <InactivityWarningModal />}
      <GlobalLoadingOverlay />
      <CriticalResourcePreloader />

      <motion.div
        key={isAdminPath ? 'admin-root' : 'client-root'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="block h-full w-full"
      >
        {children}
      </motion.div>
    </Suspense>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <PwaProvider>
        <AppProvider>
          <UnifiedFeedbackProvider>
            <VideoResourceProvider>
                <ArtifactProvider>
                  <ErrorBoundary name="Perplexta Core Runtime">
                    <PWAWrapper>
                    <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/chat" replace />} />
              <Route path="rewards" element={<SectionRouteGuard pathKey="/rewards"><ProtectedRoute><RewardsPage /></ProtectedRoute></SectionRouteGuard>} />
              <Route path="subscription" element={<SectionRouteGuard pathKey="/subscription"><SubscriptionPage /></SectionRouteGuard>} />
              <Route path="chat/:id?" element={<ChatPage />} />
              <Route path="viralbook/*" element={<SectionRouteGuard pathKey="/viralbook"><BulletinBoardPage /></SectionRouteGuard>} />
              <Route path="bulletin/*" element={<SectionRouteGuard pathKey="/viralbook"><BulletinBoardPage /></SectionRouteGuard>} />
              <Route path="reels/*" element={<SectionRouteGuard pathKey="/viralbook"><BulletinBoardPage /></SectionRouteGuard>} />
              <Route path="p/*" element={<SectionRouteGuard pathKey="/viralbook"><BulletinBoardPage /></SectionRouteGuard>} />
              <Route path="post/*" element={<SectionRouteGuard pathKey="/viralbook"><BulletinBoardPage /></SectionRouteGuard>} />
              <Route path="google-hub" element={<SectionRouteGuard pathKey="/google-hub"><GoogleHubPage /></SectionRouteGuard>} />
              <Route path="discover" element={<SectionRouteGuard pathKey="/explore"><RecommendationsPage /></SectionRouteGuard>} />
              <Route path="studio" element={<SectionRouteGuard pathKey="/studio"><StudioPage /></SectionRouteGuard>} />
              <Route path="image-studio" element={<ImageStudioPage />} />
              <Route path="studio/image" element={<ImageStudioPage />} />
              <Route path="app" element={<AppHubPage />} />
              <Route path="app/canvas" element={<AppStudioPage />} />
              <Route path="app/studio" element={<AppStudioPage />} />
              <Route path="audio-studio" element={<SectionRouteGuard pathKey="/audio-studio"><ProtectedRoute><AudioStudioPage /></ProtectedRoute></SectionRouteGuard>} />
              <Route path="creator/:username" element={<CreatorProfilePage />} />
              <Route path="creator" element={<CreatorProfilePage />} />
              <Route path="creator-dashboard" element={<ProtectedRoute><CreatorDashboardPage /></ProtectedRoute>} />
              <Route path="settings/creators-hub" element={<ProtectedRoute><CreatorDashboardPage /></ProtectedRoute>} />
              <Route path="terms" element={<Terms />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="about" element={<About />} />
              <Route path="copyright" element={<Copyright />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route path="docs/legal/:docId?" element={<LegalDocsPage />} />
            <Route path="docs/legal" element={<LegalDocsPage />} />
            <Route path="legal" element={<Navigate to="/docs/legal" replace />} />

            <Route path="share/:id" element={<SharedSnapshotPage />} />

            <Route path="/settings/:tab?" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="*" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PWAWrapper>
      </ErrorBoundary>
    </ArtifactProvider>
      {import.meta.env.DEV && <DiagnosticMobileOverlay />}
    </VideoResourceProvider>
    </UnifiedFeedbackProvider>
    </AppProvider>
    </PwaProvider>
</BrowserRouter>
  );
}
