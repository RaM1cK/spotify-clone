import express from "express";
import UserController, {userAttributes} from "../controllers/UserController.js";
import authMiddleware from './authMiddleware.js';
import userController from "../controllers/UserController.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {Friendship} from "../models/Friendship.ts";
import {Op} from "@sequelize/core";
import {User} from "../models/User.ts";

dotenv.config();

const userRouter = express.Router();


userRouter.post("/reg", UserController.reg);
userRouter.post("/auth", UserController.auth);
userRouter.get("/verify-email", UserController.verifyEmail)
userRouter.use(authMiddleware)
userRouter.get('/me', async (req, res) => {
    const friendships = await Friendship.findAll({
        where: {
            [Op.or]: [
                { sender_id: req.user.id },
                { receiver_id: req.user.id }
            ]
        },
        include: [
            { model: User, as: 'sender' , attributes: userAttributes },
            { model: User, as: 'receiver', attributes: userAttributes }
        ]
    })

    const { friends, incomingRequests, outgoingRequests } = friendships.reduce((acc, f) => {
        if (f.request_accepted) acc.friends.push(f.senderId === req.user.id ? f.receiver : f.sender);
        else if (f.senderId === req.user.id) acc.outgoingRequests.push(f.receiver)
        else acc.incomingRequests.push(f.sender)


        return acc
    }, { friends: [], incomingRequests: [], outgoingRequests: [] })

    const {iat, ...rest} = req.user

    res.status(200).send({
        ...rest,
        friends,
        incomingRequests,
        outgoingRequests
    });
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