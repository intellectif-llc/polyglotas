'use client';

import { useState } from 'react';
import { UserManagement } from '@/components/admin/UserManagement';
import { PartnershipManagement } from '@/components/admin/PartnershipManagement';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'partnerships'>('users');

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage users and partnerships</p>
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('partnerships')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'partnerships'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Partnership Management
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'partnerships' && <PartnershipManagement />}
      </div>
    </div>
  );
}