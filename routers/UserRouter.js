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
userRouter.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).send({});
});
userRouter.post("/get-users", UserController.getUsersByNickname);
userRouter.post("/favoriteReleases", UserController.getReleases);
userRouter.post("/favoriteTracks", UserController.getTracks);
userRouter.post('/removeFavoriteTrack/:trackId', userController.removeFavoriteTrack);
userRouter.post('/addFavoriteTrack/:trackId', userController.addFavoriteTrack);
export default userRouter;