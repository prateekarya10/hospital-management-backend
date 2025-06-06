import express from 'express';
import {
    createPatient, searchPatients, analytics, getPatientById, updatePatient, deletePatient,
    getPatientAppointments,
    updatePatientVitals,
    getDoctorDashboardStats,
    getTodaysAppointments,
    getPatientsPendingVitals,
    getNurseStats,
    updatePatientAppointment,
    getReceptionistStats
} from '../controllers/patientController.js';
import { patientValidation } from '../utils/validators.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Doctor-only endpoints
router.post('/', auth(['doctor']), patientValidation, createPatient);
router.put('/:patientId', auth(['doctor']), updatePatient);
router.get('/dashboard-stats', auth(['doctor']), getDoctorDashboardStats);
router.patch('/:patientId/appointments', auth(['doctor', 'receptionist']), updatePatientAppointment);

// Admin-only endpoints
router.delete('/:patientId', auth(['admin']), deletePatient);
router.get('/analytics', auth(['admin']), analytics);

// Shared endpoints with different access levels
router.get('/search', auth(['doctor', 'nurse', 'receptionist', 'admin']), searchPatients);
router.get('/:patientId', auth(['doctor', 'nurse', 'receptionist', 'admin']), getPatientById);

// Nurse-specific endpoints
router.patch('/:patientId/vitals', auth(['nurse']), updatePatientVitals);
router.get('/pending/vitals', auth(['nurse']), getPatientsPendingVitals);
router.get('/nurse/stats', auth(['nurse']), getNurseStats);

// Receptionist-specific endpoints
router.get('/:patientId/appointments', auth(['receptionist', 'doctor', 'admin']), getPatientAppointments);
router.get('/appointments/today', auth(['receptionist',"doctor"]), getTodaysAppointments);
router.get('/receptionist/stats', auth(['receptionist']), getReceptionistStats);



export default router;
