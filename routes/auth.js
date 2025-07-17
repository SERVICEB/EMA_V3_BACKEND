import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
  try {
    console.log('Données reçues pour inscription:', req.body);
    
    const { name, email, password, role } = req.body;
    
    // Vérifications basiques
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Nom, email et mot de passe sont requis" 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: "Utilisateur existe déjà" 
      });
    }

    // Valider le rôle s'il est fourni
    const validRoles = ['client', 'admin', 'proprietaire'];
    const userRole = role && validRoles.includes(role) ? role : 'client';

    // Créer le nouvel utilisateur (le mot de passe sera hashé automatiquement par le middleware pre('save'))
    const newUser = new User({ 
      name, 
      email, 
      password, // Ne pas hasher ici, c'est fait dans le modèle
      role: userRole 
    });
    
    await newUser.save();

    // Générer le token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || 'votre_secret_jwt_par_defaut',
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      success: true,
      message: "Utilisateur créé avec succès",
      token,
      user: { 
        id: newUser._id, 
        name: newUser.name, 
        email: newUser.email,
        role: newUser.role 
      }
    });

  } catch (err) {
    console.error('Erreur à l\'inscription :', err);
    
    // Gestion des erreurs de validation
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Erreur interne du serveur',
      error: err.message 
    });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    console.log('Tentative de connexion pour:', req.body.email);
    
    const { email, password } = req.body;
    
    // Vérifications basiques
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email et mot de passe sont requis" 
      });
    }

    // Trouver l'utilisateur avec le mot de passe (car select: false par défaut)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Email ou mot de passe incorrect" 
      });
    }

    // Vérifier le mot de passe en utilisant la méthode du modèle
    const isMatch = await user.correctPassword(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Email ou mot de passe incorrect" 
      });
    }

    // Vérifier si l'utilisateur est actif
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: "Compte désactivé" 
      });
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Générer le token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'votre_secret_jwt_par_defaut',
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true,
      message: "Connexion réussie",
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        role: user.role 
      }
    });

  } catch (err) {
    console.error('Erreur à la connexion :', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur interne du serveur',
      error: err.message 
    });
  }
});

// Route de vérification du token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt_par_defaut');
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non autorisé'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Erreur de vérification:', err);
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
});

export default router;