import express from "express";
import UserController from "../controllers/UserController.js";
import authMiddleware from './authMiddleware.js';
import userController from "../controllers/UserController.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const userRouter = express.Router();


userRouter.post("/reg", UserController.reg);
userRouter.post("/auth", UserController.auth);
userRouter.get("/verify-email", UserController.verifyEmail)
userRouter.use(authMiddleware)
userRouter.get('/me', (req, res) => {
    res.status(200).send(req.user);
})
userRouter.post('/logout', UserController.logout);
userRouter.post("/get-users", UserController.getUsersByNickname);
userRouter.get('/:userId', async (req, res) => {
    const user = await UserController.getUser(req, res)

    res.status(200).send(user);
})
userRouter.get("/:userId/favoriteReleases", UserController.getReleases);
userRouter.get("/:userId/favoriteTracks", UserController.getTracks);
userRouter.post('/removeFavoriteTrack/:trackId', userController.removeFavoriteTrack);
userRouter.post('/addFavoriteTrack/:trackId', userController.addFavoriteTrack);
userRouter.get("/:userId/favoriteArtists", UserController.getFavoriteArtists);
userRouter.get("/:userId/favoritePlaylists", UserController.getFavoritePlaylists);
userRouter.get("/:userId/chats", UserController.getChats);
export default userRouter;