# 🏫 School Attendance System

A modern, full-stack **School Attendance Management & Leave Portal** built with **React**, **Node.js (Express)**, and **SQLite (Node 24 native `node:sqlite`)**.

---

## 🌟 Key Features

### 1. 📊 Live School Dashboard & Analytics
- Total students, classrooms, and daily attendance rate (%).
- Daily participation counts (**Present**, **Absent**, **Late**, **Excused**).
- Class-wise attendance progress bars.
- **Low Attendance Alert (< 75%)** identifying students at risk with direct phone link.
- 7-day school-wide attendance trend.

### 2. 📲 Instant Parent WhatsApp & SMS Alerts (New!)
- Automatic detection of Absent and Late students.
- Pre-composed official message:
  > *"Namaste {Parent}, this is an official alert from Vidya Mandir School. Your ward {Student} (Roll #{Roll}, {Class}) has been marked ABSENT today ({Date}). If unexpected, please contact school administration."*
- One-click **"Send WhatsApp"** button linking directly to `wa.me` with pre-filled text.
- One-click **"Copy Message"** for SMS, email, or bulk notice.
- Automatically prompts the teacher right after saving daily attendance.

### 3. 📋 Student Leave Management & Approval Portal (New!)
- Parents or staff can submit Leave Applications (Medical Leave, Casual Leave, Family Emergency, Other).
- Teacher / Principal review dashboard with **Pending**, **Approved**, and **Rejected** filters.
- **One-Click Approval / Rejection** with optional teacher comments.
- **Automatic Attendance Sync**: When a leave is approved, the system automatically records/updates the student's attendance as **"Excused"** for the requested date range!
- Live badge counter in sidebar showing pending requests.

### 4. ✍️ Daily Attendance Marker
- Class and Date selector.
- Bulk shortcuts: **"All Present"** and **"All Absent"**.
- Single-click status toggles (**Present**, **Absent**, **Late**, **Excused**) with instant color feedback.
- Remarks input for each student.
- Instant save with toast notifications.

### 5. 👨‍🎓 Students Directory
- Search by student name, roll number, or parent phone number.
- Class-wise filtering.
- **Register New Student** modal form with full validation.
- Edit student details and delete students.
- Real-time overall attendance percentage badge for each student.

### 6. 📅 Monthly Attendance Register & Matrix
- Comprehensive 31-day status matrix (**P / A / L / E**).
- Student summary (present days, absent days, rate %).
- **Export to CSV**: Instant `.csv` download for school administrative records.
- **Print layout** support.

### 7. 🏫 Classrooms & Sections
- Class teacher assignments, room numbers, and enrolled student counters.
- Create new classes/sections.

---

## 🏗️ Tech Stack

- **Frontend**: React 19, Vite, Lucide Icons, Modern Responsive Design System.
- **Backend**: Node.js v24, Express, CORS.
- **Database**: SQLite (via Node.js native `node:sqlite` — zero build tools required, persistent file-based storage).

---

## 🚀 How to Run

### Quick Start:
Double-click [`start.bat`](start.bat) or run:
```bash
npm start
```
Then visit: **[http://localhost:5000](http://localhost:5000)**

---

## 📁 Project Structure

```
school-attendance-system/
├── backend/
│   ├── database.js                    # SQLite tables, leaves schema & seed data
│   ├── server.js                      # Express API, WhatsApp alerts & leaves logic
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx          # Overview, stats & WhatsApp alert trigger
│   │   │   ├── MarkAttendance.jsx     # Daily marking & absent alert modal
│   │   │   ├── WhatsAppAlertModal.jsx # WhatsApp & SMS parent notice generator
│   │   │   ├── Leaves.jsx             # Leave application & approval portal
│   │   │   ├── Students.jsx           # Student directory & registration
│   │   │   ├── Reports.jsx            # Monthly matrix & CSV export
│   │   │   └── Classes.jsx            # Classrooms management
│   │   ├── App.jsx                    # Routing, sidebar with badge & topbar
│   │   └── index.css                  # Modern UI design system
│   ├── vite.config.js
│   └── package.json
├── start.bat                          # One-click Windows launcher
├── package.json                       # Unified root scripts
└── README.md
```
