const express = require('express');
const router = express.Router();
const highlightCollectionController = require('../controllers/highlightCollectionController');

// Public Highlight Collections routes (No authentication required)
router.get('/highlight-collections', highlightCollectionController.getHighlightCollections);
router.get('/highlight-collections/:artist_id', highlightCollectionController.getHighlightCollectionByArtist);

module.exports = router;