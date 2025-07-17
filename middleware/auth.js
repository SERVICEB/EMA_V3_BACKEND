// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

/**
 * 🔐 Middleware d'authentification : vérifie le token et récupère l'utilisateur
 */
const auth = async (req, res, next) => {
  console.log('--- Auth Middleware Start ---');
  try {
    const authHeader = req.header('Authorization');
    console.log('Auth Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth failed: No token or bad format');
      return res.status(401).json({ message: 'Accès refusé. Token manquant ou mal formaté.' });
    }

    const token = authHeader.substring(7); // Supprime "Bearer "
    console.log('Token:', token);

    // Vérifie et décode le token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded JWT:', decoded);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      throw jwtError;
    }

    // Récupère l'utilisateur dans la BDD sans le mot de passe
    const userId = decoded.id || decoded._id;
    console.log('User ID from token:', userId);
    const user = await User.findById(userId).select('-password');
    console.log('User from DB:', user);

    if (!user) {
      console.log('Auth failed: User not found in DB');
      return res.status(401).json({ message: 'Token invalide : utilisateur non trouvé.' });
    }

    // Injecte les infos utilisateur dans req.user
    req.user = {
      id: user._id,
      role: user.role || 'utilisateur',
      email: user.email,
      nom: user.nom,
      telephone: user.telephone,
    };
    console.log('User attached to request:', req.user);

    console.log('--- Auth Middleware Success ---');
    next();
  } catch (error) {
    console.error('❌ Erreur d\'authentification détaillée :', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide.' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré.' });
    }

    res.status(500).json({ message: 'Erreur serveur lors de l\'authentification.' });
  }
};

/**
 * ✅ Middleware d'autorisation : limite l'accès à certains rôles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: '⛔ Accès interdit : rôle non autorisé.' });
    }
    next();
  };
};

module.exports = { auth, authorizeRoles };
