const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'doctor', 'patient'], required: true },
  created_at: { type: Date, default: Date.now }
});

const doctorSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  specialization: { type: String, default: 'General Medicine' },
  phone: String
});

const patientSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  age: Number,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  phone: String,
  blood_group: String
});

const appointmentSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointment_date: { type: String, required: true },
  arrival_time: { type: String, required: true },
  estimated_service_time: { type: Number, required: true, default: 15 },
  appointment_type: { type: String, enum: ['emergency', 'regular'], required: true, default: 'regular' },
  priority: { type: Number, required: true, default: 2 },
  status: { type: String, enum: ['waiting', 'in-progress', 'completed'], required: true, default: 'waiting' },
  reason: String,
  created_at: { type: Date, default: Date.now }
});

appointmentSchema.pre('validate', function setPriorityFromType() {
  this.priority = this.appointment_type === 'emergency' ? 1 : 2;
});

const medicalRecordSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  appointment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  diagnosis: { type: String, required: true, trim: true, maxlength: 200 },
  treatment: { type: String, trim: true, maxlength: 1000 },
  notes: { type: String, trim: true, maxlength: 2000 },
  created_at: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);
const Patient = mongoose.models.Patient || mongoose.model('Patient', patientSchema);
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
const MedicalRecord = mongoose.models.MedicalRecord || mongoose.model('MedicalRecord', medicalRecordSchema);

async function connectDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hospital_management';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

async function ensureMongoViews() {
  const database = mongoose.connection.db;
  const collections = await database.listCollections({ name: 'appointments' }).toArray();
  if (collections.length === 0) await database.createCollection('appointments');

  const views = await database.listCollections({ name: 'appointment_queue_view' }).toArray();
  if (views.length === 0) {
    await database.createCollection('appointment_queue_view', {
      viewOn: 'appointments',
      pipeline: [
        { $lookup: { from: 'patients', localField: 'patient_id', foreignField: '_id', as: 'patient' } },
        { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'doctors', localField: 'doctor_id', foreignField: '_id', as: 'doctor' } },
        { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            appointment_date: 1,
            arrival_time: 1,
            appointment_type: 1,
            priority: 1,
            status: 1,
            patient_name: '$patient.name',
            doctor_name: '$doctor.name'
          }
        }
      ]
    });
  }
}

module.exports = {
  mongoose,
  connectDatabase,
  ensureMongoViews,
  User,
  Doctor,
  Patient,
  Appointment,
  MedicalRecord
};
