const express = require('express');
const router = express.Router();
const highlightCollectionController = require('../controllers/highlightCollectionController');
const songController = require('../controllers/songController');
const listenController = require('../controllers/listenController');
const albumController = require('../controllers/albumController');
const artistController = require('../controllers/artistController');
const searchController = require('../controllers/searchController'); // Thêm import searchController

// Public Highlight Collections routes (No authentication required)
router.get('/highlight-collections', highlightCollectionController.getHighlightCollections);
router.get('/highlight-collections/:artist_id', highlightCollectionController.getHighlightCollectionByArtist);

// Public Song routes (No authentication required)
router.post('/listen/song/:id', listenController.incrementSongListen);

// Public Album routes (No authentication required)
router.get('/albums/:albumId', albumController.getAlbumById);

// Public Artist routes (No authentication required)
router.get('/artists/:id/detail', artistController.getArtistDetail);

// Public Search routes (No authentication required)
router.get('/search', searchController.searchAll);

module.exports = router;