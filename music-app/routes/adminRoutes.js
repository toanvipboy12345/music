const express = require('express');
const router = express.Router();
const genreController = require('../controllers/genreController');
const songController = require('../controllers/songController');
const artistController = require('../controllers/artistController');
const albumController = require('../controllers/albumController');
const premiumController = require('../controllers/premiumController');
const isAdmin = require('../middleware/Admin');

// Genre routes
router.get('/genres', isAdmin, genreController.getGenres);
router.get('/genres/:id', isAdmin, genreController.getGenreById);
router.post('/genres/sync-spotify', isAdmin, genreController.syncGenresFromSpotify);
router.delete('/genres/:id', isAdmin, genreController.deleteGenre);

// Song routes
router.post('/songs', isAdmin, songController.createSong);
router.get('/songs', isAdmin, songController.getAllSongs);
router.get('/songs/:id', isAdmin, songController.getSong);
router.put('/songs/:id', isAdmin, songController.updateSong);
router.delete('/songs/:id', isAdmin, songController.deleteSong);

// Artist routes
router.post('/artists', isAdmin, artistController.createArtist);
router.get('/artists', isAdmin, artistController.getArtists);
router.get('/artists/search', isAdmin, artistController.searchArtistsByName);
router.post('/artists/sync', isAdmin, artistController.syncAllArtistsFromSpotify);
router.post('/artists/:id/sync', isAdmin, artistController.syncArtistFromSpotify);
// Album routes
router.post('/albums', isAdmin, albumController.createAlbum);
router.get('/albums', isAdmin, albumController.getAllAlbums);
router.get('/albums/artist/:artistId', isAdmin, albumController.getAlbumsByArtist);
router.put('/artists/:id/bio', isAdmin, artistController.updateArtistBio); // Thêm route mới
// Premium routes
router.post('/premium/plans', isAdmin, premiumController.createPremiumPlan);
router.put('/premium/plans/:plan_id', isAdmin, premiumController.updatePremiumPlan);
router.get('/premium/plans', isAdmin, premiumController.getPremiumPlans);
router.get('/premium/plans/:plan_id', isAdmin, premiumController.getPremiumPlanById);
router.get('/premium/subscriptions', isAdmin, premiumController.getPremiumSubscriptions);
router.post('/premium/subscriptions', isAdmin, premiumController.createPremiumSubscription);
router.delete('/premium/subscriptions/:subscription_id', isAdmin, premiumController.cancelPremiumSubscription);
module.exports = router;