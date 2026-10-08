import React, { useState, useMemo } from 'react';
import { Artifact } from '../../../types/artifact';
import { useAppContext } from '../../../context/AppContext';
import { useArtifact } from '../../../context/ArtifactContext';
import { Logo } from '../../common/Logo';
import { toPng } from 'html-to-image';
import {
  Sparkles,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Camera,
  Download,
  Send,
  Check,
  RefreshCw,
  Cpu,
  Layers,
  Code2,
  FileText,
  SlidersHorizontal,
  PlusCircle,
  Copy,
  Info
} from 'lucide-react';
import { toast } from '@/design-system';
import { resolveToken } from '@/utils/tokenResolver';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface ArtifactAIAnalysisProps {
  artifact: Artifact;
}

// Sample initial data for interactive data inspection
const DEFAULT_DATASET = [
  { name: 'الربع 1', value: 420, secondary: 240, share: 30 },
  { name: 'الربع 2', value: 680, secondary: 390, share: 45 },
  { name: 'الربع 3', value: 950, secondary: 580, share: 65 },
  { name: 'الربع 4', value: 1240, secondary: 820, share: 85 }
];

const CHART_COLORS = ['#0891b2', '#06b6d4', '#3b82f6', '#10b981', '#f59e0b'];

export function ArtifactAIAnalysis({ artifact }: ArtifactAIAnalysisProps) {
  const { language } = useAppContext();
  const { updateArtifactContent, setActiveTab } = useArtifact();
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [copiedAnalysis, setCopiedAnalysis] = useState(false);

  const isAr = language === 'ar';

  const chartGridColor = resolveToken('--border-default', '#334155');
  const chartTextColor = resolveToken('--text-secondary', '#94a3b8');
  const chartTooltipBg = resolveToken('--surface-card', '#0f172a');
  const chartTooltipBorder = resolveToken('--border-default', '#334155');
  const snapshotBg = resolveToken('--surface-page', '#0b101b');

  // Structural inspection metrics
  const inspection = useMemo(() => {
    const content = artifact.content || '';
    const lineCount = content.split('\n').length;
    const charCount = content.length;
    const hasCanvas = content.includes('<canvas');
    const hasSvg = content.includes('<svg') || artifact.type === 'svg';
    const hasForm = content.includes('<form') || content.includes('<input');
    const hasTailwind = content.includes('tailwind') || content.includes('class="');
    const hasCharts = content.includes('Chart') || content.includes('recharts') || content.includes('d3');
    const hasReact = artifact.type === 'react' || content.includes('React');

    const detectedTech: string[] = [];
    if (hasReact) detectedTech.push('React 18');
    if (artifact.type === 'html') detectedTech.push('HTML5 Semantic');
    if (hasTailwind) detectedTech.push('Tailwind CSS');
    if (hasCanvas) detectedTech.push('Canvas 2D Engine');
    if (hasSvg) detectedTech.push('Scalable Vector (SVG)');
    if (hasCharts) detectedTech.push('Data Charts');
    if (hasForm) detectedTech.push('Interactive Inputs');

    return {
      lineCount,
      charCount,
      detectedTech,
      complexityScore: Math.min(100, Math.round((lineCount * 0.8) + (detectedTech.length * 12)))
    };
  }, [artifact]);

  // Capture Visual Snapshot using html-to-image
  const handleCaptureSnapshot = async () => {
    setIsCapturing(true);
    try {
      // Find the preview iframe inside document
      const iframe = document.querySelector('iframe[title="Artifact Preview"]') as HTMLIFrameElement;
      if (!iframe || !iframe.contentDocument || !iframe.contentDocument.body) {
        toast.info(isAr ? 'يرجى التبديل لتبويب المعاينة أولاً لالتقاط الصورة' : 'Please switch to Preview tab first to capture snapshot');
        setIsCapturing(false);
        return;
      }

      const dataUrl = await toPng(iframe.contentDocument.body, {
        cacheBust: true,
        quality: 0.95,
        backgroundColor: snapshotBg
      });

      setSnapshotUrl(dataUrl);
      toast.success(isAr ? 'تم التقاط صورة الكانفاس البصرية بنجاح' : 'Visual snapshot captured successfully');
    } catch (err) {
      toast.error(isAr ? 'تعذر التقاط الصورة التفاعلية حالياً' : 'Failed to capture snapshot');
    } finally {
      setIsCapturing(false);
    }
  };

  // Dispatch prompt to Chat Assistant
  const handleSendPromptToAssistant = (customPrompt: string) => {
    window.dispatchEvent(new CustomEvent('insert_to_prompt', { detail: customPrompt }));
    toast.success(isAr ? 'تم إدراج الأمر في صندوق المحادثة للمساعد الذكي' : 'Inserted prompt into chat for AI Assistant');
  };

  // Inject a complete interactive Data Chart into the current code
  const handleInjectChart = (chartType: 'bar' | 'line' | 'pie') => {
    const isHtml = artifact.type === 'html' || artifact.content.includes('<html') || artifact.content.includes('<!DOCTYPE');

    let snippet = '';
    if (isHtml) {
      snippet = `
<!-- ==============================================
     PERPLEXTA INTERACTIVE DATA CHART COMPONENT
     ============================================== -->
<div class="my-6 p-6 bg-[var(--surface-card)] rounded-[var(--radius-md)] border border-[var(--border-default)] shadow-sm font-sans">
  <div class="flex items-center justify-between mb-4">
    <div>
      <h3 class="text-base font-bold text-[var(--text-primary)]">مؤشرات الأداء والتحليل البياني</h3>
      <p class="text-xs text-[var(--text-secondary)]">تحديث مباشر للبيانات عبر محرك بيربليكستا</p>
    </div>
    <span class="px-2 py-1 text-[10px] font-bold bg-[var(--surface-inset)] text-[var(--fg-accent)] rounded-md border border-[var(--border-default)]">
      ${chartType.toUpperCase()} DATA
    </span>
  </div>
  <div style="position: relative; height: 260px; width: 100%;">
    <canvas id="perplextaInteractiveChart"></canvas>
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  (function() {
    const ctx = document.getElementById('perplextaInteractiveChart');
    if (ctx) {
      new Chart(ctx, {
        type: '${chartType}',
        data: {
          labels: ['الربع 1', 'الربع 2', 'الربع 3', 'الربع 4'],
          datasets: [{
            label: 'مؤشر النمو المالي',
            data: [420, 680, 950, 1240],
            backgroundColor: ['rgba(8, 145, 178, 0.7)', 'rgba(6, 182, 212, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)'],
            borderColor: '#0891b2',
            borderWidth: 2,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { font: { family: 'Tajawal' } } } }
        }
      });
    }
  })();
</script>
`;
    } else {
      snippet = `
// Perplexta Data Chart Snippet
const dataMetrics = [
  { quarter: 'Q1', value: 420 },
  { quarter: 'Q2', value: 680 },
  { quarter: 'Q3', value: 950 },
  { quarter: 'Q4', value: 1240 }
];
`;
    }

    let updated = artifact.content;
    if (updated.includes('</body>')) {
      updated = updated.replace('</body>', `${snippet}\n</body>`);
    } else {
      updated = updated + '\n' + snippet;
    }

    updateArtifactContent(updated);
    setActiveTab('preview');
    toast.success(isAr ? 'تم إدراج المخطط البياني في الكود وتحديث المعاينة!' : 'Chart injected into code and preview updated!');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--surface-page)] text-[var(--text-primary)] overflow-y-auto p-4 sm:p-6 space-y-6 select-text custom-scrollbar">
      
      {/* 1. Header Overview & Architecture Insights */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md p-4 sm:p-5 shadow-sm transition-theme">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-shape-sm bg-[var(--surface-inset)] border border-[var(--border-default)] flex items-center justify-center text-[var(--fg-accent)] shrink-0">
              <Logo size={22} fallbackType="cpu" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                {isAr ? 'استوديو تحليل البيانات والذكاء الاصطناعي المتعدد' : 'Data & Multimodal AI Studio'}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {isAr ? 'تحليل مباشر للشفرة البرمجية، الرسوم البيانية، والفحص البصري التفاعلي' : 'Real-time code inspection, interactive charts, and visual intelligence'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              disabled={isCapturing}
              className="flex items-center gap-1.5 px-3.5 h-8 rounded-shape-sm text-xs font-bold bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--surface-inset)] transition-theme cursor-pointer relative before:absolute before:-inset-1.5 before:content-[''] disabled:opacity-50"
              title={isAr ? 'التقاط صورة بصرية للكانفاس' : 'Capture Canvas Snapshot'}
            >
              <Camera size={14} className={isCapturing ? 'animate-spin' : ''} />
              <span>{isCapturing ? (isAr ? 'جارِ الالتقاط...' : 'Capturing...') : (isAr ? 'التقاط صورة بصرية' : 'Capture Snapshot')}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-shape-sm p-3">
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[var(--text-muted)]">
              <Code2 size={12} />
              <span>{isAr ? 'الأسطر البرمجية' : 'Code Lines'}</span>
            </div>
            <div className="text-lg font-mono font-extrabold text-[var(--text-primary)] mt-1">
              {inspection.lineCount}
            </div>
          </div>

          <div className="bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-shape-sm p-3">
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[var(--text-muted)]">
              <FileText size={12} />
              <span>{isAr ? 'حجم المحتوى' : 'Characters'}</span>
            </div>
            <div className="text-lg font-mono font-extrabold text-[var(--text-primary)] mt-1">
              {(inspection.charCount / 1024).toFixed(1)} <span className="text-xs font-normal text-[var(--text-muted)]">KB</span>
            </div>
          </div>

          <div className="bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-shape-sm p-3">
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[var(--text-muted)]">
              <Layers size={12} />
              <span>{isAr ? 'التقنيات المرصودة' : 'Technologies'}</span>
            </div>
            <div className="text-lg font-mono font-extrabold text-[var(--text-primary)] mt-1">
              {inspection.detectedTech.length}
            </div>
          </div>

          <div className="bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-shape-sm p-3">
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[var(--text-muted)]">
              <Cpu size={12} />
              <span>{isAr ? 'مؤشر الكفاءة' : 'Efficiency Score'}</span>
            </div>
            <div className="text-lg font-mono font-extrabold text-[var(--fg-success)] mt-1">
              {inspection.complexityScore}/100
            </div>
          </div>
        </div>

        {/* Technology Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-[var(--border-default)]">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">
            {isAr ? 'البيئة المرصودة:' : 'Detected Tech:'}
          </span>
          {inspection.detectedTech.map((tech, idx) => (
            <span
              key={idx}
              className="text-[10px] font-bold bg-[var(--surface-inset)] text-[var(--text-secondary)] border border-[var(--border-default)] px-2.5 py-1 rounded-shape-sm"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* 2. Interactive Data & Live Chart Playground */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md p-4 sm:p-5 shadow-sm transition-theme">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-[var(--fg-accent)]" />
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
              {isAr ? 'معاينة الرسوم البيانية المباشرة (Data Visualizer)' : 'Live Chart Visualization Sandbox'}
            </h3>
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center p-0.5 bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-shape-sm">
            <button
              type="button"
              onClick={() => setSelectedChartType('bar')}
              className={`flex items-center gap-1 px-2.5 h-8 rounded-shape-sm text-[11px] font-bold transition-theme cursor-pointer relative before:absolute before:-inset-1.5 before:content-[''] ${
                selectedChartType === 'bar'
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <BarChart3 size={12} />
              <span>{isAr ? 'أعمدة' : 'Bar'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedChartType('line')}
              className={`flex items-center gap-1 px-2.5 h-8 rounded-shape-sm text-[11px] font-bold transition-theme cursor-pointer relative before:absolute before:-inset-1.5 before:content-[''] ${
                selectedChartType === 'line'
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <LineChartIcon size={12} />
              <span>{isAr ? 'خطي' : 'Line'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedChartType('pie')}
              className={`flex items-center gap-1 px-2.5 h-8 rounded-shape-sm text-[11px] font-bold transition-theme cursor-pointer relative before:absolute before:-inset-1.5 before:content-[''] ${
                selectedChartType === 'pie'
                  ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <PieChartIcon size={12} />
              <span>{isAr ? 'دائري' : 'Pie'}</span>
            </button>
          </div>
        </div>

        {/* Live Chart Rendering Container */}
        <div className="h-64 w-full bg-[var(--surface-inset)]/50 border border-[var(--border-default)] rounded-shape-sm p-3">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChartType === 'bar' ? (
              <BarChart data={DEFAULT_DATASET} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} opacity={0.6} />
                <XAxis dataKey="name" stroke={chartTextColor} fontSize={11} tickLine={false} />
                <YAxis stroke={chartTextColor} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    borderColor: chartTooltipBorder,
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: resolveToken('--text-primary', '#e6edf3')
                  }}
                />
                <Bar dataKey="value" fill="#0891b2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="secondary" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            ) : selectedChartType === 'line' ? (
              <LineChart data={DEFAULT_DATASET} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} opacity={0.6} />
                <XAxis dataKey="name" stroke={chartTextColor} fontSize={11} tickLine={false} />
                <YAxis stroke={chartTextColor} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    borderColor: chartTooltipBorder,
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: resolveToken('--text-primary', '#e6edf3')
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#0891b2" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="secondary" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            ) : (
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    borderColor: chartTooltipBorder,
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: resolveToken('--text-primary', '#e6edf3')
                  }}
                />
                <Pie
                  data={DEFAULT_DATASET}
                  dataKey="share"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={35}
                  paddingAngle={4}
                >
                  {DEFAULT_DATASET.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Inject Chart Button */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-default)]">
          <span className="text-[11px] text-[var(--text-muted)]">
            {isAr ? 'يمكنك حقن هذا المخطط مباشرة داخل كود المشروع الحالي' : 'Inject this interactive chart directly into current artifact'}
          </span>
          <button
            type="button"
            onClick={() => handleInjectChart(selectedChartType)}
            className="flex items-center gap-1.5 px-4 h-8 text-xs font-bold rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 transition-theme cursor-pointer shadow-sm relative before:absolute before:-inset-1.5 before:content-['']"
          >
            <PlusCircle size={14} />
            <span>{isAr ? 'إدراج المخطط في الكود والتنفيذ ↗' : 'Inject Chart into Code ↗'}</span>
          </button>
        </div>
      </div>

      {/* 3. Multimodal Visual Snapshot & Inspection */}
      {snapshotUrl && (
        <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md p-4 sm:p-5 shadow-sm transition-theme">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-[var(--fg-success)]" />
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                {isAr ? 'الصورة البصرية الملتقطة للكانفاس' : 'Captured Visual Canvas'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={snapshotUrl}
                download={`${artifact.title || 'artifact-snapshot'}.png`}
                className="flex items-center gap-1 px-3 h-8 text-[11px] font-bold bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-shape-sm border border-[var(--border-default)] transition-theme relative before:absolute before:-inset-1.5 before:content-['']"
              >
                <Download size={12} />
                <span>{isAr ? 'تنزيل PNG' : 'Download PNG'}</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  const prompt = isAr
                    ? `يرجى إجراء تحليل بصري دقيق لواجهة وتصميم هذا الملف (${artifact.title}) مع فحص التباين والخطوط وتوافق الهوية البصرية لبيربليكستا.`
                    : `Please conduct a deep visual analysis of this artifact (${artifact.title}), evaluating typography, layout hierarchy, and contrast.`;
                  handleSendPromptToAssistant(prompt);
                }}
                className="flex items-center gap-1.5 px-3.5 h-8 text-[11px] font-bold bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] rounded-shape-sm hover:opacity-90 transition-theme cursor-pointer relative before:absolute before:-inset-1.5 before:content-['']"
              >
                <Send size={12} />
                <span>{isAr ? 'تحليل بصري عبر المساعد ↗' : 'Analyze with AI Assistant ↗'}</span>
              </button>
            </div>
          </div>

          <div className="relative rounded-shape-sm overflow-hidden border border-[var(--border-default)] max-h-72 flex items-center justify-center bg-[var(--surface-subtle)]">
            <img
              src={snapshotUrl}
              alt="Artifact Snapshot"
              className="max-h-72 w-auto object-contain rounded-shape-xs"
            />
          </div>
        </div>
      )}

      {/* 4. One-Click Multimodal AI Action Prompts */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-md p-4 sm:p-5 shadow-sm transition-theme">
        <div className="flex items-center gap-2 mb-3">
          <Logo size={18} fallbackType="cpu" />
          <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
            {isAr ? 'إجراءات الذكاء الاصطناعي السريعة (One-Click AI Prompts)' : 'Quick AI Actions & Prompts'}
          </h3>
        </div>

        <p className="text-xs text-[var(--text-muted)] mb-4">
          {isAr
            ? 'انقر على أي من الأوامر التالية لإرسالها مباشرة للمساعد الذكي لإعادة تحسين الكود أو إضافة مميزات جديدة:'
            : 'Click any of the prompts below to instruct the AI assistant to refine the code or introduce new capabilities:'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleSendPromptToAssistant(
              isAr
                ? `قم بتحليل وتدقيق الشفرة البرمجية للملف ${artifact.title} بالكامل، واقترح تحسينات لأداء الذاكرة وسرعة المعالجة وتنسيق المظهر.`
                : `Audit and review the code for ${artifact.title}, suggesting performance optimizations and cleaner styling.`
            )}
            className="flex items-center justify-between p-3 min-h-[44px] text-right rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-inset)] transition-theme cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[var(--fg-accent)]" />
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {isAr ? 'تحليل معماري وتدقيق أداء الكود' : 'Deep Architecture & Performance Audit'}
              </span>
            </div>
            <Send size={12} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => handleSendPromptToAssistant(
              isAr
                ? `قم بإعادة صياغة تصميم ${artifact.title} ليتوافق بدقة مع الهوية البصرية لبيربليكستا (Perplexta M3) مع درجات الألوان الهادئة وخط Tajawal والتباين العالي.`
                : `Restyle ${artifact.title} to strictly conform with Perplexta Material Design 3 tokens, Tajawal font, and high-contrast surfaces.`
            )}
            className="flex items-center justify-between p-3 min-h-[44px] text-right rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-inset)] transition-theme cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[var(--fg-info)]" />
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {isAr ? 'مواءمة التصميم مع هوية Perplexta M3' : 'Align with Perplexta M3 Visual Identity'}
              </span>
            </div>
            <Send size={12} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => handleSendPromptToAssistant(
              isAr
                ? `أضف لوحة تحليلات وإحصائيات تفاعلية غنية بالرسوم البيانية (Interactive Dashboard) إلى ${artifact.title} مع بطاقات KPI ورسوم دائرية وأعمدة.`
                : `Add an interactive analytics dashboard with KPI cards and charts to ${artifact.title}.`
            )}
            className="flex items-center justify-between p-3 min-h-[44px] text-right rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-inset)] transition-theme cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[var(--fg-success)]" />
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {isAr ? 'تحويل إلى لوحة بيانات وإحصائيات متكاملة' : 'Convert into Full Analytics Dashboard'}
              </span>
            </div>
            <Send size={12} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => handleSendPromptToAssistant(
              isAr
                ? `افحص إمكانية الوصول والتوافق مع معايير WCAG AA وحجم الأزرار اللمسية 44px في كود ${artifact.title} وتأكد من عمله بسلاسة على كافة الشاشات.`
                : `Audit accessibility, WCAG AA contrast, and 44px touch targets in ${artifact.title}.`
            )}
            className="flex items-center justify-between p-3 min-h-[44px] text-right rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-inset)] transition-theme cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[var(--fg-warning)]" />
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {isAr ? 'فحص التوافقية وإمكانية الوصول WCAG' : 'Accessibility & WCAG AA Compliance Check'}
              </span>
            </div>
            <Send size={12} className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
          </button>
        </div>
      </div>

    </div>
  );
}
