"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Shield, Headphones } from 'lucide-react';
import { SupportTicketMessage, CreateMessageData, UserRole } from '@/types/support';

interface TicketMessagesProps {
  messages: SupportTicketMessage[];
  isLoading: boolean;
  onSendMessage: (data: CreateMessageData) => Promise<void>;
  ticketId: number;
  currentUserId: string;
  canSendMessages: boolean;
}

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  student: <User className="w-4 h-4" />,
  partnership_manager: <User className="w-4 h-4" />,
  admin: <Shield className="w-4 h-4" />,
  support: <Headphones className="w-4 h-4" />,
};

const ROLE_COLORS: Record<UserRole, string> = {
  student: 'text-blue-600 dark:text-blue-400',
  partnership_manager: 'text-purple-600 dark:text-purple-400',
  admin: 'text-red-600 dark:text-red-400',
  support: 'text-green-600 dark:text-green-400',
};

export default function TicketMessages({ 
  messages, 
  isLoading, 
  onSendMessage, 
  ticketId, 
  currentUserId,
  canSendMessages 
}: TicketMessagesProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage({
        ticket_id: ticketId,
        message_text: newMessage.trim(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender_profile_id === currentUserId;
            const senderRole = message.sender?.role || 'student';
            const isStaff = senderRole === 'admin' || senderRole === 'support';

            return (
              <div
                key={message.message_id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isCurrentUser
                      ? 'bg-blue-600 text-white'
                      : isStaff
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-900 dark:text-green-100'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                >
                  {!isCurrentUser && (
                    <div className={`flex items-center gap-1 text-xs mb-1 ${ROLE_COLORS[senderRole]}`}>
                      {ROLE_ICONS[senderRole]}
                      <span className="font-medium">
                        {message.sender?.first_name} {message.sender?.last_name}
                      </span>
                      {isStaff && (
                        <span className="text-xs opacity-75">
                          ({senderRole === 'admin' ? 'Admin' : 'Support'})
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.message_text}
                  </p>
                  <div
                    className={`text-xs mt-1 ${
                      isCurrentUser
                        ? 'text-blue-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {formatDate(message.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {canSendMessages && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}