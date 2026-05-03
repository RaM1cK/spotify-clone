import express from "express";
import ReleaseController from "../controllers/ReleaseController";

const releaseRouter = express.Router();
releaseRouter.post("/:releaseId", ReleaseController.getRelease)
releaseRouter.post("/:releaseId/tracks", ReleaseController.getReleaseTracks)
export default releaseRouter;