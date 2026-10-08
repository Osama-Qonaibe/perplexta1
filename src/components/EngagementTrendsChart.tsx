import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'motion/react';
import { TrendingUp, Activity, BarChart2, Sparkles, Zap, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { resolveToken } from '@/utils/tokenResolver';

export interface TrendDataPoint {
  date: Date;
  dateStr: string;
  clicks: number;
  matchScore: number;
  impressions: number;
  conversions: number;
  topCategoryAr: string;
  topCategoryEn: string;
}

interface EngagementTrendsChartProps {
  initialTimeframe?: '7d' | '30d' | '90d';
}

export const EngagementTrendsChart: React.FC<EngagementTrendsChartProps> = ({
  initialTimeframe = '30d',
}) => {
  const { language } = useAppContext();
  const isRtl = language === 'ar';
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>(initialTimeframe);
  const [activeMetric, setActiveMetric] = useState<'clicks' | 'matchScore' | 'impressions' | 'conversions'>('clicks');
  const [data, setData] = useState<TrendDataPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<TrendDataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isMobileChartExpanded, setIsMobileChartExpanded] = useState<boolean>(false);

  useEffect(() => {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const points: TrendDataPoint[] = [];
    const now = new Date();

    const categoriesAr = ['أدوات الذكاء الاصطناعي', 'الأكواد والأنظمة', 'إعلانات مستقلة', 'خدمات الأعمال'];
    const categoriesEn = ['AI Productivity Tools', 'Code & SaaS Assets', 'Freelance Bulletin Ads', 'Enterprise Services'];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });

      const baseProgress = (days - i) / days;
      const wave = Math.sin(baseProgress * Math.PI * 3) * 15;
      const randomNoise = Math.floor(Math.random() * 12) - 5;

      const clicks = Math.max(12, Math.floor(45 + baseProgress * 60 + wave + randomNoise));
      const matchScore = Math.min(99, Math.max(82, Math.floor(88 + Math.sin(i * 0.4) * 6 + Math.random() * 4)));
      const impressions = Math.floor(clicks * (3.8 + Math.random() * 1.2));
      const conversions = Math.max(2, Math.floor(clicks * (0.18 + Math.random() * 0.08)));

      const catIdx = Math.floor((clicks + i) % categoriesAr.length);

      points.push({
        date,
        dateStr,
        clicks,
        matchScore,
        impressions,
        conversions,
        topCategoryAr: categoriesAr[catIdx],
        topCategoryEn: categoriesEn[catIdx],
      });
    }

    setData(points);
  }, [timeframe, language]);

  useEffect(() => {
    if (!data.length || !svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clean canvas on re-render

    const containerWidth = containerRef.current.clientWidth || 600;
    const height = 280;
    const margin = { top: 20, right: 30, bottom: 35, left: 45 };
    const width = containerWidth - margin.left - margin.right;

    svg.attr('width', containerWidth).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const strokeColor = resolveToken('--accent', '#06b6d4');
    const gridColor = resolveToken('--border-default', 'rgba(255, 255, 255, 0.07)');
    const textColor = resolveToken('--text-secondary', '#94a3b8');
    const dotStrokeColor = resolveToken('--surface-page', '#0f172a');

    const defs = svg.append('defs');

    const gradient = defs
      .append('linearGradient')
      .attr('id', 'accent-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', strokeColor)
      .attr('stop-opacity', 0.35);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', strokeColor)
      .attr('stop-opacity', 0.0);

    const filter = defs.append('filter').attr('id', 'accent-glow').attr('height', '130%');
    filter.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', 3).attr('result', 'blur');
    filter.append('feOffset').attr('in', 'blur').attr('dx', 0).attr('dy', 2).attr('result', 'offsetBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'offsetBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, width]);

    const yMax = (d3.max(data, (d) => d[activeMetric]) || 100) * 1.15;
    const yScale = d3.scaleLinear().domain([0, yMax]).range([height - margin.top - margin.bottom, 0]);

    const yGrid = d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(() => '');
    g.append('g')
      .attr('class', 'grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', gridColor)
      .attr('stroke-dasharray', '3,3');

    const area = d3
      .area<TrendDataPoint>()
      .x((d) => xScale(d.date))
      .y0(height - margin.top - margin.bottom)
      .y1((d) => yScale(d[activeMetric]))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#accent-area-gradient)')
      .attr('d', area);

    const line = d3
      .line<TrendDataPoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d[activeMetric]))
      .curve(d3.curveMonotoneX);

    const path = g
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', strokeColor)
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#accent-glow)')
      .attr('d', line);

    const totalLength = (path.node() as SVGPathElement)?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(data.length, containerWidth < 480 ? 4 : 8))
      .tickFormat((d) => d3.timeFormat(language === 'ar' ? '%b %d' : '%b %d')(d as Date));

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => {
        const val = d.valueOf();
        if (activeMetric === 'matchScore') return `${val}%`;
        if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
        return `${val}`;
      });

    g.append('g')
      .attr('transform', `translate(0, ${height - margin.top - margin.bottom})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', textColor)
      .attr('font-size', '10px')
      .attr('font-weight', '600');

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', textColor)
      .attr('font-size', '10px')
      .attr('font-weight', '600');

    g.selectAll('.domain').attr('stroke', gridColor);

    const crosshair = g
      .append('line')
      .attr('y1', 0)
      .attr('y2', height - margin.top - margin.bottom)
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
      .style('opacity', 0);

    const focusDot = g
      .append('circle')
      .attr('r', 5)
      .attr('fill', strokeColor)
      .attr('stroke', dotStrokeColor)
      .attr('stroke-width', 2.5)
      .style('opacity', 0);

    g.append('rect')
      .attr('width', width)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'transparent')
      .on('mousemove touchmove', function (event) {
        const [mouseX] = d3.pointer(event, this);
        const xDate = xScale.invert(mouseX);
        const bisect = d3.bisector((d: TrendDataPoint) => d.date).left;
        const index = bisect(data, xDate, 1);
        const d0 = data[index - 1];
        const d1 = data[index];
        let d = d0;
        if (d1 && d0) {
          d = xDate.getTime() - d0.date.getTime() > d1.date.getTime() - xDate.getTime() ? d1 : d0;
        }

        if (d) {
          const cx = xScale(d.date);
          const cy = yScale(d[activeMetric]);

          crosshair.attr('x1', cx).attr('x2', cx).style('opacity', 0.8);
          focusDot.attr('cx', cx).attr('cy', cy).style('opacity', 1);

          setHoveredPoint(d);
          setTooltipPos({ x: cx + margin.left, y: cy + margin.top });
        }
      })
      .on('mouseleave touchend', () => {
        crosshair.style('opacity', 0);
        focusDot.style('opacity', 0);
        setHoveredPoint(null);
        setTooltipPos(null);
      });
  }, [data, activeMetric, language, isMobileChartExpanded]);

  const totalClicks = data.reduce((acc, curr) => acc + curr.clicks, 0);
  const avgMatch = data.length ? (data.reduce((acc, curr) => acc + curr.matchScore, 0) / data.length).toFixed(1) : '94.5';
  const totalImpressions = data.reduce((acc, curr) => acc + curr.impressions, 0);
  const totalConversions = data.reduce((acc, curr) => acc + curr.conversions, 0);

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Header Controls & Metric Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--bg-accent-muted)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
            <TrendingUp size={16} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-1">
              <span>{isRtl ? 'تحليلات اتجاهات التفاعل والدقة' : 'Engagement & Accuracy Trends'}</span>
              <span className="ide-badge-info shrink-0">
                D3 Visualizer
              </span>
            </h3>
            <p className="text-[10px] sm:text-xs text-[var(--text-muted)]">
              {isRtl ? 'مخطط بياني زمني يوضح سرعة التفاعل ودقة مطابقة التوصيات الحقيقية' : 'Real-time timeline tracking recommendation velocity and match precision'}
            </p>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 bg-[var(--surface-subtle)] p-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] self-end sm:self-auto">
          {(['7d', '30d', '90d'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-[var(--radius-xs)] text-xs font-bold transition-colors cursor-pointer ${
                timeframe === tf
                  ? 'bg-[var(--accent)] text-white shadow-2xs font-extrabold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tf === '7d' ? (isRtl ? '7 أيام' : '7 Days') : tf === '30d' ? (isRtl ? '30 يوم' : '30 Days') : (isRtl ? '90 يوم' : '90 Days')}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <button
          onClick={() => setActiveMetric('clicks')}
          className={`p-2.5 sm:p-3 rounded-[var(--radius-sm)] border text-start transition-colors cursor-pointer ${
            activeMetric === 'clicks'
              ? 'border-[var(--accent)] bg-[var(--bg-accent-muted)] shadow-2xs'
              : 'border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--border-strong)]'
          }`}
        >
          <p className="text-[10px] font-bold text-[var(--text-muted)] flex items-center justify-between">
            <span className="truncate">{isRtl ? 'نقرات التوصيات' : 'Total Recommendation Clicks'}</span>
            <Activity size={12} className="text-[var(--accent)] shrink-0 ms-1" />
          </p>
          <p className="text-sm sm:text-base font-black text-[var(--text-primary)] mt-1">{totalClicks.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-[var(--accent)] mt-0.5">+18.4% WoW</p>
        </button>

        <button
          onClick={() => setActiveMetric('matchScore')}
          className={`p-2.5 sm:p-3 rounded-[var(--radius-sm)] border text-start transition-colors cursor-pointer ${
            activeMetric === 'matchScore'
              ? 'border-[var(--accent)] bg-[var(--bg-accent-muted)] shadow-2xs'
              : 'border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--border-strong)]'
          }`}
        >
          <p className="text-[10px] font-bold text-[var(--text-muted)] flex items-center justify-between">
            <span className="truncate">{isRtl ? 'متوسط التوافق' : 'Avg Match Precision'}</span>
            <Sparkles size={12} className="text-[var(--accent)] shrink-0 ms-1" />
          </p>
          <p className="text-sm sm:text-base font-black text-[var(--text-primary)] mt-1">{avgMatch}%</p>
          <p className="text-[10px] font-bold text-[var(--accent)] mt-0.5">{isRtl ? 'دقة فائقة' : 'High Precision'}</p>
        </button>

        <button
          onClick={() => setActiveMetric('impressions')}
          className={`p-2.5 sm:p-3 rounded-[var(--radius-sm)] border text-start transition-colors cursor-pointer ${
            activeMetric === 'impressions'
              ? 'border-[var(--accent)] bg-[var(--bg-accent-muted)] shadow-2xs'
              : 'border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--border-strong)]'
          }`}
        >
          <p className="text-[10px] font-bold text-[var(--text-muted)] flex items-center justify-between">
            <span className="truncate">{isRtl ? 'الظهور والوصول' : 'Total Impressions'}</span>
            <BarChart2 size={12} className="text-[var(--accent)] shrink-0 ms-1" />
          </p>
          <p className="text-sm sm:text-base font-black text-[var(--text-primary)] mt-1">{totalImpressions.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-[var(--accent)] mt-0.5">+24.1% {isRtl ? 'نمو' : 'Growth'}</p>
        </button>

        <button
          onClick={() => setActiveMetric('conversions')}
          className={`p-2.5 sm:p-3 rounded-[var(--radius-sm)] border text-start transition-colors cursor-pointer ${
            activeMetric === 'conversions'
              ? 'border-[var(--accent)] bg-[var(--bg-accent-muted)] shadow-2xs'
              : 'border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--border-strong)]'
          }`}
        >
          <p className="text-[10px] font-bold text-[var(--text-muted)] flex items-center justify-between">
            <span className="truncate">{isRtl ? 'التحويلات الناجحة' : 'Direct Conversions'}</span>
            <Zap size={12} className="text-[var(--accent)] shrink-0 ms-1" />
          </p>
          <p className="text-sm sm:text-base font-black text-[var(--text-primary)] mt-1">{totalConversions.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-[var(--accent)] mt-0.5">3.8x {isRtl ? 'معدل تحويل' : 'CVR'}</p>
        </button>
      </div>

      {/* Mobile Toggle Button for D3 Chart */}
      <button
        type="button"
        onClick={() => setIsMobileChartExpanded(prev => !prev)}
        className="sm:hidden w-full py-2 px-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-subtle)] text-xs font-bold text-[var(--text-primary)] hover:border-[var(--border-accent)] transition-colors flex items-center justify-between cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <BarChart2 size={15} className="text-[var(--accent)] shrink-0" />
          <span>
            {isMobileChartExpanded
              ? (isRtl ? 'إخفاء الرسم البياني التفاعلي' : 'Hide Interactive D3 Chart')
              : (isRtl ? 'عرض الرسم البياني التفاعلي (D3)' : 'Show Interactive D3 Chart')}
          </span>
        </span>
        <ChevronDown size={15} className={`text-[var(--text-muted)] transition-transform duration-base ${isMobileChartExpanded ? 'rotate-180 text-[var(--accent)]' : ''}`} />
      </button>

      {/* D3 Canvas Container (Always visible on desktop, toggleable on mobile) */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] p-2 sm:p-4 overflow-hidden transition-all duration-base ${
          isMobileChartExpanded ? 'block' : 'hidden sm:block'
        }`}
      >
        <svg ref={svgRef} className="w-full overflow-visible" />

        {/* Floating Tooltip */}
        {hoveredPoint && tooltipPos && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              left: `${Math.min(tooltipPos.x, (containerRef.current?.clientWidth || 400) - 180)}px`,
              top: `${Math.max(10, tooltipPos.y - 75)}px`,
            }}
            className="absolute z-20 pointer-events-none p-2.5 rounded-shape-sm bg-[var(--surface-overlay)] border border-[var(--border-default)] shadow-xl backdrop-blur-md text-[var(--text-primary)] min-w-[160px]"
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] mb-1 border-b border-[var(--border-subtle)] pb-1">
              <span>{hoveredPoint.dateStr}</span>
              <span className="text-[var(--accent)] font-extrabold">{hoveredPoint.matchScore}% {isRtl ? 'توافق' : 'Match'}</span>
            </div>
            <div className="space-y-0.5 text-xs">
              <p className="font-extrabold text-[var(--accent)] flex items-center justify-between gap-3">
                <span className="text-[var(--text-secondary)]">
                  {activeMetric === 'clicks'
                    ? isRtl ? 'النقرات:' : 'Clicks:'
                    : activeMetric === 'matchScore'
                    ? isRtl ? 'التوافق:' : 'Precision:'
                    : activeMetric === 'impressions'
                    ? isRtl ? 'الظهور:' : 'Impressions:'
                    : isRtl ? 'التحويلات:' : 'Conversions:'}
                </span>
                <span>{hoveredPoint[activeMetric]}</span>
              </p>
              <p className="text-[10px] text-[var(--text-muted)] truncate mt-1">
                <span className="text-[var(--text-muted)] me-1">{isRtl ? 'الأكثر تفاعلاً:' : 'Top Category:'}</span>
                <span className="text-[var(--text-primary)] font-medium">{isRtl ? hoveredPoint.topCategoryAr : hoveredPoint.topCategoryEn}</span>
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EngagementTrendsChart;
