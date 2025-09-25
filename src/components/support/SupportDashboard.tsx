"use client";

import React, { useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { useTickets, useTicketMessages } from '@/hooks/useSupport';
import { useUserRole } from '@/hooks/useUserRole';
import { SupportTicket, CreateTicketData } from '@/types/support';
import CreateTicketForm from './CreateTicketForm';
import TicketList from './TicketList';
import TicketMessages from './TicketMessages';
import TicketActions from './TicketActions';

export default function SupportDashboard() {
  const [view, setView] = useState<'list' | 'create' | 'ticket'>('list');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { tickets, isLoading: ticketsLoading, createTicket, updateTicketStatus } = useTickets();
  const { messages, isLoading: messagesLoading, sendMessage } = useTicketMessages(selectedTicket?.ticket_id || null);
  const { role } = useUserRole();
  const userId = 'temp-user-id'; // TODO: Get actual user ID

  const isStaffMember = role === 'admin';

  const handleCreateTicket = async (data: CreateTicketData) => {
    setIsCreating(true);
    try {
      await createTicket(data);
      setView('list');
    } catch (error) {
      console.error('Failed to create ticket:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTicketSelect = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setView('ticket');
  };

  const handleTicketUpdate = async (ticketId: number, status: string, assignedTo?: string) => {
    try {
      const updatedTicket = await updateTicketStatus(ticketId, status, assignedTo);
      // Update the selected ticket if it's the one being updated
      if (selectedTicket && selectedTicket.ticket_id === ticketId) {
        setSelectedTicket(updatedTicket);
      }
      return updatedTicket;
    } catch (error) {
      throw error;
    }
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    setView('list');
  };

  const canSendMessages = selectedTicket && (
    selectedTicket.profile_id === userId || 
    isStaffMember
  ) && selectedTicket.status !== 'closed';

  if (view === 'create') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setView('list')}
            className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to tickets
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Support Ticket
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Describe your issue and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <CreateTicketForm onSubmit={handleCreateTicket} isSubmitting={isCreating} />
        </div>
      </div>
    );
  }

  if (view === 'ticket' && selectedTicket) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToList}
              className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to tickets
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {selectedTicket.subject}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ticket #{selectedTicket.ticket_id}
              </p>
            </div>
          </div>
          {isStaffMember && (
            <div className="flex-shrink-0">
              <TicketActions
                ticket={selectedTicket}
                onUpdateStatus={handleTicketUpdate}
              />
            </div>
          )}
        </div>

        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-0">
          <TicketMessages
            messages={messages}
            isLoading={messagesLoading}
            onSendMessage={sendMessage}
            ticketId={selectedTicket.ticket_id}
            currentUserId={userId || ''}
            canSendMessages={canSendMessages || false}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isStaffMember ? 'Support Tickets' : 'My Support Tickets'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isStaffMember 
              ? 'Manage and respond to customer support requests'
              : 'View and manage your support requests'
            }
          </p>
        </div>
        {!isStaffMember && (
          <button
            onClick={() => setView('create')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <TicketList
            tickets={tickets}
            isLoading={ticketsLoading}
            onTicketSelect={handleTicketSelect}
            isStaffView={isStaffMember}
          />
        </div>
      </div>
    </div>
  );
}