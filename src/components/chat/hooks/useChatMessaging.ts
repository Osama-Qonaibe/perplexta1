import { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '../types';
import { ChatService } from '../../../services/chatService';
import { extractImmediateChatTitle } from '../../../utils/chatUtils';
import { toast } from '@/design-system';
import { useNavigate } from 'react-router-dom';

export const useChatMessaging = (
  initialChatId: string | undefined,
  socket: any,
  token: string | null,
  dir: 'rtl' | 'ltr',
  user: any,
  selectedTool: string,
  selectedModel: string,
  videoSettings: any,
  imageSettings: any,
  audioSettings: any,
  forensicMode: boolean,
  setForensicMode: (v: boolean) => void,
  setQuery: (v: string) => void,
  setSelectedFile: (v: File | null) => void,
  setPreviewUrl: (v: string | null) => void,
  setForensicReport: (v: any) => void,
  setIsAuthModalOpen: (v: boolean) => void,
  hasActiveSub: boolean,
  activeDropdown: string
) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string | null>(initialChatId || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChatMessagesLoading, setIsChatMessagesLoading] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingParty, setTypingParty] = useState<'assistant' | 'user' | null>(null);
  const [typingName, setTypingName] = useState('');
  const [imageProgress, setImageProgress] = useState(0);
  const [ledgerNotice, setLedgerNotice] = useState<any>(null);
  const [typedNotice, setTypedNotice] = useState('');

  const fetchingChatIdRef = useRef<string | null>(null);
  const lastFetchedIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (initialChatId && token) {
      sessionStorage.setItem('perplexta_active_chat_id', initialChatId);
      if (lastFetchedIdRef.current !== initialChatId) {
        lastFetchedIdRef.current = initialChatId;
        fetchMessages(initialChatId);
      }
    } else if (!initialChatId) {
      sessionStorage.removeItem('perplexta_active_chat_id');
      lastFetchedIdRef.current = null;
      setMessages([]);
      setChatId(null);
    }
  }, [initialChatId, token]);

  useEffect(() => {
    if (!socket) return;

    const onTyping = (data: any) => {
      setIsOtherTyping(data.isTyping);
      setTypingParty(data.role);
      setTypingName(data.name || '');
    };

    const onChatChunk = (data: any) => {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (!lastMsg || lastMsg.role !== 'assistant') {
          return [...prev, {
            id: Date.now(),
            role: 'assistant',
            content: data.chunk,
            created_at: new Date().toISOString()
          }];
        }
        
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...lastMsg,
          content: (lastMsg.content || '') + data.chunk
        };
        return newMessages;
      });
      
      if (data.isFinal) {
        setIsGenerating(false);
      }
    };

    const onChatResponse = (data: any) => {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          newMessages[newMessages.length - 1] = {
            ...lastMsg,
            id: data.message_id,
            content: data.result,
            citations: data.citations,
            follow_ups: data.follow_ups,
            generation_time: data.generation_time
          };
        } else {
          newMessages.push({
            id: data.message_id,
            role: 'assistant',
            content: data.result,
            citations: data.citations,
            follow_ups: data.follow_ups,
            generation_time: data.generation_time,
            created_at: new Date().toISOString()
          });
        }
        return newMessages;
      });
      setIsGenerating(false);
    };

    socket.on('typing', onTyping);
    socket.on('chat_chunk', onChatChunk);
    socket.on('chat_response', onChatResponse);

    return () => {
      socket.off('typing', onTyping);
      socket.off('chat_chunk', onChatChunk);
      socket.off('chat_response', onChatResponse);
    };
  }, [socket]);

  const fetchMessages = async (id: string) => {
    if (!token) return;
    if (fetchingChatIdRef.current === id) return;
    fetchingChatIdRef.current = id;
    setIsChatMessagesLoading(true);
    try {
      const data = await ChatService.getMessages(token, id);
      setMessages(Array.isArray(data) ? data : (data.messages || []));
      setChatId(id);
    } catch (error) {
      toast.error(dir === 'rtl' ? 'فشل تحميل الرسائل' : 'Failed to load messages');
    } finally {
      fetchingChatIdRef.current = null;
      setIsChatMessagesLoading(false);
    }
  };

  const handleSendOrStop = async (query: string, file: File | null, previewUrl: string | null, overrideToolId?: string) => {
    if (isGenerating) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsGenerating(false);
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      return;
    }

    if (!query.trim() && !file) return;

    if (!hasActiveSub) {
      toast.error(dir === 'rtl' ? 'اشتراك نشط مطلوب' : 'Active subscription required');
      setIsAuthModalOpen(true);
      return;
    }

    let activeChatId = chatId;
    
    if (!activeChatId) {
      try {
        const smartTitle = extractImmediateChatTitle(query.trim(), dir === 'rtl' ? 'ar' : 'en');
        const fallbackTitle = dir === 'rtl' ? 'محادثة جديدة' : 'New Session';
        const finalTitle = smartTitle || fallbackTitle;
        const newChat = await ChatService.createChat(token!, finalTitle);
        activeChatId = newChat.id;
        setChatId(activeChatId);
        lastFetchedIdRef.current = String(activeChatId);
        sessionStorage.setItem('perplexta_active_chat_id', String(activeChatId));
        
        const chatDetail = {
          id: String(activeChatId),
          title: finalTitle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        window.dispatchEvent(new CustomEvent('chat-created', { detail: chatDetail }));
        window.dispatchEvent(new CustomEvent('chat-updated', { detail: chatDetail }));
        navigate(`/chat/${activeChatId}`, { replace: true });
      } catch (err: any) {
        toast.error(err.message || (dir === 'rtl' ? 'فشل إنشاء المحادثة' : 'Failed to create chat'));
        return;
      }
    }

    const effectiveTool = overrideToolId || selectedTool;

    // Capture attachments and inputs into local scoped constants to prevent race conditions or state cleanups from destroying file details
    const textSnapshot = query;
    const fileSnapshot = file;
    const forensicModeSnapshot = forensicMode;

    const userMsg: Message = {
      role: 'user',
      content: textSnapshot,
      client_id: Date.now().toString(),
      created_at: new Date().toISOString()
    };

    const pendingAssistantMsg: Message = {
      role: 'assistant',
      content: '',
      tool: effectiveTool,
      model: selectedModel,
      client_id: (Date.now() + 1).toString(),
      created_at: new Date().toISOString(),
      aspect_ratio: effectiveTool === 'video' ? (videoSettings?.aspectRatio || '9:16') : (imageSettings?.aspectRatio || '1:1')
    };

    setMessages(prev => [...prev, userMsg, pendingAssistantMsg]);
    setQuery('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Zero-latency asynchronous Base64 reader for attached documents or images in analysis mode
      let fileDataPayload: any = null;
      if (fileSnapshot) {
        const fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const resultStr = reader.result as string;
            // Extract pure base64 content
            const base64Content = resultStr.split(',')[1] || resultStr;
            resolve(base64Content);
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(fileSnapshot);
        });

        fileDataPayload = {
          name: fileSnapshot.name,
          type: fileSnapshot.type,
          size: fileSnapshot.size,
          data: fileBase64
        };
      }

      const res = await fetch('/api/chats/sync-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          chatId: activeChatId,
          content: textSnapshot,
          toolId: effectiveTool,
          modelId: selectedModel,
          imageSettings,
          videoSettings,
          fileData: fileDataPayload,
          forensicMode: forensicModeSnapshot
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = (dir === 'rtl' && errData.error_ar) 
          ? errData.error_ar 
          : (errData.error || errData.message || 'Failed to sync message');
        throw new Error(errMsg);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Sync message request aborted successfully by the user.');
        setIsGenerating(false);
        return;
      }
      setIsGenerating(false);
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      toast.error(err.message);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  return {
    messages,
    setMessages,
    isGenerating,
    chatId,
    isChatMessagesLoading,
    handleSendOrStop,
    isOtherTyping,
    typingParty,
    typingName,
    imageProgress,
    ledgerNotice,
    typedNotice,
    setTypedNotice
  };
};
