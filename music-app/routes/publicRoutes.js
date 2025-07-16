// const express = require('express');
// const router = express.Router();
// const highlightCollectionController = require('../controllers/highlightCollectionController');
// const songController = require('../controllers/songController');
// const listenController = require('../controllers/listenController');
// const albumController = require('../controllers/albumController');
// const artistController = require('../controllers/artistController');
// const searchController = require('../controllers/searchController'); // Thêm import searchController

// // Public Highlight Collections routes (No authentication required)
// router.get('/highlight-collections', highlightCollectionController.getHighlightCollections);
// router.get('/highlight-collections/:artist_id', highlightCollectionController.getHighlightCollectionByArtist);

// // Public Song routes (No authentication required)
// router.post('/listen/song/:id', listenController.incrementSongListen);

// // Public Album routes (No authentication required)
// router.get('/albums/:albumId', albumController.getAlbumById);

// // Public Artist routes (No authentication required)
// router.get('/artists/:id/detail', artistController.getArtistDetail);

// // Public Search routes (No authentication required)
// router.get('/search', searchController.searchAll);

// module.exports = router;
const express = require('express');
const router = express.Router();
const highlightCollectionController = require('../controllers/highlightCollectionController');
const songController = require('../controllers/songController');
// const listenController = require('../controllers/listenController');
const albumController = require('../controllers/albumController');
const artistController = require('../controllers/artistController');
const searchController = require('../controllers/searchController');
const testSongMigrationController = require('../controllers/testSongMigrationController');
const exploreController = require('../controllers/exploreController'); // Thêm import exploreController
const rankingController = require('../controllers/rankingController');
// Public Highlight Collections routes
router.get('/highlight-collections', highlightCollectionController.getHighlightCollections);
router.get('/highlight-collections/:artist_id', highlightCollectionController.getHighlightCollectionByArtist);
router.get('/artists/top-popular', highlightCollectionController.getTopPopularArtists); // Thêm route mới
// Public Song routes
// router.post('/listen/song/:id', listenController.incrementSongListen);
router.post('/songs/:id/migrate-to-cloud', testSongMigrationController.testMigrateSongToCloud);
router.get('/songs/:id/test', testSongMigrationController.getTestSong);
router.get('/songs/:id/download', testSongMigrationController.downloadSong);
router.post('/songs/migrate-all-to-cloud', testSongMigrationController.migrateAllSongsToCloud);
router.get('/songs/new-releases', highlightCollectionController.getNewReleaseSongs); // Route mới

// Public Album routes
// Public Album routes
router.get('/albums/top-popular', highlightCollectionController.getTopPopularAlbums); // Di chuyển lên trước
router.get('/albums/:albumId', albumController.getAlbumById); // Đặt sau

// Public Artist routes
router.get('/artists/:id/detail', artistController.getArtistDetail);

// Public Search routes
router.get('/search', searchController.searchAll);
// Public Explore routes
router.get('/explore/genres', exploreController.getGenres);
router.get('/explore/genres/:id/songs', exploreController.getTopSongsByGenre);
router.get('/playlists/top-liked', highlightCollectionController.getTopLikedPlaylists); // Thêm route mới cho top liked playlists
router.get('/playlists/admin', highlightCollectionController.getAdminPlaylists); // Thêm route mới cho bài hát mới phát hành
router.get('/ranking/top-songs', rankingController.getWeeklyRanking); // Thêm route mới cho top songs


module.exports = router;