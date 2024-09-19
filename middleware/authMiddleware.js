const jwt = require("jsonwebtoken");
const HttpError = require("../model/errorModel");

const authMiddleware = async (req, res, next) => {
    // Extract Authorization header
    const Authorization = req.headers.authorization;

    // Check if Authorization header exists and starts with 'Bearer'
    if (Authorization && Authorization.startsWith('Bearer')) {
        // Extract token from 'Bearer <token>'
        const token = Authorization.split(' ')[1];

        // Verify token
        jwt.verify(token, process.env.JWT_SECRET, (err, info) => {
            if (err) {
                return next(new HttpError("Unauthorized Access, Invalid token", 403));
            }
            req.user = info; // Attach user info to request
            next(); // Move to the next middleware or route handler
        });

    } else {
        return next(new HttpError("Unauthorized Access, no token provided", 401)); // Return 401 for missing token
    }
};

module.exports = authMiddleware;
