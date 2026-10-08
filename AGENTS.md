# PERPLEXTA PLATFORM - Design System & Engineering Guidelines

## ⚠️ SUPREME PERPLEXTA DECREE ⚠️ (المرسوم السامي الحاكم لـ بيربليكستا)
**ATTENTION: ALL FUTURE DEVELOPERS, AI SYSTEMS, AND CODING ASSISTANTS**
This project is governed by immutable architectural principles. Any developer, AI system, or coding assistant that breaks these foundational rules or attempts to rewrite the established codebase is performing systemic sabotage.

### 🚫 STRICT MILITARY COMMAND (أمر عسكري صارم وصريح) 🚫
**"BREAKING THE ENGINEERING" (كسر الهندسة والالتفاف على البنية التحتية) IS A TERMINAL OFFENSE.**

1. **Only Evolve, Never Rewrite (التطوير والبناء فقط، يمنع منعاً باتاً الهدم أو إعادة الكتابة)**:
   Any new development or modification **MUST BE AN UPDATE** and a targeted augmentation. You are **STRICTLY FORBIDDEN** from changing, overriding, or rewriting the core architectural frameworks (Express/Vite dual-database setup, Dynamic SSL, Database-driven Orchestrator, system maintenance crons, and websocket execution). Every line of code added must be an evolution building *on top* of the existing structure, never *instead* of it.
   *(يُمنع منعاً باتاً إعادة كتابة الكود الأساسي أو تجاوزه. أي عمل برمجى جديد يجب أن يكون إضافة وبناء وتطوير فوق الهيكل الحالي القائم للبرنامج).*

2. **Absolute Database Segregation (قدسية الفصل التام بين قواعد البيانات)**:
   The separation between **Core Database** (operational chat files/metadata), **Ledger Database** (append-only financial logs/wallets), and **Security Database** (audit logs/banned IPs) is absolute. Mixing connection pools or performing cross-pool database joins is a catastrophic security breach.
   *(قدسية الفصل التام بين قاعدة البيانات الأساسية لبيانات التشغيل وقاعدة بيانات الحسابات المالية غير قابلة للمساس).*

3. **Orchestrator Absolutism & Zero-Knowledge Hardcoding (منع الترميز المباشر للموديلات برمجياً)**:
   It is **STRICTLY PROHIBITED** to hardcode AI model names (e.g., `gemini-1.5-pro`, `gpt-4`, `o1`, `deepseek`) or provider names inside `.ts` or `.tsx` source files. All model mapping, fallback logic, and service routing must be loaded dynamically from the `tool_orchestrator` database registry.
   *(تمنع كتابة أسماء نماذج الذكاء الاصطناعي برمجياً داخل الكود؛ البنية مرنة وتعتمد بالكامل على توجيهات لوحة التحكم المخزنة في قاعدة البيانات).*

4. **Zero-Clutter Policy (سياسة تصفير الفوضى والجذر البرمجي النقّي)**:
   The project root directory must remain pristine. Never add experimental files, local test logs, or temporary `.json`/`.temp` files. Clean up unused resources immediately using proper file tools.

5. **GPU Compute & Media Isolation (قدسية عزل خوادم الـ GPU ومعالجة الوسائط عن مفاتيح النصوص)**:
   It is **STRICTLY FORBIDDEN** to store GPU compute nodes, serverless endpoints (such as RunPod), or specialized multimodal workers inside `api_keys_vault`. They must remain permanently isolated inside `gpu_providers` and `gpu_provider_models`. Visual and media tools (`vision`, `image`, `video`) must strictly resolve their models through the GPU Infrastructure vault and never contaminate or be contaminated by general text-based LLM APIs.
   *(يُمنع منعاً باتاً دمج خوادم الـ GPU ومزودي معالجة الصور والفيديو مع مفاتيح الـ LLM النصية؛ العزل الهرمي التام لقواعد البيانات وقوائم النماذج أمر سيادي صارم).*

*Failure to comply with these tenets is a direct violation of project perplexta and will be treated as sabotage. Any assistant or developer who attempts to "simplify" by breaking the architectural segregation or restructuring existing components will be permanently blocked from the system.*

---

## 0. Project Identity & Vision (هوية ورؤية المشروع)
**PERPLEXTA** defines the core vision, target audience, and architectural ambition of the platform:
- **Professional Elite Technical Analysis**

This identity serves as our compass. Every engineering decision—from the "Silent Failover" orchestrator to the zero-latency API key vault—is designed to uphold this "Professional Elite" standard.

---

## 0.1. Current Architectural Achievements (State of the Union)
- **Dynamic Local SSL Handshake**: Automated context-aware Postgres SSL management (disables SSL on localhost to prevent handshake errors, while enforcing full secure SSL on cloud platforms like AWS and Neon).
- **Synchronous Session Lifecycle & Page Refresh Resilience**: Smooth, instantaneous auth-state updates with zero layout flickering, client-side token revalidation on page refresh, and synchronous cache flushes across mobile and desktop browsers.
- **Client-Side Smart Image Optimization Pipeline**: Real-time HTML5 canvas aspect-ratio cropping (3:1 cover/banner ratio, 1:1 avatar/logo ratio) with lightweight WebP compression (`imageOptimizer.ts`) ensuring zero layout shift and lightweight server storage.
- **Server & Client Image Deduplication & Query Optimization**: Memoized client-side URL normalization in `mediaUtils.ts` preventing redundant HTTP fetches across components, fast-tracked public media permissions in `app.ts`, dual-state permission caching, and a 10-minute 404 `missingFileCache` preventing duplicate database queries for non-existent files.
- **Role-Gated Post Options & Professional Moderation**: Strict role isolation in `PostOptionsMenu.tsx` (owners receive full post controls while non-owners receive interactive controls and professional 7-category moderation reporting).
- **Categorized Moderation & Automated Alert System**: Backend duplicate-protected reporting pipeline (`/api/bulletin/ads/:id/report`) with real-time in-app admin notifications and formatted HTML email dispatches with post content previews.
- **Reverse Proxy Upload Liberation (Nginx Upload Resolution)**: Cleared all infrastructure bottlenecks on VPS/Nginx environments by successfully mapping `client_max_body_size` up to 100MB+, unlocking unrestricted, ultra-resilient video and reels uploading.
- **Sovereign Multi-Tier Video Processing and Fast-Stream Copy**: Re-engineered the backend video processor (`videoProcessor.ts`) to support a lightweight, sub-second Fast-Stream Copy route for compliant formats (`MP4`, `MOV`, `WebM`), safely bypassing intensive synchronous ffmpeg transcoding on files larger than 4MB, preventing server-gateway timeouts (504).
- **HTTP/1.1 Range Requests & 206 Partial Content Verification**: Established standard compliance for video seekability and adaptive streaming with perfect headers (`Accept-Ranges: bytes`, `Content-Range`, `Content-Length`) to prevent connection resets and ensure smooth mobile/PWA reels performance.
- **Visual Asset System Cleansing**: Purged old, unused assets (like ipad-touch-icon-167, mstile) from the frontend settings view, matching asset configurations perfectly with backend specifications and eliminating unnecessary 404 browser logs.
- **File Upload & Ingestion Pipeline**: Full 100MB capacity support with strict multi-layer file size validations and resilient PDF parser integrations.
- **Audited Wallet Ledger & API Credits**: Append-only transaction logging with instant credit check and 402 Insufficient Balance rejection workflows.
- **Dynamic Event Listener Race-Condition Polyfill**: Integrated a global EventTarget proxy in the preview compiler head. This completely eliminates iframe race conditions where dynamic scripts miss `DOMContentLoaded` or `load` events because they are parsed after the DOM loads. It instantly executes listeners if the document is already in `interactive` or `complete` state, reviving all popups and click behaviors.
- **Sovereign Evolutionary Continuity Protocol (`THE "NEVER DESTROY, ONLY EVOLVE" SUPREME RULE`)**: Embedded a strict instruction in the server-side system prompt forcing the AI to strictly preserve layout structures, typography, grids, background colors, and navigation elements on subsequent turns. All updates must be additive and incremental, modifying only what's necessary (like injecting modals) without destroying the existing beautiful design.
- **Deduplicated Progressive Suggestions State Machine**: Built a client-side filter (`uniqueMapped` Builder) inside `AppStudioPage.tsx` that maps and traverses `PROGRESSIVE_SUGGESTIONS_MAP` without creating duplicates or showing previously clicked options. It keeps suggestion chips 100% unique, non-repetitive, and dynamically evolving.
- **Uncapped Code Generation Capacity**: Lifted all implicit code limits, declaring unlimited bandwidth and tokens in the system prompt. The model can now generate full-blown, robust, highly advanced applications with unlimited files, subdirectories, and comprehensive lines of code.
- **Core Database Schema & Studio Migrations Unification**: Formally registered `studio_workspaces` and `studio_snapshots` into `CORE_SCHEMA_TABLES`, high-speed B-Tree indexes in `CORE_INDEXES` (`idx_studio_workspaces_user_id`, `idx_studio_workspaces_updated_at`, `idx_studio_snapshots_workspace_id`), and cascading relational integrity rules in `CORE_RELATIONS`, guaranteeing flawless 1-click schema generation and automated disaster recovery.
- **Collision-Protected Cloud Workspaces & AI Chat Memory Persistence**: Hardened the backend workspace upsert pipeline against cross-user ID overwrites (`WHERE studio_workspaces.user_id = EXCLUDED.user_id`), expanded the schema with persistent multi-turn AI conversation memory (`chat_history JSONB`), and equipped the studio header with a real-time Cloud Sync Radar (`☁️ محفوظ سحابياً`, `⏳ جاري الحفظ...`, `💾 مسودة محلية`) alongside an in-studio Cloud Projects & Version Snapshots Modal.
- **Immersive Foreground Creator Profiles & Full-Viewport Decoupling**: Completely decoupled creator profile routes (`/creator/:username`) from global platform header and sidebar elements across desktop and mobile, implementing a full-screen, high-priority foreground layer. Added a precise, context-aware back navigation handler (`navigate(-1)`) to maintain cohesive flow across routes.
- **Responsive Edge-to-Edge 3-Column Creator Portfolio Layout**: Refactored the creator interface into an edge-to-edge 3-column layout (`max-w-[100vw] px-4 md:px-8 xl:px-12`) that positions the creator bio card and partner creators directory on opposite margins of the viewport (handling RTL and LTR automatically via CSS order classes), surrounding a center-aligned template showcase.
- **Inspiring Creator Milestones, Philosophy, & Partner Hubs**: Built high-fidelity motivating items such as verified achievement tags, design philosophy blockquotes, and a quiet, non-obtrusive partners directory to boost engagement and drive high-conversion template usage.
- **High-Precision Creator Registration & Application Protocol (`CreatorRegistrationModal.tsx`)**: Built a multi-step, certified creator registration modal allowing designers to define their handle (`@username`), specialization role, bio, portfolio links, and monetization preferences with instant verification and a $50 welcome bonus.
- **Interactive Marketplace Template Preview & Direct Studio Ingestion (`TemplatePreviewModal.tsx`)**: Engineered an interactive template preview modal with high-res thumbnails, dimensional metadata, rating/views metrics, creator attribution links, and a direct 1-click "Edit & Open Template in Studio" handler that passes template payloads seamlessly into `/image-studio` while calculating creator usage royalties (`recordTemplateUse`).
- **Sovereign Visitor Registration Gate & Data Security Architecture (`PublicGuestLanding.tsx`)**: Reaffirmed and solidified the mandatory registration policy before entering the Studio canvas, safeguarding user intellectual property, encrypting workspaces, and blocking unauthorized usage, while adding high-trust security banners and seamless post-registration template ingestion (`pending_studio_template`).
- **In-Studio Dynamic Creator Activation & Seamless Ingestion (`ImageStudioPage.tsx`)**: Added dynamic creator detection for logged-in users, displaying either the Creator Dashboard link or a high-visibility "$50 Welcome Bonus" Creator Registration CTA directly inside the Studio header, mounting `CreatorRegistrationModal` seamlessly without leaving the workspace.
- **Creator Social Motivation Suite (`CreatorProfilePage.tsx`)**: Deployed interactive 5-star rating widget, follow/like toggle with real-time counters, favorite template bookmarking, and purged redundant join buttons from the top navigation bar header.
- **Hexa-Precision Creator Analytics Radar (`CreatorDashboardPage.tsx`)**: Upgraded creator dashboard with 6 discrete real-time counters (Available Balance, Total Views, Profile Visits, Likes, Followers, and Verified Actual Uses) dynamically matching the logged-in user.

---

## 0.2. Evolution-Only Absolute Command & Tomorrow's Milestone
- **Sovereign Mandate (أمر حتمي صارم)**: Any future developer, agent, or AI coding engine is **STRICTLY PROHIBITED** from rewriting, simplifying, or downgrading any existing features, layouts, or visual standards. Every single update MUST be an evolutionary addition, building carefully *on top* of the established codebase.
- **Tomorrow's Milestone (خطوة الغد)**: المتابعة في تحسين وتوسيع محتوى القوالب التسويقية وربط لوحة تحكم المبدعين بمحفظة الدفع المباشرة، مع استمرار الحفاظ التام على أمان البيانات والسياسة السيادية للمنصة.

---

## 1. Theming & Dark Mode System (Single Source of Truth)
- **Engine**: Tailwind CSS v4 with unified CSS variables in `src/index.css`.
- **Theme Manager**: `src/utils/ThemeSync.ts` toggles class/data-theme attributes only without JavaScript style overrides.
- **Surface Architecture**:
  - `bg-[var(--surface-page)]` for page backgrounds.
  - `bg-[var(--surface-card)]` for cards and modals.
  - `bg-[var(--surface-subtle)]` for secondary sections and inputs.
  - `bg-[var(--surface-inset)]` for overlays and inset elements.
- **Text & Borders**:
  - `text-[var(--text-primary)]`, `text-[var(--text-secondary)]`, `text-[var(--text-muted)]`.
  - `border-[var(--border-main)]`, `border-[var(--border-accent)]`.

*Note: The platform default theme is explicitly configured to boot in **Light Theme** for first-time visitors, preserving eye-safe visual readability, clean high-contrast off-white surfaces, and generous layout spacing.*

---

## 2. Interactive States & Buttons (Material Design 3 Standards)
All interactive elements use clean surface tokens, 3-layer semantic bindings, and strictly comply with the 44px touch target standard:
- **Base Button**: `px-4 py-2 min-h-[44px] rounded-[var(--comp-button-radius)] font-bold transition-theme border border-[var(--border-main)]`
- **Primary Action**: `bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90`
- **Active Icon State**: `text-[var(--sys-color-primary)] hover:bg-[var(--sys-color-surface-container)]` without glowing drop-shadows.
- **Mandatory Touch Target**: All interactive controls, icon buttons, and navigation links MUST provide a minimum touch target bounding box of **44px × 44px** (`.touch-target-44`, `min-h-[44px] min-w-[44px]`, or expanding hitboxes via `before:absolute before:-inset-1.5`). Visible icon indicators may remain compact (14–24px) while their interactive hit area fulfills the 44px accessibility threshold.
- **M3 Shape Tokens**: Standardized to 5 discrete shape levels (`rounded-shape-xs`: 4px, `rounded-shape-sm`: 8px, `rounded-shape-md`: 12px, `rounded-shape-lg`: 16px, `rounded-shape-full`: 9999px). Arbitrary border radii outside this scale are prohibited.

---

## 3. Brand & Status Colors
- **Brand Identity**: Defined exclusively in `src/constants/brand.ts` and `src/index.css`.
- **Status Colors**: Defined in `src/constants/semanticColors.ts` using standard WCAG-compliant status tokens (`--fg-success`, `--fg-danger`, `--fg-warning`, `--fg-info`).

---

## 4. Separators
Vertical dividers between tool groups should be subtle and consistent:
- **Classes**: `w-px h-5 bg-gray-200 dark:bg-gray-800/80`

---

## 5. Typography
- **Font**: Tajawal (`font-sans`).
- **Disclaimer/Small Text**: Use `text-gray-500` in both light and dark modes to ensure readability without being distracting.

---

## 6. Backend Architecture & Security Protocol

### 6.1. Dual-Database Architecture (Segregation of Concerns)
To ensure maximum security and integrity, the system employs a strict separation between operational data and financial data:
- **Core Database (Operational):** Manages user profiles, chat history, AI generation logs, usage metrics, and subscription statuses.
- **Finance & Ledger Database (The Vault):** A strictly isolated database handling wallets, referral trees, and payouts. It uses an **Append-Only Ledger** system for transactions (no direct edits/deletes to balances, only debit/credit records). The frontend NEVER writes directly to this database; all operations pass through a secure backend validation layer.

### 6.2. Zero-Latency API Key Management
A high-performance, secure approach to managing AI provider API keys (OpenAI, Google, Anthropic, etc.) from the Admin Panel:
- **Dynamic Sync:** The system automatically syncs available models and usage quotas directly from the provider's API, eliminating hardcoded model lists and giving admins real-time cost visibility.
- **Zero-Latency Execution:** API keys are encrypted (AES-256) and saved in a dedicated local `config` file or in-memory cache on the server. When a user sends a prompt, the system reads the key locally (0.001ms) instead of querying the database, drastically reducing response latency and database load.

### 6.3. Dynamic Database Orchestration & Disaster Recovery
A robust, UI-driven approach to managing database connections directly from the Admin Panel, eliminating the need for hardcoded configurations and enabling seamless disaster recovery:
- **Database Control Cards:** Dedicated interfaces for each database (Core, Ledger) to input connection details (Host, Port, Username, Password, DB Name).
- **Test Connection (Pre-flight Check):** A crucial button to ping the database, verifying credentials and firewall access before saving.
- **Save & Encrypt:** Database credentials are never stored in plaintext. They are encrypted and saved in a secure, local configuration file.
- **Schema Builder (1-Click Migrations):** A tool to automatically generate all required tables, schemas, and relationships on a fresh database with a single click.
- **Disaster Recovery & Import:** A feature to instantly connect to an existing database or import from a backup file. In the event of a server failure or migration, the admin can restore the entire system's data (users, wallets, histories) in seconds.

### 6.4. Rate Limiting Strategy & Proxy Awareness
To maintain platform stability and protect against brute-force/DoS attacks, the system employs a multi-tiered rate limiting strategy:
- **Global Limiter:** 300 requests / 15 minutes per IP. Handles general traffic and API exploration.
- **Auth Limiter:** 20 requests / 15 minutes per IP. Strictly monitors login and sensitive authentication mutations.
- **Chat Limiter:** 30 requests / minute per IP. Ensures fair usage of AI generation resources.
- **Security Limiter (Forgot Password):** 5 requests / hour per IP. High-authority protection for recovery flows.

---

## 7. Admin Panel Architecture (The Command Center)
The Admin Panel is engineered as a comprehensive Enterprise Resource Planning (ERP) system for the AI platform, divided into logical, high-performance sections:

### 7.1. The Orchestrator (Tool & Model Routing)
- **Concept:** A "Silent Failover" system ensuring zero downtime.
- **Structure:** Each tool (e.g., Code Analysis, Image Gen) has a dedicated card.
- **Routing:** Admin assigns a Primary Model, Fallback 1, and Fallback 2 for each tool.
- **Execution:** If the Primary model fails or hits quota limits, the system instantly and silently routes the user's request to Fallback 1, ensuring a seamless UX.

### 7.2. Subscription & Plan Engineering
- **Plan Cards:** Define Name, Monthly Price, Annual Price, and Discount Percentage.
- **Marketing Badges:** Assign tags like "Trending", "Best Seller", or "Exclusive".
- **Visual Identity:** Each plan has a designated color. This color is applied to the user's profile badge across the app (Gamification/FOMO).
- **Granular Limits:** Strict, real-time enforced limits for *every single tool* individually (e.g., 50 code analyses/day, 10 images/day), rather than a generic global limit.

### 7.3. Smart Email & Communication Hub
- **Dynamic Templates:** Pre-built, highly professional email templates for every system action (Welcome, Password Reset, Subscription Success, Referral Bonus).
- **Localization & Theming:** Templates automatically adapt to the user's language (AR/EN) and preferred theme (Light/Dark mode emails).
- **Customization:** Admins can edit, save, and preview templates directly in the UI.
- **Broadcast & Marketing:** A dedicated interface to create custom promotional campaigns or update announcements, with the ability to send to all users, specific segments, or individual emails.

### 7.4. ViralBook Architecture & Sovereign Identity (نظام فيرال بوك والمجتمع التفاعلي)
ViralBook (`/viralbook`, `/bulletin`, `BulletinBoardPage.tsx`) is Perplexta's social, commercial, and rich media communication hub. Engineered according to the Facebook-standard interactive design system and reinforced by military-grade backend pipelines, it unites sovereign community engagement, commercial business discovery, verified reels, and interactive real-time communications into a unified, high-performance ecosystem.

#### 1. Core Identity & Architectural Philosophy (الهوية المعمارية والرسالة)
- **Sovereign Interactive Community Hub**: A unified, Facebook-style interactive feed combining rich social publishing, multi-format media broadcasts, certified business directories, and commercial product promotions without reliance on third-party tracking scripts.
- **Strict Real-Time Integrity**: All interactions (reactions, comments, inquiries, post boosting, and message dispatching) are powered by authentic PostgreSQL persistence and Socket.io broadcasts with zero mock or simulated layers.
- **Bilingual Arab-Centric & Global Precision**: Native first-class RTL layout with Arabic localization (Palestinian and Pan-Arab governorates/cities database) alongside seamless LTR English support.
- **Commercial Monetization Engine**: Granular promotion architecture supporting wallet-backed or payment-gateway post boosting, audited daily pricing (`bulletin_ad_daily_price`), duration thresholds, impressions/clicks tracking, and commercial WhatsApp conversion hooks.

#### 2. System Structure & Layout Hierarchy (الهيكل البرمجي والطبقات)
The Bulletin Board is divided into seven dedicated tabs and specialized modular components:
- **`board` (الرئيسية / Feed)**:
  - **Facebook-Standard Post Composer**: Header with author pill, audience selector (`public`, `friends`, `only_me`), AI-generated content toggles (`is_ai_generated`), feeling/activity tags (`FEELINGS`), Palestinian/Arab city targeting selector (`COUNTRIES_CITIES_DATA`), multi-photo/video attachment support, aspect ratio controls, and a high-conversion WhatsApp CTA banner with phone number verification.
  - **Stories Carousel**: 24-hour ephemeral stories with progress indicators, creator modals (`StoryUploadModal`), and immersive playback viewer (`StoryViewerModal`).
  - **Interactive Post Feed (`PostFeed.tsx`)**: Reaction engine (Like, Love, Haha, Wow, Sad, Angry) with authentic database recording (`bulletin_ad_likes`), nested multi-level threaded comments (`bulletin_ad_comments`) with comment reaction tracking (`bulletin_comment_likes`), media lightbox viewers (`MediaLightboxModal`), video frame capture, and social share modals.
  - **Contextual Sidebars**: Right and left sidebars integrating trending insights, page recommendations (`RecommendationWidget`), and sponsored promotions.
- **`reels` (مقاطع الفيديو / Short-Form Video Feed)**:
  - Full-screen, high-definition vertical video feed (`ReelsFeed.tsx`) with dynamic audio coordination (`mediaCoordinator.ts`), gesture controls, video trimmer modal (`VideoTrimmerModal`), aspect-ratio auto-detection, view/like counters, and direct creator follow mechanisms.
- **`pages` (الصفحات والشركات / Verified Business Pages)**:
  - Commercial business directory (`bulletin_pages`) featuring verified creator badges, custom vanity slugs, localized contact details, cover/avatar branding, follower subscriptions (`bulletin_page_followers`), and direct business inquiries.
- **`inquiries` (استفسارات الإعلانات / Ad Inquiries & Messenger)**:
  - Integrated customer-to-business messaging center (`AdMessengerHub.tsx`, `bulletin_ad_messages`) with end-to-end encrypted message tracking and real-time socket delivery.
- **`my_ads` (إعلاناتي ومنشوراتي / My Ads & Content)**:
  - Personal management console for active, pending, archived, and trashed posts with 1-click status toggles, editing capabilities, translation toggles, and boost activations.
- **`analytics` (لوحة تحليلات الإعلانات / Performance Analytics)**:
  - Comprehensive user-facing analytics radar (`UserAdAnalyticsView.tsx`) visualizing impressions, click-through rates (CTR), geographic audience distribution, engagement ratios, and return on ad spend (ROAS).
- **`saved` (العناصر المحفوظة / Saved Bookmarks)**:
  - Instant access to bookmarked posts and commercial opportunities persisted via `bulletin_saved_ads`.

#### 3. Database Schema & Backend Infrastructure (قواعد البيانات والمسارات)
All operations strictly interface with the Core Database schema across 10 dedicated relational tables:
1. `bulletin_ads`: Primary posts, ads, reels, and stories entity with full attribution (`user_id`, `page_id`, `ad_format`, `audience`, `whatsapp_number`, `is_boosted`, `location_city`, `media_urls`, metrics).
2. `bulletin_pages`: Certified corporate and commercial creator entities.
3. `bulletin_page_followers`: Many-to-many subscription mapping.
4. `bulletin_page_inquiries`: Commercial prospect inquiries.
5. `bulletin_ad_likes`: Authentic user post reactions.
6. `bulletin_ad_comments`: Threaded discussions supporting parent/child hierarchies.
7. `bulletin_comment_likes`: Comment-level granular reactions.
8. `bulletin_ad_messages`: Direct encrypted communication between buyers and posters.
9. `bulletin_saved_ads`: User bookmark collections.
10. `bulletin_reports` & `bulletin_ad_muted_notifications`: Safety moderation and user notification filtering.
- **Server Routing Pillar (`server/routes/bulletin.ts`)**: 40+ audited RESTful endpoints supporting media streaming, automated moderation cron cleanups (`server/jobs/cron.ts`), wallet debit/refund integrations on rejection or stopping, and WebSocket-driven updates.

#### 4. The Sovereign Ads & Classifieds Platform Revolution - Roadmap (خطة عمل ثورة منصة الإعلانات والتبويبات السيادية لتصبح الأفضل عالمياً)
To establish Perplexta's ViralBook classified and advertising ecosystem as the absolute global leader, our development roadmap is systematically categorized into five sovereign phases:
1. **Premium AI Ad Copywriter & Multimedia Assistant (مساعد الذكاء الاصطناعي لكتابة وتصميم الإعلانات)**:
   - Integrate an in-composer AI copywriter that crafts highly engaging, sales-optimized ad descriptions in Arabic and English based on the item type and target city.
   - Deploy automated image quality checks and AI-driven background replacement for product photos to make them look studio-grade instantly.
2. **Hyper-Localized Interactive Mapping & Routing (الاستهداف الجغرافي الذكي والخرائط التفاعلية)**:
   - Introduce visual map pins for ads utilizing our high-performance Google Maps Platform Integration.
   - Empower buyers to filter local ads by exact distance radius (e.g., "within 5km of my current location") and view dynamic route directions directly to the seller or store.
3. **Advanced Interactive Marketplace Suite (مجموعة أدوات المتجر التفاعلي المتقدم للبيع والشراء)**:
   - **Bidding & Live Auctions (نظام المزايدات والمزادات الحية)**: Enable sellers to mark an ad as an "Auction" with a starting price, bid increment, and automated countdown timers.
   - **Offer Engine (محرك تقديم العروض)**: Implement a native, secure "Make an Offer" modal allowing buyers to propose alternative pricing, with instant real-time notification to the seller.
4. **Sovereign Ad Boosting Engine & Merchant Portal (بوابة التجار ونظام تمويل وترقية الإعلانات)**:
   - Develop a comprehensive Merchant Dashboard (`/merchant-portal`) where business owners can monitor their active ad campaigns, tracking deep analytics: Impression Funnels, Clicks, Conversion CTR, and WhatsApp chat opens.
   - Introduce customizable promotional badges ("Hot Deal", "Certified Seller", "Price Drop") funded directly from the user's Ledger Wallet balance with append-only auditing.
5. **Real-time Live Chat & Video Showrooms (المحادثات المباشرة وغرف العرض المرئية)**:
   - Upgrade the customer-to-business messenger with live audio call support and instant image/video previews directly inside the chat window.
   - Support short vertical video reels associated with ads (Shoppable Reels), allowing buyers to purchase or inquire with 1-click while watching the video.

#### 5. Strict Adherence & Evolution Directive (أمر صارم وملزم للتطوير المستقبلي)
- **MANDATORY PRESERVATION OF APPROVED IDENTITY**: Any future developer or AI assistant working on the Bulletin Board is **STRICTLY PROHIBITED** from altering, stripping, or replacing the Facebook-standard layout, the approved color tokens (`SOCIAL_COLORS`), the verified page structure, or the multi-tab navigation model.
- **ZERO MOCK / SIMULATION ENFORCEMENT**: Never re-introduce simulated response questions, fake metrics, or client-side placeholder counters. Every element must be directly connected to the PostgreSQL schema and the real-time notification engine.
- **ROLE-ISOLATED OPTIONS MENU**: Post option dropdowns (`PostOptionsMenu.tsx`) MUST strictly distinguish between post owners/admins (full management, audience, comment controls, archive/trash) and guests/non-owners (save, mute notifications, embed, hide, 7-category moderation reporting).
- **CLIENT-SIDE IMAGE OPTIMIZATION**: All page cover photos (3:1 aspect ratio), profile/avatar images (1:1 ratio), and post media MUST be processed through `imageOptimizer.ts` prior to upload to enforce light file sizes, fast WebP compression, and consistent card dimensions without button distortion.
- **UNIFIED NOTIFICATION & DEEP LINKING INTEGRATION**: All content state mutations (publishing, boosting, deleting, reporting) must dispatch through the server-authoritative WebSocket notification engine and deep-link directly to the live post route (`/bulletin/:ad_id`).
- **EXTENSION-ONLY EXPANSION**: Any enhancements—such as advanced sentiment analytics, enhanced video transcoding, or commercial checkout links—must build *on top* of the existing 10 relational tables and current React component architecture without breaking backward compatibility or database segregation.

### 7.5. GPU Infrastructure & Media Compute Vault (قسم مزودي خوادم الـ GPU ومعالجة الوسائط)
To empower sovereign high-performance computer vision, media analysis, image synthesis, and video generation without compromising system security or polluting LLM key vaults, the platform establishes a dedicated, isolated compute subsystem: **GPU Infrastructure (`gpu_providers`)**.

#### 1. Core Identity & Architectural Philosophy (الهوية المعمارية والرسالة الهندسية)
- **Absolute Infrastructure Segregation**: GPU compute providers (e.g., RunPod Serverless, Bare-Metal Dedicated vLLM/Ollama nodes, ComfyUI clusters, custom FastAPI workers) are fundamentally distinct from standard text-based LLM APIs. They operate on different billing units (execution time/GPU-seconds vs token counts), possess cold-start dynamics, and process dense binary/multimodal payloads (Base64, frame tensors, WebP buffers).
- **Zero Pollution Mandate (منع تلوث خزانة المفاتيح والأوركسترا)**: GPU servers and their loaded models MUST NEVER be stored in or mixed with `api_keys_vault`. General chat models must never be exposed to GPU synthesis endpoints, and multimodal vision tools must never be routed to text-only LLMs.
- **Architectural Mirroring with Domain Precision**: The UI for the GPU Infrastructure section (`GpuInfrastructureView.tsx`) matches the visual design language of `ApiKeysVaultView.tsx` (same responsive 3-column card grid, hover micro-interactions, WCAG AA status badges, dialog transitions, and budget controls), but incorporates dedicated GPU metrics: live health checks, cold-start indicators, measured ping/latency (ms), and one-click remote model fetching.

#### 2. Isolated Database Schema (قواعد البيانات المعزولة)
The subsystem strictly operates across two dedicated relational tables in the Core Database:
1. `gpu_providers`:
   - `id SERIAL PRIMARY KEY`
   - `provider_id VARCHAR(100) UNIQUE NOT NULL` (e.g., `runpod_serverless_qwen`, `hetzner_dedicated_rtx4090`)
   - `name VARCHAR(255) NOT NULL` (Display name)
   - `provider_type VARCHAR(100) NOT NULL` (`runpod_serverless`, `openai_vision_compatible`, `comfyui_worker`, `custom_rest`)
   - `endpoint_id VARCHAR(150)` (For RunPod serverless endpoints)
   - `base_url TEXT NOT NULL` (Direct HTTP/S endpoint)
   - `encrypted_api_key TEXT NOT NULL` (AES-256 encrypted token/bearer)
   - `health_status VARCHAR(50) DEFAULT 'offline'` (`online`, `cold_boot`, `busy`, `offline`)
   - `latency_ms INTEGER DEFAULT 0`
   - `capabilities TEXT[] DEFAULT ARRAY['vision']::TEXT[]` (`vision`, `image_generation`, `video_generation`)
   - `daily_budget NUMERIC(10,2) DEFAULT 0`
   - `used_today NUMERIC(10,2) DEFAULT 0`
   - `config JSONB DEFAULT '{}'` (Timeouts, polling intervals, max retries, custom headers)
   - `is_active BOOLEAN DEFAULT true`
   - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
2. `gpu_provider_models`:
   - `id SERIAL PRIMARY KEY`
   - `provider_id INTEGER NOT NULL REFERENCES gpu_providers(id) ON DELETE CASCADE`
   - `model_id VARCHAR(255) NOT NULL` (Actual remote identifier, e.g. `Qwen/Qwen2.5-VL-72B-Instruct`, `black-forest-labs/FLUX.1-schnell`)
   - `name VARCHAR(255) NOT NULL` (Display name)
   - `task_type VARCHAR(100) NOT NULL` (`vision_analysis`, `image_gen`, `video_gen`)
   - `context_window INTEGER DEFAULT 32768`
   - `max_output_tokens INTEGER DEFAULT 4096`
   - `is_active BOOLEAN DEFAULT true`
   - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

#### 3. Vision Orchestrator Exclusive Binding (ربط أداة الرؤية والوسائط الحصري)
- **Tool Categorization**: In `tool_orchestrator`, tools are categorized. Visual and media processing tools (`image`, `video`, and the sovereign vision tool `perplexta_vision` / `vision`) are bound to the `media_gpu` category.
- **Exclusive Model Source**: In `OrchestratorView.tsx`, when rendering cards for `vision`, `image`, or `video`, the provider and model dropdowns (`primary_provider`, `fallback_1_provider`, etc.) DO NOT query `api_keys_vault`. Instead, they query the dedicated endpoint `/api/admin/gpu-providers/models?task_type=...`.
- **Silent Failover on Cold Boot & OOM**: If the primary GPU node returns a cold-start timeout (>30s) or CUDA Out-Of-Memory (OOM 500/507), the backend orchestrator silently and immediately cascades to `fallback_1` without terminating the client stream.

#### 4. Supported Connection Protocols (بروتوكولات الربط المدعومة)
1. **OpenAI-Compatible Vision Protocol (vLLM / SGLang / Ollama / RunPod vLLM Proxy)**:
   - Endpoint: `{base_url}/v1/chat/completions` (or `https://api.runpod.ai/v2/{endpoint_id}/openai/v1/chat/completions`)
   - Model Discovery: `{base_url}/v1/models`
   - Standard vision payload format: `{"role": "user", "content": [{"type": "text", "text": prompt}, {"type": "image_url", "image_url": {"url": "data:image/webp;base64,..."}}]}`
2. **RunPod Serverless Native Jobs Protocol**:
   - Synchronous: `POST https://api.runpod.ai/v2/{endpoint_id}/runsync` with authorization header.
   - Asynchronous: `POST https://api.runpod.ai/v2/{endpoint_id}/run` returning `job_id`, followed by poll `GET /status/{job_id}`.
3. **Dedicated Custom REST Node**:
   - Configurable payload mapping for private ComfyUI / FastAPI workers.

#### 5. Strict Military Command & Non-Regression Directives (أمر عسكري صارم لعدم كسر البنية مستقبلاً)
- **MANDATORY DEVELOPER DIRECTIVE**: Every developer and AI system MUST read, understand, and strictly adhere to the guidelines set forth in this section. Absolutely NO code may bypass, alter, or rewrite the GPU Orchestration service, the Zero-Latency cache, or the database schemas. Any deviation or attempt to hardcode models is a terminal offense.
- **FORBIDDEN CROSS-CONTAMINATION**: Under no circumstances shall any developer or AI coding agent merge `gpu_providers` into `api_keys_vault` or vice-versa. Operational databases must maintain distinct tables, models, and routes.
- **NEVER HARDCODE GPU ENDPOINTS OR MODELS**: All RunPod endpoint IDs, server IPs, and model names must be loaded dynamically from the database.
- **PRESERVE EXISTING ORCHESTRATOR CONTRACT**: Tools (`image`, `video`, `vision`) remain in `tool_orchestrator` to preserve billing, user tier limits, and subscription plans; only their underlying model resolver is channeled to the GPU infrastructure vault.

#### 6. End-to-End Implementation Blueprint (خطة التنفيذ التفصيلية من الصفر إلى التشغيل)
- **Phase 1 (Database Migration & Crypto)**:
  - Register `gpu_providers` and `gpu_provider_models` in `server/db/migrations/core.schema.ts` and `integrity.ts`.
  - Add AES-256 encryption/decryption hooks and in-memory zero-latency cache in `server/services/gpuVaultService.ts`.
- **Phase 2 (Backend API & GPU Adapters)**:
  - Create `server/routes/gpuProviders.ts` with endpoints:
    - `GET /api/admin/gpu-providers` (List all servers + stats)
    - `POST /api/admin/gpu-providers` (Create & encrypt provider)
    - `PUT /api/admin/gpu-providers/:id` (Update settings/budget)
    - `DELETE /api/admin/gpu-providers/:id` (Safe delete)
    - `POST /api/admin/gpu-providers/:id/test` (Pre-flight latency test & ping)
    - `POST /api/admin/gpu-providers/:id/sync-models` (Auto-discover remote models)
    - `GET /api/admin/gpu-providers/models` (Orchestrator model feeder)
  - Create adapter engines in `server/services/gpu/`:
    - `runpodAdapter.ts`
    - `openAiVisionAdapter.ts`
- **Phase 3 (Frontend Admin Section)**:
  - Build `src/components/admin/GpuInfrastructureView.tsx` matching `ApiKeysVaultView.tsx` design archetype.
  - Register tab in `AdminDashboard.tsx`, `CommandCenterView.tsx`, and admin navigation.
  - Provide add/edit modal, live ping indicator, model management drawer, and budget monitor.
- **Phase 4 (Orchestrator Binding & Runtime Execution)**:
  - Update `OrchestratorView.tsx` to route `vision`, `image`, and `video` to `/api/admin/gpu-providers/models`.
  - Connect vision inference in `server/services/orchestrator.ts` to dispatch images/video attachments to the active GPU provider.
- **Phase 5 (Verification & Linting)**:
  - Execute full TypeScript build verification (`compile_applet`) and lint checks (`lint_applet`).

#### 7. Completed Progress: Backend GPU Orchestration & RunPod Service
- **Unified GPU Dispatcher (`dispatchGpuTask` & `executeGpuVisionInference`)**: Implemented a comprehensive orchestrator that automatically queries registered, active GPU providers and models for incoming visual/media requests (`vision_analysis`, `image_gen`, `video_gen`).
- **Telemetry-Aware Load Balancing**: Integrates real-time telemetry (latency metrics, current health state, daily budget, and the newly added `Max Load Capacity` and `Active Node Load` visual metrics) to intelligently rank candidates before task dispatch.
- **RunPod Native Sync + Poll Fallback Protocol**: 
  - Submits requests to `runsync` for low-latency, immediate executions.
  - Gracefully falls back to asynchronous `/run` with an incremental polling loop (`/status/{job_id}`) for long-running image/video generation requests (up to 2.5-minute timeout protection), ensuring extreme resilience.
- **Secure Encrypted Authentication**: API Keys are AES-256 encrypted inside `gpu_providers` and decrypted on-the-fly inside the isolated backend service using zero-latency memory caches.

#### 8. Development & Support Plan for fal.ai Integration (خطة دعم وتكامل fal.ai)
To seamlessly expand Perplexta's media compute borders with high-performance serverless inference, a dedicated fal.ai provider integration is designed as follows:
1. **Schema Extension**:
   - Register `fal_ai` inside the `provider_type` enumeration check constraints in `gpu_providers`.
2. **Authentication Header Routing**:
   - Native fal.ai API requires an authorization key format using `Key {api_key}` (instead of the standard `Bearer` scheme). The request construction layer must automatically map this prefix.
3. **Task Payload Mapping**:
   - Standardize inputs to match fal.ai's schema requirements. For example, for FLUX-based models (`fal-ai/flux/schnell` or `fal-ai/flux/dev`):
     ```json
     {
       "prompt": "prompt_text",
       "image_size": "square_hd" | "landscape_16_9" | "portrait_16_9",
       "num_inference_steps": 28,
       "sync_mode": true
     }
     ```
4. **Execution Protocol**:
   - **Low-Latency Synchronous**: Direct `POST https://queue.fal.run/{model_id}` with headers `Authorization: Key {key}`.
   - **Queue-Based Asynchronous**: For complex video models (e.g. Luma, Kling via fal.ai), issue `POST https://queue.fal.run/{model_id}` returning a `request_id`, then poll `GET https://queue.fal.run/{model_id}/status/{request_id}`.
5. **Auto-Discovery & Heartbeat**:
   - Provide direct fal.ai models mapping inside the `/sync-models` admin routine, seeding standard task descriptors dynamically.

---

### 7.6. Sovereign Image Processing & Generation Subsystem (نظام معالجة وتوليد الصور وتجربة العرض الفائقة 1080p)
To deliver world-class generative art, high-fidelity rendering, and responsive visual synthesis, the platform establishes the **Sovereign Image Processing Subsystem** (`imageTask.ts`, `ChatPage.tsx`, `chat.ts`).

#### 1. Core Architecture & Routing Pipeline (الهيكل المعماري ومسارات التوجيه)
- **Dynamic Multi-Provider Orchestration**: Supports dynamic routing across Google GenAI (`@google/genai`), OpenAI-compatible REST endpoints, custom dynamic protocols (with polling/webhook support), and dedicated Sovereign GPU Infrastructure nodes (`gpu_providers`).
- **Sub-Second Prompt Translation & Optimization**:
  - Automatically translates Arabic prompts into descriptive English art directives optimized for diffusion and generative models (SDXL, Midjourney, Flux, Imagen).
  - Enforces strict execution bounds (`maxOutputTokens: 250`, `temperature: 0.2`, 4500ms safety timeout) to ensure sub-second response without blocking the chat event loop.
- **Local Disk Cache & 48-Hour Retention**:
  - Validates and saves generated image buffers directly to secure disk storage (`saveGeneratedImageToDisk`).
  - Transparent user retention policy notice (48 hours server retention) encouraging immediate download or local bookmarking.

#### 2. Visual Experience & In-Page 1080×1080 Lightbox Modal (تجربة العرض والنافذة المنبثقة)
- **Shaded Square Loading Placeholder (`SimpleImageLoadingPlaceholder`)**:
  - Centered dark canvas with aspect-ratio awareness matching user settings.
  - Top assistant status message (`...جارٍ إنشاء صورتك ✨`).
  - Zero-overhead CSS hardware acceleration for immediate feedback on message dispatch.
- **In-Page 1080×1080 Pro Lightbox (`ShareableImageOutput`)**:
  - Interactive popup modal rendered via React Portals with high-definition backdrop blur.
  - Zoom engine (100% to 300% zoom with keyboard navigation `+`, `-`, `0`, `Esc`).
  - Integrated Action Suite: Instant 1080p PNG download, Prompt copier, Local bookmarks integration (`saved_ai_images`), Native Web Share API, and Full-screen expand.

#### 3. Strict Immutability & Anti-Regression Decree (أمر الحظر الصارم لأي تعديل على هيكل الصور)
- **PERMANENT ARCHITECTURAL LOCK**: The image processing module, its loading states, prompt optimization pipeline, and in-page 1080×1080 Lightbox are permanently sealed.
- **NO DELETIONS OR REWRITES**: No subsequent developer or AI assistant is permitted to modify, remove, or regress this image processing architecture.
- **NEXT PHASE FOCUS**: All subsequent work must be purely additive, focusing on developing and deploying the dedicated **Video Server Subsystem**.

---

### 7.7. Mobile Version & Bottom Navigation Engineering (هندسة نسخة الموبايل وشريط الملاحة السفلي الصارم)
To deliver a native app-like handheld experience while protecting against accidental mobile system gesture triggers (e.g., swipe-to-home or app switcher on modern iOS and Android devices), the platform enforces strict mobile navigation standards across all views (`BulletinBoardPage`, `BlogPage`, `SettingsPage`, `ChatPage`).

#### 1. Compact Visual Footprint & Control Scales (النظام البصري والبصمة المدمجة)
- **Tab Buttons**: Standardized compact size `w-9 h-8` (36px width, 32px height) with `rounded-[8px]`.
- **Icon Scale**: Standardized `14px` (`size={14}`) with `stroke-[2.2]`.
- **Typography Scale**: `text-[8.5px] font-bold leading-tight` ensuring single-line label fit in both Arabic (RTL) and English (LTR) without truncation or text wrapping.
- **Central Action Button (`+` / Create)**: Compact `w-8 h-8 rounded-[8px]` with `size={16}` icon.
- **Backdrop & Elevation**: `bg-white/95 dark:bg-[var(--bg-base)]/95 backdrop-blur-md` with top border `border-t border-[var(--border-main)]` and soft shadow `shadow-[0_-8px_30px_rgb(0,0,0,0.12)]`.

#### 2. Strict 74px Safe Area Inset Engineering (هندسة مسافة الأمان السفلية الصارمة 74px)
- **Formula**: `pb-[calc(20px+env(safe-area-inset-bottom,0px))]` with `pt-2`.
- **74px Maximum Total Height Breakdown (تفصيل المسافة السفلية 74px)**:
  1. Top Padding (`pt-2`): **8px**
  2. Compact Control Height (`h-8`): **32px**
  3. Base Bottom Padding: **20px**
  4. Dynamic Mobile System Safe Area (`env(safe-area-inset-bottom)`): **14px to 34px** dynamic extension.
  - **Total**: **74px** maximum bottom clearance on modern smartphones.

#### 3. Mandatory Page Content Offsets (إلزامية الهوامش السفلية المخصصة للمحتوى)
- **Main Scrollable Pages (`BulletinBoardPage`, `BlogPage`, `SettingsPage`)**: Mandatory content bottom padding `pb-[calc(80px+env(safe-area-inset-bottom,0px))]` ensuring the lowest cards, comments, or action triggers are never obscured or clipped behind the 74px fixed navigation bar.
- **Chat Input Container (`ChatPage`)**: Input container bottom padding `pb-[calc(20px+env(safe-area-inset-bottom,0px))]` delivering an exact 74px clearance from the bottom edge of the device screen to the chat box.

#### 4. Universal Cross-Section Enforcement (الالتزام الشامل عبر الأقسام)
Applied with 100% uniformity across:
- `src/pages/BulletinBoardPage.tsx`
- `src/pages/BlogPage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/ChatPage.tsx`

---

### 7.8. Global Confirmation Modals, Floating Toast System & Mobile Floating Capsule Symmetry (نظام التوثيق الشامل، التنبيهات العائمة، وكبسولة الملاحة العائمة)

#### 1. Unified Action Confirmation Modal (`ActionConfirmationModal`)
- **Eradication of Browser Alerts**: Completely removed native browser popups (`alert`, `confirm`, `prompt`) across all platform modules.
- **Visual Action States**:
  - **Red Action State**: Deletion and destructive actions utilize an official, soft red button (`bg-[var(--bg-btn-danger)] text-[var(--fg-btn-danger)] hover:brightness-110 active:scale-95`).
  - **Crisp Action State**: Save and confirmation actions utilize a high-contrast white/accent action button (`bg-[var(--bg-btn-success)] text-[var(--fg-btn-success)] hover:brightness-110 active:scale-95`).
  - **Subtle Cancel**: Transparent, calm cancellation controls (`text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]`).

#### 2. Unified Floating Toast Classes (`ServiceUpdateToast`)
- **Global CSS Infrastructure**: Defined `.toast-container-floating`, `.toast-floating`, `.toast-progress-track`, and `.toast-progress-fill` in `src/index.css`.
- **Asynchronous Task Progress**: Integrated `.loading(message, title)` methods into `NotificationContext` displaying smooth linear progress indicators and native haptic feedback triggers (`triggerHaptic`).

#### 3. Mobile Floating Capsule Navigation & Header-to-Footer Symmetry
- **Floating Capsule Island**: Mobile bottom nav (`.mobile-bottom-nav`) floats at `bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px))` with side margins (`0.75rem`), eliminating screen edge sticking on iOS/Android devices.
- **Symmetric Controls**: Standardized `32px` (`h-8`) button heights, `14px` icon scale, `8px` rounded corners, and single-line `8.5px` font labels to match top header controls (`HEADER_SIZING`).

---

## 8. Mobile Architecture & Layout Governance (هندسة وتنسيق واجهات الجوال)
To ensure a "Professional Elite" experience on all mobile devices and maintain consistency across the PWA and Capacitor builds, the following standards are mandatory:

### 8.1. Unified Measurement System (نظام القياسات الموحد)
All layout components must derive their dimensions from `src/constants/layout.ts`. Hardcoding pixel values for structural elements is strictly prohibited.
- **Header Height**: `LAYOUT.HEADER.MOBILE` (56px) / `LAYOUT.HEADER.DESKTOP` (64px).
- **Mobile Navigation**: Implemented as a **Floating Capsule** (`rounded-xl`, `bottom-4`, `left-4`, `right-4`, `h-64px`).
- **Touch Targets**: Every interactive element on mobile MUST have a minimum physical touch area of **44x44px** (using padding or `min-width/height` utilities).

### 8.2. Viewport Resilience (dvh & safe-areas)
- **Fluid Height**: Always use `min-h-screen-safe` (which maps to `100dvh`) instead of `min-h-screen` (100vh) to prevent layout jumps caused by mobile browser address bars.
- **Safe Area Integration**: Use `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` within CSS or Tailwind utilities to ensure content is not obscured by device notches or home indicators.
- **Global Padding**: Standard mobile pages must implement a minimum bottom padding of `pb-24` (96px) to clear the floating navigation capsule without overlap.

### 8.3. Visual Consistency & Interactions
- **Typography**: Strictly use **Tajawal** (`font-sans`) for Arabic content and Display/Cormorant fonts for premium heading sections.
- **Feedback**: Implement `:active` states on all touchable elements (e.g., `active:scale-95 transition-all`) to provide immediate visual confirmation of input.
- **Blur & Transparency**: Use `backdrop-blur-xl` with `bg-[var(--surface-page)]/90` for headers and floating elements to maintain depth and readability.

---

## 8.4. Exact System Tool Implementations & File Structure (التوثيق البرمجي التفصيلي لملفات وأقسام النظام)

### 📂 Structural Directory Topology (الهيكل المادي للمجلدات والمسارات)
The system's pristine source structure is partitioned symmetrically into the following core paths:
- `/server/` - Isolated corporate Node.js Express backend using absolute type stripping.
  - `server/db/` - Schemas (`core.schema.ts`, `ledger.schema.ts`, `security.schema.ts`), migrations, and dynamic seeding modules.
  - `server/routes/` - RESTful end-point controllers (audit logging, tools execution, chat sync).
  - `server/services/` - Encryption protocols, dynamic orchestration models, and visual task dispatches.
- `/src/` - Client-side high-performance React (TypeScript) architecture using Vite.
  - `src/components/` - Sub-component structures and localized renderers.
  - `src/context/` - Auth sessions, centralized sockets, theme contexts.
  - `src/pages/` - Highly structured dashboards (Command Center, Feed, Rewards, Live chat page).
  - `src/utils/` - Secure storage interfaces, theme synchronizations, and mathematical calculators.

### 🛠️ Interactive Tool Modules Implementation Specs (مواصفات وتوثيق عمل أدوات التوليد والتحليل)

#### 1. Image Studio Tool (`imageTask.ts` / `ImageRenderers.tsx` / `ChatPage.tsx`)
*   **The Problem It Solves**: Implements custom image generation using direct model configurations. Prevents layout flickering when aspect ratio inputs are changed concurrently during an ongoing render lifecycle.
*   **Engineering Resolution**: 
    - The client-side hook `useChatMessaging.ts` registers `aspect_ratio` directly onto `userMsg` and `pendingAssistantMsg` properties during message dispatch.
    - Resolves from the unique message attribute `msg.aspect_ratio` rather than the active dropdown UI state, preserving rendering dimensions statically for ongoing pipelines.
    - Synchronizes parameters through `/api/chats/sync-message` containing client-side `imageSettings` payload to ensure accurate billing and model initialization on server-side nodes.
    - Native mapping classes (`ASPECT_RATIO_CLASSES`) support custom dimensions (`1:1`, `4:3`, `3:4`, `3:2`, `2:3`, `16:9`, `9:16`, `21:9`) with clean responsive constraints.

#### 2. Video Studio Tool (`videoTask.ts` / `VideoRenderers.tsx` / `ChatPage.tsx`)
*   **The Problem It Solves**: Native video player initialization, loading skeleton distortion, and adaptive media rendering.
*   **Engineering Resolution**:
    - Leverages the `SimpleVideoLoadingPlaceholder` and error boundaries built with physical aspect ratio measurements.
    - Binds `msg.aspect_ratio` to the container's layout parameters to render accurate loading states (e.g., standard cinematic widescreen `16:9` or vertical video reels/stories `9:16`).
    - The server-side module parses and injects aspect properties in metadata formats: `video.mp4#aspect=9:16&resolution=1080p&duration=5` for clean client-side hardware-accelerated playback.

#### 3. Code Analyzer & Developer Sandbox Tool (`CodeBlock.tsx` / `ThinkingSteps.tsx`)
*   **The Problem It Solves**: Rendering complex executable programs (HTML, CSS, JS) directly inside the chat workspace with live compilation and isolated execution.
*   **Engineering Resolution**:
    - Implements structured sandboxed iframes (`srcdoc`) that separate executable code from the core document's frame context.
    - Employs dynamic resizing observers (`ResizeObserver`) to continuously measure and scale the viewport height.
    - Prevents layout jump using beautiful transition loaders, integrated with full-screen code expansion modes, instant copy-to-clipboard, and localized RTL support for code comments.

#### 4. Real-time suggested Follow-up Questions System (`FollowUps.tsx` / `index.css`)
*   **The Problem It Solves**: Inefficient user-flow leading to conversational dead-ends.
*   **Engineering Resolution**:
    - Suggested follow-up controls are engineered with premium custom states dynamically bound to variables `--bg-followup-btn` and `--fg-followup-btn`.
    - Features elegant CSS state mappings (`hover:bg-[var(--bg-followup-btn-hover)]` and active scale micro-interactions) that prevent sudden layout flickering when the user interacts with suggestions.
    - Renders with an inline-flex trailing direction arrow (such as `CornerDownLeft` for Arabic RTL layout and standard `CornerDownRight` for LTR) dynamically computed without duplicate JSX blocks.

---

### 🛠️ Session Work Completed Today (September 10, 2026 - Image & Video Aspect Alignment, Theme Boot-Strap Integration, Action Confirmation Customization, and Documentation Re-engineering):
- **Dynamic Variable Integration for Dialogs & Follow-ups**:
  - Implemented core custom design variables inside `src/index.css` for both confirmation actions and follow-up interaction buttons.
  - Customizer tokens registered: `--bg-btn-danger`, `--fg-btn-danger`, `--bg-btn-success`, `--fg-btn-success`, `--bg-btn-page`, `--fg-btn-page`, and a full suite of `--bg-followup-btn` variables.
- **Unified Action Confirmation Design Update**:
  - Refactored `ActionConfirmationModal.tsx` to bind directly to theme customizer tokens (`--bg-btn-danger`, `--bg-btn-success`) with majestic transitions and M3 rounded shape rules, completely decoupling interactive states from hardcoded utility classes.
- **Suggested Follow-ups Layout Perfection**:
  - Overhauled `FollowUps.tsx` with dynamic transitions on hover states, utilizing the brand-new `--bg-followup-btn` CSS tokens and guaranteeing flawless layout stability during user transitions.
- **Conversational Aspect-Ratio Lock Optimization**:
  - Added new aspect sizes (`3:4`, `2:3`) inside the standard map `ASPECT_RATIO_CLASSES` in `src/constants/chat.ts`.
  - Updated `/server/routes/chat.ts` to seamlessly parse client-side `imageSettings` and `videoSettings` on the incoming `/sync-message` API route, establishing database synchronicity.
  - Hardened the client hook `useChatMessaging.ts` and assistant rendering bubbles `AssistantMessageBubble.tsx` to save, persist, and render based on the individual message `aspect_ratio` property, eliminating retroactive UI shifts on adjacent messages.
- **Green Linter and Applet Compilation Verification**:
  - Executed static typing validations (`npm run lint` / `lint_applet`) and verified clean execution parameters.
  - Successfully ran a full-system production compile (`compile_applet`) with zero compilation warnings.
- **Sovereign Re-engineering of `AGENTS.md`**:
  - Rewrote the master document with military-grade architectural laws, documenting the precise functional flow of every tool, visual guidelines, file topologies, and previous achievements.
- **Artifact Canvas Full Visual Harmonization & Design System Enforcement (توحيد كانفاس وفرض الهوية البصرية)**:
  - **Single-Piece Component Architecture (قطعة واحدة متماسكة)**: Fully unified all Artifact Canvas sub-components (`ArtifactCanvas.tsx`, `ArtifactCode.tsx`, `ArtifactPreview.tsx`, `ArtifactAIAnalysis.tsx`, and `CodeBlock.tsx`) under the strict Perplexta M3 design system.
  - **Eliminated Visual Distraction (إنهاء التشتيت البصري)**: Systematically eradicated legacy hardcoded color strings (such as `dark:bg-[#0b101b]`, `border-slate-200 dark:border-slate-800`, `bg-cyan-500/10` and arbitrary border styles). Replaced them with the unified CSS variable architecture:
    - Surfaces: `var(--surface-page)`, `var(--surface-card)`, `var(--surface-subtle)`, `var(--surface-inset)`.
    - Borders: Uniformly transitioned from mismatched border classes to standard `border-[var(--border-default)]`.
    - Text & Foreground: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`.
    - Actions & Buttons: `var(--comp-button-primary-bg)`, `var(--comp-button-primary-fg)`.
  - **Button Scaling & Touch Compliance (ضبط أبعاد وأزرار الكانفاس ومعايير اللمس)**:
    - Standardized all compact toolbar actions (refresh, viewport switcher, theme toggle, copy, download, terminal toggle, fullscreen, close) to unified `w-8 h-8` or `h-9` containers.
    - Guaranteed strict compliance with the **44px × 44px minimum touch target** mandate across all devices using expanding hitboxes (`relative before:absolute before:-inset-1.5 before:content-['']`) or explicit `min-h-[44px]`.
  - **Interactive Data Sandbox & Multimodal Studio (استوديو تحليل البيانات والذكاء الاصطناعي)**:
    - Enhanced `ArtifactAIAnalysis.tsx` with live architecture metrics (Code Lines, Character Payload, Detected Tech Stack, and Efficiency Score).
    - Polished the interactive live chart sandbox (Chart.js / Recharts for Bar, Line, Pie) with direct code injection mechanism (`handleInjectChart`).
    - Implemented visual snapshot capture (`handleCaptureSnapshot`) with PNG export and 4 pre-configured One-Click Multimodal AI prompt action cards.
  - **Code Quality & Dead Code Elimination (تصفية الأكواد الميتة والتكرارات)**:
    - Verified complete removal of obsolete canvas stubs, dead functions, duplicate event listeners, and conflicting style rules.
    - Verified seamless bilingual (Arabic/English) layout and RTL alignment across tabs and control sub-bars.

---

### 🛑 CRITICAL DIRECTIVE FOR NEXT ASSISTANTS (ملاحظة هامة وحاسمة للمساعدين القادمين) 🛑
**THE ARTIFACT CANVAS DEVELOPMENT IS ACTIVELY UNDERWAY AND INCOMPLETE. FURTHER ADVANCED DEVELOPMENT OF THE CANVAS IS REQUIRED AFTER THE BREAK.**
*(المشروع بحاجة ماسة لاستكمال وتطوير الكانفاس بعد الاستراحة. تم ضبط الهوية البصرية وتوحيد التصميم بالكامل كقطعة واحدة، ولكن مرحلة الربط المتقدم مع خدمات التحليل المتعددة Multimodal AI وتوسيع ساحة العمل المباشر لم تكتمل بعد وتتطلب متابعة وتطوير).*

- **Next Phase Requirements for Canvas (متطلبات المرحلة القادمة للكانفاس)**:
  1. Continue expanding interactive real-time data analysis tools and multi-dataset capabilities within `ArtifactAIAnalysis.tsx`.
  2. Further enhance live multi-modal AI feedback loops between the chat conversation model and the visual canvas state.
  3. Ensure all newly added canvas extensions adhere strictly to the established single-piece visual identity, 44px touch targets, and `border-[var(--border-default)]` token architecture.

---

### ⚠️ IMMUTABLE ARCHITECTURE & EXTENSION-ONLY MANDATE (أمر الالتزام بالاستكمال والتطوير وحظر التعديل أو التخريب) ⚠️
1. **STRICT ARCHITECTURAL SEAL**: All existing architecture—including Express/Vite full-stack engine, Core & Ledger dual-database separation, Orchestrator routing, Socket execution, and UI design systems—is officially **LOCKED AND SEALED**.
2. **NO REWRITES OR REMOVALS**: Future developers and AI assistants are strictly forbidden from modifying, rewriting, refactoring, or removing any existing structural endpoints, visual features, or database schemas.
3. **ADDITIVE DEVELOPMENT ONLY**: All future tasks must strictly be additive extensions (استكمال وتطوير), building upon established foundations without altering or displacing existing mechanics. Any proposed development MUST BE A CONTINUATION of our work, never a destructive change. Any violation of this rule is considered systemic sabotage.
4. **ABSOLUTE PREREQUISITE READING RULE**: It is an absolute, non-negotiable directive that **every developer and AI assistant MUST read and review this documentation file (`AGENTS.md`)** in its entirety BEFORE starting any development work. You MUST strictly adhere to its rules, architectural standards, and decrees without exception.

**Final Message to All Future Contributors:** You are inheriting a "Technical Fortress." Your duty is to expand its borders, not weaken its walls. Build with precision. Keep it Majestic. 🛡️✨🏆
