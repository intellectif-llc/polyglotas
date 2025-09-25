"use client";

import React from 'react';
import { Clock, MessageCircle, User, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { SupportTicket, TicketStatus, ContactReason } from '@/types/support';

interface TicketListProps {
  tickets: SupportTicket[];
  isLoading: boolean;
  onTicketSelect: (ticket: SupportTicket) => void;
  selectedTicketId?: number;
  isStaffView?: boolean;
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: 'Open', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: <AlertCircle className="w-3 h-3" /> },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: <Loader2 className="w-3 h-3" /> },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', icon: <CheckCircle className="w-3 h-3" /> },
};

const REASON_LABELS: Record<ContactReason, string> = {
  billing_issue: 'Billing',
  partnership_benefits: 'Partnership',
  technical_issue: 'Technical',
  feature_request: 'Feature Request',
  content_error: 'Content Error',
  account_question: 'Account',
  other: 'Other',
};

export default function TicketList({ tickets, isLoading, onTicketSelect, selectedTicketId, isStaffView }: TicketListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  if (tickets.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No support tickets
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {isStaffView ? "No tickets to display." : "You haven't created any support tickets yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => {
        const status = STATUS_CONFIG[ticket.status];
        const isSelected = selectedTicketId === ticket.ticket_id;

        return (
          <div
            key={ticket.ticket_id}
            onClick={() => onTicketSelect(ticket)}
            className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
              isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {ticket.subject}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    #{ticket.ticket_id}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {REASON_LABELS[ticket.reason]}
                  </span>
                </div>
              </div>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                {status.icon}
                {status.label}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(ticket.created_at)}
                </div>
                {isStaffView && ticket.profile && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {ticket.profile.first_name} {ticket.profile.last_name}
                  </div>
                )}
                {ticket.assigned_to && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Assigned to {ticket.assigned_to.first_name} {ticket.assigned_to.last_name}
                  </div>
                )}
              </div>
              {ticket.last_message_at && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {formatDate(ticket.last_message_at)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}