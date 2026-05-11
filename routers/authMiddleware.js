import jwt from "jsonwebtoken";
import {redisClient} from "../models/index.js";
import {User} from "../models/User.ts";
import {userAttributes} from "../controllers/UserController.js";

const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) return res.status(401).send({ error: "Unauthorized" });

    try {
        const id = jwt.verify(token, process.env.SECRET_KEY).id;

        const userSession = await redisClient.get(`user:${id}`)

        if (!userSession) {
            const user = await User.findByPk(id, {
                attributes: userAttributes
            })

            if (!user) return res.status(404).send({ error: "User not found" });

            redisClient
                .set(`user:${id}`, JSON.stringify(user.toJSON()), { EX: 3600})
                .catch(error => console.log(error));

            req.user = user.toJSON();
        } else {
            req.user = JSON.parse(userSession)
        }

        next()
    } catch (error) {
        res.status(403).send({ error: "Invalid token" });
    }
}

export default authMiddleware;