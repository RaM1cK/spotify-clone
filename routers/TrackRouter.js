import express from "express";
import TrackController from "../controllers/TrackController.js";

const trackMiddleware = (req, res, next) => {
    const fetchDest = req.headers['sec-fetch-dest'];
    const fetchMode = req.headers['sec-fetch-mode'];
    const fetchSite = req.headers['sec-fetch-site'];
    const referer = req.headers['referer'];
    const range = req.headers.range;

    if (
        fetchDest !== 'audio'
        || fetchMode !== 'no-cors'
        || fetchSite !== 'same-origin'
        || !referer
        || !range
    )
        return res.status(403).send({
            error: 'Forbidden'
        });

    next()
}

const trackRouter = express.Router();

trackRouter.get('/', trackMiddleware,TrackController.getTrackFile)
trackRouter.post('/position', TrackController.saveLastPosition)
trackRouter.post('/token', TrackController.requestTrackToken)
export default trackRouter;