import {User} from "../models/User.ts";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import io from "../server.js"

dotenv.config();

function sendVerificationLink(email) {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_FROM,
            pass: process.env.MAIL_PASSWORD
        }
    })

    const tokenEmailVerify = jwt.sign({ email }, process.env.SECRET_KEY, {
        expiresIn: '5m', //для тестов
    })

    const tokenAuth = jwt.sign({ email }, process.env.SECRET_KEY)

    const result = transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: "Spotify Clone",
        html: `Для подтверждения email перейдите по <a href="${process.env.IP_APP}/api/users/verify-email?token=${tokenEmailVerify}">ссылке</a>`
    })

    return tokenAuth;
}
//TODO: сделать одноразовую ссылку
const verifyEmail = async (req, res) => {
    const token = req.query.token;

    try {
        const email = jwt.verify(token, process.env.SECRET_KEY).email;
        console.log(email)

        io.to(`user:${email}`).emit('email-verified', { message: email });
        return res.status(200).send({})
    } catch (error) {
        return res.status(500).send({error: "Token verifying error"});
    }
}

const reg = async (req, res) => {
    const regData = req.body;

    const [user, created] = await User.findOrCreate({
            where: {
                email: regData.email,
            },
            defaults: regData
        }
    )

    if (!created) {
        console.log(created);

        return res.status(409).json({})
    }

    res.status(201).send(sendVerificationLink(regData.email))
}

const auth = async (req, res) => {
    const authData = req.body;

    const user = await User.findOne({
        where: {
            email: authData.email,
        }
    })

    if (!user) {
        return res.status(409).json({})
    } else if (user.password_hash !== authData.password_hash) {
        return res.status(400).json({})
    }

    res.status(201).send(sendVerificationLink(authData.email))
}

const getUsersByNickname = async (req, res) => {
    const nickname = req.body.nickname

    const user = await User.findAll({
        where: { nickname },
        attributes: {
            exclude: ['password_hash', 'createdAt', 'updatedAt'],
        }
    })

    if (!user) {
        return res.status(404).json({})
    } else {
        return res.status(200).send(user)
    }
}

export default {reg, auth, verifyEmail, getUsersByNickname}