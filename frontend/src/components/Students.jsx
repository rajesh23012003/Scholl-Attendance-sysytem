import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Phone, 
  Mail, 
  GraduationCap 
} from 'lucide-react';

export default function Students({ classes, showToast, refreshDashboard }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    roll_number: '',
    first_name: '',
    last_name: '',
    gender: 'Male',
    class_id: classes[0] ? classes[0].id : 1,
    parent_name: '',
    parent_phone: '',
    email: '',
    dob: '',
    address: ''
  });

  useEffect(() => {
    fetchStudents();
  }, [selectedClassId, searchQuery]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = '/api/students?';
      if (selectedClassId) url += `class_id=${selectedClassId}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormData({
      roll_number: String(students.length + 1).padStart(2, '0'),
      first_name: '',
      last_name: '',
      gender: 'Male',
      class_id: selectedClassId || (classes[0] ? classes[0].id : 1),
      parent_name: '',
      parent_phone: '',
      email: '',
      dob: '',
      address: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      roll_number: student.roll_number,
      first_name: student.first_name,
      last_name: student.last_name,
      gender: student.gender,
      class_id: student.class_id,
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      email: student.email || '',
      dob: student.dob || '',
      address: student.address || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.roll_number) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const isEdit = Boolean(editingStudent);
      const url = isEdit ? `/api/students/${editingStudent.id}` : '/api/students';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        showToast(isEdit ? 'Student updated!' : 'Student registered successfully!', 'success');
        setIsModalOpen(false);
        fetchStudents();
        if (refreshDashboard) refreshDashboard();
      } else {
        showToast(data.message || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error while saving student', 'error');
    }
  };

  const handleDelete = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete ${studentName}? All attendance history for this student will also be removed.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/students/${studentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Student deleted successfully', 'success');
        fetchStudents();
        if (refreshDashboard) refreshDashboard();
      }
    } catch (err) {
      showToast('Failed to delete student', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header and Controls */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Student Directory
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Manage enrolled students, attendance profiles, and parent contacts.
            </p>
          </div>

          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <UserPlus size={18} />
            Register New Student
          </button>
        </div>

        {/* Filter bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border)',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input 
              type="text"
              className="form-input"
              style={{ paddingLeft: '34px', width: '100%' }}
              placeholder="Search by student name, roll no, or parent phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
          </div>

          <div style={{ minWidth: '200px' }}>
            <select 
              className="form-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.section}
                </option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Total: <strong>{students.length}</strong> students
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Loading students directory...
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              No students found. Click "Register New Student" to add one!
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Roll No</th>
                  <th>Student Info</th>
                  <th>Class</th>
                  <th>Parent / Guardian</th>
                  <th>Contact</th>
                  <th style={{ textAlign: 'center' }}>Attendance Rate</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const rate = s.attendance_rate !== null ? s.attendance_rate : 100;
                  return (
                    <tr key={s.id}>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          background: '#f1f5f9',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}>
                          #{s.roll_number}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="avatar-circle">
                            {s.first_name[0]}{s.last_name[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {s.first_name} {s.last_name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                              {s.gender} {s.dob ? `&bull; DOB: ${s.dob}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{
                          background: '#eef2ff',
                          color: '#4338ca',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}>
                          {s.class_label}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.85rem' }}>
                        {s.parent_name || '—'}
                      </td>

                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {s.parent_phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={13} color="var(--primary)" />
                            {s.parent_phone}
                          </div>
                        ) : '—'}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            color: rate >= 80 ? '#10b981' : rate >= 70 ? '#f59e0b' : '#ef4444'
                          }}>
                            {rate}%
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
                            {s.attended_days || 0}/{s.total_marked_days || 0} days
                          </span>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            title="Edit Student"
                            onClick={() => handleOpenEditModal(s)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            className="btn btn-sm"
                            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
                            title="Delete Student"
                            onClick={() => handleDelete(s.id, `${s.first_name} ${s.last_name}`)}
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

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {editingStudent ? 'Edit Student Details' : 'Register New Student'}
              </h3>
              <button 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input 
                      type="text" 
                      required
                      className="form-input" 
                      placeholder="e.g. Rahul"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input 
                      type="text" 
                      required
                      className="form-input" 
                      placeholder="e.g. Sharma"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Roll Number *</label>
                    <input 
                      type="text" 
                      required
                      className="form-input" 
                      placeholder="e.g. 05"
                      value={formData.roll_number}
                      onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Class & Section *</label>
                    <select 
                      className="form-select"
                      value={formData.class_id}
                      onChange={(e) => setFormData({ ...formData, class_id: Number(e.target.value) })}
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} - {c.section}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select 
                      className="form-select"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Parent / Guardian Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Manoj Sharma"
                      value={formData.parent_name}
                      onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Parent Phone Number</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      placeholder="+91 9876543210"
                      value={formData.parent_phone}
                      onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address (Optional)</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="student@school.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Sector / Area, City"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStudent ? 'Update Student' : 'Save & Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
