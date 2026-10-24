import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  X, 
  Phone, 
  AlertTriangle, 
  Clock, 
  ExternalLink,
  Users
} from 'lucide-react';

export default function WhatsAppAlertModal({ isOpen, onClose, date, classId, showToast }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen, date, classId]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      let url = `/api/alerts/absent?date=${date || ''}`;
      if (classId) url += `&class_id=${classId}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAlerts(data.data.alerts || []);
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to load absent alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (studentId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(studentId);
    if (showToast) showToast('Alert message copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '680px', width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ background: '#064e3b', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                Instant Parent WhatsApp & SMS Alerts
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#a7f3d0' }}>
                Notify parents immediately for Absent & Late students on {date || 'today'}
              </p>
            </div>
          </div>

          <button 
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#fff' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Finding absent students...
            </div>
          ) : alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <Check size={28} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#065f46' }}>
                All Students Present!
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                No absent or late records require parental notification for this selection.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#fef3c7',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #fde68a',
                fontSize: '0.82rem',
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} />
                <span>
                  Found <strong>{alerts.length} students</strong> marked Absent/Late. Click <strong>Send WhatsApp</strong> to trigger instant alert message to parents.
                </span>
              </div>

              {alerts.map((a) => (
                <div 
                  key={a.student_id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        background: '#e2e8f0',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}>
                        #{a.roll_number}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {a.first_name} {a.last_name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {a.class_label} &bull; Parent: <strong>{a.parent_name || 'Guardian'}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${a.status === 'Absent' ? 'badge-absent' : 'badge-late'}`}>
                        {a.status}
                      </span>
                      {a.clean_phone && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          📱 {a.parent_phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message Preview Box */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    fontSize: '0.82rem',
                    color: '#334155',
                    lineHeight: '1.45',
                    fontStyle: 'normal'
                  }}>
                    💬 "{a.message_text}"
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopyMessage(a.student_id, a.message_text)}
                    >
                      {copiedId === a.student_id ? (
                        <>
                          <Check size={14} color="#10b981" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy Text
                        </>
                      )}
                    </button>

                    {a.whatsapp_url ? (
                      <a 
                        href={a.whatsapp_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-sm"
                        style={{
                          background: '#25D366',
                          color: '#ffffff',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        <Send size={14} />
                        Send WhatsApp
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#ef4444', alignSelf: 'center' }}>
                        No phone number registered
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            WhatsApp Web or Mobile App will automatically open with pre-filled message
          </span>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
