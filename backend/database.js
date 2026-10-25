const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'attendance.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      section TEXT NOT NULL,
      room_number TEXT,
      class_teacher TEXT,
      UNIQUE(name, section)
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roll_number TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      gender TEXT DEFAULT 'Male',
      class_id INTEGER NOT NULL,
      parent_name TEXT,
      parent_phone TEXT,
      email TEXT,
      dob TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      UNIQUE(class_id, roll_number)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Late', 'Excused')),
      remarks TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      UNIQUE(student_id, date)
    );

    CREATE TABLE IF NOT EXISTS leave_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      leave_type TEXT NOT NULL CHECK(leave_type IN ('Medical Leave', 'Casual Leave', 'Family Emergency', 'Other')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
      applied_by TEXT DEFAULT 'Parent',
      teacher_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'parent')),
      email TEXT,
      phone TEXT,
      class_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      day_of_week TEXT NOT NULL CHECK(day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
      period_number INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      subject TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      room_number TEXT,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      UNIQUE(class_id, day_of_week, period_number)
    );

    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      fee_type TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Paid', 'Pending', 'Overdue')),
      paid_date TEXT,
      payment_mode TEXT,
      receipt_number TEXT UNIQUE,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );
  `);

  // Check if we already have classes seeded
  const checkClasses = db.prepare('SELECT COUNT(*) as count FROM classes').get();
  if (checkClasses.count === 0) {
    seedInitialData();
  }

  // Check if we have leaves seeded
  const checkLeaves = db.prepare('SELECT COUNT(*) as count FROM leave_applications').get();
  if (checkLeaves.count === 0) {
    seedInitialLeaves();
  }

  // Check if we have users seeded
  const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (checkUsers.count === 0) {
    seedInitialUsers();
  }

  // Check if we have timetable seeded
  const checkTimetable = db.prepare('SELECT COUNT(*) as count FROM timetable').get();
  if (checkTimetable.count === 0) {
    seedInitialTimetable();
  }

  // Check if we have fees seeded
  const checkFees = db.prepare('SELECT COUNT(*) as count FROM fees').get();
  if (checkFees.count === 0) {
    seedInitialFees();
  }
}

function seedInitialLeaves() {
  const students = db.prepare('SELECT id, class_id FROM students LIMIT 5').all();
  if (students.length === 0) return;

  const insertLeave = db.prepare(`
    INSERT INTO leave_applications (student_id, class_id, leave_type, start_date, end_date, reason, status, applied_by, teacher_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];

  insertLeave.run(
    students[0].id,
    students[0].class_id,
    'Medical Leave',
    today,
    tomorrow,
    'High fever and doctor advised 2 days bed rest.',
    'Pending',
    'Parent (Ramesh Sharma)',
    ''
  );

  if (students[1]) {
    insertLeave.run(
      students[1].id,
      students[1].class_id,
      'Family Emergency',
      today,
      dayAfter,
      'Attending family function out of town.',
      'Approved',
      'Parent (Suresh Iyer)',
      'Approved by Class Teacher. Please submit work upon return.'
    );
  }

  if (students[2]) {
    insertLeave.run(
      students[2].id,
      students[2].class_id,
      'Casual Leave',
      tomorrow,
      tomorrow,
      'Passport verification appointment.',
      'Pending',
      'Parent (Manoj Verma)',
      ''
    );
  }
  console.log('Sample leave applications seeded!');
}

function seedInitialUsers() {
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, name, role, email, phone, class_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const usersData = [
    ['admin', 'admin123', 'Dr. Alok Verma (Principal)', 'admin', 'principal@vidyamandir.edu', '+91 9811122233', null],
    ['teacher', 'teacher123', 'Mrs. Sunita Sharma', 'teacher', 'sunita.sharma@vidyamandir.edu', '+91 9822233344', 1],
    ['teacher2', 'teacher123', 'Mr. Amit Verma', 'teacher', 'amit.verma@vidyamandir.edu', '+91 9833344455', 2],
    ['parent', 'parent123', 'Ramesh Sharma (Parent)', 'parent', 'ramesh.sharma@gmail.com', '+91 9876543210', 1]
  ];

  for (const u of usersData) {
    insertUser.run(...u);
  }
  console.log('Sample users seeded!');
}

function seedInitialTimetable() {
  const classes = db.prepare('SELECT id, name, section, room_number, class_teacher FROM classes').all();
  if (classes.length === 0) return;

  const insertSlot = db.prepare(`
    INSERT OR REPLACE INTO timetable (class_id, day_of_week, period_number, start_time, end_time, subject, teacher_name, room_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const timeSlots = [
    { period: 1, start: '08:30 AM', end: '09:15 AM' },
    { period: 2, start: '09:15 AM', end: '10:00 AM' },
    { period: 3, start: '10:00 AM', end: '10:45 AM' },
    { period: 4, start: '11:15 AM', end: '12:00 PM' },
    { period: 5, start: '12:00 PM', end: '12:45 PM' },
    { period: 6, start: '12:45 PM', end: '01:30 PM' }
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const subjectPool = [
    { subject: 'Mathematics', teacher: 'Mrs. Sunita Sharma' },
    { subject: 'Science', teacher: 'Mr. Rajesh Kumar' },
    { subject: 'English', teacher: 'Mrs. Neha Gupta' },
    { subject: 'Social Science', teacher: 'Mr. Amit Verma' },
    { subject: 'Computer Science', teacher: 'Ms. Priya Sen' },
    { subject: 'Hindi', teacher: 'Mr. Vinod Joshi' },
    { subject: 'Physical Ed / Sports', teacher: 'Coach Dahiya' },
    { subject: 'Art & Craft', teacher: 'Mrs. Shalini Roy' }
  ];

  for (const c of classes) {
    days.forEach((day, dayIdx) => {
      timeSlots.forEach((slot, slotIdx) => {
        // cycle through subjects deterministically
        const subIdx = (c.id * 3 + dayIdx * 2 + slotIdx) % subjectPool.length;
        const sub = subjectPool[subIdx];
        insertSlot.run(
          c.id,
          day,
          slot.period,
          slot.start,
          slot.end,
          sub.subject,
          sub.teacher,
          c.room_number || 'Room 101'
        );
      });
    });
  }
  console.log('Sample timetable schedule seeded!');
}

function seedInitialFees() {
  const students = db.prepare('SELECT id, class_id, first_name, last_name, roll_number FROM students').all();
  if (students.length === 0) return;

  const insertFee = db.prepare(`
    INSERT INTO fees (student_id, class_id, fee_type, amount, due_date, status, paid_date, payment_mode, receipt_number, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let receiptCounter = 1001;

  students.forEach((st, idx) => {
    // 1. Tuition Fee (Quarter 3)
    const isPaid = idx % 3 !== 0;
    const isOverdue = idx % 3 === 0 && idx % 2 === 0;
    const tStatus = isPaid ? 'Paid' : (isOverdue ? 'Overdue' : 'Pending');
    const tReceipt = isPaid ? `VM-REC-${receiptCounter++}` : null;
    const tPaidDate = isPaid ? '2026-10-10' : null;
    const tMode = isPaid ? (idx % 2 === 0 ? 'UPI / QR' : 'Net Banking') : null;

    insertFee.run(
      st.id,
      st.class_id,
      'Tuition Fee (Quarter 3)',
      12500,
      '2026-10-15',
      tStatus,
      tPaidDate,
      tMode,
      tReceipt,
      isPaid ? 'Quarterly tuition fees cleared' : 'Term 3 due'
    );

    // 2. Transport Fee
    if (idx % 2 === 0) {
      const transPaid = idx % 4 !== 0;
      insertFee.run(
        st.id,
        st.class_id,
        'Transport Fee',
        2400,
        '2026-10-20',
        transPaid ? 'Paid' : 'Pending',
        transPaid ? '2026-10-12' : null,
        transPaid ? 'Cash' : null,
        transPaid ? `VM-REC-${receiptCounter++}` : null,
        'Bus Route #4 Gurugram'
      );
    }

    // 3. Computer & Lab Fee
    const labPaid = idx % 5 !== 0;
    insertFee.run(
      st.id,
      st.class_id,
      'Computer & Science Lab Fee',
      3200,
      '2026-11-05',
      labPaid ? 'Paid' : 'Pending',
      labPaid ? '2026-10-18' : null,
      labPaid ? 'UPI / QR' : null,
      labPaid ? `VM-REC-${receiptCounter++}` : null,
      'Annual Science Lab & IT subscription'
    );
  });

  console.log('Sample fees records seeded!');
}

function seedInitialData() {
  console.log('Seeding initial school database data...');
  
  // Seed Classes
  const insertClass = db.prepare(`
    INSERT INTO classes (name, section, room_number, class_teacher)
    VALUES (?, ?, ?, ?)
  `);

  const classesData = [
    ['Class 9', 'A', 'Room 101', 'Mrs. Sunita Sharma'],
    ['Class 9', 'B', 'Room 102', 'Mr. Amit Verma'],
    ['Class 10', 'A', 'Room 201', 'Mrs. Neha Gupta'],
    ['Class 10', 'B', 'Room 202', 'Mr. Rajesh Kumar']
  ];

  for (const c of classesData) {
    insertClass.run(...c);
  }

  // Seed Students
  const insertStudent = db.prepare(`
    INSERT INTO students (roll_number, first_name, last_name, gender, class_id, parent_name, parent_phone, email, dob, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const studentsData = [
    // Class 9-A (class_id: 1)
    ['01', 'Aarav', 'Sharma', 'Male', 1, 'Ramesh Sharma', '+91 9876543210', 'aarav.s@school.edu', '2010-04-12', 'Sector 14, Gurugram'],
    ['02', 'Ananya', 'Iyer', 'Female', 1, 'Suresh Iyer', '+91 9876543211', 'ananya.i@school.edu', '2010-06-25', 'DLF Phase 2, Gurugram'],
    ['03', 'Rohan', 'Verma', 'Male', 1, 'Manoj Verma', '+91 9876543212', 'rohan.v@school.edu', '2010-01-15', 'Sushant Lok 1, Gurugram'],
    ['04', 'Priya', 'Singh', 'Female', 1, 'Devendra Singh', '+91 9876543213', 'priya.s@school.edu', '2010-08-30', 'South City 2, Gurugram'],
    ['05', 'Vikram', 'Malhotra', 'Male', 1, 'Rajiv Malhotra', '+91 9876543214', 'vikram.m@school.edu', '2010-11-05', 'Sector 56, Gurugram'],
    ['06', 'Sneha', 'Patel', 'Female', 1, 'Kishore Patel', '+91 9876543215', 'sneha.p@school.edu', '2010-03-19', 'Sector 45, Gurugram'],

    // Class 9-B (class_id: 2)
    ['01', 'Aditya', 'Joshi', 'Male', 2, 'Vinod Joshi', '+91 9876543216', 'aditya.j@school.edu', '2010-05-14', 'Sector 23, Gurugram'],
    ['02', 'Diya', 'Nair', 'Female', 2, 'Gopal Nair', '+91 9876543217', 'diya.n@school.edu', '2010-09-22', 'Sector 31, Gurugram'],
    ['03', 'Kabir', 'Mehta', 'Male', 2, 'Alok Mehta', '+91 9876543218', 'kabir.m@school.edu', '2010-02-18', 'Palam Vihar, Gurugram'],
    ['04', 'Isha', 'Chopra', 'Female', 2, 'Sanjay Chopra', '+91 9876543219', 'isha.c@school.edu', '2010-12-01', 'Sector 15, Gurugram'],
    ['05', 'Aryan', 'Kapoor', 'Male', 2, 'Deepak Kapoor', '+91 9876543220', 'aryan.k@school.edu', '2010-07-08', 'Sector 43, Gurugram'],

    // Class 10-A (class_id: 3)
    ['01', 'Tanvi', 'Deshmukh', 'Female', 3, 'Anand Deshmukh', '+91 9876543221', 'tanvi.d@school.edu', '2009-04-10', 'Sector 57, Gurugram'],
    ['02', 'Kunal', 'Bansal', 'Male', 3, 'Pawan Bansal', '+91 9876543222', 'kunal.b@school.edu', '2009-08-16', 'Sohna Road, Gurugram'],
    ['03', 'Riya', 'Sen', 'Female', 3, 'Subhash Sen', '+91 9876543223', 'riya.s@school.edu', '2009-02-28', 'Nirvana Country, Gurugram'],
    ['04', 'Manish', 'Yadav', 'Male', 3, 'Rakesh Yadav', '+91 9876543224', 'manish.y@school.edu', '2009-10-11', 'Sector 38, Gurugram'],
    ['05', 'Pooja', 'Chawla', 'Female', 3, 'Harish Chawla', '+91 9876543225', 'pooja.c@school.edu', '2009-05-19', 'Golf Course Road, Gurugram'],

    // Class 10-B (class_id: 4)
    ['01', 'Varun', 'Bhatia', 'Male', 4, 'Siddharth Bhatia', '+91 9876543226', 'varun.b@school.edu', '2009-03-24', 'Sector 50, Gurugram'],
    ['02', 'Meera', 'Reddy', 'Female', 4, 'Narayana Reddy', '+91 9876543227', 'meera.r@school.edu', '2009-07-03', 'Sector 47, Gurugram'],
    ['03', 'Harsh', 'Tiwari', 'Male', 4, 'Brijesh Tiwari', '+91 9876543228', 'harsh.t@school.edu', '2009-09-15', 'Sector 17, Gurugram'],
    ['04', 'Simran', 'Kaur', 'Female', 4, 'Gurpreet Singh', '+91 9876543229', 'simran.k@school.edu', '2009-11-20', 'Civil Lines, Gurugram'],
    ['05', 'Arjun', 'Rathore', 'Male', 4, 'Vijay Rathore', '+91 9876543230', 'arjun.r@school.edu', '2009-01-09', 'Sector 4, Gurugram']
  ];

  for (const s of studentsData) {
    insertStudent.run(...s);
  }

  // Seed Past 5 Days Attendance
  const insertAttendance = db.prepare(`
    INSERT OR REPLACE INTO attendance (student_id, class_id, date, status, remarks)
    VALUES (?, ?, ?, ?, ?)
  `);

  const allStudents = db.prepare('SELECT id, class_id FROM students').all();
  
  // Dates: past 5 days
  const today = new Date();
  const dates = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // skip Sundays (0)
    if (d.getDay() !== 0) {
      dates.push(d.toISOString().split('T')[0]);
    }
  }

  for (const dateStr of dates) {
    for (const student of allStudents) {
      // Generate realistic status: 85% present, 8% absent, 5% late, 2% excused
      const rand = Math.random();
      let status = 'Present';
      let remarks = '';
      if (rand < 0.08) {
        status = 'Absent';
        remarks = 'Informed by parent';
      } else if (rand < 0.13) {
        status = 'Late';
        remarks = 'School bus delayed';
      } else if (rand < 0.15) {
        status = 'Excused';
        remarks = 'Medical leave';
      }
      insertAttendance.run(student.id, student.class_id, dateStr, status, remarks);
    }
  }

  console.log('Database seeded successfully!');
}

initDb();

module.exports = db;
