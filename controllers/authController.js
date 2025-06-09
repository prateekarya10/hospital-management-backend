import User from '../models/User.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import bcrypt from 'bcryptjs';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyToken
} from '../utils/jwtUtils.js';

// Register
export const register = async (req, res, next) => {
    try {
        const { username, password, role } = req.body;
        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashed, role });
        await user.save();
        res.status(201).json({ msg: 'User registered' });
    } catch (err) {
        next(err);
    }
};

// Login
export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ msg: 'Invalid credentials' });

        const payload = { userId: user._id, role: user.role };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        res.json({ accessToken, refreshToken, role: user.role });
    } catch (err) {
        next(err);
    }
};

// Logout (Blacklist refresh token)
export const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ msg: 'Refresh token required' });
        const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
        await TokenBlacklist.create({ token: refreshToken, expiresAt: new Date(decoded.exp * 1000) });
        res.json({ msg: 'Logged out' });
    } catch (err) {
        next(err);
    }
};

// Refresh access token
export const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ msg: 'Refresh token required' });

        const blacklisted = await TokenBlacklist.findOne({ token: refreshToken });
        if (blacklisted) return res.status(401).json({ msg: 'Blacklisted refresh token' });

        const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

        const payload = { userId: decoded.userId, role: decoded.role };
        const newAccessToken = generateAccessToken(payload);
        const newRefreshToken = generateRefreshToken(payload);

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        next(err);
    }
};

export const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });

        res.json(user);
    } catch (err) {
        next(err);
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password'); 
        res.status(200).json({
            status: 'SUCCESS',
            message: 'Users fetched successfully',
            data: users
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};