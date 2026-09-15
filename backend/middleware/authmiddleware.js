import jwt from "jsonwebtoken";

export const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(400).json({
                message: "unauthorised user"
            });
        }
        const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || "supersecretkey12345";
        const decoded = jwt.verify(token, secret);
        req.user = { id: decoded.id };
        next();
    } catch (error) {
        console.log("Auth middleware error:", error.message);
        return res.status(401).json({ 
            message: "Invalid or expired token" 
        });
    }
};
