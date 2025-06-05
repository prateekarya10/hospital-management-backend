
import { verifyToken } from '../utils/jwtUtils.js';
import TokenBlacklist from '../models/TokenBlacklist.js';

const auth = (requiredRoles = []) => async (req, res, next) => {
    try {
        const header = req.header('Authorization');
        const token = header?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

        const blacklisted = await TokenBlacklist.findOne({ token });
        if (blacklisted) return res.status(401).json({ msg: 'Token is blacklisted' });

        const decoded = verifyToken(token, process.env.JWT_SECRET);

        if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
            return res.status(403).json({ msg: 'Forbidden: insufficient role' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Invalid or expired token' });
    }
};

export default auth;