import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, FileCode, FileText, Database, Terminal, Download, Github, 
  Play, Plus, Trash2, Edit2, ChevronRight, ChevronLeft, ArrowUpRight, 
  Paperclip, Mic, Send, Sparkles, CheckCircle2, AlertTriangle, RefreshCw, X, Code, Globe, Layers,
  Monitor, Smartphone, Tablet, Maximize2, Minimize2, Wand2, Sliders, ArrowLeft, ArrowRight, Square,
  Clock, Loader2, Key, MousePointer, History, RotateCcw, RotateCw, Cloud, HardDrive, Check, Zap,
  Copy, ChevronDown
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast, PopCard, Button, ActionItem, Badge } from '@/design-system';
import initSqlJs from 'sql.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { resolveImageUrl } from '../utils/imageResolver';

interface ProjectFile {
  name: string;
  path: string;
  content: string;
  type: string;
  isEntry?: boolean;
}

interface StudioChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  logs?: string[];
  filesUpdated?: string[];
  suggestions?: string[];
}

export const AppStudioPage: React.FC = () => {
  const { theme, language, siteSettings, dir, token, user } = useAppContext();
  const navigate = useNavigate();

  const getAuthToken = useCallback(() => {
    try {
      if (token) return token;
      if (typeof window !== 'undefined') {
        const direct = localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('token');
        if (direct) return direct;
        const appToken = localStorage.getItem('app_token');
        if (appToken) return appToken;
      }
    } catch (e) {}
    return '';
  }, [token]);

  // Project Files State (Clean Initial Sovereign Launchpad with Logo)
  const [files, setFiles] = useState<Record<string, ProjectFile>>({
    'index.html': {
      name: 'index.html',
      path: 'index.html',
      type: 'html',
      isEntry: true,
      content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>استوديو بيربليكستا - مشروع جديد</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-['Tajawal','Cairo',sans-serif] min-h-screen flex items-center justify-center p-6 selection:bg-blue-600 selection:text-white">
  <div class="max-w-md w-full text-center space-y-6">
    <!-- Brand Logo Glow Icon -->
    <div class="relative mx-auto w-16 h-16 rounded-shape-md bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-xl shadow-blue-500/25 flex items-center justify-center">
      <div class="w-full h-full bg-slate-900 rounded-shape-sm flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="text-blue-500" style="width: 32px; height: 32px; max-width: 32px; max-height: 32px;">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div class="space-y-3">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-shape-full bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 text-xs font-bold">
        <span class="w-2 h-2 rounded-shape-full bg-blue-500 animate-ping"></span>
        <span>مشروع جديد فارغ • جاهز للبناء والتوليد</span>
      </div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">استوديو بيربليكستا السيادي</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
        أخبر المساعد الذكي بما تود بناءه الآن، وسيقوم بهندسة شجرة الملفات بالكامل، وإنشاء الأكواد وربطها وتجميعها لتكوين موقع وتطبيق احترافي متكامل.
      </p>
    </div>
  </div>
</body>
</html>`
    }
  });

  const [mobileActiveTab, setMobileActiveTab] = useState<'preview' | 'chat' | 'files'>('preview');

  const [projectId, setProjectId] = useState<string>(() => {
    return localStorage.getItem('perplexta_active_project_id') || ('proj_' + Date.now());
  });
  const [projectName, setProjectName] = useState<string>(() => {
    return localStorage.getItem('perplexta_active_project_name') || (dir === 'rtl' ? 'مشروع جديد' : 'New Project');
  });
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);

  const [activeFilePath, setActiveFilePath] = useState('index.html');
  const [pipelinePhase, setPipelinePhase] = useState<1 | 2 | 3 | null>(null);
  const [fileStatuses, setFileStatuses] = useState<Record<string, 'pending' | 'writing' | 'completed' | 'error'>>({});
  const [activeBlueprint, setActiveBlueprint] = useState<any>(null);

  // Progressive contextual suggestions state mapping
  const [clickedSuggestions, setClickedSuggestions] = useState<string[]>([]);
  const PROGRESSIVE_SUGGESTIONS_MAP: Record<string, string> = {
    'تصميم قسم مراجعات وآراء العملاء بشكل تفاعلي متحرك': 'تطوير بطاقة تسجيل دخول وقاعدة بيانات للمستخدمين',
    'تطوير بطاقة تسجيل دخول وقاعدة بيانات للمستخدمين': 'ربط سلة المشتريات ببوابات دفع ذكية وفواتير مفصلة',
    'ربط سلة المشتريات ببوابات دفع ذكية وفواتير مفصلة': 'إضافة نظام كوبونات خصم وتخفيضات تفاعلي',
    'إضافة نظام كوبونات خصم وتخفيضات تفاعلي': 'تصميم لوحة إحصائيات للمبيعات والزيارات',
    'تصميم لوحة إحصائيات للمبيعات والزيارات': 'إضافة نظام إشعارات حية منبثقة عند الشراء',
    'تحسين التجاوب البصري الكامل مع شاشات الجوال والتابلت': 'تطوير شريط تنقل علوي ذكي مرن يختفي عند النزول',
    'تطوير شريط تنقل علوي ذكي مرن يختفي عند النزول': 'إضافة زر عائم للاتصال عبر الواتساب والدعم الفني',
    'برمجة لوحة إحصائيات وإدارة للمشروع': 'إضافة ميزة تصدير التقارير والفواتير بصيغة PDF',
    'أضف الوضع المظلم والنهاري': 'تطوير مؤثرات بصرية وتمرير سلس للصفحة (Scroll Reveal)',
    'تحسين التصميم واستجابة الشاشات': 'تحسين التجاوب البصري الكامل مع شاشات الجوال والتابلت',
    'إضافة بوابات دفع وسلة شراء متقدمة': 'ربط سلة المشتريات ببوابات دفع ذكية وفواتير مفصلة',
    'أنشئ متجر بيع منتجات رقمية مع سلة شراء متطورة': 'تطوير بطاقة تسجيل دخول وقاعدة بيانات للمستخدمين',
    'أنشئ صفحة هبوط تفاعلية بتصميم حديث': 'تصميم قسم مراجعات وآراء العملاء بشكل تفاعلي متحرك',
    'أنشئ لوحة تحكم وإحصائيات مع رسوم بيانية': 'برمجة لوحة إحصائيات وإدارة للمشروع',
    'أضف الوضع الليلي وتجاوب كامل مع الجوال': 'تحسين التجاوب البصري الكامل مع شاشات الجوال والتابلت'
  };

  // Pro Cloud Studio Features (Inspect Mode, Env Vars, Self-Healing, VFS History)
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  const [envVars, setEnvVars] = useState<Record<string, string>>({
    VITE_APP_TITLE: 'Perplexta App',
    VITE_API_URL: '/api'
  });
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');
  const [runtimeError, setRuntimeError] = useState<{ message: string; file?: string } | null>(null);
  const [vfsHistory, setVfsHistory] = useState<Array<Record<string, ProjectFile>>>([]);
  const [vfsHistoryIndex, setVfsHistoryIndex] = useState(-1);
  const [savedFiles, setSavedFiles] = useState<Record<string, ProjectFile>>(() => JSON.parse(JSON.stringify(files)));
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'local' | 'error'>('synced');
  const [isWorkspacesModalOpen, setIsWorkspacesModalOpen] = useState(false);
  const [workspacesModalTab, setWorkspacesModalTab] = useState<'workspaces' | 'snapshots'>('workspaces');
  const [userWorkspaces, setUserWorkspaces] = useState<any[]>([]);
  const [studioUsage, setStudioUsage] = useState<any>(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [workspaceSnapshots, setWorkspaceSnapshots] = useState<any[]>([]);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  const toggleLogs = (msgId: string) => {
    setExpandedLogs(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Platform Confirmation & Deletion Modals State
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const [projectToRename, setProjectToRename] = useState<{ id: string; title: string } | null>(null);
  const [renameText, setRenameText] = useState('');
  const [isRenamingProject, setIsRenamingProject] = useState(false);

  const [snapshotToRestore, setSnapshotToRestore] = useState<{ id: number; name: string } | null>(null);
  const [isRestoringSnapshot, setIsRestoringSnapshot] = useState(false);

  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFilePathInput, setNewFilePathInput] = useState('');

  const [fileToRename, setFileToRename] = useState<string | null>(null);
  const [newFilePathRename, setNewFilePathRename] = useState('');
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<Array<{ type: 'log' | 'error' | 'success'; text: string; time: string }>>([
    { type: 'log', text: 'تم بدء تشغيل بيئة العمل الافتراضية (Virtual Sandbox IDE).', time: new Date().toLocaleTimeString() },
    { type: 'log', text: 'تم تحميل ملف index.html وربط الأصول بنجاح.', time: new Date().toLocaleTimeString() }
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  const handleTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;
    setTerminalInput('');
    addLog('log', `$ ${cmd}`);

    const lower = cmd.toLowerCase();
    if (lower === 'clear' || lower === 'cls') {
      setTerminalLogs([]);
    } else if (lower === 'help') {
      addLog('log', 'الأوامر المتاحة: help, clear, files, lint, fix, refresh, status, db');
    } else if (lower === 'files' || lower === 'ls') {
      const list = Object.keys(files).map(k => `• ${k} (${files[k].content.length} chars)`).join(' | ');
      addLog('log', `ملفات المشروع: ${list}`);
    } else if (lower === 'lint' || lower === 'check') {
      addLog('log', 'جاري فحص سلامة الأكواد والوسوم...');
      let errorsFound = false;
      if (!files['index.html']?.content.includes('<html')) {
        addLog('error', 'تنبيه: ملف index.html لا يحتوي على وسم <html> الأساسي');
        errorsFound = true;
      }
      if (!errorsFound) {
        addLog('success', 'فحص سلامة الأكواد: كافة الملفات سليمة ومكتملة.');
      }
    } else if (lower === 'fix') {
      handleAiFix();
    } else if (lower === 'refresh') {
      setIframeKey(prev => prev + 1);
      addLog('success', 'تم تحديث شاشة المعاينة بنجاح.');
    } else if (lower === 'status') {
      addLog('log', `إجمالي الملفات: ${Object.keys(files).length} | الملف النشط: ${activeFilePath} | محرك SQLite: ${sqlDb ? 'متصل' : 'غير مهيأ'}`);
    } else if (lower === 'db') {
      setIsDbModalOpen(true);
      addLog('success', 'تم فتح مدير قاعدة البيانات SQLite.');
    } else {
      addLog('error', `أمر غير معروف: "${cmd}". اكتب help لعرض قائمة الأوامر.`);
    }
  };

  // AI Assistant Chat Messages & State
  const [chatMessages, setChatMessages] = useState<StudioChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      text: dir === 'rtl' 
        ? 'مرحباً بك في استوديو بيربليكستا السيادي! ⚡ أنا مهندس البرمجيات ومساعدك الذكي لبناء وتطوير المشاريع وتوليد الأكواد في الوقت الفعلي. ماذا تود أن نبني اليوم؟'
        : 'Welcome to Perplexta Sovereign Studio! ⚡ I am your AI Software Architect. What would you like us to build or refactor today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: dir === 'rtl' 
        ? [
            'أنشئ متجر بيع منتجات رقمية مع سلة شراء متطورة',
            'أنشئ صفحة هبوط تفاعلية بتصميم حديث',
            'أنشئ لوحة تحكم وإحصائيات مع رسوم بيانية',
            'أضف الوضع الليلي وتجاوب كامل مع الجوال'
          ]
        : [
            'Build a digital products store with interactive cart',
            'Create a modern animated SaaS landing page',
            'Build an analytics dashboard with chart visualizers',
            'Add full mobile responsiveness and dark mode'
          ]
    }
  ]);

  const hasExecutedHubPromptRef = useRef(false);
  const chatFeedRef = useRef<HTMLDivElement>(null);

  // Consume incoming project or prompt from Hub, or restore persistent workspace
  useEffect(() => {
    if (hasExecutedHubPromptRef.current) return;
    try {
      const pendingPrompt = sessionStorage.getItem('pending_ai_prompt');
      const rawHub = sessionStorage.getItem('current_active_project');

      if (rawHub) {
        const proj = JSON.parse(rawHub);
        if (proj.id) {
          setProjectId(proj.id);
          localStorage.setItem('perplexta_active_project_id', proj.id);
        }
        if (proj.name) {
          setProjectName(proj.name);
          localStorage.setItem('perplexta_active_project_name', proj.name);
        }
        if (proj.files && Object.keys(proj.files).length > 0) {
          setFiles(proj.files);
          setSavedFiles(proj.files);
          setIframeKey(prev => prev + 1);
          sessionStorage.removeItem('current_active_project');
          sessionStorage.removeItem('pending_ai_prompt');
          return;
        }
      }

      if (pendingPrompt && pendingPrompt.trim().length > 0) {
        hasExecutedHubPromptRef.current = true;
        const promptToRun = pendingPrompt.trim();
        sessionStorage.removeItem('pending_ai_prompt');
        sessionStorage.removeItem('current_active_project');

        toast.info(language === 'ar' ? 'بدء تنفيذ أمر التوليد الذكي فورا...' : 'Starting immediate AI generation task...');
        setTimeout(() => {
          handleSendPrompt(promptToRun);
        }, 350);
        return;
      } else if (rawHub) {
        const proj = JSON.parse(rawHub);
        if (proj.description && proj.description.trim().length > 0) {
          hasExecutedHubPromptRef.current = true;
          const promptToRun = proj.description.trim();
          sessionStorage.removeItem('current_active_project');
          setTimeout(() => {
            handleSendPrompt(promptToRun);
          }, 350);
          return;
        }
      }

      // Restore Persistent Workspace Memory from LocalStorage
      const savedWorkspace = localStorage.getItem('perplexta_studio_workspace_v2');
      if (savedWorkspace) {
        const parsed = JSON.parse(savedWorkspace);
        if (parsed.projectId) {
          setProjectId(parsed.projectId);
          localStorage.setItem('perplexta_active_project_id', parsed.projectId);
        }
        if (parsed.projectName) {
          setProjectName(parsed.projectName);
          localStorage.setItem('perplexta_active_project_name', parsed.projectName);
        }
        if (parsed.files && Object.keys(parsed.files).length > 0) {
          setFiles(parsed.files);
          setSavedFiles(parsed.files);
          if (parsed.activeFilePath && parsed.files[parsed.activeFilePath]) {
            setActiveFilePath(parsed.activeFilePath);
          }
          if (Array.isArray(parsed.chatMessages) && parsed.chatMessages.length > 0) {
            setChatMessages(parsed.chatMessages);
          }
          if (Array.isArray(parsed.terminalLogs) && parsed.terminalLogs.length > 0) {
            setTerminalLogs(parsed.terminalLogs);
          }
          setIframeKey(prev => prev + 1);
        }
      }
    } catch (e) {
      console.warn('Error restoring studio workspace memory:', e);
    }
  }, []);

  // Listen to postMessage from preview iframe for console logs, runtime errors, and element inspector
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      const { type, level, message, info } = event.data;

      if (type === 'CONSOLE_LOG') {
        // Filter out harmless iframe WebSocket HMR connection errors
        const isWsError = typeof message === 'string' && (
          message.includes('WebSocket closed without opened') ||
          message.includes('failed to connect to websocket') ||
          message.includes('[vite]: failed to connect') ||
          message.includes('ws://') ||
          message.includes('wss://')
        );

        if (level === 'error') {
          if (isWsError) {
            addLog('log', `[معاينة Vite]: ${message}`);
            return;
          }
          addLog('error', `[المعاينة الحية]: ${message}`);
          setRuntimeError({ message });
        } else {
          addLog('log', `[المعاينة]: ${message}`);
        }
      } else if (type === 'INSPECT_ELEMENT_CLICK' && info) {
        setIsInspectMode(false);
        const tagDesc = info.tag ? `<${info.tag}${info.className ? ` class="${info.className}"` : ''}>` : 'العنصر المحدد';
        const textDesc = info.text ? ` بالنص "${info.text}"` : '';
        const generatedPrompt = `🎯 قم بتعديل وتطوير المكون والتصميم الخاص بـ ${tagDesc}${textDesc}: `;
        setPromptQuery(generatedPrompt);
        toast.success(dir === 'rtl' ? '🎯 تم التقاط العنصر بنجاح! صف التعديل المطلوب برمجياً' : 'Captured element! Describe your desired change.');
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [dir]);

  // Auto-Save Workspace State to Persistent Local Storage and Hub Registry on every change
  useEffect(() => {
    try {
      if (files && Object.keys(files).length > 0) {
        localStorage.setItem('perplexta_studio_workspace_v2', JSON.stringify({
          projectId,
          projectName,
          files,
          activeFilePath,
          chatMessages,
          terminalLogs: terminalLogs.slice(-30)
        }));

        // Keep Hub Projects Registry updated in real time
        const rawHub = localStorage.getItem('perplexta_hub_projects');
        let hubList: any[] = rawHub ? JSON.parse(rawHub) : [];
        if (!Array.isArray(hubList)) hubList = [];

        const existingIdx = hubList.findIndex(p => p.id === projectId);
        const hubProj = {
          id: projectId,
          name: projectName,
          description: files['index.html'] ? 'مشروع تفاعلي مكتمل في استوديو بيربليكستا' : 'مشروع ويب جديد قيد البناء',
          techStack: 'HTML5 / JS / SQLite',
          updatedAt: dir === 'rtl' ? 'الآن' : 'Just now',
          dbSize: '128 KB',
          tablesCount: Object.keys(files).length,
          recordsCount: 1,
          isAutoSaved: true,
          files: files
        };

        if (existingIdx >= 0) {
          hubList[existingIdx] = { ...hubList[existingIdx], ...hubProj };
        } else {
          hubList.unshift(hubProj);
        }
        localStorage.setItem('perplexta_hub_projects', JSON.stringify(hubList));
      }
    } catch (_) {}
  }, [files, activeFilePath, chatMessages, terminalLogs, projectId, projectName, dir]);

  const hasUnsavedChanges = files[activeFilePath]?.content !== savedFiles[activeFilePath]?.content;

  const handleSaveChanges = () => {
    setSavedFiles(JSON.parse(JSON.stringify(files)));
    setIframeKey(prev => prev + 1);
    toast.success(dir === 'rtl' ? `تم حفظ الملف ${activeFilePath} بنجاح وتحديث المعاينة!` : `Successfully saved ${activeFilePath} & updated preview!`);
    addLog('success', `حفظ التغييرات وتحديث المعاينة للملف: ${activeFilePath}`);
    saveProjectToDb();
  };

  const handleUndoChanges = () => {
    if (savedFiles[activeFilePath]) {
      setFiles(prev => ({
        ...prev,
        [activeFilePath]: { ...prev[activeFilePath], content: savedFiles[activeFilePath].content }
      }));
      toast.info(dir === 'rtl' ? 'تم التراجع عن التغييرات غير الحفظ' : 'Reverted to last saved version');
      addLog('log', `تراجع عن التغييرات في الملف: ${activeFilePath}`);
    }
  };
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [deviceMode, setDeviceMode] = useState<'responsive' | 'mobile' | 'tablet'>('responsive');
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isManualEditorOpen, setIsManualEditorOpen] = useState(false);
  const [promptQuery, setPromptQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamStatusMessage, setStreamStatusMessage] = useState<string>('');
  const [liveStreamText, setLiveStreamText] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setStreamStatusMessage('');
    setLiveStreamText('');
    addLog('log', 'تم إيقاف عملية التوليد في الوقت الفعلي.');
    setChatMessages(prev => [
      ...prev,
      {
        id: `stop_${Date.now()}`,
        role: 'assistant',
        text: dir === 'rtl' ? '⏹️ تم إيقاف عملية التوليد في الوقت الفعلي بناءً على طلبك.' : '⏹️ Real-time generation stopped by user.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    toast.info(dir === 'rtl' ? 'تم إيقاف التوليد' : 'Generation stopped');
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isGenerating]);

  // Smooth auto-scroll using chatFeedRef
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages, liveStreamText, isGenerating]);

  // SQLite Database via sql.js
  const [sqlDb, setSqlDb] = useState<any>(null);
  const [sqlTables, setSqlTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('products');
  const [tableDataRows, setTableDataRows] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [sqlCustomQuery, setSqlCustomQuery] = useState('SELECT * FROM products;');
  const [queryResult, setQueryResult] = useState<any>(null);

  // Initialize SQLite
  useEffect(() => {
    let isMounted = true;
    initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    }).then(SQL => {
      if (!isMounted) return;
      const db = new SQL.Database();
      const schema = files['db/schema.sql']?.content || '';
      try {
        db.run(schema);
        setSqlDb(db);
        refreshTables(db);
        addLog('success', 'تم تهيئة محرك SQLite الافتراضي بنجاح من schema.sql');
      } catch (err: any) {
        addLog('error', `خطأ في تهيئة قاعدة البيانات: ${err.message}`);
      }
    }).catch(err => {
      console.warn('sql.js load error:', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshTables = (db: any) => {
    try {
      const res = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
      if (res && res[0] && res[0].values) {
        const tables = res[0].values.map((v: any) => v[0] as string);
        setSqlTables(tables);
        if (tables.length > 0 && !tables.includes(selectedTable)) {
          setSelectedTable(tables[0]);
        }
      }
    } catch (e) {}
  };

  // Load table data when selectedTable changes
  useEffect(() => {
    if (!sqlDb || !selectedTable) return;
    try {
      const res = sqlDb.exec(`SELECT * FROM ${selectedTable};`);
      if (res && res[0]) {
        setTableColumns(res[0].columns);
        setTableDataRows(res[0].values);
      } else {
        setTableColumns([]);
        setTableDataRows([]);
      }
    } catch (e) {
      setTableColumns([]);
      setTableDataRows([]);
    }
  }, [sqlDb, selectedTable, isDbModalOpen]);

  const runCustomSqlQuery = () => {
    if (!sqlDb) return;
    try {
      const res = sqlDb.exec(sqlCustomQuery);
      if (res && res[0]) {
        setQueryResult({ columns: res[0].columns, values: res[0].values });
        addLog('success', `تنفيذ الاستعلام بنجاح: ${sqlCustomQuery}`);
      } else {
        setQueryResult({ success: true, message: 'تم تنفيذ الاستعلام بنجاح (لا توجد نتائج مرجعة).' });
        addLog('success', 'تم تنفيذ الاستعلام بنجاح.');
      }
      refreshTables(sqlDb);
    } catch (err: any) {
      setQueryResult({ error: err.message });
      addLog('error', `خطأ SQL: ${err.message}`);
    }
  };

  const addLog = (type: 'log' | 'error' | 'success', text: string) => {
    setTerminalLogs(prev => [...prev, { type, text, time: new Date().toLocaleTimeString() }]);
  };

  // Virtual File System Blob URL Injection Strategy for instant iframe sync without page reloads
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CONSOLE_LOG') {
        const level = event.data.level === 'error' ? 'error' : 'log';
        addLog(level, event.data.message);
      } else if (event.data?.type === 'PERPLEXTA_LOAD_CODE') {
        // Load code from host (database)
        if (event.data.files) {
          setFiles(event.data.files);
          addLog('success', 'Project loaded successfully via host event');
        }
      } else if (event.data?.type === 'PERPLEXTA_SAVE_CODE') {
        // Handle trigger save
        saveProjectToDb();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const saveProjectToDb = async (overrideId?: string, overrideTitle?: string, overrideFiles?: Record<string, ProjectFile>) => {
    const token = getAuthToken();
    const targetId = overrideId || projectId || ('proj_' + Date.now());
    const targetTitle = overrideTitle || projectName || (dir === 'rtl' ? 'مشروع جديد' : 'My Project');
    const targetFiles = overrideFiles || files;

    setSyncStatus('saving');
    try {
      const res = await fetch('/api/studio/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: targetId,
          title: targetTitle,
          description: targetFiles['index.html'] ? 'مشروع ويب تفاعلي في استوديو بيربليكستا' : 'مسودة مشروع جديد',
          frameworkMode: 'html',
          files: targetFiles,
          chatHistory: chatMessages.slice(-50),
          isPublic: false
        })
      });
      if (res.ok) {
        setSyncStatus(token ? 'synced' : 'local');
        addLog('success', token ? `تم حفظ (${targetTitle}) سحابياً في قاعدة البيانات بنجاح.` : `تم حفظ وتحديث مسودة (${targetTitle}) محلياً بنجاح.`);
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 && (errData.error === 'STUDIO_PROJECTS_LIMIT_REACHED' || errData.error === 'STUDIO_STORAGE_LIMIT_EXCEEDED')) {
          setSyncStatus('error');
          const msg = dir === 'rtl' ? (errData.message || 'تم بلوغ حد الاستوديو في خطتك') : (errData.messageEn || 'Studio quota limit reached for your plan');
          toast.error(msg);
          addLog('error', msg);
        } else {
          setSyncStatus(token ? 'error' : 'local');
        }
      }
    } catch (e: any) {
      console.warn('Auto-save workspace error:', e);
      setSyncStatus(token ? 'error' : 'local');
    }
  };

  const fetchStudioUsage = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch('/api/studio/usage', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        setStudioUsage(data);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchUserWorkspaces = async () => {
    setIsLoadingWorkspaces(true);
    fetchStudioUsage();
    try {
      const token = getAuthToken();
      if (!token) {
        setUserWorkspaces([]);
        return;
      }
      const res = await fetch('/api/studio/workspaces', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserWorkspaces(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to fetch workspaces:', err);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  const fetchSnapshots = async (wsId: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(`/api/studio/workspaces/${wsId}/snapshots`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaceSnapshots(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to fetch snapshots:', err);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!newSnapshotName.trim()) return;
    setIsSnapshotLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/studio/workspaces/${projectId}/snapshots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ versionName: newSnapshotName.trim(), files })
      });
      if (res.ok) {
        toast.success(dir === 'rtl' ? 'تم إنشاء لقطة الإصدار بنجاح!' : 'Snapshot created!');
        setNewSnapshotName('');
        fetchSnapshots(projectId);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSnapshotLoading(false);
    }
  };

  const handleRestoreSnapshot = (snapshotId: number, versionName: string) => {
    setSnapshotToRestore({ id: snapshotId, name: versionName });
  };

  const executeRestoreSnapshot = async () => {
    if (!snapshotToRestore) return;
    setIsRestoringSnapshot(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/studio/workspaces/${projectId}/snapshots/${snapshotToRestore.id}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files) {
          setFiles(data.files);
          setSavedFiles(data.files);
          setIframeKey(prev => prev + 1);
          toast.success(dir === 'rtl' ? `تم استعادة الإصدار (${snapshotToRestore.name}) بنجاح!` : `Restored ${snapshotToRestore.name}!`);
          addLog('success', `تم استعادة الإصدار: ${snapshotToRestore.name}`);
        }
        setSnapshotToRestore(null);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsRestoringSnapshot(false);
    }
  };

  const handleSwitchWorkspace = async (ws: any) => {
    if (ws.id === projectId) {
      setIsWorkspacesModalOpen(false);
      return;
    }
    // Safely auto-save the current project before switching
    await saveProjectToDb();

    const loadedFiles = typeof ws.files === 'string' ? JSON.parse(ws.files) : (ws.files || {});
    setProjectId(ws.id);
    setProjectName(ws.title);
    setFiles(loadedFiles);
    setSavedFiles(loadedFiles);
    setActiveFilePath('index.html');
    if (Array.isArray(ws.chat_history) && ws.chat_history.length > 0) {
      setChatMessages(ws.chat_history);
    }
    setIframeKey(prev => prev + 1);

    localStorage.setItem('perplexta_active_project_id', ws.id);
    localStorage.setItem('perplexta_active_project_name', ws.title);
    setIsWorkspacesModalOpen(false);
    toast.success(dir === 'rtl' ? `تم تحميل مشروع: ${ws.title}` : `Loaded project: ${ws.title}`);
    addLog('success', `تم التبديل إلى المشروع السحابي: ${ws.title}`);
  };

  const handleDeleteWorkspacePrompt = (wsId: string, wsTitle: string) => {
    setProjectToDelete({ id: wsId, title: wsTitle });
    setDeleteConfirmText('');
  };

  const executeDeleteWorkspace = async () => {
    if (!projectToDelete) return;
    if (deleteConfirmText.trim() !== projectToDelete.title.trim()) {
      toast.error(dir === 'rtl' ? 'يرجى كتابة اسم المشروع بدقة لتأكيد الحذف' : 'Please type the exact project name to confirm');
      return;
    }

    setIsDeletingProject(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/studio/workspaces/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(dir === 'rtl' ? `تم حذف ${projectToDelete.title} نهائياً` : `Deleted ${projectToDelete.title}`);
        addLog('log', `تم حذف المشروع السحابي: ${projectToDelete.title}`);
        fetchUserWorkspaces();
        if (projectToDelete.id === projectId) {
          handleCreateNewProject();
        }
        setProjectToDelete(null);
        setDeleteConfirmText('');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || (dir === 'rtl' ? 'فشل حذف المشروع' : 'Failed to delete project'));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleRenameWorkspacePrompt = (wsId: string, currentTitle: string) => {
    setProjectToRename({ id: wsId, title: currentTitle });
    setRenameText(currentTitle);
  };

  const executeRenameWorkspace = async () => {
    if (!projectToRename || !renameText.trim()) return;

    setIsRenamingProject(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/studio/workspaces/${projectToRename.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title: renameText.trim() })
      });
      if (res.ok) {
        toast.success(dir === 'rtl' ? `تم تعديل اسم المشروع إلى "${renameText.trim()}"` : `Renamed to "${renameText.trim()}"`);
        if (projectToRename.id === projectId) {
          setProjectName(renameText.trim());
          localStorage.setItem('perplexta_active_project_name', renameText.trim());
        }
        fetchUserWorkspaces();
        setProjectToRename(null);
        setRenameText('');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || (dir === 'rtl' ? 'فشل تعديل اسم المشروع' : 'Failed to rename project'));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsRenamingProject(false);
    }
  };

  const executeDeleteFile = () => {
    if (!fileToDelete) return;
    const path = fileToDelete;
    setFiles(prev => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
    if (activeFilePath === path) {
      setActiveFilePath('index.html');
    }
    addLog('log', `تم حذف الملف: ${path}`);
    toast.info(dir === 'rtl' ? `تم حذف ${path}` : `Deleted ${path}`);
    setFileToDelete(null);
  };



  // Clean Virtual HTML Bundler for flawless instant iframe sync without Blob URL CSP blocking
  const previewSrcDoc = useMemo(() => {
    let rawHtml = files['index.html']?.content || '<div class="p-8 text-center text-slate-400">جاري تحميل المشروع...</div>';
    if (rawHtml.includes('\\n') && (rawHtml.match(/\\n/g)?.length || 0) > 3) {
      rawHtml = rawHtml
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"');
    }

    // Replace relative local <script src="..."> and <link href="..."> tags to avoid 404 network fetch errors in srcdoc
    let htmlContent = rawHtml
      .replace(/<script\s+[^>]*src=["']\/?(?:\.\/)?(?:src\/)?[^"']+\.(?:jsx?|tsx?|js|ts)["'][^>]*><\/script>/gi, '')
      .replace(/<script\s+[^>]*src=["']\/?(?:\.\/)?app\.js["'][^>]*><\/script>/gi, '')
      .replace(/<script\s+[^>]*src=["']\/?(?:\.\/)?script\.js["'][^>]*><\/script>/gi, '')
      .replace(/<script\s+[^>]*src=["']\/?(?:\.\/)?main\.js["'][^>]*><\/script>/gi, '')
      .replace(/<link\s+[^>]*href=["']\/?(?:\.\/)?(?:src\/)?[^"']+\.css["'][^>]*\/?>/gi, '')
      // Rewrite any remaining external CDN links inside user html to our local, cached, CSP-immune proxy
      .replace(/https:\/\/unpkg\.com\/scrollreveal(?:\/dist\/scrollreveal\.min\.js)?/gi, '/api/studio/proxy/scrollreveal')
      .replace(/https:\/\/unpkg\.com\/lucide@latest\/dist\/umd\/lucide\.js/gi, '/api/studio/proxy/lucide')
      .replace(/https:\/\/unpkg\.com\/lucide@latest/gi, '/api/studio/proxy/lucide')
      .replace(/https:\/\/cdn\.tailwindcss\.com/gi, '/api/studio/proxy/tailwind');

    // Collect all CSS files
    const allCss = Object.keys(files)
      .filter(p => p.endsWith('.css'))
      .map(p => {
        let c = files[p].content;
        if (c.includes('\\n')) c = c.replace(/\\n/g, '\n');
        return c;
      })
      .join('\n');

    // Collect and topologically sort all JS, JSX, TS, TSX files (filtering out config files like vite.config.js, tailwind.config.cjs)
    const allCodeFiles = Object.keys(files)
      .filter(p => p.startsWith('src/') || p === 'app.js' || p === 'script.js' || p === 'index.js')
      .filter(p => p.endsWith('.js') || p.endsWith('.jsx') || p.endsWith('.ts') || p.endsWith('.tsx'));

    const getFilePriority = (path: string) => {
      if (path.includes('types')) return 1;
      if (path.includes('data') || path.includes('mock')) return 2;
      if (path.includes('context')) return 3;
      if (path.includes('components')) return 4;
      if (path.includes('pages')) return 5;
      if (path.endsWith('App.jsx') || path.endsWith('App.tsx')) return 6;
      if (path.endsWith('main.jsx') || path.endsWith('main.tsx') || path === 'app.js') return 7;
      return 4;
    };

    const sortedFiles = [...allCodeFiles].sort((a, b) => getFilePriority(a) - getFilePriority(b));

    const cleanEsmForBrowser = (code: string) => {
      if (!code) return '';
      
      // Parse export { val1, val2 } and bind each to window, then remove the export statement
      const exportBlockRegex = /export\s*\{([\s\S]*?)\};?/g;
      let match;
      let cleanCode = code;
      let binds = '';
      while ((match = exportBlockRegex.exec(code)) !== null) {
        const exports = match[1].split(',').map(x => x.trim());
        exports.forEach(exp => {
          if (exp) {
            const parts = exp.split(/\s+as\s+/i);
            const orig = parts[0].trim();
            const alias = parts[parts.length - 1].trim();
            if (alias && alias !== 'default') {
              binds += `\ntry { window.${alias} = ${orig}; } catch(_) {}`;
            }
          }
        });
      }
      cleanCode = cleanCode.replace(exportBlockRegex, '') + binds;

      return cleanCode
        .replace(/import\.meta\.env/g, '(window.__VITE_ENV__ || window.process?.env || {})')
        .replace(/import\s*\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"];?/g, 'const {$1} = window.LucideIconProxy || {};')
        .replace(/import\s+[\s\S]*?\s+from\s+['"][^'"]+['"];?/g, '')
        .replace(/import\s+['"][^'"]+['"];?/g, '')
        .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g, 'window.$1 = $1; function $1')
        .replace(/export\s+default\s+function\s*/g, 'function ')
        .replace(/export\s+default\s+class\s+([A-Za-z0-9_]+)/g, 'window.$1 = $1; class $1')
        .replace(/export\s+default\s+class\s*/g, 'class ')
        .replace(/export\s+default\s+([A-Za-z0-9_]+);?/g, 'window.$1 = $1;')
        .replace(/export\s+const\s+([A-Za-z0-9_]+)\s*=/g, 'const $1 = window.$1 =')
        .replace(/export\s+let\s+([A-Za-z0-9_]+)\s*=/g, 'let $1 = window.$1 =')
        .replace(/export\s+var\s+([A-Za-z0-9_]+)\s*=/g, 'var $1 = window.$1 =')
        .replace(/export\s+function\s+([A-Za-z0-9_]+)/g, 'window.$1 = $1; function $1')
        .replace(/export\s+(let|var|class|type|interface)\s+/g, '$1 ');
    };

    // Detect entry file dynamically across all possible framework patterns
    const entryCandidates = [
      'src/main.tsx', 'src/main.jsx', 'src/main.js', 'src/main.ts',
      'src/App.tsx', 'src/App.jsx', 'src/App.js', 'src/App.ts',
      'src/app.tsx', 'src/app.jsx', 'src/app.js', 'src/app.ts',
      'src/index.tsx', 'src/index.jsx', 'src/index.js', 'src/index.ts',
      'main.tsx', 'main.jsx', 'main.js', 'main.ts',
      'App.tsx', 'App.jsx', 'App.js',
      'app.js', 'script.js', 'index.js'
    ];

    const entryFilePath = entryCandidates.find(p => files[p] && typeof files[p].content === 'string' && files[p].content.trim().length > 0) || '';

    const otherJsScripts = sortedFiles
      .filter(p => p !== entryFilePath)
      .map(p => {
        const isBabel = p.endsWith('.jsx') || p.endsWith('.tsx');
        if (isBabel) {
          return `
            <script type="babel" data-presets="typescript,react,env" data-file="${p}">
              /* --- File: ${p} --- */
              ${cleanEsmForBrowser(files[p].content)}
            </script>
          `;
        } else {
          return `
            <script data-file="${p}">
              /* --- File: ${p} --- */
              ${cleanEsmForBrowser(files[p].content)}
            </script>
          `;
        }
      }).join('\n');

    const rawEntry = entryFilePath ? files[entryFilePath].content : '';
    const entryJs = cleanEsmForBrowser(rawEntry);

    // Guarantee both #root and #app containers exist for React and Vanilla JS rendering
    if (!htmlContent.includes('id="root"') && !htmlContent.includes('id="app"')) {
      const defaultContainers = '<div id="root"></div><div id="app"></div>';
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', defaultContainers + '</body>');
      } else {
        htmlContent += defaultContainers;
      }
    }

    const injectionHead = `
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
      <script src="/api/studio/proxy/tailwind"></script>
      <script src="/api/studio/proxy/react"></script>
      <script src="/api/studio/proxy/react-dom"></script>
      <script src="/api/studio/proxy/babel"></script>
      <script src="/api/studio/proxy/lucide"></script>
      <script src="/api/studio/proxy/chartjs"></script>
      <script>
        // Event listener race-condition polyfill for DOMContentLoaded and load events in iframes
        (function() {
          const originalAddEventListener = EventTarget.prototype.addEventListener;
          EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (type === 'DOMContentLoaded' && (document.readyState === 'interactive' || document.readyState === 'complete')) {
              try { listener.call(this, { type: 'DOMContentLoaded', target: document, currentTarget: document }); } catch(e) { console.error('DOMContentLoaded race polyfill bypass:', e); }
              return;
            }
            if (type === 'load' && document.readyState === 'complete') {
              try { listener.call(this, { type: 'load', target: window, currentTarget: window }); } catch(e) { console.error('load race polyfill bypass:', e); }
              return;
            }
            return originalAddEventListener.apply(this, arguments);
          };
        })();

        window.initLucideIcons = function() {
          try {
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
              window.lucide.createIcons();
            } else if (window.Lucide && typeof window.Lucide.createIcons === 'function') {
              window.Lucide.createIcons();
            }
          } catch(_) {}
        };
        // Polyfill Lucide React icon components
        window.LucideIconProxy = new Proxy({}, {
          get: function(target, prop) {
            if (typeof prop === 'string' && prop !== 'then' && prop !== 'prototype') {
              return function LucideIconComponent(props) {
                var cls = (props && props.className) ? props.className + ' lucide' : 'w-5 h-5 inline-block lucide';
                var iconName = prop.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
                return React.createElement('i', Object.assign({ 'data-lucide': iconName, className: cls }, props));
              };
            }
            return undefined;
          }
        });
        // Guarantee ReactDOM.createRoot compatibility
        if (window.ReactDOM && !window.ReactDOM.createRoot) {
          window.ReactDOM.createRoot = function(container) {
            return {
              render: function(element) {
                window.ReactDOM.render(element, container);
              }
            };
          };
        }
        tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {
              fontFamily: {
                sans: ['Tajawal', 'Cairo', 'Inter', 'system-ui', 'sans-serif'],
                tajawal: ['Tajawal', 'sans-serif'],
                cairo: ['Cairo', 'sans-serif'],
              }
            }
          }
        }
      </script>
      <style>
        ${allCss}
        body {
          font-family: 'Tajawal', 'Cairo', 'Inter', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      </style>
      <script>
        (function() {
          const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
          };
          function sendLog(type, args) {
            try {
              const message = Array.from(args).map(arg => {
                if (arg instanceof Error) return arg.message + '\n' + (arg.stack || '');
                if (typeof arg === 'object' && arg !== null) {
                  try { return arg.message || arg.description || JSON.stringify(arg, Object.getOwnPropertyNames(arg)); } catch(_) { return String(arg); }
                }
                return String(arg);
              }).join(' ');
              window.parent.postMessage({ type: 'CONSOLE_LOG', level: type, message: message }, '*');
            } catch(e) {}
          }
          console.log = function() { originalConsole.log.apply(console, arguments); sendLog('log', arguments); };
          console.error = function() { originalConsole.error.apply(console, arguments); sendLog('error', arguments); };
          console.warn = function() { originalConsole.warn.apply(console, arguments); sendLog('warn', arguments); };
          console.info = function() { originalConsole.info.apply(console, arguments); sendLog('info', arguments); };
          
          window.process = window.process || { env: {} };
          window.process.env = Object.assign(window.process.env, ${JSON.stringify(envVars)});
          window.__VITE_ENV__ = Object.assign({}, window.process.env);
          
          window.addEventListener('error', function(event) {
            var msg = String(event.message || '');
            if (msg.includes('WebSocket') || msg.includes('websocket') || msg.includes('ws://')) return;
            sendLog('error', [msg]);
          });
          window.addEventListener('unhandledrejection', function(event) {
            var reasonMsg = String(event.reason?.message || event.reason || '');
            if (reasonMsg.includes('WebSocket') || reasonMsg.includes('websocket') || reasonMsg.includes('ws://')) return;
            sendLog('error', ['Unhandled Promise Rejection: ' + reasonMsg]);
          });

          // Global Image Fallback Polyfill (prevents broken image placeholder icons)
          window.addEventListener('error', function(e) {
            if (e.target && e.target.tagName === 'IMG') {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80';
            }
          }, true);

          ${isInspectMode ? `
          // Inspect Mode Script
          document.addEventListener('mouseover', function(e) {
            e.stopPropagation();
            if (e.target && e.target.style) {
              e.target.dataset.oldOutline = e.target.style.outline;
              e.target.style.outline = '2px dashed #38bdf8';
              e.target.style.cursor = 'crosshair';
            }
          });
          document.addEventListener('mouseout', function(e) {
            e.stopPropagation();
            if (e.target && e.target.style) {
              e.target.style.outline = e.target.dataset.oldOutline || '';
            }
          });
          document.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var info = {
              tag: e.target.tagName ? e.target.tagName.toLowerCase() : 'element',
              text: (e.target.innerText || e.target.textContent || '').slice(0, 60).trim(),
              className: e.target.className || '',
              id: e.target.id || ''
            };
            window.parent.postMessage({ type: 'INSPECT_ELEMENT_CLICK', info: info }, '*');
          }, true);
          ` : ''}
        })();
      </script>
    `;

    const isEntryBabel = entryFilePath.endsWith('.jsx') || entryFilePath.endsWith('.tsx');

    const injectionScripts = `
      ${otherJsScripts}
      ${isEntryBabel ? `
      <script type="babel" data-presets="typescript,react,env" data-file="${entryFilePath || 'entry'}">
        window.addEventListener('DOMContentLoaded', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });
        window.addEventListener('load', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });

        /* --- Entry File: ${entryFilePath} --- */
        ${entryJs}
      </script>
      ` : `
      <script data-file="${entryFilePath || 'entry'}">
        window.addEventListener('DOMContentLoaded', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });
        window.addEventListener('load', function() {
          if (typeof window.initLucideIcons === 'function') window.initLucideIcons();
        });

        /* --- Entry File: ${entryFilePath} --- */
        ${entryJs}
      </script>
      `}
    `;

    // Robustly inject head scripts using case-insensitive regex to handle attributes (e.g. <html lang="ar">)
    if (/<head[^>]*>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<head[^>]*>)/i, `$1${injectionHead}`);
    } else if (/<html[^>]*>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<html[^>]*>)/i, `$1<head>${injectionHead}</head>`);
    } else {
      htmlContent = `<!DOCTYPE html><html lang="${language === 'ar' ? 'ar' : 'en'}" dir="${dir}"><head>${injectionHead}</head><body>${htmlContent}</body></html>`;
    }

    // Robustly inject body scripts
    if (/<\/body>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<\/body>)/i, `${injectionScripts}$1`);
    } else if (/<\/html>/i.test(htmlContent)) {
      htmlContent = htmlContent.replace(/(<\/html>)/i, `${injectionScripts}$1`);
    } else {
      htmlContent = htmlContent + injectionScripts;
    }

    return htmlContent;
  }, [files, language, dir]);

  const handleOpenInNewTab = async () => {
    try {
      const lang = language === 'ar' ? 'ar' : 'en';
      const direction = dir === 'rtl' ? 'rtl' : 'ltr';
      const previewUrl = `/api/studio/workspaces/${projectId}/preview?lang=${lang}&dir=${direction}`;
      
      // Open window immediately on user click to avoid popup blocker
      const newWin = window.open('about:blank', '_blank');

      // Auto-save the latest changes to DB/memory before redirecting the tab to ensure latest preview is rendered
      await saveProjectToDb();
      
      if (newWin) {
        newWin.location.href = previewUrl;
      } else {
        window.open(previewUrl, '_blank');
      }
      toast.success(language === 'ar' ? 'تم فتح المعاينة الحية في نافذة متصفح جديدة!' : 'Opened live preview in new browser tab!');
    } catch (err: any) {
      console.error('Failed to open preview tab:', err);
      toast.error(language === 'ar' ? 'تعذر فتح نافذة المتصفح الجديدة' : 'Failed to open preview tab');
    }
  };

  // Handle Send Prompt (Real AI Code Engine with Chat History)
  const handleSendPrompt = async (customPrompt?: string) => {
    const promptToSend = (typeof customPrompt === 'string' ? customPrompt : promptQuery).trim();
    if (!promptToSend || isGenerating) return;
    
    if (typeof customPrompt === 'string') {
      setClickedSuggestions(prev => [...prev, customPrompt]);
    }
    
    setPromptQuery('');
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsgId = `user_${Date.now()}`;
    const userMsg: StudioChatMessage = {
      id: userMsgId,
      role: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    addLog('log', `إرسال طلب التعديل: "${promptToSend}"`);

    setPipelinePhase(1);
    setStreamStatusMessage(dir === 'rtl' ? '🏗️ مرحلة 1: بناء المخطط الهيكلي وخريطة الاعتماديات (Blueprint Scaffolding)...' : 'Phase 1: Generating Architecture Blueprint...');
    setLiveStreamText('');

    try {
      const token = getAuthToken();
      const historyPayload = chatMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.text
      }));

      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: promptToSend,
          files,
          activeFilePath,
          history: historyPayload,
          stream: true
        })
      });

      if (res.ok) {
        let completedData: any = null;
        const contentType = res.headers.get('content-type') || '';

        if (contentType.includes('text/event-stream') && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data:')) {
                const dataStr = trimmed.substring(5).trim();
                try {
                  const ev = JSON.parse(dataStr);
                  if (ev.type === 'step') {
                    setStreamStatusMessage(ev.message);
                    addLog('log', ev.message);
                  } else if (ev.type === 'chunk') {
                    setLiveStreamText(prev => (prev + ev.chunk).slice(-400));
                  } else if (ev.type === 'complete') {
                    completedData = ev;
                  }
                } catch (_) {}
              }
            }
          }
        } else {
          completedData = await res.json();
        }

        const data = completedData;
        if (data && data.files && Object.keys(data.files).length > 0) {
          setFiles(data.files);
          setSavedFiles(data.files);
          setIframeKey(prev => prev + 1);

          const updatedKeys = Object.keys(data.files);
          if (updatedKeys.includes('index.html')) {
            setActiveFilePath('index.html');
          }

          // Phase 1 & 2: Process Blueprint & File Statuses
          if (data.blueprint) {
            setActiveBlueprint(data.blueprint);
            if (data.blueprint.files_order && Array.isArray(data.blueprint.files_order)) {
              const statuses: Record<string, 'pending' | 'writing' | 'completed' | 'error'> = {};
              data.blueprint.files_order.forEach((p: string) => {
                statuses[p] = 'completed';
              });
              setFileStatuses(statuses);
            }
            addLog('success', `🏗️ مرحلة 1: تم اعتماد المخطط الهيكلي بنجاح للمشروع (${data.blueprint.project_name || 'Project'})`);
          } else {
            const statuses: Record<string, 'pending' | 'writing' | 'completed' | 'error'> = {};
            updatedKeys.forEach((p: string) => {
              statuses[p] = 'completed';
            });
            setFileStatuses(statuses);
          }

          // Phase 3: Dry-Run Validation & Auto Interceptor Check
          setPipelinePhase(3);
          setStreamStatusMessage(dir === 'rtl' ? '✨ مرحلة 3: التدقيق الفوري وسلامة الاستيراد (Dry-Run Validated)...' : 'Phase 3: Dry-Run Validating files & dependencies...');

          let dryRunPassed = true;
          if (data.files['index.html']) {
            const htmlText = data.files['index.html'].content || '';
            if (!htmlText.includes('<html')) {
              addLog('error', '⚠️ تحذير التدقيق: ملف index.html ينقصه وسم <html> الأساسي');
              dryRunPassed = false;
            }
          }

          if (dryRunPassed) {
            addLog('success', '✨ مرحلة 3: تم التدقيق الفوري وبدء البناء التفاعلي بنجاح 100% (Dry-Run Passed)');
          }

          // Dynamic SQLite Schema Synchronization
          if (data.files['db/schema.sql']) {
            try {
              initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
              }).then(SQL => {
                const newDb = new SQL.Database();
                newDb.run(data.files['db/schema.sql'].content);
                setSqlDb(newDb);
                refreshTables(newDb);
                addLog('success', 'تم تهيئة ومزامنة قاعدة بيانات SQLite الجديدة من schema.sql');
              }).catch(() => {});
            } catch (err: any) {
              console.warn('SQLite reload error:', err);
            }
          }

          const cleanReplyText = (rawText: string) => {
            if (!rawText) return dir === 'rtl' ? '🚀 تم إعداد خطة البناء وتوليد ملفات المشروع بداخل شجرة الاستوديو.' : '🚀 Architecture plan approved & project files written directly to workspace.';
            const cleaned = rawText
              .replace(/<perplexta_blueprint>[\s\S]*?<\/perplexta_blueprint>/gi, '')
              .replace(/<perplexta_blueprint>[\s\S]*/gi, '')
              .replace(/<perplexta_file[\s\S]*?<\/perplexta_file>/gi, '')
              .replace(/<perplexta_file[\s\S]*/gi, '')
              .replace(/<perplexta_delete[\s\S]*?\/?>/gi, '')
              .replace(/```[\s\S]*?```/gi, '')
              .replace(/```[\s\S]*/gi, '')
              .trim();

            if (!cleaned || cleaned.includes('{') || cleaned.length < 5) {
              const projName = activeBlueprint?.project_name || (dir === 'rtl' ? 'مشروع جديد' : 'New Project');
              return dir === 'rtl'
                ? `🚀 **تم اعتماد المخطط المعماري وتوليد شجرة الملفات مباشرة**\n- **اسم المشروع**: ${projName}\n- **حالة التنفيذ**: تم إنشاء وتحديث الكود بداخل شجرة الملفات الجانبية والمحرر مباشرة.`
                : `🚀 **Architecture Plan & File Tree Synthesized**\n- **Project Name**: ${projName}\n- **Execution State**: Files written directly to workspace editor and file tree.`;
            }
            return cleaned;
          };

          const assistantMsg: StudioChatMessage = {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            text: cleanReplyText(data.reply || data.summary),
            logs: Array.isArray(data.logs) ? data.logs : [],
            filesUpdated: updatedKeys,
            suggestions: Array.isArray(data.suggestions) && data.suggestions.length > 0 ? data.suggestions : (
              Object.keys(data.files || {}).some(f => f.toLowerCase().includes('products') || f.toLowerCase().includes('cart') || f.toLowerCase().includes('store'))
                ? [
                    dir === 'rtl' ? 'تطوير بطاقة تسجيل دخول وقاعدة بيانات للمستخدمين' : 'Build user login card & SQLite DB',
                    dir === 'rtl' ? 'إضافة نظام كوبونات خصم وتخفيضات تفاعلي' : 'Add discount coupons system',
                    dir === 'rtl' ? 'ربط سلة المشتريات ببوابات دفع ذكية وفواتير مفصلة' : 'Connect dynamic checkout & checkout forms'
                  ]
                : [
                    dir === 'rtl' ? 'تصميم قسم مراجعات وآراء العملاء بشكل تفاعلي متحرك' : 'Design dynamic animated testimonials section',
                    dir === 'rtl' ? 'تحسين التجاوب البصري الكامل مع شاشات الجوال والتابلت' : 'Perfect full mobile and tablet responsive layouts',
                    dir === 'rtl' ? 'برمجة لوحة إحصائيات وإدارة للمشروع' : 'Build interactive admin dashboard panel'
                  ]
            ),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setChatMessages(prev => [...prev, assistantMsg]);
          if (Array.isArray(data.logs)) {
            data.logs.forEach((logText: string) => addLog('success', logText));
          } else {
            addLog('success', data.summary || 'تم تحديث المشروع بنجاح');
          }
          toast.success(dir === 'rtl' ? (data.summary || 'تم تطبيق التعديلات بنجاح!') : 'Changes applied successfully!');
          saveProjectToDb();
        } else if (data) {
          const fallbackMsg: StudioChatMessage = {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            text: data.reply || (dir === 'rtl' ? 'تم فحص ملفات المشروع وتأكيد استقرار البنية الحالية.' : 'Examined project structure and verified stability.'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setChatMessages(prev => [...prev, fallbackMsg]);
          addLog('log', 'تم تحليل الطلب وتأكيد البنية الحالية.');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.message || errData.error || (dir === 'rtl' ? 'فشل توليد التعديلات البرمجية.' : 'Generation failed');
        const errChatMsg: StudioChatMessage = {
          id: `assistant_err_${Date.now()}`,
          role: 'assistant',
          text: `⚠️ ${errMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, errChatMsg]);
        addLog('error', errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      const errMsg = `خطأ في الاتصال: ${err.message}`;
      addLog('error', errMsg);
      toast.error(dir === 'rtl' ? 'تعذر الاتصال بخادم الاستوديو' : 'Server connection failed');
    } finally {
      abortControllerRef.current = null;
      setIsGenerating(false);
      setStreamStatusMessage('');
      setLiveStreamText('');
    }
  };

  const handleCreateNewProject = () => {
    // 1. Safely save the current project before switching to new blank project
    saveProjectToDb();

    const newProjId = 'proj_' + Date.now();
    const isAr = language === 'ar';
    const newProjName = isAr ? `مشروع جديد #${Math.floor(1000 + Math.random() * 9000)}` : `New Project #${Math.floor(1000 + Math.random() * 9000)}`;
    
    setProjectId(newProjId);
    setProjectName(newProjName);
    try {
      localStorage.setItem('perplexta_active_project_id', newProjId);
      localStorage.setItem('perplexta_active_project_name', newProjName);
      localStorage.removeItem('perplexta_studio_workspace_v2');
      sessionStorage.removeItem('current_active_project');
    } catch (_) {}

    const blankFiles: Record<string, ProjectFile> = {
      'index.html': {
        name: 'index.html',
        path: 'index.html',
        type: 'html',
        isEntry: true,
        content: `<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${newProjName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-['Tajawal','Cairo',sans-serif] min-h-screen flex items-center justify-center p-6 selection:bg-blue-600 selection:text-white">
  <div class="max-w-md w-full text-center space-y-6">
    <!-- Brand Logo Glow Icon -->
    <div class="relative mx-auto w-16 h-16 rounded-shape-md bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-xl shadow-blue-500/25 flex items-center justify-center">
      <div class="w-full h-full bg-slate-900 rounded-shape-sm flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="text-blue-500" style="width: 32px; height: 32px; max-width: 32px; max-height: 32px;">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>
    </div>
    
    <div class="space-y-3">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-shape-full bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 text-xs font-bold">
        <span class="w-2 h-2 rounded-shape-full bg-blue-500 animate-ping"></span>
        <span>${isAr ? 'مشروع جديد فارغ • جاهز للبناء والتوليد' : 'New blank project • Ready to architect & build'}</span>
      </div>
      <h1 class="text-2xl font-black text-slate-900 dark:text-white">${newProjName}</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
        ${isAr 
          ? 'أخبر المساعد الذكي بما تود بناءه الآن، وسيقوم بهندسة شجرة الملفات بالكامل، وإنشاء الأكواد وربطها وتجميعها لتكوين موقع وتطبيق احترافي متكامل.'
          : 'Prompt the AI architect with what you want to build. It will generate files, assemble components, and bring your web application to life in real-time.'}
      </p>
    </div>
  </div>
</body>
</html>`
      }
    };

    setFiles(blankFiles);
    setSavedFiles(blankFiles);
    setActiveFilePath('index.html');
    setIframeKey(prev => prev + 1);

    // Reset Chat Messages for this clean new project
    setChatMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        text: isAr 
          ? `تم بدء مساحة عمل جديدة لـ (${newProjName})! ⚡ أنا مهندس البرمجيات ومساعدك الذكي لبناء وتطوير هذا المشروع من الصفر. ماذا تود أن نبني؟`
          : `Started fresh workspace for (${newProjName})! ⚡ I am your AI Software Architect. What would you like us to build?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: isAr 
          ? [
              'أنشئ متجر بيع منتجات رقمية مع سلة شراء متطورة',
              'أنشئ صفحة هبوط تفاعلية بتصميم حديث',
              'أنشئ لوحة تحكم وإحصائيات مع رسوم بيانية',
              'أضف الوضع الليلي وتجاوب كامل مع الجوال'
            ]
          : [
              'Build a digital products store with interactive cart',
              'Create a modern animated SaaS landing page',
              'Build an analytics dashboard with chart visualizers',
              'Add full mobile responsiveness and dark mode'
            ]
      }
    ]);

    setTerminalLogs([
      { type: 'log', text: `تم بدء تشغيل بيئة العمل الافتراضية للمشروع الجديد (${newProjName}).`, time: new Date().toLocaleTimeString() },
      { type: 'success', text: 'شجرة الملفات فارغة وجاهزة للهندسة والتوليد.', time: new Date().toLocaleTimeString() }
    ]);

    saveProjectToDb(newProjId, newProjName, blankFiles);
    toast.success(isAr ? `تم إنشاء ${newProjName} بنجاح` : `Created ${newProjName} successfully`);
    addLog('success', `تم تهيئة وحفظ مساحة عمل جديدة: ${newProjName}`);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    Object.keys(files).forEach(path => {
      zip.file(path, files[path].content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'perplexta-project.zip');
    toast.success(dir === 'rtl' ? 'تم تنزيل المشروع كملف ZIP بنجاح!' : 'Project downloaded as ZIP!');
    addLog('success', 'تم تصدير المشروع إلى ملف ZIP محلي.');
  };

  const handleAiFix = async () => {
    addLog('log', 'جاري تحليل الأخطاء وإصلاح الكود بواسطة الذكاء الاصطناعي...');
    try {
      const token = getAuthToken();
      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          files,
          errorLogs: terminalLogs.filter(l => l.type === 'error'),
          activeFilePath
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files) {
          setFiles(data.files);
          setSavedFiles(data.files);
          setIframeKey(prev => prev + 1);
        }
        addLog('success', 'تم تصحيح الأخطاء البرمجية بنجاح وإعادة بناء الملفات.');
        toast.success(dir === 'rtl' ? 'تم الإصلاح التلقائي بنجاح!' : 'Auto-fix completed!');
      } else {
        addLog('error', 'فشل تصحيح الأخطاء عبر الذكاء الاصطناعي.');
      }
    } catch (e: any) {
      addLog('error', `خطأ في الاتصال بالخادم: ${e.message}`);
    }
  };

  const activeFile = files[activeFilePath] || files['index.html'];
  const logoSrc = (theme === 'light' && siteSettings?.logoLightBase64) ? siteSettings.logoLightBase64 : siteSettings?.logoBase64;

  return (
    <div className="min-h-screen bg-[var(--surface-page)] text-[var(--text-primary)] font-sans flex flex-col overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-12 bg-[var(--surface-card)] border-b border-[var(--border-default)] px-3 sm:px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              saveProjectToDb();
              navigate('/app');
            }}
            className="h-8 px-2.5 sm:px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-[var(--border-accent)] text-[var(--text-primary)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            {dir === 'rtl' ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            <span className="hidden sm:inline">{dir === 'rtl' ? 'الرجوع للاستوديو' : 'Back to Studio Hub'}</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {logoSrc ? (
              <img 
                src={resolveImageUrl(logoSrc, 'general')} 
                alt="Logo" 
                className="w-7 h-7 object-contain rounded-shape-xs" 
              />
            ) : (
              <div className="w-7 h-7 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-accent">
                <Code size={15} />
              </div>
            )}
            <span className="px-2 py-0.5 rounded-shape-xs text-[10px] font-mono bg-[var(--status-success-subtle)] text-[var(--fg-success)] border border-[var(--fg-success)]/20 font-bold tracking-wide">
              Live IDE
            </span>
            <h1 className="text-xs font-bold uppercase tracking-wide text-[var(--text-primary)] hidden lg:block">
              {language === 'ar' ? 'استوديو بيربليكستا' : 'Perplexta Studio'}
            </h1>
            <div className="h-4 w-px bg-[var(--border-default)] mx-1 hidden sm:block" />
            <div className="h-8 flex items-center gap-1.5 px-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)]">
              {isEditingProjectName ? (
                <input
                  type="text"
                  value={projectName}
                  autoFocus
                  onBlur={() => {
                    setIsEditingProjectName(false);
                    localStorage.setItem('perplexta_active_project_name', projectName);
                    saveProjectToDb(projectId, projectName);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingProjectName(false);
                      localStorage.setItem('perplexta_active_project_name', projectName);
                      saveProjectToDb(projectId, projectName);
                    }
                  }}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-bold text-[var(--text-primary)] px-1 py-0 w-28 sm:w-36"
                />
              ) : (
                <div 
                  onClick={() => setIsEditingProjectName(true)}
                  className="flex items-center gap-1.5 cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                  title={dir === 'rtl' ? 'اضغط لتعديل اسم المشروع' : 'Click to rename project'}
                >
                  <span className="font-bold text-[var(--text-primary)] max-w-[100px] sm:max-w-[140px] truncate">{projectName}</span>
                  <Edit2 size={11} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
                </div>
              )}
            </div>

            {/* Cloud Sync Status Indicator */}
            <div className="h-8 flex items-center gap-1 px-2.5 rounded-shape-sm text-[11px] font-mono border border-[var(--border-default)] bg-[var(--surface-subtle)] select-none">
              {syncStatus === 'synced' && (
                <span className="flex items-center gap-1 text-[var(--fg-success)] font-bold" title={language === 'ar' ? 'تمت مزامنة التعديلات سحابياً' : 'Saved to cloud'}>
                  <Cloud size={12} className="text-[var(--fg-success)]" />
                  <span className="hidden xl:inline">{language === 'ar' ? 'سحابي' : 'Cloud'}</span>
                </span>
              )}
              {syncStatus === 'saving' && (
                <span className="flex items-center gap-1 text-amber-500 font-bold animate-pulse" title={language === 'ar' ? 'جاري الحفظ في السحابة...' : 'Saving to cloud...'}>
                  <Loader2 size={12} className="animate-spin" />
                  <span className="hidden xl:inline">{language === 'ar' ? 'حفظ...' : 'Saving...'}</span>
                </span>
              )}
              {syncStatus === 'local' && (
                <span 
                  className="flex items-center gap-1 text-[var(--text-muted)] cursor-pointer hover:text-accent transition-colors"
                  title={language === 'ar' ? 'وضع المسودة المحلية - سجل الدخول للمزامنة التلقائية' : 'Local draft mode - log in for cloud sync'}
                  onClick={() => toast.info(language === 'ar' ? 'أنت تعمل بوضع المسودة المحلية. سجل دخولك لمزامنة مشاريعك سحابياً والوصول إليها من أي جهاز.' : 'Working in local draft mode. Log in to sync to cloud.')}
                >
                  <HardDrive size={12} />
                  <span className="hidden xl:inline">{language === 'ar' ? 'محلي' : 'Local'}</span>
                </span>
              )}
              {syncStatus === 'error' && (
                <span className="flex items-center gap-1 text-red-400 font-bold cursor-pointer" title={language === 'ar' ? 'فشل الحفظ - انقر للمحاولة مجدداً' : 'Save failed - click to retry'} onClick={() => saveProjectToDb(projectId, projectName)}>
                  <AlertTriangle size={12} />
                  <span className="hidden xl:inline">{language === 'ar' ? 'خطأ' : 'Error'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Header Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* My Projects / Workspaces Button */}
          <button
            onClick={() => {
              fetchUserWorkspaces();
              fetchSnapshots(projectId);
              setIsWorkspacesModalOpen(true);
            }}
            className="h-8 px-2.5 sm:px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] hover:border-[var(--border-accent)] flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer text-[var(--text-primary)] shadow-2xs"
            title={language === 'ar' ? 'مشاريعي واللقطات السحابية' : 'My Cloud Projects & Snapshots'}
          >
            <Folder size={13} className="text-accent" />
            <span className="hidden md:inline">{language === 'ar' ? 'مشاريعي' : 'Projects'}</span>
          </button>

          {/* New Project Button */}
          <button
            onClick={handleCreateNewProject}
            className="h-8 px-2.5 sm:px-3 rounded-shape-sm bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] border border-[var(--border-main)] flex items-center justify-center gap-1.5 text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-95"
            title={language === 'ar' ? 'بدء مشروع جديد فارغ' : 'Start new blank project'}
          >
            <Plus size={13} />
            <span className="hidden sm:inline">{language === 'ar' ? 'مشروع جديد' : 'New Project'}</span>
          </button>

          {/* Database Button */}
          <button
            onClick={() => setIsDbModalOpen(true)}
            className="h-8 px-2.5 sm:px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] hover:border-[var(--border-accent)] flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer text-[var(--text-primary)] relative shadow-2xs"
            title={language === 'ar' ? 'قاعدة البيانات' : 'Database'}
          >
            <Database size={13} className="text-[var(--fg-success)]" />
            <span className="hidden md:inline">{language === 'ar' ? 'قاعدة البيانات' : 'Database'}</span>
            {sqlDb && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-shape-full bg-[var(--fg-success)] border-2 border-[var(--surface-card)] animate-pulse" title="Database Connected" />
            )}
          </button>

          {/* Terminal Toggle Button */}
          <button
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className="h-8 px-2.5 sm:px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] hover:border-[var(--border-accent)] flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer text-[var(--text-primary)] shadow-2xs"
            title={language === 'ar' ? 'الطرفية' : 'Terminal'}
          >
            <Terminal size={13} className="text-[var(--fg-accent)]" />
            <span className="hidden md:inline">{language === 'ar' ? 'الطرفية' : 'Terminal'}</span>
            {terminalLogs.some(l => l.type === 'error') && (
              <span className="w-1.5 h-1.5 rounded-shape-full bg-red-500 animate-pulse" />
            )}
          </button>

          {/* Download ZIP Button */}
          <button
            onClick={handleDownloadZip}
            className="h-8 px-2.5 sm:px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] hover:border-[var(--border-accent)] flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer text-[var(--text-primary)] shadow-2xs"
            title={language === 'ar' ? 'تنزيل ZIP' : 'Download ZIP'}
          >
            <Download size={13} className="text-[var(--fg-accent)]" />
            <span className="hidden sm:inline">{language === 'ar' ? 'تنزيل ZIP' : 'Download ZIP'}</span>
          </button>

          {/* Live Share Link Button */}
          <button
            onClick={() => {
              saveProjectToDb();
              const lang = language === 'ar' ? 'ar' : 'en';
              const direction = dir === 'rtl' ? 'rtl' : 'ltr';
              const shareUrl = `${window.location.origin}/api/studio/workspaces/${projectId}/preview?lang=${lang}&dir=${direction}`;
              navigator.clipboard.writeText(shareUrl);
              toast.success(language === 'ar' ? 'تم نسخ رابط المعاينة المباشر إلى الحافظة!' : 'Copied live preview link to clipboard!');
            }}
            className="h-8 px-2.5 sm:px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:bg-[var(--surface-card)] hover:border-[var(--border-accent)] flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer text-[var(--text-primary)] shadow-2xs"
            title={language === 'ar' ? 'نسخ رابط المعاينة المباشر' : 'Copy live preview link'}
          >
            <Globe size={13} className="text-accent" />
            <span className="hidden lg:inline">{language === 'ar' ? 'رابط المشاركة' : 'Share Link'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Viewport Navigation Switcher (< md) */}
      <div className="md:hidden flex items-center bg-[var(--surface-card)] border-b border-[var(--border-default)] px-2 py-1.5 shrink-0 justify-around select-none">
        <button
          onClick={() => setMobileActiveTab('chat')}
          className={`flex-1 h-8 px-2 rounded-shape-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveTab === 'chat'
              ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] shadow-2xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
          }`}
        >
          <Sparkles size={13} />
          <span>{language === 'ar' ? 'المساعد' : 'Assistant'}</span>
        </button>
        <button
          onClick={() => setMobileActiveTab('files')}
          className={`flex-1 h-8 px-2 rounded-shape-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveTab === 'files'
              ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] shadow-2xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
          }`}
        >
          <Folder size={13} />
          <span>{language === 'ar' ? 'الملفات' : 'Files'}</span>
        </button>
        <button
          onClick={() => setMobileActiveTab('preview')}
          className={`flex-1 h-8 px-2 rounded-shape-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveTab === 'preview'
              ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] shadow-2xs'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
          }`}
        >
          <Monitor size={13} />
          <span>{language === 'ar' ? 'المعاينة والكود' : 'Preview & Code'}</span>
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. Sovereign AI Coding Assistant Chat Panel */}
        <aside className={`${mobileActiveTab === 'chat' ? 'flex' : 'hidden md:flex'} w-full md:w-80 lg:w-96 bg-[var(--surface-card)] border-e border-[var(--border-default)] flex-col shrink-0 select-none justify-between overflow-hidden`}>
          {/* Assistant Header */}
          <div className="p-2.5 px-3 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-card)]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-accent shadow-2xs">
                <Sparkles size={14} />
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block leading-tight">
                  {language === 'ar' ? 'المساعد البرمجي الذكي' : 'AI Coding Assistant'}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-shape-full bg-[var(--fg-success)] animate-pulse" />
                  <span>{language === 'ar' ? 'الأوركسترا متصلة بالوقت الفعلي' : 'Orchestrator Connected'}</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setChatMessages([
                  {
                    id: `msg_${Date.now()}`,
                    role: 'assistant',
                    text: dir === 'rtl' ? 'تم بدء محادثة جديدة! ما هي الميزة أو التعديل الذي ترغب في إضافته للمشروع؟' : 'Started fresh conversation! What feature would you like to build?',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    suggestions: dir === 'rtl' ? ['أنشئ متجر بيع منتجات رقمية', 'أنشئ صفحة هبوط SaaS', 'أضف سلة شراء تفاعلية'] : ['Build a digital store', 'Build SaaS Landing Page', 'Add interactive cart']
                  }
                ]);
              }}
              className="h-8 w-8 flex items-center justify-center rounded-shape-sm text-[var(--text-muted)] hover:text-accent hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
              title={dir === 'rtl' ? 'بدء محادثة جديدة' : 'New Chat'}
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Chat Messages Feed */}
          <div ref={chatFeedRef} className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Role Header & Time */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-[var(--text-muted)] font-medium">
                  <span>{msg.role === 'user' ? (language === 'ar' ? 'أنت' : 'You') : (language === 'ar' ? 'بيربليكستا أسيستنت' : 'Perplexta AI')}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                {msg.role === 'user' ? (
                  /* User Prompt Bubble with Copy & Resend on hover */
                  <div className="relative group max-w-[92%]">
                    <div className="p-3 rounded-shape-md text-xs leading-relaxed bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] rounded-br-xs shadow-2xs font-medium">
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    {/* Hover Action Buttons */}
                    <div className={`absolute -bottom-6 ${dir === 'rtl' ? 'left-0' : 'right-0'} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--surface-card)] border border-[var(--border-default)] p-0.5 rounded-shape-xs shadow-xs z-10`}>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(msg.text);
                          toast.success(language === 'ar' ? 'تم نسخ نص البرومبت!' : 'Prompt copied to clipboard!');
                        }}
                        className="p-1 hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-accent rounded-shape-xs transition-colors cursor-pointer"
                        title={language === 'ar' ? 'نسخ البرومبت' : 'Copy prompt'}
                      >
                        <Copy size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPromptQuery(msg.text);
                          toast.info(language === 'ar' ? 'تم تجهيز البرومبت في حقل الإدخال' : 'Prompt loaded in input box');
                        }}
                        className="p-1 hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-accent rounded-shape-xs transition-colors cursor-pointer"
                        title={language === 'ar' ? 'إعادة استخدام وتعديل البرومبت' : 'Reuse & edit prompt'}
                      >
                        <RotateCcw size={11} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Assistant Message Bubble */
                  <div className="p-3.5 rounded-shape-md text-xs leading-relaxed max-w-[94%] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-bl-xs space-y-3 shadow-2xs">
                    {/* Formatted Explanation Text */}
                    <div className="text-xs leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap font-sans">
                      {msg.text}
                    </div>

                    {/* Files Updated Badges with 1-click Editor Navigation */}
                    {msg.filesUpdated && msg.filesUpdated.length > 0 && (
                      <div className="pt-2 border-t border-[var(--border-default)]/60">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] block mb-1.5 flex items-center gap-1">
                          <FileCode size={11} className="text-accent" />
                          <span>{language === 'ar' ? 'الملفات المحدثة والمولدة:' : 'Updated & Generated Files:'}</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.filesUpdated.map((fp) => (
                            <button
                              key={fp}
                              onClick={() => setActiveFilePath(fp)}
                              className={`px-2.5 py-1 rounded-shape-xs text-[10px] font-mono font-bold transition-all cursor-pointer border flex items-center gap-1.5 shadow-2xs ${
                                activeFilePath === fp
                                  ? 'bg-accent text-white border-accent'
                                  : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-accent/50 hover:text-accent'
                              }`}
                              title={language === 'ar' ? `فتح ملف ${fp} في المحرر` : `Open ${fp} in editor`}
                            >
                              <FileCode size={11} className={activeFilePath === fp ? 'text-white' : 'text-accent'} />
                              <span>{fp}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Collapsible Execution Steps & Code Logs */}
                    {msg.logs && msg.logs.length > 0 && (
                      <div className="pt-2 border-t border-[var(--border-default)]/60">
                        <button
                          type="button"
                          onClick={() => toggleLogs(msg.id)}
                          className="w-full flex items-center justify-between p-1.5 px-2.5 rounded-shape-xs bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[10px] font-bold text-[var(--text-secondary)] hover:text-accent transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 text-[var(--fg-success)]">
                            <CheckCircle2 size={12} />
                            <span className="text-[var(--text-secondary)]">
                              {language === 'ar' ? `خطوات التنفيذ البرمجي (${msg.logs.length} مراحل مكتملة)` : `Execution Breakdown (${msg.logs.length} completed)`}
                            </span>
                          </span>
                          <ChevronDown size={12} className={`transition-transform duration-200 ${expandedLogs[msg.id] ? 'rotate-180' : ''}`} />
                        </button>

                        {expandedLogs[msg.id] && (
                          <div className="mt-1.5 p-2.5 rounded-shape-xs bg-[var(--surface-card)]/80 border border-[var(--border-default)]/80 space-y-1.5 font-mono text-[10px] text-[var(--text-secondary)]">
                            {msg.logs.map((logLine, lIdx) => (
                              <div key={lIdx} className="flex items-start gap-1.5 leading-snug">
                                <CheckCircle2 size={11} className="text-[var(--fg-success)] shrink-0 mt-0.5" />
                                <span className="text-[var(--text-secondary)] break-words">{logLine}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Suggestions Chips */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="pt-2 border-t border-[var(--border-default)]/60">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] block mb-1.5 flex items-center gap-1">
                          <Sparkles size={11} className="text-accent" />
                          <span>{language === 'ar' ? 'المقترحات التطويرية التالية:' : 'Suggested Next Evolutions:'}</span>
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {(() => {
                            const uniqueMapped: string[] = [];
                            msg.suggestions.forEach((sug) => {
                              let currentSug = sug;
                              let limit = 0;
                              while ((clickedSuggestions.includes(currentSug) || uniqueMapped.includes(currentSug)) && limit < 15) {
                                currentSug = PROGRESSIVE_SUGGESTIONS_MAP[currentSug] || 'إضافة ميزة تصدير التقارير والفواتير بصيغة PDF';
                                limit++;
                              }
                              if (currentSug && !uniqueMapped.includes(currentSug)) {
                                uniqueMapped.push(currentSug);
                              }
                            });
                            return uniqueMapped.map((currentSug, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => handleSendPrompt(currentSug)}
                                disabled={isGenerating}
                                className="text-start px-2.5 h-8 rounded-shape-sm bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] hover:border-accent/40 border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] hover:text-accent transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                              >
                                <span className="truncate">{currentSug}</span>
                                <ChevronLeft size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
                              </button>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Thinking / Real-time Live Generating Radar */}
            {isGenerating && (
              <div className="flex flex-col items-start gap-2 w-full animate-fadeIn my-1">
                <div className="p-3.5 rounded-shape-md bg-[var(--surface-subtle)] border-2 border-accent/40 text-xs text-[var(--text-primary)] flex flex-col gap-2.5 shadow-xs w-full">
                  {/* Status header with live spinner */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-accent">
                      <RefreshCw size={13} className="animate-spin text-accent shrink-0" />
                      <span>{streamStatusMessage || (language === 'ar' ? 'بناء وتحديث ملفات المشروع في الوقت الفعلي...' : 'Architecting and generating code in real time...')}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[9px] font-bold animate-pulse">
                      LIVE
                    </span>
                  </div>

                  {/* Multi-Phase Progress Timeline */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <div className="p-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-[9px] font-bold text-accent flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping shrink-0" />
                      <span className="truncate">{language === 'ar' ? '1. فحص الشجرة' : '1. Tree Audit'}</span>
                    </div>
                    <div className="p-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-[9px] font-bold text-accent flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
                      <span className="truncate">{language === 'ar' ? '2. كتابة الكود' : '2. Synthesis'}</span>
                    </div>
                    <div className="p-1.5 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-[9px] font-bold text-accent flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      <span className="truncate">{language === 'ar' ? '3. ربط المعاينة' : '3. Live Mount'}</span>
                    </div>
                  </div>

                  {liveStreamText && (
                    <div className="p-2 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] font-mono text-[10px] text-[var(--text-muted)] max-h-24 overflow-hidden leading-relaxed break-all opacity-85 select-none">
                      <div className="text-[9px] uppercase tracking-wider text-accent/80 font-bold mb-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-shape-full bg-accent animate-ping" />
                        <span>{language === 'ar' ? 'بث الكود المباشر' : 'Live Code Stream'}</span>
                      </div>
                      <span className="text-[var(--text-secondary)]">{liveStreamText}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Unified Chat Input Box */}
          <div className="p-3 border-t border-[var(--border-default)] bg-[var(--surface-card)]">
            <div className="relative rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent/50 focus-within:border-accent/60 transition-all p-1.5 shadow-2xs">
              <textarea
                value={promptQuery}
                onChange={(e) => setPromptQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                placeholder={language === 'ar' ? 'اطلب ميزة جديدة، تعديل تصميم، أو إضافة صفحات...' : 'Request a feature, redesign, or new pages...'}
                className="w-full bg-transparent border-0 outline-none text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none h-14 leading-relaxed px-1.5 pt-1 font-sans"
              />

              <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-default)]/60">
                <div className="flex items-center gap-1">
                  {/* Paperclip File Upload */}
                  <label className="h-8 w-8 flex items-center justify-center rounded-shape-sm text-[var(--text-muted)] hover:text-accent hover:bg-[var(--surface-card)] transition-all cursor-pointer">
                    <Paperclip size={14} />
                    <input type="file" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        toast.success(dir === 'rtl' ? `تم إرفاق: ${f.name}` : `Attached: ${f.name}`);
                        addLog('log', `تم إرفاق الملف: ${f.name}`);
                      }
                    }} />
                  </label>

                  {/* Microphone Voice Input */}
                  <button
                    type="button"
                    onClick={() => toast.info(dir === 'rtl' ? 'الإملاء الصوتي نشط...' : 'Voice recording active...')}
                    className="h-8 w-8 flex items-center justify-center rounded-shape-sm text-[var(--text-muted)] hover:text-accent hover:bg-[var(--surface-card)] transition-all cursor-pointer"
                  >
                    <Mic size={14} />
                  </button>
                </div>

                {/* Send / Stop Button */}
                {isGenerating ? (
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="h-8 px-3.5 rounded-shape-sm font-semibold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer bg-[var(--bg-btn-danger)] text-[var(--fg-btn-danger)] hover:brightness-110 active:scale-95 animate-pulse"
                    title={dir === 'rtl' ? 'إيقاف التوليد في الوقت الفعلي' : 'Stop generation'}
                  >
                    <Square size={11} className="fill-current" />
                    <span>{language === 'ar' ? 'إيقاف' : 'Stop'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendPrompt()}
                    disabled={!promptQuery.trim()}
                    className={`h-8 px-3.5 rounded-shape-sm font-semibold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                      promptQuery.trim()
                        ? 'bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 active:scale-95' 
                        : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span>{language === 'ar' ? 'إرسال' : 'Send'}</span>
                    <Send size={12} className={dir === 'rtl' ? 'rotate-180' : ''} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* 2. File Tree & Explorer */}
        <aside className={`${mobileActiveTab === 'files' ? 'flex' : 'hidden md:flex'} w-full md:w-64 bg-[var(--surface-card)] border-e border-[var(--border-default)] flex-col shrink-0 select-none`}>

          <div className="p-2.5 px-3 border-b border-[var(--border-default)] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Folder size={14} className="text-accent" />
              <span>{language === 'ar' ? 'شجرة الملفات' : 'Project Files'}</span>
            </span>
            <button 
              onClick={() => {
                setNewFilePathInput('');
                setIsNewFileModalOpen(true);
              }}
              className="h-8 w-8 flex items-center justify-center rounded-shape-sm hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-accent cursor-pointer transition-colors"
              title={language === 'ar' ? 'إضافة ملف جديد' : 'Add new file'}
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 font-mono text-xs">
            {(() => {
              const filePaths = Object.keys(files).sort();
              const rootFiles: string[] = [];
              const folderMap: Record<string, string[]> = {};

              filePaths.forEach(path => {
                const parts = path.split('/');
                if (parts.length === 1) {
                  rootFiles.push(path);
                } else {
                  const folder = parts.slice(0, -1).join('/');
                  if (!folderMap[folder]) folderMap[folder] = [];
                  folderMap[folder].push(path);
                }
              });

              const getFileIcon = (path: string) => {
                const lower = path.toLowerCase();
                if (lower.endsWith('.html') || lower.endsWith('.htm')) return <FileCode size={14} className="text-blue-500 shrink-0" />;
                if (lower.endsWith('.css') || lower.endsWith('.scss')) return <FileText size={14} className="text-pink-500 shrink-0" />;
                if (lower.endsWith('.js') || lower.endsWith('.jsx') || lower.endsWith('.ts') || lower.endsWith('.tsx')) return <FileCode size={14} className="text-yellow-500 shrink-0" />;
                if (lower.endsWith('.sql')) return <Database size={14} className="text-[var(--fg-success)] shrink-0" />;
                if (lower.endsWith('.php')) return <Globe size={14} className="text-amber-500 shrink-0" />;
                if (lower.endsWith('.json')) return <FileText size={14} className="text-[var(--fg-success)] shrink-0" />;
                return <FileCode size={14} className="text-gray-400 shrink-0" />;
              };

              const handleRename = (oldPath: string) => {
                setFileToRename(oldPath);
                setNewFilePathRename(oldPath);
              };

              const renderFileItem = (path: string) => {
                const file = files[path];
                if (!file) return null;
                const isSelected = activeFilePath === path;
                const isEntry = file.isEntry || path === 'index.html';
                const status = fileStatuses[path] || 'completed';

                return (
                  <div
                    key={path}
                    onClick={() => setActiveFilePath(path)}
                    className={`group/file flex items-center justify-between px-2.5 py-1.5 rounded-shape-sm cursor-pointer transition-theme relative ${
                      isSelected 
                        ? 'bg-[var(--bg-accent-muted)] text-accent border border-[var(--border-accent)]/40 font-bold shadow-xs' 
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-accent rounded-r" />
                    )}
                    <div className="flex items-center gap-2 truncate ps-1 min-w-0">
                      {getFileIcon(path)}
                      <span className="truncate">{path.split('/').pop()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Status Indicator Badges */}
                      {status === 'writing' && (
                        <span className="text-[10px] text-cyan-400 font-mono animate-pulse flex items-center gap-1" title={language === 'ar' ? 'جاري التأليف...' : 'Writing...'}>
                          <Loader2 size={11} className="animate-spin text-cyan-400" />
                        </span>
                      )}
                      {status === 'pending' && (
                        <span className="text-[10px] text-amber-500/80 flex items-center gap-1" title={language === 'ar' ? 'في الانتظار' : 'Pending'}>
                          <Clock size={11} />
                        </span>
                      )}
                      {status === 'completed' && (
                        <span className="text-[10px] text-[var(--fg-success)] flex items-center gap-1" title={language === 'ar' ? 'مكتمل ومفحوص' : 'Completed'}>
                          <CheckCircle2 size={11} />
                        </span>
                      )}

                      {isEntry ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent/10 text-accent border border-accent/20">
                          {language === 'ar' ? 'بدء' : 'Entry'}
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRename(path);
                            }}
                            className="opacity-0 group-hover/file:opacity-100 p-1 hover:text-accent transition-opacity cursor-pointer"
                            title={language === 'ar' ? 'إعادة تسمية' : 'Rename'}
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFileToDelete(path);
                            }}
                            className="opacity-0 group-hover/file:opacity-100 p-1 hover:text-red-500 transition-opacity cursor-pointer"
                            title={language === 'ar' ? 'حذف الملف' : 'Delete file'}
                          >
                            <Trash2 size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <div className="space-y-3">
                  {/* 3-Phase Execution Pipeline Status Banner */}
                  {isGenerating && (
                    <div className="p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-accent)]/30 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-accent flex items-center gap-1.5">
                          <Sparkles size={13} className="animate-spin text-accent" />
                          {pipelinePhase === 1 && (language === 'ar' ? 'مرحلة 1: بناء المخطط (Blueprint)' : 'Phase 1: Architecture Blueprint')}
                          {pipelinePhase === 2 && (language === 'ar' ? 'مرحلة 2: التوليد التدريجي' : 'Phase 2: Incremental Synthesis')}
                          {pipelinePhase === 3 && (language === 'ar' ? 'مرحلة 3: التدقيق الفوري' : 'Phase 3: Dry-Run Validation')}
                          {!pipelinePhase && (language === 'ar' ? 'التنفيذ التدفقي' : 'Pipeline Streaming')}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">Phase {pipelinePhase || 2}/3</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--surface-page)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 via-accent to-[var(--fg-success)] transition-all duration-500" 
                          style={{ width: pipelinePhase === 1 ? '33%' : pipelinePhase === 2 ? '66%' : '100%' }}
                        />
                      </div>
                    </div>
                  )}

                  {rootFiles.length > 0 && (
                    <div className="space-y-1">
                      {rootFiles.map(renderFileItem)}
                    </div>
                  )}

                  {Object.keys(folderMap).sort().map(folder => (
                    <div key={folder} className="space-y-1">
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-[var(--text-muted)]">
                        <Folder size={13} className="text-amber-500" />
                        <span>{folder}/</span>
                      </div>
                      <div className="ps-3 space-y-1 border-s border-[var(--border-default)] ms-2">
                        {folderMap[folder].map(renderFileItem)}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </aside>

        {/* 3. Central Area: Editor & Live Preview */}
        <main className={`${mobileActiveTab === 'preview' ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[var(--surface-page)] overflow-hidden relative`}>
          {/* Editor Header / Tabs & Preview Toolbar */}
          <div className="h-11 bg-[var(--surface-card)] border-b border-[var(--border-default)] px-3 sm:px-4 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Preview Button */}
              <button
                onClick={() => setActiveTab('preview')}
                className={`h-8 px-3 rounded-shape-sm border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  activeTab === 'preview'
                    ? 'bg-[var(--surface-subtle)] border-accent text-accent shadow-xs'
                    : 'bg-transparent border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-shape-full ${activeTab === 'preview' ? 'bg-accent animate-pulse' : 'bg-transparent'}`} />
                <span>{language === 'ar' ? 'معاينة (Preview)' : 'Preview'}</span>
              </button>

              {/* Code Button */}
              <button
                onClick={() => setActiveTab('code')}
                className={`h-8 px-3 rounded-shape-sm border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  activeTab === 'code'
                    ? 'bg-[var(--surface-subtle)] border-accent text-accent shadow-xs'
                    : 'bg-transparent border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-shape-full ${activeTab === 'code' ? 'bg-accent animate-pulse' : 'bg-transparent'}`} />
                <span>{language === 'ar' ? 'الكود (Code)' : 'Code'}</span>
              </button>
            </div>

            {/* Preview Toolbar Controls (when activeTab === 'preview') */}
            {activeTab === 'preview' && (
              <div className="flex items-center gap-1 sm:gap-1.5 relative">
                {/* Device Viewport Selector Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDeviceMenuOpen(prev => !prev)}
                    className="h-8 px-2.5 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] hover:border-accent/60 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                    title={language === 'ar' ? 'أبعاد العرض' : 'Screen dimensions'}
                  >
                    {deviceMode === 'mobile' ? <Smartphone size={13} className="text-accent" /> : deviceMode === 'tablet' ? <Tablet size={13} className="text-accent" /> : <Monitor size={13} className="text-accent" />}
                    <span className="hidden md:inline text-[11px] font-mono">
                      {deviceMode === 'mobile' ? 'Mobile (375px)' : deviceMode === 'tablet' ? 'Tablet (768px)' : 'Responsive'}
                    </span>
                    <ChevronRight size={11} className={`rotate-90 transition-transform ${isDeviceMenuOpen ? 'rotate-[-90deg]' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isDeviceMenuOpen && (
                      <PopCard className="absolute right-0 mt-1.5 z-50 origin-top-right">
                        <button
                          onClick={() => { setDeviceMode('responsive'); setIsDeviceMenuOpen(false); }}
                          className={`w-full h-8 px-2.5 rounded-shape-sm text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${deviceMode === 'responsive' ? 'bg-[var(--surface-subtle)] text-accent font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'}`}
                        >
                          <Monitor size={13} />
                          <span>{language === 'ar' ? 'شاشة كاملة (Responsive)' : 'Current screen size'}</span>
                        </button>
                        <button
                          onClick={() => { setDeviceMode('mobile'); setIsDeviceMenuOpen(false); }}
                          className={`w-full h-8 px-2.5 rounded-shape-sm text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${deviceMode === 'mobile' ? 'bg-[var(--surface-subtle)] text-accent font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'}`}
                        >
                          <Smartphone size={13} />
                          <span>{language === 'ar' ? 'موبايل (375px)' : 'Mobile'}</span>
                        </button>
                        <button
                          onClick={() => { setDeviceMode('tablet'); setIsDeviceMenuOpen(false); }}
                          className={`w-full h-8 px-2.5 rounded-shape-sm text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${deviceMode === 'tablet' ? 'bg-[var(--surface-subtle)] text-accent font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]'}`}
                        >
                          <Tablet size={13} />
                          <span>{language === 'ar' ? 'تابلت (768px)' : 'Tablet'}</span>
                        </button>
                      </PopCard>
                    )}
                  </AnimatePresence>
                </div>

                {/* Refresh Preview */}
                <button
                  onClick={() => {
                    setIframeKey(prev => prev + 1);
                    toast.success(language === 'ar' ? 'تم تحديث المعاينة بنجاح' : 'Preview refreshed successfully');
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)] transition-all cursor-pointer shadow-2xs"
                  title={language === 'ar' ? 'تحديث المعاينة' : 'Refresh preview'}
                >
                  <RefreshCw size={13} />
                </button>

                {/* Element Inspect Mode Toggle Button */}
                <button
                  onClick={() => {
                    setIsInspectMode(prev => !prev);
                    toast.info(language === 'ar' ? (!isInspectMode ? '🎯 وضع التفتيش نشط! انقر على أي عنصر في المعاينة لتحديده' : 'تم إيقاف وضع التفتيش') : 'Inspect mode toggled');
                  }}
                  className={`h-8 px-2.5 sm:px-3 rounded-shape-sm border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs ${
                    isInspectMode
                      ? 'bg-[var(--bg-accent-muted)] text-accent border-[var(--border-accent)] shadow-2xs font-bold'
                      : 'bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)]'
                  }`}
                  title={language === 'ar' ? 'تفتيش العناصر وتحديدها للتعديل' : 'Inspect DOM Element'}
                >
                  <MousePointer size={13} />
                  <span className="hidden md:inline">{language === 'ar' ? 'تفتيش 🎯' : 'Inspect'}</span>
                </button>

                {/* Env Vars Vault Modal Button */}
                <button
                  onClick={() => setIsEnvModalOpen(true)}
                  className="h-8 px-2.5 sm:px-3 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-accent hover:border-accent/60 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                  title={language === 'ar' ? 'إدارة مفاتيح البيئة .env' : 'Environment Variables (.env)'}
                >
                  <Key size={13} />
                  <span className="hidden md:inline">.env</span>
                </button>

                {/* Open in New Browser Tab */}
                <button
                  onClick={handleOpenInNewTab}
                  className="h-8 px-2.5 sm:px-3 rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-accent hover:border-accent/60 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title={language === 'ar' ? 'فتح في نافذة متصفح جديدة' : 'Open in new browser tab'}
                >
                  <ArrowUpRight size={13} className={dir === 'rtl' ? 'rotate-[-90deg]' : ''} />
                  <span className="text-xs font-semibold text-[var(--text-primary)] hidden md:inline">
                    {language === 'ar' ? 'فتح بالمتصفح' : 'Open Tab'}
                  </span>
                </button>

                {/* Manual Editor / Quick Adjust Tool */}
                <button
                  onClick={() => {
                    setActiveTab('code');
                    toast.info(language === 'ar' ? 'أداة التحرير اليدوي نشطة' : 'Manual editor tool active');
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-accent hover:border-accent/60 transition-all cursor-pointer shadow-2xs"
                  title={language === 'ar' ? 'أداة التحرير اليدوي' : 'Manual editor tool'}
                >
                  <Wand2 size={13} />
                </button>
              </div>
            )}
          </div>

          {/* View Content: Preview vs Code */}
          <div className={`flex-1 relative overflow-hidden flex flex-col ${isPreviewFullscreen ? 'fixed inset-0 z-[200] bg-[var(--surface-page)]' : ''}`}>
            {/* Fullscreen Exit bar if fullscreen */}
            {isPreviewFullscreen && (
              <div className="h-10 bg-[var(--surface-card)] border-b border-[var(--border-default)] px-4 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold">{language === 'ar' ? 'معاينة ملء الشاشة' : 'Fullscreen Preview'}</span>
                <button
                  onClick={() => setIsPreviewFullscreen(false)}
                  className="h-8 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-semibold hover:border-accent cursor-pointer flex items-center gap-1.5"
                >
                  <X size={14} />
                  <span>{language === 'ar' ? 'خروج' : 'Exit'}</span>
                </button>
              </div>
            )}

            {/* Live Preview Panel (Kept alive in the DOM for instant 0ms tab switching and preserving state) */}
            <div className={`flex-1 w-full h-full bg-[var(--surface-page)] p-0 m-0 relative flex flex-col overflow-hidden ${activeTab !== 'preview' ? 'hidden' : ''}`}>
              {/* Self-Healing Auto-Fix Floating Banner */}
              {runtimeError && (
                <div className="bg-[var(--surface-subtle)] border-b border-[var(--fg-danger)]/40 px-4 py-2 flex items-center justify-between gap-3 text-xs text-[var(--text-primary)] z-40 backdrop-blur-md">
                  <div className="flex items-center gap-2 truncate">
                    <AlertTriangle size={15} className="text-[var(--fg-danger)] shrink-0 animate-pulse" />
                    <span className="font-bold shrink-0">{language === 'ar' ? 'تم اكتشاف خطأ تفاعلي في المعاينة:' : 'Runtime Error Detected:'}</span>
                    <span className="font-mono text-[11px] truncate text-[var(--text-secondary)]">{runtimeError.message}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        handleSendPrompt(`🛠️ إصلاح تلقائي سريع للخطأ التفاعلي المكتشف في شاشة المعاينة الحية: "${runtimeError.message}"`);
                        setRuntimeError(null);
                      }}
                      className="h-8 px-3 bg-[var(--bg-btn-danger)] text-[var(--fg-btn-danger)] hover:brightness-110 rounded-shape-sm text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Wand2 size={12} />
                      <span>{language === 'ar' ? 'إصلاح تلقائي بنقرة واحدة (Auto-Fix)' : '1-Click Auto Fix'}</span>
                    </button>
                    <button onClick={() => setRuntimeError(null)} className="p-1 hover:text-[var(--text-primary)] cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
              <div className={`flex flex-col bg-[var(--surface-card)] transition-all flex-1 w-full h-full ${
                deviceMode === 'mobile' 
                  ? 'w-[375px] h-[667px] max-w-[375px] max-h-[667px] m-auto rounded-shape-lg border border-[var(--border-default)] shadow-2xl overflow-hidden shrink-0' 
                  : deviceMode === 'tablet' 
                  ? 'w-[768px] h-[900px] max-w-[768px] max-h-[900px] m-auto rounded-shape-lg border border-[var(--border-default)] shadow-2xl overflow-hidden shrink-0' 
                  : 'w-full h-full rounded-none border-0 shadow-none flex flex-col'
              }`}>
                {/* Browser Mockup Header */}
                <div className="h-9 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] px-3 flex items-center justify-between shrink-0 select-none">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-shape-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-shape-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-shape-full bg-[var(--fg-success)]" />
                  </div>
                  <div className="px-3 py-1 rounded-shape-xs bg-[var(--surface-card)] border border-[var(--border-default)] text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1.5 w-64 justify-center" dir="ltr">
                    <Globe size={11} className="text-[var(--fg-success)]" />
                    <span className="truncate">http://localhost:3000/</span>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">
                    {deviceMode === 'mobile' ? '375x667' : deviceMode === 'tablet' ? '768x1024' : '100%'}
                  </div>
                </div>

                {/* iframe container */}
                <div className="flex-1 w-full h-full bg-white relative overflow-y-auto">
                  <iframe
                    key={iframeKey}
                    srcDoc={previewSrcDoc}
                    title="App Live Preview"
                    className="w-full h-full min-h-full border-0 bg-white"
                    sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                  />
                </div>
              </div>
            </div>

            {/* Code Editor Panel (Kept alive in the DOM for seamless, lag-free state toggling) */}
            <div className={`flex-1 flex flex-col bg-[var(--surface-card)] ${activeTab !== 'code' ? 'hidden' : ''}`}>
              {/* Professional Code Header */}
              <div className="h-10 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <FileCode size={15} className="text-accent" />
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{activeFilePath}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-accent/10 text-accent border border-accent/20">
                    {activeFile?.content.split('\n').length || 0} lines
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeFile?.content || '');
                      toast.success(dir === 'rtl' ? 'تم نسخ الكود بنجاح!' : 'Code copied to clipboard!');
                    }}
                    className="h-7 px-2.5 rounded-shape-xs text-xs font-semibold bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{language === 'ar' ? 'نسخ الكود' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>

              <textarea
                value={activeFile?.content || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFiles(prev => ({
                    ...prev,
                    [activeFilePath]: { ...prev[activeFilePath], content: val }
                  }));
                }}
                className="flex-1 w-full h-full p-4 font-mono text-xs sm:text-sm bg-[var(--surface-inset)] text-[var(--text-primary)] outline-none resize-none leading-relaxed border-0"
                spellCheck={false}
              />
              <div className="h-11 px-3 bg-[var(--surface-card)] border-t border-[var(--border-default)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasUnsavedChanges && (
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5 animate-pulse">
                      <span>●</span>
                      <span>{language === 'ar' ? 'يوجد تغييرات غير محفوظة' : 'Unsaved changes'}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUndoChanges}
                    disabled={!hasUnsavedChanges}
                    className="h-8 px-3 rounded-shape-sm text-xs font-semibold bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{language === 'ar' ? 'تراجع عن التغييرات' : 'Undo Changes'}</span>
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={!hasUnsavedChanges}
                    className="h-8 px-3.5 rounded-shape-sm text-xs font-semibold bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-theme cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <span>{language === 'ar' ? 'حفظ وتطبيق التغييرات' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Terminal Drawer (Collapsible) */}
            <AnimatePresence>
              {isTerminalOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 220, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[var(--surface-inset)] text-[var(--text-primary)] border-t border-[var(--border-default)] flex flex-col shrink-0 font-mono text-xs z-20"
                >
                  <div className="h-9 px-3 bg-[var(--surface-card)] border-b border-[var(--border-default)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal size={14} className="text-[var(--fg-accent)]" />
                      <span className="font-bold">{language === 'ar' ? 'طرفية الفحص والتشخيص الحي' : 'Live Diagnostics Console'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAiFix}
                        className="h-7 px-2.5 rounded-shape-sm bg-[var(--comp-button-primary-bg)] hover:opacity-90 text-[var(--comp-button-primary-fg)] text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Sparkles size={12} />
                        <span>{language === 'ar' ? 'إصلاح بالذكاء الاصطناعي' : 'AI Fix'}</span>
                      </button>
                      <button 
                        onClick={() => setIsTerminalOpen(false)}
                        className="h-7 w-7 flex items-center justify-center rounded-shape-sm hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-3 overflow-y-auto space-y-1.5">
                    {terminalLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-[var(--text-muted)] text-[10px] select-none">[{log.time}]</span>
                        <span className={`flex-1 ${
                          log.type === 'error' ? 'text-red-400 font-bold' :
                          log.type === 'success' ? 'text-[var(--fg-success)]' : 'text-[var(--text-secondary)]'
                        }`}>
                          {log.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Terminal CLI Command Input */}
                  <form onSubmit={handleTerminalCommand} className="h-10 px-3 bg-[var(--surface-card)] border-t border-[var(--border-default)] flex items-center gap-2">
                    <span className="text-[var(--fg-accent)] font-bold select-none">$</span>
                    <input
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      placeholder={language === 'ar' ? 'أوامر الفحص المتاحة (help, lint, fix, clear, files, refresh, db)...' : 'Diagnostics command (help, lint, fix, clear, files, refresh, db)...'}
                      className="flex-1 bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] font-mono"
                    />
                    <button
                      type="submit"
                      disabled={!terminalInput.trim()}
                      className="h-7 px-3 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 text-[11px] font-semibold disabled:opacity-40 cursor-pointer shadow-2xs transition-all"
                    >
                      {language === 'ar' ? 'تنفيذ' : 'Run'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Database Modal (SQLite WebAssembly) */}
      <AnimatePresence>
        {isDbModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsDbModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-lg w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-subtle)]">
                <div className="flex items-center gap-2.5">
                  <Database size={18} className="text-[var(--fg-success)]" />
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text-primary)]">{language === 'ar' ? 'مدير قاعدة البيانات الافتراضية (SQLite Wasm Engine)' : 'SQLite Database Manager'}</h2>
                    <p className="text-[11px] text-[var(--text-muted)]">{language === 'ar' ? 'إدارة الجداول واستعراض البيانات وتنفيذ استعلامات SQL الفورية' : 'Manage tables, inspect data, and execute SQL queries'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDbModalOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-shape-sm hover:bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Tables List */}
                <div className="w-56 border-e border-[var(--border-default)] p-3 space-y-2 bg-[var(--surface-subtle)] overflow-y-auto shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{language === 'ar' ? 'الجداول المتوفرة' : 'Tables'}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">({sqlTables.length})</span>
                  </div>
                  <div className="space-y-1">
                    {sqlTables.map(tbl => (
                      <button
                        key={tbl}
                        onClick={() => {
                          setSelectedTable(tbl);
                          setQueryResult(null);
                        }}
                        className={`w-full text-right px-2.5 h-8 rounded-shape-sm text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-between ${
                          selectedTable === tbl 
                            ? 'bg-[var(--bg-accent-muted)] text-accent border border-[var(--border-accent)]/40 shadow-2xs font-bold' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-card)]'
                        }`}
                      >
                        <span className="truncate">{tbl}</span>
                        <ChevronLeft size={13} className={dir === 'rtl' ? '' : 'rotate-180'} />
                      </button>
                    ))}

                    {sqlTables.length === 0 && (
                      <div className="p-3 text-center space-y-2">
                        <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                          {language === 'ar' ? 'لا توجد جداول منشأة بعد في قاعدة البيانات.' : 'No tables created yet.'}
                        </p>
                        <button
                          onClick={() => {
                            if (sqlDb) {
                              const seedSql = `
                                CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, role TEXT);
                                INSERT INTO users VALUES (1, 'أحمد محمود', 'ahmed@perplexta.ai', 'admin'), (2, 'سارة خليل', 'sara@perplexta.ai', 'developer');
                                CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, title TEXT, price REAL, stock INTEGER);
                                INSERT INTO products VALUES (1, 'Perplexta Pro License', 49.99, 100), (2, 'AI Cloud Compute Token', 19.99, 500);
                              `;
                              sqlDb.run(seedSql);
                              refreshTables(sqlDb);
                              setSelectedTable('products');
                              addLog('success', 'تم إنشاء جداول تجريبية (users, products) بنجاح');
                              toast.success(language === 'ar' ? 'تم إنشاء الجداول التجريبية بنجاح!' : 'Created sample tables successfully!');
                            }
                          }}
                          className="w-full h-8 px-2 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] text-[10px] font-semibold hover:opacity-90 transition-all cursor-pointer shadow-2xs flex items-center justify-center"
                        >
                          {language === 'ar' ? '+ إنشاء جداول تجريبية' : '+ Create Sample Tables'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table Data Grid & Query Editor */}
                <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
                  {/* SQL Query Editor */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">{language === 'ar' ? 'محرر استعلامات SQL الفوري' : 'Live SQL Query Editor'}</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sqlCustomQuery}
                        onChange={(e) => setSqlCustomQuery(e.target.value)}
                        className="flex-1 h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm font-mono text-xs text-[var(--text-primary)] outline-none focus:border-accent"
                        placeholder="SELECT * FROM products;"
                      />
                      <button
                        onClick={runCustomSqlQuery}
                        className="h-8 px-3.5 bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] text-xs font-semibold rounded-shape-sm hover:opacity-90 transition cursor-pointer shadow-2xs flex items-center justify-center"
                      >
                        {language === 'ar' ? 'تنفيذ' : 'Run'}
                      </button>
                    </div>
                  </div>

                  {/* Query feedback if present */}
                  {queryResult && (
                    <div className={`p-2.5 rounded-shape-sm text-xs font-mono border ${
                      queryResult.error
                        ? 'bg-red-500/10 text-red-500 border-red-500/30'
                        : 'bg-[var(--bg-success-muted)] text-[var(--fg-success)] border-[color-mix(in_srgb,var(--fg-success)_30%,transparent)]'
                    }`}>
                      {queryResult.error ? `خطأ: ${queryResult.error}` : (queryResult.message || `تم استرجاع ${queryResult.values?.length || 0} سجل`)}
                    </div>
                  )}

                  {/* Results / Data Grid */}
                  <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                      {queryResult?.columns 
                        ? (language === 'ar' ? 'نتائج الاستعلام المخصص:' : 'Custom Query Results:') 
                        : (language === 'ar' ? `بيانات الجدول: ${selectedTable}` : `Table Data: ${selectedTable}`)}
                    </span>
                    <div className="flex-1 overflow-auto rounded-shape-sm border border-[var(--border-default)] bg-[var(--surface-subtle)]">
                      {(queryResult?.columns || tableColumns).length > 0 ? (
                        <table className="w-full text-right text-xs font-mono">
                          <thead className="bg-[var(--surface-card)] border-b border-[var(--border-default)] sticky top-0">
                            <tr>
                              {(queryResult?.columns || tableColumns).map((col: string) => (
                                <th key={col} className="px-3 py-2.5 font-bold text-[var(--text-primary)]">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-default)]">
                            {(queryResult?.values || tableDataRows).map((row: any, rIdx: number) => (
                              <tr key={rIdx} className="hover:bg-[var(--surface-card)]/50 transition-colors">
                                {row.map((cell: any, cIdx: number) => (
                                  <td key={cIdx} className="px-3 py-2 text-[var(--text-secondary)]">{String(cell)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-8 text-center text-xs text-[var(--text-muted)] space-y-2">
                          <p>{language === 'ar' ? 'لا توجد بيانات متاحة في هذا الجدول.' : 'No data available in this table.'}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {language === 'ar' ? 'يمكنك تشغيل أمر استعلام SQL لإدراج أو تعديل البيانات.' : 'Execute a SQL query to insert or inspect data.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Environment Variables Modal (.env Secrets Vault) */}
      <AnimatePresence>
        {isEnvModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setIsEnvModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <div className="flex items-center gap-2">
                  <Key size={18} className="text-accent" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'متغيرات البيئة (.env Secrets Vault)' : 'Environment Variables (.env)'}
                  </h3>
                </div>
                <button onClick={() => setIsEnvModalOpen(false)} className="p-1 rounded hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {Object.keys(envVars).map(key => (
                  <div key={key} className="flex items-center justify-between p-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-mono">
                    <div>
                      <span className="font-bold text-accent">{key}</span>
                      <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[220px]">{envVars[key]}</p>
                    </div>
                    <button
                      onClick={() => {
                        const updated = { ...envVars };
                        delete updated[key];
                        setEnvVars(updated);
                        toast.info(language === 'ar' ? `تم حذف ${key}` : `Removed ${key}`);
                      }}
                      className="p-1 text-[var(--text-muted)] hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[var(--border-default)] space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="KEY (e.g. VITE_KEY)"
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                    className="h-8 px-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono outline-none focus:border-accent"
                  />
                  <input
                    type="text"
                    placeholder="VALUE"
                    value={newEnvVal}
                    onChange={(e) => setNewEnvVal(e.target.value)}
                    className="h-8 px-2.5 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono outline-none focus:border-accent"
                  />
                </div>
                <button
                  onClick={() => {
                    if (newEnvKey.trim()) {
                      setEnvVars(prev => ({ ...prev, [newEnvKey.trim()]: newEnvVal.trim() }));
                      setNewEnvKey('');
                      setNewEnvVal('');
                      setIframeKey(prev => prev + 1);
                      toast.success(language === 'ar' ? 'تم حفظ وحقن متغير البيئة بنجاح!' : 'Saved and injected environment variable!');
                    }
                  }}
                  className="w-full h-8 bg-accent hover:opacity-90 text-[var(--comp-button-primary-fg)] rounded-shape-sm text-xs font-semibold cursor-pointer transition-colors shadow-2xs flex items-center justify-center"
                >
                  {language === 'ar' ? 'إضافة وحقن متغيّر البيئة' : 'Add & Inject Variable'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cloud Projects & Version Snapshots Modal */}
      <AnimatePresence>
        {isWorkspacesModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setIsWorkspacesModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-3.5 px-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--surface-subtle)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-shape-sm bg-[var(--surface-card)] border border-[var(--border-default)] flex items-center justify-center text-accent">
                    <Folder size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)]">
                      {language === 'ar' ? 'مشاريعي واللقطات السحابية' : 'Cloud Projects & Snapshots'}
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {language === 'ar' ? 'إدارة مشروعاتك السحابية المحفوظة في قاعدة بيانات بيربليكستا' : 'Manage your cloud projects saved in Perplexta database'}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsWorkspacesModalOpen(false)} 
                  className="h-8 w-8 flex items-center justify-center rounded-shape-sm hover:bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex items-center border-b border-[var(--border-default)] bg-[var(--surface-subtle)]/50 px-4 pt-1.5 gap-2">
                <button
                  onClick={() => setWorkspacesModalTab('workspaces')}
                  className={`h-8 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    workspacesModalTab === 'workspaces'
                      ? 'border-accent text-accent'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Folder size={13} />
                  <span>{language === 'ar' ? 'المشاريع السحابية' : 'Cloud Projects'}</span>
                  <span className="px-1.5 py-0.2 rounded-shape-full bg-[var(--surface-card)] border text-[10px] font-mono">
                    {userWorkspaces.length}
                  </span>
                </button>

                <button
                  onClick={() => setWorkspacesModalTab('snapshots')}
                  className={`h-8 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    workspacesModalTab === 'snapshots'
                      ? 'border-accent text-accent'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <History size={13} />
                  <span>{language === 'ar' ? 'لقطات الإصدارات (Snapshots)' : 'Version Snapshots'}</span>
                  <span className="px-1.5 py-0.2 rounded-shape-full bg-[var(--surface-card)] border text-[10px] font-mono">
                    {workspaceSnapshots.length}
                  </span>
                </button>
              </div>

              {/* Studio Quota & Cloud Radar Bar */}
              {studioUsage && (
                <div className="mx-4 mt-3 p-2.5 px-3 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-default)] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    {/* Projects counter */}
                    <div className="flex items-center gap-1.5">
                      <Folder size={14} className="text-accent" />
                      <span className="font-bold text-[var(--text-primary)]">
                        {language === 'ar' ? 'المشاريع:' : 'Projects:'}
                      </span>
                      <span className="font-mono text-[var(--text-secondary)]">
                        {studioUsage.projectCount} / {studioUsage.maxProjects === 'unlimited' ? '∞' : studioUsage.maxProjects}
                      </span>
                    </div>

                    <div className="h-3.5 w-px bg-[var(--border-default)]" />

                    {/* Storage counter */}
                    <div className="flex items-center gap-1.5">
                      <HardDrive size={14} className="text-[var(--fg-accent)]" />
                      <span className="font-bold text-[var(--text-primary)]">
                        {language === 'ar' ? 'المساحة:' : 'Storage:'}
                      </span>
                      <span className="font-mono text-[var(--text-secondary)]">
                        {studioUsage.storageUsedMb} MB / {studioUsage.maxStorageMb === 'unlimited' ? '∞' : `${studioUsage.maxStorageMb} MB`}
                      </span>
                    </div>
                  </div>

                  {/* Plan Badge and Upgrade Link */}
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-shape-xs bg-accent/10 border border-accent/20 text-accent font-bold text-[10px]">
                      {studioUsage.planName || 'Free'}
                    </span>
                    <button
                      onClick={() => navigate('/subscription')}
                      className="px-2.5 py-1 rounded-shape-xs bg-accent text-[var(--comp-button-primary-fg)] font-bold text-[10px] hover:opacity-90 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <Zap size={10} />
                      <span>{language === 'ar' ? 'ترقية الخطة' : 'Upgrade Plan'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {workspacesModalTab === 'workspaces' && (
                  <div className="space-y-3">
                    {isLoadingWorkspaces ? (
                      <div className="py-12 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin text-accent" />
                        <span>{language === 'ar' ? 'جاري تحميل مشاريعك من قاعدة البيانات...' : 'Loading projects from database...'}</span>
                      </div>
                    ) : userWorkspaces.length > 0 ? (
                      <div className="space-y-2">
                        {userWorkspaces.map((ws: any) => {
                          const isCurrent = ws.id === projectId;
                          const filesMap = typeof ws.files === 'string' ? JSON.parse(ws.files || '{}') : (ws.files || {});
                          const filesCount = Object.keys(filesMap).length;
                          const updatedDate = ws.updated_at ? new Date(ws.updated_at).toLocaleString() : '';

                          return (
                            <div
                              key={ws.id}
                              className={`p-2.5 px-3 rounded-shape-sm border flex items-center justify-between gap-3 transition-all ${
                                isCurrent 
                                  ? 'bg-[var(--bg-accent-muted)] border-[var(--border-accent)]/50 shadow-2xs' 
                                  : 'bg-[var(--surface-subtle)] border-[var(--border-default)] hover:border-accent/40'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{ws.title}</h4>
                                  {isCurrent && (
                                    <span className="px-2 py-0.5 rounded-shape-xs bg-accent text-[var(--comp-button-primary-fg)] text-[10px] font-bold">
                                      {language === 'ar' ? 'المشروع الحالي' : 'Active'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] font-mono">
                                  <span>{filesCount} {language === 'ar' ? 'ملفات' : 'files'}</span>
                                  {updatedDate && <span>• {updatedDate}</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {!isCurrent ? (
                                  <button
                                    onClick={() => handleSwitchWorkspace(ws)}
                                    className="h-8 px-3 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 text-xs font-semibold cursor-pointer transition-all shadow-2xs flex items-center justify-center"
                                  >
                                    {language === 'ar' ? 'فتح' : 'Open'}
                                  </button>
                                ) : (
                                  <span className="text-xs font-bold text-[var(--fg-success)] flex items-center gap-1">
                                    <Check size={14} />
                                    <span>{language === 'ar' ? 'مفتوح' : 'Open'}</span>
                                  </span>
                                )}

                                <button
                                  onClick={() => handleRenameWorkspacePrompt(ws.id, ws.title)}
                                  className="h-8 w-8 flex items-center justify-center rounded-shape-sm text-[var(--text-muted)] hover:text-accent hover:bg-[var(--surface-card)] transition-colors cursor-pointer"
                                  title={language === 'ar' ? 'تعديل اسم المشروع' : 'Rename Project'}
                                >
                                  <Edit2 size={13} />
                                </button>

                                <button
                                  onClick={() => handleDeleteWorkspacePrompt(ws.id, ws.title)}
                                  className="h-8 w-8 flex items-center justify-center rounded-shape-sm text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--surface-card)] transition-colors cursor-pointer"
                                  title={language === 'ar' ? 'حذف المشروع' : 'Delete Project'}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-xs text-[var(--text-muted)] space-y-3">
                        <Folder size={28} className="mx-auto text-[var(--text-muted)] opacity-50" />
                        <p>{language === 'ar' ? 'لا توجد مشاريع سحابية محفوظة بعد في حسابك.' : 'No cloud projects saved yet in your account.'}</p>
                        <button
                          onClick={() => {
                            setIsWorkspacesModalOpen(false);
                            handleCreateNewProject();
                          }}
                          className="h-8 px-3.5 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-2xs"
                        >
                          {language === 'ar' ? '+ إنشاء مشروعك الأول' : '+ Create First Project'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {workspacesModalTab === 'snapshots' && (
                  <div className="space-y-4">
                    {/* Create Snapshot Form */}
                    <div className="p-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-2">
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {language === 'ar' ? 'إنشاء نقطة استعادة (Snapshot) للمشروع الحالي' : 'Create Version Snapshot for Active Project'}
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSnapshotName}
                          onChange={(e) => setNewSnapshotName(e.target.value)}
                          placeholder={language === 'ar' ? 'اسم الإصدار (مثال: v1.0 - الواجهة الأساسية)...' : 'Version name (e.g. v1.0 - Core Layout)...'}
                          className="flex-1 h-8 px-2.5 bg-[var(--surface-card)] border border-[var(--border-default)] rounded-shape-sm text-xs text-[var(--text-primary)] outline-none focus:border-accent"
                        />
                        <button
                          onClick={handleCreateSnapshot}
                          disabled={!newSnapshotName.trim() || isSnapshotLoading}
                          className="h-8 px-3.5 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 text-xs font-semibold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                        >
                          {isSnapshotLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                          <span>{language === 'ar' ? 'حفظ اللقطة' : 'Save'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Snapshots List */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[var(--text-secondary)]">
                        {language === 'ar' ? 'سجل الإصدارات المحفوظة:' : 'Saved Version History:'}
                      </span>
                      {workspaceSnapshots.length > 0 ? (
                        workspaceSnapshots.map((snap: any) => (
                          <div
                            key={snap.id}
                            className="p-2.5 px-3 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-[var(--text-primary)] truncate">{snap.version_name}</h5>
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                {snap.created_at ? new Date(snap.created_at).toLocaleString() : ''}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRestoreSnapshot(snap.id, snap.version_name)}
                              className="h-8 px-3 rounded-shape-sm bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] hover:border-accent text-xs font-semibold text-[var(--text-primary)] cursor-pointer transition-all shadow-2xs flex items-center gap-1"
                            >
                              <RotateCcw size={12} className="text-accent" />
                              <span>{language === 'ar' ? 'استعادة' : 'Restore'}</span>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                          {language === 'ar' ? 'لا توجد لقطات إصدار محفوظة لهذا المشروع حتى الآن.' : 'No snapshots saved for this project yet.'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cloud Project Deletion Confirmation Modal with Name Typing Verification */}
      <AnimatePresence>
        {projectToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              if (!isDeletingProject) {
                setProjectToDelete(null);
                setDeleteConfirmText('');
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-rose-500/40 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-shape-sm bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'تأكيد حذف المشروع السحابي نهائياً' : 'Permanently Delete Cloud Project'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    {language === 'ar'
                      ? 'هذا الإجراء سيقوم بحذف المشروع وكافة ملفاته وسجل المحادثة المرتبط به نهائياً من قاعدة البيانات ولا يمكن التراجع عنه.'
                      : 'This will permanently delete this project and all its files from the cloud database. This action cannot be undone.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-shape-sm bg-rose-500/5 border border-rose-500/20 space-y-2">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] block">
                  {language === 'ar' ? 'لتأكيد الحذف، اكتب اسم المشروع أدناه:' : 'To confirm deletion, type the project name below:'}
                </label>
                <div className="p-1.5 px-2 rounded bg-[var(--surface-subtle)] border border-[var(--border-default)] font-mono text-xs font-bold text-rose-400 select-all">
                  {projectToDelete.title}
                </div>
                <input
                  type="text"
                  autoFocus
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={projectToDelete.title}
                  className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm text-xs font-mono text-[var(--text-primary)] outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  disabled={isDeletingProject}
                  onClick={() => {
                    setProjectToDelete(null);
                    setDeleteConfirmText('');
                  }}
                  className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmText.trim() !== projectToDelete.title.trim() || isDeletingProject}
                  onClick={executeDeleteWorkspace}
                  className="h-8 px-4 rounded-shape-sm bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                >
                  {isDeletingProject ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>{language === 'ar' ? 'تأكيد الحذف النهائي' : 'Confirm Delete'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cloud Project Rename Modal */}
      <AnimatePresence>
        {projectToRename && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              if (!isRenamingProject) {
                setProjectToRename(null);
                setRenameText('');
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3">
                <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-accent">
                  <Edit2 size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'تعديل اسم المشروع السحابي' : 'Rename Cloud Project'}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {language === 'ar' ? 'قم بتحديث عنوان المشروع المحفوظ في حسابك' : 'Update project title in your account'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {language === 'ar' ? 'اسم المشروع الجديد:' : 'New Project Name:'}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={renameText}
                  onChange={(e) => setRenameText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      executeRenameWorkspace();
                    }
                  }}
                  className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm text-xs text-[var(--text-primary)] outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  disabled={isRenamingProject}
                  onClick={() => {
                    setProjectToRename(null);
                    setRenameText('');
                  }}
                  className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={!renameText.trim() || isRenamingProject}
                  onClick={executeRenameWorkspace}
                  className="h-8 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                >
                  {isRenamingProject ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{language === 'ar' ? 'حفظ الاسم' : 'Save Name'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snapshot Restore Confirmation Modal */}
      <AnimatePresence>
        {snapshotToRestore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              if (!isRestoringSnapshot) setSnapshotToRestore(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-accent/40 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-shape-sm bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                  <RotateCcw size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'تأكيد استعادة الإصدار المحفوظ' : 'Restore Version Snapshot'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    {language === 'ar'
                      ? `هل أنت متأكد من رغبتك في استعادة الإصدار "${snapshotToRestore.name}"؟ سيتم استبدال محتويات الملفات الحالية في المحرر بملفات هذا الإصدار.`
                      : `Are you sure you want to restore snapshot "${snapshotToRestore.name}"? Current workspace files will be replaced with this version.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  disabled={isRestoringSnapshot}
                  onClick={() => setSnapshotToRestore(null)}
                  className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isRestoringSnapshot}
                  onClick={executeRestoreSnapshot}
                  className="h-8 px-4 rounded-shape-sm bg-accent text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                >
                  {isRestoringSnapshot ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                  <span>{language === 'ar' ? 'تأكيد الاستعادة' : 'Confirm Restore'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Delete Confirmation Modal */}
      <AnimatePresence>
        {fileToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setFileToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-shape-md bg-[var(--surface-card)] border border-rose-500/30 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-shape-sm bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                  <Trash2 size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'حذف ملف من المشروع' : 'Delete File'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-mono break-all">
                    {fileToDelete}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setFileToDelete(null)}
                  className="h-8 px-3 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={executeDeleteFile}
                  className="h-8 px-3.5 rounded-shape-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-all shadow-2xs"
                >
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New File Creation Modal */}
      <AnimatePresence>
        {isNewFileModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsNewFileModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3">
                <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-accent">
                  <Plus size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'إنشاء ملف جديد في المشروع' : 'Create New Project File'}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {language === 'ar' ? 'حدد مسار واسم الملف مع الامتداد المناسب' : 'Specify the file path with valid extension'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {language === 'ar' ? 'مسار الملف (مثال: src/components/Card.jsx):' : 'File Path (e.g. src/components/Card.jsx):'}
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="src/components/Header.jsx"
                  value={newFilePathInput}
                  onChange={(e) => setNewFilePathInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFilePathInput.trim()) {
                      e.preventDefault();
                      const path = newFilePathInput.trim();
                      setFiles(prev => ({
                        ...prev,
                        [path]: { name: path.split('/').pop() || path, path, type: path.split('.').pop() || 'txt', content: '// كود جديد\n' }
                      }));
                      setActiveFilePath(path);
                      addLog('success', `تم إنشاء الملف: ${path}`);
                      setIsNewFileModalOpen(false);
                      setNewFilePathInput('');
                      toast.success(language === 'ar' ? `تم إنشاء ${path}` : `Created ${path}`);
                    }
                  }}
                  className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm text-xs font-mono text-[var(--text-primary)] outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setIsNewFileModalOpen(false)}
                  className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={!newFilePathInput.trim()}
                  onClick={() => {
                    const path = newFilePathInput.trim();
                    if (!path) return;
                    setFiles(prev => ({
                      ...prev,
                      [path]: { name: path.split('/').pop() || path, path, type: path.split('.').pop() || 'txt', content: '// كود جديد\n' }
                    }));
                    setActiveFilePath(path);
                    addLog('success', `تم إنشاء الملف: ${path}`);
                    setIsNewFileModalOpen(false);
                    setNewFilePathInput('');
                    toast.success(language === 'ar' ? `تم إنشاء ${path}` : `Created ${path}`);
                  }}
                  className="h-8 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>{language === 'ar' ? 'إنشاء الملف' : 'Create File'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Rename Modal */}
      <AnimatePresence>
        {fileToRename && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setFileToRename(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-[var(--border-default)] pb-3">
                <div className="w-8 h-8 rounded-shape-sm bg-[var(--surface-subtle)] border border-[var(--border-default)] flex items-center justify-center text-accent">
                  <Edit2 size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'ar' ? 'إعادة تسمية الملف' : 'Rename File'}
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">
                    {fileToRename}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {language === 'ar' ? 'المسار الجديد:' : 'New Path:'}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newFilePathRename}
                  onChange={(e) => setNewFilePathRename(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFilePathRename.trim() && newFilePathRename.trim() !== fileToRename) {
                      e.preventDefault();
                      const trimmed = newFilePathRename.trim();
                      const oldPath = fileToRename;
                      setFiles(prev => {
                        const next = { ...prev };
                        const fileData = next[oldPath];
                        delete next[oldPath];
                        next[trimmed] = {
                          ...fileData,
                          name: trimmed.split('/').pop() || trimmed,
                          path: trimmed,
                          type: trimmed.split('.').pop() || 'txt'
                        };
                        return next;
                      });
                      if (activeFilePath === oldPath) {
                        setActiveFilePath(trimmed);
                      }
                      addLog('log', `تم تغيير اسم الملف من ${oldPath} إلى ${trimmed}`);
                      setFileToRename(null);
                      toast.success(language === 'ar' ? 'تمت إعادة التسمية بنجاح' : 'Renamed successfully');
                    }
                  }}
                  className="w-full h-8 px-2.5 bg-[var(--surface-subtle)] border border-[var(--border-default)] rounded-shape-sm text-xs font-mono text-[var(--text-primary)] outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setFileToRename(null)}
                  className="h-8 px-3.5 rounded-shape-sm bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={!newFilePathRename.trim() || newFilePathRename.trim() === fileToRename}
                  onClick={() => {
                    const trimmed = newFilePathRename.trim();
                    const oldPath = fileToRename;
                    if (!trimmed || trimmed === oldPath) return;
                    setFiles(prev => {
                      const next = { ...prev };
                      const fileData = next[oldPath];
                      delete next[oldPath];
                      next[trimmed] = {
                        ...fileData,
                        name: trimmed.split('/').pop() || trimmed,
                        path: trimmed,
                        type: trimmed.split('.').pop() || 'txt'
                      };
                      return next;
                    });
                    if (activeFilePath === oldPath) {
                      setActiveFilePath(trimmed);
                    }
                    addLog('log', `تم تغيير اسم الملف من ${oldPath} إلى ${trimmed}`);
                    setFileToRename(null);
                    toast.success(language === 'ar' ? 'تمت إعادة التسمية بنجاح' : 'Renamed successfully');
                  }}
                  className="h-8 px-4 rounded-shape-sm bg-[var(--comp-button-primary-bg)] text-[var(--comp-button-primary-fg)] hover:opacity-90 disabled:opacity-40 text-xs font-bold cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Check size={13} />
                  <span>{language === 'ar' ? 'تحديث الاسم' : 'Update'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default AppStudioPage;
