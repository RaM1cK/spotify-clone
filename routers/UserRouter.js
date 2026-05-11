import express from "express";
import UserController, {userAttributes} from "../controllers/UserController.js";
import authMiddleware from './authMiddleware.js';
import userController from "../controllers/UserController.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {Friendship} from "../models/Friendship.ts";
import {Op} from "@sequelize/core";
import {User} from "../models/User.ts";
import {redisClient} from "../models/index.js";
import {getTracksBySecret, getTracksBySecretFromCache} from "../controllers/TrackController.js";

dotenv.config();

const userRouter = express.Router();


userRouter.post("/reg", UserController.reg);
userRouter.post("/auth", UserController.auth);
userRouter.get("/verify-email", UserController.verifyEmail)
userRouter.use(authMiddleware)
userRouter.get('/me', async (req, res) => {
    const userFriendships = await redisClient.get(`friendships:${req.user.id}`);
    const userCurrentTrack = await redisClient.get(`currentTrack:${req.user.id}`);

    const {iat, ...rest} = req.user
    let currentTrack = undefined;

    if (userCurrentTrack) currentTrack = getTracksBySecretFromCache(req, res, [JSON.parse(userCurrentTrack)])[0];

    if (!userFriendships) {
        const friendships = await Friendship.findAll({
            where: {
                [Op.or]: [
                    { sender_id: rest.id },
                    { receiver_id: rest.id }
                ]
            },
            include: [
                { model: User, as: 'sender' , attributes: userAttributes },
                { model: User, as: 'receiver', attributes: userAttributes }
            ]
        })

        const { friends, incomingRequests, outgoingRequests } = friendships.reduce((acc, f) => {
            if (f.request_accepted) acc.friends.push(f.senderId === rest.id ? f.receiver : f.sender);
            else if (f.senderId === rest.id) acc.outgoingRequests.push(f.receiver)
            else acc.incomingRequests.push(f.sender)


            return acc
        }, { friends: [], incomingRequests: [], outgoingRequests: [] })

        await redisClient.set(`friendships:${rest.id}`, JSON.stringify({
            friends,
            incomingRequests,
            outgoingRequests
        }), { EX: 3600 })

        res.status(200).send({
            ...rest,
            friends,
            incomingRequests,
            outgoingRequests,
            currentTrack
        });
    } else {
        res.status(200).send({
            ...rest,
            ...JSON.parse(userFriendships),
            currentTrack
        })
    }
})
userRouter.delete('/reject/:senderId', UserController.rejectFriendRequest);
userRouter.post('/accept/:senderId', UserController.acceptFriendRequest);
userRouter.delete('/cancel/:receiverId', UserController.cancelFriendRequest);
userRouter.post('/logout', UserController.logout);
userRouter.post("/get-users", UserController.getUsersByNickname);
userRouter.get('/:userId', async (req, res) => {
    const user = await UserController.getUser(req, res)

    res.status(200).send(user);
})
userRouter.get("/:userId/favoriteReleases", UserController.getReleases);
userRouter.get("/:userId/favoriteTracks", UserController.getTracks);
userRouter.delete('/removeFavoriteTrack/:trackId', userController.removeFavoriteTrack);
userRouter.post('/addFavoriteTrack/:trackId', userController.addFavoriteTrack);
userRouter.get("/:userId/favoriteArtists", UserController.getFavoriteArtists);
userRouter.get("/:userId/favoritePlaylists", UserController.getFavoritePlaylists);
userRouter.get("/:userId/chats", UserController.getChats);
export default userRouter;