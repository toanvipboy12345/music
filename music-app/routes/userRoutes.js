// const express = require('express');
// const router = express.Router();
// const playlistController = require('../controllers/playlistController');
// const isUser = require('../middleware/User');

// // Playlist routes for authenticated users
// // Đặt route tĩnh trước để ưu tiên khớp
// router.get('/playlists/user/:userId/summary', isUser, playlistController.getUserPlaylistsSummary);
// router.get('/playlists/user/:userId/:playlistId', isUser, playlistController.getPlaylistByUserId);
// router.post('/playlists', isUser, playlistController.createPlaylist);
// router.post('/playlists/:playlistId/songs', isUser, playlistController.addSongToPlaylist);
// router.delete('/playlists/:playlistId', isUser, playlistController.deletePlaylist);

// module.exports = router;
const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const queueController = require('../controllers/queueController');
const isUser = require('../middleware/User');

// Playlist routes for authenticated users
router.get('/playlists/user/:userId/summary', isUser, playlistController.getUserPlaylistsSummary);
router.get('/playlists/user/:userId/:playlistId', isUser, playlistController.getPlaylistByUserId);
router.post('/playlists', isUser, playlistController.createPlaylist);
router.post('/playlists/:playlistId/songs', isUser, playlistController.addSongToPlaylist);
router.delete('/playlists/:playlistId', isUser, playlistController.deletePlaylist);

// Queue routes for authenticated users
// Queue routes for authenticated users
router.get('/queue', isUser, queueController.getUserQueue);
router.post('/queue/add', isUser, queueController.addSongToQueue);
router.delete('/queue/remove/:song_id', isUser, queueController.removeSongFromQueue);
router.put('/queue/update-current', isUser, queueController.updateCurrentSong);
router.post('/queue/next', isUser, queueController.nextSong);
router.post('/queue/prev', isUser, queueController.prevSong);
router.delete('/queue/clear', isUser, queueController.clearQueue);
module.exports = router;