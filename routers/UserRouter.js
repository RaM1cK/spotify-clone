import express from "express";
import UserController from "../controllers/UserController.js";

const userRouter = express.Router();

userRouter.post("/reg", UserController.reg);
userRouter.post("/auth", UserController.auth);
userRouter.get("/verify-email", UserController.verifyEmail)
userRouter.post("/get-users", UserController.getUsersByNickname);
userRouter.post("/search", UserController.normalizedSearch);

export default userRouter;