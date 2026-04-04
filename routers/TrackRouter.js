import express from "express";
import TrackController from "../controllers/TrackController.js";

const trackRouter = express.Router();

trackRouter.get('/getTrackFile/:trackName', TrackController.getTrackFile)
trackRouter.post('/getTrack/:trackName', TrackController.getTrack)
export default trackRouter;