-- ====================================================================
-- AWS RDS MySQL - School Attendance & Management Database Schema
-- Database: school_attendance_db
-- ====================================================================

CREATE DATABASE IF NOT EXISTS school_attendance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE school_attendance_db;

-- 1. Classes Table
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  section VARCHAR(10) NOT NULL,
  room_number VARCHAR(50),
  class_teacher VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_class_section (name, section)
) ENGINE=InnoDB;

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  roll_number VARCHAR(20) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  gender ENUM('Male', 'Female', 'Other') DEFAULT 'Male',
  class_id INT NOT NULL,
  parent_name VARCHAR(100),
  parent_phone VARCHAR(25),
  email VARCHAR(100),
  dob DATE,
  address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_class_roll (class_id, roll_number)
) ENGINE=InnoDB;

-- 3. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('Present', 'Absent', 'Late', 'Excused') NOT NULL,
  remarks VARCHAR(255),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_date (student_id, date)
) ENGINE=InnoDB;

-- 4. Leave Applications Table
CREATE TABLE IF NOT EXISTS leave_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  applied_by VARCHAR(100) DEFAULT 'Parent',
  teacher_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Users / Authentication Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'teacher', 'parent') NOT NULL DEFAULT 'teacher',
  email VARCHAR(100),
  phone VARCHAR(25),
  class_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. Timetable Schedule Table
CREATE TABLE IF NOT EXISTS timetable (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
  period_number INT NOT NULL,
  start_time VARCHAR(20) NOT NULL,
  end_time VARCHAR(20) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  teacher_name VARCHAR(100) NOT NULL,
  room_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_class_period (class_id, day_of_week, period_number)
) ENGINE=InnoDB;

-- 7. Fees Management Table
CREATE TABLE IF NOT EXISTS fees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  fee_type VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('Paid', 'Pending', 'Overdue') DEFAULT 'Pending',
  paid_date DATE,
  payment_mode VARCHAR(50),
  receipt_number VARCHAR(100) UNIQUE,
  remarks VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Examinations Table
CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  term VARCHAR(50) NOT NULL,
  academic_year VARCHAR(20) DEFAULT '2026-2027',
  start_date DATE,
  end_date DATE,
  status ENUM('Upcoming', 'Ongoing', 'Completed') DEFAULT 'Completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 9. Examination Marks / Gradebook Table
CREATE TABLE IF NOT EXISTS marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  theory_marks DECIMAL(5,2) DEFAULT 0,
  practical_marks DECIMAL(5,2) DEFAULT 0,
  total_marks DECIMAL(5,2) NOT NULL,
  max_marks DECIMAL(5,2) DEFAULT 100,
  grade VARCHAR(10) NOT NULL,
  remarks VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_exam_student_sub (exam_id, student_id, subject)
) ENGINE=InnoDB;

-- ====================================================================
-- Initial Seed Data for Classes
-- ====================================================================
INSERT INTO classes (id, name, section, room_number, class_teacher) VALUES
(1, 'Class 9', 'A', 'Room 101', 'Mrs. Sunita Sharma'),
(2, 'Class 9', 'B', 'Room 102', 'Mr. Amit Verma'),
(3, 'Class 10', 'A', 'Room 201', 'Mrs. Neha Gupta'),
(4, 'Class 10', 'B', 'Room 202', 'Mr. Rajesh Kumar')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Users
INSERT INTO users (id, username, password, name, role, email, phone) VALUES
(1, 'admin', 'admin123', 'Dr. Alok Verma', 'admin', 'principal@vidyamandir.edu', '+91 9811002233'),
(2, 'teacher1', 'teacher123', 'Mrs. Sunita Sharma', 'teacher', 'sunita.s@vidyamandir.edu', '+91 9876543201')
ON DUPLICATE KEY UPDATE name=VALUES(name);
