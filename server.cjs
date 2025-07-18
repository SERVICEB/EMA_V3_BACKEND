const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db.js');
// ✅ Vérifiez que ces fichiers existent avec les bonnes extensions
const residenceRoutes = require('./routes/residenceRoutes.cjs'); // ou .cjs selon votre fichier
const authRoutes = require('./routes/authRoutes.cjs');
const reservationRoutes = require('./routes/reservationRoutes.cjs');
const annoncesRoutes = require('./routes/annoncesRoutes.cjs');

dotenv.config();
connectDB();

const app = express();

// Configuration CORS avec le nouveau lien backend
const allowedOrigins = [
  'https://ema-v3-front.onrender.com', // ✅  frontend
  'https://ema-v3-backend.onrender.com', 
  'http://localhost:5173',   // Vite dev
  'http://localhost:3000',   // React dev
  /.+\.ema-v3-front\.onrender\.com$/ // 
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
app.use(express.json({ limit: '10mb' })); // Augmenter la limite pour les uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📂 Création du dossier uploads/ s'il n'existe pas
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// 📸 Pour servir les images uploadées
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Middleware de logging pour debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Body keys:', Object.keys(req.body));
    console.log('Files:', req.files ? req.files.length : 0);
  }
  next();
});

// Route de test
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

// ✅ Route de test pour les résidences
app.get('/api/test', (_req, res) => {
  res.json({ 
    message: 'API test route works!',
    timestamp: new Date().toISOString()
  });
});

// Routes API
app.use('/api/residences', residenceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/annonces', annoncesRoutes);

// ✅ Middleware pour les routes non trouvées
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

// Middleware de gestion d'erreurs CORS
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  
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

// Lancement du serveur
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