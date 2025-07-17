const express = require('express');
const multer = require('multer');
const { auth, authorizeRoles } = require('../middleware/auth.js');
const {
  createAnnonce,
  getAllAnnonces,
  getAnnonceById,
} = require('../controllers/annonceController.js');

const router = express.Router();

// 📦 Configuration Multer pour upload des images
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ Création d'une annonce → propriétaire connecté uniquement
router.post(
  '/',
  auth,
  authorizeRoles('owner'),
  upload.array('images'),
  createAnnonce
);

// ✅ Consultation des annonces → ouverte au public
router.get('/', getAllAnnonces);
router.get('/:id', getAnnonceById);

module.exports = router;
