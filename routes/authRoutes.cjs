// --------- File: ema-residences-backend/routes/authRoutes.js ---------
const express = require('express');
const { registerUser, authUser } = require('../controllers/authController.js');

const router = express.Router();

// Route POST pour l'inscription d'un utilisateur
router.post('/register', registerUser);

// Route POST pour la connexion d'un utilisateur
router.post('/login', authUser);

module.exports = router;
