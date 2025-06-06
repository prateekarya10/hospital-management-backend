import Patient from '../models/Patient.js';
import { validationResult } from 'express-validator';

// Create patient (Doctor only)
export const createPatient = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const patient = new Patient({
            ...req.body,
            createdBy: req.user.id
        });
        await patient.save();
        res.status(201).json(patient);
    } catch (err) {
        next(err);
    }
};

// Search patients (All roles)
export const searchPatients = async (req, res, next) => {
    try {
        const { search, page = 1, limit = 10, sort = 'name' } = req.query;
        let query = {};

        const projection = req.user.role === 'receptionist' ?
            { name: 1, patientId: 1, contactInfo: 1, appointments: 1 } : {};

        if (search) query.$text = { $search: search };

        const patients = await Patient.find(query, projection)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort(sort)
            .exec();

        const total = await Patient.countDocuments(query);

        res.json({ total, page: Number(page), patients });
    } catch (err) {
        next(err);
    }
};

export const getPatientById = async (req, res, next) => {
    try {
        let patient;

        if (req.user.role === 'receptionist') {
            patient = await Patient.findOne({ patientId: req.params.patientId })
                .select('name patientId contactInfo appointments');
        } else if (req.user.role === 'nurse') {
            patient = await Patient.findOne({ patientId: req.params.patientId })
                .select('-medicalHistory -currentPrescriptions -billingInfo');
        } else {
            patient = await Patient.findOne({ patientId: req.params.patientId });
        }

        if (!patient) return res.status(404).json({ msg: 'Patient not found' });
        res.json(patient);
    } catch (err) {
        next(err);
    }
};

// Update patient (Doctor only)
export const updatePatient = async (req, res, next) => {
    try {
        const updateData = { ...req.body };
        if (updateData.contactInfo) {
            const patient = await Patient.findOne({ patientId: req.params.patientId });
            if (!patient) return res.status(404).json({ msg: 'Patient not found' });

            updateData.contactInfo = {
                ...patient.contactInfo.toObject(), // purana contactInfo
                ...updateData.contactInfo,        // naya partial update
            };

            // Fir update karenge
            const updatedPatient = await Patient.findOneAndUpdate(
                { patientId: req.params.patientId },
                { $set: updateData },
                { new: true }
            );

            return res.json(updatedPatient);
        }
        const patient = await Patient.findOneAndUpdate(
            { patientId: req.params.patientId },
            { $set: updateData },
            { new: true }
        );

        if (!patient) return res.status(404).json({ msg: 'Patient not found' });
        res.json(patient);
    } catch (err) {
        next(err);
    }
};

export const getDoctorDashboardStats = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const doctorName = req.user.name;

        // Count patients with today's appointments for this doctor
        const patientsToday = await Patient.countDocuments({
            appointments: {
                $elemMatch: {
                    date: { $gte: todayStart, $lte: todayEnd },
                    doctor: doctorName
                }
            }
        });

        // Appointments Left
        const appointmentsLeft = await Patient.aggregate([
            { $unwind: '$appointments' },
            {
                $match: {
                    'appointments.date': { $gte: new Date() },
                    'appointments.status': 'Scheduled',
                    'appointments.doctor': doctorName
                }
            },
            { $count: 'count' }
        ]);

        // Completed Appointments Today
        const appointmentsCompleted = await Patient.aggregate([
            { $unwind: '$appointments' },
            {
                $match: {
                    'appointments.date': { $gte: todayStart, $lte: todayEnd },
                    'appointments.status': 'Completed',
                    'appointments.doctor': doctorName
                }
            },
            { $count: 'count' }
        ]);

        // New Patients
        const newPatients = await Patient.countDocuments({
            createdAt: { $gte: todayStart, $lte: todayEnd },
            createdBy: req.user._id // optionally filter by doctor user ID
        });

        res.json({
            patientsToday,
            appointmentsLeft: appointmentsLeft[0]?.count || 0,
            appointmentsCompleted: appointmentsCompleted[0]?.count || 0,
            newPatients
        });
    } catch (err) {
        res.status(500).json({ error: 'Server Error', message: err.message });
    }
};

// Update Appointment (Doctor ,Receptionist)
export const updatePatientAppointment = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { appointmentDate, updates } = req.body;
        // appointmentDate = string or Date which identifies appointment
        // updates = { status: 'Completed', reason: 'Updated reason', ... }

        if (!appointmentDate || !updates) {
            return res.status(400).json({ message: "appointmentDate and updates are required" });
        }

        const patient = await Patient.findOne({ patientId });
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        // Find the appointment to update
        const appointment = patient.appointments.find(app =>
            new Date(app.date).getTime() === new Date(appointmentDate).getTime()
        );

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Update only the provided keys in appointment
        Object.keys(updates).forEach(key => {
            appointment[key] = updates[key];
        });

        await patient.save();

        return res.status(200).json({ message: "Appointment updated successfully", appointment });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};



// Update vitals (Nurse only)
export const updatePatientVitals = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const patient = await Patient.findOneAndUpdate(
            { patientId: req.params.patientId },
            {
                $set: {
                    'vitals': req.body,
                    'lastUpdatedBy': req.user.id
                }
            },
            { new: true }
        );
        if (!patient) return res.status(404).json({ msg: 'Patient not found' });
        res.json(patient);
    } catch (err) {
        next(err);
    }
};
// Get patients with vitals not updated today (Nurse only)
export const getPatientsPendingVitals = async (req, res, next) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const patients = await Patient.find({
            'vitals.updatedAt': { $not: { $gte: todayStart, $lte: todayEnd } },
        }).select('patientId name contactInfo');

        res.json(patients);
    } catch (err) {
        next(err);
    }
};


export const getNurseStats = async (req, res, next) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Total patients assigned to this nurse
        // Assuming req.user.id contains the logged-in nurse's user id
        const totalPatientsAssigned = await Patient.countDocuments({ assignedNurse: req.user.id });

        // Patients with vitals updated today
        const vitalsUpdatedToday = await Patient.countDocuments({
            assignedNurse: req.user.id,
            'vitals.lastUpdated': { $gte: todayStart, $lte: todayEnd },
        });

        // Patients with vitals pending (not updated today)
        const patientsToCheck = totalPatientsAssigned - vitalsUpdatedToday;

        res.json({
            patientsToCheck,
            vitalsUpdatedToday,
            totalPatientsAssigned,
        });
    } catch (err) {
        next(err);
    }
};


// Get appointments (Receptionist + Doctor + Admin)
export const getPatientAppointments = async (req, res, next) => {
    try {
        const patient = await Patient.findOne({ patientId: req.params.patientId })
            .select('appointments name patientId');
        if (!patient) return res.status(404).json({ msg: 'Patient not found' });
        res.json(patient.appointments);
    } catch (err) {
        next(err);
    }
};

// (Receptionist Only)
export const getTodaysAppointments = async (req, res, next) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const appointments = await Patient.aggregate([
            { $unwind: '$appointments' },
            {
                $match: {
                    'appointments.date': { $gte: todayStart, $lte: todayEnd }
                }
            },
            {
                $project: {
                    patientId: 1,
                    name: 1,
                    appointment: '$appointments',
                }
            },
            { $sort: { 'appointment.date': 1 } }
        ]);

        res.json(appointments);
    } catch (err) {
        next(err);
    }
};
// (Receptionist Only)

export const getReceptionistStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Total patients count
        const totalPatients = await Patient.countDocuments();

        // Today's appointments
        const todaysAppointments = await Patient.aggregate([
            { $unwind: "$appointments" },
            {
                $match: {
                    "appointments.date": {
                        $gte: today,
                        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                    },
                },
            },
            { $count: "count" },
        ]);

        // Pending appointments
        const pendingAppointments = await Patient.aggregate([
            { $unwind: "$appointments" },
            {
                $match: {
                    "appointments.status": "Scheduled",
                },
            },
            { $count: "count" },
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalPatients,
                todaysAppointments: todaysAppointments[0]?.count || 0,
                pendingAppointments: pendingAppointments[0]?.count || 0,
            },
        });
    } catch (err) {
        console.error("Error fetching receptionist stats:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


// Delete patient (Admin only)
export const deletePatient = async (req, res, next) => {
    try {
        const patient = await Patient.findOneAndDelete({ patientId: req.params.patientId });
        if (!patient) return res.status(404).json({ msg: 'Patient not found' });
        res.json({ msg: 'Patient deleted successfully' });
    } catch (err) {
        next(err);
    }
};

export const analytics = async (req, res, next) => {
    try {
        const [
            appointmentsPerDepartment,
            appointmentsPerStatus,
            averageAge,
            genderDistribution,
            totalPatients
        ] = await Promise.all([

            // 1. Appointments per Department
            Patient.aggregate([
                { $unwind: "$appointments" },
                { $group: { _id: "$appointments.department", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // 2. Appointments per Status
            Patient.aggregate([
                { $unwind: "$appointments" },
                { $group: { _id: "$appointments.status", count: { $sum: 1 } } }
            ]),

            // 3. Average Age
            Patient.aggregate([
                { $group: { _id: null, avgAge: { $avg: "$age" } } }
            ]),

            // 4. Gender Distribution
            Patient.aggregate([
                { $group: { _id: "$gender", count: { $sum: 1 } } }
            ]),

            // 5. Total Patients
            Patient.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            totalPatients,
            averageAge: averageAge[0]?.avgAge || 0,
            genderDistribution,
            appointmentsPerDepartment,
            appointmentsPerStatus
        });

    } catch (error) {
        console.error("Analytics error:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics', error });
    }
};

