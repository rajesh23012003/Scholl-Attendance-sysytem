const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static frontend assets if built
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// Helper: Get local date string YYYY-MM-DD
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// -------------------------------------------------------------
// 1. STATS & OVERVIEW API
// -------------------------------------------------------------
app.get('/api/stats/overview', (req, res) => {
  try {
    const today = req.query.date || getTodayString();

    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
    const totalClasses = db.prepare('SELECT COUNT(*) as count FROM classes').get().count;

    // Today's attendance counts
    const todayRecords = db.prepare(`
      SELECT 
        status, 
        COUNT(*) as count 
      FROM attendance 
      WHERE date = ? 
      GROUP BY status
    `).all(today);

    let present = 0, absent = 0, late = 0, excused = 0;
    for (const r of todayRecords) {
      if (r.status === 'Present') present = r.count;
      if (r.status === 'Absent') absent = r.count;
      if (r.status === 'Late') late = r.count;
      if (r.status === 'Excused') excused = r.count;
    }
    const totalMarked = present + absent + late + excused;
    const attendancePercentage = totalMarked > 0 ? Math.round(((present + late) / totalMarked) * 100) : 0;

    // Class-wise today breakdown
    const classBreakdown = db.prepare(`
      SELECT 
        c.id, 
        c.name || ' - ' || c.section AS class_label,
        COUNT(s.id) AS total_students,
        COUNT(CASE WHEN a.status = 'Present' THEN 1 END) AS present_count,
        COUNT(CASE WHEN a.status = 'Absent' THEN 1 END) AS absent_count,
        COUNT(CASE WHEN a.status = 'Late' THEN 1 END) AS late_count,
        COUNT(CASE WHEN a.status = 'Excused' THEN 1 END) AS excused_count
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
      GROUP BY c.id
    `).all(today);

    // 7-day attendance history
    const recentHistory = db.prepare(`
      SELECT 
        date,
        COUNT(CASE WHEN status IN ('Present', 'Late') THEN 1 END) as attended,
        COUNT(*) as total,
        ROUND((CAST(COUNT(CASE WHEN status IN ('Present', 'Late') THEN 1 END) AS FLOAT) / COUNT(*)) * 100) as rate
      FROM attendance
      GROUP BY date
      ORDER BY date DESC
      LIMIT 7
    `).all().reverse();

    // Students with low attendance (< 75%)
    const lowAttendanceStudents = db.prepare(`
      SELECT 
        s.id,
        s.roll_number,
        s.first_name || ' ' || s.last_name AS name,
        c.name || ' - ' || c.section AS class_label,
        s.parent_phone,
        COUNT(a.id) AS total_days,
        COUNT(CASE WHEN a.status IN ('Present', 'Late') THEN 1 END) AS attended_days,
        ROUND((CAST(COUNT(CASE WHEN a.status IN ('Present', 'Late') THEN 1 END) AS FLOAT) / NULLIF(COUNT(a.id), 0)) * 100, 1) AS attendance_rate
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN attendance a ON a.student_id = s.id
      GROUP BY s.id
      HAVING total_days > 0 AND attendance_rate < 75.0
      ORDER BY attendance_rate ASC
      LIMIT 5
    `).all();

    res.json({
      success: true,
      data: {
        date: today,
        totalStudents,
        totalClasses,
        todayStats: {
          totalMarked,
          present,
          absent,
          late,
          excused,
          percentage: attendancePercentage
        },
        classBreakdown,
        recentHistory,
        lowAttendanceStudents
      }
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 2. CLASSES API
// -------------------------------------------------------------
app.get('/api/classes', (req, res) => {
  try {
    const classes = db.prepare(`
      SELECT 
        c.*, 
        COUNT(s.id) AS student_count
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      GROUP BY c.id
      ORDER BY c.name, c.section
    `).all();
    res.json({ success: true, data: classes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/classes', (req, res) => {
  try {
    const { name, section, room_number, class_teacher } = req.body;
    if (!name || !section) {
      return res.status(400).json({ success: false, message: 'Class name and section are required.' });
    }
    const stmt = db.prepare(`
      INSERT INTO classes (name, section, room_number, class_teacher)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(name.trim(), section.trim().toUpperCase(), room_number || '', class_teacher || '');
    res.status(201).json({ success: true, data: { id: info.lastInsertRowid, name, section, room_number, class_teacher } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 3. STUDENTS API
// -------------------------------------------------------------
app.get('/api/students', (req, res) => {
  try {
    const { class_id, search } = req.query;
    let query = `
      SELECT 
        s.*,
        c.name AS class_name,
        c.section AS class_section,
        c.name || ' - ' || c.section AS class_label,
        COUNT(a.id) AS total_marked_days,
        COUNT(CASE WHEN a.status IN ('Present', 'Late') THEN 1 END) AS attended_days,
        ROUND((CAST(COUNT(CASE WHEN a.status IN ('Present', 'Late') THEN 1 END) AS FLOAT) / NULLIF(COUNT(a.id), 0)) * 100, 1) AS attendance_rate
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN attendance a ON a.student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(class_id);
    }
    if (search) {
      query += ` AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.roll_number LIKE ? OR s.parent_phone LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ` GROUP BY s.id ORDER BY c.name, c.section, CAST(s.roll_number AS INT), s.roll_number`;

    const students = db.prepare(query).all(...params);
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/students', (req, res) => {
  try {
    const { roll_number, first_name, last_name, gender, class_id, parent_name, parent_phone, email, dob, address } = req.body;
    if (!roll_number || !first_name || !last_name || !class_id) {
      return res.status(400).json({ success: false, message: 'Roll Number, First Name, Last Name, and Class are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO students (roll_number, first_name, last_name, gender, class_id, parent_name, parent_phone, email, dob, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      roll_number.trim(),
      first_name.trim(),
      last_name.trim(),
      gender || 'Male',
      Number(class_id),
      parent_name || '',
      parent_phone || '',
      email || '',
      dob || '',
      address || ''
    );
    res.status(201).json({ success: true, data: { id: info.lastInsertRowid, ...req.body } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/students/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { roll_number, first_name, last_name, gender, class_id, parent_name, parent_phone, email, dob, address } = req.body;

    const stmt = db.prepare(`
      UPDATE students 
      SET roll_number = ?, first_name = ?, last_name = ?, gender = ?, class_id = ?, parent_name = ?, parent_phone = ?, email = ?, dob = ?, address = ?
      WHERE id = ?
    `);
    stmt.run(
      roll_number.trim(),
      first_name.trim(),
      last_name.trim(),
      gender || 'Male',
      Number(class_id),
      parent_name || '',
      parent_phone || '',
      email || '',
      dob || '',
      address || '',
      id
    );
    res.json({ success: true, message: 'Student updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/students/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM students WHERE id = ?').run(id);
    res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 4. ATTENDANCE MARKING & RETRIEVAL API
// -------------------------------------------------------------
app.get('/api/attendance', (req, res) => {
  try {
    const { date, class_id } = req.query;
    if (!class_id) {
      return res.status(400).json({ success: false, message: 'class_id query parameter is required.' });
    }
    const targetDate = date || getTodayString();

    // Fetch all students in the class with existing attendance status for this date
    const studentsWithAttendance = db.prepare(`
      SELECT 
        s.id AS student_id,
        s.roll_number,
        s.first_name,
        s.last_name,
        s.gender,
        s.parent_phone,
        COALESCE(a.status, 'Present') AS status,
        COALESCE(a.remarks, '') AS remarks,
        a.id AS attendance_id,
        CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END AS is_already_marked
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
      WHERE s.class_id = ?
      ORDER BY CAST(s.roll_number AS INT), s.roll_number
    `).all(targetDate, Number(class_id));

    res.json({
      success: true,
      data: {
        date: targetDate,
        class_id: Number(class_id),
        records: studentsWithAttendance
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/attendance', (req, res) => {
  try {
    const { date, class_id, records } = req.body;
    if (!date || !class_id || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'date, class_id and records array are required.' });
    }

    const upsertStmt = db.prepare(`
      INSERT INTO attendance (student_id, class_id, date, status, remarks)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(student_id, date) DO UPDATE SET
        status = excluded.status,
        remarks = excluded.remarks,
        recorded_at = CURRENT_TIMESTAMP
    `);

    db.exec('BEGIN TRANSACTION');
    try {
      for (const rec of records) {
        upsertStmt.run(rec.student_id, Number(class_id), date, rec.status, rec.remarks || '');
      }
      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    res.json({ success: true, message: `Attendance saved successfully for ${records.length} students on ${date}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 5. MONTHLY REPORT & MATRIX API
// -------------------------------------------------------------
app.get('/api/reports/monthly', (req, res) => {
  try {
    const { month, class_id } = req.query; // format YYYY-MM
    const currentMonth = month || getTodayString().substring(0, 7);

    let query = `
      SELECT 
        s.id AS student_id,
        s.roll_number,
        s.first_name || ' ' || s.last_name AS student_name,
        s.gender,
        c.name || ' - ' || c.section AS class_label,
        a.date,
        a.status
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.date LIKE ?
      WHERE 1=1
    `;
    const params = [`${currentMonth}%`];

    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(Number(class_id));
    }
    query += ` ORDER BY c.name, c.section, CAST(s.roll_number AS INT), s.roll_number, a.date`;

    const rawRecords = db.prepare(query).all(...params);

    // Group by student
    const studentMap = {};
    for (const r of rawRecords) {
      if (!studentMap[r.student_id]) {
        studentMap[r.student_id] = {
          student_id: r.student_id,
          roll_number: r.roll_number,
          student_name: r.student_name,
          gender: r.gender,
          class_label: r.class_label,
          daily_status: {},
          present_days: 0,
          absent_days: 0,
          late_days: 0,
          excused_days: 0,
          total_recorded: 0
        };
      }
      if (r.date && r.status) {
        studentMap[r.student_id].daily_status[r.date] = r.status;
        studentMap[r.student_id].total_recorded++;
        if (r.status === 'Present') studentMap[r.student_id].present_days++;
        if (r.status === 'Absent') studentMap[r.student_id].absent_days++;
        if (r.status === 'Late') studentMap[r.student_id].late_days++;
        if (r.status === 'Excused') studentMap[r.student_id].excused_days++;
      }
    }

    const students = Object.values(studentMap).map(s => {
      const attended = s.present_days + s.late_days;
      const percentage = s.total_recorded > 0 ? Math.round((attended / s.total_recorded) * 100) : 0;
      return { ...s, percentage };
    });

    res.json({
      success: true,
      data: {
        month: currentMonth,
        class_id: class_id ? Number(class_id) : null,
        students
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 6. CSV EXPORT API
// -------------------------------------------------------------
app.get('/api/reports/export-csv', (req, res) => {
  try {
    const { date, class_id } = req.query;
    const targetDate = date || getTodayString();

    let query = `
      SELECT 
        s.roll_number,
        s.first_name,
        s.last_name,
        c.name || ' - ' || c.section AS class_name,
        COALESCE(a.status, 'Unmarked') AS status,
        COALESCE(a.remarks, '') AS remarks
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
      WHERE 1=1
    `;
    const params = [targetDate];
    if (class_id) {
      query += ` AND s.class_id = ?`;
      params.push(Number(class_id));
    }
    query += ` ORDER BY c.name, c.section, CAST(s.roll_number AS INT)`;

    const records = db.prepare(query).all(...params);

    let csv = 'Roll No,Student Name,Class,Status,Remarks,Date\r\n';
    for (const r of records) {
      csv += `"${r.roll_number}","${r.first_name} ${r.last_name}","${r.class_name}","${r.status}","${r.remarks}","${targetDate}"\r\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${targetDate}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 7. ABSENT ALERT & WHATSAPP NOTIFICATION API (FEATURE 1)
// -------------------------------------------------------------
app.get('/api/alerts/absent', (req, res) => {
  try {
    const { date, class_id } = req.query;
    const targetDate = date || getTodayString();

    let query = `
      SELECT 
        s.id AS student_id,
        s.roll_number,
        s.first_name,
        s.last_name,
        s.parent_name,
        s.parent_phone,
        c.name || ' - ' || c.section AS class_label,
        a.status,
        a.remarks
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      JOIN classes c ON c.id = a.class_id
      WHERE a.date = ? AND a.status IN ('Absent', 'Late')
    `;
    const params = [targetDate];
    if (class_id) {
      query += ` AND a.class_id = ?`;
      params.push(Number(class_id));
    }
    query += ` ORDER BY c.name, c.section, CAST(s.roll_number AS INT)`;

    const rawRecords = db.prepare(query).all(...params);

    const alerts = rawRecords.map(r => {
      const parentGreeting = r.parent_name ? `Namaste ${r.parent_name}` : 'Dear Parent';
      const studentName = `${r.first_name} ${r.last_name}`;
      const msg = `${parentGreeting}, this is an official alert from Vidya Mandir School. Your ward ${studentName} (Roll #${r.roll_number}, ${r.class_label}) has been marked ${r.status.toUpperCase()} today (${targetDate}). ${r.remarks ? `Note: ${r.remarks}. ` : ''}If this absence was unplanned, please contact the school administration.`;
      
      const cleanPhone = (r.parent_phone || '').replace(/[^0-9]/g, '');
      const whatsappUrl = cleanPhone 
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` 
        : null;

      return {
        ...r,
        message_text: msg,
        clean_phone: cleanPhone,
        whatsapp_url: whatsappUrl
      };
    });

    res.json({
      success: true,
      data: {
        date: targetDate,
        total_alerts: alerts.length,
        alerts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 8. LEAVE APPLICATION & APPROVAL API (FEATURE 4)
// -------------------------------------------------------------
app.get('/api/leaves/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM leave_applications').get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'Pending'").get().count;
    const approved = db.prepare("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'Approved'").get().count;
    const rejected = db.prepare("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'Rejected'").get().count;
    res.json({ success: true, data: { total, pending, approved, rejected } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/leaves', (req, res) => {
  try {
    const { status, class_id } = req.query;
    let query = `
      SELECT 
        l.*,
        s.roll_number,
        s.first_name || ' ' || s.last_name AS student_name,
        s.gender,
        s.parent_phone,
        c.name || ' - ' || c.section AS class_label
      FROM leave_applications l
      JOIN students s ON s.id = l.student_id
      JOIN classes c ON c.id = l.class_id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      query += ` AND l.status = ?`;
      params.push(status);
    }
    if (class_id) {
      query += ` AND l.class_id = ?`;
      params.push(Number(class_id));
    }
    query += ` ORDER BY l.id DESC`;

    const leaves = db.prepare(query).all(...params);
    res.json({ success: true, data: leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/leaves', (req, res) => {
  try {
    const { student_id, leave_type, start_date, end_date, reason, applied_by } = req.body;
    if (!student_id || !leave_type || !start_date || !end_date || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide all required leave fields.' });
    }

    const student = db.prepare('SELECT class_id FROM students WHERE id = ?').get(student_id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const stmt = db.prepare(`
      INSERT INTO leave_applications (student_id, class_id, leave_type, start_date, end_date, reason, status, applied_by)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)
    `);
    const info = stmt.run(
      Number(student_id),
      student.class_id,
      leave_type,
      start_date,
      end_date,
      reason.trim(),
      applied_by || 'Parent'
    );

    res.status(201).json({ success: true, message: 'Leave application submitted successfully.', leave_id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/leaves/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, teacher_notes } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const leave = db.prepare('SELECT * FROM leave_applications WHERE id = ?').get(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave application not found.' });
    }

    db.prepare(`
      UPDATE leave_applications
      SET status = ?, teacher_notes = ?
      WHERE id = ?
    `).run(status, teacher_notes || '', id);

    // If approved, automatically record/mark 'Excused' attendance for all dates in range!
    if (status === 'Approved') {
      const upsertAttendance = db.prepare(`
        INSERT INTO attendance (student_id, class_id, date, status, remarks)
        VALUES (?, ?, ?, 'Excused', ?)
        ON CONFLICT(student_id, date) DO UPDATE SET
          status = 'Excused',
          remarks = excluded.remarks,
          recorded_at = CURRENT_TIMESTAMP
      `);

      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const curr = new Date(start);

      while (curr <= end) {
        if (curr.getDay() !== 0) { // skip Sundays
          const dateStr = curr.toISOString().split('T')[0];
          upsertAttendance.run(
            leave.student_id,
            leave.class_id,
            dateStr,
            `Leave Approved (${leave.leave_type}): ${leave.reason}`
          );
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    res.json({ success: true, message: `Leave application ${status.toLowerCase()} successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/leaves/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM leave_applications WHERE id = ?').run(id);
    res.json({ success: true, message: 'Leave application deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Fallback route for SPA
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`School Attendance API running on http://localhost:${PORT}`);
});
