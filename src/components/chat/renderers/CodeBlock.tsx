import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, Copy, Download, Play, Square, RefreshCw, Loader2, ChevronDown, ChevronUp, Terminal, Eye 
} from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-dart';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-diff';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-sass';
import 'prismjs/components/prism-r';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-lua';
import 'prismjs/components/prism-perl';
import 'prismjs/components/prism-ini';
import 'prismjs/components/prism-toml';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-protobuf';
import 'prismjs/components/prism-nginx';
import 'prismjs/components/prism-makefile';
import 'prismjs/components/prism-wasm';
import 'prismjs/components/prism-elixir';
import DOMPurify from 'dompurify';
import { toast } from '@/design-system';
import { getCSPNonce } from '../../../utils/csp';
import { useArtifact, ArtifactTab } from '../../../context/ArtifactContext';
import { useAppContext } from '../../../context/AppContext';
import { tryParseProjectJson } from '../../../utils/projectParser';

interface CodeBlockProps {
  children: any;
  className?: string;
  inline?: boolean;
  dir: 'ltr' | 'rtl';
  theme: string;
  isGenerating?: boolean;
  wasGenerating?: boolean;
  isLastMessage?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ 
  children, 
  className, 
  inline, 
  dir, 
  theme: resolvedTheme,
  isGenerating,
  wasGenerating,
  isLastMessage
}) => {
  const { language } = useAppContext();
  const isAr = language === 'ar' || dir === 'rtl';
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : 'text';
  const codeContent = String(children).trim();

  const isMediaUrl = (codeContent.startsWith('http') || codeContent.startsWith('/')) && (codeContent.includes('.png') || codeContent.includes('.jpg') || codeContent.includes('.mp4') || codeContent.includes('.gif') || codeContent.includes('.mp3') || codeContent.includes('.wav') || codeContent.includes('.ogg'));
  const parsedProject = useMemo(() => {
    if (lang.toLowerCase() === 'json' || codeContent.startsWith('{')) {
      return tryParseProjectJson(codeContent);
    }
    return null;
  }, [codeContent, lang]);

  const fileNameDisplay = useMemo(() => {
    const l = lang.toLowerCase().trim();
    if (l === 'audio') return 'Perplexta Audio Slate';
    if (parsedProject?.title) return parsedProject.title;
    if (['prompt', 'image_prompt', 'image-prompt', 'image_gen'].includes(l)) return isAr ? 'برومبت توليد الصورة (Image Prompt)' : 'AI Image Prompt';
    if (['funnel', 'funnel_chart', 'funnel-chart'].includes(l)) return isAr ? 'مخطط مسار التحويل (Conversion Funnel)' : 'Conversion Funnel Map';
    if (['diagram', 'flow', 'flowchart', 'ascii', 'tree'].includes(l)) return isAr ? 'مخطط هيكلي وتوضيحي (Diagram & Flow)' : 'Structural Flow Diagram';
    if (['apa', 'citation', 'references', 'bibtex', 'harvard', 'ieee', 'ris'].includes(l)) return isAr ? 'التوثيق الأكاديمي المعتمد (APA / BibTeX)' : 'Academic Citations & References';
    if (['json', 'json5'].includes(l)) return isAr ? 'بيانات مهيكلة (Structured JSON)' : 'data.json';
    if (['html', 'htm'].includes(l)) return 'index.html';
    if (['css', 'scss', 'sass', 'less'].includes(l)) return `styles.${l}`;
    if (['typescript', 'ts', 'jsx', 'tsx', 'js', 'javascript', 'react'].includes(l)) return `App.${['ts', 'typescript', 'tsx'].includes(l) ? 'tsx' : 'jsx'}`;
    if (['python', 'py'].includes(l)) return 'main.py';
    if (['c'].includes(l)) return 'main.c';
    if (['cpp', 'c++'].includes(l)) return 'main.cpp';
    if (['csharp', 'cs', 'c#'].includes(l)) return 'Program.cs';
    if (['java'].includes(l)) return 'Main.java';
    if (['go', 'golang'].includes(l)) return 'main.go';
    if (['rust', 'rs'].includes(l)) return 'main.rs';
    if (['sql'].includes(l)) return 'query.sql';
    if (['yaml', 'yml'].includes(l)) return 'config.yaml';
    if (['json', 'json5'].includes(l)) return 'data.json';
    if (['bash', 'sh', 'zsh', 'shell'].includes(l)) return 'script.sh';
    if (['docker', 'dockerfile'].includes(l)) return 'Dockerfile';
    if (['markdown', 'md'].includes(l)) return 'README.md';
    if (['php'].includes(l)) return 'index.php';
    if (['ruby', 'rb'].includes(l)) return 'main.rb';
    if (['swift'].includes(l)) return 'main.swift';
    if (['kotlin', 'kt'].includes(l)) return 'Main.kt';
    if (['dart'].includes(l)) return 'main.dart';
    if (['graphql', 'gql'].includes(l)) return 'schema.graphql';
    return lang || 'code';
  }, [lang, parsedProject]);

  const isExecutable = useMemo(() => {
    if (isMediaUrl) return false;
    const l = (lang || '').toLowerCase();
    const previewableLangs = [
      'javascript', 'js', 'jsx',
      'typescript', 'ts', 'tsx',
      'html', 'htm', 'css', 'svg',
      'json', 'react', 'vue', 'svelte'
    ];
    if (previewableLangs.includes(l)) return true;
    if (Boolean(parsedProject)) return true;
    if (
      codeContent.includes('import ') ||
      codeContent.includes('export ') ||
      codeContent.includes('function') ||
      codeContent.includes('const ') ||
      codeContent.includes('class ') ||
      codeContent.includes('<')
    ) {
      return true;
    }
    return false;
  }, [isMediaUrl, lang, parsedProject, codeContent]);

  const artifactIdRef = useRef(`code-${lang}-${Math.random().toString(36).substring(2, 9)}`);

  let artifactContext: any = null;
  try {
    artifactContext = useArtifact();
  } catch (e) {}

  const handleOpenInCanvas = (targetTab?: ArtifactTab) => {
    if (artifactContext) {
      if (targetTab) {
        artifactContext.setActiveTab(targetTab);
      } else {
        artifactContext.setActiveTab('preview'); // default to preview instead of keeping current
      }

      if (parsedProject) {
        const entryFile = parsedProject.files[parsedProject.entryPath];
        artifactContext.setActiveArtifact({
          id: artifactIdRef.current,
          title: parsedProject.title || 'Project',
          type: 'project',
          language: entryFile?.type || 'html',
          content: entryFile?.content || '',
          version: 1,
          files: parsedProject.files,
          entryFilePath: parsedProject.entryPath,
          activeFilePath: parsedProject.entryPath,
          openFileTabs: [parsedProject.entryPath]
        });
      } else {
        artifactContext.setActiveArtifact({
          id: artifactIdRef.current,
          title: lang === 'html' ? 'index.html' : lang === 'css' ? 'styles.css' : `App.${['typescript', 'ts', 'jsx', 'tsx'].includes(lang.toLowerCase()) ? 'tsx' : 'jsx'}`,
          type: lang === 'html' ? 'html' : lang === 'svg' ? 'svg' : 'react',
          language: lang,
          content: codeContent,
          version: 1
        });
      }
      artifactContext.setIsArtifactOpen(true);
    }
  };

  const [sandboxMode, setSandboxMode] = useState(false);
  const [editableCode, setEditableCode] = useState(codeContent);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [outputLogs, setOutputLogs] = useState<{ type: 'log' | 'info' | 'warn' | 'error'; text: string; time: string }[]>([]);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  const lineCount = useMemo(() => editableCode.split('\n').length, [editableCode]);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setEditableCode(codeContent);
  }, [codeContent]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSandboxMode(false);
        setIsPlaying(false);
        setIframeSrc(null);
        setOutputLogs([]);
      }
    };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update Canvas live if the code block is still generating (streaming)
  useEffect(() => {
    if (!isExecutable) return;

    if (
      artifactContext &&
      artifactContext.isArtifactOpen &&
      artifactContext.activeArtifact?.id === artifactIdRef.current &&
      artifactContext.activeArtifact?.content !== codeContent
    ) {
      if (parsedProject) {
        const entryFile = parsedProject.files[parsedProject.entryPath];
        artifactContext.setActiveArtifact({
          id: artifactIdRef.current,
          title: parsedProject.title || 'Project',
          type: 'project',
          language: entryFile?.type || 'html',
          content: entryFile?.content || '',
          version: 1,
          files: parsedProject.files,
          entryFilePath: parsedProject.entryPath,
          activeFilePath: parsedProject.entryPath,
          openFileTabs: [parsedProject.entryPath]
        });
      } else {
        artifactContext.setActiveArtifact({
          id: artifactIdRef.current,
          title: lang === 'html' ? 'index.html' : lang === 'css' ? 'styles.css' : `App.${['typescript', 'ts', 'jsx', 'tsx'].includes(lang.toLowerCase()) ? 'tsx' : 'jsx'}`,
          type: lang === 'html' ? 'html' : lang === 'svg' ? 'svg' : 'react',
          language: lang,
          content: codeContent,
          version: 1
        });
      }
    }
  }, [codeContent, isExecutable, parsedProject]);

  const internalWasGeneratingRef = useRef(isGenerating);

  useEffect(() => {
    if (isGenerating) {
      internalWasGeneratingRef.current = true;
    }
  }, [isGenerating]);

  useEffect(() => {
    if (!isExecutable) return;
    
    // Auto-open in Canvas and focus preview once generation transitions from true to false
    // Only auto-open if it is the last message to avoid stealing focus on history rendering
    console.log(`[CodeBlock] isGenerating: ${isGenerating}, wasGenerating: ${wasGenerating}, internalWasGenerating: ${internalWasGeneratingRef.current}, isLastMessage: ${isLastMessage}`);
    
    const wasGen = wasGenerating || internalWasGeneratingRef.current;
    
    if (isLastMessage && wasGen && isGenerating === false) {
      console.log(`[CodeBlock] Triggering auto-open in canvas!`);
      
      // Delay opening canvas to let React DOM update finish streaming
      setTimeout(() => {
        setIsExpanded(false);
        handleOpenInCanvas('preview');
      }, 50);
      
      // Reset after triggering so we don't trigger again
      internalWasGeneratingRef.current = false;
    }
  }, [isGenerating, wasGenerating, isExecutable, isLastMessage]);

  const highlightedCode = useMemo(() => {
    const l = lang.toLowerCase().trim();
    let prismLang = l;
    if (['js', 'javascript', 'node', 'react'].includes(l)) prismLang = 'javascript';
    else if (['ts', 'typescript'].includes(l)) prismLang = 'typescript';
    else if (['py', 'python', 'py3'].includes(l)) prismLang = 'python';
    else if (['sh', 'bash', 'zsh', 'shell', 'cmd'].includes(l)) prismLang = 'bash';
    else if (['html', 'htm', 'xml', 'svg', 'xhtml', 'markup'].includes(l)) prismLang = 'markup';
    else if (['yml', 'yaml'].includes(l)) prismLang = 'yaml';
    else if (['md', 'markdown'].includes(l)) prismLang = 'markdown';
    else if (['c++', 'cpp'].includes(l)) prismLang = 'cpp';
    else if (['cs', 'c#', 'csharp', 'dotnet'].includes(l)) prismLang = 'csharp';
    else if (['golang', 'go'].includes(l)) prismLang = 'go';
    else if (['rs', 'rust'].includes(l)) prismLang = 'rust';
    else if (['rb', 'ruby'].includes(l)) prismLang = 'ruby';
    else if (['kt', 'kotlin'].includes(l)) prismLang = 'kotlin';
    else if (['dockerfile', 'docker'].includes(l)) prismLang = 'docker';
    else if (['gql', 'graphql'].includes(l)) prismLang = 'graphql';
    else if (['ps', 'ps1', 'powershell'].includes(l)) prismLang = 'powershell';
    else if (['proto', 'protobuf'].includes(l)) prismLang = 'protobuf';
    else if (['make', 'makefile'].includes(l)) prismLang = 'makefile';
    else if (['flutter', 'dart'].includes(l)) prismLang = 'dart';
    else if (['json5'].includes(l)) prismLang = 'json';

    const hasGrammar = Prism.languages[prismLang];
    let rawHtml = '';
    if (hasGrammar) {
      try {
        rawHtml = Prism.highlight(editableCode, Prism.languages[prismLang], prismLang);
        return DOMPurify.sanitize(rawHtml, { ALLOWED_TAGS: ['span'], ALLOWED_ATTR: ['class', 'style'] });
      } catch (e) {}
    }
    rawHtml = editableCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return DOMPurify.sanitize(rawHtml, { ALLOWED_TAGS: ['span'], ALLOWED_ATTR: ['class', 'style'] });
  }, [editableCode, lang]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editableCode)
      .then(() => {
        setCopied(true);
        toast.success(dir === 'rtl' ? 'تم نسخ الكود بنجاح' : 'Code copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        toast.error(dir === 'rtl' ? 'فشل نسخ الكود' : 'Failed to copy code');
      });
  };

  const downloadCode = () => {
    const blob = new Blob([editableCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${lang}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFile = (fileUrl: string) => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = 'generated-file';
    a.target = '_blank';
    a.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = editableCode.substring(0, start) + '  ' + editableCode.substring(end);
      setEditableCode(newValue);
      setTimeout(() => {
        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleRun = async () => {
    setIsPlaying(true);
    setIframeSrc(null);
    setOutputLogs([]);

    const language = lang.toLowerCase();
    if (['html', 'css'].includes(language)) {
      setIsRunning(true);
      try {
        let fullHtml = '';
        const isDark = resolvedTheme === 'dark';
        const documentClass = isDark ? 'dark' : 'light';

        if (language === 'html') {
          fullHtml = `
            <!DOCTYPE html>
            <html class="${documentClass}">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { 
                  font-family: system-ui, -apple-system, sans-serif; 
                  margin: 1rem; 
                  padding: 0;
                  color: ${isDark ? '#e2e8f0' : '#1e293b'}; 
                  background-color: ${isDark ? '#0d1117' : '#ffffff'}; 
                }
              </style>
            </head>
            <body>
              ${editableCode}
            </body>
            </html>
          `;
        } else {
          fullHtml = `
            <!DOCTYPE html>
            <html class="${documentClass}">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { 
                  font-family: system-ui, -apple-system, sans-serif; 
                  margin: 1rem; 
                  padding: 0;
                  color: ${isDark ? '#e2e8f0' : '#1e293b'}; 
                  background-color: ${isDark ? '#0d1117' : '#ffffff'}; 
                }
                ${editableCode}
              </style>
            </head>
            <body>
              <div class="sandbox-demo-container">
                <h1 class="demo-title">CSS Sandbox Preview</h1>
                <p class="demo-text">Style standard selectors, utilities, classes, or ID attributes here!</p>
                <div class="demo-card" style="border: 1px solid ${isDark ? '#334155' : '#e2e8f0'}; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; background-color: ${isDark ? '#1a1a1c' : '#f8fafc'}; max-width: 450px;">
                  <h3 style="margin-top: 0;">Interactive Demo Card</h3>
                  <p style="font-size: 14px; opacity: 0.85;">This card mimics typical interface content to display visual styles clearly.</p>
                  <button class="demo-button" style="padding: 0.5rem 1rem; border-radius: 4px; border: none; font-weight: bold; background-color: #334155; color: white;">Button One</button>
                  <button class="demo-button outline" style="padding: 0.5rem 1rem; border-radius: 4px; border: 1px solid #334155; font-weight: bold; background-color: transparent; color: #334155; margin-left: 0.5rem;">Button Two</button>
                </div>
              </div>
            </body>
            </html>
          `;
        }
        if (mountedRef.current) setIframeSrc(fullHtml);
      } catch (err: any) {
      } finally {
        if (mountedRef.current) setIsRunning(false);
      }
    } else {
      setIsRunning(true);
      const startTime = performance.now();
      const logsList: { type: 'log' | 'info' | 'warn' | 'error'; text: string; time: string }[] = [];
      const getTimestamp = () => new Date().toLocaleTimeString([], { hour12: false });

      let jsCode = editableCode;
      if (['typescript', 'ts'].includes(language)) {
        jsCode = jsCode
          .replace(/import\s+[\s\S]*?\s+from\s+['"].*?['"];?/g, '')
          .replace(/export\s+(default\s+)?/g, '')
          .replace(/(?:interface|type)\s+\w+[\s\S]*?\{[\s\S]*?\}/g, '')
          .replace(/(const|let|var)\s+(\w+)\s*:\s*\w+/g, '$1 $2')
          .replace(/function\s+(\w+)\s*\((.*?)\)\s*:\s*\w+/g, 'function $1($2)')
          .replace(/\((.*?)\)\s*:\s*\w+\s*=>/g, '($1) =>');
      }

      const nonceVal = getCSPNonce();
      const nonceAttr = nonceVal ? ` nonce="${nonceVal}"` : '';

      const iframe = document.createElement('iframe');
      iframe.setAttribute('sandbox', 'allow-scripts');
      iframe.style.display = 'none';

      const scriptContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <script${nonceAttr}>
            const customConsole = {
              log: (...args) => {
                const text = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
                window.parent.postMessage({ type: 'PERPLEXTA_LOG', level: 'log', text }, '*');
              },
              info: (...args) => {
                const text = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
                window.parent.postMessage({ type: 'PERPLEXTA_LOG', level: 'info', text }, '*');
              },
              warn: (...args) => {
                const text = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
                window.parent.postMessage({ type: 'PERPLEXTA_LOG', level: 'warn', text }, '*');
              },
              error: (...args) => {
                const text = args.map(arg => typeof arg === 'object' ? String(arg?.message || JSON.stringify(arg)) : String(arg)).join(' ');
                window.parent.postMessage({ type: 'PERPLEXTA_LOG', level: 'error', text }, '*');
              }
            };
            window.console = {
              ...window.console,
              ...customConsole
            };
            window.addEventListener('error', (e) => {
              customConsole.error(e.error || e.message);
            });
          </script>
        </head>
        <body>
          <script${nonceAttr}>
            try {
              ${jsCode}
              window.parent.postMessage({ type: 'PERPLEXTA_DONE' }, '*');
            } catch (err) {
              window.parent.postMessage({ type: 'PERPLEXTA_LOG', level: 'error', text: err?.message || String(err) }, '*');
              window.parent.postMessage({ type: 'PERPLEXTA_DONE' }, '*');
            }
          </script>
        </body>
        </html>
      `;

      iframe.srcdoc = scriptContent;
      let runTimeout: any = null;

      const cleanup = () => {
        if (runTimeout) clearTimeout(runTimeout);
        window.removeEventListener('message', messageHandler);
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      };

      const messageHandler = (event: MessageEvent) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;

        if (data.type === 'PERPLEXTA_LOG') {
          logsList.push({
            type: data.level,
            text: data.text,
            time: getTimestamp()
          });
          if (mountedRef.current) setOutputLogs([...logsList]);
        } else if (data.type === 'PERPLEXTA_DONE') {
          const duration = (performance.now() - startTime).toFixed(1);
          logsList.push({
            type: 'info',
            text: `[SYSTEM] Process completed in ${duration}ms.`,
            time: getTimestamp()
          });
          if (mountedRef.current) {
            setOutputLogs([...logsList]);
            setIsRunning(false);
          }
          cleanup();
        }
      };

      window.addEventListener('message', messageHandler);
      document.body.appendChild(iframe);

      runTimeout = setTimeout(() => {
        logsList.push({
          type: 'warn',
          text: `[SYSTEM] Process exceeded 3000ms limit. Execution aborted.`,
          time: getTimestamp()
        });
        if (mountedRef.current) {
          setOutputLogs([...logsList]);
          setIsRunning(false);
        }
        cleanup();
      }, 3000);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIframeSrc(null);
    setOutputLogs([]);
  };

  const handleReset = () => {
    setEditableCode(codeContent);
    handleStop();
    toast.success(dir === 'rtl' ? 'تمت إعادة تعيين الكود البرمجي' : 'Code reset for execution');
  };

  if (inline) {
    return (
      <code 
        dir="ltr" 
        style={{ direction: 'ltr', unicodeBidi: 'isolate', textAlign: 'left' }} 
        className={`inline-block mx-0.5 px-1.5 py-0.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-mono text-[var(--fg-accent)] font-semibold dir-ltr text-left ${className || ''}`}
      >
        {children}
      </code>
    );
  }

  return (
    <div
      dir="ltr"
      style={{ direction: 'ltr', unicodeBidi: 'isolate', textAlign: 'left' }}
      className="relative group mx-auto my-5 sm:my-6 w-full max-w-full min-w-0 rounded-[var(--radius-md)] shadow-xs overflow-hidden border border-[var(--border-default)] bg-[var(--surface-card)] transition-colors perplexta-codeblock"
    >
      {/* Code Container Header */}
      <div className="sticky top-0 z-20 h-10 w-full flex items-center justify-between px-3.5 sm:px-4 border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] perplexta-codeblock-header select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 h-7 px-2.5 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-mono font-semibold shrink-0 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-success)] shrink-0" />
            <span className="truncate max-w-[180px]">{fileNameDisplay}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isExecutable && (
            <button
              type="button"
              onClick={() => handleOpenInCanvas('preview')}
              disabled={isGenerating}
              className="h-8 px-2.5 text-xs font-medium bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--fg-accent)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-accent)]/60 rounded-shape-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0 relative before:absolute before:-inset-1.5 before:content-['']"
              title={isAr ? 'معاينة الكود' : 'Preview'}
            >
              <Eye size={14} className="shrink-0 text-[var(--fg-accent)]" />
              <span className="truncate">{isAr ? 'معاينة' : 'Preview'}</span>
            </button>
          )}

          <div className="flex items-center gap-1 shrink-0">
            {isMediaUrl ? (
              <button 
                onClick={() => downloadFile(children)} 
                className="w-8 h-8 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-accent)]/60 transition-colors flex items-center justify-center shrink-0 relative before:absolute before:-inset-1.5 before:content-['']" 
                title="Download"
              >
                <Download size={14} />
              </button>
            ) : (
              <>
                <button 
                  onClick={copyToClipboard} 
                  className="relative w-8 h-8 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-accent)]/60 transition-colors flex items-center justify-center shrink-0 before:absolute before:-inset-1.5 before:content-['']" 
                  title={copied ? (dir === 'rtl' ? 'تم النسخ' : 'Copied!') : (dir === 'rtl' ? 'نسخ الكود' : 'Copy code')}
                >
                  {copied ? (
                    <Check size={14} className="text-[var(--fg-success)] transition-transform duration-fast" />
                  ) : (
                    <Copy size={14} className="transition-transform duration-fast" />
                  )}
                  {copied && (
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[var(--comp-button-primary-bg)] text-white text-[10px] px-1.5 py-0.5 rounded-shape-xs shadow-md whitespace-nowrap font-sans pointer-events-none z-30">
                      {dir === 'rtl' ? 'تم النسخ!' : 'Copied!'}
                    </span>
                  )}
                </button>
                {!isMediaUrl && (
                  <button 
                    onClick={downloadCode} 
                    className="w-8 h-8 rounded-shape-sm bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-accent)]/60 transition-colors flex items-center justify-center shrink-0 relative before:absolute before:-inset-1.5 before:content-['']" 
                    title={dir === 'rtl' ? 'تنزيل الملف' : 'Download file'}
                  >
                    <Download size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className={`relative w-full max-w-full min-w-0 ${!isExpanded && lineCount > 25 ? 'max-h-[500px] overflow-hidden' : ''} transition-all duration-300`}>
        {sandboxMode ? (
          <div className="flex flex-col md:flex-row h-[600px] bg-[var(--surface-card)] transition-theme w-full max-w-full min-w-0">
            <div className="flex-1 flex flex-col border-r border-[var(--border-default)] min-w-0">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--surface-inset)] border-b border-[var(--border-default)]">
                <span className="text-[9px] font-black text-accent uppercase tracking-widest">{dir === 'rtl' ? 'محرر الكود الحي' : 'LIVE CODE EDITOR'}</span>
                <div className="flex items-center gap-2">
                  <button onClick={handleReset} className="text-[9px] font-black text-[var(--text-muted)] hover:text-accent flex items-center gap-1 uppercase transition-colors">
                    <RefreshCw size={10} />
                    {dir === 'rtl' ? 'إعادة تعيين' : 'RESET'}
                  </button>
                </div>
              </div>
              <textarea
                dir="ltr"
                style={{ direction: 'ltr', unicodeBidi: 'isolate', textAlign: 'left' }}
                value={editableCode}
                onChange={(e) => setEditableCode(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                wrap="off"
                className="flex-1 w-full p-4 font-mono text-sm bg-transparent resize-none focus:outline-none text-[var(--text-primary)] text-left dir-ltr overflow-x-auto whitespace-pre"
              />
            </div>

            <div className="flex-1 flex flex-col bg-[var(--surface-inset)] min-w-0">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--surface-inset)] border-b border-[var(--border-default)]">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-accent uppercase tracking-widest">{dir === 'rtl' ? 'نتيجة التنفيذ' : 'SANDBOX EXECUTION'}</span>
                  {isRunning && <Loader2 size={10} className="animate-spin text-accent" />}
                </div>
                <div className="flex items-center gap-1.5">
                  {isPlaying ? (
                    <button onClick={handleStop} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-shape-sm bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase hover:bg-rose-500 hover:text-white transition-theme shadow-sm active:scale-95 cursor-pointer relative before:absolute before:-inset-1.5 before:content-['']">
                      <Square size={10} className="fill-current" />
                      {dir === 'rtl' ? 'إيقاف' : 'STOP'}
                    </button>
                  ) : (
                    <button onClick={handleRun} disabled={isRunning} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-shape-sm bg-accent/10 border border-accent/20 text-accent text-[9px] font-black uppercase hover:bg-accent hover:text-white transition-theme shadow-sm disabled:opacity-50 active:scale-95 cursor-pointer relative before:absolute before:-inset-1.5 before:content-['']">
                      <Play size={10} className="fill-current" />
                      {dir === 'rtl' ? 'تشغيل' : 'EXECUTE'}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 relative overflow-hidden min-w-0">
                {!isPlaying ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[var(--surface-inset)] transition-theme">
                    <Terminal size={40} className="text-accent/20 mb-3" />
                    <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1 uppercase tracking-wider">{dir === 'rtl' ? 'جاهز للتنفيذ' : 'READY TO EXECUTE'}</h4>
                    <p className="text-[10px] text-[var(--text-muted)] max-w-[200px] leading-relaxed">
                      {dir === 'rtl' ? 'انقر على "تشغيل" لمعاينة الأكواد التفاعلية في بيئة آمنة ومعزولة.' : 'Click "EXECUTE" to preview interactive code in a safe, isolated sandbox.'}
                    </p>
                  </div>
                ) : ['html', 'css'].includes(lang.toLowerCase()) ? (
                  iframeSrc ? (
                    <iframe
                      title="Perplexta Sandbox"
                      srcDoc={iframeSrc}
                      className="w-full h-full border-none bg-white"
                      sandbox="allow-scripts"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 size={24} className="animate-spin text-accent" />
                    </div>
                  )
                ) : (
                  <div className="flex flex-col h-full font-mono text-[11px] p-3 overflow-y-auto bg-black text-[var(--fg-success)] custom-scrollbar">
                    {outputLogs.length === 0 ? (
                      <div className="text-gray-600 italic">{dir === 'rtl' ? 'في انتظار مخرجات الكونسول...' : 'Waiting for console output...'}</div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {outputLogs.map((log, idx) => (
                          <div key={`log-${idx}`} className={`flex gap-2 ${log.type === 'error' ? 'text-rose-400' : log.type === 'warn' ? 'text-amber-400' : log.type === 'info' ? 'text-sky-400' : 'text-[var(--fg-success)]'}`}>
                            <span className="opacity-40 shrink-0">[{log.time}]</span>
                            <span className="font-bold shrink-0 uppercase">[{log.type}]</span>
                            <span className="break-all whitespace-pre-wrap">{log.text}</span>
                          </div>
                        ))}
                        <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <pre 
            dir="ltr"
            style={{ direction: 'ltr', unicodeBidi: 'isolate', textAlign: 'left' }}
            className="p-4 sm:p-5 overflow-x-auto custom-scrollbar bg-[var(--surface-card)] dark:bg-[#12161b] transition-theme text-left dir-ltr w-full max-w-full min-w-0 m-0 select-text"
          >
            <code 
              dir="ltr"
              style={{ direction: 'ltr', unicodeBidi: 'isolate', textAlign: 'left' }}
              className={`language-${lang} inline-block min-w-full w-max font-mono text-[13px] sm:text-sm leading-relaxed text-left dir-ltr pr-6 whitespace-pre`}
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </pre>
        )}

        {!isExpanded && lineCount > 25 && !sandboxMode && (
          <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[var(--surface-card)] via-[var(--surface-card)]/80 to-transparent pointer-events-none z-10 flex items-end justify-center pb-3 transition-colors">
            <button
              onClick={() => setIsExpanded(true)}
              className="px-3.5 py-1.5 rounded-shape-full bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--fg-accent)] text-[11px] font-bold uppercase tracking-wider backdrop-blur-md transition-colors pointer-events-auto shadow-md flex items-center gap-1.5 touch-target-44"
            >
              <ChevronDown size={12} />
              <span>{dir === 'rtl' ? 'عرض الكود كاملاً' : 'SHOW FULL SOURCE'}</span>
            </button>
          </div>
        )}
      </div>

      {isExpanded && lineCount > 25 && !sandboxMode && (
        <div className="sticky bottom-0 z-20 flex justify-center pb-3 bg-gradient-to-t from-[var(--surface-card)] via-[var(--surface-card)]/90 to-transparent pt-6 transition-colors">
          <button
            onClick={() => setIsExpanded(false)}
            className="px-3.5 py-1.5 rounded-shape-full bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] font-bold uppercase tracking-wider backdrop-blur-md transition-colors shadow-md flex items-center gap-1.5 touch-target-44"
          >
            <ChevronUp size={12} />
            <span>{dir === 'rtl' ? 'طي الكود البرمجي' : 'COLLAPSE SOURCE'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
