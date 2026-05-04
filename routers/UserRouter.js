import express from "express";
import UserController from "../controllers/UserController.js";
import authMiddleware from './authMiddleware.js';
import userController from "../controllers/UserController.js";

const userRouter = express.Router();


userRouter.post("/reg", UserController.reg);
userRouter.post("/auth", UserController.auth);
userRouter.get("/verify-email", UserController.verifyEmail)
userRouter.use(authMiddleware)
userRouter.get('/me', (req, res) => {
    res.json({ id: req.user.id, email: req.user.email });
})
userRouter.post('/logout', UserController.logout);
userRouter.post("/get-users", UserController.getUsersByNickname);
userRouter.get("/favoriteReleases", UserController.getReleases);
userRouter.get("/favoriteTracks", UserController.getTracks);
userRouter.post('/removeFavoriteTrack/:trackId', userController.removeFavoriteTrack);
userRouter.post('/addFavoriteTrack/:trackId', userController.addFavoriteTrack);
userRouter.get("/favoriteArtists", UserController.getFavoriteArtists);
userRouter.get("/favoritePlaylists", UserController.getFavoritePlaylists);
export default userRouter;