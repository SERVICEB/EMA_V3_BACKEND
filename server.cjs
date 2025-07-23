const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// 📌 Connexion à la base de données
const connectDB = require('./config/db.js');

// 📌 Importation des routes (en CommonJS)
const residenceRoutes = require('./routes/residenceRoutes.cjs');
const authRoutes = require('./routes/authRoutes.cjs');
const reservationRoutes = require('./routes/reservationRoutes.cjs');
const annoncesRoutes = require('./routes/annoncesRoutes.cjs');

// 📌 Configuration des variables d’environnement
dotenv.config();
connectDB();

// 📌 Création de l'application Express
const app = express();

// 🌍 Configuration CORS
const allowedOrigins = [
  'https://ema-v3-front.onrender.com',
  'https://ema-v3-backend.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  /.+\.ema-v3-front\.onrender\.com$/
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

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

// 📌 Appliquer les middlewares CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 📌 Middlewares pour parser le body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📁 Créer le dossier 'uploads' s’il n’existe pas
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// 📸 Rendre les fichiers accessibles publiquement
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔍 Middleware de logging (debug)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('➡️ Body keys:', Object.keys(req.body));
    console.log('📎 Files:', req.files ? req.files.length : 0);
  }
  next();
});

// ✅ Route de test API
app.get('/', (_req, res) => res.json({
  message: '✅ API EMA Résidences & Annonces est opérationnelle',
  timestamp: new Date().toISOString(),
  endpoints: [
    'GET /api/residences',
    'POST /api/residences',
    'GET /api/residences/:id',
    'PUT /api/residences/:id',
    'DELETE /api/residences/:id'
  ]
}));

app.get('/api/test', (_req, res) => {
  res.json({
    message: '✅ Route de test API opérationnelle',
    timestamp: new Date().toISOString()
  });
});

// 📌 Routes principales
app.use('/api/residences', residenceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/annonces', annoncesRoutes);

// ❌ Middleware route non trouvée
app.use('*', (req, res) => {
  console.log('❌ Route non trouvée:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Route non trouvée',
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      'GET /',
      'GET /api/test',
      'GET /api/residences',
      'POST /api/residences',
      'GET /api/residences/:id'
    ]
  });
});

// ⚠️ Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('🔥 Erreur serveur:', err.message);

  if (err.message === 'Non autorisé par CORS') {
    res.status(403).json({
      error: 'CORS Error',
      message: 'Origin non autorisée',
      origin: req.headers.origin
    });
  } else {
    res.status(500).json({
      error: 'Erreur serveur interne',
      message: err.message
    });
  }
});

// 🚀 Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur en ligne : http://localhost:${PORT}`);
  console.log(`🌐 Backend URL: https://ema-v3-backend.onrender.com`);
  console.log('✅ Origins autorisées:', allowedOrigins);
  console.log('📍 Routes disponibles:');
  console.log('  - GET /api/residences');
  console.log('  - POST /api/residences');
  console.log('  - GET /api/residences/:id');
  console.log('  - PUT /api/residences/:id');
  console.log('  - DELETE /api/residences/:id');
});
