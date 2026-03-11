import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertModal, { AlertState } from '../components/AlertModal';
import { getAllUsers, deleteUser, revokeUserAccess, grantUserAccess, UserDetails } from '../services/api';

const AdminUsers: React.FC<{ defaultFilter?: string }> = ({ defaultFilter }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string | null>(defaultFilter ?? null);
  const [patientFilter, setPatientFilter] = useState<'all' | 'revoked'>('all');
  const [clinicFilter, setClinicFilter] = useState<'approved' | 'revoked'>('approved');
  const [alert, setAlert] = useState<AlertState>({ isOpen: false, title: '', message: '', type: 'info' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!selectedUser?.id) return;
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    try {
      setActionLoading('delete');
      await deleteUser(selectedUser.id);
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setShowDetailsModal(false);
      setAlert({ isOpen: true, title: 'User Deleted', message: 'The user has been permanently deleted.', type: 'success' });
    } catch {
      setAlert({ isOpen: true, title: 'Error', message: 'Failed to delete user. Please try again.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async () => {
    if (!selectedUser?.id) return;
    if (!window.confirm('Are you sure you want to revoke access for this user?')) return;
    try {
      setActionLoading('revoke');
      await revokeUserAccess(selectedUser.id);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, isActive: false } : u));
      setShowDetailsModal(false);
      setAlert({ isOpen: true, title: 'Access Revoked', message: 'User access has been revoked.', type: 'success' });
    } catch {
      setAlert({ isOpen: true, title: 'Error', message: 'Failed to revoke access. Please try again.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleGrant = async () => {
    if (!selectedUser?.id) return;
    if (!window.confirm('Are you sure you want to grant access for this user?')) return;
    try {
      setActionLoading('grant');
      await grantUserAccess(selectedUser.id);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, isActive: true } : u));
      setShowDetailsModal(false);
      setAlert({ isOpen: true, title: 'Access Granted', message: 'User access has been granted.', type: 'success' });
    } catch {
      setAlert({ isOpen: true, title: 'Error', message: 'Failed to grant access. Please try again.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      navigate('/login');
      return;
    }

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [user, navigate]);

  if (!user) return null;

  const patientCount = users.filter(u => u.role === 'Patient').length;
  const revokedPatientCount = users.filter(u => u.role === 'Patient' && u.isActive === false).length;
  const clinicAdminCount = users.filter(u => u.role === 'Clinic Admin' && u.clinicStatus === 'approved').length;
  const revokedClinicAdminCount = users.filter(u => u.role === 'Clinic Admin' && u.clinicStatus === 'approved' && u.isActive === false).length;
  const filteredUsers = defaultFilter === 'Patient'
    ? users.filter(u => u.role === 'Patient' && (patientFilter === 'revoked' ? u.isActive === false : true))
    : defaultFilter === 'Clinic Admin'
    ? users.filter(u =>
        u.role === 'Clinic Admin' &&
        u.clinicStatus === 'approved' &&
        (clinicFilter === 'revoked' ? u.isActive === false : true)
      )
    : roleFilter === 'Clinic Admin'
    ? users.filter(u => u.role === 'Clinic Admin' && u.clinicStatus === 'approved')
    : roleFilter
    ? users.filter(u => u.role === roleFilter)
    : users;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          {defaultFilter === 'Patient' ? (
            <>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Patients</h1>
              <p className="text-gray-600">View all registered patients</p>
            </>
          ) : defaultFilter === 'Clinic Admin' ? (
            <>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Clinic Admins</h1>
              <p className="text-gray-600">View all approved clinic accounts</p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600">View all users and their account details</p>
            </>
          )}
        </div>

        {defaultFilter === 'Patient' ? (
          <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-2xl">
            <div className="bg-white rounded-lg shadow p-6 text-left border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">Total Patients</p>
              <p className="text-3xl font-bold text-green-600">{patientCount}</p>
            </div>
            <button
              onClick={() => setPatientFilter(prev => (prev === 'revoked' ? 'all' : 'revoked'))}
              className={`bg-white rounded-lg shadow p-6 text-left transition-all ${
                patientFilter === 'revoked' ? 'ring-2 ring-red-500' : 'hover:shadow-md'
              }`}
            >
              <p className="text-sm text-gray-600 mb-1">Revoked Patients</p>
              <p className="text-3xl font-bold text-red-600">{revokedPatientCount}</p>
            </button>
          </div>
        ) : defaultFilter === 'Clinic Admin' ? (
          <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-2xl">
            <div className="bg-white rounded-lg shadow p-6 text-left border border-gray-100">
              <p className="text-sm text-gray-600 mb-1">Total Clinics</p>
              <p className="text-3xl font-bold text-indigo-600">{clinicAdminCount}</p>
              <p className="text-xs text-gray-400 mt-1">Approved clinics only</p>
            </div>
            <button
              onClick={() => setClinicFilter(prev => (prev === 'revoked' ? 'approved' : 'revoked'))}
              className={`bg-white rounded-lg shadow p-6 text-left transition-all ${
                clinicFilter === 'revoked' ? 'ring-2 ring-red-500' : 'hover:shadow-md'
              }`}
            >
              <p className="text-sm text-gray-600 mb-1">Revoked Clinics</p>
              <p className="text-3xl font-bold text-red-600">{revokedClinicAdminCount}</p>
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-blue-600">{users.length}</p>
            </div>
            <button
              onClick={() => setRoleFilter(roleFilter === 'Patient' ? null : 'Patient')}
              className={`bg-white rounded-lg shadow p-6 text-left transition-all ${
                roleFilter === 'Patient' ? 'ring-2 ring-green-500' : 'hover:shadow-md'
              }`}
            >
              <p className="text-sm text-gray-600 mb-1">Patients</p>
              <p className="text-3xl font-bold text-green-600">{patientCount}</p>
            </button>
            <button
              onClick={() => setRoleFilter(roleFilter === 'Clinic Admin' ? null : 'Clinic Admin')}
              className={`bg-white rounded-lg shadow p-6 text-left transition-all ${
                roleFilter === 'Clinic Admin' ? 'ring-2 ring-indigo-500' : 'hover:shadow-md'
              }`}
            >
              <p className="text-sm text-gray-600 mb-1">Clinic Admins</p>
              <p className="text-3xl font-bold text-indigo-600">{clinicAdminCount}</p>
              <p className="text-xs text-gray-400 mt-1">Approved clinics only</p>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 mt-4">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">
              {defaultFilter === 'Patient' && patientFilter === 'revoked'
                ? 'No revoked patients found'
                : defaultFilter === 'Clinic Admin' && clinicFilter === 'revoked'
                ? 'No revoked clinics found'
                : 'No users found'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[25%]" />
                  <col className="w-[15%]" />
                  <col className="w-[12%]" />
                  <col className="w-[15%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Created</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, index) => (
                    <tr
                      key={u.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900 truncate">{u.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700 truncate">{u.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-700 truncate">{u.phone || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'Admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'Clinic Admin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowDetailsModal(true);
                          }}
                          className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-semibold"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">User Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-8 py-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold text-gray-900">{selectedUser.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold text-gray-900">{selectedUser.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-semibold text-gray-900">{selectedUser.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-semibold text-gray-900">{selectedUser.role || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">User ID</p>
                <p className="font-semibold text-gray-900 break-all">{selectedUser.id || '-'}</p>
              </div>
              {selectedUser.clinicId && (
                <div>
                  <p className="text-sm text-gray-500">Clinic ID</p>
                  <p className="font-semibold text-gray-900 break-all">{selectedUser.clinicId}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-semibold text-gray-900">
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : '-'}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex flex-row gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  disabled={actionLoading !== null}
                  className="flex-1 h-12 px-4 border border-gray-300 text-slate-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold text-base whitespace-nowrap disabled:opacity-50"
                >
                  Close
                </button>
                {(selectedUser?.role === 'Patient' || selectedUser?.role === 'Clinic Admin') && (
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading !== null}
                    className="flex-1 h-12 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold text-base whitespace-nowrap disabled:opacity-50"
                  >
                    {actionLoading === 'delete'
                      ? 'Deleting...'
                      : selectedUser?.role === 'Clinic Admin'
                      ? 'Delete Clinic Admin'
                      : 'Delete Patient'}
                  </button>
                )}
                {selectedUser?.role !== 'Admin' && (selectedUser?.isActive === false ? (
                  <button
                    onClick={handleGrant}
                    disabled={actionLoading !== null}
                    className="flex-1 h-12 px-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold text-base whitespace-nowrap disabled:opacity-50"
                  >
                    {actionLoading === 'grant' ? 'Granting...' : 'Grant Access'}
                  </button>
                ) : (
                  <button
                    onClick={handleRevoke}
                    disabled={actionLoading !== null}
                    className="flex-1 h-12 px-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-semibold text-base whitespace-nowrap disabled:opacity-50"
                  >
                    {actionLoading === 'revoke' ? 'Revoking...' : 'Revoke Access'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertModal state={alert} onClose={() => setAlert({ ...alert, isOpen: false })} />
    </div>
  );
};

export default AdminUsers;
