import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Scale, 
  ShieldCheck, 
  Globe, 
  CreditCard, 
  Building2, 
  FileText,
  Lock,
  Ban,
  UserCheck,
  Cpu,
  Shield,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { perplextaPageTransition } from '@/design-system';
import { ContentContainer } from '../components/ContentContainer';

export const Terms: React.FC = () => {
  const { language, dir } = useAppContext();
  const navigate = useNavigate();

  const isAr = language === "ar";

  const sections = [
    {
      icon: UserCheck,
      title: isAr ? "1. الأهلية وشروط الترخيص" : "1. Eligibility and Licensing Terms",
      content: isAr 
        ? "يُمنح المستخدم ترخيصاً محدوداً، غير حصري، وغير قابل للتحويل لاستخدام خدمات المنصة وفقاً للأغراض التشغيلية المحددة لها."
        : "Users are granted a limited, non-exclusive, and non-transferable license to utilize the platform's services in accordance with their specified operational purposes.",
      subItems: [
        {
          label: isAr ? "حظر الهندسة العكسية" : "Reverse Engineering Ban",
          desc: isAr ? "يُحظر تماماً محاولة الهندسة العكسية لأي جزء من الكود البرمجي الخاص بمنطق التبديل الذكي أو واجهة الإدارة." : "Attempting to reverse engineer any part of the smart switching logic or management interface is strictly prohibited."
        },
        {
          label: isAr ? "الأهلية القانونية" : "Legal Eligibility",
          desc: isAr ? "يقتصر الوصول للمنصة على الأشخاص الذين بلغوا السن القانوني في ولايتهم القضائية، أو من لديهم موافقة صريحة من ولي الأمر." : "Access to the platform is restricted to individuals who have reached the legal age in their jurisdiction, or those with explicit parental consent."
        }
      ]
    },
    {
      icon: Cpu,
      title: isAr ? "2. أدوات المنصة ونطاق الاستخدام" : "2. Platform Tools and Scope of Use",
      content: isAr 
        ? "توفر المنصة مجموعة متقدمة من الأدوات التي تشمل المحادثة الذكية، توليد الأكواد البرمجية، تحليل الملفات، وتوليد المحتوى المرئي والصوتي (الصور والفيديو)، بالإضافة للمساعد التعليمي والقانوني."
        : "The platform provides a suite of advanced tools including smart chat, code generation, file analysis, visual/audio generation (images and video), and educational/legal assistants.",
      subItems: [
        {
          label: isAr ? "الاستخدام المصرح للأدوات" : "Authorized Tool Usage",
          desc: isAr ? "يحق لك استخدام الميزات لتحسين إنتاجيتك الخاصة، مع الالتزام بعدم الاعتماد الكلي عليها في اتخاذ قرارات مصيرية أو قانونية بحتة دون استشارة متخصص." : "You may use these features to enhance productivity, provided you do not rely solely on them for critical legal or life-altering decisions without professional consultation."
        },
        {
          label: isAr ? "توليد الوسائط المتعددة" : "Multimedia Generation",
          desc: isAr ? "يشترط استخدام أدوات توليد الفيديو، الصور، وتحويل النصوص إلى صوتيات (TTS/STT) لإنتاج محتوى يتوافق مع معايير الآداب العامة وقوانين النشر." : "The use of video, image, and audio generation tools (TTS/STT) is conditioned upon creating content that aligns with public decency and publishing laws."
        }
      ]
    },
    {
      icon: Ban,
      title: isAr ? "3. سياسة الاستخدام العادل والامتثال" : "3. Fair Use and Compliance Policy",
      content: isAr 
        ? "نطبق سياسات صارمة لمنع التلاعب وضمان استقرار الموارد لضمان جودة الخدمة لجميع المستخدمين."
        : "We implement strict policies to prevent manipulation and ensure resource stability to maintain service quality for all users.",
      subItems: [
        {
          label: isAr ? "الاستخدام الآلي المحظور" : "Prohibited Automated Use",
          desc: isAr ? "يُحظر استخدام أي أدوات آلية (Bots/Scripts) للوصول إلى خدماتنا أو محاولة التلاعب بمعدلات الاستهلاك لمختلف الأدوات." : "The use of automated tools (Bots/Scripts) to access our services or attempt to manipulate consumption rates of various tools is strictly prohibited."
        },
        {
          label: isAr ? "الأنشطة المحظورة" : "Prohibited Activities",
          desc: isAr ? "يُمنع استخدام المنصة لتوليد محتوى غير قانوني، يحرض على العنف، ينتهك الخصوصية، أو يحتوي على برمجيات خبيثة." : "Using the platform to generate illegal content, incite violence, violate privacy, or distribute malicious software is forbidden."
        },
        {
          label: isAr ? "تعليق الحساب والحصص" : "Quota and Account Suspension",
          desc: isAr ? "تحتفظ إدارة بيربليكستا بالحق لتجميد أي حساب يثبت استنزافه للحصص المخصصة بطرق غير مشروعة." : "PERPLEXTA reserves the right to freeze any account proven to maliciously deplete assigned quotas."
        }
      ]
    },
    {
      icon: CreditCard,
      title: isAr ? "4. الاقتصاد الرقمي والاشتراكات" : "4. Digital Economy and Subscriptions",
      content: isAr 
        ? "تخضع كافة العمليات المالية من شحن المحفظة الرقمية، ودفع الاشتراكات، لمعايير الأمان البنكي والشفافية التامة."
        : "All financial operations including digital wallet top-ups and subscription payments are subject to banking security standards and full transparency.",
      subItems: [
        {
          label: isAr ? "المحفظة الرقمية" : "Digital Wallet",
          desc: isAr ? "يُستخدم نظام الدفتر المالي الآمن لتعقب عمليات الشحن والدفع بنقرة واحدة، ولا يتم تعديل الأرصدة إلا من خلال عمليات موثقة." : "Our secure ledger system tracks top-ups and 1-click payments. Balances are modified only through strictly audited operations."
        },
        {
          label: isAr ? "نظام المكافآت والإحالات" : "Rewards & Referrals",
          desc: isAr ? "يمنحك نظام الإحالة الشفاف مكافآت تضاف لمحفظتك؛ ويخضع النظام لرقابة تامة لمنع التسجيل الوهمي." : "The transparent referral system grants rewards to your wallet; the system is strictly monitored to prevent fake registrations."
        },
        {
          label: isAr ? "سياسة الاسترداد" : "Refund Policy",
          desc: isAr ? "نظراً للاستهلاك الفوري للموارد والحصص الرقمية، فإن جميع الاشتراكات والأرصدة المشحونة غير قابلة للاسترداد." : "Due to the immediate consumption of digital quotas and resources, all subscriptions and topped-up balances are non-refundable."
        }
      ]
    },
    {
      icon: ShieldCheck,
      title: isAr ? "5. الملكية الفكرية وحماية الابتكار" : "5. Intellectual Property & Innovation Protection",
      content: isAr 
        ? "جميع العلامات التجارية والمنطق البرمجي لـ بيربليكستا هي ملكية حصرية للمنصة."
        : "All trademarks and programming logic of PERPLEXTA are exclusive intellectual property.",
      subItems: [
        {
          label: isAr ? "ملكية مخرجاتك" : "Output Ownership",
          desc: isAr ? "يحتفظ المستخدم بملكية المحتوى المولد الخاص به للاستخدام التجاري أو الشخصي وفق خطة الاشتراك الخاصة به." : "Users retain ownership of their generated content for commercial or personal use according to their subscription plan."
        },
        {
          label: isAr ? "حماية المنصة" : "Platform Protection",
          desc: isAr ? "يُحظر أي استخدام غير مصرح به لشعاراتنا أو محاولة نسخ البنية المعمارية للمنصة." : "Any unauthorized use of our logos or attempts to copy the platform's architectural structure is strictly prohibited."
        }
      ]
    },
    {
      icon: Shield,
      title: isAr ? "6. إخلاء المسؤولية والقانون الواجب التطبيق" : "6. Disclaimer and Governing Law",
      content: isAr 
        ? "تُقدم الخدمة والأدوات 'كما هي' وتخضع للقوانين والأنظمة الرسمية السارية."
        : "The service and tools are provided 'as is' and are fully subject to active legal regulatory laws.",
      subItems: [
        {
          label: isAr ? "دقة الذكاء الاصطناعي" : "AI Accuracy",
          desc: isAr ? "يرجي الانتباه إلى أن مخرجات الذكاء الاصطناعي خاضعة للتجربة والخطأ، ولا نقدم ضمانات لدقة التحليلات الطبية والمالية." : "Please note that AI outputs are subject to trial and error. We do not provide absolute guarantees for the accuracy of medical or financial analyses."
        },
        {
          label: isAr ? "القانون الواجب" : "Governing Law",
          desc: isAr ? "تخضع هذه الاتفاقية وتفسر وفقاً للقوانين واللوائح المعمول بها، ويتم فض النزاعات وفق الإجراءات القانونية المعتمدة." : "This agreement is governed by and construed in accordance with standard legal procedures."
        }
      ]
    },
    {
      icon: ShieldCheck,
      title: isAr ? "7. سياسة محتوى المستخدم والرقابة الذاتية (UGC Policy)" : "7. User-Generated Content (UGC) & Moderation Policy",
      content: isAr 
        ? "تلتزم المنصة بتطبيق معايير صارمة للسلامة والرقابة على محتوى المساحات التفاعلية (بيربليكستا بورد والمحادثات المباشرة)."
        : "The platform strictly enforces user safety and content moderation policies across interactive spaces (Perplexta Board & Messenger).",
      subItems: [
        {
          label: isAr ? "المحتوى المحظور" : "Prohibited Content",
          desc: isAr ? "يُمنع تماماً نشر أو تبادل محتوى مسيء، تحريضي، إباحي، ينتهك حقوق الملكية الفكرية، أو يروج للاحتيال والانتهاكات." : "Strictly prohibits objectionable, abusive, explicit, defamatory, or fraudulent content across all interactive features."
        },
        {
          label: isAr ? "الإبلاغ والحظر الفوري" : "Reporting & Account Action",
          desc: isAr ? "تتيح المنصة زر إبلاغ مباشر (Report) في جميع منشورات ومحادثات المستخدمين. يتم فحص البلاغات واتخاذ إجراء حظر أو حذف خلال 24 ساعة." : "Users can report any objectionable content or user directly. Moderation teams audit reports and act within 24 hours."
        }
      ]
    }
  ];

  return (
    <ContentContainer 
      className="overflow-y-auto h-full custom-scrollbar"
    >
      <div className="sticky -top-0.5 z-20 -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-6 bg-[var(--surface-page)]/90 backdrop-blur-md border-b border-[var(--border-default)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            id="terms-back-btn"
            className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center transition-theme bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--fg-accent)] hover:border-[var(--border-accent)] active:scale-95 cursor-pointer"
            title={dir === 'rtl' ? 'رجوع' : 'Back'}
          >
            {dir === 'rtl' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[var(--text-primary)] uppercase flex items-center gap-2">
              <Scale className="text-[var(--fg-accent)]" size={20} />
              {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest font-mono">
              {isAr ? 'القواعد والسياسات المنظمة' : 'GOVERNING RULES & POLICIES'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-24">
        <section className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-bold uppercase tracking-widest">
            <Scale size={14} className="text-[var(--fg-accent)]" />
            {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[var(--text-primary)] uppercase">
            {isAr ? "بيربليكستا" : "PERPLEXTA"}
          </h1>
          <p className="text-lg md:text-2xl font-bold text-[var(--fg-accent)] max-w-2xl mx-auto leading-relaxed">
            {isAr ? "الشروط والأحكام والسياسات العامة" : "Terms, Conditions & Operational Policies"}
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div className="space-y-8">
            <div className="p-6 md:p-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] backdrop-blur-sm shadow-sm transition-theme hover:border-[var(--border-accent)] group">
              <div className="flex items-center gap-3 text-[var(--text-primary)] mb-4">
                <FileText className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-theme" />
                <h2 className="text-xl md:text-2xl font-black">{isAr ? "الموافقة والالتزام" : "Agreement & Compliance"}</h2>
              </div>
              <p className="text-sm md:text-base leading-relaxed text-[var(--text-secondary)] font-medium">
                {isAr 
                  ? "باستخدامك لمنصة بيربليكستا، فأنت تقر بموافقتك الكاملة وغير المشروطة على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يجب عليك التوقف فوراً عن استخدام المنصة."
                  : "By using the PERPLEXTA platform, you acknowledge your full and unconditional agreement to abide by these Terms and Conditions. If you do not agree with any part of them, you must immediately cease using the platform."}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--fg-accent)] font-mono mt-4">
                {isAr ? "تاريخ السريان: مارس 25, 2026" : "Effective Date: March 25, 2026"}
              </p>
            </div>
          </div>

          <div className="relative aspect-square rounded-[var(--radius-lg)] overflow-hidden bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center p-8 shadow-inner">
            <div className="relative z-10 flex flex-col items-center gap-8 w-full">
              <div className="flex items-center justify-center p-6 rounded-[var(--radius-xs)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-lg hover:shadow-none transition-theme group animate-pulse">
                <Scale className="w-24 h-24 text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-theme" />
              </div>

              <div className="grid grid-cols-3 gap-3 w-full">
                {[
                  { icon: Shield, label: isAr ? "حماية قانونية" : "Legal Protection" },
                  { icon: Lock, label: isAr ? "التزام صارم" : "Strict Compliance" },
                  { icon: Globe, label: isAr ? "معايير دولية" : "Global Standards" }
                ].map((item, idx) => (
                  <div 
                    key={`terms-pillar-${idx}-${item.label}`}
                    className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-card)] border border-[var(--border-subtle)] flex flex-col items-center gap-2 transition-theme hover:border-[var(--border-accent)] hover:-translate-y-1 group hover:shadow-sm"
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

        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] uppercase">
              {isAr ? "بنود الاتفاقية والسياسة" : "Agreement Clauses & Policies"}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl mx-auto font-medium leading-relaxed">
              {isAr ? "نصوص قانونية تبين العلاقة التنظيمية بين المستخدم والمنصة لضمان حقوق كافة الأطراف." : "Legal text clarifying the regulatory relation between user and platform to maintain the rights of all parties."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((section, i) => (
              <div 
                key={`terms-sec-${i}-${section.title}`} 
                className="p-6 md:p-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] transition-theme group shadow-sm"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-[var(--radius-xs)] bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-theme">
                    <section.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--fg-accent)] transition-colors duration-300">{section.title}</h3>
                </div>

                <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-semibold mb-6">
                  {section.content}
                </p>

                <div className="space-y-4 pt-6 border-t border-[var(--border-subtle)]">
                  {section.subItems.map((sub, sIdx) => (
                    <div key={`terms-sub-${i}-${sIdx}-${sub.label}`} className="space-y-1">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[var(--fg-accent)]">{sub.label}</h4>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">{sub.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-8 md:p-10 rounded-[var(--radius-md)] border border-[var(--border-accent)]/20 bg-[var(--surface-subtle)] shadow-[0_4px_24px_rgba(156,163,175,0.03)] space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--surface-inset)] rounded-[var(--radius-xs)] blur-3xl group-hover:opacity-80 transition-theme" />
          <h2 className="text-2xl font-black text-[var(--fg-accent)]">{isAr ? "إقرار قانوني بموافقة المعرفة الصفرية" : "Legal Zero-Knowledge Acknowledgment"}</h2>
          <p className="text-sm md:text-base leading-relaxed text-[var(--text-primary)] font-semibold font-sans">
            {isAr 
              ? "استخدامك للمنصة يعني أنك قرأت وفهمت أن بيربليكستا تعمل بنظام المعرفة الصفرية فيما يخص بياناتك، وأنه يتعين عليك الالتزام بكافة الضوابط الصارمة المذكورة أعلاه لحماية استقرار المنصة الاستراتيجية وحقوق الملكية الفكرية."
              : "Your use of the platform signifies that you have fully read and understood that PERPLEXTA operates strictly on a Zero-Knowledge paradigm regarding your personal data processing pipelines, and that you totally agree with all regulations described above to maintain platform integrity, stability, and intellectual property."}
          </p>
        </section>

        <section className="p-6 md:p-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] space-y-8">
          <div className="flex items-center gap-3 text-[var(--text-primary)]">
            <Shield className="w-5 h-5 text-[var(--fg-accent)]" />
            <h2 className="text-xl md:text-2xl font-black">{isAr ? "الهوية المؤسسية والشفافية" : "Corporate Identity & Transparency"}</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm md:text-base font-bold text-[var(--text-primary)]">
              {isAr 
                ? "منصة بيربليكستا هي بيئة تقنية متقدمة لإدارة وتحليل الذكاء الاصطناعي مع التزام كامل بالشفافية والسرية."
                : "PERPLEXTA platform is an advanced AI analysis and orchestration suite committed to total transparency and confidentiality."}
            </p>
          </div>
        </section>

        <section className="hidden md:block p-6 md:p-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] space-y-4 text-center">
          <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)]">
            {isAr ? "مكتبة الوثائق القانونية والسياسات الرسمية الشاملة" : "Complete Legal Documentation & Regulatory Suite"}
          </h3>
          <p className="text-xs md:text-sm text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            {isAr 
              ? "تفضل بزيارة مركز التوثيق القانوني التفاعلي الشامل لشركة فيرال لينك اب المحدودة للاطلاع على كافة السياسات التفصيلية (اتفاقية مستوى الخدمة، ميثاق سلامة الذكاء الاصطناعي، المعالجات الفرعية، مكافحة غسل الأموال، وتراخيص البرمجيات)." 
              : "Explore the comprehensive interactive legal repository of ViralLinkUp Limited covering SLA, AI Safety Charters, Sub-processors, AML/KYC, and Source Code Licensing."}
          </p>
          <div className="pt-2">
            <a
              href="/docs/legal"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            >
              <span>{isAr ? "الوثائق القانونية" : "Legal Documents"}</span>
              <ArrowUpRight size={16} />
            </a>
          </div>
        </section>

        <footer className="pt-10 border-t border-[var(--border-subtle)] space-y-10">
          <div className="text-center">
            <p className="text-lg md:text-xl font-black text-[var(--text-primary)] tracking-widest uppercase font-mono">
              {isAr ? "بيربليكستا - نبتكر لنحمي بياناتك" : "PERPLEXTA - INNOVATING TO PROTECT YOUR DATA"}
            </p>
          </div>

          <div className="p-6 md:p-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] space-y-4 max-w-4xl mx-auto shadow-inner">
            <div className="flex items-center gap-3 text-[var(--text-primary)]">
              <Shield className="w-5 h-5 text-[var(--fg-accent)]" />
              <h3 className="text-base md:text-lg font-black">{isAr ? "حقوق الملكية الفكرية" : "Intellectual Property Rights"}</h3>
            </div>
            <p className="text-xs md:text-sm leading-relaxed text-[var(--text-secondary)] font-semibold font-sans">
              {isAr 
                ? "جميع الحقوق البرمجية، العلامة التجارية، ومنطق الربط الذكي الخاص بـ بيربليكستا وكافة مشاريعنا هي حقوق محفوظة بالكامل."
                : "All software rights, trademarks, and the smart connection logic of PERPLEXTA and all associated projects are fully protected."}
            </p>
          </div>
        </footer>
      </div>
    </ContentContainer>
  );
};

export default Terms;
