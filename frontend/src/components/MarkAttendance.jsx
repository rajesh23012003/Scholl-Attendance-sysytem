import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  HelpCircle, 
  Save, 
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  MessageSquare
} from 'lucide-react';
import WhatsAppAlertModal from './WhatsAppAlertModal';

export default function MarkAttendance({ classes, selectedClassId, onClassChange, showToast, refreshDashboard }) {
  const [classId, setClassId] = useState(selectedClassId || (classes[0] ? classes[0].id : 1));
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // Fetch attendance records when classId or date changes
  useEffect(() => {
    if (!classId) return;
    fetchAttendance();
  }, [classId, date]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?class_id=${classId}&date=${date}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data.records || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, newStatus) => {
    setRecords(prev => prev.map(r => {
      if (r.student_id === studentId) {
        return { ...r, status: newStatus };
      }
      return r;
    }));
  };

  const handleRemarkChange = (studentId, remarks) => {
    setRecords(prev => prev.map(r => {
      if (r.student_id === studentId) {
        return { ...r, remarks };
      }
      return r;
    }));
  };

  const handleMarkAll = (status) => {
    setRecords(prev => prev.map(r => ({ ...r, status })));
    showToast(`Marked all students as ${status}`, 'info');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        date,
        class_id: classId,
        records: records.map(r => ({
          student_id: r.student_id,
          status: r.status,
          remarks: r.remarks || ''
        }))
      };

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message || 'Attendance saved successfully!', 'success');
        fetchAttendance();
        if (refreshDashboard) refreshDashboard();
        if (absentCount > 0) {
          setIsAlertModalOpen(true);
        }
      } else {
        showToast(data.message || 'Failed to save attendance', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while saving attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Stats calculation
  const totalStudents = records.length;
  const presentCount = records.filter(r => r.status === 'Present').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;
  const lateCount = records.filter(r => r.status === 'Late').length;
  const excusedCount = records.filter(r => r.status === 'Excused').length;
  const attendanceRate = totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0;

  const currentClass = classes.find(c => c.id === Number(classId));

  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
    return fullName.includes(q) || r.roll_number.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Filter & Control Header */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '20px' 
        }}>
          {/* Class and Date selector */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="form-group" style={{ minWidth: '200px' }}>
              <label className="form-label">Select Class & Section</label>
              <select 
                className="form-select"
                value={classId}
                onChange={(e) => {
                  setClassId(Number(e.target.value));
                  if (onClassChange) onClassChange(Number(e.target.value));
                }}
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.section} ({c.student_count || 0} Students)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ minWidth: '180px' }}>
              <label className="form-label">Attendance Date</label>
              <input 
                type="date" 
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Info & Save Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {absentCount > 0 && (
              <button 
                type="button"
                className="btn btn-sm"
                style={{ 
                  background: '#ecfdf5', 
                  color: '#065f46', 
                  border: '1px solid #10b981', 
                  padding: '10px 16px',
                  fontWeight: 700 
                }}
                onClick={() => setIsAlertModalOpen(true)}
              >
                <MessageSquare size={16} color="#10b981" />
                WhatsApp Alerts ({absentCount})
              </button>
            )}

            <button 
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.95rem' }}
              onClick={handleSave}
              disabled={saving || loading || records.length === 0}
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>

        {/* Classroom Info Strip */}
        {currentClass && (
          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            fontSize: '0.88rem',
            color: 'var(--text-muted)'
          }}>
            <div>
              <strong>Class Teacher:</strong> {currentClass.class_teacher || 'Not Assigned'} &bull;{' '}
              <strong>Room:</strong> {currentClass.room_number || 'Main Building'}
            </div>
            <div>
              Status for <strong>{date}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Summary Pills Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px'
      }}>
        <div style={{
          background: '#ffffff',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Students</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{totalStudents}</span>
        </div>

        <div style={{
          background: '#ecfdf5',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #a7f3d0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 600 }}>Present</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#065f46' }}>{presentCount}</span>
        </div>

        <div style={{
          background: '#fef2f2',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #fecaca',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 600 }}>Absent</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#991b1b' }}>{absentCount}</span>
        </div>

        <div style={{
          background: '#fffbeb',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #fde68a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 600 }}>Late / Excused</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#92400e' }}>{lateCount + excusedCount}</span>
        </div>

        <div style={{
          background: '#eef2ff',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #c7d2fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.85rem', color: '#3730a3', fontWeight: 600 }}>Rate</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4f46e5' }}>{attendanceRate}%</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        {/* Table Header Action Bar */}
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          {/* Quick Mark Shortcuts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '4px' }}>
              Quick Actions:
            </span>
            <button 
              className="btn btn-sm"
              style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}
              onClick={() => handleMarkAll('Present')}
            >
              <CheckCircle size={14} />
              All Present
            </button>
            <button 
              className="btn btn-sm"
              style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
              onClick={() => handleMarkAll('Absent')}
            >
              <XCircle size={14} />
              All Absent
            </button>
          </div>

          {/* Student Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-input" 
                style={{ paddingLeft: '32px', width: '220px', height: '36px', fontSize: '0.85rem' }}
                placeholder="Search student or roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
            </div>
          </div>
        </div>

        {/* Attendance List */}
        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Loading students...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              No students found for this class.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Roll No</th>
                  <th>Student Name</th>
                  <th>Contact</th>
                  <th style={{ textAlign: 'center' }}>Attendance Status</th>
                  <th>Remarks (Optional)</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => {
                  return (
                    <tr key={r.student_id}>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          background: '#f1f5f9',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}>
                          #{r.roll_number}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="avatar-circle">
                            {r.first_name[0]}{r.last_name[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {r.first_name} {r.last_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                              {r.gender}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {r.parent_phone || '—'}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div className="status-btn-group">
                          <button
                            type="button"
                            className={`status-toggle-btn ${r.status === 'Present' ? 'active-present' : ''}`}
                            onClick={() => handleStatusChange(r.student_id, 'Present')}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            className={`status-toggle-btn ${r.status === 'Absent' ? 'active-absent' : ''}`}
                            onClick={() => handleStatusChange(r.student_id, 'Absent')}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            className={`status-toggle-btn ${r.status === 'Late' ? 'active-late' : ''}`}
                            onClick={() => handleStatusChange(r.student_id, 'Late')}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            className={`status-toggle-btn ${r.status === 'Excused' ? 'active-excused' : ''}`}
                            onClick={() => handleStatusChange(r.student_id, 'Excused')}
                          >
                            Excused
                          </button>
                        </div>
                      </td>

                      <td>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ padding: '6px 10px', fontSize: '0.82rem', width: '100%', maxWidth: '240px' }}
                          placeholder="e.g. Fever, Transport delay"
                          value={r.remarks || ''}
                          onChange={(e) => handleRemarkChange(r.student_id, e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer save reminder */}
        <div style={{
          padding: '16px 24px',
          background: '#f8fafc',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {filteredRecords.length} students &bull; Remember to click Save to record changes
          </span>
          <button 
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving || loading || records.length === 0}
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* WhatsApp Alerts Modal */}
      <WhatsAppAlertModal 
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        date={date}
        classId={classId}
        showToast={showToast}
      />

    </div>
  );
}
