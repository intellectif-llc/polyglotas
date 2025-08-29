'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface Partnership {
  id: number;
  name: string;
  description?: string;
  trial_duration_days: number;
  trial_tier: 'free' | 'starter' | 'pro';
  discount_percentage: number;
  is_active: boolean;
}

export function PartnershipManagement() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPartnership, setEditingPartnership] = useState<Partnership | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trial_duration_days: 7,
    trial_tier: 'pro' as 'free' | 'starter' | 'pro',
    discount_percentage: 0,
    is_active: true,
  });

  const supabase = createSupabaseBrowserClient();

  const fetchPartnerships = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('partnerships')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartnerships(data || []);
    } catch (error) {
      console.error('Error fetching partnerships:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPartnerships();
  }, [fetchPartnerships]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPartnership) {
        const { error } = await supabase
          .from('partnerships')
          .update(formData)
          .eq('id', editingPartnership.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('partnerships')
          .insert([formData]);
        
        if (error) throw error;
      }

      await fetchPartnerships();
      resetForm();
    } catch (error) {
      console.error('Error saving partnership:', error);
    }
  };

  const deletePartnership = async (id: number) => {
    if (!confirm('Are you sure you want to delete this partnership?')) return;

    try {
      const { error } = await supabase
        .from('partnerships')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPartnerships();
    } catch (error) {
      console.error('Error deleting partnership:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trial_duration_days: 7,
      trial_tier: 'pro',
      discount_percentage: 0,
      is_active: true,
    });
    setEditingPartnership(null);
    setShowForm(false);
  };

  const startEdit = (partnership: Partnership) => {
    setFormData({
      name: partnership.name,
      description: partnership.description || '',
      trial_duration_days: partnership.trial_duration_days,
      trial_tier: partnership.trial_tier,
      discount_percentage: partnership.discount_percentage,
      is_active: partnership.is_active,
    });
    setEditingPartnership(partnership);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-center py-4">Loading partnerships...</div>;
  }

  return (
    <div>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Partnership Management
          </h3>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Create Partnership
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              {editingPartnership ? 'Edit Partnership' : 'Create New Partnership'}
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trial Duration (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.trial_duration_days}
                    onChange={(e) => setFormData({ ...formData, trial_duration_days: parseInt(e.target.value) })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trial Tier
                  </label>
                  <select
                    value={formData.trial_tier}
                    onChange={(e) => setFormData({ ...formData, trial_tier: e.target.value as 'free' | 'starter' | 'pro' })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {editingPartnership ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {partnerships.map((partnership) => (
                <tr key={partnership.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {partnership.name}
                      </div>
                      {partnership.description && (
                        <div className="text-sm text-gray-500">
                          {partnership.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {partnership.trial_duration_days} days ({partnership.trial_tier})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {partnership.discount_percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      partnership.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {partnership.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => startEdit(partnership)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePartnership(partnership.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}