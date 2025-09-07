'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Plus, Mail, Trash2, Send } from 'lucide-react';

interface Partnership {
  id: number;
  name: string;
  trial_duration_days: number;
  trial_tier: string;
  discount_percentage: number;
}

interface UserProfile {
  partnership_id?: number;
  role: 'admin' | 'partnership_manager';
}

interface Invitation {
  id: number;
  token: string;
  intended_for_email: string;
  status: 'pending' | 'redeemed' | 'expired';
  expires_at: string;
  created_at: string;
  redeemed_at?: string;
}

export function InvitationManagement() {
  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [selectedPartnershipId, setSelectedPartnershipId] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'records' | 'send' | 'activation'>('records');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedInvitations, setSelectedInvitations] = useState<number[]>([]);
  const [selectedRedeemedInvitations, setSelectedRedeemedInvitations] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  
  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);

  const supabase = createSupabaseBrowserClient();

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('partnership_id, role')
        .eq('id', user.id)
        .single();

      if (!profile?.partnership_id && profile?.role !== 'admin') return;
      
      setUserProfile(profile);

      if (profile.role === 'admin') {
        const { data: allPartnerships } = await supabase
          .from('partnerships')
          .select('*')
          .eq('is_active', true)
          .order('name');
        
        setPartnerships(allPartnerships || []);
        
        if (allPartnerships && allPartnerships.length > 0) {
          setSelectedPartnershipId(allPartnerships[0].id);
          setPartnership(allPartnerships[0]);
        }
      } else {
        const { data: partnershipData } = await supabase
          .from('partnerships')
          .select('*')
          .eq('id', profile.partnership_id)
          .single();

        setPartnership(partnershipData);
        setSelectedPartnershipId(partnershipData?.id || null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchInvitations = useCallback(async () => {
    if (!selectedPartnershipId) return;

    try {
      const { data: invitationsData } = await supabase
        .from('partnership_invitations')
        .select('*')
        .eq('partnership_id', selectedPartnershipId)
        .order('created_at', { ascending: false });

      setInvitations(invitationsData || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  }, [selectedPartnershipId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedPartnershipId) {
      fetchInvitations();
    }
  }, [selectedPartnershipId, fetchInvitations]);

  const handlePartnershipChange = (partnershipId: number) => {
    const selected = partnerships.find(p => p.id === partnershipId);
    setSelectedPartnershipId(partnershipId);
    setPartnership(selected || null);
  };

  const addInvitationRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnershipId || !newEmail) return;

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const { error } = await supabase
        .from('partnership_invitations')
        .insert([{
          partnership_id: selectedPartnershipId,
          intended_for_email: newEmail,
          expires_at: expiresAt.toISOString(),
        }]);

      if (error) throw error;

      setNewEmail('');
      setShowAddForm(false);
      await fetchInvitations();
    } catch (error) {
      console.error('Error adding invitation record:', error);
      alert('Failed to add invitation record');
    }
  };

  const deleteInvitation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return;

    try {
      const { error } = await supabase
        .from('partnership_invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchInvitations();
    } catch (error) {
      console.error('Error deleting invitation:', error);
    }
  };

  const sendSingleInvitation = async (invitationId: number) => {
    setSending(true);
    try {
      const response = await fetch('/api/partnership/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationIds: [invitationId] }),
      });

      if (!response.ok) throw new Error('Failed to send invitation');
      alert('Invitation sent successfully!');
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const sendBulkInvitations = async () => {
    if (selectedInvitations.length === 0) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/partnership/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationIds: selectedInvitations }),
      });

      if (!response.ok) throw new Error('Failed to send invitations');
      alert(`${selectedInvitations.length} invitations sent successfully!`);
      setSelectedInvitations([]);
    } catch (error) {
      console.error('Error sending bulk invitations:', error);
      alert('Failed to send invitations');
    } finally {
      setSending(false);
    }
  };

  const sendActivationConfirmations = async () => {
    if (selectedRedeemedInvitations.length === 0) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/partnership/invitations/activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationIds: selectedRedeemedInvitations }),
      });

      if (!response.ok) throw new Error('Failed to send activation confirmations');
      alert(`${selectedRedeemedInvitations.length} activation confirmations sent successfully!`);
      setSelectedRedeemedInvitations([]);
    } catch (error) {
      console.error('Error sending activation confirmations:', error);
      alert('Failed to send activation confirmations');
    } finally {
      setSending(false);
    }
  };

  const toggleInvitationSelection = (id: number) => {
    setSelectedInvitations(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleRedeemedInvitationSelection = (id: number) => {
    setSelectedRedeemedInvitations(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const selectAllInvitations = () => {
    const pendingInvitations = invitations
      .filter(inv => inv.status === 'pending')
      .map(inv => inv.id);
    setSelectedInvitations(pendingInvitations);
  };

  const selectAllRedeemedInvitations = () => {
    const redeemedInvitations = invitations
      .filter(inv => inv.status === 'redeemed')
      .map(inv => inv.id);
    setSelectedRedeemedInvitations(redeemedInvitations);
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div>
      {/* Partnership Selector for Admins */}
      {userProfile?.role === 'admin' && partnerships.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Partnership
          </label>
          <select
            value={selectedPartnershipId || ''}
            onChange={(e) => handlePartnershipChange(Number(e.target.value))}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a partnership...</option>
            {partnerships.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {partnership && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Partnership Benefits</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• {partnership.trial_duration_days}-day free trial with {partnership.trial_tier.toUpperCase()} access</li>
            {partnership.discount_percentage > 0 && (
              <li>• {partnership.discount_percentage}% discount after trial</li>
            )}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('records')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'records'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Invitation Records ({invitations.length})
          </button>
          <button
            onClick={() => setActiveTab('send')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'send'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Send Invitations
          </button>
          <button
            onClick={() => setActiveTab('activation')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'activation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Send Activation Confirmation
          </button>
        </nav>
      </div>

      {activeTab === 'records' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Invitation Records</h3>
            <button
              onClick={() => setShowAddForm(true)}
              disabled={!selectedPartnershipId}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={16} className="mr-2" />
              Add Record
            </button>
          </div>

          {showAddForm && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="text-md font-medium text-gray-900 mb-4">Add New Invitation Record</h4>
              
              <form onSubmit={addInvitationRecord} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expires in (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Add Record
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllInvitations();
                          selectAllRedeemedInvitations();
                        } else {
                          setSelectedInvitations([]);
                          setSelectedRedeemedInvitations([]);
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invitation.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={selectedInvitations.includes(invitation.id)}
                          onChange={() => toggleInvitationSelection(invitation.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      )}
                      {invitation.status === 'redeemed' && (
                        <input
                          type="checkbox"
                          checked={selectedRedeemedInvitations.includes(invitation.id)}
                          onChange={() => toggleRedeemedInvitationSelection(invitation.id)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invitation.intended_for_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        invitation.status === 'redeemed' ? 'bg-green-100 text-green-800' :
                        invitation.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {invitation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => sendSingleInvitation(invitation.id)}
                            disabled={sending}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            <Mail size={16} />
                          </button>
                          <button
                            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite/${invitation.token}`)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Copy Link
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'send' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Send Invitations</h3>
            <button
              onClick={sendBulkInvitations}
              disabled={selectedInvitations.length === 0 || sending}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Send size={16} className="mr-2" />
              Send Selected ({selectedInvitations.length})
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600 mb-4">
              Select invitation records from the &quot;Invitation Records&quot; tab to send emails. 
              You can send individual invitations or select multiple records for bulk sending.
            </p>
            <p className="text-sm text-gray-500">
              Currently selected: <strong>{selectedInvitations.length}</strong> invitations
            </p>
          </div>
        </div>
      )}

      {activeTab === 'activation' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Send Activation Confirmation</h3>
            <button
              onClick={sendActivationConfirmations}
              disabled={selectedRedeemedInvitations.length === 0 || sending}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Send size={16} className="mr-2" />
              Send Confirmations ({selectedRedeemedInvitations.length})
            </button>
          </div>

          <div className="bg-green-50 rounded-lg p-6 mb-6">
            <h4 className="text-sm font-medium text-green-900 mb-2">Activation Confirmation Emails</h4>
            <p className="text-green-800 mb-4">
              Send confirmation emails to users whose benefits have been manually activated. 
              This notifies them that their Pro features (dictation, pronunciation, and chat) are now available.
            </p>
            <p className="text-sm text-green-700">
              Select redeemed invitations from the &quot;Invitation Records&quot; tab to send activation confirmations.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600 mb-4">
              Use this feature when the normal invitation flow didn&apos;t complete properly and you&apos;ve manually 
              activated the user&apos;s benefits using the SQL script.
            </p>
            <p className="text-sm text-gray-500">
              Currently selected redeemed invitations: <strong>{selectedRedeemedInvitations.length}</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}