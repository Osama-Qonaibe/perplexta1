import { safeStorageGet, safeStorageSet, safeStorageRemove } from "@/utils/safeStorage";
import React, { useState, useEffect } from 'react';
import { 
  googleSignIn, 
  googleSignOut, 
  initGoogleAuth, 
  GOOGLE_CHAT_SCOPES, 
  GoogleUser as User 
} from '../lib/googleAuth';
import { 
  MessageSquare, Send, Plus, Users, Hash, RefreshCw, 
  LogIn, LogOut, CheckCircle2, AlertCircle, ShieldCheck, Loader2 
} from 'lucide-react';
import { toast, useConfirm } from '@/design-system';

let cachedChatToken: string | null = null;
let isSigningIn = false;

interface GoogleChatProps {
  dir: 'rtl' | 'ltr';
  theme: 'light' | 'dark' | 'system';
}

interface Space {
  name: string; // e.g., "spaces/AAAA..."
  displayName: string;
  spaceType: string;
  singleUserBotDm?: boolean;
  threaded?: boolean;
}

interface Message {
  name: string;
  sender?: {
    name: string;
    displayName: string;
    type: string;
  };
  createTime: string;
  text?: string;
}

export const GoogleChatManager: React.FC<GoogleChatProps> = ({ dir, theme }) => {
  const isAr = dir === 'rtl';
  const confirmDialog = useConfirm();

  const [isConnected, setIsConnected] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [messageText, setMessageText] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);

  useEffect(() => {
    const savedToken = safeStorageGet('google_chat_token');
    if (savedToken) {
      cachedChatToken = savedToken;
    }

    const unsubscribe = initGoogleAuth(
      (user, token) => {
        const activeToken = cachedChatToken || token;
        if (activeToken) {
          setIsConnected(true);
          setGoogleUser(user);
          fetchSpaces(activeToken);
        }
      },
      () => {
        if (!cachedChatToken) {
          setIsConnected(false);
          setGoogleUser(null);
          setSpaces([]);
          setSelectedSpace(null);
          setMessages([]);
        }
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setIsConnecting(true);
      isSigningIn = true;
      const result = await googleSignIn(GOOGLE_CHAT_SCOPES);
      if (!result?.accessToken) {
        throw new Error('Failed to obtain Google Chat access token.');
      }
      cachedChatToken = result.accessToken;
      safeStorageSet('google_chat_token', result.accessToken);
      setIsConnected(true);
      setGoogleUser(result.user);
      toast.success(isAr ? 'تم الاتصال بجوجل شات بنجاح' : 'Connected to Google Chat successfully');
      fetchSpaces(cachedChatToken);
    } catch (err: any) {
      console.error('[GoogleChat] Sign in error:', err);
      
      const isInIframe = window.self !== window.top;
      let errorMessage = err.message || (isAr ? 'فشل تسجيل الدخول' : 'Sign in failed');
      
      if (err.code === 'auth/internal-error' || err.code === 'auth/popup-blocked') {
        if (isInIframe) {
          errorMessage = isAr 
            ? 'فشل تسجيل الدخول بسبب قيود العرض. يرجى محاولة فتح التطبيق في نافذة جديدة.' 
            : 'Sign-in failed due to iframe restrictions. Please try opening the app in a new tab.';
        } else {
          errorMessage = isAr 
            ? 'تأكد من السماح بالنوافذ المنبثقة وتحقق من إعدادات المتصفح.' 
            : 'Ensure popups are allowed and check your browser settings.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsConnecting(false);
      isSigningIn = false;
    }
  };

  const handleSignOut = async () => {
    await googleSignOut();
    cachedChatToken = null;
    safeStorageRemove('google_chat_token');
    setIsConnected(false);
    setGoogleUser(null);
    setSpaces([]);
    setSelectedSpace(null);
    setMessages([]);
    toast.success(isAr ? 'تم قطع الاتصال' : 'Disconnected from Google Chat');
  };

  const fetchSpaces = async (token: string) => {
    try {
      setIsLoadingSpaces(true);
      const res = await fetch('/api/google-chat/spaces', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setSpaces(data.spaces || []);
      if (data.spaces && data.spaces.length > 0 && !selectedSpace) {
        setSelectedSpace(data.spaces[0]);
        fetchMessages(data.spaces[0].name, token);
      }
    } catch (err: any) {
      console.error('[GoogleChat] Fetch spaces error:', err);
      toast.error(isAr ? 'فشل جلب مساحات المحادثة' : 'Failed to fetch chat spaces');
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  const fetchMessages = async (spaceResourceName: string, token?: string) => {
    const activeToken = token || cachedChatToken;
    if (!activeToken) return;
    try {
      setIsLoadingMessages(true);
      const spaceId = spaceResourceName.split('/')[1];
      const res = await fetch(`/api/google-chat/spaces/${spaceId}/messages`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      const msgs = (data.messages || []).sort((a: Message, b: Message) => 
        new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
      );
      setMessages(msgs);
    } catch (err: any) {
      console.error('[GoogleChat] Fetch messages error:', err);
      toast.error(isAr ? 'فشل جلب الرسائل' : 'Failed to fetch messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const confirmSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedSpace) return;
    setShowSendModal(true);
  };

  const executeSendMessage = async () => {
    if (!cachedChatToken || !selectedSpace || !messageText.trim()) return;
    try {
      setIsSending(true);
      const spaceId = selectedSpace.name.split('/')[1];
      const res = await fetch(`/api/google-chat/spaces/${spaceId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cachedChatToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: messageText.trim() })
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      toast.success(isAr ? 'تم إرسال الرسالة بنجاح' : 'Message sent successfully');
      setMessageText('');
      setShowSendModal(false);
      fetchMessages(selectedSpace.name);
    } catch (err: any) {
      console.error('[GoogleChat] Send message error:', err);
      toast.error(isAr ? 'فشل إرسال الرسالة' : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim() || !cachedChatToken) return;
    
    const confirmed = await confirmDialog({
      title: isAr ? 'إنشاء مساحة عمل' : 'Create Space',
      description: isAr 
        ? `هل أنت متأكد من إنشاء مساحة عمل جديدة باسم "${newSpaceName.trim()}"؟`
        : `Are you sure you want to create a new space named "${newSpaceName.trim()}"?`,
      variant: 'info',
      confirmLabel: isAr ? 'إنشاء' : 'Create'
    });
    if (!confirmed) return;

    try {
      setIsCreatingSpace(true);
      const res = await fetch('/api/google-chat/spaces', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cachedChatToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          spaceType: 'SPACE',
          displayName: newSpaceName.trim()
        })
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const newSpace = await res.json();
      toast.success(isAr ? 'تم إنشاء المساحة بنجاح' : 'Space created successfully');
      setNewSpaceName('');
      setShowCreateSpaceModal(false);
      fetchSpaces(cachedChatToken);
      setSelectedSpace(newSpace);
      setMessages([]);
    } catch (err: any) {
      console.error('[GoogleChat] Create space error:', err);
      toast.error(isAr ? 'فشل إنشاء المساحة' : 'Failed to create space');
    } finally {
      setIsCreatingSpace(false);
    }
  };

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-card)] border border-[var(--border-default)] p-6 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[var(--surface-subtle)] rounded-[var(--radius-full)] blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border-accent)] flex items-center justify-center text-[var(--fg-accent)] shadow-inner">
              <MessageSquare size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-wide">
                  {isAr ? 'تكامل Google Chat' : 'Google Chat Integration'}
                </h3>
                <span className="px-2 py-0.5 rounded-[var(--radius-xs)] text-[10px] font-semibold bg-[var(--surface-subtle)] text-[var(--fg-accent)] border border-[var(--border-accent)]">
                  {isAr ? 'نشط' : 'API Active'}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
                {isAr 
                  ? 'إدارة محادثات Google Chat ومساحات العمل وإرسال الرسائل مباشرة من منصتك.'
                  : 'Manage Google Chat conversations, spaces, and send messages directly from your platform.'}
              </p>
            </div>
          </div>

          <div>
            {!isConnected ? (
              <button
                onClick={handleSignIn}
                disabled={isConnecting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-page)] text-[var(--fg-accent)] border border-[var(--border-accent)] font-medium text-sm transition-theme shadow-lg shadow-none disabled:opacity-50"
              >
                {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                <span>{isAr ? 'ربط حساب Google Chat' : 'Connect Google Chat'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                  {googleUser?.photoURL ? (
                    <img src={googleUser.photoURL} alt="Avatar" className="w-6 h-6 rounded-[var(--radius-xs)] object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] text-[var(--fg-accent)] flex items-center justify-center text-xs font-bold">
                      {googleUser?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-medium text-[var(--text-primary)] max-w-[120px] truncate">
                    {googleUser?.displayName || googleUser?.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-sm)] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-theme"
                  title={isAr ? 'قطع الاتصال' : 'Disconnect'}
                >
                  <LogOut size={14} />
                  <span>{isAr ? 'خروج' : 'Disconnect'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isConnected ? (
        <div className="rounded-[var(--radius-lg)] bg-[var(--surface-card)] border border-[var(--border-default)] p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-[var(--radius-lg)] bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto">
            <ShieldCheck size={32} />
          </div>
          <h4 className="text-lg font-bold text-[var(--text-primary)]">
            {isAr ? 'يرجى ربط حساب Google الخاص بك' : 'Connect Your Google Account'}
          </h4>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            {isAr 
              ? 'انقر على زر "ربط حساب Google Chat" أعلاه لمنح الأذونات الآمنة وتمكين مراسلة مساحات العمل.'
              : 'Click the "Connect Google Chat" button above to grant secure permissions and enable workspace messaging.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Spaces Sidebar */}
          <div className="lg:col-span-4 rounded-[var(--radius-lg)] bg-[var(--surface-card)] border border-[var(--border-default)] p-4 flex flex-col h-[600px]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)] mb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-accent" />
                <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  {isAr ? 'مساحات العمل' : 'Chat Spaces'}
                </h4>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => cachedChatToken && fetchSpaces(cachedChatToken)}
                  className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-theme"
                  title={isAr ? 'تحديث' : 'Refresh'}
                >
                  <RefreshCw size={14} className={isLoadingSpaces ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => setShowCreateSpaceModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-sm)] bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 text-xs font-semibold transition-theme"
                >
                  <Plus size={14} />
                  <span>{isAr ? 'مساحة جديدة' : 'New Space'}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {isLoadingSpaces && spaces.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </div>
              ) : spaces.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-muted)] text-xs">
                  {isAr ? 'لا توجد مساحات محادثة' : 'No spaces found'}
                </div>
              ) : (
                spaces.map(space => {
                  const isSelected = selectedSpace?.name === space.name;
                  return (
                    <button
                      key={space.name}
                      onClick={() => {
                        setSelectedSpace(space);
                        fetchMessages(space.name);
                      }}
                      className={`w-full text-left p-3 rounded-[var(--radius-md)] border transition-theme flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-accent/10 border-accent/40 text-[var(--text-primary)]' 
                          : 'bg-[var(--surface-subtle)] border-[var(--border-default)] hover:bg-[var(--surface-card)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center ${isSelected ? 'bg-accent text-[var(--comp-button-primary-fg,#ffffff)] font-bold' : 'bg-[var(--surface-card)] text-accent border border-[var(--border-default)]'}`}>
                        {space.spaceType === 'DM' ? <Users size={16} /> : <Hash size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold truncate">
                          {space.displayName || space.name}
                        </h5>
                        <p className="text-[10px] text-[var(--text-muted)] truncate capitalize">
                          {space.spaceType.toLowerCase()}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="lg:col-span-8 rounded-[var(--radius-lg)] bg-[var(--surface-card)] border border-[var(--border-default)] p-4 flex flex-col h-[600px]">
            {selectedSpace ? (
              <>
                {/* Space Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)] mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[var(--radius-md)] bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      <Hash size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        {selectedSpace.displayName || selectedSpace.name}
                      </h4>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {isAr ? 'مساحة عمل Google Chat نشطة' : 'Active Google Chat Workspace'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => fetchMessages(selectedSpace.name)}
                    className="p-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-theme"
                  >
                    <RefreshCw size={16} className={isLoadingMessages ? 'animate-spin' : ''} />
                  </button>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4 custom-scrollbar">
                  {isLoadingMessages && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-[var(--text-muted)]">
                      <MessageSquare size={36} className="text-[var(--text-muted)] opacity-50" />
                      <p className="text-xs font-medium">
                        {isAr ? 'لا توجد رسائل في هذه المساحة بعد' : 'No messages in this space yet'}
                      </p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.name} className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-accent">
                            {msg.sender?.displayName || (isAr ? 'مستخدم' : 'User')}
                          </span>
                          <span className="text-[var(--text-muted)] text-[10px]">
                            {new Date(msg.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                          {msg.text || (isAr ? '[محتوى غير متوفر]' : '[Attachment or unsupported format]')}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Send Message Input */}
                <form onSubmit={confirmSendMessage} className="flex items-center gap-2 pt-2 border-t border-[var(--border-default)]">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={isAr ? 'اكتب رسالة إلى Google Chat...' : 'Type a message to Google Chat...'}
                    className="flex-1 bg-[var(--surface-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="px-4 py-2.5 rounded-[var(--radius-md)] bg-accent hover:opacity-90 text-[var(--comp-button-primary-fg,#ffffff)] font-medium text-sm transition-theme disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-none"
                  >
                    <Send size={16} />
                    <span className="hidden sm:inline">{isAr ? 'إرسال' : 'Send'}</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-[var(--text-muted)]">
                <Users size={40} className="text-[var(--text-muted)] opacity-50" />
                <p className="text-sm font-medium">
                  {isAr ? 'اختر مساحة محادثة للبدء' : 'Select a chat space to begin'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Sending Message (MANDATORY per Workspace guidelines) */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--surface-card)] border border-[var(--border-default)] p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-base">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[var(--radius-md)] bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
                <Send size={22} />
              </div>
              <div>
                <h4 className="text-base font-bold text-[var(--text-primary)]">
                  {isAr ? 'تأكيد إرسال الرسالة' : 'Confirm Send Message'}
                </h4>
                <p className="text-xs text-[var(--text-muted)]">
                  {selectedSpace?.displayName || selectedSpace?.name}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-sm text-[var(--text-primary)]">
              <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
                {isAr ? 'نص الرسالة:' : 'Message Text:'}
              </p>
              <p className="font-medium whitespace-pre-wrap">{messageText}</p>
            </div>

            <p className="text-xs text-amber-400 flex items-center gap-1">
              <AlertCircle size={14} />
              <span>{isAr ? 'سيتم إرسال هذه الرسالة بشكل فوري إلى مساحة Google Chat.' : 'This message will be sent immediately to the Google Chat space.'}</span>
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-page)] text-[var(--text-secondary)] font-medium text-xs border border-[var(--border-default)] transition-theme"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={executeSendMessage}
                disabled={isSending}
                className="flex items-center gap-2 px-5 py-2 rounded-[var(--radius-md)] bg-accent hover:opacity-90 text-[var(--comp-button-primary-fg,#ffffff)] font-medium text-xs transition-theme shadow-lg shadow-none disabled:opacity-50"
              >
                {isSending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>{isAr ? 'تأكيد الإرسال' : 'Confirm & Send'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Space Modal */}
      {showCreateSpaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--surface-card)] border border-[var(--border-default)] p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-base">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[var(--radius-md)] bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
                <Plus size={22} />
              </div>
              <div>
                <h4 className="text-base font-bold text-[var(--text-primary)]">
                  {isAr ? 'إنشاء مساحة Google Chat جديدة' : 'Create New Google Chat Space'}
                </h4>
                <p className="text-xs text-[var(--text-muted)]">
                  {isAr ? 'أدخل اسم مساحة العمل الجديدة' : 'Enter a display name for the new space'}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  {isAr ? 'اسم المساحة' : 'Space Name'}
                </label>
                <input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder={isAr ? 'مثال: فريق التطوير' : 'e.g. Engineering Team'}
                  className="w-full bg-[var(--surface-page)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-accent"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSpaceModal(false)}
                  className="px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-page)] text-[var(--text-secondary)] font-medium text-xs border border-[var(--border-default)] transition-theme"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!newSpaceName.trim() || isCreatingSpace}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-accent hover:opacity-90 text-[var(--comp-button-primary-fg,#ffffff)] font-medium text-xs transition-theme shadow-lg shadow-none disabled:opacity-50"
                >
                  {isCreatingSpace ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>{isAr ? 'إنشاء المساحة' : 'Create Space'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
