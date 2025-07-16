const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const queueController = require('../controllers/queueController');
const isUser = require('../middleware/User');
const userController = require('../controllers/userController');
const userPremiumController = require('../controllers/userPremiumController'); // Đảm bảo import đúng
const downloadController = require('../controllers/downloadController');
const isPremiumUser = require('../middleware/PremiumUser');
const listenController = require('../controllers/listenController');

const libraryController = require('../controllers/libraryController');
// Playlist routes for authenticated users
router.get('/playlists/user/:userId/summary', isUser, playlistController.getUserPlaylistsSummary);
router.get('/playlists/user/:userId/:playlistId', isUser, playlistController.getPlaylistByUserId);
router.post('/playlists', isUser, playlistController.createPlaylist);
router.post('/playlists/:playlistId/songs', isUser, playlistController.addSongToPlaylist);
router.delete('/playlists/:playlistId', isUser, playlistController.deletePlaylist);

// Queue routes for authenticated users
router.get('/queue', isUser, queueController.getUserQueue);
router.post('/queue/add', isUser, queueController.addSongToQueue);
router.delete('/queue/remove/:song_id', isUser, queueController.removeSongFromQueue);
router.put('/queue/update-current', isUser, queueController.updateCurrentSong);
router.post('/queue/next', isUser, queueController.nextSong);
router.post('/queue/prev', isUser, queueController.prevSong);
router.delete('/queue/clear', isUser, queueController.clearQueue);
router.post('/queue/play-content', isUser, queueController.playContent); // Thêm endpoint mới
router.post('/like-playlist/:playlistId', isUser, userController.likePlaylist);
router.delete('/like-playlist/:playlistId', isUser, userController.unlikePlaylist);
router.get('/like-playlist/:userId/:playlistId', isUser, userController.checkPlaylistLike); // Thêm tuyến này
// Artist follow routes
router.post('/follow-artist/:artistId', isUser, userController.followArtist);
router.delete('/follow-artist/:artistId', isUser, userController.unfollowArtist);
router.get('/follow-artist/:userId/:artistId', isUser, userController.checkArtistFollow);
// Premium plan routes
// Premium plan user/premium/plan
router.get('/premium/plans', userPremiumController.getPublicPremiumPlans);
router.post('/premium/vnpay', isUser, userPremiumController.createVnpayPayment);
router.get('/premium/vnpay_return', userPremiumController.handleVnpayReturn);
router.post('/premium/vnpay_ipn', userPremiumController.handleVnpayIPN);
router.post('/premium/subscribe', isUser, userPremiumController.createPremiumSubscription);
router.delete('/premium/subscribe/:subscription_id', isUser, userPremiumController.cancelPremiumSubscription);
router.get('/premium/plans/:plan_id', userPremiumController.getPremiumPlanById);
// Download song route for premium users
router.get('/songs/:songId/download', isPremiumUser, downloadController.downloadSong);
router.get('/download-history', isPremiumUser, downloadController.getDownloadHistory);
// User library routes
router.get('/library', isUser, libraryController.getUserLibrary);
router.post('/listen/song/:id',isUser, listenController.incrementSongListen);
router.get('/profile', isUser, userController.getUserProfile);
router.post('/avatar', isUser, userController.updateAvatar); // Thêm tuyến đường mới cho avatar

module.exports = router;