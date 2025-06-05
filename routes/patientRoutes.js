import express from 'express';
import {
    createPatient, searchPatients, analytics, getPatientById, updatePatient, deletePatient,
    getPatientAppointments,
    updatePatientVitals,
    getDoctorDashboardStats,
    getTodaysAppointments,
    getPatientsPendingVitals
} from '../controllers/patientController.js';
import { patientValidation, vitalsValidation } from '../utils/validators.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Doctor-only endpoints
router.post('/', auth(['doctor']), patientValidation, createPatient);
router.put('/:patientId', auth(['doctor']), updatePatient);
router.get('/dashboard-stats', auth(['doctor']), getDoctorDashboardStats);

// Admin-only endpoints
router.delete('/:patientId', auth(['admin']), deletePatient);
router.get('/analytics', auth(['admin']), analytics);

// Shared endpoints with different access levels
router.get('/search', auth(['doctor', 'nurse', 'receptionist', 'admin']), searchPatients);
router.get('/:patientId', auth(['doctor', 'nurse', 'receptionist', 'admin']), getPatientById);

// Nurse-specific endpoints
router.patch('/:patientId/vitals', auth(['nurse']), updatePatientVitals);
router.get('/pending-vitals', auth(['nurse']), getPatientsPendingVitals);


// Receptionist-specific endpoints
router.get('/:patientId/appointments', auth(['receptionist', 'doctor', 'admin']), getPatientAppointments);
router.get('/appointments/today', auth(['receptionist']), getTodaysAppointments);


export default router;
