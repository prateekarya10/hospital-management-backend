import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    patientId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    contactInfo: {
        phone: String,
        email: String,
        address: String
    },

    vitals: {
        bloodPressure: String,
        temperature: Number,
        pulse: Number,
        weight: Number,
        height: Number,
        lastUpdated: Date
    },

    appointments: [{
        date: Date,
        department: String,
        doctor: String,
        reason: String,
        status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'] }
    }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

patientSchema.index({ name: 'text', patientId: 'text', 'contactInfo.phone': 'text' });
const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
