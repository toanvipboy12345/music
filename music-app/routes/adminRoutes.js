const express = require('express');
const router = express.Router();
const path = require('path');
const genreController = require('../controllers/genreController');
const songController = require('../controllers/songController');
const artistController = require('../controllers/artistController');
const isAdmin = require('../middleware/Admin');

// Debug đường dẫn
console.log('Đường dẫn tới upload.js:', path.resolve(__dirname, '../middleware/upload'));

const upload = require('../middleware/upload'); // Giữ nguyên nếu đường dẫn đúng
console.log('Upload module:', upload); // Debug

// Genre routes
router.get('/genres', isAdmin, genreController.getGenres);
router.get('/genres/:id', isAdmin, genreController.getGenreById);
router.post('/genres', isAdmin, genreController.createGenre);
router.put('/genres/:id', isAdmin, genreController.updateGenre);
router.delete('/genres/:id', isAdmin, genreController.deleteGenre);

// Song routes
router.post('/songs', isAdmin, upload.single('audio_file'), songController.createSong);
router.get('/songs', isAdmin, songController.getAllSongs); // Thêm route mới
router.get('/songs/:id', isAdmin, songController.getSong);
router.post('/artists', isAdmin, artistController.createArtist);
// Artist routes
router.get('/artists', isAdmin, artistController.getArtists);

module.exports = router;