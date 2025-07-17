const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db.js');
const residenceRoutes = require('./routes/residenceRoutes.cjs');
const authRoutes = require('./routes/authRoutes.cjs');
const reservationRoutes = require('./routes/reservationRoutes.cjs');
const annoncesRoutes = require('./routes/annoncesRoutes.cjs');

dotenv.config();
connectDB();

const app = express();

// Configuration CORS avec le nouveau lien backend
const allowedOrigins = [
  'https://ema-v3-front.onrender.com', // ✅ Votre frontend
  'https://ema-v3-backend.onrender.com', // ✅ Votre nouveau backend
  'http://localhost:5173',   // Vite dev
  'http://localhost:3000',   // React dev
  /.+\.emaprojet\.pages\.dev$/ // Autoriser tous les sous-domaines de emaprojet.pages.dev
];

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origin est autorisée
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log('✅ Origin autorisée:', origin);
      callback(null, true);
    } else {
      console.log('❌ Origin non autorisée:', origin);
      callback(new Error('Non autorisé par CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true
};

// Appliquer CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Activer les requêtes OPTIONS (preflight)

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📂 Création du dossier uploads/ s'il n'existe pas
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// 📸 Pour servir les images uploadées
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route de test
app.get('/', (_req, res) => res.send('✅ API EMA Résidences & Annonces est opérationnelle'));

// Routes API
app.use('/api/residences', residenceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/annonces', annoncesRoutes);

// Middleware de gestion d'erreurs CORS
app.use((err, req, res, next) => {
  if (err.message === 'Non autorisé par CORS') {
    res.status(403).json({ 
      error: 'CORS Error', 
      message: 'Origin non autorisée',
      origin: req.headers.origin 
    });
  } else {
    next(err);
  }
});

// Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur en ligne : http://localhost:${PORT}`);
  console.log(`🌐 Backend URL: https://ema-v3-backend.onrender.com`);
  console.log('✅ Origins autorisées:', allowedOrigins);
});