import express from "express";
import TrackController from "../controllers/TrackController.js";

const trackRouter = express.Router();

trackRouter.get('/getTrackFile/:trackId', TrackController.getTrackFile)
trackRouter.post('/getTrack/:trackId', TrackController.getTrack)
trackRouter.get('/getCover/:trackId', TrackController.getCover)
export default trackRouter;