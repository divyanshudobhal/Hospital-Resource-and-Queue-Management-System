# 🏥 Hospital Management System

A college project demonstrating **Operating Systems (CPU Scheduling)** and **Database Management Systems (MySQL)** concepts through a hospital patient scheduling and management application.

Built with **React.js**, **Node.js**, **Express.js**, and **MySQL**.

---

## 📋 Features (Milestone 1 — 40%)

### ✅ Completed

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Login & Role-Based Access** | JWT authentication with Doctor and Patient roles |
| 2 | **Doctor Dashboard** | View patients, today's appointments, stats cards |
| 3 | **Patient Dashboard** | Profile, book appointments, appointment history |
| 4 | **Appointment Booking** | Patients book appointments with selected doctor |
| 5 | **Emergency & Regular Classification** | Appointments marked as Emergency (priority 1) or Regular (priority 2) |
| 6 | **FCFS Scheduling** | First Come First Serve algorithm with Gantt chart |
| 7 | **Priority Scheduling** | Non-preemptive priority scheduling with Gantt chart |
| 8 | **Gantt Chart & Calculations** | Visual Gantt chart, waiting time, turnaround time |
| 9 | **MySQL Integration** | Users, doctors, patients, appointments tables with JOINs |
| 10 | **Terminal-Based Backend** | Express server with request logging in VS Code terminal |

### 🔲 Pending (Future Milestones)

- Round Robin scheduling algorithm
- Shortest Job First (SJF) scheduling
- Multilevel Queue Scheduling
- Advanced DB concepts (views, stored procedures, triggers)
- Deadlock detection and prevention simulation
- Process synchronization (mutex/semaphore) demonstration
- Admin dashboard
- Real-time notifications
- Patient medical records

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js 18, React Router v6, Vite |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Styling | Custom CSS (blue & white theme) |

---

## 🚀 How to Run

### Prerequisites

- **Node.js** (v16 or higher)
- **MySQL** (v8 or higher) running locally
- **VS Code** with a terminal

### Step 1: Set Up the Database

```bash
# Open MySQL and run the schema
mysql -u root -p < server/schema.sql
```

Or open MySQL Workbench, copy the contents of `server/schema.sql`, and execute.

### Step 2: Configure the Backend

```bash
cd server

# Create .env file from the example
copy .env.example .env

# Edit .env and set your MySQL password
# DB_PASSWORD=your_mysql_password

# Install dependencies
npm install

# Start the server
node server.js
```

You should see:
```
  ╔═══════════════════════════════════════════════╗
  ║   Hospital Management System — Backend Server ║
  ╚═══════════════════════════════════════════════╝
  Server  : http://localhost:5000
  ✓  MySQL connected
  ✓  Demo data seeded successfully!
```

### Step 3: Start the Frontend

Open a **second terminal** in VS Code:

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Step 4: Login with Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Doctor | `dr.smith` | `password123` |
| Doctor | `dr.jones` | `password123` |
| Patient | `patient1` | `password123` |
| Patient | `patient2` | `password123` |
| Patient | `patient3` | `password123` |

---

## 📁 Project Structure

```
hospital-management-system/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx   # Route guard (role check)
│   │   │   └── SchedulingPanel.jsx  # OS scheduling simulation
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── DoctorDashboard.jsx  # Doctor view
│   │   │   └── PatientDashboard.jsx # Patient view
│   │   ├── App.jsx                  # Routes
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Blue & white theme
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                          # Node.js Backend
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT verify + role auth
│   ├── routes/
│   │   ├── auth.js                  # POST /api/auth/login
│   │   ├── patients.js              # GET /api/patients
│   │   └── appointments.js          # CRUD appointments
│   ├── server.js                    # Express entry + seed
│   ├── db.js                        # MySQL connection pool
│   ├── schema.sql                   # Database schema
│   ├── .env.example                 # Environment template
│   └── package.json
└── README.md
```

---

## 🖥️ OS Concepts Demonstrated

### CPU Scheduling Algorithms

Each patient appointment is treated as a **process**:

| OS Term | Hospital Equivalent |
|---------|--------------------|
| Process | Patient appointment |
| Arrival Time | Patient check-in time |
| Burst Time | Estimated consultation duration |
| Priority | Emergency (1) vs Regular (2) |
| Waiting Time | Time spent waiting before consultation |
| Turnaround Time | Total time from arrival to completion |

### 1. FCFS (First Come First Serve)
- Patients scheduled in arrival order
- Simple and fair but ignores urgency
- Can cause long waits for emergency patients

### 2. Non-Preemptive Priority Scheduling
- Emergency patients (priority 1) scheduled before regular (priority 2)
- Same-priority patients ordered by arrival time
- Once a consultation starts, it completes before the next
- Reduces emergency wait times

### Gantt Chart
- Visual timeline of scheduling order
- Shows idle periods when no patient has arrived
- Color-coded: 🔵 Regular, 🔴 Emergency, ⬜ Idle

---

## 🗄️ DBMS Concepts Demonstrated

| Concept | Implementation |
|---------|---------------|
| **Tables & Schema** | users, doctors, patients, appointments |
| **Primary Keys** | AUTO_INCREMENT id on each table |
| **Foreign Keys** | patient_id → patients, doctor_id → doctors |
| **JOINs** | Appointment queries join patients and doctors |
| **Parameterized Queries** | All SQL uses `?` placeholders (prevents SQL injection) |
| **Transactions** | Appointment booking uses BEGIN/COMMIT to prevent duplicates |
| **Indexes** | On appointment_date, doctor_id, patient_id, status |
| **ENUMs** | role, gender, appointment_type, status |
| **Constraints** | NOT NULL, UNIQUE, CHECK |

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/login` | — | — | Login, returns JWT |
| GET | `/api/patients` | ✅ | Doctor | List all patients |
| GET | `/api/patients/profile` | ✅ | Patient | Get own profile |
| GET | `/api/appointments` | ✅ | Both | Get appointments (filtered by role) |
| POST | `/api/appointments` | ✅ | Patient | Book appointment |
| PATCH | `/api/appointments/:id/status` | ✅ | Doctor | Update appointment status |
| GET | `/api/appointments/doctors` | ✅ | Both | List doctors for booking |
| GET | `/api/health` | — | — | Health check |

---

## ⚠️ Disclaimer

This is an **educational project** for demonstrating OS and DBMS concepts. The scheduling simulation does **not** replace real clinical triage or medical assessment. Patients with actual medical emergencies should seek immediate emergency care.

---

## 📄 License

This project is for educational purposes only.
