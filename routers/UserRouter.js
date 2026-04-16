import express from "express";
import UserController from "../controllers/UserController.js";

const userRouter = express.Router();

userRouter.post("/reg", UserController.reg);
userRouter.post("/auth", UserController.auth);
export default userRouter;