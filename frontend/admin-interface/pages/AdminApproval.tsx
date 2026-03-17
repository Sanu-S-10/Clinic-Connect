import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertModal, { AlertState } from '../components/AlertModal';
import { getPendingClinics, getApprovedClinics, getRejectedClinics, approveClinicRegistration, rejectClinicRegistration, revokeClinicApproval, deleteClinic, ClinicRegistration } from '../services/api';

const AdminApproval: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const [pendingClinics, setPendingClinics] = useState<ClinicRegistration[]>([]);
  const [approvedClinics, setApprovedClinics] = useState<ClinicRegistration[]>([]);
  const [rejectedClinics, setRejectedClinics] = useState<ClinicRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<ClinicRegistration | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [alert, setAlert] = useState<AlertState>({ isOpen: false, title: '', message: '', type: 'info' });

  // Load pending clinics
  useEffect(() => {
    console.log('[AdminApproval] User:', user); // Debug
    if (user && user.role === 'Admin') {
      loadClinics();
    }
  }, [user]);

  const loadClinics = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[AdminApproval] Loading clinics...'); // Debug
      const [pending, approved, rejected] = await Promise.all([
        getPendingClinics(),
        getApprovedClinics(),
        getRejectedClinics()
      ]);
      console.log('[AdminApproval] Pending clinics:', pending, 'Approved clinics:', approved, 'Rejected clinics:', rejected); // Debug
      setPendingClinics(pending);
      setApprovedClinics(approved);
      setRejectedClinics(rejected);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load clinics';
      console.error('[AdminApproval] Error loading clinics:', errorMsg); // Debug
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (clinicId: string) => {
    try {
      setActionLoading(true);
      await approveClinicRegistration(clinicId);
      setPendingClinics(prev => prev.filter(c => c.id !== clinicId));
      setShowDetailModal(false);
      setSelectedClinic(null);
    } catch (err) {
      setAlert({ isOpen: true, title: 'Error', message: err instanceof Error ? err.message : 'Failed to approve clinic', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedClinic) return;

    try {
      setActionLoading(true);
      await rejectClinicRegistration(selectedClinic.id || '', rejectReason);
      setPendingClinics(prev => prev.filter(c => c.id !== selectedClinic.id));
      setRejectedClinics(prev => [
        {
          ...selectedClinic,
          status: 'rejected',
          rejectionReason: rejectReason || 'No reason provided',
          updatedAt: new Date()
        },
        ...prev
      ]);
      setShowRejectModal(false);
      setShowDetailModal(false);
      setSelectedClinic(null);
      setRejectReason('');
    } catch (err) {
      setAlert({ isOpen: true, title: 'Error', message: err instanceof Error ? err.message : 'Failed to reject clinic', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedClinic) return;

    try {
      setActionLoading(true);
      await revokeClinicApproval(selectedClinic.id || '', revokeReason);
      setApprovedClinics(prev => prev.filter(c => c.id !== selectedClinic.id));
      setPendingClinics(prev => [
        {
          ...selectedClinic,
          status: 'pending',
          approvedAt: undefined,
          updatedAt: new Date()
        },
        ...prev
      ]);
      setShowRevokeModal(false);
      setShowDetailModal(false);
      setSelectedClinic(null);
      setRevokeReason('');
    } catch (err) {
      setAlert({ isOpen: true, title: 'Error', message: err instanceof Error ? err.message : 'Failed to revoke clinic approval', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClinic) return;

    try {
      setActionLoading(true);
      await deleteClinic(selectedClinic.id || '', deleteReason);
      setPendingClinics(prev => prev.filter(c => c.id !== selectedClinic.id));
      setApprovedClinics(prev => prev.filter(c => c.id !== selectedClinic.id));
      setRejectedClinics(prev => prev.filter(c => c.id !== selectedClinic.id));
      setShowDeleteModal(false);
      setShowDetailModal(false);
      setSelectedClinic(null);
      setDeleteReason('');
    } catch (err) {
      setAlert({ isOpen: true, title: 'Error', message: err instanceof Error ? err.message : 'Failed to delete clinic', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredClinics =
    tab === 'pending'
      ? pendingClinics
      : tab === 'approved'
      ? approvedClinics
      : rejectedClinics;

  const emptyStateMessage =
    tab === 'pending'
      ? 'No pending clinic registrations at this time'
      : tab === 'approved'
      ? 'No approved clinics at this time'
      : 'No rejected clinics at this time';

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Clinic Registration Approvals</h1>
          <p className="text-gray-600">Review and manage pending clinic registration requests</p>

        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Pending Approvals</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingClinics.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Approved Clinics</p>
            <p className="text-3xl font-bold text-green-600">{approvedClinics.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Rejected Clinics</p>
            <p className="text-3xl font-bold text-red-600">{rejectedClinics.length}</p>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">Last Updated: {new Date().toLocaleDateString()}</p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setTab('pending')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              tab === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Pending ({pendingClinics.length})
          </button>
          <button
            onClick={() => setTab('approved')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              tab === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Approved ({approvedClinics.length})
          </button>
          <button
            onClick={() => setTab('rejected')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              tab === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Rejected ({rejectedClinics.length})
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 mt-4">Loading clinics...</p>
          </div>
        ) : filteredClinics.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600">{emptyStateMessage}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Clinic Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClinics.map((clinic, index) => (
                    <tr
                      key={clinic.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{clinic.name}</p>
                          <p className="text-xs text-gray-500">{new Date(clinic.createdAt || '').toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{clinic.email}</td>
                      <td className="px-6 py-4 text-gray-700">{clinic.phone}</td>
                      <td className="px-6 py-4 text-gray-700">{clinic.location}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          clinic.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : clinic.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {clinic.status.charAt(0).toUpperCase() + clinic.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedClinic(clinic);
                            setShowDetailModal(true);
                          }}
                          className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-semibold"
                        >
                          Review
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

      {/* Detail Modal */}
      {showDetailModal && selectedClinic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white sticky top-0">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{selectedClinic.name}</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-blue-100 mt-1">Registration Details</p>
            </div>

            {/* Modal Content */}
            <div className="px-8 py-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Basic Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Clinic Name</p>
                    <p className="font-semibold text-gray-900">{selectedClinic.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="font-semibold text-gray-900">{selectedClinic.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="font-semibold text-gray-900">{selectedClinic.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <p className="font-semibold text-gray-900">{selectedClinic.location}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Address
                </h3>
                <p className="text-gray-900">{selectedClinic.address}</p>
              </div>

              {/* Specialties */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Specialties
                </h3>
                {selectedClinic.specialties && selectedClinic.specialties.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedClinic.specialties.map((specialty, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold">
                        {specialty}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No specialties specified</p>
                )}
              </div>

              {/* Registration Info */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Registration Details
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Registration Date</p>
                    <p className="font-semibold text-gray-900">{new Date(selectedClinic.createdAt || '').toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <p className={`font-semibold ${
                      selectedClinic.status === 'pending'
                        ? 'text-yellow-600'
                        : selectedClinic.status === 'approved'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {selectedClinic.status.charAt(0).toUpperCase() + selectedClinic.status.slice(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Approval Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Once approved, this clinic will be able to log in and start managing their doctors and appointments.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Close
              </button>
              {tab === 'pending' ? (
                <>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-semibold disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedClinic.id || '')}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                </>
              ) : tab === 'approved' ? (
                <>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
                  >
                    Delete Clinic
                  </button>
                  <button
                    onClick={() => setShowRevokeModal(true)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50"
                  >
                    Revoke Approval
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
                >
                  Delete Clinic
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedClinic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="bg-red-50 px-8 py-6 border-b border-red-200">
              <h2 className="text-2xl font-bold text-red-600">Reject Registration?</h2>
              <p className="text-red-700 mt-1">Provide a reason for rejection (optional)</p>
            </div>

            <div className="px-8 py-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to reject <strong>{selectedClinic.name}</strong>'s registration?
              </p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason (optional)"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none resize-none"
              />
            </div>

            <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Approval Modal */}
      {showRevokeModal && selectedClinic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="bg-orange-50 px-8 py-6 border-b border-orange-200">
              <h2 className="text-2xl font-bold text-orange-600">Revoke Approval?</h2>
              <p className="text-orange-700 mt-1">Provide a reason for revocation (optional)</p>
            </div>

            <div className="px-8 py-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to revoke approval for <strong>{selectedClinic.name}</strong>? They will no longer be able to log in.
              </p>
              <textarea
                value={revokeReason}
                onChange={e => setRevokeReason(e.target.value)}
                placeholder="Enter revocation reason (optional)"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:outline-none resize-none"
              />
            </div>

            <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowRevokeModal(false);
                  setRevokeReason('');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50"
              >
                {actionLoading ? 'Revoking...' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Clinic Modal */}
      {showDeleteModal && selectedClinic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="bg-red-50 px-8 py-6 border-b border-red-200">
              <h2 className="text-2xl font-bold text-red-600">Delete Clinic?</h2>
              <p className="text-red-700 mt-1">This action cannot be undone</p>
            </div>

            <div className="px-8 py-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>{selectedClinic.name}</strong>? This will also delete the clinic admin account and all associated data.
              </p>
              <textarea
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Enter deletion reason (optional)"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:outline-none resize-none"
              />
            </div>

            <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      <AlertModal state={alert} onClose={() => setAlert({ ...alert, isOpen: false })} />
    </div>
  );
};

export default AdminApproval;
