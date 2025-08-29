import { InvitationManagement } from '@/components/partnership/InvitationManagement';

export default function PartnershipPage() {
  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Partnership Manager</h1>
        <p className="text-gray-600">Manage partnership invitations</p>
      </div>
      <InvitationManagement />
    </div>
  );
}