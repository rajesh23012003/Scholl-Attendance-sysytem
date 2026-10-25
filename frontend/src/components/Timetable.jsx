import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Plus, 
  Printer, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  GraduationCap, 
  Layers,
  MapPin,
  X
} from 'lucide-react';

export default function Timetable({ classes = [], showToast }) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState({
    day_of_week: 'Monday',
    period_number: 1,
    start_time: '08:30 AM',
    end_time: '09:15 AM',
    subject: 'Mathematics',
    teacher_name: '',
    room_number: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6];

  const defaultTimeSlots = {
    1: { start: '08:30 AM', end: '09:15 AM' },
    2: { start: '09:15 AM', end: '10:00 AM' },
    3: { start: '10:00 AM', end: '10:45 AM' },
    4: { start: '11:15 AM', end: '12:00 PM' },
    5: { start: '12:00 PM', end: '12:45 PM' },
    6: { start: '12:45 PM', end: '01:30 PM' }
  };

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes]);

  useEffect(() => {
    if (selectedClassId) {
      fetchTimetable(selectedClassId);
    }
  }, [selectedClassId]);

  const fetchTimetable = async (classId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/timetable?class_id=${classId}`);
      const data = await res.json();
      if (data.success) {
        setSchedule(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSlot = (day, periodNum) => {
    return schedule.find(s => s.day_of_week === day && s.period_number === periodNum);
  };

  const getSubjectColor = (subject) => {
    if (!subject) return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' };
    const s = subject.toLowerCase();
    if (s.includes('math')) return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
    if (s.includes('sci') || s.includes('phys') || s.includes('chem') || s.includes('bio')) return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
    if (s.includes('eng')) return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
    if (s.includes('soc') || s.includes('hist')) return { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' };
    if (s.includes('comp')) return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
    if (s.includes('sport') || s.includes('phys ed')) return { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3' };
    return { bg: '#f8fafc', text: '#334155', border: '#e2e8f0' };
  };

  const openSlotEditor = (day, periodNum) => {
    const existing = getSlot(day, periodNum);
    const times = defaultTimeSlots[periodNum] || { start: '08:30 AM', end: '09:15 AM' };
    const currentClass = classes.find(c => String(c.id) === String(selectedClassId));

    if (existing) {
      setCurrentSlot({
        id: existing.id,
        day_of_week: existing.day_of_week,
        period_number: existing.period_number,
        start_time: existing.start_time,
        end_time: existing.end_time,
        subject: existing.subject,
        teacher_name: existing.teacher_name,
        room_number: existing.room_number || currentClass?.room_number || ''
      });
    } else {
      setCurrentSlot({
        day_of_week: day,
        period_number: periodNum,
        start_time: times.start,
        end_time: times.end,
        subject: 'Mathematics',
        teacher_name: currentClass?.class_teacher || '',
        room_number: currentClass?.room_number || ''
      });
    }
    setIsEditModalOpen(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentSlot,
          class_id: selectedClassId
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Timetable slot saved successfully!', 'success');
        setIsEditModalOpen(false);
        fetchTimetable(selectedClassId);
      } else {
        showToast(data.message || 'Error saving slot', 'danger');
      }
    } catch (err) {
      showToast('Server connection error', 'danger');
    }
  };

  const currentClassObj = classes.find(c => String(c.id) === String(selectedClassId));

  return (
    <div className="timetable-container">
      {/* Top Header */}
      <div className="header-actions no-print" style={{ marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={24} color="var(--primary)" />
            Class Timetable & Period Schedule
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Manage daily academic schedules, periods timing, assigned subject teachers, and classroom allocations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={16} />
            <span>Print Timetable</span>
          </button>
        </div>
      </div>

      {/* Class Selector Bar */}
      <div className="filter-card no-print" style={{ 
        background: 'var(--bg-card)', 
        padding: '16px 20px', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--border)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Select Classroom
            </label>
            <select 
              className="class-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              style={{ minWidth: '200px' }}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.section} ({c.room_number || 'Room'})
                </option>
              ))}
            </select>
          </div>

          {currentClassObj && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', paddingTop: '18px' }}>
              Class Teacher: <strong style={{ color: 'var(--text-main)' }}>{currentClassObj.class_teacher}</strong>
            </div>
          )}
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Click any period card below to customize or reassign teacher.
        </div>
      </div>

      {/* Printable Schedule Area */}
      <div className="printable-timetable-area">
        {/* Printable Header only shown in print */}
        <div className="print-only-header" style={{ display: 'none', marginBottom: '16px', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1e1b4b' }}>VIDYA MANDIR SR. SEC. SCHOOL</h2>
          <div style={{ fontSize: '0.9rem', color: '#4338ca', fontWeight: 700 }}>
            Official Class Timetable (2026-2027) — {currentClassObj?.name} Section {currentClassObj?.section}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Class Teacher: {currentClassObj?.class_teacher} • Room: {currentClassObj?.room_number}
          </div>
        </div>

        {/* Timetable Weekly Matrix Table */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          overflowX: 'auto',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '14px 16px', width: '120px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Day / Period
                </th>
                {periods.map(p => (
                  <th key={p} style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)', textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
                    <div>Period {p}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-light)', marginTop: '2px' }}>
                      {defaultTimeSlots[p].start} - {defaultTimeSlots[p].end}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, idx) => (
                <tr key={day} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '16px', fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)', background: '#f8fafc' }}>
                    {day}
                  </td>
                  {periods.map(p => {
                    const slot = getSlot(day, p);
                    const colors = getSubjectColor(slot?.subject);

                    return (
                      <td 
                        key={p} 
                        style={{ padding: '10px', borderLeft: '1px solid var(--border)', verticalAlign: 'top', minWidth: '130px' }}
                        onClick={() => openSlotEditor(day, p)}
                      >
                        {slot ? (
                          <div style={{
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 10px 8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: colors.text, marginBottom: '4px' }}>
                              {slot.subject}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: '#475569', fontWeight: 600 }}>
                              {slot.teacher_name || 'Teacher'}
                            </div>
                            <div style={{ fontSize: '0.67rem', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <MapPin size={10} />
                              <span>{slot.room_number || 'Room'}</span>
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            height: '75px',
                            border: '1px dashed #cbd5e1',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--text-light)',
                            fontSize: '0.75rem'
                          }}>
                            + Add
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Slot Modal */}
      {isEditModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--primary)" />
                Schedule Period {currentSlot.period_number} ({currentSlot.day_of_week})
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSlot}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label>Start Time</label>
                  <input 
                    type="text" 
                    className="search-input" 
                    value={currentSlot.start_time}
                    onChange={(e) => setCurrentSlot({ ...currentSlot, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input 
                    type="text" 
                    className="search-input" 
                    value={currentSlot.end_time}
                    onChange={(e) => setCurrentSlot({ ...currentSlot, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Subject</label>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="e.g. Mathematics, Science Lab, English"
                  value={currentSlot.subject}
                  onChange={(e) => setCurrentSlot({ ...currentSlot, subject: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Assigned Teacher</label>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="e.g. Mrs. Sunita Sharma"
                  value={currentSlot.teacher_name}
                  onChange={(e) => setCurrentSlot({ ...currentSlot, teacher_name: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Room / Lab Number</label>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="e.g. Room 101 / Physics Lab"
                  value={currentSlot.room_number}
                  onChange={(e) => setCurrentSlot({ ...currentSlot, room_number: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Save Schedule Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Specific CSS for Timetable */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-timetable-area, .printable-timetable-area * {
            visibility: visible;
          }
          .printable-timetable-area {
            position: absolute;
            left: 0;
            top: 20px;
            width: 100%;
          }
          .print-only-header {
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
