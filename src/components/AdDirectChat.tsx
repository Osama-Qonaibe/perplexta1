import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Send, 
  X, 
  Loader2, 
  Check, 
  CheckCheck, 
  ShieldCheck, 
  MessageSquare, 
  Paperclip
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getMediaUrl } from '../utils/mediaUtils';
import { safeStorageGet } from '../utils/safeStorage';
import { BulletinAvatar } from './BulletinAvatar';
import { toast } from '@/design-system';

export interface AdDirectMessage {
  id: number;
  ad_id: number;
  sender_id: number;
  recipient_id: number;
  sender_name: string;
  sender_avatar?: string;
  message: string;
  media_url?: string;
  is_encrypted: boolean;
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
}

interface AdDirectChatProps {
  ad: {
    id: number;
    title: string;
    image_url?: string | null;
    author_name?: string | null;
    author_avatar?: string | null;
    user_id?: number | null;
    page_owner_id?: number | null;
    page_name?: string | null;
    quick_questions?: string[] | null;
  };
  onClose?: () => void;
  isCompact?: boolean;
}

export const AdDirectChat: React.FC<AdDirectChatProps> = ({ ad, onClose, isCompact = false }) => {
  const { user, token, socket, language } = useAppContext();
  const isRtl = language === 'ar';

  const [messages, setMessages] = useState<AdDirectMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<{ id: number; name: string; avatar?: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  const customQuickQuestions = ad.quick_questions;
  const quickQuestions = (Array.isArray(customQuickQuestions) && customQuickQuestions.length > 0 && customQuickQuestions.some(Boolean))
    ? customQuickQuestions.filter(Boolean)
    : (isRtl
        ? [
            'هل المنتج متوفر حالياً؟',
            'ما هو السعر النهائي وهل يوجد خصم؟',
            'هل يتوفر توصيل للمحافظات؟',
            'أود شراء وحجز هذا الإعلان فوراً!'
          ]
        : [
            'Is this item currently available?',
            'What is the final price?',
            'Do you offer shipping/delivery?',
            'I would like to buy this item now!'
          ]);

  useEffect(() => {
    if (!token || !ad.id) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/bulletin/ads/${ad.id}/direct-messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setMessages(data.messages || []);
          if (data.other_participant) {
            setOtherParticipant(data.other_participant);
          } else {
            setOtherParticipant({
              id: data.ad?.owner_id || ad.user_id || 0,
              name: data.ad?.page_name || data.ad?.author_name || ad.author_name || (isRtl ? 'صاحب الإعلان' : 'Advertiser'),
              avatar: data.ad?.page_avatar || data.ad?.author_avatar || ad.author_avatar
            });
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching ad direct messages:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
        setTimeout(() => scrollToBottom(false), 200);
      });

    return () => {
      isMounted = false;
    };
  }, [ad.id, token, isRtl]);

  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleIncomingMessage = (newMsg: AdDirectMessage) => {
      if (newMsg.ad_id === ad.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => scrollToBottom(true), 100);
      }
    };

    const handleRecipientTyping = (data: { ad_id: number; sender_id: number; is_typing: boolean }) => {
      if (data.ad_id === ad.id && data.sender_id !== user.id) {
        setRecipientTyping(data.is_typing);
      }
    };

    socket.on('ad_direct_message', handleIncomingMessage);
    socket.on('ad_typing', handleRecipientTyping);

    return () => {
      socket.off('ad_direct_message', handleIncomingMessage);
      socket.off('ad_typing', handleRecipientTyping);
    };
  }, [socket, ad.id, user?.id]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, recipientTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputMessage(val);

    if (socket && otherParticipant?.id) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('ad_typing', { ad_id: ad.id, recipient_id: otherParticipant.id, is_typing: true });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('ad_typing', { ad_id: ad.id, recipient_id: otherParticipant.id, is_typing: false });
      }, 1500);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error(isRtl ? 'حجم الصورة كبير جداً (الأقصى 10 ميجابايت)' : 'Image size too large (max 10MB)');
      return;
    }

    const toastId = toast.loading(isRtl ? 'جاري رفع الصورة...' : 'Uploading image...');
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const authToken = token || safeStorageGet('app_token') || '';
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formDataUpload
      });

      if (res.ok) {
        const data = await res.json();
        const rawUrl = data.fileUrl || data.file?.url || data.file?.file_url || data.url;
        const fileUrl = getMediaUrl(rawUrl);
        if (fileUrl) {
          setAttachedImage(fileUrl);
          toast.dismiss(toastId);
          toast.success(isRtl ? 'تم رفع المرفق بنجاح' : 'Attachment uploaded successfully');
          return;
        }
      }
      throw new Error('Upload failed');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(isRtl ? 'فشل رفع مرفق الصورة، يرجى إعادة المحاولة' : 'Failed to upload image attachment');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputMessage).trim();
    if ((!content && !attachedImage) || sending || !token) return;

    setSending(true);
    const tempImage = attachedImage;
    setInputMessage('');
    setAttachedImage(null);

    if (socket && otherParticipant?.id) {
      socket.emit('ad_typing', { ad_id: ad.id, recipient_id: otherParticipant.id, is_typing: false });
      setIsTyping(false);
    }

    try {
      const res = await fetch(`/api/bulletin/ads/${ad.id}/direct-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: content,
          media_url: tempImage,
          recipient_id: otherParticipant?.id,
          is_encrypted: true
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setTimeout(() => scrollToBottom(true), 100);
      } else {
        toast.error(data.error || (isRtl ? 'فشل إرسال الرسالة' : 'Failed to send message'));
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error(isRtl ? 'حدث خطأ أثناء إرسال الرسالة' : 'Error sending message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`flex flex-col bg-[var(--surface-card)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-lg overflow-hidden ${isCompact ? 'h-[440px]' : 'h-[520px]'} transition-colors duration-fast`}>
      {/* Encryption & Participant Header */}
      <div className="px-4 py-3 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <BulletinAvatar
            src={otherParticipant?.avatar}
            alt={otherParticipant?.name || 'User'}
            size="md"
            isOnline={true}
          />

          <div>
            <div className="flex items-center gap-1">
              <h4 className="font-extrabold text-sm text-[var(--text-primary)] line-clamp-1">
                {otherParticipant?.name || (isRtl ? 'محادثة خاصة' : 'Private Inquiry')}
              </h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[var(--fg-accent)] bg-[var(--bg-accent-muted)] px-2 py-0.5 rounded-[var(--radius-xs)] border border-[var(--border-accent)]/20 shrink-0">
                <Lock size={10} />
                <span>E2EE</span>
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 flex items-center gap-1">
              <ShieldCheck size={12} className="text-[var(--fg-accent)] shrink-0" />
              <span>{isRtl ? 'مشفر بالكامل (AES-256)' : 'End-to-End Encrypted'}</span>
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={isRtl ? 'إغلاق المحادثة' : 'Close chat'}
            className="w-8 h-8 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Security Banner */}
      <div className="bg-[var(--bg-accent-muted)] border-b border-[var(--border-accent)]/20 px-3 py-1.5 flex items-center justify-center gap-1 text-[11px] font-bold text-[var(--fg-accent)] text-center shrink-0">
        <Lock size={12} className="shrink-0" />
        <span>
          {isRtl
            ? 'محادثة أمنة ومشفرة تماماً. لا يتم كشف بياناتك الشخصية.'
            : 'Secure & encrypted end-to-end. Your private info is protected.'}
        </span>
      </div>

      {/* Messages Stream Body */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[var(--surface-page)]">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
            <Loader2 size={24} className="animate-spin text-[var(--fg-accent)]" />
            <span className="text-xs font-semibold">
              {isRtl ? 'جاري فك التشفير وجلب الرسائل...' : 'Decrypting & loading messages...'}
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--bg-accent-muted)] text-[var(--fg-accent)] flex items-center justify-center mb-3">
              <MessageSquare size={22} />
            </div>
            <h5 className="font-extrabold text-sm text-[var(--text-primary)] mb-1">
              {isRtl ? 'ابدأ الاستفسار عن الإعلان الآن' : 'Start Your Direct Inquiry'}
            </h5>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs mb-4">
              {isRtl
                ? 'استفسر مباشرة عن الأسعار، التوصيل، وحجز السلعة بأمان وسرية.'
                : 'Ask directly about pricing, delivery, and availability with instant E2E privacy.'}
            </p>

            {/* Quick Questions Chips */}
            <div className="w-full max-w-sm space-y-1 text-start">
              <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider block">
                {isRtl ? 'أسئلة سريعة جاهزة:' : 'Quick Prompts:'}
              </span>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={`quick-prompt-empty-${idx}-${q}`}
                    onClick={() => handleSendMessage(q)}
                    className="text-xs font-bold px-3 py-2 min-h-[36px] rounded-[var(--radius-sm)] bg-[var(--surface-card)] hover:bg-[var(--bg-accent-emphasis)] hover:text-[var(--fg-on-emphasis)] text-[var(--text-secondary)] border border-[var(--border-default)] transition-colors duration-fast text-start"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, mIdx) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div
                key={`msg-${msg.id || mIdx}-${mIdx}`}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[78%] px-3.5 py-2.5 rounded-[var(--radius-md)] text-xs leading-relaxed relative transition-colors duration-fast ${
                    isMe
                      ? 'bg-[var(--bg-accent-emphasis)] text-[var(--fg-on-emphasis)] font-medium'
                      : 'bg-[var(--surface-card)] text-[var(--text-primary)] border border-[var(--border-default)]'
                  }`}
                >
                  {/* Media attachment if exists */}
                  {msg.media_url && (
                    <div className="mb-2 rounded-[var(--radius-sm)] overflow-hidden max-h-48 border border-[var(--border-default)]">
                      <img
                        src={getMediaUrl(msg.media_url)}
                        alt="Attached media"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>

                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                      isMe ? 'text-[var(--fg-on-emphasis)]/80' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <span className="font-mono text-[9px]">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* E2EE indicator */}
                    <Lock size={9} className="opacity-80" />

                    {/* Status ticks for user messages */}
                    {isMe && (
                      <span className="shrink-0">
                        {msg.status === 'read' ? (
                          <CheckCheck size={12} className="text-current font-bold" />
                        ) : (
                          <Check size={12} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Recipient Typing Indicator */}
        {recipientTyping && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] italic bg-[var(--surface-card)] px-3 py-1.5 rounded-[var(--radius-sm)] w-fit border border-[var(--border-default)]">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-[var(--fg-accent)] rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-[var(--fg-accent)] rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-[var(--fg-accent)] rounded-full animate-bounce [animation-delay:0.4s]" />
            </span>
            <span>{isRtl ? 'المعلن يكتب الآن...' : 'Typing message...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar (when messages exist) */}
      {messages.length > 0 && (
        <div className="px-3 py-1.5 bg-[var(--surface-card)] border-t border-[var(--border-subtle)] overflow-x-auto custom-scrollbar flex items-center gap-1 text-xs shrink-0">
          {quickQuestions.slice(0, 3).map((q, idx) => (
            <button
              key={`quick-prompt-bar-${idx}-${q}`}
              onClick={() => handleSendMessage(q)}
              className="text-[11px] font-medium px-2.5 py-1 min-h-[36px] rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] hover:bg-[var(--bg-accent-muted)] hover:text-[var(--fg-accent)] text-[var(--text-secondary)] whitespace-nowrap transition-colors duration-fast border border-[var(--border-subtle)]"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Image Attachment Preview */}
      {attachedImage && (
        <div className="p-2 bg-[var(--surface-subtle)] border-t border-[var(--border-default)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <img src={getMediaUrl(attachedImage)} alt="Preview" className="w-10 h-10 object-cover rounded-[var(--radius-sm)] border border-[var(--border-default)]" />
            <span className="text-xs text-[var(--text-secondary)] font-medium">
              {isRtl ? 'صورة مرفقة جاهزة للإرسال' : 'Image attached'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAttachedImage(null)}
            aria-label="Remove image"
            className="w-7 h-7 min-h-[36px] min-w-[36px] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--fg-danger)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-2.5 bg-[var(--surface-card)] border-t border-[var(--border-default)] flex items-center gap-2 shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label={isRtl ? 'إرفاق صورة' : 'Attach image'}
          className="w-8 h-8 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--fg-accent)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
        >
          <Paperclip size={18} />
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={
            isRtl ? 'اكتب استفسارك المباشر هنا (مشفر بالكامل)...' : 'Type your encrypted inquiry...'
          }
          className="flex-1 bg-[var(--surface-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-xs px-3.5 py-2.5 min-h-[40px] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] focus:border-[var(--focus-outline)] focus:bg-[var(--surface-card)] focus:outline-none transition-colors duration-fast"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={(!inputMessage.trim() && !attachedImage) || sending}
          aria-label={isRtl ? 'إرسال الرسالة المشفرة' : 'Send message'}
          className="p-2.5 min-w-[44px] min-h-[44px] rounded-[var(--radius-sm)] bg-[var(--bg-accent-emphasis)] hover:opacity-90 disabled:opacity-40 text-[var(--fg-on-emphasis)] font-bold transition-colors duration-fast flex items-center justify-center shrink-0 cursor-pointer"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
};
