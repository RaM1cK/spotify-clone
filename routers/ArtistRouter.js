import express from "express";
import ArtistController from "../controllers/ArtistController.js";

const artistRouter = express.Router()

artistRouter.get('/:artistId', ArtistController.getArtist);
artistRouter.get('/:artistId/tracks', ArtistController.getTracks);
artistRouter.get('/:artistId/releases', ArtistController.getReleases);
export default artistRouter;