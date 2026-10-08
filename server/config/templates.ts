
const header = (lang: string) => {
  const isAr = lang === 'ar';
  return `
    <tr dir="${isAr ? 'rtl' : 'ltr'}">
      <td class="header" align="center" style="background: linear-gradient(135deg, #0d1117 0%, #161b22 100%); padding: 42px 24px; text-align: center; border-bottom: 2px solid #1a7f37;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; font-family: ${isAr ? "'Tajawal', 'Cairo', sans-serif" : "'Tajawal', 'Helvetica Neue', Helvetica, Arial, sans-serif"};">
          ${isAr ? 'منظومة بيربليكستا الذكية' : 'PERPLEXTA PLATFORM'}
        </h1>
        <p style="color: #58a6ff; margin: 8px 0 0 0; font-size: 13px; font-weight: 600;">
          ${isAr ? 'التحليل التقني والذكاء الاصطناعي السيادي' : 'Sovereign AI & Technical Analysis'}
        </p>
        <div style="display: inline-block; background-color: rgba(26, 127, 55, 0.15); color: #58a6ff; padding: 5px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-top: 14px; border: 1px solid rgba(88, 166, 255, 0.3);">
          ${isAr ? 'بوابة الهوية والخدمات الرسمية' : 'Official Identity & Services Gateway'}
        </div>
      </td>
    </tr>
  `;
};

const footer = (lang: string) => {
  const isAr = lang === 'ar';
  return `
    <tr dir="${isAr ? 'rtl' : 'ltr'}">
      <td class="footer" align="center" style="background-color: #0d1117; padding: 30px 25px; text-align: center; color: #8b949e; font-size: 13px; border-top: 1px solid #3d444d; line-height: 1.8;">
        <div style="margin-bottom: 12px;">
          <a href="https://perplexta.com/about" target="_blank" style="margin: 0 8px; color: #58a6ff; text-decoration: none; font-size: 12px; font-weight: 600;">
            ${isAr ? 'عن المنصة' : 'About Platform'}
          </a> •
          <a href="https://perplexta.com/terms" target="_blank" style="margin: 0 8px; color: #58a6ff; text-decoration: none; font-size: 12px; font-weight: 600;">
            ${isAr ? 'شروط الاستخدام' : 'Terms of Use'}
          </a> •
          <a href="https://perplexta.com/privacy" target="_blank" style="margin: 0 8px; color: #58a6ff; text-decoration: none; font-size: 12px; font-weight: 600;">
            ${isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </a>
        </div>
        ${isAr ? 'جميع الحقوق محفوظة © 2026 <strong>منصة بيربليكستا (PERPLEXTA)</strong>' : 'All Rights Reserved © 2026 <strong>PERPLEXTA PLATFORM</strong>'}<br>
        <span style="direction: ltr; display: block; margin-top: 6px; font-size: 11px; color: #8b949e; font-family: Arial;">PERPLEXTA PLATFORM — Sovereign Technical Intelligence</span>
        <span style="font-size: 11px; color: #8b949e; display: inline-block; margin-top: 10px;">
          ${isAr ? 'تصلك هذه الرسالة بناءً على إشعار رسمي من منصة بيربليكستا. إذا لم تقم بهذا الإجراء، يمكنك إبلاغ فريق الأمان.' : 'You received this email from Perplexta Platform. If you did not initiate this action, please contact security compliance.'}
        </span>
      </td>
    </tr>
  `;
};

const wrapper = (content: string, lang: string) => {
  const isAr = lang === 'ar';
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isAr ? 'إشعار منصة بيربليكستا' : 'Perplexta Notification'}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            direction: ${isAr ? 'rtl' : 'ltr'};
            text-align: ${isAr ? 'right' : 'left'};
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #f8fafc;
            padding: 40px 0;
        }
        .main-table {
            background-color: #ffffff;
            margin: 0 auto;
            width: 600px;
            max-width: 92%;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
            border: 1px solid #e2e8f0;
        }
        .content {
            padding: 40px 32px;
            text-align: ${isAr ? 'right' : 'left'};
            background-color: #ffffff;
        }
        .content h2, .content h3 {
            color: #0f172a !important;
            font-size: 22px;
            margin-top: 0;
            margin-bottom: 18px;
            font-weight: 800;
            line-height: 1.4;
            font-family: 'Tajawal', sans-serif;
        }
        .content p {
            font-size: 15px;
            line-height: 1.85;
            color: #475569 !important;
            margin-bottom: 22px;
            font-family: 'Tajawal', sans-serif;
        }
        .info-card {
            background-color: #f8fafc;
            border-${isAr ? 'right' : 'left'}: 4px solid #0284c7;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 28px;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            border-${isAr ? 'left' : 'right'}: 1px solid #e2e8f0;
        }
        .info-card table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-card td {
            padding: 6px 0;
            font-size: 14px;
            color: #1e293b;
            font-family: 'Tajawal', sans-serif;
        }
        .info-label {
            color: #64748b;
            width: 35%;
            font-weight: 600;
        }
        .btn-container {
            margin: 35px 0 25px 0;
            text-align: center;
        }
        .btn {
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 36px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 700;
            display: inline-block;
            box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
            font-family: 'Tajawal', sans-serif;
        }
        @media (prefers-color-scheme: dark) {
            body, .wrapper { background-color: #0b0f17 !important; }
            .main-table { background-color: #111827 !important; border-color: #1f2937 !important; }
            .content { background-color: #111827 !important; }
            .content h2, .content h3 { color: #f9fafb !important; }
            .content p { color: #9ca3af !important; }
            .info-card { background-color: #1e293b !important; border-color: #334155 !important; }
            .info-card td { color: #e2e8f0 !important; }
            .info-label { color: #94a3b8 !important; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <table border="0" cellpadding="0" cellspacing="0" class="main-table" width="600">
            ${header(lang)}
            <tr>
                <td class="content">
                    ${content}
                </td>
            </tr>
            ${footer(lang)}
        </table>
    </div>
</body>
</html>`;
};

export const systemTemplates = [
  { 
    name: 'welcome_email', 
    subject_en: 'Perplexta System: Official Identity Provisioning', 
    subject_ar: 'نظام بيربليكستا: تفعيل الهوية الرسمية', 
    body_en: wrapper(`
      <h2>Welcome, {{userName}}! 👋</h2>
      <p>
        We are pleased to welcome you to the Perplexta Terminal. Your account has been successfully created and provisioned with full analytics and AI capabilities.
      </p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="info-card">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="info-label">Username:</td>
                <td><strong>{{userName}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">Email:</td>
                <td><strong>{{userEmail}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">Account Status:</td>
                <td><span style="color: #4ade80; font-weight: 700;">Active & Ready</span></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p>
        Click the button below to authorize your session and access your dashboard:
      </p>

      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" class="btn-container">
            <a href="{{actionUrl}}" target="_blank" class="btn">Access Dashboard Now</a>
          </td>
        </tr>
      </table>

      <p style="font-size: 14px; margin-top: 32px; margin-bottom: 0; color: #94a3b8; line-height: 1.7;">
        If you have any questions or require support, contact operations directly at <a href="mailto:support@perplexta.com" style="color: #38bdf8; text-decoration: none;">support@perplexta.com</a>.
      </p>
    `, 'en'), 
    body_ar: wrapper(`
      <h2>أهلاً بك يا {{userName}}! 👋</h2>
      <p>
        يسعدنا انضمامك إلى بيربليكستا. تم إنشاء حسابك بنجاح وجاهز للاستخدام للاستفادة من كافة أدوات الذكاء الاصطناعي والتحليل الأكاديمي.
      </p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="info-card">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="info-label">اسم المستخدم:</td>
                <td><strong>{{userName}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">البريد الإلكتروني:</td>
                <td><strong>{{userEmail}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">حالة الحساب:</td>
                <td><span style="color: #4ade80; font-weight: 700;">مفعّل وجاهز</span></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p>
        اضغط على الزر أدناه لتأكيد دخولك والانتقال مباشرة إلى لوحة التحكم الخاصة بك:
      </p>

      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" class="btn-container">
            <a href="{{actionUrl}}" target="_blank" class="btn">الانتقال إلى لوحة التحكم</a>
          </td>
        </tr>
      </table>

      <p style="font-size: 14px; margin-top: 32px; margin-bottom: 0; color: #94a3b8; line-height: 1.7;">
        إذا كان لديك أي استفسار أو احتجت للمساعدة، يمكنك التواصل مباشرة مع فريق الدعم الفني عبر البريد الإلكتروني <a href="mailto:support@perplexta.com" style="color: #38bdf8; text-decoration: none;">support@perplexta.com</a>.
      </p>
    `, 'ar')
  },
  { 
    name: 'password_reset', 
    subject_en: 'Instruction: Security Access Override - Perplexta', 
    subject_ar: 'إجراء: تجاوز أمني لمفتاح الوصول - بيربليكستا', 
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 25px; letter-spacing: -0.5px;">Access Key Re-Authorization</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 20px;">A request has been logged to reset the access credentials associated with identity <strong>{{userName}}</strong>.</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 35px;">For system integrity, this authorization link is dynamically generated and must be executed within the next 60 minutes.</p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{actionUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 2px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Execute Reset</a>
      </div>
      <p style="color: #ef4444; font-size: 12px; font-weight: 600;">IF YOU DID NOT REQUEST THIS: Notify Perplexta Security immediately.</p>
    `, 'en'), 
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 25px;">إعادة تفويض مفتاح الوصول</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">تم تسجيل طلب لإعادة تعيين بيانات الوصول المرتبطة بالمعرّف <strong>{{userName}}</strong>.</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 35px;">لضمان سلامة النظام، تم إنشاء رابط التفويض هذا بشكل ديناميكي ويجب استخدامه خلال نافذة زمنية مدتها 60 دقيقة فقط.</p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{actionUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 2px; font-weight: 700; font-size: 15px; display: inline-block;">تنفيذ إعادة التعيين</a>
      </div>
      <p style="color: #ef4444; font-size: 13px; font-weight: 700;">في حال لم تطلب هذا الإجراء: يرجى إبلاغ أمن بيربليكستا فوراً.</p>
    `, 'ar') 
  },
  {
    name: 'security_alert_login',
    subject_en: 'Security Alert: New Authorized Entry Detected',
    subject_ar: 'تنبيه أمني: رصد دخول جديد للنظام',
    body_en: wrapper(`
      <h3 style="color: #0f172a; font-size: 18px; font-weight: 600; margin-bottom: 20px;">System Entry Logged</h3>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">A new terminal session has been established for account <strong>{{userName}}</strong>.</p>
      <div style="background-color: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; border-radius: 2px; margin: 25px 0;">
        <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;"><strong>Network Source:</strong> <span style="color: #0f172a;">{{ipAddress}}</span></div>
        <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;"><strong>Device Interface:</strong> <span style="color: #0f172a;">{{deviceInfo}}</span></div>
        <div style="font-size: 13px; color: #64748b;"><strong>Execution Time:</strong> <span style="color: #0f172a;">{{time}}</span></div>
      </div>
      <p style="color: #94a3b8; font-size: 12px;">Standard security monitoring active. This is an automated log entry.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h3 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 20px;">تم تسجيل دخول للنظام</h3>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">تم إنشاء جلسة عمل جديدة للمعرّف <strong>{{userName}}</strong>.</p>
      <div style="background-color: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; border-radius: 2px; margin: 25px 0;">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;"><strong>المصدر الرقمي:</strong> <span style="color: #0f172a;">{{ipAddress}}</span></div>
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;"><strong>واجهة الجهاز:</strong> <span style="color: #0f172a;">{{deviceInfo}}</span></div>
        <div style="font-size: 14px; color: #64748b;"><strong>توقيت التنفيذ:</strong> <span style="color: #0f172a;">{{time}}</span></div>
      </div>
      <p style="color: #94a3b8; font-size: 13px;">مراقبة أمنية قياسية مفعلة. هذا السجل يتم إنشاؤه تلقائياً.</p>
    `, 'ar')
  },
  {
    name: 'subscription_activated',
    subject_en: 'Logistics Update: Subscription Provisioned',
    subject_ar: 'تحديث لوجستي: تم تخصيص الاشتراك',
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Provisioning Successful</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">Operations have successfully provisioned the <strong>[{{planName}}]</strong> tier to your identity profile.</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">Your premium access is now fully authorized for the current billing term.</p>
      <div style="background-color: #f0fdf4; padding: 20px; border: 1px solid #dcfce7; color: #166534; font-size: 14px; font-weight: 700; text-align: center; margin: 30px 0; border-radius: 2px;">
        TERM EXPIRY: {{expiryDate}}
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 25px;">اكتمل التخصيص بنجاح</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">نجح قسم العمليات في تخصيص فئة <strong>[{{planName}}]</strong> لملفكم الرقمي بنجاح.</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">حق الوصول الخاص بكم مفعل الآن بالكامل للفترة الحالية.</p>
      <div style="background-color: #f0fdf4; padding: 20px; border: 1px solid #dcfce7; color: #166534; font-size: 16px; font-weight: 700; text-align: center; margin: 30px 0; border-radius: 2px;">
        انتهاء الصلاحية: {{expiryDate}}
      </div>
    `, 'ar')
  },
  {
    name: 'subscription_expiring',
    subject_en: 'Resource Notice: Access Term Concluding Soon',
    subject_ar: 'إشعار بالموارد: اقتراب انتهاء فترة الوصول',
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Subscription Maturation</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">This is a logistical notice that your <strong>[{{planName}}]</strong> access term will conclude on: <strong>{{expiryDate}}</strong>.</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 30px;">To maintain uninterrupted terminal availability and preserve your data integrity, please initiate a renewal protocol.</p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{baseUrl}}/subscription" style="border: 1px solid #0f172a; color: #0f172a; padding: 14px 35px; text-decoration: none; border-radius: 2px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Renew Access</a>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 25px;">نضوج الاشتراك</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">نحيطكم علماً بأن فترة وصولكم من فئة <strong>[{{planName}}]</strong> ستنتهي بتاريخ: <strong>{{expiryDate}}</strong>.</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">لضمان استمرارية توافر النظام والحفاظ على سلامة بياناتكم، يرجى بدء بروتوكول التجديد.</p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{baseUrl}}/subscription" style="border: 1px solid #0f172a; color: #0f172a; padding: 14px 35px; text-decoration: none; border-radius: 2px; font-weight: 700; font-size: 14px; display: inline-block;">تجديد الوصول</a>
      </div>
    `, 'ar')
  },
  {
    name: 'quota_warning',
    subject_en: 'System Alert: Resource Consumption Threshold',
    subject_ar: 'تنبيه النظام: عتبة استهلاك الموارد',
    body_en: wrapper(`
      <h3 style="color: #ef4444; font-size: 18px; font-weight: 600;">Bandwidth Usage Critical</h3>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">Identity has consumed <strong>{{usagePercentage}}%</strong> of the assigned {{scope}} quota for: <strong>{{toolId}}</strong>.</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">Approaching threshold will result in temporary throttling of the specific functional route.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h3 style="color: #ef4444; font-size: 20px; font-weight: 700;">استهلاك حرج للنطاق الترددي</h3>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">استهلكت هويتكم ما يعادل <strong>{{usagePercentage}}%</strong> من الحصة الـ{{scope}} المخصصة لـ: <strong>{{toolId}}</strong>.</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">الاقتراب من العتبة القصوى سيؤدي إلى تحديد مؤقت لمسار الوظيفة المحدد.</p>
    `, 'ar')
  },
  {
    name: 'withdrawal_requested',
    subject_en: 'Financial Record: Capital Export Initiated',
    subject_ar: 'سجل مالي: تم بدء تصدير رأس المال',
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Export Acknowledged</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">A capital export request of <strong>{{amount}}</strong> has been registered in the Perplexta Terminal.</p>
      <div style="background-color: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; border-radius: 2px; margin: 25px 0;">
        <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Audit Reference ID:</span><br>
        <code style="color: #334155; font-size: 15px; font-weight: 700;">{{referenceId}}</code>
      </div>
      <p style="color: #64748b; font-size: 13px;">Our auditing team is currently verifying the ledger integrity for this transaction.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 25px;">تم استلام طلب التصدير</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">تم تسجيل طلب تصدير رأس مال بمبلغ <strong>{{amount}}</strong> في نظام بيربليكستا.</p>
      <div style="background-color: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; border-radius: 2px; margin: 25px 0; text-align: center;">
        <span style="color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 700;">معرّف المراجعة:</span><br>
        <code style="color: #334155; font-size: 18px; font-weight: 700;">{{referenceId}}</code>
      </div>
      <p style="color: #64748b; font-size: 14px;">يقوم فريق التدقيق حالياً بالتحقق من سلامة السجلات لهذه المعاملة.</p>
    `, 'ar')
  },
  {
    name: 'withdrawal_approved',
    subject_en: 'Financial Record: Capital Export Finalized',
    subject_ar: 'سجل مالي: تم اعتماد طلب التصدير',
    body_en: wrapper(`
      <h2 style="color: #334155; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Export Authorized</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">Audit confirmed. The export request for <strong>{{amount}}</strong> has been cleared for execution.</p>
      <div style="border-left: 3px solid #334155; background-color: #f0fdf4; padding: 20px; margin: 25px 0;">
        <p style="margin: 0; color: #166534; font-size: 13px; font-family: monospace;">{{transactionDetails}}</p>
      </div>
      <p style="color: #94a3b8; font-size: 12px;">Transaction officially recorded in the global ledger.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #334155; font-size: 24px; font-weight: 700; margin-bottom: 25px;">تم اعتماد التصدير</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">تم تأكيد التدقيق. تمت الموافقة على طلب التصدير لمبلغ <strong>{{amount}}</strong> وهو الآن قيد التنفيذ.</p>
      <div style="border-right: 3px solid #334155; background-color: #f0fdf4; padding: 20px; margin: 25px 0;">
        <p style="margin: 0; color: #166534; font-size: 14px; font-family: monospace;">{{transactionDetails}}</p>
      </div>
      <p style="color: #94a3b8; font-size: 13px;">تم تسجيل المعاملة رسمياً في السجل العالمي.</p>
    `, 'ar')
  },
  {
    name: 'referral_bonus_earned',
    subject_en: 'Protocol Update: Infrastructure Growth Incentive',
    subject_ar: 'تحديث البروتوكول: حافز نمو البنية التحتية',
    body_en: wrapper(`
      <h3 style="color: #334155; font-size: 18px;">Network Expansion Successful</h3>
      <p style="color: #475569; font-size: 15px;">System adjustment: <strong>+{{bonusPoints}} PTS</strong> credited to your profile for successful terminal referral.</p>
      <p style="color: #0f172a; font-weight: 700; margin-top: 20px;">Current Identity Balance: {{newBalance}} PTS</p>
    `, 'en'),
    body_ar: wrapper(`
      <h3 style="color: #334155; font-size: 20px;">توسعة ناجحة للشبكة</h3>
      <p style="color: #475569; font-size: 16px;">تعديل النظام: تم إيداع <strong>+{{bonusPoints}} نقطة</strong> في ملفكم نتيجة إحالة ناجحة للنظام.</p>
      <p style="color: #0f172a; font-weight: 700; margin-top: 20px;">رصيد الهوية الحالي: {{newBalance}} نقطة</p>
    `, 'ar')
  },
  {
    name: 'kyc_submitted',
    subject_en: 'Compliance Record: Material Ingestion Initiated',
    subject_ar: 'سجل الامتثال: بدء عملية استيعاب المواد',
    body_en: wrapper(`
      <h3 style="color: #0f172a;">Audit Sequence Active</h3>
      <p style="color: #475569; font-size: 15px;">Your verification documentation has been received and queued for a mandatory compliance audit.</p>
      <p style="color: #64748b; font-size: 13px;">Status updates will be dispatched upon conclusion of the review phase.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h3 style="color: #0f172a;">سلسلة التدقيق نشطة</h3>
      <p style="color: #475569; font-size: 16px;">تم استلام وثائق التحقق الخاصة بكم بنجاح وهي الآن في قائمة الانتظار لتدقيق الامتثال الإلزامي.</p>
      <p style="color: #64748b; font-size: 14px;">سيتم إرسال تحديثات الحالة فور الانتهاء من مرحلة المراجعة.</p>
    `, 'ar')
  },
  {
    name: 'kyc_approved',
    subject_en: 'Compliance Result: Identity Verified',
    subject_ar: 'نتيجة الامتثال: تم توثيق الهوية',
    body_en: wrapper(`
      <h2 style="color: #334155; font-size: 22px; font-weight: 600;">Audit Successful</h2>
      <p style="color: #475569; font-size: 15px;">Full identity verification for <strong>{{userName}}</strong> has been successfully concluded. All terminal restrictions related to identity verification have been lifted.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #334155; font-size: 24px; font-weight: 700;">نجاح التدقيق</h2>
      <p style="color: #475569; font-size: 16px;">تم الانتهاء بنجاح من عملية تدقيق الهوية بالكامل للمعرّف <strong>{{userName}}</strong>. تم رفع كافة قيود النظام المرتبطة بتوثيق الهوية.</p>
    `, 'ar')
  },
  {
    name: 'kyc_rejected',
    subject_en: 'Compliance Result: Identity Audit Failure',
    subject_ar: 'نتيجة الامتثال: فشل تدقيق الهوية',
    body_en: wrapper(`
      <h2 style="color: #ef4444; font-size: 22px; font-weight: 600;">Audit Rejected</h2>
      <p style="color: #475569; font-size: 15px; margin-bottom: 20px;">Reason for protocol failure: <strong>{{rejectionReason}}</strong></p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{actionUrl}}" style="background-color: #ef4444; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 2px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Rectify Issues</a>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #ef4444; font-size: 24px; font-weight: 700;">رفض التدقيق</h2>
      <p style="color: #475569; font-size: 16px; margin-bottom: 20px;">سبب فشل البروتوكول: <strong>{{rejectionReason}}</strong></p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{actionUrl}}" style="background-color: #ef4444; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 2px; font-weight: 700; font-size: 14px; display: inline-block;">تصحيح البيانات</a>
      </div>
    `, 'ar')
  },
  {
    name: 'balance_update',
    subject_en: 'Ledger Notice: Identity Credit Sync',
    subject_ar: 'إشعار بالسجل: مزامنة رصيد الهوية',
    body_en: wrapper(`
      <div style="background-color: #f8fafc; padding: 25px; border-radius: 2px; border: 1px solid #e2e8f0;">
        <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px;">Transaction Type: {{type}}</div>
        <div style="font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 15px;">Adjustment: {{amount}} PTS</div>
        <div style="padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 14px; font-weight: 700; color: #334155;">New Authorized Balance: {{newBalance}} PTS</div>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <div style="background-color: #f8fafc; padding: 25px; border-radius: 2px; border: 1px solid #e2e8f0;">
        <div style="font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px;">نوع المعاملة: {{type}}</div>
        <div style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 15px;">مقدار التعديل: {{amount}} نقطة</div>
        <div style="padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 16px; font-weight: 700; color: #334155;">الرصيد المعتمد الجديد: {{newBalance}} نقطة</div>
      </div>
    `, 'ar')
  },
  {
    name: 'deposit_pending',
    subject_en: 'Deposit Protocol Initiated: Perplexta Ledger',
    subject_ar: 'بدء بروتوكول الإيداع: سجل بيربليكستا المالي',
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Deposit Protocol Initiated</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">A ledger deposit of <strong>{{amount}}</strong> has been registered in the system under pending status.</p>
      <div style="background-color: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; border-radius: 2px; margin: 25px 0;">
        <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;"><strong>Transaction Method:</strong> <span style="color: #0f172a;">{{method}}</span></div>
        <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;"><strong>Audit Reference:</strong> <code style="color: #334155;">{{referenceId}}</code></div>
      </div>
      <p style="color: #64748b; font-size: 13px;">The ledger credit operation will execute automatically upon clearing confirmation from the gateway or audit controller.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 25px;">بدء بروتوكول الإيداع المالي</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">تم تسجيل معاملة إيداع مالي بمبلغ <strong>{{amount}}</strong> في السجل وهي بانتظار التأكيد المالي.</p>
      <div style="background-color: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; border-radius: 2px; margin: 25px 0;">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;"><strong>طريقة المعاملة:</strong> <span style="color: #0f172a;">{{method}}</span></div>
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;"><strong>مرجع التدقيق:</strong> <code style="color: #334155;">{{referenceId}}</code></div>
      </div>
      <p style="color: #64748b; font-size: 14px;">سيتم تنفيذ عملية الإضافة فور تلقي إشعار التأكيد التلقائي من بوابة المعاملات أو مسئول التدقيق المالي.</p>
    `, 'ar')
  },
  {
    name: 'deposit_success',
    subject_en: 'Financial Record: Capital Deposit Cleared',
    subject_ar: 'سجل مالي: تم اعتماد الإيداع وتغذية المحفظة',
    body_en: wrapper(`
      <h2 style="color: #334155; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Capital Deposit Cleared</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">A payment of <strong>{{amount}}</strong> has been successfully processed and credited to your terminal wallet.</p>
      <div style="border-left: 3px solid #334155; background-color: #f0fdf4; padding: 20px; margin: 25px 0;">
        <p style="margin: 0; color: #166534; font-size: 14px; font-weight: bold; font-family: monospace;">CREDITED TARGET: {{newBalance}} PTS</p>
      </div>
      <p style="color: #94a3b8; font-size: 12px;">This is a secured ledger confirmation of final balance settlement.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #334155; font-size: 24px; font-weight: 700; margin-bottom: 25px;">تم التسوية المالية للإيداع</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">تمت معالجة دفعة بقيمة <strong>{{amount}}</strong> بنجاح وتغذية محفظتكم الرقمية في المنصة.</p>
      <div style="border-right: 3px solid #334155; background-color: #f0fdf4; padding: 20px; margin: 25px 0;">
        <p style="margin: 0; color: #166534; font-size: 15px; font-weight: bold; font-family: monospace;">الرصيد المعتمد الجديد: {{newBalance}} نقطة</p>
      </div>
      <p style="color: #94a3b8; font-size: 13px;">هذا إشعار ائتمان مالي آمن لتسوية الحساب النهائي.</p>
    `, 'ar')
  },
  {
    name: 'withdrawal_rejected',
    subject_en: 'Financial Record: Capital Export Blocked',
    subject_ar: 'سجل مالي: رفض طلب تصدير رأس المال',
    body_en: wrapper(`
      <h2 style="color: #ef4444; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Capital Export Blocked</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">The withdrawal request of <strong>{{amount}}</strong> has failed the compliance audit and was rejected.</p>
      <div style="background-color: #fef2f2; padding: 25px; border: 1px solid #fee2e2; border-radius: 2px; margin: 25px 0; color: #991b1b;">
        <div style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">Rejection Reason:</div>
        <div style="font-size: 14px; font-family: sans-serif;">{{reason}}</div>
      </div>
      <p style="color: #64748b; font-size: 13px;">The funds have been returned to your ledger balance. If you require clarification, please initiate a ticket protocol with operations support.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #ef4444; font-size: 24px; font-weight: 700; margin-bottom: 25px;">تم رفض تصدير رأس المال</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">الطلب المالي المتمثل بتصدير مبلغ <strong>{{amount}}</strong> لم ينجز معايير الامتثال ولذا تم رفضه.</p>
      <div style="background-color: #fef2f2; padding: 25px; border: 1px solid #fee2e2; border-radius: 2px; margin: 25px 0; color: #991b1b;">
        <div style="font-size: 14px; font-weight: 700; margin-bottom: 8px;">سبب الرفض:</div>
        <div style="font-size: 15px; font-family: sans-serif;">{{reason}}</div>
      </div>
      <p style="color: #64748b; font-size: 14px;">تم إعادة الأموال المرفوضة مباشرة إلى رصيدكم الحالي. يرجى فتح تذكرة دعم مالي مع الإدارة لاستيضاح التفاصيل.</p>
    `, 'ar')
  },
  {
    name: 'refund_processed',
    subject_en: 'Ledger Notice: Reimbursement Settlement',
    subject_ar: 'إشعار بالسجل: تسوية إرجاع مالي',
    body_en: wrapper(`
      <h2 style="color: #334155; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Reimbursement Ledger Settlement</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">A ledger refund process has been completed for <strong>{{userName}}</strong>.</p>
      <div style="background-color: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; border-radius: 2px; margin: 25px 0;">
        <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;"><strong>Reimbursed Amount:</strong> <span style="color: #0f172a; font-weight: bold;">{{amount}} PTS</span></div>
        <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;"><strong>Reason / Note:</strong> <span style="color: #0f172a;">{{reason}}</span></div>
        <div style="font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;"><strong>Updated Ledger:</strong> <span style="color: #334155; font-weight: bold;">{{newBalance}} PTS</span></div>
      </div>
      <p style="color: #94a3b8; font-size: 12px;">The associated credits are immediately ready and authorized for consumption.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #334155; font-size: 24px; font-weight: 700; margin-bottom: 25px;">تسوية الإرجاع المالي للحساب</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">تم إنجاز تسوية ائتمان إرجاع مالي في السجل للمعرف <strong>{{userName}}</strong>.</p>
      <div style="background-color: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; border-radius: 2px; margin: 25px 0;">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;"><strong>المبلغ المسترجع:</strong> <span style="color: #0f172a; font-weight: bold;">{{amount}} نقطة</span></div>
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;"><strong>السبب / ملاحظة:</strong> <span style="color: #0f172a;">{{reason}}</span></div>
        <div style="font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;"><strong>الرصيد المحدَّث:</strong> <span style="color: #334155; font-weight: bold;">{{newBalance}} نقطة</span></div>
      </div>
      <p style="color: #94a3b8; font-size: 13px;">تتوفر هذه الأرصدة المستردة فوراً للاستهلاك أو الاستخدام ضمن المنصة.</p>
    `, 'ar')
  },
  {
    name: 'password_changed_alert',
    subject_en: 'Security Alert: Login Credentials Altered',
    subject_ar: 'تنبيه أمني: تعديل بيانات الدخول السرية',
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Security Credentials Altered</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">This is an imperative security notification that the login password for account <strong>{{userName}}</strong> was successfully changed.</p>
      <div style="background-color: #fffbeb; padding: 20px; border: 1px solid #fef3c7; color: #b45309; text-align: left; margin: 25px 0; border-radius: 2px;">
        <div style="font-size: 13px; margin-bottom: 4px;"><strong>Security Registry:</strong></div>
        <div style="font-size: 11px; font-family: monospace;">TIMESTAMP: {{time}}<br>N-SOURCE: {{ipAddress}}<br>AGENT: {{deviceInfo}}</div>
      </div>
      <p style="color: #ef4444; font-size: 13px; font-weight: 600;">IF YOU DID NOT EXECUTE THIS CHANGE: Contact security compliance immediately to lock down the terminal.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 25px;">تعديل بيانات الوصول السرية</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">هذا تنبيه أمني إلزامي يفيد بأنه تم تغيير كلمة المرور المرتبطة بالمعرف <strong>{{userName}}</strong> بنجاح.</p>
      <div style="background-color: #fffbeb; padding: 20px; border: 1px solid #fef3c7; color: #b45309; text-align: right; margin: 25px 0; border-radius: 2px;">
        <div style="font-size: 14px; margin-bottom: 4px;"><strong>السجل الأمني للمعاملة:</strong></div>
        <div style="font-size: 12px; font-family: monospace;">التوقيت: {{time}}<br>المصدر الرقمي: {{ipAddress}}<br>الجهاز المستعلم: {{deviceInfo}}</div>
      </div>
      <p style="color: #ef4444; font-size: 14px; font-weight: 700;">في حال لم تقم بهذا الإجراء بنفسك: يرجى التواصل بالامتثال الأمني فوراً لإغلاق وحماية الحساب.</p>
    `, 'ar')
  },
  {
    name: 'support_reply',
    subject_en: 'Support Record: Operational Query Response',
    subject_ar: 'سجل الدعم: رد جديد من الإدارة والدعم الفني',
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Operational Query Response</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">A representative of the operations and technical team has updated ticket <strong>#{{ticketId}}</strong>.</p>
      <div style="background-color: #f8fafc; padding: 25px; border-left: 3px solid #0f172a; font-size: 14px; font-family: sans-serif; margin: 25px 0; color: #334155; line-height: 1.8;">
        {{replySnippet}}
      </div>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{ticketUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 2px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Access Communications Portal</a>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 25px;">رد جديد من الإدارة والدعم</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">قام فريق الدعم والعمليات الفنية بتحديث تذكرتكم رقم <strong>#{{ticketId}}</strong>.</p>
      <div style="background-color: #f8fafc; padding: 25px; border-right: 3px solid #0f172a; font-size: 15px; font-family: sans-serif; margin: 25px 0; color: #334155; line-height: 1.8;">
        {{replySnippet}}
      </div>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{ticketUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 2px; font-weight: 700; font-size: 14px; display: inline-block;">الذهاب لمركز المراسلات والردود</a>
      </div>
    `, 'ar')
  },
  {
    name: 'referral_joined',
    subject_en: 'Infrastructure Growth: Node Connectivity Extended',
    subject_ar: 'نمو البنية التحتية: انضمام مستخدم جديد لشبكتك',
    body_en: wrapper(`
      <h3 style="color: #334155; font-size: 18px; font-weight: 600;">Node Connectivity Extended</h3>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">A new system participant, <strong>{{referredUser}}</strong>, has successfully joined the Perplexta Terminal via your invitation protocol link.</p>
      <p style="color: #64748b; font-size: 13px;">Upon execution of qualified platform actions by the referred node, compensation incentives will automatically sync and ledger to your balance.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h3 style="color: #334155; font-size: 19px; font-weight: 700;">انضمام مستخدم جديد لشبكتك</h3>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">تم تسجيل انضمام بنجاح للمعرّف <strong>{{referredUser}}</strong> في منصة بيربليكستا من خلال رابط الدعوة الخاص بالبروتوكول الخاص بك.</p>
      <p style="color: #64748b; font-size: 14px;">عند قيام العقدة الجديدة بإجراء اشتراك مؤهل للمنصة، ستتم مزامنة حوافز الإحالة وإيداعها في رصيد محفظتكم تلقائياً.</p>
    `, 'ar')
  },
  {
    name: 'referral_invitation',
    subject_en: 'Exclusive Terminal Authorization Invitation - Perplexta',
    subject_ar: 'دعوة تفعيل حصرية لمنصة التحليلات - بيربليكستا',
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 25px; letter-spacing: -0.5px;">Terminal Access Invitation</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 20px;">You have been invited by <strong>{{referrerName}}</strong> to join the Perplexta Advanced Analytics Terminal.</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 35px;">The Perplexta Terminal is an elite high-capacity analytical environment. By registering through this authorized network path, your profile will be provisioned with specialized entry options.</p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{invitationLink}}" style="background-color: #0f172a; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 2px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Activate Invitation Pathway</a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; line-height: 1.6;">Invitation Reference Code: <code>{{referralCode}}</code></p>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 25px;">دعوة حصرية للدخول للمنصة</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">لقد تلقيتم دعوة خاصة من المعرّف <strong>{{referrerName}}</strong> للانضمام إلى نظام بيربليكستا للتحليلات المتقدمة.</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 35px;">منصة بيربليكستا هي بيئة تحليلية نخبوية عالية القدرة. عند تسجيلكم عبر هذا المسار المعتمد، سيتم تهيئة حسابكم الرقمي بميزات ترحيبية خاصة ومزايا حصرية للبدء.</p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{invitationLink}}" style="background-color: #0f172a; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 2px; font-weight: 700; font-size: 15px; display: inline-block;">قبول وتفعيل الدعوة</a>
      </div>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">رمز الإحالة المعتمد: <code>{{referralCode}}</code></p>
    `, 'ar')
  },
  {
    name: 'referral_reminder',
    subject_en: 'Pending Terminal Activation Reminder - Perplexta',
    subject_ar: 'تذكير تفعيل حصري معلق للمنصة - بيربليكستا',
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 25px; letter-spacing: -0.5px;">Terminal Access Reminder</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 20px;">This is a friendly reminder from your peer <strong>{{referrerName}}</strong> about your pending invitation to register at the Perplexta Advanced Analytics Terminal.</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 35px;">Complete your deposit verification pathway to unlock your professional analytical accounts and activate your credited referral incentives.</p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{invitationLink}}" style="background-color: #334155; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 2px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">Activate & Verify Now</a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; line-height: 1.6;">Invitation Reference Code: <code>{{referralCode}}</code></p>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 25px;">تذكير بتفعيل حساب الإحالة الخاص بك</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">نود تذكيركم بالدعوة الحصرية المقدمة من الزميل <strong>{{referrerName}}</strong> لإكمال تسجيلكم وتفعيل مسار إحالتكم في نظام بيربليكستا للتحليلات المتقدمة.</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 35px;">يرجى إكمال خطوات التحقق من الإيداع الخاصة بكم لتفعيل خيارات حسابكم التحليلي وعمولاتكم الترحيبية المرتبطة بالحساب.</p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{invitationLink}}" style="background-color: #334155; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 2px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">تفقد وتفعيل الحساب الآن</a>
      </div>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">رمز الإحالة المعتمد: <code>{{referralCode}}</code></p>
    `, 'ar')
  },
  {
    name: 'bulletin_ad_approved',
    subject_en: 'Logistics: ViralBook Advertisement Approved & Published - Perplexta',
    subject_ar: 'تحديث لوجستي: تم اعتماد ونشر إعلانك بنجاح في فيرال بوك - بيربليكستا',
    body_en: wrapper(`
      <h2 style="color: #334155; font-size: 22px; font-weight: 600; margin-bottom: 25px; letter-spacing: -0.5px;">Advertisement Published</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 20px;">Identity profile verified. Your advertisement <strong>"{{adTitle}}"</strong> has been successfully approved and published on Perplexta ViralBook.</p>
      <div style="background-color: #f8fafc; padding: 25px; border-left: 3px solid #334155; border-radius: 2px; margin: 25px 0;">
        <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;"><strong>Duration Terms:</strong> <span style="color: #0f172a;">{{durationDays}} Days</span></div>
        <div style="font-size: 13px; color: #64748b;"><strong>Expiration Date:</strong> <span style="color: #0f172a;">{{expiresAt}}</span></div>
      </div>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 30px;">Your campaign is now actively serving impressions and clicks within the community feed.</p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{actionUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 2px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">View Live Ad</a>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #334155; font-size: 24px; font-weight: 700; margin-bottom: 25px;">تم اعتماد ونشر الإعلان</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">تم التحقق من الامتثال. تمت الموافقة على نشر إعلانك الموسوم بـ <strong>"{{adTitle}}"</strong> ونشره بنجاح في فيرال بوك - بيربليكستا.</p>
      <div style="background-color: #f8fafc; padding: 25px; border-right: 3px solid #334155; border-radius: 2px; margin: 25px 0;">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;"><strong>مدة العرض النشط:</strong> <span style="color: #0f172a;">{{durationDays}} يوم</span></div>
        <div style="font-size: 14px; color: #64748b;"><strong>تاريخ انتهاء الصلاحية:</strong> <span style="color: #0f172a;">{{expiresAt}}</span></div>
      </div>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">حملتك الإعلانية نشطة الآن وتقوم بحصد الانطباعات والزيارات في التغذية الإخبارية للمجتمع.</p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{actionUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 2px; font-weight: 700; font-size: 14px; display: inline-block;">مشاهدة الإعلان مباشرة</a>
      </div>
    `, 'ar')
  },
  {
    name: 'bulletin_ad_rejected',
    subject_en: 'Compliance Alert: ViralBook Advertisement Rejected - Perplexta',
    subject_ar: 'تنبيه الامتثال: تم رفض نشر إعلانك في فيرال بوك - بيربليكستا',
    body_en: wrapper(`
      <h2 style="color: #ef4444; font-size: 22px; font-weight: 600; margin-bottom: 25px; letter-spacing: -0.5px;">Ad Submission Rejection</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 20px;">Your submission <strong>"{{adTitle}}"</strong> did not meet our editorial and safety guidelines.</p>
      <div style="background-color: #fef2f2; padding: 25px; border: 1px solid #fee2e2; border-radius: 2px; margin: 25px 0; color: #991b1b;">
        <div style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">Rejection Audit Reason:</div>
        <div style="font-size: 14px; font-family: sans-serif; line-height: 1.6;">{{rejectionReason}}</div>
      </div>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 30px;">If applicable, registration costs and boost funds have been automatically refunded back to your terminal wallet ledger balance.</p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{actionUrl}}" style="background-color: #ef4444; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 2px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Revise & Resubmit</a>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #ef4444; font-size: 24px; font-weight: 700; margin-bottom: 25px;">رفض نشر الإعلان في فيرال بوك</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">لم يستوفِ طلب النشر الخاص بكم لإعلان <strong>"{{adTitle}}"</strong> معايير النشر والأمان الخاصة بمنصة فيرال بوك.</p>
      <div style="background-color: #fef2f2; padding: 25px; border: 1px solid #fee2e2; border-radius: 2px; margin: 25px 0; color: #991b1b;">
        <div style="font-size: 14px; font-weight: 700; margin-bottom: 8px;">سبب رفض طلب النشر:</div>
        <div style="font-size: 15px; font-family: sans-serif; line-height: 1.6;">{{rejectionReason}}</div>
      </div>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">إذا كانت هناك رسوم مدفوعة أو تكاليف للترويج، فقد تم إرجاعها بالكامل وتغذيتها في محفظتكم الرقمية فوراً.</p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{actionUrl}}" style="background-color: #ef4444; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 2px; font-weight: 700; font-size: 14px; display: inline-block;">تعديل وإعادة التقديم</a>
      </div>
    `, 'ar')
  },
  {
    name: 'bulletin_ad_expired',
    subject_en: 'Terminal Notice: Advertisement Duration Expired - Perplexta',
    subject_ar: 'إشعار المنصة: انتهاء الفترة المخصصة لإعلانك - بيربليكستا',
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 25px; letter-spacing: -0.5px;">Advertisement Expired</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 20px;">This is an automated resource notice that your campaign <strong>"{{adTitle}}"</strong> has completed its scheduled duration terms and has expired.</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 35px;">To renew visibility, resume impressions, or boost analytics, please navigate to your dashboard and initiate a renewal campaign protocol.</p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{actionUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 2px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Renew Campaign</a>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 25px;">انتهاء صلاحية الإعلان</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">هذا إشعار تلقائي من الموارد يفيد بأن حملتك الإعلانية الموسومة بـ <strong>"{{adTitle}}"</strong> قد استكملت فترة عرضها وجدولها الزمني وتوقفت عن الظهور تلقائياً.</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 35px;">لتجديد ظهور الإعلان، استئناف الانطباعات، أو ترويج الإحصائيات، يرجى الدخول إلى لوحة التحكم الخاصة بك وتفعيل حملة جديدة.</p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="{{actionUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 2px; font-weight: 700; font-size: 15px; display: inline-block;">تجديد ونشر الحملة</a>
      </div>
    `, 'ar')
  },
  {
    name: 'bulletin_ad_inquiry_received',
    subject_en: 'Lead Update: New Customer Inquiry Received - Perplexta',
    subject_ar: 'تحديث المعاملات: وصلك استفسار زبون جديد - بيربليكستا',
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 25px; letter-spacing: -0.5px;">New Customer Inquiry</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 20px;">A potential customer <strong>{{senderName}}</strong> has initiated an inquiry regarding your advertisement: <strong>"{{adTitle}}"</strong>.</p>
      <div style="background-color: #f8fafc; padding: 25px; border-left: 3px solid #334155; font-size: 14px; font-family: sans-serif; margin: 25px 0; color: #334155; line-height: 1.8; border-radius: 2px;">
        <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">Customer Inquiry Message:</div>
        "{{messageSnippet}}"
      </div>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 30px;">To reply, view details, or schedule follow-ups, please log in to your Messenger Hub.</p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{actionUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 2px; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">Reply via Messenger</a>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 25px;">استفسار زبون جديد</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">قام الزبون المحتمل <strong>{{senderName}}</strong> بإرسال استفسار مباشر بخصوص إعلانك الموسوم بـ: <strong>"{{adTitle}}"</strong>.</p>
      <div style="background-color: #f8fafc; padding: 25px; border-right: 3px solid #334155; font-size: 15px; font-family: sans-serif; margin: 25px 0; color: #334155; line-height: 1.8; border-radius: 2px;">
        <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">محتوى رسالة الزبون:</div>
        "{{messageSnippet}}"
      </div>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">للرد على الزبون، وتفقد تفاصيل الرسالة، يرجى تسجيل الدخول إلى مركز الرسائل والمسنجر الخاص بك.</p>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{actionUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 2px; font-weight: 700; font-size: 14px; display: inline-block;">الرد عبر المسنجر</a>
      </div>
    `, 'ar')
  },
  {
    name: 'bulletin_ad_boost_activated',
    subject_en: 'Billing Update: Advertisement Boost Activated - Perplexta',
    subject_ar: 'تحديث الحساب: تفعيل حزمة ترويج الإعلان المتقدمة - بيربليكستا',
    body_en: wrapper(`
      <h2 style="color: #334155; font-size: 22px; font-weight: 600; margin-bottom: 25px; letter-spacing: -0.5px;">Campaign Boost Activated</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 20px;">Operational adjustment. Your advertisement <strong>"{{adTitle}}"</strong> has been successfully boosted.</p>
      <div style="background-color: #f0fdf4; padding: 25px; border: 1px solid #dcfce7; border-radius: 2px; margin: 25px 0; color: #166534;">
        <div style="font-size: 13px; margin-bottom: 8px;"><strong>Boost Tier Class:</strong> <span style="font-weight: 700; color: #14532d;">{{boostTier}}</span></div>
        <div style="font-size: 13px; margin-bottom: 8px;"><strong>Cost Deducted:</strong> <span style="font-weight: 700; color: #14532d;">{{boostPrice}} PTS</span></div>
        <div style="font-size: 13px;"><strong>Active Duration Until:</strong> <span style="font-weight: 700; color: #14532d;">{{boostedUntil}}</span></div>
      </div>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">Your boosted campaign will now receive priority placement, highlighted visual borders, and increased feed exposure.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #334155; font-size: 24px; font-weight: 700; margin-bottom: 25px;">تم تفعيل ترويج الحملة</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">تم تأكيد المعاملة المالية لوجستياً. تم بنجاح تفعيل خيار الترويج الفائق لإعلانك: <strong>"{{adTitle}}"</strong>.</p>
      <div style="background-color: #f0fdf4; padding: 25px; border: 1px solid #dcfce7; border-radius: 2px; margin: 25px 0; color: #166534;">
        <div style="font-size: 14px; margin-bottom: 8px;"><strong>فئة الترويج النشط:</strong> <span style="font-weight: 700; color: #14532d;">{{boostTier}}</span></div>
        <div style="font-size: 14px; margin-bottom: 8px;"><strong>التكلفة المخصومة:</strong> <span style="font-weight: 700; color: #14532d;">{{boostPrice}} نقطة</span></div>
        <div style="font-size: 14px;"><strong>تاريخ انتهاء الترويج الفائق:</strong> <span style="font-weight: 700; color: #14532d;">{{boostedUntil}}</span></div>
      </div>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">سيستمتع إعلانك المروج بظهور ذي أولوية متقدمة في واجهة التغذية الإخبارية وإطارات ملونة لزيادة التفاعل.</p>
    `, 'ar')
  },
  {
    name: 'two_factor_auth_code',
    subject_en: 'Security Verification Code - Perplexta 2FA',
    subject_ar: 'رمز التحقق الأمني - المصادقة الثنائية بيربليكستا',
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Two-Factor Authentication Code</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">A security verification attempt was initiated for account <strong>{{userName}}</strong>.</p>
      <div style="background-color: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; border-radius: 10px; margin: 25px 0; text-align: center;">
        <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Your One-Time Code:</div>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0284c7; font-family: monospace;">{{code}}</div>
      </div>
      <p style="color: #94a3b8; font-size: 12px;">This code expires in 10 minutes. Do not share this code with anyone.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 25px;">رمز المصادقة الثنائية</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">تم إجراء محاولة دخول أمنية تتطلب رمز التحقق للمعرف <strong>{{userName}}</strong>.</p>
      <div style="background-color: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; border-radius: 10px; margin: 25px 0; text-align: center;">
        <div style="font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">رمز التحقق الخاص بك:</div>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0284c7; font-family: monospace;">{{code}}</div>
      </div>
      <p style="color: #94a3b8; font-size: 13px;">ينتهي استخدام هذا الرمز خلال 10 دقائق. لا تشارك هذا الرمز مع أي شخص إطلاقاً.</p>
    `, 'ar')
  },
  {
    name: 'security_suspicious_attempt',
    subject_en: 'Critical Alert: Suspicious Activity Blocked - Perplexta Security',
    subject_ar: 'تنبيه حرج: حظر نشاط مشبوه - أمن بيربليكستا',
    body_en: wrapper(`
      <h2 style="color: #ef4444; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Suspicious Security Attempt Detected</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">Our security system intercepted and blocked an unauthorized login attempt for profile <strong>{{userName}}</strong>.</p>
      <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 20px; border-radius: 8px; margin: 25px 0; color: #991b1b;">
        <div style="font-size: 13px; margin-bottom: 6px;"><strong>Origin IP:</strong> {{ipAddress}}</div>
        <div style="font-size: 13px; margin-bottom: 6px;"><strong>Location / Device:</strong> {{deviceInfo}}</div>
        <div style="font-size: 13px;"><strong>Timestamp:</strong> {{time}}</div>
      </div>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">If this was not you, we recommend updating your password immediately.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #ef4444; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">Secure Account Now</a>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #ef4444; font-size: 24px; font-weight: 700; margin-bottom: 25px;">رصد حظر نشاط مشبوه</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">اعترض نظام الأمان وحظر محاولة دخول غير مصرح بها للحساب <strong>{{userName}}</strong>.</p>
      <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 20px; border-radius: 8px; margin: 25px 0; color: #991b1b;">
        <div style="font-size: 14px; margin-bottom: 6px;"><strong>عنوان IP المصدر:</strong> {{ipAddress}}</div>
        <div style="font-size: 14px; margin-bottom: 6px;"><strong>الجهاز / الموقع:</strong> {{deviceInfo}}</div>
        <div style="font-size: 14px;"><strong>التوقيت:</strong> {{time}}</div>
      </div>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">إذا لم تكن صاحب هذه المحاولة، نوصي بتغيير كلمة المرور الخاصة بك فوراً.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #ef4444; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">تأمين الحساب فوراً</a>
      </div>
    `, 'ar')
  },
  {
    name: 'bulletin_page_verified',
    subject_en: 'Official Update: Commercial Business Page Verified - Perplexta',
    subject_ar: 'تحديث رسمي: تم توثيق صفحتك التجارية بنجاح - بيربليكستا',
    body_en: wrapper(`
      <h2 style="color: #0284c7; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Business Verification Granted</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">Congratulations! Your corporate entity page <strong>"{{pageName}}"</strong> has been granted official verification badge status on ViralBook.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="info-card">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="info-label">Page Name:</td>
                <td><strong>{{pageName}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">Verification Badge:</td>
                <td><span style="color: #38bdf8; font-weight: 700;">✓ Verified Official Page</span></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">You now have access to verified broadcasting tools, custom vanity URLs, and enhanced client inquiry metrics.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0284c7; font-size: 24px; font-weight: 700; margin-bottom: 25px;">مبارك! تم توثيق صفحتك التجارية</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">تهانينا! تم منح صفحتكم التجارية <strong>"{{pageName}}"</strong> شارة التوثيق الرسمية والموثوقة في منصة فيرال بوك.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="info-card">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="info-label">اسم الصفحة:</td>
                <td><strong>{{pageName}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">حالة الشارة:</td>
                <td><span style="color: #38bdf8; font-weight: 700;">✓ صفحة تجارية موثوقة</span></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">يمكنكم الآن الاستفادة من أدوات النشر الموثق، الروابط المخصصة، واستقبال استفسارات التجارة مباشرة.</p>
    `, 'ar')
  },
  {
    name: 'bulletin_page_inquiry',
    subject_en: 'Business Inquiry Received for Page "{{pageName}}" - Perplexta',
    subject_ar: 'استفسار تجاري جديد لصفحة "{{pageName}}" - بيربليكستا',
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 25px;">New Commercial Prospect Inquiry</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">A client <strong>{{senderName}}</strong> sent a commercial inquiry to your verified page <strong>"{{pageName}}"</strong>.</p>
      <div style="background-color: #f8fafc; border-left: 3px solid #0284c7; padding: 20px; margin: 25px 0; color: #334155; font-size: 14px;">
        "{{messageSnippet}}"
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #0284c7; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">Reply to Client</a>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 25px;">استفسار تجاري جديد لصفحتكم</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">أرسل العميل <strong>{{senderName}}</strong> استفساراً تجارياً لصفحتكم الموثقة <strong>"{{pageName}}"</strong>.</p>
      <div style="background-color: #f8fafc; border-right: 3px solid #0284c7; padding: 20px; margin: 25px 0; color: #334155; font-size: 15px;">
        "{{messageSnippet}}"
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #0284c7; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">الرد على العميل</a>
      </div>
    `, 'ar')
  },
  {
    name: 'gpu_provider_down_alert',
    subject_en: 'Infrastructure Alert: GPU Node Offline Notice',
    subject_ar: 'تنبيه البنية التحتية: انقطاع خادم الـ GPU',
    body_en: wrapper(`
      <h2 style="color: #ef4444; font-size: 22px; font-weight: 600; margin-bottom: 25px;">GPU Infrastructure Node Offline</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">Health monitor detected an outage on compute node: <strong>{{providerName}}</strong>.</p>
      <div style="background-color: #fef2f2; padding: 20px; border: 1px solid #fee2e2; border-radius: 8px; margin: 20px 0; color: #991b1b; font-size: 13px;">
        <div><strong>Node Model:</strong> {{modelName}}</div>
        <div><strong>Endpoint:</strong> {{endpointUrl}}</div>
        <div><strong>Error Status:</strong> {{errorMessage}}</div>
      </div>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">Automated failover has rerouted multimodal tasks to backup compute nodes.</p>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #ef4444; font-size: 24px; font-weight: 700; margin-bottom: 25px;">انقطاع اتصال خادم معالجة الـ GPU</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">رصد مراقب الصحة انقطاع الاتصال بالعقدة الحسابية: <strong>{{providerName}}</strong>.</p>
      <div style="background-color: #fef2f2; padding: 20px; border: 1px solid #fee2e2; border-radius: 8px; margin: 20px 0; color: #991b1b; font-size: 14px;">
        <div><strong>نموذج العقدة:</strong> {{modelName}}</div>
        <div><strong>رابط الواجهة:</strong> {{endpointUrl}}</div>
        <div><strong>حالة الخطأ:</strong> {{errorMessage}}</div>
      </div>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">قام محرك التوجيه التلقائي بتحويل مهام الوسائط المتعددة لمزودي الاحتياط.</p>
    `, 'ar')
  },
  {
    name: 'ai_research_report_ready',
    subject_en: 'AI Terminal: Deep Academic Research Report Generated',
    subject_ar: 'المنظومة الذكية: جاهزية تقرير البحث الأكاديمي المتقدم',
    body_en: wrapper(`
      <h2 style="color: #0284c7; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Research Analysis Completed</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">Your deep academic study <strong>"{{topicTitle}}"</strong> has finished processing and is ready for export.</p>
      <div style="background-color: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 25px 0;">
        <div style="font-size: 13px; color: #64748b;"><strong>Sources Cited:</strong> {{sourcesCount}} Literature Citations</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 6px;"><strong>Execution Model:</strong> {{modelUsed}}</div>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #0284c7; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">Download Report (PDF/Word)</a>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0284c7; font-size: 24px; font-weight: 700; margin-bottom: 25px;">جاهزية التقرير والتحليل الأكاديمي</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">اكتملت معالجة دراستكم الأكاديمية العملاقة <strong>"{{topicTitle}}"</strong> وهي جاهزة للتصدير والتحميل.</p>
      <div style="background-color: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 25px 0;">
        <div style="font-size: 14px; color: #64748b;"><strong>عدد المراجع والتوثيقات:</strong> {{sourcesCount}} مرجع أكاديمي</div>
        <div style="font-size: 14px; color: #64748b; margin-top: 6px;"><strong>نموذج المعالجة:</strong> {{modelUsed}}</div>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #0284c7; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">تحميل التقرير (PDF/Word)</a>
      </div>
    `, 'ar')
  },
  {
    name: 'wallet_low_balance',
    subject_en: 'Ledger Warning: Wallet Balance Low - Perplexta',
    subject_ar: 'تنبيه السجل: رصيد المحفظة منخفض جداً - بيربليكستا',
    body_en: wrapper(`
      <h2 style="color: #b45309; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Low Ledger Balance Alert</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">Your wallet balance has dropped below the operational threshold: <strong>{{currentBalance}} PTS</strong>.</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">Please top up your wallet to avoid interruption of automated background tasks, image processing, and API queries.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #0284c7; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">Top Up Wallet Now</a>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #b45309; font-size: 24px; font-weight: 700; margin-bottom: 25px;">تنبيه: انخفاض رصيد المحفظة</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">انخفض رصيد محفظتكم الرقمية عن العتبة التشغيلية الموصى بها: <strong>{{currentBalance}} نقطة</strong>.</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">يرجى إعادة تغذية المحفظة لتجنب توقف المهام المؤتمتة ومعالجات الوسائط والذكاء الاصطناعي.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #0284c7; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">تغذية المحفظة الآن</a>
      </div>
    `, 'ar')
  },
  {
    name: 'invoice_receipt_issued',
    subject_en: 'Official Receipt: Payment Confirmed - Perplexta',
    subject_ar: 'إيصال رسمي: تم تأكيد استلام الدفعة - بيربليكستا',
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 25px;">Official Invoice & Receipt</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.7;">Payment of <strong>{{amount}}</strong> has been confirmed and officially recorded.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="info-card">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="info-label">Invoice Number:</td>
                <td><strong>{{invoiceNumber}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">Service Item:</td>
                <td><strong>{{itemDescription}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">Payment Method:</td>
                <td><strong>{{paymentMethod}}</strong></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">Download Official PDF Invoice</a>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 25px;">إيصال واستمارة سداد رسمية</h2>
      <p style="color: #475569; font-size: 16px; line-height: 1.8;">تم استلام وتأكيد سداد مبلغ <strong>{{amount}}</strong> وتسجيله رسمياً في السجل المالي.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="info-card">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="info-label">رقم الفاتورة:</td>
                <td><strong>{{invoiceNumber}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">الخدمة / المادة:</td>
                <td><strong>{{itemDescription}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">وسيلة السداد:</td>
                <td><strong>{{paymentMethod}}</strong></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">تحميل فاتورة PDF الرسمية</a>
      </div>
    `, 'ar')
  },
  {
    name: 'admin_broadcast_announcement',
    subject_en: 'Official Announcement from Perplexta Leadership',
    subject_ar: 'إعلان رسمي مهم من إدارة منصة بيربليكستا',
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 22px; font-weight: 600; margin-bottom: 25px;">{{announcementTitle}}</h2>
      <div style="font-size: 15px; line-height: 1.85; color: #334155; margin-bottom: 25px;">
        {{announcementBody}}
      </div>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{actionUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">Learn More on Platform</a>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 25px;">{{announcementTitle}}</h2>
      <div style="font-size: 16px; line-height: 1.85; color: #334155; margin-bottom: 25px;">
        {{announcementBody}}
      </div>
      <div style="text-align: center; margin: 35px 0;">
        <a href="{{actionUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">متابعة التفاصيل عبر المنصة</a>
      </div>
    `, 'ar')
  },
  {
    name: 'admin_alert_new_user',
    subject_en: '[Admin Alert] New User Registration Recorded - {{newUserName}}',
    subject_ar: '[إشعار إداري] تسجيل مستخدم جديد - {{newUserName}}',
    body_en: wrapper(`
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 20px;">👤 New User Account Provisioned</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.7;">A new member has completed identity registration on Perplexta Terminal.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="info-card">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="info-label">User Name:</td>
                <td><strong>{{newUserName}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">User Email:</td>
                <td><strong>{{newUserEmail}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">Registration IP:</td>
                <td><strong>{{registrationIp}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">Referred By:</td>
                <td><strong>{{referrerName}}</strong></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <div style="text-align: center; margin: 25px 0;">
        <a href="{{actionUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 13px; display: inline-block;">Review User in Admin ERP</a>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 20px;">👤 تسجيل مستخدم جديد في المنظومة</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.8;">سجل عضو جديد حسابه المعتمد في لوحة تحكم المنصة.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="info-card">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="info-label">اسم المستخدم:</td>
                <td><strong>{{newUserName}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">البريد الإلكتروني:</td>
                <td><strong>{{newUserEmail}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">عنوان IP:</td>
                <td><strong>{{registrationIp}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">مسجل عبر إحالة:</td>
                <td><strong>{{referrerName}}</strong></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <div style="text-align: center; margin: 25px 0;">
        <a href="{{actionUrl}}" style="background-color: #0f172a; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 13px; display: inline-block;">مراجعة الحساب في لوحة التحكم</a>
      </div>
    `, 'ar')
  },
  {
    name: 'admin_alert_plan_purchased',
    subject_en: '[Admin Alert] Subscription Plan Purchased - {{planName}}',
    subject_ar: '[إشعار إداري] ترقية وشراء خطة اشتراك - {{planName}}',
    body_en: wrapper(`
      <h2 style="color: #0284c7; font-size: 20px; font-weight: 700; margin-bottom: 20px;">💳 New Plan Subscription Purchased</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.7;">A subscription purchase was confirmed for user <strong>{{purchaserName}}</strong>.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="info-card">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="info-label">Purchaser:</td>
                <td><strong>{{purchaserName}} ({{purchaserEmail}})</strong></td>
              </tr>
              <tr>
                <td class="info-label">Plan Name:</td>
                <td><strong>{{planName}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">Amount Paid:</td>
                <td><strong style="color: #4ade80;">{{paidAmount}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">Billing Cycle:</td>
                <td><strong>{{billingCycle}}</strong></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <div style="text-align: center; margin: 25px 0;">
        <a href="{{actionUrl}}" style="background-color: #0284c7; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 13px; display: inline-block;">View Financial Ledger</a>
      </div>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #0284c7; font-size: 20px; font-weight: 700; margin-bottom: 20px;">💳 تم شراء وترقية خطة جديدة</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.8;">تم تأكيد عملية شراء اشتراك جديد للمستخدم <strong>{{purchaserName}}</strong>.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="info-card">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="info-label">المشتري:</td>
                <td><strong>{{purchaserName}} ({{purchaserEmail}})</strong></td>
              </tr>
              <tr>
                <td class="info-label">اسم الباقة:</td>
                <td><strong>{{planName}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">المبلغ المدفوع:</td>
                <td><strong style="color: #4ade80;">{{paidAmount}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">دورة الفوترة:</td>
                <td><strong>{{billingCycle}}</strong></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <div style="text-align: center; margin: 25px 0;">
        <a href="{{actionUrl}}" style="background-color: #0284c7; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 13px; display: inline-block;">عرض السجل المالي للإدارة</a>
      </div>
    `, 'ar')
  },
  {
    name: 'admin_alert_user_deleted',
    subject_en: '[Admin Security Alert] Account Deactivation / Removal - {{targetUserName}}',
    subject_ar: '[تنبيه إداري أمني] تعطيل / حذف حساب - {{targetUserName}}',
    body_en: wrapper(`
      <h2 style="color: #ef4444; font-size: 20px; font-weight: 700; margin-bottom: 20px;">⚠️ Account Deletion / Deactivation Logged</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.7;">A user account deactivation or deletion action was executed.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="info-card">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="info-label">Target Account:</td>
                <td><strong>{{targetUserName}} ({{targetUserEmail}})</strong></td>
              </tr>
              <tr>
                <td class="info-label">Executed By:</td>
                <td><strong>{{operatorName}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">Reason Code:</td>
                <td><strong>{{reasonNote}}</strong></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #ef4444; font-size: 20px; font-weight: 700; margin-bottom: 20px;">⚠️ تم تنفيذ حذف / تعطيل حساب</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.8;">تم تسجيل عملية حذف أو تعطيل حساب مستخدم في المنظومة.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="info-card">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="info-label">الحساب المستهدف:</td>
                <td><strong>{{targetUserName}} ({{targetUserEmail}})</strong></td>
              </tr>
              <tr>
                <td class="info-label">المنفّذ:</td>
                <td><strong>{{operatorName}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">سبب الإجراء:</td>
                <td><strong>{{reasonNote}}</strong></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `, 'ar')
  },
  {
    name: 'admin_alert_high_deposit',
    subject_en: '[Admin Alert] High-Value Wallet Deposit Logged - {{depositAmount}}',
    subject_ar: '[إشعار إداري] إيداع مالي كبير في المحفظة - {{depositAmount}}',
    body_en: wrapper(`
      <h2 style="color: #b45309; font-size: 20px; font-weight: 700; margin-bottom: 20px;">💎 High-Value Wallet Deposit</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.7;">A high-value wallet deposit was logged and requires auditing.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="info-card">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="info-label">Account Name:</td>
                <td><strong>{{accountName}} ({{accountEmail}})</strong></td>
              </tr>
              <tr>
                <td class="info-label">Deposit Amount:</td>
                <td><strong style="color: #4ade80;">{{depositAmount}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">Gateway Method:</td>
                <td><strong>{{paymentGateway}}</strong></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `, 'en'),
    body_ar: wrapper(`
      <h2 style="color: #b45309; font-size: 20px; font-weight: 700; margin-bottom: 20px;">💎 إيداع مالي كبير في المحفظة</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.8;">تم تسجيل إيداع مالي بقيمة مرتفعة ويتطلب تدقيق السجل.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="info-card">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td class="info-label">اسم الحساب:</td>
                <td><strong>{{accountName}} ({{accountEmail}})</strong></td>
              </tr>
              <tr>
                <td class="info-label">مبلغ الإيداع:</td>
                <td><strong style="color: #4ade80;">{{depositAmount}}</strong></td>
              </tr>
              <tr>
                <td class="info-label">وسيلة السداد:</td>
                <td><strong>{{paymentGateway}}</strong></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `, 'ar')
  }
];

