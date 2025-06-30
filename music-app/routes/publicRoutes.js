const express = require('express');
const router = express.Router();
const highlightCollectionController = require('../controllers/highlightCollectionController');
const songController = require('../controllers/songController');
const listenController = require('../controllers/listenController');
// Public Highlight Collections routes (No authentication required)
router.get('/highlight-collections', highlightCollectionController.getHighlightCollections);
router.get('/highlight-collections/:artist_id', highlightCollectionController.getHighlightCollectionByArtist);

// Public Song routes (No authentication required)
router.post('/listen/song/:id', listenController.incrementSongListen);
module.exports = router;