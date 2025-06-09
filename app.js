import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import connectDB from './config/db.js';
import patientRoutes from './routes/patientRoutes.js';
import authRoutes from './routes/authRoutes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
connectDB();

app.use(cors({
    origin: ["http://localhost:5173",   "https://arya-health-care.vercel.app"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));