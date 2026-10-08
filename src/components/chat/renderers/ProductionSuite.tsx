import React from 'react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { InteractiveAudioPlayer } from './InteractiveAudioPlayer';
import { Music, Sliders, Image as ImageIcon } from 'lucide-react';

// These components (CodeBlock, MarkdownLink, BlockquoteWithActions) 
// should also be extracted if they are large, but let's keep it manageable for now
// or import them if I extract them later.

interface ProductionSuiteProps {
  content: string;
  dir: 'ltr' | 'rtl';
  theme: string;
  CodeBlock: any;
  MarkdownLink: any;
  BlockquoteWithActions: any;
}

export const ProductionSuite: React.FC<ProductionSuiteProps> = ({ 
  content, 
  dir, 
  theme, 
  CodeBlock, 
  MarkdownLink, 
  BlockquoteWithActions 
}) => {
  const sections: { title: string; body: string; id: string }[] = [];

  const splitRegex = /(?:^|\n)(?:#\s*|[\d]\.\s*)?\[(?:I|II|III)\.\s*[^\]]+\]/g;
  const rawSections = content.split(splitRegex).filter(s => s.trim().length > 0);
  const titles = (content.match(splitRegex) || []) as string[];

  titles.forEach((title: string, idx: number) => {
    sections.push({
      id: `section-${idx}`,
      title: title.replace(/#\s*\[/, '').replace(/\]/, '').trim(),
      body: rawSections[idx] || ''
    });
  });

  const coverSection = sections.find(s => s.title.includes('الغلاف') || s.title.toLowerCase().includes('cover'));
  const coverMatch = coverSection?.body.match(/!\[.*?\]\((.*?)\)/);
  const coverImageUrl = coverMatch ? coverMatch[1] : null;

  const isAudioConcept = content.includes('[I. Cover') || content.includes('[II. Audio') || content.includes('البيئة الصوتية') || content.includes('الأوركسترا');
  
  if (sections.length === 0 && !isAudioConcept) {
    return (
      <Markdown 
        remarkPlugins={[remarkGfm]} 
        components={{ 
          code: CodeBlock as any, 
          p: 'div', 
          a: ({ href, children }: any) => <MarkdownLink href={href}>{children}</MarkdownLink>, 
          blockquote: ({ children }: any) => <BlockquoteWithActions dir={dir}>{children}</BlockquoteWithActions> 
        }}
      >
        {content}
      </Markdown>
    );
  }

  const canonicalSlots = [
    {
      phase: 1,
      id: 'phase-1-cover',
      titleEn: 'I. COVER & MOOD ART',
      titleAr: 'أولاً: غلاف الألبوم واللوحة الفنية المعبرة',
      pendingTextEn: 'Designing album cover artwork and visual branding concepts...',
      pendingTextAr: 'جاري توليد وصياغة غلاف الألبوم الرشيق وتجلياته البصرية...',
      icon: <ImageIcon size={20} />
    },
    {
      phase: 2,
      id: 'phase-2-env',
      titleEn: 'II. AUDIO SUITE ENVIRONMENT',
      titleAr: 'ثانياً: هندسة البيئة الصوتية والآلات الموسيقية',
      pendingTextEn: 'Calibrating digital audio workstation environment, frequencies and scales...',
      pendingTextAr: 'جاري معايرة مقامات الصوت الفنية وضبط توزيع ترددات الآلات...',
      icon: <Sliders size={20} />
    },
    {
      phase: 3,
      id: 'phase-3-sonic',
      titleEn: 'III. SONIC ORCHESTRATION',
      titleAr: 'ثالثاً: المقطع الموسيقي واللحن النهائي التفاعلي',
      pendingTextEn: 'Orchestrating musical composition parameters and final DSP rendering...',
      pendingTextAr: 'جاري تأليف المقامات الصوتية المتقدمة وتحضير التوزيع الفني للمركبات اللحنية...',
      icon: <Music size={20} />
    }
  ];

  const slots = canonicalSlots.map((canon, i) => {
    let matched = sections.find(sec => {
      const lowerT = sec.title.toLowerCase();
      if (i === 0) return lowerT.includes('cover') || lowerT.includes('art') || lowerT.includes('غلاف');
      if (i === 1) return lowerT.includes('environment') || lowerT.includes('بيئة') || lowerT.includes('suite');
      if (i === 2) return lowerT.includes('orchestration') || lowerT.includes('sonic') || lowerT.includes('مقطع') || lowerT.includes('موسيقي');
      return false;
    });

    if (!matched && sections[i] && i === sections.length - 1) {
      matched = sections[i];
    }

    return {
      canon,
      data: matched || null,
      isPending: !matched
    };
  });

  return (
    <div className="flex flex-col gap-10 py-4 w-full">
      {slots.map((slot, idx) => {
        const { canon, data, isPending } = slot;
        const isMusicSection = canon.phase === 3;
        const currentTitle = dir === 'rtl' ? canon.titleAr : canon.titleEn;

        return (
          <motion.div
            key={`canon-${canon.id}-${idx}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.3, 
              delay: idx * 0.1,
              ease: [0.22, 1, 0.36, 1] 
            }}
            className={`relative overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm transition-theme group ${isPending ? 'opacity-85 border-dashed border-accent/20 bg-accent/[0.01]' : ''}`}
          >
            <div className={`px-8 py-6 border-b flex items-center justify-between ${
              theme === 'dark' ? 'border-[var(--border-default)] bg-[var(--surface-card)]' : 'border-[var(--border-default)] bg-[var(--surface-page)]'
            }`}>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-[var(--surface-subtle)] rounded-[var(--radius-xs)] blur-md opacity-20" />
                  <div className={`relative w-2 h-8 rounded-[var(--radius-xs)] shadow-[0_0_15px_rgba(156,163,175,0.4)] ${isPending ? 'bg-amber-500/50 animate-pulse' : 'bg-[var(--fg-accent)]'}`} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-0.5 ${isPending ? 'text-amber-500' : 'text-[var(--fg-accent)]'}`}>
                    {dir === 'rtl' ? 'مرحلة إنتاج بيربليكستا' : 'PERPLEXTA PRODUCTION PHASE'} {canon.phase}
                  </span>
                  <h3 className={`text-xl font-black tracking-tight uppercase ${isPending ? 'text-[var(--text-primary)] opacity-60 animate-pulse' : 'text-[var(--text-primary)]'}`}>
                    {currentTitle}
                  </h3>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-4">
                 <div className="flex flex-col items-end">
                   <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">
                     {dir === 'rtl' ? 'حالة العمل' : 'COMPILATION'}
                   </span>
                    <div className="flex items-center gap-2">
                     <div className={`w-1.5 h-1.5 rounded-[var(--radius-full)] ${isPending ? 'bg-amber-400' : 'bg-[var(--fg-accent)]'} animate-pulse shadow-[0_0_8px_rgba(156,163,175,0.8)]`} />
                     <span className={`text-[10px] font-black uppercase ${isPending ? 'text-amber-400' : 'text-[var(--fg-accent)]'}`}>
                       {isPending ? (dir === 'rtl' ? 'في الانتظار' : 'QUEUED') : (dir === 'rtl' ? 'مكتمل' : 'RESOLVED')}
                     </span>
                   </div>
                 </div>
                 <div className="w-px h-8 bg-[var(--border-default)]" />
                 <div className="flex flex-col items-end">
                   <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">
                     {dir === 'rtl' ? 'دقة الإخراج' : 'OUTPUT PRECISION'}
                   </span>
                   <span className="text-[10px] font-black text-[var(--text-primary)]">
                     {isPending ? '--' : '99.8%'}
                   </span>
                 </div>
              </div>
            </div>

            <div className={`p-8 md:p-10 text-[13px] md:text-base ${isMusicSection ? 'text-center' : ''}`}>
              <div className="markdown-body prose max-w-none prose-p:leading-relaxed prose-headings:mb-4 prose-headings:mt-8">
                {isPending ? (
                  <div className="flex flex-col gap-4 py-4">
                    {canon.phase === 3 ? (
                      <div className="flex flex-col items-center gap-6">
                        <InteractiveAudioPlayer 
                          body="" 
                          fullContent={content}
                          dir={dir} 
                          theme={theme} 
                          coverImageUrl={coverImageUrl} 
                        />
                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--fg-accent)] animate-pulse justify-center">
                          <span className="w-1.5 h-1.5 rounded-[var(--radius-full)] bg-[var(--fg-accent)] animate-ping" />
                          <span>{dir === 'rtl' ? canon.pendingTextAr : canon.pendingTextEn}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="h-4 bg-[var(--surface-subtle)] rounded-md w-3/4 animate-pulse border border-[var(--border-default)]" />
                        <div className="h-4 bg-[var(--surface-subtle)] rounded-md w-1/2 animate-pulse border border-[var(--border-default)]" />
                        <div className="h-4 bg-[var(--surface-subtle)] rounded-md w-5/6 animate-pulse border border-[var(--border-default)]" />
                        <p className="text-xs text-[var(--text-muted)] font-bold animate-pulse mt-4">
                          {dir === 'rtl' ? canon.pendingTextAr : canon.pendingTextEn}
                        </p>
                      </div>
                    )}
                  </div>
                ) : isMusicSection ? (
                  <div className="flex flex-col items-center gap-8">
                    <InteractiveAudioPlayer 
                      body={data?.body || ''} 
                      fullContent={content}
                      dir={dir} 
                      theme={theme} 
                      coverImageUrl={coverImageUrl} 
                    />

                    <Markdown 
                      remarkPlugins={[remarkGfm]} 
                      components={{ 
                        code: CodeBlock as any,
                        img: () => null, 
                        p: 'div',
                        blockquote: ({ children }: any) => <BlockquoteWithActions dir={dir}>{children}</BlockquoteWithActions>
                      }}
                    >
                      {data?.body || ''}
                    </Markdown>
                  </div>
                ) : (
                  <Markdown 
                    remarkPlugins={[remarkGfm]} 
                    components={{ 
                      code: CodeBlock as any,
                      p: 'div',
                      blockquote: ({ children }: any) => <BlockquoteWithActions dir={dir}>{children}</BlockquoteWithActions>,
                      img: ({ node, ...props }: any) => (
                        <div className="relative w-full aspect-video rounded-shape-md overflow-hidden border border-[var(--border-default)] shadow-2xl group/video">
                          <img {...props} className="w-full h-full object-cover transition-transform duration-300 group-hover/video:scale-110" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                             <div className="w-20 h-20 rounded-shape-xs bg-[var(--surface-subtle)] backdrop-blur-md border border-[var(--border-accent)] flex items-center justify-center text-[var(--fg-accent)] animate-pulse">
                               <Music size={40} />
                             </div>
                          </div>
                          <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-shape-xs border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
                            {dir === 'rtl' ? 'عرض فني من بيربليكستا' : 'PERPLEXTA ART VIEW'}
                          </div>
                        </div>
                      )
                    }}
                  >
                    {data?.body || ''}
                  </Markdown>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
