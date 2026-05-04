import express from "express";
import ReleaseController from "../controllers/ReleaseController";

const releaseRouter = express.Router();
releaseRouter.get("/:releaseId", ReleaseController.getRelease)
releaseRouter.get("/:releaseId/tracks", ReleaseController.getReleaseTracks)
export default releaseRouter;