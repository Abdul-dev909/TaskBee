import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createNotification } from './useNotifications';
import { checkRateLimit } from './useRateLimit';
import { toast } from './use-toast';

export interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
}

export const useMessages = (jobId: string | undefined, userId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  useEffect(() => {
    if (!jobId || !userId) {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
        
        // Mark received messages as read
        const unreadIds = data
          .filter(m => m.receiver_id === userId && !m.is_read)
          .map(m => m.id);
        
        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadIds);
        }
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to real-time messages and typing status
    const channel = supabase
      .channel(`messages-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Mark as read if it's for current user
          if (newMessage.receiver_id === userId) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id)
              .then(() => {});
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev => 
            prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
          );
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const otherUserPresence = Object.values(presenceState).find(
          (presence: any) => presence[0]?.user_id !== userId
        );
        const typingStatus = otherUserPresence?.[0] as any;
        setIsOtherUserTyping(typingStatus?.typing || false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, userId]);

  const sendMessage = async (
    receiverId: string,
    messageText: string,
    receiverName: string
  ) => {
    if (!jobId || !userId || !messageText.trim()) return;

    // Check rate limit
    const rateLimitCheck = await checkRateLimit('message_send');
    if (!rateLimitCheck.allowed) {
      toast({
        title: "Rate Limit Exceeded",
        description: rateLimitCheck.message || "You're sending messages too quickly. Please wait a moment.",
        variant: "destructive",
      });
      return;
    }

    // Validate message length
    const trimmedMessage = messageText.trim();
    if (trimmedMessage.length > 2000) {
      toast({
        title: "Message Too Long",
        description: "Messages must be 2000 characters or less.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        job_id: jobId,
        sender_id: userId,
        receiver_id: receiverId,
        message_text: trimmedMessage,
      });

    if (!error) {
      // Create notification for receiver
      await createNotification(
        receiverId,
        'New Message',
        `You have a new message from ${receiverName}`,
        'message',
        jobId
      );
    } else {
      console.error('Error sending message:', error);
    }
  };

  const setTypingStatus = async (isTyping: boolean) => {
    if (!jobId || !userId) return;
    
    const channel = supabase.channel(`messages-${jobId}`);
    await channel.track({ user_id: userId, typing: isTyping });
  };

  return {
    messages,
    loading,
    sendMessage,
    isOtherUserTyping,
    setTypingStatus,
  };
};