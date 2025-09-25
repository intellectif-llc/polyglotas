export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ContactReason = 'billing_issue' | 'partnership_benefits' | 'technical_issue' | 'feature_request' | 'content_error' | 'account_question' | 'other';
export type UserRole = 'student' | 'partnership_manager' | 'admin' | 'support';

export interface SupportTicket {
  ticket_id: number;
  profile_id: string;
  assigned_to_profile_id: string | null;
  status: TicketStatus;
  reason: ContactReason;
  subject: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  last_message_at: string | null;
  assigned_to?: {
    first_name: string | null;
    last_name: string | null;
  };
  profile?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export interface SupportTicketMessage {
  message_id: number;
  ticket_id: number;
  sender_profile_id: string;
  message_text: string;
  attachment_url: string | null;
  created_at: string;
  sender?: {
    first_name: string | null;
    last_name: string | null;
    role: UserRole;
  };
}

export interface CreateTicketData {
  reason: ContactReason;
  subject: string;
  message: string;
}

export interface CreateMessageData {
  ticket_id: number;
  message_text: string;
}