import React from 'react';
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Calendar,
  PhoneCall,
  ArrowRight,
  MessageSquare
} from 'lucide-react';

export default function Dashboard({ stats, onNavigate, onSelectClassForAttendance, onOpenAlerts }) {
  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
        Loading dashboard statistics...
      </div>
    );
  }

  const { date, totalStudents, totalClasses, todayStats, classBreakdown, recentHistory, lowAttendanceStudents } = stats;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Banner / Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <span style={{ 
            background: 'rgba(255,255,255,0.15)', 
            padding: '4px 12px', 
            borderRadius: 'var(--radius-full)', 
            fontSize: '0.8rem', 
            fontWeight: 600,
            letterSpacing: '0.04em'
          }}>
            🏫 ACADEMIC YEAR 2026-2027
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', letterSpacing: '-0.02em' }}>
            School Attendance Overview
          </h1>
          <p style={{ color: '#c7d2fe', fontSize: '0.95rem', marginTop: '4px' }}>
            Daily live attendance tracker for students, class teachers, and administration.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {todayStats.absent > 0 && onOpenAlerts && (
            <button 
              className="btn" 
              style={{ background: '#10b981', color: '#ffffff', fontWeight: 700, border: 'none' }}
              onClick={onOpenAlerts}
            >
              <MessageSquare size={18} />
              WhatsApp Absent Alert ({todayStats.absent})
            </button>
          )}

          <button 
            className="btn" 
            style={{ background: '#ffffff', color: '#1e1b4b', fontWeight: 700 }}
            onClick={() => onNavigate('attendance')}
          >
            <CheckCircle2 size={18} color="#4f46e5" />
            Mark Today's Attendance
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon indigo">
            <Users size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Students</span>
            <span className="stat-value">{totalStudents}</span>
            <span className="stat-subtext">Across {totalClasses} classes</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <UserCheck size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Present Today</span>
            <span className="stat-value">{todayStats.present}</span>
            <span className="stat-subtext">Active in classrooms</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <UserX size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Absent Today</span>
            <span className="stat-value">{todayStats.absent}</span>
            <span className="stat-subtext">Unexcused / informed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <Clock size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Late / Excused</span>
            <span className="stat-value">{todayStats.late + todayStats.excused}</span>
            <span className="stat-subtext">{todayStats.late} late, {todayStats.excused} excused</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <TrendingUp size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Attendance Rate</span>
            <span className="stat-value" style={{ color: todayStats.percentage >= 75 ? '#10b981' : '#ef4444' }}>
              {todayStats.percentage}%
            </span>
            <span className="stat-subtext">Target: 85%+</span>
          </div>
        </div>
      </div>

      {/* Class-wise Today Progress & Low Attendance Warning */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        
        {/* Class Breakdown Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <GraduationCap size={20} color="var(--primary)" />
                Class-wise Attendance Today
              </h3>
              <p className="card-description">Live status by classroom</p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('attendance')}
            >
              Take Attendance
            </button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {classBreakdown && classBreakdown.length > 0 ? (
              classBreakdown.map((c) => {
                const total = c.total_students || 0;
                const attended = (c.present_count || 0) + (c.late_count || 0);
                const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
                
                return (
                  <div 
                    key={c.id} 
                    style={{
                      background: '#f8fafc',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease'
                    }}
                    onClick={() => {
                      if (onSelectClassForAttendance) onSelectClassForAttendance(c.id);
                      onNavigate('attendance');
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {c.class_label}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          ({total} Students)
                        </span>
                      </div>
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444'
                      }}>
                        {pct}% Present
                      </span>
                    </div>

                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${pct}%`,
                          backgroundColor: pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>✅ {c.present_count || 0} Present</span>
                      <span>❌ {c.absent_count || 0} Absent</span>
                      <span>⏰ {c.late_count || 0} Late</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: 600 }}>Mark &rarr;</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No classes configured yet.</p>
            )}
          </div>
        </div>

        {/* Low Attendance Alert Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <AlertTriangle size={20} color="#ef4444" />
                Low Attendance Alert (&lt;75%)
              </h3>
              <p className="card-description">Students needing immediate attention</p>
            </div>
            <span className="badge badge-absent">
              {lowAttendanceStudents ? lowAttendanceStudents.length : 0} Students
            </span>
          </div>

          <div className="card-body">
            {lowAttendanceStudents && lowAttendanceStudents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {lowAttendanceStudents.map((st) => (
                  <div 
                    key={st.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: '#fff1f2',
                      border: '1px solid #fecdd3'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="avatar-circle" style={{ background: '#ffe4e6', color: '#be123c' }}>
                        {st.roll_number}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#881337' }}>
                          {st.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#9f1239' }}>
                          {st.class_label} &bull; Attended: {st.attended_days}/{st.total_days} days
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        color: '#b91c1c'
                      }}>
                        {st.attendance_rate}%
                      </span>
                      {st.parent_phone && (
                        <a 
                          href={`tel:${st.parent_phone}`}
                          title={`Call Parent: ${st.parent_phone}`}
                          className="btn btn-sm"
                          style={{ background: '#fff', border: '1px solid #fecdd3', color: '#9f1239', padding: '5px 8px' }}
                        >
                          <PhoneCall size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 0', color: '#10b981' }}>
                <CheckCircle2 size={36} style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontWeight: 600 }}>Great news!</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No student is currently below 75% attendance threshold.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 7-Day Trend Card */}
      {recentHistory && recentHistory.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Calendar size={20} color="var(--primary)" />
                Recent Attendance History (Past Days)
              </h3>
              <p className="card-description">Overall daily school participation</p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('reports')}
            >
              View Full Report
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
              {recentHistory.map((day) => (
                <div 
                  key={day.date}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {day.date}
                  </div>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    margin: '6px 0',
                    color: day.rate >= 80 ? '#10b981' : '#f59e0b'
                  }}>
                    {day.rate}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                    {day.attended} / {day.total} Students
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
