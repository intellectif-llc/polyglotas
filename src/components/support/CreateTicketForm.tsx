"use client";

import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { ContactReason, CreateTicketData } from '@/types/support';

interface CreateTicketFormProps {
  onSubmit: (data: CreateTicketData) => Promise<void>;
  isSubmitting: boolean;
}

const CONTACT_REASONS: { value: ContactReason; label: string; description: string }[] = [
  { value: 'billing_issue', label: 'Billing Issue', description: 'Problems with payments, subscriptions, or invoices' },
  { value: 'technical_issue', label: 'Technical Issue', description: 'App bugs, login problems, or technical difficulties' },
  { value: 'account_question', label: 'Account Question', description: 'Questions about your account settings or profile' },
  { value: 'partnership_benefits', label: 'Partnership Benefits', description: 'Questions about partnership perks or benefits' },
  { value: 'content_error', label: 'Content Error', description: 'Report errors in lessons, audio, or translations' },
  { value: 'feature_request', label: 'Feature Request', description: 'Suggest new features or improvements' },
  { value: 'other', label: 'Other', description: 'Any other questions or concerns' },
];

export default function CreateTicketForm({ onSubmit, isSubmitting }: CreateTicketFormProps) {
  const [formData, setFormData] = useState<CreateTicketData>({
    reason: 'technical_issue',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) return;
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          What can we help you with?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CONTACT_REASONS.map((reason) => (
            <label
              key={reason.value}
              className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors ${
                formData.reason === reason.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={reason.value}
                checked={formData.reason === reason.value}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value as ContactReason })}
                className="sr-only"
              />
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {reason.label}
                  </div>
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {reason.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="Brief description of your issue"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          required
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Message
        </label>
        <textarea
          id="message"
          rows={6}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Please provide as much detail as possible about your issue..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !formData.subject.trim() || !formData.message.trim()}
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Send className="w-4 h-4 mr-2" />
        )}
        {isSubmitting ? 'Creating Ticket...' : 'Create Ticket'}
      </button>
    </form>
  );
}