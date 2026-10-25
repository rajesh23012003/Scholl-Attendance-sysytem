import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  UserCheck, 
  Users, 
  FileSpreadsheet, 
  GraduationCap, 
  Calendar,
  CheckCircle2, 
  AlertCircle, 
  School, 
  FileText, 
  MessageSquare,
  CreditCard,
  Clock,
  Receipt,
  User,
  ShieldCheck,
  LogOut,
  LogIn
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import MarkAttendance from './components/MarkAttendance';
import Students from './components/Students';
import Reports from './components/Reports';
import Classes from './components/Classes';
import Leaves from './components/Leaves';
import WhatsAppAlertModal from './components/WhatsAppAlertModal';
import Timetable from './components/Timetable';
import Fees from './components/Fees';
import IdCards from './components/IdCards';
import LoginModal from './components/LoginModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [toast, setToast] = useState(null);
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Active User session (pre-filled with Principal / Admin for instant demo)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('school_user');
      return saved ? JSON.parse(saved) : {
        id: 1,
        username: 'admin',
        name: 'Dr. Alok Verma',
        role: 'admin',
        email: 'principal@vidyamandir.edu'
      };
    } catch {
      return {
        id: 1,
        username: 'admin',
        name: 'Dr. Alok Verma',
        role: 'admin',
        email: 'principal@vidyamandir.edu'
      };
    }
  });

  // Fetch classes, stats and leave counts
  useEffect(() => {
    fetchClasses();
    fetchStats();
    fetchLeaveStats();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      if (data.success) {
        setClasses(data.data || []);
        if (data.data.length > 0 && !selectedClassId) {
          setSelectedClassId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats/overview');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const fetchLeaveStats = async () => {
    try {
      const res = await fetch('/api/leaves/stats');
      const data = await res.json();
      if (data.success) {
        setPendingLeavesCount(data.data.pending || 0);
      }
    } catch (err) {
      console.error('Failed to load leave stats:', err);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleSelectClassForAttendance = (classId) => {
    setSelectedClassId(classId);
    setCurrentTab('attendance');
  };

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-icon-box">
            <School size={22} />
          </div>
          <div>
            <div className="brand-title">Vidya Mandir</div>
            <div className="brand-subtitle">Attendance & Leaves</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button 
            className={`nav-item ${currentTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setCurrentTab('attendance')}
          >
            <UserCheck size={18} />
            <span>Mark Attendance</span>
          </button>

          <button 
            className={`nav-item ${currentTab === 'leaves' ? 'active' : ''}`}
            onClick={() => setCurrentTab('leaves')}
          >
            <FileText size={18} />
            <span>Leave Requests</span>
            {pendingLeavesCount > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: '#f59e0b',
                color: '#fff',
                borderRadius: '9999px',
                padding: '2px 8px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                {pendingLeavesCount}
              </span>
            )}
          </button>

          <button 
            className={`nav-item ${currentTab === 'timetable' ? 'active' : ''}`}
            onClick={() => setCurrentTab('timetable')}
          >
            <Clock size={18} />
            <span>Class Timetable</span>
          </button>

          <button 
            className={`nav-item ${currentTab === 'fees' ? 'active' : ''}`}
            onClick={() => setCurrentTab('fees')}
          >
            <Receipt size={18} />
            <span>Fee Management</span>
          </button>

          <button 
            className={`nav-item ${currentTab === 'idcards' ? 'active' : ''}`}
            onClick={() => setCurrentTab('idcards')}
          >
            <CreditCard size={18} />
            <span>Student ID Cards</span>
          </button>

          <button 
            className={`nav-item ${currentTab === 'students' ? 'active' : ''}`}
            onClick={() => setCurrentTab('students')}
          >
            <Users size={18} />
            <span>Students Directory</span>
          </button>

          <button 
            className={`nav-item ${currentTab === 'reports' ? 'active' : ''}`}
            onClick={() => setCurrentTab('reports')}
          >
            <FileSpreadsheet size={18} />
            <span>Monthly Reports</span>
          </button>

          <button 
            className={`nav-item ${currentTab === 'classes' ? 'active' : ''}`}
            onClick={() => setCurrentTab('classes')}
          >
            <GraduationCap size={18} />
            <span>Classes & Sections</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ color: '#cbd5e1', fontWeight: 600 }}>School Portal v2.5</div>
          <div>Status: <span style={{ color: '#10b981' }}>● Online (SQLite)</span></div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-left">
            <h2 className="page-title">
              {currentTab === 'dashboard' && 'School Dashboard'}
              {currentTab === 'attendance' && 'Daily Attendance Register'}
              {currentTab === 'leaves' && 'Student Leave Management'}
              {currentTab === 'timetable' && 'Class Timetable & Schedule'}
              {currentTab === 'fees' && 'Fee Management & Official Receipts'}
              {currentTab === 'idcards' && 'Student ID Card Generator & Printing'}
              {currentTab === 'students' && 'Students Directory'}
              {currentTab === 'reports' && 'Attendance Reports & Analytics'}
              {currentTab === 'classes' && 'Classrooms & Sections'}
            </h2>
          </div>

          <div className="topbar-right">
            <div className="date-pill">
              <Calendar size={15} color="var(--primary)" />
              <span>{todayFormatted}</span>
            </div>

            {/* User Session Pill */}
            {currentUser ? (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 10px 4px 6px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: currentUser.role === 'admin' ? '#fee2e2' : (currentUser.role === 'teacher' ? '#e0e7ff' : '#dcfce7'),
                  color: currentUser.role === 'admin' ? '#dc2626' : (currentUser.role === 'teacher' ? '#4f46e5' : '#16a34a'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {currentUser.role === 'admin' ? <ShieldCheck size={16} /> : (currentUser.role === 'teacher' ? <GraduationCap size={16} /> : <User size={16} />)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {currentUser.name}
                  </span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 6px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer',
                    marginLeft: '4px'
                  }}
                  title="Switch Role / Login"
                >
                  Switch
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => setIsLoginModalOpen(true)}
              >
                <LogIn size={15} />
                Sign In
              </button>
            )}

            <button 
              className="btn btn-sm"
              style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #10b981',
                fontWeight: 700
              }}
              onClick={() => setIsAlertModalOpen(true)}
              title="Open WhatsApp Parent Alerts"
            >
              <MessageSquare size={16} color="#10b981" />
              WhatsApp Alerts
            </button>

            {currentTab !== 'attendance' && (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setCurrentTab('attendance')}
              >
                <UserCheck size={16} />
                Take Attendance
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Page Body */}
        <div className="page-body">
          {currentTab === 'dashboard' && (
            <Dashboard 
              stats={stats} 
              onNavigate={setCurrentTab}
              onSelectClassForAttendance={handleSelectClassForAttendance}
              onOpenAlerts={() => setIsAlertModalOpen(true)}
            />
          )}

          {currentTab === 'attendance' && (
            <MarkAttendance 
              classes={classes}
              selectedClassId={selectedClassId}
              onClassChange={setSelectedClassId}
              showToast={showToast}
              refreshDashboard={fetchStats}
            />
          )}

          {currentTab === 'leaves' && (
            <Leaves 
              classes={classes}
              showToast={showToast}
              refreshDashboard={() => {
                fetchStats();
                fetchLeaveStats();
              }}
            />
          )}

          {currentTab === 'timetable' && (
            <Timetable 
              classes={classes}
              showToast={showToast}
            />
          )}

          {currentTab === 'fees' && (
            <Fees 
              classes={classes}
              showToast={showToast}
            />
          )}

          {currentTab === 'idcards' && (
            <IdCards 
              classes={classes}
            />
          )}

          {currentTab === 'students' && (
            <Students 
              classes={classes}
              showToast={showToast}
              refreshDashboard={fetchStats}
            />
          )}

          {currentTab === 'reports' && (
            <Reports 
              classes={classes}
              showToast={showToast}
            />
          )}

          {currentTab === 'classes' && (
            <Classes 
              classes={classes}
              onSelectClassForAttendance={handleSelectClassForAttendance}
              onNavigate={setCurrentTab}
              showToast={showToast}
              refreshClasses={fetchClasses}
            />
          )}
        </div>
      </main>

      {/* Global WhatsApp Alert Modal */}
      <WhatsAppAlertModal 
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        date={stats ? stats.date : ''}
        showToast={showToast}
      />

      {/* Role-based Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          localStorage.setItem('school_user', JSON.stringify(u));
          showToast(`Logged in successfully as ${u.name} (${u.role.toUpperCase()})`, 'success');
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} color="#10b981" />
          ) : (
            <AlertCircle size={18} color="#f59e0b" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
