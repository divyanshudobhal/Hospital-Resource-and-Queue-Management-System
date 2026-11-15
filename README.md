# 🏥 Hospital Management System

A college project demonstrating **Operating Systems (CPU Scheduling)** and **Database Management Systems (MongoDB)** concepts through a hospital patient scheduling and management application.

Built with **React.js**, **Node.js**, **Express.js**, and **MongoDB**.

---

## 📋 Project Features

### ✅ Completed

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Login & Role-Based Access** | JWT authentication with Admin, Doctor, and Patient roles |
| 2 | **Doctor Dashboard** | Patient, appointment, scheduling, and medical record views |
| 3 | **Patient Dashboard** | Profile, booking, appointment history, and own medical records |
| 4 | **Appointment Booking** | Patients book appointments with selected doctor |
| 5 | **Emergency & Regular Classification** | Appointments marked as Emergency (priority 1) or Regular (priority 2) |
| 6 | **CPU Scheduling** | FCFS, non-preemptive Priority, SJF, Round Robin, and Multilevel Queue |
| 7 | **Scheduling Results** | Completion, waiting, and turnaround times plus execution order |
| 8 | **C Scheduler Demo** | Run compiled C schedulers from the doctor dashboard; results appear in the page and backend terminal |
| 9 | **MongoDB Integration** | Users, doctors, patients, appointments, and medical records |
| 10 | **OS Resource Demos** | Resource allocation, Banker’s deadlock avoidance, mutex, and semaphore |

### ✅ Completed Milestones

- Five CPU scheduling algorithms exposed through compiled C programs
- Resource allocation, deadlock avoidance, and process synchronization simulations
- Role-protected administrator dashboard
- Live appointment notifications
- Patient medical records with doctor and patient access controls
- MongoDB view, aggregation, and Mongoose middleware demonstrations

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js 18, React Router v6, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Notifications | Server-Sent Events |
| Styling | Custom CSS (blue & white theme) |

---

## 🚀 How to Run

### Prerequisites

- **Node.js** (v16.20 or higher)
- **MongoDB** (v6 or higher) running locally
- **GCC** for local C scheduler builds (Docker builds the C programs automatically)
- **VS Code** with a terminal

### Step 1: Start MongoDB

Start MongoDB locally and use the default database URI `mongodb://127.0.0.1:27017/hospital_management`, or set `MONGODB_URI` in `server/.env` to your MongoDB connection string. The application creates its collections and indexes when it starts.

### Step 2: Configure the Backend

```bash
cd server

# Create .env file from the example
copy .env.example .env

# Replace JWT_SECRET with a long random value. Set MONGODB_URI if needed.
# MONGODB_URI=mongodb://127.0.0.1:27017/hospital_management

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
  ✓  MongoDB connected
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

### Demonstrate the C scheduler

Sign in as a doctor, open **OS CPU Scheduling Simulation**, and scroll to **C-Based CPU Scheduling**. The schedulers load that doctor's waiting appointments directly from MongoDB; patient name, arrival time, service duration, appointment type, and priority are not entered manually or replaced by sample processes. Choose an algorithm (and a time quantum for Round Robin) to run it. The backend runs the C program, prints its output in the backend terminal, and returns the results to the page. Local first-use compilation requires GCC; Docker builds the executables into the image.

When running locally on Windows, compile the C executables from the project root if needed:

```powershell
gcc -std=c11 -Wall -Wextra os_engine\fcfs.c -o os_engine\fcfs.exe
gcc -std=c11 -Wall -Wextra os_engine\non_preemptive_priority.c -o os_engine\priority.exe
gcc -std=c11 -Wall -Wextra os_engine\sjf.c -o os_engine\sjf.exe
gcc -std=c11 -Wall -Wextra os_engine\round_robin.c -o os_engine\round_robin.exe
gcc -std=c11 -Wall -Wextra os_engine\multilevel_queue.c -o os_engine\multilevel_queue.exe
```

The Docker image compiles platform-native scheduler executables automatically.

---

## 🌐 Hosting

For the complete step-by-step instructions to run the app locally, share a temporary phone link, or host it with a stable Cloudflare domain, see [README_HOSTING.md](README_HOSTING.md).

### Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Doctor | `dr.aarav` (Dr. Aarav Sharma) | `password123` |
| Doctor | `dr.priya` (Dr. Priya Iyer) | `password123` |
| Admin | `admin` | `password123` |
| Admin | `admin` | `password123` |
| Patient | `pulkit` | `password123` |
| Patient | `swastika` | `password123` |
| Patient | `srishti` | `password123` |

Patients can also create their own account from the **Create patient account** link on the sign-in page.

---
## 📁 Project Structure

```
hospital-management-system/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx   # Route guard (role check)
│   │   │   ├── SchedulingPanel.jsx  # OS scheduling and simulation demos
│   │   │   ├── CSchedulingRunner.jsx
│   │   │   ├── MedicalRecordsPanel.jsx
│   │   │   └── LiveNotifications.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── DoctorDashboard.jsx  # Doctor view
│   │   │   ├── PatientDashboard.jsx # Patient view
│   │   │   └── AdminDashboard.jsx   # Administrator view
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
│   ├── db.js                        # MongoDB connection and Mongoose models
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

### 3. Non-Preemptive SJF
- Chooses the shortest burst time among processes that have arrived.

### 4. Round Robin
- Shares CPU time in a configurable quantum and requeues unfinished processes.

### 5. Multilevel Queue
- Queue 0 is emergency/high priority; queue 1 is regular. Each queue is FCFS.

### Gantt Chart
- Visual timeline of scheduling order
- Shows idle periods when no patient has arrived
- Color-coded: 🔵 Regular, 🔴 Emergency, ⬜ Idle

---

## 🗄️ DBMS Concepts Demonstrated

| Concept | Implementation |
|---------|---------------|
| **Collections & Schema** | users, doctors, patients, appointments, medical_records |
| **Document IDs** | MongoDB ObjectIds |
| **References** | `patient_id`, `doctor_id`, and `user_id` reference related documents |
| **Population** | Appointment queries populate patient and doctor details |
| **Indexes** | Unique usernames and user profile references |
| **Validation** | Mongoose required fields and enum validation |
| **MongoDB View** | `appointment_queue_view` joins appointment, patient, and doctor collections |
| **Aggregation** | Dashboard status/type counts use an aggregation pipeline |
| **Trigger Equivalent** | Mongoose validation middleware derives priority from appointment type |
| **Stored Procedure Equivalent** | Reusable server-side aggregation functions; MongoDB has no SQL stored procedures |

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/login` | — | — | Login, returns JWT |
| POST | `/api/auth/signup` | — | — | Create a patient account |
| GET | `/api/patients` | ✅ | Doctor | List all patients |
| GET | `/api/patients/profile` | ✅ | Patient | Get own profile |
| GET | `/api/appointments` | ✅ | Both | Get appointments (filtered by role) |
| POST | `/api/appointments` | ✅ | Patient | Book appointment |
| PATCH | `/api/appointments/:id/status` | ✅ | Doctor | Update appointment status |
| GET | `/api/appointments/doctors` | ✅ | Both | List doctors for booking |
| GET | `/api/admin/overview` | ✅ | Admin | Hospital statistics and appointment aggregates |
| GET | `/api/admin/users` | ✅ | Admin | Account directory (password hashes excluded) |
| GET | `/api/admin/database-demo` | ✅ | Admin | MongoDB view and aggregation results |
| GET/POST | `/api/medical-records` | ✅ | Doctor/Patient | Create and view authorized medical records |
| GET | `/api/notifications/stream` | ✅ | All roles | Server-Sent Events for appointment and record updates |
| POST | `/api/os-concepts/resources` | ✅ | Doctor | Resource allocation/release simulation |
| POST | `/api/os-concepts/deadlock` | ✅ | Doctor | Banker’s safe-state check |
| POST | `/api/os-concepts/synchronization` | ✅ | Doctor | Mutex/semaphore timeline simulation |
| GET | `/api/health` | — | — | Health check |

---

## ⚠️ Disclaimer

This is an **educational project** for demonstrating OS and DBMS concepts. The scheduling simulation does **not** replace real clinical triage or medical assessment. Patients with actual medical emergencies should seek immediate emergency care.

---

## 📄 License

This project is for educational purposes only.

### Technology Stack

- **C:** FCFS and Non-Preemptive Priority Scheduling
- **C++:** Resource allocation and synchronization simulations
- **React.js:** Frontend interface
- **Node.js and Express.js:** Backend API
- **MongoDB:** Persistent application data

### Compile and Run the C Scheduling Programs

Open an MSYS2 UCRT64 terminal and navigate to the `os_engine` directory.

Compile FCFS:

```bash
gcc -std=c11 -Wall -Wextra fcfs.c -o fcfs.exe
```

Run FCFS:

```bash
./fcfs.exe
```

Compile Non-Preemptive Priority:

```bash
gcc -std=c11 -Wall -Wextra non_preemptive_priority.c -o priority.exe
```

Run Non-Preemptive Priority:

```bash
./priority.exe
```

Both programs accept process details interactively and display scheduling metrics and execution order.

### Verification Status

- FCFS C program: compiled and tested.
- Non-Preemptive Priority C program: compiled and tested with multiple processes and different arrival times.
- Scheduling API executes the C programs and returns their terminal output to the React runner.
- The React runner uses the same-origin API, so it works in Vite development and Docker-hosted builds.
