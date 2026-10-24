import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp 
} from 'lucide-react';

export default function Reports({ classes, showToast }) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0] ? classes[0].id : '');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [selectedClassId, selectedMonth]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/api/reports/monthly?month=${selectedMonth}`;
      if (selectedClassId) url += `&class_id=${selectedClassId}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReportData(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading monthly report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    const today = new Date().toISOString().split('T')[0];
    let exportUrl = `/api/reports/export-csv?date=${today}`;
    if (selectedClassId) exportUrl += `&class_id=${selectedClassId}`;
    window.open(exportUrl, '_blank');
    showToast('Attendance CSV downloaded!', 'success');
  };

  // Generate days in month array
  const getDaysInMonth = (yearMonth) => {
    if (!yearMonth) return [];
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(year, month, 0);
    const totalDays = date.getDate();
    const days = [];
    for (let i = 1; i <= totalDays; i++) {
      const dayStr = String(i).padStart(2, '0');
      days.push(`${yearMonth}-${dayStr}`);
    }
    return days;
  };

  const daysInMonth = getDaysInMonth(selectedMonth);
  const students = reportData ? reportData.students || [] : [];

  // Summary figures
  const totalStudents = students.length;
  const avgAttendance = totalStudents > 0 
    ? Math.round(students.reduce((acc, s) => acc + s.percentage, 0) / totalStudents) 
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Report Controls Card */}
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
              Monthly Attendance Register & Matrix
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Comprehensive monthly participation report with daily status matrix and CSV export.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => window.print()}>
              <Printer size={16} />
              Print
            </button>
            <button className="btn btn-primary" onClick={handleExportCsv}>
              <Download size={16} />
              Export to CSV
            </button>
          </div>
        </div>

        {/* Filter Selection Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border)',
          flexWrap: 'wrap'
        }}>
          <div className="form-group" style={{ minWidth: '180px' }}>
            <label className="form-label">Month</label>
            <input 
              type="month" 
              className="form-input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ minWidth: '200px' }}>
            <label className="form-label">Class</label>
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

          <div style={{ display: 'flex', gap: '16px', marginLeft: 'auto', alignItems: 'center' }}>
            <div style={{
              background: '#f8fafc',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Students</span>
              <strong style={{ fontSize: '1.1rem' }}>{totalStudents}</strong>
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Class Average</span>
              <strong style={{ fontSize: '1.1rem', color: avgAttendance >= 80 ? '#10b981' : '#f59e0b' }}>
                {avgAttendance}%
              </strong>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginTop: '16px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          flexWrap: 'wrap'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="matrix-cell P" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>P</span> Present
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="matrix-cell A" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>A</span> Absent
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="matrix-cell L" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>L</span> Late
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="matrix-cell E" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>E</span> Excused / Leave
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#cbd5e1' }}>&bull;</span> Unmarked
          </span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="card">
        <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Loading monthly report matrix...
            </div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              No attendance data available for the selected period.
            </div>
          ) : (
            <table className="data-table" style={{ fontSize: '0.82rem' }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: '#f8fafc', zIndex: 10 }}>Roll</th>
                  <th style={{ position: 'sticky', left: '60px', background: '#f8fafc', zIndex: 10 }}>Student Name</th>
                  <th>Class</th>
                  {daysInMonth.map(d => {
                    const dayNum = d.split('-')[2];
                    return (
                      <th key={d} style={{ textAlign: 'center', padding: '8px 4px', minWidth: '32px' }}>
                        {dayNum}
                      </th>
                    );
                  })}
                  <th style={{ textAlign: 'center' }}>Present</th>
                  <th style={{ textAlign: 'center' }}>Absent</th>
                  <th style={{ textAlign: 'center' }}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.student_id}>
                    <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 5, fontWeight: 700 }}>
                      #{s.roll_number}
                    </td>
                    <td style={{ position: 'sticky', left: '60px', background: '#fff', zIndex: 5, fontWeight: 600 }}>
                      {s.student_name}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.class_label}</span>
                    </td>
                    {daysInMonth.map(d => {
                      const status = s.daily_status[d];
                      let cellClass = 'empty';
                      let label = '·';
                      if (status === 'Present') { cellClass = 'P'; label = 'P'; }
                      else if (status === 'Absent') { cellClass = 'A'; label = 'A'; }
                      else if (status === 'Late') { cellClass = 'L'; label = 'L'; }
                      else if (status === 'Excused') { cellClass = 'E'; label = 'E'; }

                      return (
                        <td key={d} style={{ textAlign: 'center', padding: '4px 2px' }}>
                          <span className={`matrix-cell ${cellClass}`}>
                            {label}
                          </span>
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#059669' }}>
                      {s.present_days + s.late_days}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#dc2626' }}>
                      {s.absent_days}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontWeight: 800,
                        color: s.percentage >= 80 ? '#10b981' : s.percentage >= 70 ? '#f59e0b' : '#ef4444'
                      }}>
                        {s.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
