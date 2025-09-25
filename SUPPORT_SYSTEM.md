# Support Ticketing System

A complete customer support ticketing system integrated into the Polyglotas application.

## Features

### For Students
- **Create Support Tickets**: Submit support requests with categorized reasons
- **View Ticket History**: See all submitted tickets and their status
- **Real-time Messaging**: Chat with support staff within tickets
- **Mobile Responsive**: Fully functional on mobile devices

### For Staff (Admin/Support roles)
- **Ticket Management**: View all customer tickets
- **Status Updates**: Change ticket status (open, in_progress, resolved, closed)
- **Assignment**: Assign tickets to staff members
- **Response System**: Reply to customer messages

## Database Schema

### Tables Added
- `support_tickets`: Main ticket information
- `support_ticket_messages`: Messages within tickets

### Enums Added
- `ticket_status_enum`: open, in_progress, resolved, closed
- `contact_reason_enum`: billing_issue, partnership_benefits, technical_issue, feature_request, content_error, account_question, other
- `user_role_enum`: Added 'support' role

## API Endpoints

### GET /api/support/tickets
- Fetch tickets (filtered by user role)
- Staff see all tickets, students see only their own

### POST /api/support/tickets
- Create new support ticket
- Automatically creates initial message

### GET /api/support/tickets/messages?ticket_id=X
- Fetch messages for a specific ticket
- Access control based on ownership/role

### POST /api/support/tickets/messages
- Send message to ticket
- Updates ticket's last_message_at timestamp
- Reopens resolved tickets when customer responds

### PATCH /api/support/tickets/[id]
- Update ticket status and assignment (staff only)
- Handles self-assignment for staff

## Components

### SupportDashboard
Main orchestrating component with three views:
- List view: Shows all tickets
- Create view: Form to create new tickets
- Ticket view: Messages and actions for specific ticket

### CreateTicketForm
- Categorized reason selection
- Subject and message input
- Form validation

### TicketList
- Displays tickets with status badges
- Shows customer info for staff
- Mobile-responsive cards

### TicketMessages
- Real-time message display
- Role-based styling (staff messages highlighted)
- Message input with keyboard shortcuts

### TicketActions
- Status dropdown for staff
- Assignment management
- Mobile-responsive layout

## Navigation Integration

- Added "Support" link to account navigation
- Updated billing page "Contact Support" button to link to support system
- Role-based visibility (all users can access)

## Access Control

### Students
- Can create tickets
- Can view only their own tickets
- Can send messages to their tickets
- Cannot send messages to closed tickets

### Staff (Admin/Support)
- Can view all tickets
- Can update ticket status
- Can assign tickets (admins only)
- Can send messages to any ticket

## Mobile Responsiveness

- Responsive grid layouts
- Touch-friendly buttons
- Optimized message display
- Collapsible dropdowns
- Proper spacing for mobile screens

## Usage

1. **Creating a Ticket**: Navigate to Account > Support > New Ticket
2. **Viewing Tickets**: All tickets are listed with status and last activity
3. **Messaging**: Click on a ticket to view conversation and send messages
4. **Staff Management**: Staff can update status and assign tickets using dropdown menus

## Technical Implementation

- **TypeScript**: Full type safety with custom interfaces
- **React Hooks**: Custom hooks for data management
- **Supabase**: Database operations with RLS policies
- **Responsive Design**: Tailwind CSS with mobile-first approach
- **Real-time Updates**: Automatic refresh after actions
- **Error Handling**: Comprehensive error states and loading indicators

The system is production-ready with proper error handling, loading states, and responsive design suitable for both desktop and mobile use.