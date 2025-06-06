import express from 'express';
import { register, login, logout, refresh, getProfile, getAllUsers } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/profile', auth(), getProfile);
router.get('/users', auth(), getAllUsers); 

export default router;