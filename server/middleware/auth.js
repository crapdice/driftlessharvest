const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'harvest-secret-key-change-in-prod';

const checkRole = (roles) => (req, res, next) => {
    let token;

    // Priority: cookie > header > query (backwards compat)
    if (req.cookies && req.cookies.harvest_token) {
        token = req.cookies.harvest_token;
    } else if (req.headers.authorization) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) return res.status(401).json({ error: 'Unauthorized: Token required' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, role }

        if (roles && !roles.includes(decoded.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid Token' });
    }
};

const requireAdmin = (req, res, next) => {
    // Check if user exists and has is_admin flag
    const user = req.user;
    if (!user) {
        console.warn('[Auth] requireAdmin: No user attached to request');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[Auth] Checking Admin:', { id: user.id, email: user.email, is_admin: user.is_admin, role: user.admin_role });

    // Allow if is_admin is explicitly 1 OR if legacy role is admin/super_admin (fallback)
    if (user.is_admin === 1 || user.admin_role === 'admin' || user.admin_role === 'super_admin') {
        return next();
    }

    console.warn('[Auth] Forbidden: User is not admin', user);
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
};

const authenticateToken = (req, res, next) => {
    let token;

    // Priority: cookie > header (matches checkRole pattern for HttpOnly cookie auth)
    if (req.cookies && req.cookies.harvest_token) {
        token = req.cookies.harvest_token;
    } else {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    }

    if (token == null) return res.status(401).json({ error: 'Token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('[Auth] Token verification failed:', err.message);
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

module.exports = {
    checkRole,
    authenticateToken,
    JWT_SECRET
};
