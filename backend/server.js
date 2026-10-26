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

// -------------------------------------------------------------
// 7. AUTHENTICATION API
// -------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required.' });
    }

    const user = db.prepare('SELECT id, username, name, role, email, phone, class_id, password FROM users WHERE username = ?').get(username.trim());
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your username or password.' });
    }

    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser, token: `simulated-token-${user.id}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/auth/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, name, role, email, phone, class_id, created_at FROM users').all();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 8. TIMETABLE API
// -------------------------------------------------------------
app.get('/api/timetable', (req, res) => {
  try {
    const { class_id } = req.query;
    let query = `
      SELECT t.*, c.name || ' - ' || c.section AS class_label
      FROM timetable t
      JOIN classes c ON t.class_id = c.id
    `;
    const params = [];

    if (class_id) {
      query += ` WHERE t.class_id = ?`;
      params.push(class_id);
    }

    query += ` ORDER BY 
      CASE t.day_of_week
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        WHEN 'Saturday' THEN 6
      END,
      t.period_number ASC`;

    const timetable = db.prepare(query).all(...params);
    res.json({ success: true, data: timetable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/timetable', (req, res) => {
  try {
    const { class_id, day_of_week, period_number, start_time, end_time, subject, teacher_name, room_number } = req.body;
    if (!class_id || !day_of_week || !period_number || !subject) {
      return res.status(400).json({ success: false, message: 'Missing required timetable slot fields.' });
    }

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO timetable (class_id, day_of_week, period_number, start_time, end_time, subject, teacher_name, room_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(class_id, day_of_week, period_number, start_time, end_time, subject, teacher_name || '', room_number || '');
    res.json({ success: true, message: 'Timetable slot saved successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/timetable/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM timetable WHERE id = ?').run(id);
    res.json({ success: true, message: 'Slot deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 9. FEES & RECEIPTS API
// -------------------------------------------------------------
app.get('/api/fees', (req, res) => {
  try {
    const { class_id, status, search } = req.query;
    let query = `
      SELECT 
        f.*,
        s.first_name || ' ' || s.last_name AS student_name,
        s.roll_number,
        s.parent_name,
        s.parent_phone,
        c.name || ' - ' || c.section AS class_label
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN classes c ON f.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (class_id) {
      query += ` AND f.class_id = ?`;
      params.push(class_id);
    }

    if (status) {
      query += ` AND f.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.roll_number LIKE ? OR f.fee_type LIKE ? OR f.receipt_number LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    query += ` ORDER BY f.due_date DESC, f.id DESC`;

    const fees = db.prepare(query).all(...params);
    res.json({ success: true, data: fees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/fees/stats', (req, res) => {
  try {
    const totalCollected = db.prepare(`SELECT SUM(amount) as total FROM fees WHERE status = 'Paid'`).get().total || 0;
    const totalPending = db.prepare(`SELECT SUM(amount) as total FROM fees WHERE status = 'Pending'`).get().total || 0;
    const totalOverdue = db.prepare(`SELECT SUM(amount) as total FROM fees WHERE status = 'Overdue'`).get().total || 0;
    
    const countPaid = db.prepare(`SELECT COUNT(*) as count FROM fees WHERE status = 'Paid'`).get().count;
    const countPending = db.prepare(`SELECT COUNT(*) as count FROM fees WHERE status = 'Pending'`).get().count;
    const countOverdue = db.prepare(`SELECT COUNT(*) as count FROM fees WHERE status = 'Overdue'`).get().count;

    res.json({
      success: true,
      data: {
        totalCollected,
        totalPending,
        totalOverdue,
        countPaid,
        countPending,
        countOverdue,
        totalTransactions: countPaid + countPending + countOverdue
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/fees', (req, res) => {
  try {
    const { student_id, class_id, fee_type, amount, due_date, remarks } = req.body;
    if (!class_id || !fee_type || !amount || !due_date) {
      return res.status(400).json({ success: false, message: 'Class, fee type, amount, and due date are required.' });
    }

    const insertFee = db.prepare(`
      INSERT INTO fees (student_id, class_id, fee_type, amount, due_date, status, remarks)
      VALUES (?, ?, ?, ?, ?, 'Pending', ?)
    `);

    if (student_id) {
      insertFee.run(student_id, class_id, fee_type, amount, due_date, remarks || '');
      res.json({ success: true, message: 'Fee record created successfully.' });
    } else {
      const students = db.prepare('SELECT id FROM students WHERE class_id = ?').all(class_id);
      for (const st of students) {
        insertFee.run(st.id, class_id, fee_type, amount, due_date, remarks || '');
      }
      res.json({ success: true, message: `Fee records generated for all ${students.length} students in class.` });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/fees/:id/pay', (req, res) => {
  try {
    const { id } = req.params;
    const { payment_mode, remarks, paid_date } = req.body;

    const receiptNumber = `VM-REC-${Date.now().toString().slice(-6)}`;
    const paymentDate = paid_date || getTodayString();

    const stmt = db.prepare(`
      UPDATE fees 
      SET status = 'Paid',
          paid_date = ?,
          payment_mode = ?,
          receipt_number = ?,
          remarks = COALESCE(?, remarks)
      WHERE id = ?
    `);

    stmt.run(paymentDate, payment_mode || 'Cash', receiptNumber, remarks || null, id);

    const updated = db.prepare(`
      SELECT f.*, s.first_name || ' ' || s.last_name AS student_name, s.roll_number, c.name || ' - ' || c.section AS class_label
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN classes c ON f.class_id = c.id
      WHERE f.id = ?
    `).get(id);

    res.json({ success: true, message: 'Payment recorded successfully.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// 10. EXAMINATIONS & REPORT CARDS API
// -------------------------------------------------------------
function calculateGrade(percentage) {
  if (percentage >= 91) return 'A1';
  if (percentage >= 81) return 'A2';
  if (percentage >= 71) return 'B1';
  if (percentage >= 61) return 'B2';
  if (percentage >= 51) return 'C1';
  if (percentage >= 41) return 'C2';
  if (percentage >= 33) return 'D';
  return 'E';
}

app.get('/api/exams', (req, res) => {
  try {
    const exams = db.prepare('SELECT * FROM exams ORDER BY id ASC').all();
    res.json({ success: true, data: exams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/exams/:id/classes/:class_id', (req, res) => {
  try {
    const { id: exam_id, class_id } = req.params;

    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(exam_id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const students = db.prepare(`
      SELECT s.id, s.roll_number, s.first_name || ' ' || s.last_name AS name, s.gender, s.parent_name
      FROM students s
      WHERE s.class_id = ?
      ORDER BY CAST(s.roll_number AS INTEGER) ASC
    `).all(class_id);

    const allMarks = db.prepare(`
      SELECT m.*
      FROM marks m
      WHERE m.exam_id = ? AND m.class_id = ?
    `).all(exam_id, class_id);

    // Group marks by student and calculate aggregates
    const studentResults = students.map(st => {
      const stMarks = allMarks.filter(m => m.student_id === st.id);
      const totalMarksObtained = stMarks.reduce((sum, m) => sum + m.total_marks, 0);
      const totalMaxMarks = stMarks.reduce((sum, m) => sum + m.max_marks, 0);
      const percentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 1000) / 10 : 0;
      const overallGrade = calculateGrade(percentage);

      return {
        student_id: st.id,
        roll_number: st.roll_number,
        name: st.name,
        gender: st.gender,
        parent_name: st.parent_name,
        subjects: stMarks,
        totalMarksObtained,
        totalMaxMarks,
        percentage,
        overallGrade,
        passed: percentage >= 33.0
      };
    });

    // Sort by percentage descending to compute Class Rank
    studentResults.sort((a, b) => b.percentage - a.percentage);
    studentResults.forEach((st, idx) => {
      st.rank = idx + 1;
    });

    // Re-sort by roll_number for standard display
    const sortedByRoll = [...studentResults].sort((a, b) => parseInt(a.roll_number) - parseInt(b.roll_number));

    // Stats
    const totalAppeared = studentResults.length;
    const passedCount = studentResults.filter(s => s.passed).length;
    const passRate = totalAppeared > 0 ? Math.round((passedCount / totalAppeared) * 100) : 0;
    const avgPercentage = totalAppeared > 0 ? Math.round((studentResults.reduce((sum, s) => sum + s.percentage, 0) / totalAppeared) * 10) / 10 : 0;
    const highestPercentage = totalAppeared > 0 ? Math.max(...studentResults.map(s => s.percentage)) : 0;

    res.json({
      success: true,
      data: {
        exam,
        stats: {
          totalAppeared,
          passRate,
          avgPercentage,
          highestPercentage,
          topper: studentResults[0] || null
        },
        students: sortedByRoll,
        leaderboard: studentResults.slice(0, 3)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/reports/report-card', (req, res) => {
  try {
    const { exam_id, student_id } = req.query;
    if (!exam_id || !student_id) {
      return res.status(400).json({ success: false, message: 'exam_id and student_id required.' });
    }

    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(exam_id);
    const student = db.prepare(`
      SELECT s.*, c.name || ' - ' || c.section AS class_label, c.class_teacher, c.room_number
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `).get(student_id);

    if (!exam || !student) {
      return res.status(404).json({ success: false, message: 'Exam or student not found' });
    }

    const marks = db.prepare(`
      SELECT * FROM marks
      WHERE exam_id = ? AND student_id = ?
      ORDER BY id ASC
    `).all(exam_id, student_id);

    // Compute class rank for student
    const classmatesMarks = db.prepare(`
      SELECT student_id, SUM(total_marks) as total
      FROM marks
      WHERE exam_id = ? AND class_id = ?
      GROUP BY student_id
      ORDER BY total DESC
    `).all(exam_id, student.class_id);

    let rank = 1;
    classmatesMarks.forEach((cm, i) => {
      if (cm.student_id === parseInt(student_id)) {
        rank = i + 1;
      }
    });

    // Attendance stats for student
    const attStats = db.prepare(`
      SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN status IN ('Present', 'Late') THEN 1 END) as attended
      FROM attendance
      WHERE student_id = ?
    `).get(student_id);

    const attendanceRate = attStats.total_days > 0 
      ? Math.round((attStats.attended / attStats.total_days) * 100)
      : 94;

    const totalObtained = marks.reduce((acc, m) => acc + m.total_marks, 0);
    const totalMax = marks.reduce((acc, m) => acc + m.max_marks, 0);
    const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
    const overallGrade = calculateGrade(percentage);

    res.json({
      success: true,
      data: {
        exam,
        student,
        marks,
        summary: {
          totalObtained,
          totalMax,
          percentage,
          overallGrade,
          rank,
          totalInClass: classmatesMarks.length,
          attendanceRate,
          result: percentage >= 33 ? (percentage >= 75 ? 'PASSED WITH DISTINCTION' : 'PASSED') : 'ESSENTIAL REPEAT'
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/marks', (req, res) => {
  try {
    const { exam_id, student_id, class_id, subject, theory_marks, practical_marks, remarks } = req.body;
    if (!exam_id || !student_id || !class_id || !subject) {
      return res.status(400).json({ success: false, message: 'Missing required marks fields' });
    }

    const t = parseFloat(theory_marks) || 0;
    const p = parseFloat(practical_marks) || 0;
    const total = Math.min(100, Math.max(0, t + p));
    const grade = calculateGrade(total);

    const stmt = db.prepare(`
      INSERT INTO marks (exam_id, student_id, class_id, subject, theory_marks, practical_marks, total_marks, max_marks, grade, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, 100, ?, ?)
      ON CONFLICT(exam_id, student_id, subject) DO UPDATE SET
        theory_marks = excluded.theory_marks,
        practical_marks = excluded.practical_marks,
        total_marks = excluded.total_marks,
        grade = excluded.grade,
        remarks = excluded.remarks
    `);

    stmt.run(exam_id, student_id, class_id, subject, t, p, total, grade, remarks || '');
    res.json({ success: true, message: 'Marks recorded successfully.' });
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
