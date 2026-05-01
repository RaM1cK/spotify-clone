import express from "express";
import ReleaseController from "../controllers/ReleaseController";

const releaseRouter = express.Router();
releaseRouter.post("/getRelease/:releaseId", ReleaseController.getRelease)
releaseRouter.get("/getCover/:releaseId", ReleaseController.getCover)
export default releaseRouter;