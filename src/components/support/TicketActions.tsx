"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Loader2, User } from 'lucide-react';
import { SupportTicket, TicketStatus } from '@/types/support';

interface TicketActionsProps {
  ticket: SupportTicket;
  onUpdateStatus: (ticketId: number, status: string, assignedTo?: string) => Promise<void>;
}

const STATUS_OPTIONS: { value: TicketStatus; label: string; color: string }[] = [
  { value: 'open', label: 'Open', color: 'text-red-600' },
  { value: 'in_progress', label: 'In Progress', color: 'text-yellow-600' },
  { value: 'resolved', label: 'Resolved', color: 'text-green-600' },
  { value: 'closed', label: 'Closed', color: 'text-gray-600' },
];

export default function TicketActions({ ticket, onUpdateStatus }: TicketActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const assignMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
      if (assignMenuRef.current && !assignMenuRef.current.contains(event.target as Node)) {
        setShowAssignMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusUpdate = async (newStatus: TicketStatus) => {
    setIsUpdating(true);
    setShowStatusMenu(false);
    try {
      await onUpdateStatus(ticket.ticket_id, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignToSelf = async () => {
    setIsUpdating(true);
    setShowAssignMenu(false);
    try {
      // This will assign to current user - the API will handle getting the current user ID
      await onUpdateStatus(ticket.ticket_id, ticket.status, 'self');
    } catch (error) {
      console.error('Failed to assign ticket:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnassign = async () => {
    setIsUpdating(true);
    setShowAssignMenu(false);
    try {
      await onUpdateStatus(ticket.ticket_id, ticket.status, undefined);
    } catch (error) {
      console.error('Failed to unassign ticket:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.value === ticket.status);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      {/* Status Dropdown */}
      <div className="relative" ref={statusMenuRef}>
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          disabled={isUpdating}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 w-full sm:w-auto"
        >
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span className={currentStatus?.color}>
                {currentStatus?.label}
              </span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>

        {showStatusMenu && (
          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status.value}
                onClick={() => handleStatusUpdate(status.value)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  status.value === ticket.status ? 'bg-gray-50 dark:bg-gray-700' : ''
                } ${status.color}`}
              >
                {status.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Dropdown */}
      <div className="relative" ref={assignMenuRef}>
        <button
          onClick={() => setShowAssignMenu(!showAssignMenu)}
          disabled={isUpdating}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 w-full sm:w-auto"
        >
          <User className="w-4 h-4" />
          <span>
            {ticket.assigned_to 
              ? `${ticket.assigned_to.first_name} ${ticket.assigned_to.last_name}`
              : 'Unassigned'
            }
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {showAssignMenu && (
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
            <button
              onClick={handleAssignToSelf}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Assign to me
            </button>
            {ticket.assigned_to_profile_id && (
              <button
                onClick={handleUnassign}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
              >
                Unassign
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}