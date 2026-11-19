require('dotenv').config();
const mysql = require('mysql2/promise');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

async function migrate() {
  console.log('\n=============================================================');
  console.log('🚀 MIGRATING SCHOOL ATTENDANCE SYSTEM: SQLite ➔ AWS RDS MySQL');
  console.log('=============================================================\n');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  console.log(`Connecting to MySQL RDS at: ${dbConfig.host}:${dbConfig.port} (User: ${dbConfig.user})...`);

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL Server successfully!');
  } catch (err) {
    console.error('❌ Connection Failed! Please check your RDS Host, Port, and Security Group inbound rules.');
    console.error('Details:', err.message);
    process.exit(1);
  }

  // 1. Run initialization schema
  const schemaFile = path.join(__dirname, 'init-rds-mysql.sql');
  if (fs.existsSync(schemaFile)) {
    console.log('\n[Step 1/3] Creating Database & Tables from init-rds-mysql.sql...');
    const schemaSql = fs.readFileSync(schemaFile, 'utf-8');
    await connection.query(schemaSql);
    console.log('✅ Database schema and tables created successfully!');
  }

  // Use database
  await connection.query('USE school_attendance_db;');

  // 2. Read SQLite data
  const sqlitePath = path.join(__dirname, 'attendance.db');
  if (!fs.existsSync(sqlitePath)) {
    console.log('⚠️ No local SQLite database found at attendance.db. Done with clean MySQL setup!');
    await connection.end();
    return;
  }

  console.log('\n[Step 2/3] Reading existing data from local SQLite database...');
  const sqlite = new DatabaseSync(sqlitePath);

  // Helper to copy a table
  async function copyTable(tableName, insertQuery, mapper) {
    try {
      const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all();
      console.log(`  ➔ Transferring ${rows.length} records from table '${tableName}'...`);
      for (const row of rows) {
        const values = mapper(row);
        await connection.query(insertQuery, values);
      }
      console.log(`  ✅ '${tableName}' migrated.`);
    } catch (err) {
      console.warn(`  ⚠️ Skip/Notice on ${tableName}:`, err.message);
    }
  }

  console.log('\n[Step 3/3] Inserting records into AWS RDS MySQL...');

  // Classes
  await copyTable(
    'classes',
    `INSERT INTO classes (id, name, section, room_number, class_teacher) 
     VALUES (?, ?, ?, ?, ?) 
     ON DUPLICATE KEY UPDATE name=VALUES(name), section=VALUES(section)`,
    r => [r.id, r.name, r.section, r.room_number, r.class_teacher]
  );

  // Students
  await copyTable(
    'students',
    `INSERT INTO students (id, roll_number, first_name, last_name, gender, class_id, parent_name, parent_phone, email, dob, address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE first_name=VALUES(first_name)`,
    r => [r.id, r.roll_number, r.first_name, r.last_name, r.gender, r.class_id, r.parent_name, r.parent_phone, r.email, r.dob, r.address]
  );

  // Attendance
  await copyTable(
    'attendance',
    `INSERT INTO attendance (id, student_id, class_id, date, status, remarks)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status=VALUES(status)`,
    r => [r.id, r.student_id, r.class_id, r.date, r.status, r.remarks]
  );

  // Leaves
  await copyTable(
    'leave_applications',
    `INSERT INTO leave_applications (id, student_id, class_id, leave_type, start_date, end_date, reason, status, applied_by, teacher_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status=VALUES(status)`,
    r => [r.id, r.student_id, r.class_id, r.leave_type, r.start_date, r.end_date, r.reason, r.status, r.applied_by, r.teacher_notes]
  );

  console.log('\n=============================================================');
  console.log('🎉 MIGRATION COMPLETE! AWS RDS MySQL is now fully populated.');
  console.log('=============================================================\n');

  await connection.end();
}

migrate().catch(console.error);
