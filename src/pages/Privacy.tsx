import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  Eye, 
  UserCheck, 
  Database, 
  Globe, 
  Scale,
  Cpu,
  Building2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileText,
  ExternalLink,
  Share2
} from 'lucide-react';
import { motion } from 'motion/react';
import { perplextaPageTransition } from '@/design-system';
import { ContentContainer } from '../components/ContentContainer';

export const Privacy: React.FC = () => {
  const { language, dir } = useAppContext();
  const navigate = useNavigate();

  const isAr = language === "ar";

  const sections = [
    {
      icon: Lock,
      title: isAr ? "1. التشفير المطلق ومعمارية المعرفة الصفرية (Zero-Knowledge)" : "1. Absolute Encryption & Zero-Knowledge Architecture",
      content: isAr 
        ? "نعلن بوضوح وصرامة تقنية تامة: لا تمتلك إدارة المنصة، ولا فريق المطورين، ولا أي جهة داخلية القدرة أو الصلاحية للوصول إلى محادثاتك، ملفاتك المرفوعة، صورك، أو أي محتوى تقوم بتوليده عبر محطات العمل الذكية."
        : "We declare with absolute technical strictness: neither platform management, nor developers, nor any internal party possesses the capability or authority to access your conversations, uploaded files, images, or generated content across AI workstations.",
      subItems: [
        {
          label: isAr ? "الناقل الأعمى للرسائل والمرفقات" : "Blind Carrier for Messages & Attachments",
          desc: isAr ? "تُعالج المستندات (PDF)، الأكواد، والصور بصورة لحظية وآمنة تماماً دون حفظ محتواها في قواعد البيانات التشغيلية بصيغة مقروءة." : "Documents, code, and images are processed in real-time and securely without saving readable content in operational databases."
        },
        {
          label: isAr ? "استحالة فك التشفير السيادي" : "Sovereign Decryption Impossibility",
          desc: isAr ? "حفظ البيانات بمفاتيح تشفير ديناميكية معزولة (AES-256) تجعل فك التشفير مستحيلاً هندسياً لأي طرف ثالث." : "Data preservation using isolated dynamic encryption keys (AES-256) making decryption an engineering impossibility for any third party."
        },
        {
          label: isAr ? "عزل الذاكرة المؤقتة" : "Ephemeral Memory Isolation",
          desc: isAr ? "تدمير المخازن المؤقتة فور اكتمال الجيل أو التصيير في استوديوهات الفيديو والصوت والذكاء الاصطناعي." : "Immediate purging of temporary buffers upon completion of generation or rendering in video, audio, and AI studios."
        }
      ]
    },
    {
      icon: Database,
      title: isAr ? "2. حماية الدفتر المزدوج والعمليات المالية (Ledger & Wallets)" : "2. Dual-Ledger & Financial Operations Protection",
      content: isAr 
        ? "تعمل المحفظة الرقمية والدفتر المزدوج (Dual-Ledger) في بيئة معزولة تماماً عن قواعد بيانات التشغيل، مع تطبيق أعلى معايير أمان البيانات المالية."
        : "The digital wallet and dual-ledger operate in an environment strictly isolated from operational databases, adhering to highest financial data security standards.",
      subItems: [
        {
          label: isAr ? "معالجة المدفوعات الآمنة" : "Secure Payment Processing",
          desc: isAr ? "تتم عمليات شحن الأرصدة عبر بوابات عالمية مشفرة (مثل Stripe) دون حفظ أي بيانات بطاقات ائتمان على خوادمنا." : "Top-up operations are processed via encrypted global gateways (e.g., Stripe) without storing credit card data on our servers."
        },
        {
          label: isAr ? "سجلات أستاذ غير قابلة للتلاعب" : "Tamper-Evident Ledger Logs",
          desc: isAr ? "تسجيل الحركات المالية للأرصدة والإحالات والمشتريات في سجلات append-only مشفرة ومؤمنة تماماً ضد التعديل." : "Financial transactions, referrals, and purchases are logged in encrypted append-only ledgers secure against unauthorized tampering."
        }
      ]
    },
    {
      icon: Share2,
      title: isAr ? "3. خصوصية شبكة فيرال بوك والصفحات التجارية (ViralBook Hub)" : "3. ViralBook Hub & Verified Pages Privacy",
      content: isAr 
        ? "تضمن منصة فيرال بوك الاجتماعية والتجارية خصوصية كاملة للمنشورات، القصص، المقاطع (Reels)، والمراسلات المباشرة بين المستخدمين والشركات."
        : "The ViralBook social and commercial hub guarantees full privacy for posts, stories, reels, and direct communications between users and merchants.",
      subItems: [
        {
          label: isAr ? "رسائل الاستفسارات المباشرة" : "Direct Inquiry Messages",
          desc: isAr ? "تشفير كافة المراسلات التجارية واستفسارات الإعلانات بين المشتري والصفحة التجارية الموثقة لضمان سرية التداولات." : "Encryption of all commercial correspondence and ad inquiries between buyers and verified business pages."
        },
        {
          label: isAr ? "تحليلات الحملات والترويج" : "Campaign & Boost Analytics",
          desc: isAr ? "معالجة بيانات النقرات والانطباعات بصفة مجمعة ودون ربط الهوية الشخصية للمستهلكين بأي نشاط تسويقي خارجي." : "Processing click and impression data in aggregate without associating consumer personal identity with external marketing activities."
        }
      ]
    },
    {
      icon: Cpu,
      title: isAr ? "4. التوجيه الذكي ومحرك الأوركسترا الصامت" : "4. Smart Routing & Silent Failover Orchestrator",
      content: isAr 
        ? "تعتمد النظم الذكية في بيربليكستا على محرك توجيه صامت (Orchestrator) يختار النماذج بأعلى كفاءة مع حماية تامة للخصوصية وعدم التدريب."
        : "Smart systems in PERPLEXTA rely on a silent failover orchestrator selecting models with highest efficiency and strict zero-training privacy.",
      subItems: [
        {
          label: isAr ? "عدم استخدام البيانات للتدريب" : "Anti-Training Guarantee",
          desc: isAr ? "عدم استخدام نصوصك، أكوادك، أو مرفقاتك لتدريب أي نماذج ذكاء اصطناعي أساسية وفق اتفاقيات المؤسسة." : "Never utilizing your texts, code, or attachments to train base AI models in accordance with enterprise agreements."
        },
        {
          label: isAr ? "التشفير اللحظي للنقاط الطرفية" : "Real-time Endpoint Encryption",
          desc: isAr ? "تشفير الاتصالات بين خوادم المنصة ومزودي خدمات الذكاء الاصطناعي والوسائط عبر بروتوكولات TLS 1.3 المتطورة." : "Encrypting communications between platform servers and AI/media providers via advanced TLS 1.3 protocols."
        }
      ]
    },
    {
      icon: ShieldCheck,
      title: isAr ? "5. حظر بيع البيانات وسياسة الاحتفاظ العقيم" : "5. Zero-Sell Policy & Sterile Data Retention",
      content: isAr 
        ? "نحظر تماماً بيع أو تأجير أو مشاركة بيانات مساحتك الرقمية أو سجلاتك مع أي أطراف تسويقية أو تجارية خارجية."
        : "We strictly prohibit selling, leasing, or sharing your digital space data or records with any external marketing or commercial parties.",
      subItems: [
        {
          label: isAr ? "الامتثال القانوني الدولي" : "International Legal Compliance",
          desc: isAr ? "الالتزام بأعلى معايير حماية البيانات الأوروبية (GDPR) وقوانين الخصوصية العالمية في إدارة ومعالجة الملفات." : "Adhering to high European data protection standards (GDPR) and global privacy laws in file management and processing."
        },
        {
          label: isAr ? "الحذف النهائي عند الطلب" : "Permanent Deletion on Request",
          desc: isAr ? "إمكانية مسح الحساب، سجل المحادثات، والملفات نهائياً من قواعد البيانات بضغطة زر واحدة." : "Ability to permanently erase account, chat history, and files from databases with a single click."
        }
      ]
    },
    {
      icon: UserCheck,
      title: isAr ? "6. حقوق التحكم وإدارة الهوية الرقمية" : "6. Digital Identity Control & User Rights",
      content: isAr 
        ? "نمنحك سيطرة كاملة ومطلق الصلاحية على ملفك الشخصي، إعدادات الأمان، والمحتوى المنشور ضمن مساحتك في بيربليكستا."
        : "We grant you full and absolute authority over your profile, security settings, and published content within your PERPLEXTA space.",
      subItems: [
        {
          label: isAr ? "الشفافية في تعديل الحساب" : "Transparent Account Modification",
          desc: isAr ? "تحديث بيانات البريد، الكلمات السرية، وتفضيلات الإشعارات بشكل فوري مع تزامن لحظي بين الأجهزة." : "Instantaneous updating of email, passwords, and notification preferences with real-time cross-device sync."
        }
      ]
    }
  ];

  return (
    <ContentContainer 
      className="overflow-y-auto h-full custom-scrollbar"
    >
      <div className="sticky -top-0.5 z-25 -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-6 bg-[var(--surface-page)]/90 backdrop-blur-md border-b border-[var(--border-default)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            id="privacy-back-btn"
            className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center transition-theme bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--fg-accent)] hover:border-[var(--border-accent)] active:scale-95 cursor-pointer"
            title={dir === 'rtl' ? 'رجوع' : 'Back'}
          >
            {dir === 'rtl' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[var(--text-primary)] uppercase flex items-center gap-2">
              <Shield className="text-[var(--fg-accent)]" size={20} />
              {isAr ? 'سياسة الخصوصية والوثائق القانونية' : 'Privacy Policy & Legal Documents'}
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest font-mono">
              {isAr ? 'حماية وأمان البيانات السيادية' : 'SOVEREIGN DATA PROTECTION & SECURITY'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/about')}
            id="privacy-to-about-btn"
            className="px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--border-accent)] font-bold text-xs uppercase tracking-wider transition-theme flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Building2 size={15} className="text-[var(--fg-accent)]" />
            <span>{isAr ? "عن المنصة (من نحن)" : "About Platform"}</span>
          </button>
        </div>
      </div>

      <div className="space-y-24">
        <section className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-bold uppercase tracking-widest">
            <Shield size={14} className="text-[var(--fg-accent)]" />
            {isAr ? "الدستور الأمني والوثائق القانونية" : "Security Constitution & Legal Documents"}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[var(--text-primary)] uppercase">
            {isAr ? "بيربليكستا" : "PERPLEXTA"}
          </h1>
          <p className="text-lg md:text-2xl font-bold text-[var(--fg-accent)] max-w-2xl mx-auto leading-relaxed">
            {isAr ? "الالتزام السيادي بحماية الخصوصية وأمان مساحتك الرقمية" : "Sovereign Commitment to Privacy & Digital Space Security"}
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/docs/legal"
              target="_blank"
              rel="noopener noreferrer"
              id="privacy-hero-legal-docs-btn"
              className="px-5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <FileText size={16} />
              <span>{isAr ? "الوثائق القانونية" : "Legal Documents"}</span>
              <ExternalLink size={14} className="opacity-80" />
            </a>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div className="space-y-8">
            <div className="p-6 md:p-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] backdrop-blur-sm shadow-sm transition-theme hover:border-[var(--border-accent)] group">
              <div className="flex items-center gap-3 text-[var(--text-primary)] mb-4">
                <Scale className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-theme" />
                <h2 className="text-xl md:text-2xl font-black">{isAr ? "المبادئ التأسيسية للخصوصية" : "Foundational Privacy Principles"}</h2>
              </div>
              <p className="text-sm md:text-base leading-relaxed text-[var(--text-secondary)] font-medium font-sans">
                {isAr 
                  ? "تدرك منصة بيربليكستا (ViralLinkUp Limited) أن الخصوصية الحقيقية تعني الاستحالة التقنية للوصول إلى بياناتك. بنيت المنصة على أسس عمارة قواعد البيانات المزدوجة والتشفير العسكري لضمان تحكمك الكامل في مساحتك الرقمية."
                  : "PERPLEXTA (ViralLinkUp Limited) understands that true privacy means the technical impossibility of data access. Built on dual-database architecture and military-grade encryption ensuring your total digital control."}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--fg-accent)] font-mono mt-4">
                {isAr ? "تاريخ السريان المحدث: سبتمبر 2026" : "Updated Effective Date: September 2026"}
              </p>
            </div>
          </div>

          <div className="relative aspect-square rounded-[var(--radius-lg)] overflow-hidden bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center p-8 shadow-inner">
            <div className="relative z-10 flex flex-col items-center gap-8 w-full">
              <div className="flex items-center justify-center p-6 rounded-[var(--radius-xs)] bg-[var(--surface-card)] border border-[var(--border-default)] shadow-lg hover:shadow-none transition-theme group">
                <Lock className="w-24 h-24 text-[var(--text-muted)] group-hover:text-[var(--fg-accent)] transition-theme" />
              </div>

              <div className="grid grid-cols-3 gap-3 w-full">
                {[
                  { icon: Shield, label: isAr ? "تشفير AES-256" : "AES-256 Crypto" },
                  { icon: Eye, label: isAr ? "معرفة صفرية" : "Zero-Knowledge" },
                  { icon: Database, label: isAr ? "عزل مالي" : "Ledger Isolated" }
                ].map((item, idx) => (
                  <div 
                    key={`privacy-pillar-${idx}-${item.label}`}
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
              {isAr ? "البنود التفصيلية لحماية البيانات" : "Detailed Data Protection Clauses"}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl mx-auto font-medium leading-relaxed">
              {isAr ? "نصوص رسمية معتمدة تحدد الالتزامات التقنية والقانونية لحماية مساحتك عبر كافة أقسام بيربليكستا." : "Official certified clauses defining technical and legal commitments to protect your space across all PERPLEXTA sections."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((section, i) => (
              <div 
                key={`privacy-sec-${i}-${section.title}`} 
                className="p-6 md:p-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-accent)] transition-theme group shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-2">
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
                      <div key={`privacy-sub-${i}-${sIdx}-${sub.label}`} className="space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--fg-accent)]">{sub.label}</h4>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">{sub.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Corporate Legal Footer Section */}
        <section className="p-6 md:p-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] space-y-6">
          <div className="flex items-center gap-3 text-[var(--text-primary)]">
            <Building2 className="w-5 h-5 text-[var(--fg-accent)]" />
            <h2 className="text-xl md:text-2xl font-black">{isAr ? "الكيان القانوني والمسؤولية الرسمية" : "Legal Entity & Official Responsibility"}</h2>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm md:text-base font-bold text-[var(--text-primary)]">
              {isAr 
                ? "جميع الخدمات والسياسات والأطر التقنية في منصة بيربليكستا تدار وتخضع قانونياً لشركة:"
                : "All services, policies, and technical frameworks on the PERPLEXTA platform are legally operated and governed by:"}
            </p>
            <div className="p-4 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="font-black text-base text-[var(--text-primary)]">ViralLinkUp Limited (PERPLEXTA LTD)</h4>
                <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">Reg. No: 16804604 | 128 City Road, London, EC1V 2NX</p>
              </div>
              <a
                href="/docs/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <span>{isAr ? "الوثائق القانونية" : "Legal Documents"}</span>
                <ExternalLink size={13} className="opacity-80" />
              </a>
            </div>
          </div>
        </section>

        <footer className="pt-10 border-t border-[var(--border-subtle)] space-y-10">
          <div className="text-center">
            <p className="text-lg md:text-xl font-black text-[var(--text-primary)] tracking-widest uppercase font-mono">
              {isAr ? "بيربليكستا - نبتكر لنحمي بياناتك السيادية" : "PERPLEXTA - INNOVATING TO PROTECT YOUR SOVEREIGN DATA"}
            </p>
          </div>
        </footer>
      </div>
    </ContentContainer>
  );
};

export default Privacy;
