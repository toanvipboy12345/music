const express = require('express');
const router = express.Router();
const genreController = require('../controllers/genreController');
const songController = require('../controllers/songController');
const artistController = require('../controllers/artistController');
const albumController = require('../controllers/albumController');
const isAdmin = require('../middleware/Admin');

// Genre routes
router.get('/genres', isAdmin, genreController.getGenres);
router.get('/genres/:id', isAdmin, genreController.getGenreById);
router.post('/genres/sync-spotify', isAdmin, genreController.syncGenresFromSpotify);

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

// Album routes
router.post('/albums', isAdmin, albumController.createAlbum);
router.get('/albums', isAdmin, albumController.getAllAlbums);
router.get('/albums/artist/:artistId', isAdmin, albumController.getAlbumsByArtist);

module.exports = router;