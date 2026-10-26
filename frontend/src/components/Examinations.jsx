import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Printer, 
  Search, 
  Filter, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  School, 
  User, 
  X, 
  Edit3, 
  Trophy, 
  BookOpen, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function Examinations({ classes = [], showToast }) {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [reportCardData, setReportCardData] = useState(null);
  const [reportCardLoading, setReportCardLoading] = useState(false);

  const [isMarksEntryOpen, setIsMarksEntryOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [marksForm, setMarksForm] = useState({
    subject: 'Mathematics',
    theory_marks: 70,
    practical_marks: 18,
    remarks: 'Consistent performance'
  });

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes]);

  useEffect(() => {
    if (selectedExamId && selectedClassId) {
      fetchClassExamData(selectedExamId, selectedClassId);
    }
  }, [selectedExamId, selectedClassId]);

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setExams(data.data);
        setSelectedExamId(data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load exams:', err);
    }
  };

  const fetchClassExamData = async (examId, classId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exams/${examId}/classes/${classId}`);
      const data = await res.json();
      if (data.success) {
        setExamData(data.data);
      }
    } catch (err) {
      console.error('Failed to load class exam data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReportCard = async (studentId) => {
    setReportCardLoading(true);
    setIsReportCardOpen(true);
    try {
      const res = await fetch(`/api/reports/report-card?exam_id=${selectedExamId}&student_id=${studentId}`);
      const data = await res.json();
      if (data.success) {
        setReportCardData(data.data);
      } else {
        showToast(data.message || 'Report card not found', 'danger');
        setIsReportCardOpen(false);
      }
    } catch (err) {
      showToast('Error loading report card', 'danger');
      setIsReportCardOpen(false);
    } finally {
      setReportCardLoading(false);
    }
  };

  const handleOpenMarksEntry = (student) => {
    setEditingStudent(student);
    setIsMarksEntryOpen(true);
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const res = await fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: selectedExamId,
          student_id: editingStudent.student_id,
          class_id: selectedClassId,
          ...marksForm
        })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Marks updated successfully!', 'success');
        setIsMarksEntryOpen(false);
        fetchClassExamData(selectedExamId, selectedClassId);
      } else {
        showToast(data.message || 'Error updating marks', 'danger');
      }
    } catch (err) {
      showToast('Server connection error', 'danger');
    }
  };

  const getGradeBadge = (grade) => {
    switch (grade) {
      case 'A1': return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
      case 'A2': return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
      case 'B1': return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'B2': return { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' };
      case 'C1':
      case 'C2': return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
      default: return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };
    }
  };

  const filteredStudents = examData?.students.filter(st => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return st.name.toLowerCase().includes(term) || st.roll_number.toLowerCase().includes(term);
  }) || [];

  const currentClassObj = classes.find(c => String(c.id) === String(selectedClassId));
  const currentExamObj = exams.find(e => String(e.id) === String(selectedExamId));

  return (
    <div className="examinations-container">
      {/* Header Bar */}
      <div className="header-actions no-print" style={{ marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={24} color="var(--primary)" />
            Academic Examinations & Report Cards
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Enterprise gradebook, class rank analysis, grade calculation, and CBSE-format printable student report cards.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={16} />
            <span>Print Gradebook</span>
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="filter-card no-print" style={{ 
        background: 'var(--bg-card)', 
        padding: '16px 20px', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--border)',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Select Examination
            </label>
            <select 
              className="class-select"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              style={{ minWidth: '240px' }}
            >
              {exams.map(e => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.term})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Select Classroom
            </label>
            <select 
              className="class-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              style={{ minWidth: '180px' }}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.section}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Filter Student
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search name or roll no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '32px', width: '220px' }}
            />
          </div>
        </div>
      </div>

      {/* Performance Stats Cards */}
      {examData?.stats && (
        <div className="stats-grid no-print" style={{ marginBottom: '24px' }}>
          <div className="stat-card" style={{ borderLeft: '4px solid #4f46e5' }}>
            <div className="stat-header">
              <span className="stat-title">Class Average</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="stat-value" style={{ color: '#312e81' }}>
              {examData.stats.avgPercentage}%
            </div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              Across all enrolled students
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="stat-header">
              <span className="stat-title">Pass Rate</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="stat-value" style={{ color: '#047857' }}>
              {examData.stats.passRate}%
            </div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              {examData.stats.totalAppeared} students appeared
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="stat-header">
              <span className="stat-title">Class Rank #1 (Topper)</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <Trophy size={18} />
              </div>
            </div>
            <div className="stat-value" style={{ color: '#b45309', fontSize: '1.25rem' }}>
              {examData.stats.topper?.name || 'N/A'}
            </div>
            <div className="stat-trend" style={{ color: '#b45309', fontWeight: 700 }}>
              {examData.stats.highestPercentage}% score • Grade A1
            </div>
          </div>
        </div>
      )}

      {/* Gradebook Table */}
      <div className="table-card no-print" style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {currentExamObj?.title} — {currentClassObj?.name} ({currentClassObj?.section})
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Official Consolidated Gradebook & Ranks
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}>
            Click "Report Card" to generate official CBSE certificate
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>RANK</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>ROLL</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>STUDENT NAME</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>TOTAL MARKS</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>PERCENTAGE</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>GRADE</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>STATUS</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading gradebook data...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No students found for this class or examination.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(st => {
                  const badge = getGradeBadge(st.overallGrade);
                  return (
                    <tr key={st.student_id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: st.rank === 1 ? '#fef3c7' : (st.rank <= 3 ? '#e0e7ff' : '#f1f5f9'),
                          color: st.rank === 1 ? '#d97706' : (st.rank <= 3 ? '#4f46e5' : '#475569'),
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: st.rank === 1 ? '1px solid #fde68a' : 'none'
                        }}>
                          {st.rank === 1 ? '🥇' : st.rank}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        #{st.roll_number}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                          {st.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Parent: {st.parent_name || 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {st.totalMarksObtained} <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>/ {st.totalMaxMarks}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                            {st.percentage}%
                          </span>
                          <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, st.percentage)}%`, height: '100%', background: st.percentage >= 75 ? '#10b981' : '#f59e0b' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`
                        }}>
                          {st.overallGrade}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: st.passed ? '#15803d' : '#b91c1c'
                        }}>
                          {st.passed ? 'Passed' : 'Needs Support'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                            onClick={() => handleOpenMarksEntry(st)}
                            title="Edit / Record Marks"
                          >
                            <Edit3 size={13} style={{ marginRight: '4px' }} />
                            Edit Marks
                          </button>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                            onClick={() => handleOpenReportCard(st.student_id)}
                          >
                            <FileText size={13} style={{ marginRight: '4px' }} />
                            Report Card
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Marks Modal */}
      {isMarksEntryOpen && editingStudent && (
        <div className="modal-backdrop" onClick={() => setIsMarksEntryOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Record Subject Marks</h3>
              <button onClick={() => setIsMarksEntryOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMarks}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '14px' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                  {editingStudent.name} (Roll #{editingStudent.roll_number})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {currentExamObj?.title}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Subject</label>
                <select
                  className="class-select"
                  style={{ width: '100%' }}
                  value={marksForm.subject}
                  onChange={(e) => setMarksForm({ ...marksForm, subject: e.target.value })}
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English Literature">English Literature</option>
                  <option value="Social Science">Social Science</option>
                  <option value="Hindi Course A">Hindi Course A</option>
                  <option value="Computer Applications">Computer Applications</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label>Theory (Max 80)</label>
                  <input
                    type="number"
                    max="80"
                    min="0"
                    className="search-input"
                    value={marksForm.theory_marks}
                    onChange={(e) => setMarksForm({ ...marksForm, theory_marks: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Internal / Practical (Max 20)</label>
                  <input
                    type="number"
                    max="20"
                    min="0"
                    className="search-input"
                    value={marksForm.practical_marks}
                    onChange={(e) => setMarksForm({ ...marksForm, practical_marks: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label>Teacher Observation</label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: '100%' }}
                  value={marksForm.remarks}
                  onChange={(e) => setMarksForm({ ...marksForm, remarks: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsMarksEntryOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Marks & Recompute Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official CBSE Printable Report Card Modal */}
      {isReportCardOpen && (
        <div className="modal-backdrop" onClick={() => setIsReportCardOpen(false)}>
          <div 
            className="modal-box report-card-printable-box" 
            style={{ maxWidth: '680px', padding: '0', overflow: 'hidden' }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Controls */}
            <div className="no-print" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px 20px', 
              background: '#1e1b4b',
              color: '#fff'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                CBSE Format Student Report Card Preview
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.78rem', background: '#4f46e5' }}
                  onClick={() => window.print()}
                >
                  <Printer size={14} style={{ marginRight: '6px' }} />
                  Print Official Marksheet
                </button>
                <button 
                  onClick={() => setIsReportCardOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7d2fe' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {reportCardLoading || !reportCardData ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Generating student marksheet...
              </div>
            ) : (
              /* Printable Certificate Sheet */
              <div className="report-card-sheet" style={{
                padding: '36px 32px',
                background: '#ffffff',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: '#0f172a',
                border: '12px solid #312e81',
                boxShadow: 'inset 0 0 0 2px #fbbf24'
              }}>
                {/* School Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '4px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#312e81', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                      <School size={20} />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, textTransform: 'uppercase', color: '#1e1b4b', letterSpacing: '0.04em' }}>
                      Vidya Mandir Senior Secondary School
                    </h1>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                    Affiliated to Central Board of Secondary Education (CBSE), New Delhi
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Affiliation No: 20491 • School Code: 08312 • Sector 14, Urban Estate, Gurugram (HR)
                  </div>

                  <div style={{
                    display: 'inline-block',
                    background: '#312e81',
                    color: '#fbbf24',
                    padding: '4px 18px',
                    borderRadius: '4px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    marginTop: '10px',
                    textTransform: 'uppercase'
                  }}>
                    Student Cumulative Evaluation Report • {reportCardData.exam.academic_year}
                  </div>
                </div>

                {/* Student Details Grid */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  fontSize: '0.78rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  rowGap: '6px',
                  columnGap: '16px',
                  marginBottom: '18px'
                }}>
                  <div>Student Name: <strong style={{ color: '#0f172a' }}>{reportCardData.student.first_name} {reportCardData.student.last_name}</strong></div>
                  <div>Roll Number: <strong style={{ color: '#0f172a' }}>{reportCardData.student.roll_number}</strong></div>
                  <div>Class & Section: <strong>{reportCardData.student.class_label}</strong></div>
                  <div>Class Teacher: <strong>{reportCardData.student.class_teacher}</strong></div>
                  <div>Father's / Guardian Name: <strong>{reportCardData.student.parent_name || 'N/A'}</strong></div>
                  <div>Term Attendance: <strong style={{ color: '#16a34a' }}>{reportCardData.summary.attendanceRate}%</strong></div>
                  <div>Examination: <strong>{reportCardData.exam.title}</strong></div>
                  <div>Evaluation Term: <strong>{reportCardData.exam.term}</strong></div>
                </div>

                {/* Scholastic Marks Table */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', color: '#1e1b4b' }}>
                    Part 1: Scholastic Performance
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Subject</th>
                        <th style={{ padding: '8px 6px', textAlign: 'center' }}>Theory (80)</th>
                        <th style={{ padding: '8px 6px', textAlign: 'center' }}>Internal (20)</th>
                        <th style={{ padding: '8px 6px', textAlign: 'center' }}>Total (100)</th>
                        <th style={{ padding: '8px 6px', textAlign: 'center' }}>Grade</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Teacher's Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportCardData.marks.map((m, idx) => (
                        <tr key={m.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 700 }}>{m.subject}</td>
                          <td style={{ padding: '8px 6px', textAlign: 'center' }}>{m.theory_marks}</td>
                          <td style={{ padding: '8px 6px', textAlign: 'center' }}>{m.practical_marks}</td>
                          <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800 }}>{m.total_marks}</td>
                          <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 800, color: '#312e81' }}>{m.grade}</td>
                          <td style={{ padding: '8px 10px', fontSize: '0.72rem', color: '#475569' }}>{m.remarks || 'Satisfactory'}</td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: '2px solid #0f172a', background: '#f8fafc', fontWeight: 800 }}>
                        <td style={{ padding: '10px 10px' }}>GRAND TOTAL</td>
                        <td colSpan="2" style={{ padding: '10px 6px', textAlign: 'center', color: '#64748b' }}>
                          Max Marks: {reportCardData.summary.totalMax}
                        </td>
                        <td style={{ padding: '10px 6px', textAlign: 'center', fontSize: '0.9rem', color: '#047857' }}>
                          {reportCardData.summary.totalObtained}
                        </td>
                        <td style={{ padding: '10px 6px', textAlign: 'center', color: '#312e81' }}>
                          {reportCardData.summary.overallGrade}
                        </td>
                        <td style={{ padding: '10px 10px', color: '#047857' }}>
                          Percentage: {reportCardData.summary.percentage}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Co-Scholastic & Summary Matrix */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  {/* Co-Scholastic */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 12px', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 800, color: '#1e1b4b', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Part 2: Co-Scholastic Activities
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', padding: '3px 0' }}>
                      <span>Work & IT Education:</span>
                      <strong>Grade A</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', padding: '3px 0' }}>
                      <span>Visual & Performing Arts:</span>
                      <strong>Grade A+</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', padding: '3px 0' }}>
                      <span>Health & Physical Education:</span>
                      <strong>Grade A</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span>Discipline & General Conduct:</span>
                      <strong style={{ color: '#16a34a' }}>Exemplary</strong>
                    </div>
                  </div>

                  {/* Final Result Card */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1.5px solid #312e81',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                      Final Examination Standing
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#312e81', margin: '4px 0' }}>
                      Class Rank #{reportCardData.summary.rank}
                    </div>
                    <div style={{
                      display: 'inline-block',
                      background: '#dcfce7',
                      color: '#15803d',
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      marginTop: '4px'
                    }}>
                      {reportCardData.summary.result}
                    </div>
                  </div>
                </div>

                {/* Signatures & Seal */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginTop: '28px',
                  paddingTop: '16px'
                }}>
                  <div style={{ textAlign: 'center', width: '130px' }}>
                    <div style={{ height: '24px' }}></div>
                    <div style={{ borderTop: '1px solid #64748b', fontSize: '0.72rem', fontWeight: 700, color: '#334155', paddingTop: '4px' }}>
                      Class Teacher
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      border: '2px solid #312e81',
                      color: '#312e81',
                      padding: '4px 12px',
                      borderRadius: '50px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.05em'
                    }}>
                      OFFICIAL SCHOOL SEAL
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', width: '130px' }}>
                    <div style={{ fontFamily: "'Brush Script MT', cursive", fontSize: '1.2rem', color: '#1e1b4b', height: '24px' }}>
                      Dr. A. Verma
                    </div>
                    <div style={{ borderTop: '1px solid #64748b', fontSize: '0.72rem', fontWeight: 700, color: '#334155', paddingTop: '4px' }}>
                      Principal / Headmaster
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .report-card-sheet, .report-card-sheet * {
            visibility: visible;
          }
          .report-card-sheet {
            position: absolute;
            left: 50%;
            top: 20px;
            transform: translateX(-50%);
            width: 700px;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
