import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';
import { Activity, Clock, Cpu, RefreshCw, Server, Users, Zap } from 'lucide-react';
import { toast, SelectDropdown } from '@/design-system';
import { resolveToken } from '@/utils/tokenResolver';

interface RenderMetricItem {
  id: string;
  componentName: string;
  renderCount: number;
  timeSinceMount: number;
  renderDuration: number;
  timestamp: string;
  sessionId?: string;
}

export const AdminRenderMetricsView: React.FC = () => {
  const { token } = useAppContext();
  const [metrics, setMetrics] = useState<RenderMetricItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedComponent, setSelectedComponent] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<string>('all');

  const chartGridStroke = resolveToken('--border-default', '#27272a');
  const chartAxisStroke = resolveToken('--text-muted', '#71717a');

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/metrics/render', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.metrics)) {
          setMetrics(data.metrics);
        }
      } else {
        toast.error('فشل جلب مقاييس الأداء وعمليات الرندر / Failed to fetch render metrics');
      }
    } catch (err: any) {
      toast.error('خطأ في الاتصال بالخادم / Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      fetchMetrics();
    }, 30000); // Auto-refresh every 30s when visible

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchMetrics();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [token]);

  const componentsList = Array.from(new Set(metrics.map(m => m.componentName)));
  const sessionsList = Array.from(new Set(metrics.map(m => m.sessionId || 'unknown')));

  const filteredMetrics = metrics.filter(m => {
    if (selectedComponent !== 'all' && m.componentName !== selectedComponent) return false;
    if (selectedSession !== 'all' && (m.sessionId || 'unknown') !== selectedSession) return false;
    return true;
  });

  const totalRenders = filteredMetrics.reduce((acc, m) => acc + m.renderCount, 0);
  const avgDuration = filteredMetrics.length > 0 
    ? Math.round(filteredMetrics.reduce((acc, m) => acc + m.renderDuration, 0) / filteredMetrics.length) 
    : 0;
  const maxDuration = filteredMetrics.length > 0 
    ? Math.max(...filteredMetrics.map(m => m.renderDuration)) 
    : 0;

  const chartData = filteredMetrics.slice(0, 30).reverse().map((m, idx) => ({
    name: `#${idx + 1} (${m.componentName})`,
    duration: m.renderDuration,
    timeSinceMount: m.timeSinceMount,
    renders: m.renderCount,
    timestamp: new Date(m.timestamp).toLocaleTimeString()
  }));

  const componentLatencyMap: { [key: string]: { totalDuration: number; count: number } } = {};
  filteredMetrics.forEach(m => {
    if (!componentLatencyMap[m.componentName]) {
      componentLatencyMap[m.componentName] = { totalDuration: 0, count: 0 };
    }
    componentLatencyMap[m.componentName].totalDuration += m.renderDuration;
    componentLatencyMap[m.componentName].count += 1;
  });

  const barChartData = Object.keys(componentLatencyMap).map(comp => ({
    componentName: comp,
    avgDuration: Math.round(componentLatencyMap[comp].totalDuration / componentLatencyMap[comp].count)
  }));

  return (
    <div className="p-6 space-y-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-[var(--border-default)]">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-[var(--accent)] animate-pulse" />
            <span>مراقبة زمن الانتقال وأداء المكونات (Render & Latency Telemetry)</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            لوحة تحكم المشرفين لمراقبة مقاييس أداء مكونات الواجهة وزمن الاستجابة عبر جلسات المستخدمين الحية
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--fg-on-emphasis)] rounded-[var(--radius-md)] text-sm font-bold transition-colors duration-base shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث البيانات / Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">إجمالي عمليات الرندر</span>
            <Cpu className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="text-3xl font-bold font-mono">{totalRenders}</div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">عبر الفلتر المحدد</p>
        </div>

        <div className="p-5 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">متوسط زمن الاستجابة (Latency)</span>
            <Clock className="w-5 h-5 text-[var(--fg-accent)]" />
          </div>
          <div className="text-3xl font-bold font-mono">{avgDuration} ms</div>
          <p className="text-xs text-[var(--accent)] mt-1">أداء ممتاز واستجابة فورية</p>
        </div>

        <div className="p-5 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">أقصى زمن رندر مسجل</span>
            <Zap className="w-5 h-5 text-[var(--fg-warning)]" />
          </div>
          <div className="text-3xl font-bold font-mono">{maxDuration} ms</div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">ذروة التحميل القياسية</p>
        </div>

        <div className="p-5 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-sm">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">الجلسات النشطة</span>
            <Users className="w-5 h-5 text-[var(--fg-accent)]" />
          </div>
          <div className="text-3xl font-bold font-mono">{sessionsList.length}</div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">جلسات مستخدمين نشطة</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-[var(--radius-md)] border flex flex-wrap items-center gap-4 bg-[var(--surface-subtle)] border-[var(--border-default)]">
        <div className="flex items-center gap-2 min-w-[240px]">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase shrink-0">المكون (Component):</span>
          <div className="flex-1 min-w-[180px]">
            <SelectDropdown
              size="sm"
              value={selectedComponent}
              onChange={(val) => setSelectedComponent(val)}
              options={[
                { value: 'all', label: 'جميع المكونات (All Components)' },
                ...componentsList.map(c => ({ value: c, label: c }))
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-[240px]">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase shrink-0">معرف الجلسة (Session):</span>
          <div className="flex-1 min-w-[180px]">
            <SelectDropdown
              size="sm"
              value={selectedSession}
              onChange={(val) => setSelectedSession(val)}
              options={[
                { value: 'all', label: 'جميع الجلسات (All Sessions)' },
                ...sessionsList.map(s => ({ value: s, label: s }))
              ]}
            />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart: Latency Trend */}
        <div className="p-5 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-sm">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
            <Activity className="w-4 h-4 text-[var(--accent)]" />
            <span>مخطط زمن استجابة الرندر (Render Latency Area Trend)</span>
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="name" stroke={chartAxisStroke} fontSize={11} />
                <YAxis stroke={chartAxisStroke} fontSize={11} unit="ms" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--surface-card)', 
                    borderColor: 'var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)'
                  }} 
                />
                <Area type="monotone" dataKey="duration" name="مدة الرندر (ms)" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Average Latency per Component */}
        <div className="p-5 rounded-[var(--radius-md)] border bg-[var(--surface-card)] border-[var(--border-default)] shadow-sm">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
            <Server className="w-4 h-4 text-[var(--accent)]" />
            <span>متوسط زمن الرندر حسب المكون (Avg Latency per Component)</span>
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="componentName" stroke={chartAxisStroke} fontSize={10} angle={-15} textAnchor="end" />
                <YAxis stroke={chartAxisStroke} fontSize={11} unit="ms" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--surface-card)', 
                    borderColor: 'var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)'
                  }} 
                />
                <Bar dataKey="avgDuration" name="متوسط المدة (ms)" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Telemetry Table */}
      <div className="rounded-[var(--radius-md)] border overflow-hidden bg-[var(--surface-card)] border-[var(--border-default)] shadow-sm">
        <div className="p-4 border-b border-[var(--border-default)] font-semibold flex items-center justify-between text-[var(--text-primary)]">
          <span>سجل القياسات الحية المفصلة (Detailed Telemetry Log)</span>
          <span className="text-xs font-normal text-[var(--text-muted)]">عرض أحدث {filteredMetrics.length} عملية</span>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-semibold uppercase tracking-wider bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-secondary)]">
                <th className="p-3">اسم المكون</th>
                <th className="p-3">عدد الرندرات</th>
                <th className="p-3">مدة الرندر</th>
                <th className="p-3">منذ بدء التشغيل</th>
                <th className="p-3">معرف الجلسة</th>
                <th className="p-3">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-mono">
              {filteredMetrics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">
                    لا توجد مقاييس مسجلة حالياً
                  </td>
                </tr>
              ) : (
                filteredMetrics.map((m) => (
                  <tr key={m.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                    <td className="p-3 font-semibold text-[var(--accent)] font-sans">{m.componentName}</td>
                    <td className="p-3 text-[var(--text-primary)]">{m.renderCount}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-[var(--radius-xs)] text-xs ${m.renderDuration > 30 ? 'bg-[var(--status-warning-subtle)]/10 text-[var(--fg-warning)] border border-[var(--status-warning)]/20' : 'bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] border border-[var(--border-accent)]'}`}>
                        {m.renderDuration} ms
                      </span>
                    </td>
                    <td className="p-3 text-[var(--text-muted)]">{m.timeSinceMount} ms</td>
                    <td className="p-3 text-xs text-[var(--text-muted)]">{m.sessionId || 'N/A'}</td>
                    <td className="p-3 text-xs text-[var(--text-muted)]">{new Date(m.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
