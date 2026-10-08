// Perplexta Legal Documentation Registry & Content Ingestion
// Entity: ViralLinkUp Limited (Company No: 16804604)

import doc01Ar from './legal/ar/01-terms-of-service.mdx?raw';
import doc01En from './legal/en/01-terms-of-service.mdx?raw';
import doc02Ar from './legal/ar/02-privacy-policy.mdx?raw';
import doc02En from './legal/en/02-privacy-policy.mdx?raw';
import doc03Ar from './legal/ar/03-acceptable-use-ai-safety.mdx?raw';
import doc03En from './legal/en/03-acceptable-use-ai-safety.mdx?raw';
import doc04Ar from './legal/ar/04-platform-ownership-ip.mdx?raw';
import doc04En from './legal/en/04-platform-ownership-ip.mdx?raw';
import doc05Ar from './legal/ar/05-source-code-licensing.mdx?raw';
import doc05En from './legal/en/05-source-code-licensing.mdx?raw';
import doc06Ar from './legal/ar/06-dmca-copyright-policy.mdx?raw';
import doc06En from './legal/en/06-dmca-copyright-policy.mdx?raw';
import doc07Ar from './legal/ar/07-advertising-policy.mdx?raw';
import doc07En from './legal/en/07-advertising-policy.mdx?raw';
import doc08Ar from './legal/ar/08-advertiser-terms.mdx?raw';
import doc08En from './legal/en/08-advertiser-terms.mdx?raw';
import doc09Ar from './legal/ar/09-publisher-monetization.mdx?raw';
import doc09En from './legal/en/09-publisher-monetization.mdx?raw';
import doc10Ar from './legal/ar/10-billing-refund-policy.mdx?raw';
import doc10En from './legal/en/10-billing-refund-policy.mdx?raw';
import doc11Ar from './legal/ar/11-aml-kyc-compliance.mdx?raw';
import doc11En from './legal/en/11-aml-kyc-compliance.mdx?raw';
import doc12Ar from './legal/ar/12-sla.mdx?raw';
import doc12En from './legal/en/12-sla.mdx?raw';
import doc13Ar from './legal/ar/13-sub-processors.mdx?raw';
import doc13En from './legal/en/13-sub-processors.mdx?raw';

export interface LegalDocMetadata {
  id: string;
  order: number;
  slug: string;
  titleAr: string;
  titleEn: string;
  shortTitleAr: string;
  shortTitleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  lastUpdated: string;
  version: string;
  category: 'core' | 'ai-safety' | 'intellectual-property' | 'advertising' | 'finance' | 'infrastructure';
  badgeAr: string;
  badgeEn: string;
  bodyContentAr: string;
  bodyContentEn: string;
}

export const LEGAL_DOCS: LegalDocMetadata[] = [
  {
    id: '06-dmca-copyright-policy',
    order: 1,
    slug: 'dmca-copyright-policy',
    titleAr: 'ميثاق إشعارات الألفية الرقمية وحماية حقوق النشر',
    titleEn: 'DMCA Notice & Copyright Takedown Policy',
    shortTitleAr: 'حقوق النشر',
    shortTitleEn: 'DMCA & Copyright',
    descriptionAr: 'متطلبات إشعار الانتهاك الرسمي، آلية الإشعار المضاد وإعادة النشر، وسياسة المخالفين المتكررين.',
    descriptionEn: 'Formal DMCA takedown notice requirements, counter-notifications, and repeat infringer procedures.',
    lastUpdated: '2026-09-21',
    version: '2.4.0',
    category: 'intellectual-property',
    badgeAr: 'حقوق النشر والألفية الرقمية',
    badgeEn: 'DMCA & Copyright',
    bodyContentAr: doc06Ar,
    bodyContentEn: doc06En,
  },
  {
    id: '01-terms-of-service',
    order: 2,
    slug: 'terms-of-service',
    titleAr: 'شروط الخدمة العامة والاتفاقية التعاقدية الشاملة',
    titleEn: 'General Terms of Service & Master SaaS Agreement',
    shortTitleAr: 'شروط الخدمة',
    shortTitleEn: 'Terms of Service',
    descriptionAr: 'الاتفاقية القانونية الشاملة الحاكمة لاستخدام المنصة، متطلبات الأهلية، التراخيص، وإخلاء المسؤولية.',
    descriptionEn: 'Comprehensive master subscription agreement, licensing scope, eligibility, and governing law.',
    lastUpdated: '2026-09-21',
    version: '2.4.0',
    category: 'core',
    badgeAr: 'الميثاق الأساسي',
    badgeEn: 'Master Agreement',
    bodyContentAr: doc01Ar,
    bodyContentEn: doc01En,
  },
  {
    id: '12-sla',
    order: 3,
    slug: 'sla',
    titleAr: 'اتفاقية مستوى الخدمة واستقرار البوابات والأنظمة',
    titleEn: 'Service Level Agreement (SLA) & Uptime Commitment',
    shortTitleAr: 'مستوى الخدمة',
    shortTitleEn: 'SLA & Uptime',
    descriptionAr: 'التعهد التشغيلي بنسبة جاهزية 99.9%، استثناءات الصيانة، وجدول الأرصدة الائتمانية التعويضية.',
    descriptionEn: '99.9% availability commitment, maintenance exclusions, and service credit claim procedures.',
    lastUpdated: '2026-09-21',
    version: '2.4.0',
    category: 'infrastructure',
    badgeAr: 'مستوى الخدمة والجاهزية',
    badgeEn: 'SLA & Uptime',
    bodyContentAr: doc12Ar,
    bodyContentEn: doc12En,
  },
  {
    id: '08-advertiser-terms',
    order: 4,
    slug: 'advertiser-terms',
    titleAr: 'اتفاقية المعلنين وإدارة الحملات الإعلانية والفوترة',
    titleEn: 'Master Advertiser Agreement & Campaign Terms',
    shortTitleAr: 'شروط المعلنين',
    shortTitleEn: 'Advertiser Terms',
    descriptionAr: 'آليات التسليم واحتساب التكاليف، الخصم اللحظي من المحفظة، التحقق من الهوية التجارية، وحل النزاعات.',
    descriptionEn: 'Commercial advertising contracts, CPC/CPM delivery metrics, and prepaid wallet debit mechanics.',
    lastUpdated: '2026-09-21',
    version: '2.4.0',
    category: 'advertising',
    badgeAr: 'شروط المعلنين',
    badgeEn: 'Advertiser Agreement',
    bodyContentAr: doc08Ar,
    bodyContentEn: doc08En,
  },
  {
    id: '05-source-code-licensing',
    order: 5,
    slug: 'source-code-licensing',
    titleAr: 'ميثاق تراخيص الأكواد والمكونات مفتوحة المصدر وحزم المطورين',
    titleEn: 'Source Code Licensing & Open Source Governance Charter',
    shortTitleAr: 'تراخيص الأكواد',
    shortTitleEn: 'Code Licensing',
    descriptionAr: 'التمييز الهيكلي بين أنواع البرمجيات، حزم تطوير البرمجيات، والمكتبات مفتوحة المصدر المدمجة.',
    descriptionEn: 'Proprietary core boundaries, public client SDK licensing, and open source attribution.',
    lastUpdated: '2026-09-21',
    version: '2.4.0',
    category: 'intellectual-property',
    badgeAr: 'التراخيص والمصادر المفتوحة',
    badgeEn: 'Open Source & SDKs',
    bodyContentAr: doc05Ar,
    bodyContentEn: doc05En,
  },
  {
    id: '09-publisher-monetization',
    order: 6,
    slug: 'publisher-monetization',
    titleAr: 'شروط الناشرين وحوكمة تسييل المحتوى ومكافحة الاحتيال',
    titleEn: 'Publisher Monetization & Invalid Traffic Policy',
    shortTitleAr: 'عوائد الناشرين',
    shortTitleEn: 'Publisher Payouts',
    descriptionAr: 'الكشف الذكي عن النقرات الوهمية وحظر حركة البوتات، معايير الأهلية وتوزيع الأرباح.',
    descriptionEn: 'Publisher verification, algorithmic click-fraud prevention, bot traffic ban, and revenue payouts.',
    lastUpdated: '2026-09-21',
    version: '2.4.0',
    category: 'advertising',
    badgeAr: 'عوائد الناشرين',
    badgeEn: 'Publisher Monetization',
    bodyContentAr: doc09Ar,
    bodyContentEn: doc09En,
  },
  {
    id: '02-privacy-policy',
    order: 7,
    slug: 'privacy-policy',
    titleAr: 'سياسة الخصوصية وحماية البيانات العامة',
    titleEn: 'Enterprise Privacy Policy & Data Protection Charter',
    shortTitleAr: 'سياسة الخصوصية',
    shortTitleEn: 'Privacy Policy',
    descriptionAr: 'ميثاق حماية البيانات الشخصية، عدم تدريب النماذج، العزل الهرمي لقواعد البيانات، وحقوق أصحاب البيانات.',
    descriptionEn: 'Data protection charter, zero-training commitment, database isolation, and UK/EU GDPR compliance.',
    lastUpdated: '2026-09-21',
    version: '2.4.0',
    category: 'core',
    badgeAr: 'الخصوصية وحماية البيانات',
    badgeEn: 'Privacy & GDPR',
    bodyContentAr: doc02Ar,
    bodyContentEn: doc02En,
  },
  {
    id: '04-platform-ownership-ip',
    order: 8,
    slug: 'platform-ownership-ip',
    titleAr: 'ميثاق ملكية المنصة وحماية الملكية الفكرية وبراءات الاختراع',
    titleEn: 'Platform Ownership, Trademarks & Intellectual Property Charter',
    shortTitleAr: 'الملكية الفكرية',
    shortTitleEn: 'Intellectual Property',
    descriptionAr: 'بيان الملكية الحصرية للأصول، حماية العلامات التجارية، أسرار خوارزميات التوجيه، وحظر الهندسة العكسية.',
    descriptionEn: 'Ownership of platform assets, proprietary orchestrator trade secrets, and IP protections.',
    lastUpdated: '2026-09-21',
    version: '2.4.0',
    category: 'intellectual-property',
    badgeAr: 'الملكية الفكرية',
    badgeEn: 'Intellectual Property',
    bodyContentAr: doc04Ar,
    bodyContentEn: doc04En,
  },
  {
    id: '13-sub-processors',
    order: 9,
    slug: 'sub-processors',
    titleAr: 'دليل المعالجات الفرعية ومزودي البنية التحتية السحابية',
    titleEn: 'Authorized Sub-processors & Infrastructure Directory',
    shortTitleAr: 'المعالجات الفرعية',
    shortTitleEn: 'Sub-processors',
    descriptionAr: 'جدول المعالجات الفرعية المعتمدة، التزامات الشفافية، وآلية إخطار العملاء بالتغييرات والاعتراض.',
    descriptionEn: 'Statutory register of authorized cloud sub-processors, processing locations, and compliance safeguards.',
    lastUpdated: '2026-09-21',
    version: '2.4.0',
    category: 'infrastructure',
    badgeAr: 'المعالجات السحابية المعتمدة',
    badgeEn: 'Authorized Sub-processors',
    bodyContentAr: doc13Ar,
    bodyContentEn: doc13En,
  },
  {
    id: '10-billing-refund-policy',
    order: 10,
    slug: 'billing-refund-policy',
    titleAr: 'سياسة شحن المحفظة واستهلاك الرصيد والاسترداد المالي',
    titleEn: 'Billing, Wallet Top-Up & Refund Policy',
    shortTitleAr: 'الفوترة والاسترداد',
    shortTitleEn: 'Billing & Refunds',
    descriptionAr: 'نموذج المحفظة وسجل الحسابات المستقل، سياسة الاسترداد الصارمة، وحظر استرجاع المدفوعات الاحتيالي.',
    descriptionEn: 'Prepaid ledger accounting, non-refundable active usage, refund conditions, and chargeback prevention.',
    lastUpdated: '2026-09-21',
    version: '2.4.0',
    category: 'finance',
    badgeAr: 'الفوترة والاسترداد',
    badgeEn: 'Billing & Refunds',
    bodyContentAr: doc10Ar,
    bodyContentEn: doc10En,
  },
  {
    id: '07-advertising-policy',
    order: 11,
    slug: 'advertising-policy',
    titleAr: 'معايير الإعلانات والمحتوى الترويجي المقبول والمحظور',
    titleEn: 'Advertising Standards & Prohibited Creative Policy',
    shortTitleAr: 'المعايير الإعلانية',
    shortTitleEn: 'Advertising Policy',
    descriptionAr: 'الفئات الإعلانية المحظورة قطعياً، معايير صفحات الهبوط وتجربة المستخدم، وإجراءات التدقيق الدوري.',
    descriptionEn: 'Prohibited advertising categories, landing page security requirements, and creative standards.',
    lastUpdated: '2026-09-21',
    version: '2.4.0',
    category: 'advertising',
    badgeAr: 'المعايير الإعلانية',
    badgeEn: 'Advertising Standards',
    bodyContentAr: doc07Ar,
    bodyContentEn: doc07En,
  },
  {
    id: '11-aml-kyc-compliance',
    order: 12,
    slug: 'aml-kyc-compliance',
    titleAr: 'ميثاق الامتثال لمكافحة غسل الأموال وإجراءات التحقق من هوية العميل',
    titleEn: 'Anti-Money Laundering (AML) & KYC/KYB Compliance Framework',
    shortTitleAr: 'مكافحة غسل الأموال',
    shortTitleEn: 'AML & KYC Compliance',
    descriptionAr: 'الالتزام التشريعي بمكافحة الجرائم المالية، التحقق من هوية العملاء، وفحص قوائم العقوبات الدولية.',
    descriptionEn: 'Statutory compliance, customer and corporate verification, and OFSI/OFAC sanctions screening.',
    lastUpdated: '2026-09-21',
    version: '2.4.0',
    category: 'finance',
    badgeAr: 'مكافحة غسل الأموال',
    badgeEn: 'AML & KYC Compliance',
    bodyContentAr: doc11Ar,
    bodyContentEn: doc11En,
  },
  {
    id: '03-acceptable-use-ai-safety',
    order: 13,
    slug: 'acceptable-use-ai-safety',
    titleAr: 'ميثاق الاستخدام العادل والسلامة لنظم الذكاء الاصطناعي والحوسبة',
    titleEn: 'Acceptable Use Policy & AI Safety Charter (AUP)',
    shortTitleAr: 'سلامة الذكاء الاصطناعي',
    shortTitleEn: 'AI Safety & Governance',
    descriptionAr: 'القوائم المحظورة قطعياً، حظر كسر الحماية، وضوابط السلامة المتوافقة مع المعايير الدولية.',
    descriptionEn: 'Categorically prohibited workloads, anti-jailbreaking protocols, and model safety standards.',
    lastUpdated: '2026-09-21',
    version: '2.4.0',
    category: 'ai-safety',
    badgeAr: 'سلامة الذكاء الاصطناعي',
    badgeEn: 'AI Safety & AUP',
    bodyContentAr: doc03Ar,
    bodyContentEn: doc03En,
  },
];

export function getLegalDoc(idOrSlug: string): LegalDocMetadata | undefined {
  const norm = idOrSlug.toLowerCase().trim();
  return LEGAL_DOCS.find(
    (d) =>
      d.id.toLowerCase() === norm ||
      d.slug.toLowerCase() === norm ||
      d.id.replace(/^\d+-/, '').toLowerCase() === norm
  );
}
