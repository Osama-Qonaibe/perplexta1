import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Newspaper,
  Info,
  Target,
  Globe,
  Shield,
  Building2,
  ExternalLink,
  Layers,
  Cpu,
  Palette,
  Video,
  Zap,
  Search,
  Lock,
  CheckCircle2,
  Scale,
  MessageSquare,
  Code,
  Image as ImageIcon,
  BookOpen,
  Music,
  Megaphone,
  Volume2,
  Mic,
  Boxes,
  Wallet,
  Gift,
  CreditCard,
  Database,
  Server,
  Share2,
} from "lucide-react";
import { motion } from "motion/react";
import { perplextaPageTransition } from "@/design-system";

export const About: React.FC = () => {
  const { language, dir } = useAppContext();
  const navigate = useNavigate();

  const isAr = language === "ar";

  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>(
    {},
  );

  const toggleCard = (index: number) => {
    setExpandedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const architecturalPillars = [
    {
      id: "dual_db",
      title: isAr ? "بنية قواعد البيانات الثنائية" : "Dual-Database Architecture",
      desc: isAr
        ? "فصل تام وعالي الأمان بين قاعدة البيانات التشغيلية الأساسية (للبيانات والملفات والجلسات) وقاعدة بيانات الحسابات المالية ودفتر الأستاذ (Ledger) للمعاملات والأرصدة."
        : "Absolute segregation between the core operational database (telemetry, files, sessions) and the secure append-only financial Ledger vault for wallets and transactions.",
      icon: <Database size={22} className="text-[var(--fg-accent)]" />,
    },
    {
      id: "orchestrator",
      title: isAr ? "محرك التوجيه الصامت (Orchestrator)" : "Silent Failover AI Orchestrator",
      desc: isAr
        ? "نظام توجيه ذكي ديناميكي يختار النماذج والمزودين تلقائياً مع تفعيل التبديل الفوري عند استنفاد الحصص، مما يضمن استمرارية التشغيل بنسبة 100% ودون أي انقطاع."
        : "Dynamic routing intelligence that automatically assigns and fails over between AI models and providers, ensuring 100% uptime and zero-latency execution.",
      icon: <Cpu size={22} className="text-[var(--fg-accent)]" />,
    },
    {
      id: "vault",
      title: isAr ? "خزانة مفاتيح أمنية بصفر زمن انتقال" : "Zero-Latency API Vault",
      desc: isAr
        ? "إدارة مشفرة بالكامل (AES-256) لمفاتيح مزودي الذكاء الاصطناعي والخدمات السحابية مع قراءة محلية فورية تضمن أماناً سيادياً وسرعة استجابة فائقة."
        : "Fully encrypted (AES-256) API key management and local cache loading guaranteeing sovereign enterprise security and lightning-fast response times.",
      icon: <Lock size={22} className="text-[var(--fg-accent)]" />,
    },
  ];

  const featuresToolsList = [
    {
      id: "chat",
      title: isAr ? "المساعد الاستراتيجي (Chat)" : "Elite Chat Assistant",
      desc: isAr
        ? "مساعد استراتيجي نخبوي للنقاش المهني، حل المشكلات المعقدة، والتحليل المنطقي العام بشكل سريع وفعال."
        : "Elite strategic assistant for professional discourse, complex problem solving, and efficient logical analysis.",
      imageUrl:
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600",
      icon: <MessageSquare size={20} />,
    },
    {
      id: "code",
      title: isAr ? "محطة هندسة البرمجيات (Code)" : "Software Engineering Studio",
      desc: isAr
        ? "محطة عمل هندسة البرمجيات. يوفر بناء الهياكل البرمجية المتقدمة وكتابة شيفرات دقيقة ونظيفة تلبي احتياجاتك."
        : "Master-level software engineering workstation providing advanced code scaffolding and generation.",
      imageUrl:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600",
      icon: <Code size={20} />,
    },
    {
      id: "perplexta_analysis",
      title: isAr ? "البحث والتحليل العميق (Analysis)" : "Advanced Search & Analysis",
      desc: isAr
        ? "البحث التقني والتحليل الرقمي العميق لاستخراج البيانات الاستراتيجية والمؤشرات الإحصائية بدقة فائقة."
        : "High-precision intelligent engine for deep search and extracting strategic data and statistical indicators.",
      imageUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600",
      icon: <Search size={20} />,
    },
    {
      id: "image",
      title: isAr ? "محرك التوليد البصري (Image)" : "Visual Synthesis Engine",
      desc: isAr
        ? "محرك توليد بصري عالي الدقة للأصول المهنية. إمكانية تحويل النصوص لصور بمستوى إبداعي استثنائي لمختلف الاستخدامات."
        : "High-precision visual synthesis engine for professional assets. Text to image generation with exceptional creativity.",
      imageUrl:
        "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?auto=format&fit=crop&q=80&w=600",
      icon: <ImageIcon size={20} />,
    },
    {
      id: "video",
      title: isAr ? "استوديو الفيديو السينمائي (Video)" : "Cinematic Video Studio",
      desc: isAr
        ? "توليد مشاهد بصرية احترافية وتحريك العناصر بناءً على التعليمات الوصفية، مع الالتزام بالمعايير الدولية السينمائية."
        : "Generate professional visual scenes and animate elements with strict international cinematic standards.",
      imageUrl:
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600",
      icon: <Video size={20} />,
    },
    {
      id: "viralbook",
      title: isAr ? "شبكة فيرال بوك (ViralBook Hub)" : "ViralBook Social & Ads Hub",
      desc: isAr
        ? "المنصة الاجتماعية والتجارية المتكاملة: نشر المنشورات والقصص والمقاطع، توثيق الصفحات التجاريّة، إدارة الإعلانات والترويج بخصم لحظي من المحفظة."
        : "Integrated social & commercial hub: posts, stories, reels, verified business pages, campaign ad boosting with real-time wallet debiting.",
      imageUrl:
        "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&q=80&w=600",
      icon: <Share2 size={20} />,
    },
    {
      id: "ads_copilot",
      title: isAr ? "مساعد الإعلانات الذكي (Ads Copilot)" : "Ads Copilot",
      desc: isAr
        ? "مساعد استراتيجي مخصص لصياغة الحملات الإعلانية، كتابة النصوص التسويقية، وتوزيع الميزانيات لمنصة فيرال بوك والمنصات العالمية."
        : "Strategic campaign designer, high-converting ad copywriter, and media buying copilot for ViralBook and global ad platforms.",
      imageUrl:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600",
      icon: <Megaphone size={20} />,
    },
    {
      id: "canvas",
      title: isAr ? "استوديو الصوت واللحن (Audio Studio)" : "Audio & Music Studio",
      desc: isAr
        ? "محرك هندسة صوتي ولحني احترافي متخصص في تحرير الصوت وإدارة الملفات الصوتية بميزات ومرونة عالية."
        : "Professional audio and melody engineering engine specialized in sound editing and audio management.",
      imageUrl:
        "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=600",
      icon: <Music size={20} />,
    },
    {
      id: "stt",
      title: isAr ? "التفريغ الصوتي (Speech to Text)" : "Speech to Text Engine",
      desc: isAr
        ? "محرك التفريغ الصوتي فائق الدقة. استخراج النصوص من المحادثات والمقاطع الصوتية بكفاءة عالية وبدون أخطاء."
        : "High-fidelity acoustic transcription engine. Efficient and accurate extraction of text from audio clips.",
      imageUrl:
        "https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&q=80&w=600",
      icon: <Mic size={20} />,
    },
    {
      id: "tts",
      title: isAr ? "التحويل الصوتي (Text to Speech)" : "Text to Speech Synthesis",
      desc: isAr
        ? "توليد صوتي طبيعي متطور وهندسة صوتية نخبوية، مما يتيح لك الاستماع للنصوص والمحتويات بنبرة واقعية ولغات متعددة."
        : "Elite natural acoustic synthesis and voice engineering, allowing you to listen to context in a realistic tone.",
      imageUrl:
        "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=600",
      icon: <Volume2 size={20} />,
    },
  ];

  const newsList = [
    {
      date: "2026-09-21",
      title: isAr
        ? "إطلاق الإصدار الشامل لشبكة فيرال بوك التجارية"
        : "Full Launch of ViralBook Commercial & Social Network",
      excerpt: isAr
        ? "تدشين لوحة إعلانات فيرال بوك، الصفحات التجارية الموثقة، ونظام الترويج المالي المرتبط بالمحفظة..."
        : "Deploying ViralBook bulletin feed, verified business pages, and wallet-backed ad boosting system...",
      fullContent: isAr
        ? "أطلقنا رسمياً شبكة فيرال بوك المتكاملة داخل بيربليكستا، والتي تضم نظاماً متطوراً لإدارة الصفحات التجارية، المنشورات والقصص والمقاطع (Reels)، مع نظام إعلاني يعتمد على الخصم الفوري من المحفظة الرقمية وتحليلات العائد على الإعلانات (ROAS)."
        : "We have officially launched the integrated ViralBook network within Perplexta, featuring verified merchant pages, posts, stories, reels, and an ad boosting engine with real-time wallet debiting and ROAS analytics.",
      imageUrl:
        "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&q=80&w=600",
    },
    {
      date: "2026-05-27",
      title: isAr
        ? "دمج محرك الفيديو الاحترافي وتوسيع بيئة العمل"
        : "Professional Video Engine Integration & Ecosystem Expansion",
      excerpt: isAr
        ? "استكمال منظومة بيئة بيربليكستا بإضافة توليد الفيديو السينمائي والأدوات المتقدمة في واجهة واحدة..."
        : "Completing the Perplexta ecosystem by adding cinematic video generation and advanced tools in a unified interface...",
      fullContent: isAr
        ? "أكملنا بنجاح دمج محرك توليد الفيديو الاحترافي وتوسيع بيئة الأدوات المتاحة للنخبة لتشمل مساعد التعليم، والمساعد القانوني، والمفكرة البحثية. هذا التحديث يجعل المنصة بيئة متكاملة تدمج تحليل الأكواد، قراءة الملفات المعقدة، التوليد الصوتي، والإبداع المرئي ضمن واجهة واحدة احترافية وببنية هندسية متينة تضمن تنفيذًا دون أخطاء."
        : "We successfully integrated a professional video generation engine and expanded our elite tools to include Education Assistant, Legal Assistant, and Research Notebook. This update makes the platform a unified ecosystem integrating code analysis, complex file parsing, audio generation, and visual creativity in a single professional interface with a robust architecture ensuring error-free execution.",
      imageUrl:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=600",
    },
    {
      date: "2026-05-15",
      title: isAr
        ? "تأمين النظام بدستور بروتوكول الأمان الموحد"
        : "Military-Grade Secure Constitution Active",
      excerpt: isAr
        ? "دمج الدستور الأمني فائق الحماية CORE_PROTOCOL لضمان أمان وحماية بيانات المهام..."
        : "Integration of the Perplexta Global Edition constitution under advanced CORE_PROTOCOL...",
      fullContent: isAr
        ? "قامت المنصة بتفعيل الدستور الأمني الشامل ثنائي اللغة (العربية والإنجليزية). يفرض هذا الدستور حماية معيارية مشددة في الخادم وتشفير البيانات الحساسة بمستويات AES-256، مما يمنع تسريب تفاصيل الجلسات أو كشف البيانات حتى في الاستعلامات المتقدمة."
        : "Perplexta has activated its bilingual military-grade Global Constitution on the server. Managed under the CORE_PROTOCOL flag, this protocol guarantees robust AES-256 encryption on all sensitive API integrations, preventing data leaks and maintaining strict enterprise data security.",
      imageUrl:
        "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=600",
    },
  ];

  const ecosystem = [
    {
      name: isAr ? "بيربليكستا" : "Perplexta",
      desc: isAr
        ? "المنصة الأحدث المتخصصة في التصميم، وصناعة الفيديو والصور بدعم تقني متكامل"
        : "The latest platform specialized in design, video and image creation with integrated technical support",
      url: "https://perplexta.com",
    },
    {
      name: "HebronAI",
      desc: isAr
        ? "أضخم منصة للمطورين وصناع المحتوى، تضم أدوات ونماذج ذكاء اصطناعي متقدمة"
        : "The largest platform for developers and content creators, featuring advanced AI tools and models",
      url: "https://hebronai.net",
    },
    {
      name: "HebronMart",
      desc: isAr
        ? "مول رقمي متعدد التجار يربط الأسواق المحلية بالعالمية في تجربة تسوق فريدة"
        : "A multi-vendor digital mall connecting local markets to the world in a unique shopping experience",
      url: "https://hebronmart.com",
    },
    {
      name: "Perplexta Panel",
      desc: isAr
        ? "لوحة التسويق الرقمي، تحسين محركات البحث (SEO)، وتعزيز الحضور والسمعة الرقمية"
        : "Digital marketing panel, SEO, and enhancing digital presence and reputation",
      url: "https://perplexta.com",
    },
    {
      name: "Perplexta Net",
      desc: isAr
        ? "مكتبة المنتجات الرقمية المرخصة (GPL) الجاهزة لإعادة البيع والتخصيص"
        : "Library of licensed digital products (GPL) ready for resale and customization",
      url: "https://perplexta.net",
    },
    {
      name: "Perplexta Host",
      desc: isAr
        ? "خدمات الاستضافة السحابية وإدارة الخوادم الخاصة لضمان أعلى معايير الأمان والاعتمادية"
        : "Cloud hosting services and private server management to ensure high availability and security",
      url: "https://perplexta.org",
    },
  ];

  const features = [
    {
      title: isAr ? "الإدارة الذاتية للمهام" : "Autonomous Task Management",
      desc: isAr
        ? "نظام ذكي يتولى تحديد المحرك الأنسب لكل عملية لضمان أعلى جودة تنفيذ دون تدخل بشري"
        : "An intelligent system that determines the most suitable engine for each process to ensure the highest quality of execution without human intervention",
      icon: Zap,
    },
    {
      title: isAr ? "الاستقرار الفائق" : "Extreme Stability",
      desc: isAr
        ? "بنية تحتية سحابية متطورة تضمن استمرارية الخدمة بنسبة توافر كاملة وتحت أصعب ظروف ضغط البيانات"
        : "Advanced cloud infrastructure ensuring service continuity with full availability under the most challenging data pressure conditions",
      icon: Globe,
    },
    {
      title: isAr ? "البحث الإدراكي المتقدم" : "Advanced Cognitive Search",
      desc: isAr
        ? "قدرة فائقة على جلب المعلومات اللحظية وتحليلها بعمق لتزويدك بإجابات دقيقة وموثقة من قلب الويب"
        : "Superior ability to fetch real-time information and analyze it deeply to provide accurate and documented answers from the heart of the web",
      icon: Search,
    },
    {
      title: isAr ? "الإبداع متعدد الوسائط" : "Multimedia Creativity",
      desc: isAr
        ? "توليد محتوى بصري وسينمائي وصوتي احترافي عبر تكاملات تقنية ذكية تعيد صياغة مفهوم الابتكار"
        : "Generating professional visual cinematic and audio content through smart technical integrations that redefine the concept of innovation",
      icon: Palette,
    },
    {
      title: isAr ? "الخصوصية المطلقة" : "Absolute Privacy",
      desc: isAr
        ? "حماية بيانات المستخدمين داخل نظام مشفر بالكامل يتبع سياسات صارمة في أمان وحماية البيانات والخصوصية"
        : "Protecting user data within a fully encrypted system following strict policies in data security and user privacy",
      icon: Lock,
    },
    {
      title: isAr ? "الربط المتقدم للمطورين" : "Advanced Developer Integration",
      desc: isAr
        ? "توفير واجهات برمجية متقدمة تتيح للمطورين دمج قدرات المنصة الذكية داخل تطبيقاتهم ومشاريعهم الخاصة بمرونة عالية"
        : "Providing advanced APIs that allow developers to integrate the platform's smart capabilities into their own applications and projects with high flexibility",
      icon: Cpu,
    },
  ];

  const economyList = [
    {
      id: "wallet",
      title: isAr ? "المحفظة الرقمية والدفتر المزدوج" : "Digital Wallet & Dual-Ledger",
      desc: isAr 
        ? "نظام مالي متطور يعتمد دفتر الأستاذ المزدوج. شحن الرصيد، الدفع بنقرة واحدة، وتتبع دقيق للمعاملات المالية وحركات الأرصدة." 
        : "Advanced Dual-Ledger financial system. Top-up balances, 1-click payments, and precise transaction tracking.",
      imageUrl: "https://images.unsplash.com/photo-1616803140344-6682afb13cda?auto=format&fit=crop&q=80&w=600",
      icon: <Wallet size={20} />
    },
    {
      id: "referrals",
      title: isAr ? "برنامج الإحالات والمكافآت" : "Rewards & Referrals Program",
      desc: isAr 
        ? "نظام إحالة هرمي يمنحك مكافآت مستمرة. شارك رابطك واكسب أرصدة مجانية مع كل اشتراك جديد بمرونة عالية." 
        : "Hierarchical referral system for continuous rewards. Share your link and earn free credits with every new subscription.",
      imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600",
      icon: <Gift size={20} />
    },
    {
       id: "subscriptions",
       title: isAr ? "الاشتراكات والباقات" : "Flexible Subscriptions",
       desc: isAr
         ? "باقات متنوعة تناسب احتياجاتك، بدءاً من خطط البداية وحتى قوة النخبة الاستراتيجية مع تحكم كامل بالحصص والحدود."
         : "Diverse plans tailoring to your needs, from Starter to Elite strategic power with full quota control.",
       imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600",
       icon: <CreditCard size={20} />
    }
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={perplextaPageTransition}
      className="max-w-5xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6 pb-24 lg:pb-16 overflow-y-auto h-full custom-scrollbar"
    >
      <div className="sticky -top-0.5 z-20 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 mb-6 bg-[var(--surface-page)]/90 backdrop-blur-md border-b border-[var(--border-default)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            id="about-back-btn"
            className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center transition-theme bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--fg-accent)] hover:border-[var(--border-accent)] active:scale-95 cursor-pointer"
            title={dir === "rtl" ? "رجوع" : "Back"}
          >
            {dir === "rtl" ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[var(--text-primary)] uppercase flex items-center gap-2">
              <Info
                className="text-[var(--fg-accent)]"
                size={20}
              />
              {isAr ? "من نحن - موسوعة بيربليكستا" : "About Perplexta Platform"}
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest font-mono">
              {isAr ? "المنظومة الكاملة والقدرات الاستراتيجية" : "COMPLETE ECOSYSTEM & STRATEGIC CAPABILITIES"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-24">
        <section className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-bold uppercase tracking-widest">
            <Info size={14} className="text-[var(--fg-accent)]" />
            {isAr ? "الموسوعة الهندسية والمؤسسية" : "Engineering & Corporate Encyclopedia"}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[var(--text-primary)] uppercase">
            {isAr ? "بيربليكستا" : "PERPLEXTA"}
          </h1>
          <p className="text-lg md:text-2xl font-bold text-[var(--fg-accent)] max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? "القوة الكامنة خلف القرار الذكي والمنظومة الرقمية السيادية"
              : "The Power Behind Smart Decisions & Sovereign Digital Ecosystem"}
          </p>
        </section>

        {/* Architectural Pillars Section */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] uppercase flex items-center justify-center gap-2">
              <Server className="text-[var(--fg-accent)]" size={24} />
              {isAr ? "العمارة التقنية والنواة السيادية" : "Architectural Core & Sovereign Engine"}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
              {isAr
                ? "ركائز صلبة تضمن أعلى معايير الأمان، عزل البيانات، والمرونة التشغيلية."
                : "Solid pillars ensuring highest standards of security, data isolation, and operational resilience."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {architecturalPillars.map((pillar, i) => (
              <div
                key={`pillar-${i}-${pillar.id}`}
                className="p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--border-accent)] transition-theme group shadow-sm flex flex-col gap-3"
              >
                <div className="w-10 h-10 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center group-hover:border-[var(--border-accent)] transition-theme">
                  {pillar.icon}
                </div>
                <h3 className="text-lg font-black text-[var(--text-primary)]">
                  {pillar.title}
                </h3>
                <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed font-semibold font-sans">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div className="space-y-8">
            <div className="p-6 md:p-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] backdrop-blur-sm shadow-sm transition-theme hover:border-[var(--border-accent)] group">
              <div className="flex items-center gap-3 text-[var(--text-primary)] mb-4">
                <Target className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-theme" />
                <h2 className="text-xl md:text-2xl font-black">
                  {isAr ? "الرؤية الاستراتيجية" : "Strategic Vision"}
                </h2>
              </div>
              <p className="text-sm md:text-base leading-relaxed text-[var(--text-secondary)] font-medium">
                {isAr
                  ? "نؤمن بأن التكنولوجيا يجب أن تخدم الإنسان ببساطة. رؤيتنا هي بناء منصة سيادية متكاملة تضم أدوات الذكاء الاصطناعي، شبكة فيرال بوك الاجتماعية والتجارية، والدفتر المالي المزدوج في بيئة واحدة فائقة الأمان."
                  : "We believe technology should serve humanity simply. Our vision is to build an integrated sovereign platform uniting AI tools, ViralBook social/commercial network, and dual-ledger finance in one ultra-secure ecosystem."}
              </p>
            </div>

            <div className="p-6 md:p-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] backdrop-blur-sm shadow-sm transition-theme hover:border-[var(--border-accent)] group">
              <div className="flex items-center gap-3 text-[var(--text-primary)] mb-4">
                <Zap className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-theme" />
                <h2 className="text-xl md:text-2xl font-black">
                  {isAr ? "الرسالة التقنية" : "Technical Mission"}
                </h2>
              </div>
              <p className="text-sm md:text-base leading-relaxed text-[var(--text-secondary)] font-medium">
                {isAr
                  ? "تمكين المبدعين والشركات من تجاوز حدود الإنتاجية التقليدية عبر حلول ذكية، استقرار بنية تحتية بنسبة توافر 100%، والتزام مطلق بحماية الخصوصية وتشفير البيانات بمعايير عسكرية (AES-256)."
                  : "Empowering creators and enterprises to exceed traditional productivity limits through intelligent solutions, 100% uptime infrastructure, and absolute commitment to military-grade data encryption (AES-256)."}
              </p>
            </div>
          </div>

          <div className="relative aspect-square rounded-[var(--radius-lg)] overflow-hidden bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center p-8 shadow-inner">
            <div className="relative z-10 flex flex-col items-center gap-8 w-full">
              <div className="flex items-center justify-center p-6 rounded-[var(--radius-xs)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-lg hover:shadow-none transition-theme group">
                <Layers className="w-24 h-24 text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-theme" />
              </div>

              <div className="grid grid-cols-3 gap-3 w-full">
                {[
                  {
                    icon: Palette,
                    label: isAr ? "تصميم فائق" : "Superior Design",
                  },
                  {
                    icon: Share2,
                    label: isAr ? "فيرال بوك" : "ViralBook Hub",
                  },
                  { icon: Cpu, label: isAr ? "ذكاء متصل" : "Connected AI" },
                ].map((item, idx) => (
                  <div
                    key={`about-pillar-${idx}-${item.label}`}
                    className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-subtle)] flex flex-col items-center gap-2 transition-theme hover:border-[var(--border-accent)] hover:-translate-y-1 group"
                  >
                    <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] flex items-center justify-center border border-[var(--border-subtle)]">
                      <item.icon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-theme" />
                    </div>
                    <span className="text-[9px] uppercase font-black tracking-wider text-center leading-tight text-[var(--text-primary)]">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features & Tools Section */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] uppercase flex items-center justify-center gap-2">
              <Boxes className="text-[var(--fg-accent)]" size={24} />
              {isAr ? "منظومة الأدوات والقدرات الذكية" : "Ecosystem Tools & AI Capabilities"}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
              {isAr
                ? "محطات عمل متكاملة تلبي كافة احتياجات النخبة من هندسة البرمجيات، شبكة فيرال بوك، والصوتيات."
                : "Integrated workstations fulfilling all elite needs in software engineering, ViralBook network, and audio studios."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresToolsList.map((tool, i) => (
              <div
                key={`about-tool-${i}-${tool.title}`}
                className="p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] transition-theme group flex flex-col justify-between gap-4 cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md h-fit"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] border border-[var(--border-accent)] flex items-center justify-center text-[var(--fg-accent)] group-hover:bg-[var(--surface-card)] transition-all duration-fast">
                      {tool.icon}
                    </div>
                    <h3 className="text-lg font-black text-[var(--text-primary)] group-hover:text-[var(--fg-accent)] transition-colors duration-300">
                      {tool.title}
                    </h3>
                  </div>

                  <div className="relative w-full aspect-[16/10] rounded-[var(--radius-sm)] overflow-hidden border border-[var(--border-subtle)] shadow-sm bg-[var(--surface-inset)] group-hover:border-[var(--border-accent)] transition-colors duration-300">
                    <img
                      src={tool.imageUrl}
                      alt={tool.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-page)]/80 to-transparent pointer-events-none" />
                  </div>

                  <p className="text-xs md:text-sm text-[var(--text-secondary)] font-semibold leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Platform Economy Section */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] uppercase flex items-center justify-center gap-2">
              <Wallet className="text-[var(--fg-accent)]" size={24} />
              {isAr ? "اقتصاد المنصة والمكافآت" : "Platform Economy & Rewards"}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
              {isAr 
                ? "نظام البيئة المالية لبيربليكستا حيث تلتقي إدارة الأرصدة الشفافة بالدفتر المزدوج مع الاشتراكات المرنة وبرامج المكافآت." 
                : "The financial ecosystem of Perplexta, combining transparent dual-ledger balance management, flexible subscriptions, and reward programs."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {economyList.map((item, i) => (
              <div
                key={`about-economy-${i}-${item.title}`}
                className="p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] transition-theme group flex flex-col justify-between gap-4 cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md h-fit"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] border border-[var(--border-accent)] flex items-center justify-center text-[var(--fg-accent)] group-hover:bg-[var(--surface-card)] transition-all duration-fast">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-black text-[var(--text-primary)] group-hover:text-[var(--fg-accent)] transition-colors duration-fast">
                      {item.title}
                    </h3>
                  </div>

                  <div className="relative w-full aspect-[16/10] rounded-[var(--radius-sm)] overflow-hidden border border-[var(--border-subtle)] shadow-sm bg-[var(--surface-inset)] group-hover:border-[var(--border-accent)] transition-colors duration-fast">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-slow opacity-90 group-hover:opacity-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-page)]/80 to-transparent pointer-events-none" />
                  </div>

                  <p className="text-xs md:text-sm text-[var(--text-secondary)] font-semibold leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] uppercase">
              {isAr ? "الميزات والقدرات الهندسية" : "Engineering Features & Capabilities"}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl mx-auto font-medium leading-relaxed">
              {isAr
                ? "هندسة برمجية فريدة تجعلها المنصة الأكثر ذكاءً في إدارة الموارد التقنية عالمياً."
                : "Unique software architecture making it the smartest platform for managing technical resources globally."}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={`about-feature-${i}-${feature.title}`}
                className="p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] transition-theme group"
              >
                <div className="w-10 h-10 rounded-[var(--radius-xs)] bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] group-hover:border-[var(--border-accent)] mb-4 transition-theme">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed font-semibold font-sans">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="p-8 md:p-10 rounded-[var(--radius-md)] border border-[var(--border-accent)]/20 bg-[var(--surface-subtle)] shadow-[0_4px_24px_rgba(156,163,175,0.03)] space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--surface-inset)] rounded-[var(--radius-xs)] blur-3xl group-hover:opacity-80 transition-theme" />
          <h2 className="text-2xl font-black text-[var(--fg-accent)]">
            {isAr ? "لماذا بيربليكستا؟" : "Why PERPLEXTA?"}
          </h2>
          <p className="text-sm md:text-base leading-relaxed text-[var(--text-primary)] font-semibold font-sans">
            {isAr
              ? 'لأننا قدمنا "المساعد التنفيذي" المتكامل وشبكة فيرال بوك التجارية. بيربليكستا لا تخطئ في اختيار الأداة، فهي مبنية على منطق العمارة المزدوجة والتوجيه الصامت الذي يربط القوى التقنية العالمية في واجهة واحدة. نمنحك صفوة النتائج، ونوفر عليك الوقت والجهد وتكاليف الاشتراكات المتعددة.'
              : 'Because we have provided an integrated executive assistant and ViralBook commercial network. PERPLEXTA does not make mistakes in choosing the tool, built on dual-architecture logic and silent failover orchestration uniting global technical powers in one interface.'}
          </p>
          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <a
              href="/docs/legal"
              target="_blank"
              rel="noopener noreferrer"
              id="about-to-legal-docs-btn"
              className="px-5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Shield size={16} />
              <span>{isAr ? "الوثائق القانونية" : "Legal Documents"}</span>
              <ExternalLink size={14} className="opacity-70" />
            </a>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border border-[var(--border-default)] rounded-[var(--radius-md)] p-6 md:p-8 bg-[var(--surface-card)]">
          <div className="space-y-4 text-center md:text-right">
            <CheckCircle2 className="w-12 h-12 text-[var(--fg-accent)] mx-auto md:mx-0 md:mr-0 inline-block md:block" />
            <h3 className="text-2xl font-black text-[var(--text-primary)]">
              {isAr ? "أمان وموثوقية عالمية" : "Global Security & Reliability"}
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[var(--text-primary)]">
              <Scale className="w-5 h-5 text-[var(--text-muted)]" />
              <h2 className="text-xl font-bold">
                {isAr
                  ? "المعايير التقنية والالتزام"
                  : "Technical Standards & Commitment"}
              </h2>
            </div>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] font-semibold leading-relaxed">
              {isAr
                ? "نستخدم أحدث تقنيات Google المتطورة ونلتزم بمعايير المملكة المتحدة (UK GDPR) وقوانين الخصوصية العالمية، مع حماية العمليات المالية بسجلات دفتر أستاذ لا تقبل التعديل العشوائي."
                : "We rely on advanced Google technologies and adhere to UK GDPR and global privacy standards, protecting financial transactions with tamper-evident ledger records."}
            </p>
          </div>
        </section>

        {/* Corporate Identity Section */}
        <section className="p-6 md:p-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] space-y-8">
          <div className="flex items-center gap-3 text-[var(--text-primary)]">
            <Shield className="w-5 h-5 text-[var(--fg-accent)]" />
            <h2 className="text-xl md:text-2xl font-black">
              {isAr
                ? "الهوية المؤسسية والشفافية القانونية"
                : "PERPLEXTA - Corporate Identity & Legal Transparency"}
            </h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm md:text-base font-bold text-[var(--text-primary)]">
              {isAr
                ? "منصة بيربليكستا هي مشروع تقني رائد مملوك ومدار بالكامل من قبل"
                : "The PERPLEXTA platform is a leading technical project fully owned and managed by"}
            </p>
            <div className="p-6 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-[var(--text-primary)] mb-1">
                  {isAr ? "فيرال لينك اب المحدودة" : "ViralLinkUp Limited"} ({isAr ? "بيربليكستا" : "PERPLEXTA LTD"})
                </h3>
                <p className="text-xs md:text-sm font-semibold text-[var(--text-secondary)]">
                  {isAr
                    ? "شركة محدودة بالأسهم مسجلة رسمياً في المملكة المتحدة (إنجلترا وويلز)"
                    : "A company limited by shares officially registered in the United Kingdom (England & Wales)"}
                </p>
              </div>
              <div>
                <span className="inline-block px-3 py-1 text-xs font-bold text-[var(--fg-accent)] bg-[var(--surface-subtle)] rounded-[var(--radius-xs)] border border-[var(--border-accent)] shadow-[0_0_8px_rgba(156,163,175,0.2)]">
                  {isAr ? "نشطة" : "ACTIVE"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--border-subtle)]">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] transition-theme group shadow-sm">
                <Globe className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-theme" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                    {isAr ? "رقم التسجيل" : "Registration Number"}
                  </p>
                  <p className="text-base font-black text-[var(--text-primary)] font-mono">
                    16804604
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] transition-theme group shadow-sm">
                <Building2 className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-theme" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                    {isAr ? "المقر المسجل" : "Registered Office"}
                  </p>
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    128 City Road, London, EC1V 2NX
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-3 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                {isAr ? "طبيعة العمل" : "Nature of Business"}
              </p>
              <ul className="space-y-2 text-xs font-semibold text-[var(--text-secondary)]">
                <li className="flex items-center gap-2">
                  <span className="text-[var(--fg-accent)] font-mono font-bold">
                    58190
                  </span>
                  <span>
                    {isAr
                      ? "أنشطة النشر والابتكار التقني"
                      : "publishing and tech innovation"}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--fg-accent)] font-mono font-bold">
                    62012
                  </span>
                  <span>
                    {isAr
                      ? "تطوير البرمجيات التجارية"
                      : "business software development"}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--fg-accent)] font-mono font-bold">
                    63110
                  </span>
                  <span>
                    {isAr
                      ? "معالجة البيانات والاستضافة"
                      : "data processing and hosting"}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--fg-accent)] font-mono font-bold">
                    70229
                  </span>
                  <span>
                    {isAr
                      ? "استشارات الإدارة المتخصصة"
                      : "management consultancy"}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Digital Ecosystem Section */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] uppercase">
              {isAr ? "منظومة مشاريعنا" : "Our Digital Ecosystem"}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
              {isAr
                ? "ViralLinkUp Limited تفتخر بإدارة شبكة متكاملة من المنصات الرقمية"
                : "ViralLinkUp Limited is proud to manage an integrated network of digital platforms"}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ecosystem.map((item, i) => (
              <a
                key={`about-ecosystem-${i}-${item.name}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                id={`ecosystem-link-${i}`}
                className="p-5 rounded-[var(--radius-lg)] bg-[var(--surface-card)] border border-[var(--border-default)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-subtle)] transition-theme group block relative overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-black text-[var(--text-primary)] group-hover:text-[var(--fg-accent)] transition-colors">
                    {item.name}
                  </h3>
                  <ExternalLink className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-theme" />
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                  {item.desc}
                </p>
                <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] font-mono">
                    {item.url.replace("https://", "")}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Latest News & Releases */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] uppercase flex items-center justify-center gap-2">
              <Newspaper
                className="text-[var(--fg-accent)]"
                size={24}
              />
              {isAr ? "أحدث الأخبار وتحديثات النظام" : "Latest News & Releases"}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
              {isAr
                ? "ابق على اطلاع بآخر أخبار المنصة، والترقيات الهيكلية، والتطورات الهندسية لبيئة تحليلاتنا."
                : "Stay updated with our latest platform announcements, architectural upgrades, and engineering milestones."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsList.map((item, i) => {
              const isExpanded = !!expandedCards[i];
              return (
                <div
                  key={`about-news-${i}-${item.title}`}
                  id={`news-card-${i}`}
                  className="news-card p-6 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] transition-theme group flex flex-col justify-between gap-4 cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md h-fit"
                  onClick={() => toggleCard(i)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-black tracking-widest text-[var(--fg-accent)] bg-[var(--surface-subtle)] px-2.5 py-1 rounded-[var(--radius-xs)] border border-[var(--border-accent)]">
                        {item.date}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-theme"
                      >
                        <ChevronDown size={14} />
                      </motion.div>
                    </div>

                    <h3 className="text-base font-black text-[var(--text-primary)] group-hover:text-[var(--fg-accent)] transition-colors duration-fast leading-snug">
                      {item.title}
                    </h3>

                    {item.imageUrl && (
                      <div className="relative w-full aspect-[16/9] rounded-[var(--radius-sm)] overflow-hidden border border-[var(--border-subtle)] shadow-sm bg-[var(--surface-inset)] group-hover:border-[var(--border-accent)] transition-colors duration-fast">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-slow opacity-90 group-hover:opacity-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-page)]/80 to-transparent pointer-events-none" />
                      </div>
                    )}

                    <p className="text-xs md:text-sm text-[var(--text-secondary)] font-semibold leading-relaxed">
                      {item.excerpt}
                    </p>

                    <motion.div
                      initial={false}
                      animate={{
                        height: isExpanded ? "auto" : 0,
                        opacity: isExpanded ? 1 : 0,
                      }}
                      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-semibold leading-relaxed font-sans select-text whitespace-pre-line flex flex-col gap-3">
                        <span>{item.fullContent}</span>
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCard(i);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] border border-[var(--border-default)] text-[var(--text-primary)] hover:text-[var(--fg-accent)] text-[10px] font-black uppercase tracking-wider transition-theme cursor-pointer shadow-sm select-none"
                          >
                            <span>{isAr ? "▲ عرض أقل" : "▲ Show Less"}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="pt-2 flex items-center justify-start text-[10px] font-black uppercase tracking-wider text-[var(--fg-accent)] transition-theme select-none">
                    <span>
                      {isExpanded
                        ? isAr
                          ? "عرض أقل ▲"
                          : "Read Less ▲"
                        : isAr
                          ? "اقرأ المزيد ◀"
                          : "Read More ◀"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="pt-10 border-t border-[var(--border-subtle)] space-y-10">
          <div className="text-center">
            <p className="text-lg md:text-xl font-black text-[var(--text-primary)] tracking-widest uppercase font-mono">
              {isAr
                ? "بيربليكستا - نبتكر لنحمي بياناتك"
                : "PERPLEXTA - INNOVATING TO PROTECT YOUR DATA"}
            </p>
          </div>

          <div className="p-6 md:p-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] space-y-4 max-w-4xl mx-auto shadow-inner">
            <div className="flex items-center gap-3 text-[var(--text-primary)]">
              <Shield className="w-5 h-5 text-[var(--fg-accent)]" />
              <h3 className="text-base md:text-lg font-black">
                {isAr ? "حقوق الملكية الفكرية" : "Intellectual Property Rights"}
              </h3>
            </div>
            <p className="text-xs md:text-sm leading-relaxed text-[var(--text-secondary)] font-semibold font-sans">
              {isAr
                ? "جميع الحقوق البرمجية، العلامة التجارية، ومنطق الربط الذكي الخاص بـ بيربليكستا وكافة مشاريعنا هي حقوق محفوظة لشركة فيرال لينك اب المحدودة (ViralLinkUp Limited). أي محاولة لإعادة الإنتاج أو الاستخدام غير المصرح به تعرض الفاعل للمساءلة القانونية الدولية."
                : "All software rights, trademarks, and smart connection logic of PERPLEXTA and all our projects are reserved rights of ViralLinkUp Limited. Any attempt at reproduction or unauthorized use exposes the actor to international legal accountability."}
            </p>
          </div>
        </footer>
      </div>
    </motion.div>
  );
};
