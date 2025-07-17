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

// Middlewares
const allowedOrigins = [
  'https://1132ddc5.emaprojet.pages.dev',
  'https://222294b2.emaprojet.pages.dev',
  'http://localhost:5173',
  /.+\.emaprojet\.pages\.dev$/ // Autoriser tous les sous-domaines de emaprojet.pages.dev
];

// Configuration CORS temporairement permissive
const corsOptions = {
  origin: '*', // Autoriser toutes les origines
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Activer les requêtes OPTIONS
app.use(express.json());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Pour accéder aux images


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

// Lancement du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Serveur en ligne : http://localhost:${PORT}`)
);
