-- Hospital Management System - Database Schema
-- Run this file in MySQL: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS hospital_management;
USE hospital_management;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('doctor', 'patient') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  specialization VARCHAR(100) DEFAULT 'General Medicine',
  phone VARCHAR(20),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  age INT,
  gender ENUM('Male', 'Female', 'Other'),
  phone VARCHAR(20),
  blood_group VARCHAR(5),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Appointments table with OS scheduling fields
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  arrival_time TIME NOT NULL,
  estimated_service_time INT NOT NULL DEFAULT 15,
  appointment_type ENUM('emergency', 'regular') NOT NULL DEFAULT 'regular',
  priority INT NOT NULL DEFAULT 2,
  status ENUM('waiting', 'in-progress', 'completed') NOT NULL DEFAULT 'waiting',
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Indexes for faster queries
CREATE INDEX idx_appt_date ON appointments(appointment_date);
CREATE INDEX idx_appt_doctor ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appt_patient ON appointments(patient_id);
CREATE INDEX idx_appt_status ON appointments(status);
