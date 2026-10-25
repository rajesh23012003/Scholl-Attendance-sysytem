import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Printer, 
  Search, 
  Filter, 
  Download, 
  School, 
  Phone, 
  Calendar, 
  MapPin, 
  User, 
  ShieldCheck, 
  RefreshCw,
  QrCode,
  Sparkles
} from 'lucide-react';

export default function IdCards({ classes = [] }) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [cardSide, setCardSide] = useState('front'); // 'front' or 'back'

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes]);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId);
    }
  }, [selectedClassId]);

  const fetchStudents = async (classId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students?class_id=${classId}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data || []);
        if (data.data.length > 0) {
          setSelectedStudent(data.data[0]);
        } else {
          setSelectedStudent(null);
        }
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(st => {
    const fullName = `${st.first_name} ${st.last_name}`.toLowerCase();
    const roll = st.roll_number.toLowerCase();
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || roll.includes(term);
  });

  const handlePrint = () => {
    window.print();
  };

  const currentClassObj = classes.find(c => String(c.id) === String(selectedClassId));

  return (
    <div className="id-cards-container">
      {/* Action Header */}
      <div className="header-actions no-print" style={{ marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={24} color="var(--primary)" />
            Student ID Card Generator & Printing
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Generate standard high-definition student identification badges with barcodes, QR code, and print preview.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-primary"
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={16} />
            <span>Print ID Card</span>
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="filter-card no-print" style={{ 
        background: 'var(--bg-card)', 
        padding: '16px 20px', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--border)',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Filter by Student
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

        {/* Card Side Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setCardSide('front')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: cardSide === 'front' ? '#fff' : 'transparent',
              color: cardSide === 'front' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.8rem',
              boxShadow: cardSide === 'front' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer'
            }}
          >
            Front Side
          </button>
          <button
            onClick={() => setCardSide('back')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: cardSide === 'back' ? '#fff' : 'transparent',
              color: cardSide === 'back' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.8rem',
              boxShadow: cardSide === 'back' ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer'
            }}
          >
            Back Side (Rules & Contact)
          </button>
        </div>
      </div>

      {/* Main Studio View: Student Selector + ID Card Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Student List Sidebar */}
        <div className="no-print" style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '16px',
          maxHeight: '620px',
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Students in Class ({filteredStudents.length})</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Click to preview</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              Loading students...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No students found in this section.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredStudents.map(st => {
                const isSelected = selectedStudent?.id === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudent(st)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--primary-light)' : '#f8fafc',
                      border: `1.5px solid ${isSelected ? 'var(--primary-border)' : 'transparent'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isSelected ? 'var(--primary)' : '#cbd5e1',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {st.roll_number}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {st.first_name} {st.last_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {st.gender} • {st.parent_phone}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Printable ID Card Container */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {selectedStudent ? (
            <div className="id-card-printable-wrapper" style={{ margin: '10px 0' }}>
              {/* ID Card Front */}
              {cardSide === 'front' ? (
                <div className="id-card-front" style={{
                  width: '340px',
                  height: '520px',
                  borderRadius: '16px',
                  background: '#ffffff',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}>
                  {/* Card Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
                    color: '#fff',
                    padding: '16px 12px 14px',
                    textAlign: 'center',
                    borderBottom: '3px solid #fbbf24'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <School size={16} color="#1e1b4b" />
                      </div>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Vidya Mandir School
                      </span>
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      CBSE Affiliated • Gurugram, Haryana
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fbbf24', marginTop: '4px' }}>
                      ACADEMIC YEAR 2026 - 2027
                    </div>
                  </div>

                  {/* Photo & Identity Section */}
                  <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Student Avatar / Photo Box */}
                    <div style={{
                      width: '104px',
                      height: '116px',
                      borderRadius: '12px',
                      border: '3px solid #4f46e5',
                      boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)',
                      background: selectedStudent.gender === 'Female' ? 'linear-gradient(135deg, #fbcfe8, #f472b6)' : 'linear-gradient(135deg, #c7d2fe, #818cf8)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      marginBottom: '12px',
                      position: 'relative'
                    }}>
                      <User size={54} color="#ffffff" />
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        background: 'rgba(0,0,0,0.4)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        ROLL #{selectedStudent.roll_number}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        {selectedStudent.first_name} {selectedStudent.last_name}
                      </h3>
                      <div style={{ 
                        display: 'inline-block',
                        background: '#e0e7ff', 
                        color: '#4338ca', 
                        padding: '3px 12px', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        marginTop: '4px' 
                      }}>
                        {currentClassObj ? `${currentClassObj.name} • Section ${currentClassObj.section}` : 'Student'}
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div style={{ width: '100%', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '4px' }}>
                        <span style={{ color: '#64748b' }}>Father's Name:</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{selectedStudent.parent_name || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '4px' }}>
                        <span style={{ color: '#64748b' }}>Emergency Phone:</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{selectedStudent.parent_phone}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '4px' }}>
                        <span style={{ color: '#64748b' }}>Date of Birth:</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{selectedStudent.dob || '2010-05-15'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '4px' }}>
                        <span style={{ color: '#64748b' }}>Blood Group:</span>
                        <span style={{ fontWeight: 700, color: '#dc2626' }}>O +ve</span>
                      </div>
                    </div>

                    {/* QR Code and Barcode footer */}
                    <div style={{
                      marginTop: 'auto',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '8px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        {/* Simulated Barcode */}
                        <div style={{ display: 'flex', gap: '2px', height: '22px', alignItems: 'flex-end', opacity: 0.85 }}>
                          {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 3, 1, 4, 2, 1].map((w, i) => (
                            <div key={i} style={{ width: `${w}px`, height: '100%', background: '#0f172a' }} />
                          ))}
                        </div>
                        <div style={{ fontSize: '0.58rem', color: '#64748b', letterSpacing: '0.1em', marginTop: '2px' }}>
                          VM-{currentClassObj?.name.replace('Class ', 'C')}-{selectedStudent.roll_number}
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontFamily: "'Brush Script MT', cursive, sans-serif",
                          fontSize: '1rem',
                          color: '#1e1b4b',
                          transform: 'rotate(-4deg)'
                        }}>
                          A. Verma
                        </div>
                        <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#64748b', borderTop: '1px solid #94a3b8', paddingTop: '2px' }}>
                          Principal Sign
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Color Strip Bottom */}
                  <div style={{ height: '8px', background: 'linear-gradient(90deg, #4f46e5, #06b6d4, #10b981)' }} />
                </div>
              ) : (
                /* ID Card Back */
                <div className="id-card-back" style={{
                  width: '340px',
                  height: '520px',
                  borderRadius: '16px',
                  background: '#ffffff',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '24px 20px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e1b4b', textTransform: 'uppercase' }}>
                      Instructions & Terms
                    </h4>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Vidya Mandir School Identity Pass</span>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <p style={{ margin: 0 }}>
                      1. This card is valid only for the academic session <strong>2026-2027</strong> and must be worn inside school premises.
                    </p>
                    <p style={{ margin: 0 }}>
                      2. If found lost, please return to the school administration office or contact the school helpline.
                    </p>
                    <p style={{ margin: 0 }}>
                      3. Non-transferable. Misuse of this card will result in disciplinary action.
                    </p>
                    <p style={{ margin: 0 }}>
                      4. Library and sports laboratory access requires scanning this card at entrance.
                    </p>

                    <div style={{
                      marginTop: '10px',
                      background: '#f8fafc',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.7rem'
                    }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Address & Contact:</div>
                      <div>{selectedStudent.address || 'Sector 14, Urban Estate, Gurugram, HR - 122001'}</div>
                      <div style={{ marginTop: '4px', color: '#4f46e5', fontWeight: 600 }}>Helpline: +91 124 2345678 / info@vidyamandir.edu</div>
                    </div>
                  </div>

                  {/* QR Code Scannable Simulation */}
                  <div style={{
                    marginTop: 'auto',
                    borderTop: '1px dashed #cbd5e1',
                    paddingTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '4px',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <QrCode size={44} color="#1e293b" />
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '0.62rem', color: '#64748b' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>VALID TILL: 31-MAR-2027</div>
                      <div>Scan to verify student status</div>
                      <div style={{ color: '#10b981', fontWeight: 700, marginTop: '2px' }}>● Official Student Record</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '40px', color: 'var(--text-muted)' }}>
              Select a student to generate ID card
            </div>
          )}
        </div>
      </div>

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .id-card-printable-wrapper, .id-card-printable-wrapper * {
            visibility: visible;
          }
          .id-card-printable-wrapper {
            position: absolute;
            left: 50%;
            top: 50px;
            transform: translateX(-50%);
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
