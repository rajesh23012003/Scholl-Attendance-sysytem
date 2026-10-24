import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  Trash2, 
  MessageSquare,
  AlertCircle,
  Filter,
  Check,
  X
} from 'lucide-react';

export default function Leaves({ classes, showToast, refreshDashboard }) {
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Apply Leave Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    student_id: '',
    leave_type: 'Medical Leave',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
    applied_by: 'Parent'
  });

  // Action / Notes Modal
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    leave: null,
    status: 'Approved',
    notes: ''
  });

  useEffect(() => {
    fetchLeaves();
    fetchStats();
    fetchAllStudents();
  }, [statusFilter, classFilter]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      let url = '/api/leaves?';
      if (statusFilter) url += `status=${statusFilter}&`;
      if (classFilter) url += `class_id=${classFilter}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLeaves(data.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading leave applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/leaves/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      if (data.success) {
        setStudents(data.data || []);
        if (data.data.length > 0 && !formData.student_id) {
          setFormData(prev => ({ ...prev, student_id: data.data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!formData.student_id || !formData.reason) {
      showToast('Please select a student and provide a reason', 'error');
      return;
    }

    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        showToast('Leave request submitted successfully!', 'success');
        setIsModalOpen(false);
        setFormData({
          student_id: students[0] ? students[0].id : '',
          leave_type: 'Medical Leave',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          reason: '',
          applied_by: 'Parent'
        });
        fetchLeaves();
        fetchStats();
      } else {
        showToast(data.message || 'Submission failed', 'error');
      }
    } catch (err) {
      showToast('Error submitting leave request', 'error');
    }
  };

  const handleOpenActionModal = (leave, status) => {
    setActionModal({
      isOpen: true,
      leave,
      status,
      notes: status === 'Approved' ? 'Approved by Class Teacher' : 'Rejected due to upcoming examinations'
    });
  };

  const handleConfirmStatus = async () => {
    const { leave, status, notes } = actionModal;
    if (!leave) return;

    try {
      const res = await fetch(`/api/leaves/${leave.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, teacher_notes: notes })
      });
      const data = await res.json();

      if (data.success) {
        showToast(
          status === 'Approved' 
            ? 'Leave Approved! Attendance marked Excused for the date range.' 
            : 'Leave application marked as Rejected.', 
          'success'
        );
        setActionModal({ isOpen: false, leave: null, status: 'Approved', notes: '' });
        fetchLeaves();
        fetchStats();
        if (refreshDashboard) refreshDashboard();
      } else {
        showToast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      showToast('Network error while updating leave status', 'error');
    }
  };

  const handleDelete = async (leaveId) => {
    if (!window.confirm('Are you sure you want to delete this leave record?')) return;
    try {
      const res = await fetch(`/api/leaves/${leaveId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Leave application deleted', 'success');
        fetchLeaves();
        fetchStats();
      }
    } catch (err) {
      showToast('Failed to delete leave', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner & Stats */}
      <div style={{
        background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 30px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <span style={{ 
            background: 'rgba(255,255,255,0.2)', 
            padding: '4px 12px', 
            borderRadius: 'var(--radius-full)', 
            fontSize: '0.78rem', 
            fontWeight: 700 
          }}>
            📋 LEAVE MANAGEMENT PORTAL
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px' }}>
            Student Leave Requests & Approvals
          </h2>
          <p style={{ color: '#a7f3d0', fontSize: '0.9rem', marginTop: '4px' }}>
            Review, approve or reject leave applications submitted by parents or guardians.
          </p>
        </div>

        <button 
          className="btn" 
          style={{ background: '#ffffff', color: '#065f46', fontWeight: 700 }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} color="#059669" />
          Submit Leave Request
        </button>
      </div>

      {/* Stats Counter Bar */}
      <div className="stats-grid">
        <div 
          className="stat-card" 
          style={{ cursor: 'pointer', border: statusFilter === '' ? '2px solid var(--primary)' : '1px solid var(--border)' }}
          onClick={() => setStatusFilter('')}
        >
          <div className="stat-icon indigo">
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Requests</span>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-subtext">All submitted</span>
          </div>
        </div>

        <div 
          className="stat-card"
          style={{ cursor: 'pointer', border: statusFilter === 'Pending' ? '2px solid #f59e0b' : '1px solid var(--border)' }}
          onClick={() => setStatusFilter('Pending')}
        >
          <div className="stat-icon amber">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending Approval</span>
            <span className="stat-value" style={{ color: '#d97706' }}>{stats.pending}</span>
            <span className="stat-subtext">Requires teacher review</span>
          </div>
        </div>

        <div 
          className="stat-card"
          style={{ cursor: 'pointer', border: statusFilter === 'Approved' ? '2px solid #10b981' : '1px solid var(--border)' }}
          onClick={() => setStatusFilter('Approved')}
        >
          <div className="stat-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Approved</span>
            <span className="stat-value" style={{ color: '#059669' }}>{stats.approved}</span>
            <span className="stat-subtext">Excused in register</span>
          </div>
        </div>

        <div 
          className="stat-card"
          style={{ cursor: 'pointer', border: statusFilter === 'Rejected' ? '2px solid #ef4444' : '1px solid var(--border)' }}
          onClick={() => setStatusFilter('Rejected')}
        >
          <div className="stat-icon red">
            <XCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Rejected</span>
            <span className="stat-value" style={{ color: '#dc2626' }}>{stats.rejected}</span>
            <span className="stat-subtext">Declined requests</span>
          </div>
        </div>
      </div>

      {/* Filter and Content Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Filter by Status:
            </span>
            <button 
              className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('')}
            >
              All ({stats.total})
            </button>
            <button 
              className={`btn btn-sm ${statusFilter === 'Pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('Pending')}
            >
              Pending ({stats.pending})
            </button>
            <button 
              className={`btn btn-sm ${statusFilter === 'Approved' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('Approved')}
            >
              Approved ({stats.approved})
            </button>
            <button 
              className={`btn btn-sm ${statusFilter === 'Rejected' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('Rejected')}
            >
              Rejected ({stats.rejected})
            </button>
          </div>

          <div style={{ minWidth: '180px' }}>
            <select 
              className="form-select"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              style={{ height: '36px', fontSize: '0.85rem' }}
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.section}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Leave Requests Table */}
        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Loading leave requests...
            </div>
          ) : leaves.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              No leave applications matching the selected criteria.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Roll No</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Leave Type</th>
                  <th>Duration / Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => {
                  let badgeClass = 'badge-late';
                  if (l.status === 'Approved') badgeClass = 'badge-present';
                  if (l.status === 'Rejected') badgeClass = 'badge-absent';

                  return (
                    <tr key={l.id}>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          background: '#f1f5f9',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}>
                          #{l.roll_number}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {l.student_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          By: {l.applied_by} {l.parent_phone ? `(${l.parent_phone})` : ''}
                        </div>
                      </td>

                      <td>
                        <span style={{
                          background: '#eef2ff',
                          color: '#4338ca',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          fontWeight: 600
                        }}>
                          {l.class_label}
                        </span>
                      </td>

                      <td>
                        <span style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          fontWeight: 600
                        }}>
                          {l.leave_type}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {l.start_date === l.end_date ? l.start_date : `${l.start_date} to ${l.end_date}`}
                        </div>
                      </td>

                      <td style={{ maxWidth: '280px' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {l.reason}
                        </div>
                        {l.teacher_notes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                            Note: "{l.teacher_notes}"
                          </div>
                        )}
                      </td>

                      <td>
                        <span className={`badge ${badgeClass}`}>
                          {l.status}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {l.status === 'Pending' ? (
                            <>
                              <button 
                                className="btn btn-sm"
                                style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}
                                title="Approve Leave"
                                onClick={() => handleOpenActionModal(l, 'Approved')}
                              >
                                <Check size={14} />
                                Approve
                              </button>
                              <button 
                                className="btn btn-sm"
                                style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
                                title="Reject Leave"
                                onClick={() => handleOpenActionModal(l, 'Rejected')}
                              >
                                <X size={14} />
                                Reject
                              </button>
                            </>
                          ) : (
                            <button 
                              className="btn btn-secondary btn-sm"
                              title="Update Status"
                              onClick={() => handleOpenActionModal(l, l.status === 'Approved' ? 'Rejected' : 'Approved')}
                            >
                              Change
                            </button>
                          )}

                          <button 
                            className="btn btn-sm"
                            style={{ background: '#fff', border: '1px solid var(--border)', color: '#94a3b8' }}
                            title="Delete Request"
                            onClick={() => handleDelete(l.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Submit Student Leave Application</h3>
              <button 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitLeave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Select Student *</label>
                  <select 
                    className="form-select"
                    required
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: Number(e.target.value) })}
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} (#{s.roll_number} - {s.class_label})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Leave Type *</label>
                    <select 
                      className="form-select"
                      value={formData.leave_type}
                      onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                    >
                      <option value="Medical Leave">Medical Leave</option>
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Family Emergency">Family Emergency</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Applied By</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Parent / Self"
                      value={formData.applied_by}
                      onChange={(e) => setFormData({ ...formData, applied_by: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input 
                      type="date" 
                      required
                      className="form-input" 
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input 
                      type="date" 
                      required
                      className="form-input" 
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Absence *</label>
                  <textarea 
                    required
                    className="form-input"
                    rows="3"
                    placeholder="Provide details about the absence (e.g. Doctor recommendation, fever, family visit)..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review / Note Modal */}
      {actionModal.isOpen && (
        <div className="modal-overlay" onClick={() => setActionModal({ isOpen: false, leave: null, status: 'Approved', notes: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {actionModal.status === 'Approved' ? '✅ Approve Leave Request' : '❌ Reject Leave Request'}
              </h3>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Student: <strong>{actionModal.leave ? actionModal.leave.student_name : ''}</strong> ({actionModal.leave ? actionModal.leave.class_label : ''})
              </p>
              
              {actionModal.status === 'Approved' && (
                <div style={{
                  background: '#ecfdf5',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #a7f3d0',
                  fontSize: '0.85rem',
                  color: '#065f46'
                }}>
                  ✨ <strong>Auto Excused:</strong> Approving this leave will automatically update the attendance register to <strong>"Excused"</strong> for the requested dates!
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Teacher / Principal Review Note (Optional)</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. Approved. Please complete missed homework upon return."
                  value={actionModal.notes}
                  onChange={(e) => setActionModal({ ...actionModal, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setActionModal({ isOpen: false, leave: null, status: 'Approved', notes: '' })}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={`btn ${actionModal.status === 'Approved' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleConfirmStatus}
              >
                Confirm {actionModal.status}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
