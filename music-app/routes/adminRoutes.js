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
router.post('/genres', isAdmin, genreController.createGenre);
router.put('/genres/:id', isAdmin, genreController.updateGenre);
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
//Album routes

router.post('/albums', albumController.createAlbum);
router.get('/albums', albumController.getAllAlbums);
router.get('/albums/artist/:artistId', albumController.getAlbumsByArtist);

module.exports = router;