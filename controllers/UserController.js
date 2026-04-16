import {User} from "../models/User.ts";

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

    res.status(201).json({})
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

    return res.status(201).json({})
}

export default {reg, auth}