import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Server, 
  Database, 
  HardDrive, 
  Activity, 
  Shield, 
  Network, 
  UploadCloud, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  ExternalLink,
  Copy,
  Clock,
  Layers,
  FileSpreadsheet,
  Send
} from 'lucide-react';

export default function AwsCloud({ showToast }) {
  const [awsData, setAwsData] = useState(null);
  const [s3Files, setS3Files] = useState([]);
  const [cloudwatchLogs, setCloudwatchLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingS3, setUploadingS3] = useState(false);
  const [sendingLog, setSendingLog] = useState(false);
  const [logFilter, setLogFilter] = useState('ALL');
  const [testLogMessage, setTestLogMessage] = useState('');

  useEffect(() => {
    fetchAwsStatus();
    fetchS3Files();
    fetchCloudWatchLogs();
  }, []);

  const fetchAwsStatus = async () => {
    try {
      const res = await fetch('/api/aws/status');
      const data = await res.json();
      if (data.success) {
        setAwsData(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchS3Files = async () => {
    try {
      const res = await fetch('/api/aws/s3/files');
      const data = await res.json();
      if (data.success) {
        setS3Files(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCloudWatchLogs = async () => {
    try {
      const res = await fetch('/api/aws/cloudwatch/logs');
      const data = await res.json();
      if (data.success) {
        setCloudwatchLogs(data.data.logs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadAttendanceToS3 = async () => {
    setUploadingS3(true);
    try {
      const res = await fetch('/api/aws/s3/upload-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0] })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        fetchS3Files();
        fetchCloudWatchLogs();
        fetchAwsStatus();
      } else {
        showToast(data.message || 'S3 upload failed', 'error');
      }
    } catch (err) {
      showToast('Network error during S3 upload', 'error');
    } finally {
      setUploadingS3(false);
    }
  };

  const handleSendTestCloudWatchLog = async () => {
    if (!testLogMessage.trim()) {
      showToast('Please type a message to send to CloudWatch', 'error');
      return;
    }
    setSendingLog(true);
    try {
      const res = await fetch('/api/aws/cloudwatch/test-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testLogMessage, level: 'INFO' })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Event logged to AWS CloudWatch!', 'success');
        setTestLogMessage('');
        fetchCloudWatchLogs();
      }
    } catch (err) {
      showToast('Error sending log to CloudWatch', 'error');
    } finally {
      setSendingLog(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'info');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
        <RefreshCw size={32} className="spin" style={{ margin: '0 auto 16px', display: 'block' }} />
        <p>Connecting to AWS Cloud Architecture Services...</p>
      </div>
    );
  }

  const vpc = awsData?.vpc;
  const rds = awsData?.rds;
  const s3 = awsData?.s3;
  const cw = awsData?.cloudwatch;

  const filteredLogs = cloudwatchLogs.filter(log => {
    if (logFilter === 'ALL') return true;
    return log.level === logFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f766e 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ zIndex: 2, maxWidth: '750px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              background: 'rgba(255, 153, 0, 0.2)',
              color: '#ff9900',
              border: '1px solid rgba(255, 153, 0, 0.4)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.05em'
            }}>
              ☁️ AWS PRODUCTION CLOUD INFRASTRUCTURE
            </span>
            <span style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 700
            }}>
              ● All Systems Operational
            </span>
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '6px' }}>
            VPC &bull; RDS MySQL &bull; S3 &bull; CloudWatch Hub
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', marginTop: '6px', lineHeight: '1.5' }}>
            Production 3-Tier AWS Architecture: EC2 web layer in Public Subnets, isolated RDS MySQL in Private Subnets, encrypted S3 Report Vault, and real-time CloudWatch telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', zIndex: 2 }}>
          <button 
            className="btn" 
            style={{ 
              background: 'linear-gradient(135deg, #ff9900 0%, #d97706 100%)', 
              color: '#fff', 
              fontWeight: 700,
              border: 'none',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)'
            }}
            onClick={handleUploadAttendanceToS3}
            disabled={uploadingS3}
          >
            <UploadCloud size={18} />
            {uploadingS3 ? 'Uploading to S3...' : 'Backup Attendance to S3'}
          </button>

          <button 
            className="btn btn-secondary"
            onClick={() => {
              fetchAwsStatus();
              fetchS3Files();
              fetchCloudWatchLogs();
              showToast('Refreshed AWS Cloud status', 'info');
            }}
          >
            <RefreshCw size={16} />
            Refresh Status
          </button>
        </div>
      </div>

      {/* 4 AWS Services Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* 1. VPC Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Network size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Amazon VPC</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Isolated Cloud Network</span>
              </div>
            </div>
            <span className="badge badge-present">Active</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>VPC CIDR:</span>
              <strong>{vpc?.cidr || '10.0.0.0/16'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subnets:</span>
              <strong>2 Public + 2 Private</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Route Tables:</span>
              <strong>Public (IGW) + Private</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Security Groups:</span>
              <strong>EC2 (80/5000) &bull; RDS (3306)</strong>
            </div>
          </div>
        </div>

        {/* 2. RDS MySQL Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Amazon RDS</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>MySQL 8.0 Engine</span>
              </div>
            </div>
            <span className="badge badge-present">{rds?.status || 'Ready'}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Database:</span>
              <strong>{rds?.dbName || 'school_attendance_db'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Multi-AZ:</span>
              <strong style={{ color: '#059669' }}>High Availability</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Port:</span>
              <strong>3306 (Private Subnet)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Storage / Backup:</span>
              <strong>20 GiB (7-Day Retention)</strong>
            </div>
          </div>
        </div>

        {/* 3. S3 Storage Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HardDrive size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Amazon S3</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cloud Reports & Vault</span>
              </div>
            </div>
            <span className="badge badge-late">{s3Files.length} Reports</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Bucket:</span>
              <strong style={{ fontSize: '0.78rem' }}>{s3?.bucket || 'school-attendance-reports'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Storage Class:</span>
              <strong>Standard (99.999999999%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Prefix:</span>
              <strong>attendance-reports/</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Direct Download:</span>
              <strong style={{ color: '#2563eb' }}>Enabled</strong>
            </div>
          </div>
        </div>

        {/* 4. CloudWatch Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Amazon CloudWatch</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Telemetry & Alarms</span>
              </div>
            </div>
            <span className="badge badge-present">Live Stream</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Log Stream:</span>
              <strong>{cw?.logStream || 'production-app'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Alarms:</span>
              <strong style={{ color: '#059669' }}>3 Configured (OK)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>CPU Threshold:</span>
              <strong>&gt; 80% Trigger</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Recent Events:</span>
              <strong>{cloudwatchLogs.length} Events Logged</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid: VPC Diagram & S3 File Browser */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        
        {/* VPC Architecture Map Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Network size={20} color="#2563eb" />
              AWS VPC Network Topology
            </h3>
            <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              CIDR: {vpc?.cidr}
            </span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Public Subnets Box */}
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #93c5fd',
              borderRadius: 'var(--radius-md)',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 800, color: '#1e40af', fontSize: '0.88rem' }}>
                  🌐 PUBLIC SUBNET (Internet-Facing Layer)
                </span>
                <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  Route 0.0.0.0/0 ➔ Internet Gateway
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {vpc?.publicSubnets?.map((sub, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Server size={16} color="#2563eb" />
                      <strong style={{ fontSize: '0.85rem' }}>{sub.name}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      CIDR: {sub.cidr} &bull; AZ: {sub.az}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 600, marginTop: '4px' }}>
                      {sub.purpose}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Private Subnets Box */}
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #86efac',
              borderRadius: 'var(--radius-md)',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 800, color: '#065f46', fontSize: '0.88rem' }}>
                  🔒 PRIVATE SUBNET (Zero Public Access &bull; Isolated Database Layer)
                </span>
                <span style={{ fontSize: '0.75rem', background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  Accessible ONLY by EC2 Security Group
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {vpc?.privateSubnets?.map((sub, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Database size={16} color="#059669" />
                      <strong style={{ fontSize: '0.85rem' }}>{sub.name}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      CIDR: {sub.cidr} &bull; AZ: {sub.az}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 600, marginTop: '4px' }}>
                      {sub.purpose}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Migration CLI Note */}
            <div style={{
              background: '#0f172a',
              color: '#f8fafc',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Migrate data to AWS RDS MySQL command:</span>
                <div style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700, marginTop: '2px' }}>
                  node backend/migrate-sqlite-to-mysql.js
                </div>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                onClick={() => copyToClipboard('node backend/migrate-sqlite-to-mysql.js', 'CLI Command')}
              >
                <Copy size={13} />
                Copy
              </button>
            </div>

          </div>
        </div>

        {/* AWS S3 Reports Browser */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <HardDrive size={20} color="#d97706" />
                AWS S3 Attendance Vault
              </h3>
              <p className="card-description">
                Bucket: <code>{s3?.bucket}</code>
              </p>
            </div>

            <button 
              className="btn btn-primary btn-sm"
              onClick={handleUploadAttendanceToS3}
              disabled={uploadingS3}
            >
              <UploadCloud size={14} />
              {uploadingS3 ? 'Backing up...' : 'Save to S3'}
            </button>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {s3Files.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <HardDrive size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
                <p style={{ fontWeight: 600 }}>No reports in S3 yet</p>
                <p style={{ fontSize: '0.85rem' }}>Click "Backup Attendance to S3" to sync today's register.</p>
              </div>
            ) : (
              <div className="table-container" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Size</th>
                      <th>Last Modified</th>
                      <th style={{ textAlign: 'right' }}>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s3Files.map((file, idx) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileSpreadsheet size={16} color="#059669" />
                            <strong style={{ fontSize: '0.85rem' }}>{file.name}</strong>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {file.s3Uri}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>
                          {(file.sizeBytes / 1024).toFixed(1)} KB
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(file.lastModified).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <a 
                            href={`/api/aws/s3/files/download/${encodeURIComponent(file.name)}`}
                            download
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px' }}
                          >
                            <Download size={13} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* CloudWatch Real-time Logs Console */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 className="card-title">
              <Activity size={20} color="#8b5cf6" />
              AWS CloudWatch Live Telemetry Stream
            </h3>
            <p className="card-description">
              Log Group: <code>{cw?.logGroup}</code> &bull; Stream: <code>{cw?.logStream}</code>
            </p>
          </div>

          {/* Filter Pill Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filter:</span>
            {['ALL', 'INFO', 'WARN', 'ERROR'].map(f => (
              <button 
                key={f}
                className={`btn btn-sm ${logFilter === f ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => setLogFilter(f)}
              >
                {f}
              </button>
            ))}

            <button 
              className="btn btn-secondary btn-sm"
              onClick={fetchCloudWatchLogs}
              title="Refresh Stream"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Test Dispatch Form Bar */}
        <div style={{
          padding: '12px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <input 
            type="text" 
            className="form-input"
            style={{ flex: 1, minWidth: '260px', height: '36px', fontSize: '0.85rem' }}
            placeholder="Type a custom message to dispatch to AWS CloudWatch..."
            value={testLogMessage}
            onChange={(e) => setTestLogMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendTestCloudWatchLog()}
          />

          <button 
            className="btn btn-primary btn-sm"
            onClick={handleSendTestCloudWatchLog}
            disabled={sendingLog}
          >
            <Send size={13} />
            {sendingLog ? 'Sending...' : 'Send to CloudWatch'}
          </button>
        </div>

        {/* Logs Table */}
        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="data-table" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ width: '170px' }}>Timestamp (UTC)</th>
                <th style={{ width: '90px' }}>Level</th>
                <th>Message</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                let badgeClass = 'badge-present';
                if (log.level === 'WARN') badgeClass = 'badge-late';
                if (log.level === 'ERROR') badgeClass = 'badge-absent';

                return (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()} ({new Date(log.timestamp).toISOString().split('T')[0]})
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        {log.level}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                      {log.message}
                    </td>
                    <td style={{ color: '#0369a1', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
