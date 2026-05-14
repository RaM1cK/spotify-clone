import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) return res.status(401).send({ error: "Unauthorized" });

    try {
        req.user = jwt.verify(token, process.env.SECRET_KEY);
        next()
    } catch (error) {
        res.status(403).send({ error: "Invalid token" });
    }
}

export default authMiddleware;