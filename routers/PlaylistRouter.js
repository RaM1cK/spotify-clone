import express from "express";
import PlaylistController from "../controllers/PlaylistController.js";

const playlistRouter = express.Router();
playlistRouter.get('/:playlistId', PlaylistController.getPlaylist)
playlistRouter.get('/:playlistId/tracks', PlaylistController.getPlaylistTracks)
export default playlistRouter;