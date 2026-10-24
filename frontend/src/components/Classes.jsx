import React, { useState } from 'react';
import { GraduationCap, Plus, Users, DoorOpen, User, CheckCircle } from 'lucide-react';

export default function Classes({ classes, onSelectClassForAttendance, onNavigate, showToast, refreshClasses }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Class 11',
    section: 'A',
    room_number: 'Room 301',
    class_teacher: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.section) {
      showToast('Class name and section are required', 'error');
      return;
    }

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Class created successfully!', 'success');
        setIsModalOpen(false);
        if (refreshClasses) refreshClasses();
      } else {
        showToast(data.message || 'Failed to create class', 'error');
      }
    } catch (err) {
      showToast('Error creating class', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Classes & Sections
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Manage classroom departments, assigned class teachers, and room numbers.
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            Add New Class
          </button>
        </div>
      </div>

      {/* Class Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {classes.map(c => (
          <div key={c.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: '#eef2ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GraduationCap size={24} />
              </div>
              <span className="badge" style={{ background: '#f1f5f9', color: 'var(--text-muted)' }}>
                {c.student_count || 0} Students
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {c.name} - {c.section}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={14} color="var(--primary)" />
                  <span>Teacher: <strong>{c.class_teacher || 'Not Assigned'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DoorOpen size={14} color="var(--primary)" />
                  <span>Room: {c.room_number || 'Main Wing'}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <button 
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                onClick={() => {
                  if (onSelectClassForAttendance) onSelectClassForAttendance(c.id);
                  onNavigate('attendance');
                }}
              >
                <CheckCircle size={14} />
                Mark Attendance
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Class Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Add New Class / Section</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Class Name *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="e.g. Class 11 or Grade 6"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Section *</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="e.g. A, B, or Science"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Room Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Room 302"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Class Teacher Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Mr. Sanjay Sharma"
                    value={formData.class_teacher}
                    onChange={(e) => setFormData({ ...formData, class_teacher: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
