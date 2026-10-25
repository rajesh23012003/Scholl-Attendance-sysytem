import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  CreditCard, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Printer, 
  IndianRupee, 
  Download, 
  School, 
  X,
  FileCheck
} from 'lucide-react';

export default function Fees({ classes = [], showToast }) {
  const [fees, setFees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  // Form states
  const [collectPaymentData, setCollectPaymentData] = useState({
    payment_mode: 'UPI / QR',
    remarks: 'Paid in full via digital payment'
  });

  const [newBillData, setNewBillData] = useState({
    class_id: classes[0]?.id || '',
    student_id: '',
    fee_type: 'Tuition Fee (Quarter 3)',
    amount: 12500,
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    remarks: 'Term 3 academic tuition fees'
  });

  useEffect(() => {
    fetchFees();
    fetchStats();
  }, [selectedClassId, statusFilter]);

  const fetchFees = async () => {
    setLoading(true);
    try {
      let url = '/api/fees?';
      if (selectedClassId) url += `class_id=${selectedClassId}&`;
      if (statusFilter) url += `status=${statusFilter}&`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setFees(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load fees:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/fees/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to load fee stats:', err);
    }
  };

  const filteredFees = fees.filter(f => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      f.student_name?.toLowerCase().includes(term) ||
      f.roll_number?.toLowerCase().includes(term) ||
      f.fee_type?.toLowerCase().includes(term) ||
      f.receipt_number?.toLowerCase().includes(term)
    );
  });

  const handleOpenCollect = (fee) => {
    setSelectedFee(fee);
    setIsCollectModalOpen(true);
  };

  const handleOpenReceipt = (fee) => {
    setSelectedFee(fee);
    setIsReceiptModalOpen(true);
  };

  const submitCollectPayment = async (e) => {
    e.preventDefault();
    if (!selectedFee) return;

    try {
      const res = await fetch(`/api/fees/${selectedFee.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectPaymentData)
      });
      const data = await res.json();

      if (data.success) {
        showToast('Payment recorded successfully! Receipt generated.', 'success');
        setIsCollectModalOpen(false);
        fetchFees();
        fetchStats();
        // open receipt modal
        setSelectedFee(data.data);
        setIsReceiptModalOpen(true);
      } else {
        showToast(data.message || 'Payment recording failed', 'danger');
      }
    } catch (err) {
      showToast('Server connection error', 'danger');
    }
  };

  const submitNewBill = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBillData)
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message || 'Fee bill generated!', 'success');
        setIsNewBillModalOpen(false);
        fetchFees();
        fetchStats();
      } else {
        showToast(data.message || 'Failed to create fee bill', 'danger');
      }
    } catch (err) {
      showToast('Server connection error', 'danger');
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  return (
    <div className="fees-container">
      {/* Header Actions */}
      <div className="header-actions no-print" style={{ marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={24} color="var(--primary)" />
            Fee Management & Receipts Portal
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Track student school fees, dues, payment collection modes, and generate official printable fee receipts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setIsNewBillModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>Generate Fee Bill</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid no-print" style={{ marginBottom: '24px' }}>
          <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="stat-header">
              <span className="stat-title">Total Collected</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="stat-value" style={{ color: '#047857' }}>
              {formatCurrency(stats.totalCollected)}
            </div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              {stats.countPaid} cleared fee receipts
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="stat-header">
              <span className="stat-title">Pending Dues</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <Clock size={18} />
              </div>
            </div>
            <div className="stat-value" style={{ color: '#b45309' }}>
              {formatCurrency(stats.totalPending)}
            </div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              {stats.countPending} student invoices awaiting payment
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="stat-header">
              <span className="stat-title">Overdue Amount</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                <AlertCircle size={18} />
              </div>
            </div>
            <div className="stat-value" style={{ color: '#b91c1c' }}>
              {formatCurrency(stats.totalOverdue)}
            </div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              {stats.countOverdue} overdue past due date
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
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
        gap: '14px'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Filter by Class
            </label>
            <select 
              className="class-select"
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

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Payment Status
            </label>
            <select 
              className="class-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            Search Records
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search student, roll, receipt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '32px', width: '240px' }}
            />
          </div>
        </div>
      </div>

      {/* Fees Table */}
      <div className="table-card no-print" style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)' }}>STUDENT</th>
                <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)' }}>CLASS</th>
                <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)' }}>FEE TYPE</th>
                <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)' }}>AMOUNT</th>
                <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)' }}>DUE DATE</th>
                <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)' }}>STATUS</th>
                <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)' }}>RECEIPT</th>
                <th style={{ padding: '14px 16px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Loading fee records...
                  </td>
                </tr>
              ) : filteredFees.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No fee records match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredFees.map(fee => (
                  <tr key={fee.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{fee.student_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roll #{fee.roll_number}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      {fee.class_label}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      <div>{fee.fee_type}</div>
                      {fee.remarks && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{fee.remarks}</div>}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {formatCurrency(fee.amount)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {fee.due_date}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: fee.status === 'Paid' ? 'var(--success-light)' : (fee.status === 'Overdue' ? 'var(--danger-light)' : 'var(--warning-light)'),
                        color: fee.status === 'Paid' ? 'var(--success-text)' : (fee.status === 'Overdue' ? 'var(--danger-text)' : 'var(--warning-text)'),
                        border: `1px solid ${fee.status === 'Paid' ? 'var(--success-border)' : (fee.status === 'Overdue' ? 'var(--danger-border)' : 'var(--warning-border)')}`
                      }}>
                        {fee.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {fee.receipt_number ? (
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                          {fee.receipt_number}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-light)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {fee.status === 'Paid' ? (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          onClick={() => handleOpenReceipt(fee)}
                        >
                          <Printer size={13} style={{ marginRight: '4px' }} />
                          Receipt
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                          onClick={() => handleOpenCollect(fee)}
                        >
                          Collect
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {isCollectModalOpen && selectedFee && (
        <div className="modal-backdrop" onClick={() => setIsCollectModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Record Fee Payment</h3>
              <button onClick={() => setIsCollectModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitCollectPayment}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {selectedFee.student_name} (Roll #{selectedFee.roll_number})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {selectedFee.fee_type} • {selectedFee.class_label}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857', marginTop: '8px' }}>
                  {formatCurrency(selectedFee.amount)}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Payment Method</label>
                <select
                  className="class-select"
                  style={{ width: '100%' }}
                  value={collectPaymentData.payment_mode}
                  onChange={(e) => setCollectPaymentData({ ...collectPaymentData, payment_mode: e.target.value })}
                >
                  <option value="UPI / QR">UPI / QR (PhonePe / GPay / Paytm)</option>
                  <option value="Cash">Cash (Counter Deposit)</option>
                  <option value="Net Banking">Net Banking / NEFT</option>
                  <option value="Debit/Credit Card">Debit / Credit Card (POS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Remarks / Notes</label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: '100%' }}
                  value={collectPaymentData.remarks}
                  onChange={(e) => setCollectPaymentData({ ...collectPaymentData, remarks: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCollectModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Payment & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Fee Bill Modal */}
      {isNewBillModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewBillModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Create New Fee Bill</h3>
              <button onClick={() => setIsNewBillModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitNewBill}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Target Class (All students in class will receive bill)</label>
                <select
                  className="class-select"
                  style={{ width: '100%' }}
                  value={newBillData.class_id}
                  onChange={(e) => setNewBillData({ ...newBillData, class_id: e.target.value })}
                  required
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.section}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Fee Category</label>
                <select
                  className="class-select"
                  style={{ width: '100%' }}
                  value={newBillData.fee_type}
                  onChange={(e) => setNewBillData({ ...newBillData, fee_type: e.target.value })}
                  required
                >
                  <option value="Tuition Fee (Quarter 3)">Tuition Fee (Quarter 3)</option>
                  <option value="Tuition Fee (Quarter 4)">Tuition Fee (Quarter 4)</option>
                  <option value="Transport Fee">Transport Fee (Monthly)</option>
                  <option value="Computer & Science Lab Fee">Computer & Science Lab Fee</option>
                  <option value="Annual Development">Annual Development Charge</option>
                  <option value="Exam Fee">Term Examination Fee</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    className="search-input"
                    value={newBillData.amount}
                    onChange={(e) => setNewBillData({ ...newBillData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    className="search-input"
                    value={newBillData.due_date}
                    onChange={(e) => setNewBillData({ ...newBillData, due_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Remarks</label>
                <input
                  type="text"
                  className="search-input"
                  value={newBillData.remarks}
                  onChange={(e) => setNewBillData({ ...newBillData, remarks: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewBillModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate Fee Invoices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Fee Receipt Printable Modal */}
      {isReceiptModalOpen && selectedFee && (
        <div className="modal-backdrop" onClick={() => setIsReceiptModalOpen(false)}>
          <div 
            className="modal-box fee-receipt-printable-box" 
            style={{ maxWidth: '540px', padding: '0', overflow: 'hidden' }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Controls */}
            <div className="no-print" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px 20px', 
              background: '#f1f5f9',
              borderBottom: '1px solid var(--border)'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Official Fee Receipt Preview
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                  onClick={() => window.print()}
                >
                  <Printer size={14} style={{ marginRight: '6px' }} />
                  Print Receipt
                </button>
                <button 
                  onClick={() => setIsReceiptModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper */}
            <div className="receipt-paper" style={{
              padding: '30px',
              background: '#ffffff',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: '#0f172a'
            }}>
              {/* Receipt Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                  <School size={22} color="#4f46e5" />
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Vidya Mandir Sr. Sec. School
                  </h2>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                  Sector 14, Urban Estate, Gurugram, Haryana - 122001
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Affiliated to CBSE, New Delhi • School Code: 20491
                </div>
                <div style={{
                  display: 'inline-block',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  padding: '2px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  marginTop: '8px',
                  textTransform: 'uppercase'
                }}>
                  Official Fee Receipt
                </div>
              </div>

              {/* Receipt Metadata */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '16px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                <div>
                  <div>Receipt No: <strong style={{ color: '#4f46e5' }}>{selectedFee.receipt_number || 'VM-REC-994821'}</strong></div>
                  <div style={{ marginTop: '2px' }}>Date: <strong>{selectedFee.paid_date || new Date().toISOString().split('T')[0]}</strong></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Academic Year: <strong>2026 - 2027</strong></div>
                  <div style={{ marginTop: '2px' }}>Payment Mode: <strong style={{ color: '#16a34a' }}>{selectedFee.payment_mode || 'Cash'}</strong></div>
                </div>
              </div>

              {/* Student Details */}
              <div style={{ fontSize: '0.8rem', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>Student Name: <strong>{selectedFee.student_name}</strong></div>
                  <div>Class & Section: <strong>{selectedFee.class_label}</strong></div>
                  <div>Roll Number: <strong>{selectedFee.roll_number}</strong></div>
                  <div>Parent Name: <strong>{selectedFee.parent_name || 'N/A'}</strong></div>
                </div>
              </div>

              {/* Fee Breakdown Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Fee Description</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ fontWeight: 600 }}>{selectedFee.fee_type}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{selectedFee.remarks || 'Term fees cleared'}</div>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(selectedFee.amount)}
                    </td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #0f172a', background: '#fafafa' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 800 }}>TOTAL RECEIVED</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem', color: '#047857' }}>
                      {formatCurrency(selectedFee.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Stamp and Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '28px', paddingTop: '10px' }}>
                <div style={{
                  border: '2px solid #16a34a',
                  color: '#16a34a',
                  padding: '4px 14px',
                  borderRadius: '6px',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  letterSpacing: '0.08em',
                  transform: 'rotate(-5deg)',
                  display: 'inline-block'
                }}>
                  PAID & VERIFIED
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Brush Script MT', cursive", fontSize: '1.1rem', color: '#1e1b4b' }}>
                    Rajesh K.
                  </div>
                  <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>
                    Cashier / Accounts Officer
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Specific CSS for Fee Receipt */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-paper, .receipt-paper * {
            visibility: visible;
          }
          .receipt-paper {
            position: absolute;
            left: 50%;
            top: 40px;
            transform: translateX(-50%);
            width: 500px;
            box-shadow: none !important;
            border: 1px solid #cbd5e1;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
