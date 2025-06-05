import { body } from 'express-validator';
export const patientValidation = [
    body('patientId')
        .notEmpty().withMessage('Patient ID is required')
        .isAlphanumeric().withMessage('Patient ID must be alphanumeric'),

    body('name')
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

    body('age')
        .notEmpty().withMessage('Age is required')
        .isInt({ min: 0, max: 120 }).withMessage('Age must be between 0 and 120'),

    body('gender')
        .notEmpty().withMessage('Gender is required')
        .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),

    body('contactInfo.phone')
        .notEmpty().withMessage('Phone number is required')
        .isMobilePhone().withMessage('Invalid phone number format'),

    body('contactInfo.email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('contactInfo.address')
        .optional()
        .isString().withMessage('Address must be text')
        .isLength({ max: 200 }).withMessage('Address cannot exceed 200 characters')
];



export const vitalsValidation = [
    body('bloodPressure')
        .notEmpty().withMessage('Blood pressure is required')
        .matches(/^\d{2,3}\/\d{2,3}$/).withMessage('Blood pressure must be in format "120/80"'),

    body('temperature')
        .notEmpty().withMessage('Temperature is required')
        .isFloat({ min: 35, max: 42 }).withMessage('Temperature must be between 35°C and 42°C'),

    body('pulse')
        .notEmpty().withMessage('Pulse rate is required')
        .isInt({ min: 30, max: 200 }).withMessage('Pulse must be between 30 and 200 bpm'),

    body('weight')
        .optional()
        .isFloat({ min: 0.5, max: 300 }).withMessage('Weight must be between 0.5kg and 300kg'),

    body('height')
        .optional()
        .isFloat({ min: 30, max: 250 }).withMessage('Height must be between 30cm and 250cm')
];
