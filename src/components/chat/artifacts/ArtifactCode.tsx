import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Artifact } from '../../../types/artifact';
import { useAppContext } from '../../../context/AppContext';
import { useArtifact } from '../../../context/ArtifactContext';
import { toast } from '@/design-system';
import { Search } from 'lucide-react';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-markup';

interface ArtifactCodeProps {
  artifact: Artifact;
}

export function ArtifactCode({ artifact }: ArtifactCodeProps) {
  const { dir, language } = useAppContext();
  const {
    updateArtifactContent,
    setActiveTab,
    isEditingCode,
    showCodeSearch,
    activeFilePath,
    files,
    updateFileContent
  } = useArtifact();

  const isAr = language === 'ar' || dir === 'rtl';

  // Derive active content from multi-file store or artifact
  const currentFileContent = files[activeFilePath]?.content ?? artifact.content;
  const [codeValue, setCodeValue] = useState(currentFileContent);
  const [searchQuery, setSearchQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync when active file path or content changes
  useEffect(() => {
    const nextContent = files[activeFilePath]?.content ?? artifact.content;
    setCodeValue(nextContent);
  }, [activeFilePath, files, artifact.content]);

  // Handle Run and Preview
  const handleRunAndPreview = useCallback(() => {
    updateFileContent(activeFilePath, codeValue);
    updateArtifactContent(codeValue);
    setActiveTab('preview');
    toast.success(isAr ? 'تم حفظ التعديلات وتشغيل المعاينة الحية!' : 'Saved changes and switched to Live Preview!');
  }, [activeFilePath, codeValue, isAr, updateArtifactContent, updateFileContent, setActiveTab]);

  useEffect(() => {
    const handleRunEvent = () => {
      handleRunAndPreview();
    };
    window.addEventListener('artifact_run_preview', handleRunEvent);
    return () => window.removeEventListener('artifact_run_preview', handleRunEvent);
  }, [handleRunAndPreview]);

  // Determine prism grammar
  const prismLanguage = useMemo(() => {
    const filePath = activeFilePath.toLowerCase();
    if (filePath.endsWith('.html') || filePath.endsWith('.htm') || filePath.endsWith('.xml') || filePath.endsWith('.svg')) return 'markup';
    if (filePath.endsWith('.css')) return 'css';
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.ts')) return 'typescript';
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) return 'tsx';
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) return 'javascript';
    if (filePath.endsWith('.py')) return 'python';
    if (filePath.endsWith('.sh') || filePath.endsWith('.bash')) return 'bash';

    const rawType = (artifact.language || artifact.type || '').toLowerCase();
    if (rawType === 'html' || rawType === 'xml' || rawType === 'svg') return 'markup';
    if (rawType === 'ts' || rawType === 'typescript') return 'typescript';
    if (rawType === 'js' || rawType === 'javascript') return 'javascript';
    if (rawType === 'react' || rawType === 'tsx' || rawType === 'jsx') return 'tsx';
    if (rawType === 'css') return 'css';
    if (rawType === 'json') return 'json';
    if (rawType === 'py' || rawType === 'python') return 'python';
    if (rawType === 'sh' || rawType === 'bash') return 'bash';
    return 'markup';
  }, [activeFilePath, artifact.language, artifact.type]);

  // Highlighted code output
  const highlightedCode = useMemo(() => {
    const grammar = Prism.languages[prismLanguage] || Prism.languages.markup;
    let rawHtml = '';
    try {
      rawHtml = Prism.highlight(codeValue, grammar, prismLanguage);
    } catch (e) {
      rawHtml = codeValue
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
    return DOMPurify.sanitize(rawHtml, { ALLOWED_TAGS: ['span'], ALLOWED_ATTR: ['class', 'style'] });
  }, [codeValue, prismLanguage]);

  const lines = useMemo(() => codeValue.split('\n'), [codeValue]);

  // Support Tab indentation in editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = codeValue.substring(0, start) + '  ' + codeValue.substring(end);
      setCodeValue(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--surface-page)] overflow-hidden font-sans min-h-0">
      {/* Quick Search Bar */}
      {showCodeSearch && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-inset)] border-b border-[var(--border-default)] shrink-0">
          <Search size={14} className="text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث عن نص أو دالة أو متغير...' : 'Find text, function, or variable...'}
            className="flex-1 bg-transparent border-none text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none font-mono"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {isAr ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 overflow-auto relative flex flex-col min-h-0 bg-[var(--surface-code)] text-slate-100" style={{ direction: 'ltr', textAlign: 'left' }}>
        {isEditingCode ? (
          /* Live Interactive Code TextArea with Line Numbers Gutter */
          <div className="flex-1 flex h-full min-h-0">
            {/* Gutter */}
            <div className="w-12 select-none py-4 pr-3 text-right text-slate-500 font-mono text-[11px] border-r border-slate-800 bg-[var(--surface-panel)] shrink-0">
              {lines.map((_, idx) => (
                <div key={idx} className="h-5 leading-5">
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={codeValue}
              onChange={(e) => setCodeValue(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              className="flex-1 h-full w-full p-4 font-mono text-[12px] leading-5 bg-transparent text-slate-100 focus:outline-none resize-none overflow-auto custom-scrollbar selection:bg-[var(--bg-accent-muted)]"
              style={{ tabSize: 2 }}
            />
          </div>
        ) : (
          /* Syntax Highlighted View */
          <div className="flex-1 flex h-full min-h-0">
            {/* Line Numbers */}
            <div className="w-12 select-none py-4 pr-3 text-right text-slate-500 font-mono text-[11px] border-r border-slate-800 bg-[var(--surface-panel)] shrink-0">
              {lines.map((_, idx) => (
                <div key={idx} className="h-5 leading-5">
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* Formatted Code */}
            <pre 
              dir="ltr" 
              style={{ direction: 'ltr', unicodeBidi: 'isolate', textAlign: 'left' }}
              className="flex-1 p-4 font-mono text-[12px] leading-5 text-slate-100 overflow-x-auto overflow-y-auto custom-scrollbar m-0 select-text text-left dir-ltr w-full max-w-full min-w-0"
            >
              <code
                dir="ltr"
                style={{ direction: 'ltr', unicodeBidi: 'isolate', textAlign: 'left' }}
                className={`language-${prismLanguage} inline-block min-w-full w-max whitespace-pre font-mono pr-6`}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
