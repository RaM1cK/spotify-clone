import express from "express";
import multer from "multer";
import PlaylistController from "../controllers/PlaylistController.js";

const upload = multer({ storage: multer.memoryStorage() });

const playlistRouter = express.Router();
playlistRouter.get('/:playlistId', PlaylistController.getPlaylist)
playlistRouter.post('/', upload.single('cover'), PlaylistController.createPlaylist)
export default playlistRouter;