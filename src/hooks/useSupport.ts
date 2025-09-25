import { useState, useEffect, useCallback } from 'react';
import { SupportTicket, SupportTicketMessage, CreateTicketData, CreateMessageData } from '@/types/support';

export function useTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/support/tickets');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tickets');
      }

      setTickets(data.tickets || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const createTicket = async (ticketData: CreateTicketData) => {
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create ticket');
      }

      await fetchTickets(); // Refresh the list
      return data.ticket;
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  };

  const updateTicketStatus = async (ticketId: number, status: string, assignedTo?: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          ...(assignedTo !== undefined && { assigned_to_profile_id: assignedTo })
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update ticket');
      }

      await fetchTickets(); // Refresh the list
      return data.ticket;
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  };

  return {
    tickets,
    isLoading,
    error,
    createTicket,
    updateTicketStatus,
    refetch: fetchTickets,
  };
}

export function useTicketMessages(ticketId: number | null) {
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!ticketId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/support/tickets/messages?ticket_id=${ticketId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch messages');
      }

      setMessages(data.messages || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async (messageData: CreateMessageData) => {
    try {
      const response = await fetch('/api/support/tickets/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      await fetchMessages(); // Refresh messages
      return data.message;
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    refetch: fetchMessages,
  };
}