const Annonce = require('../models/Annonce.js');

// ➕ Créer une annonce avec image
const createAnnonce = async (req, res) => {
  try {
    // Récupération des chemins d'images uploadées
    const imagePaths = req.files.map(file => file.path);

    // Construction de l'objet à partir de req.body (converti automatiquement par Multer)
    const data = {
      ...req.body,
      prix: Number(req.body.prix),
      superficie: Number(req.body.superficie),
      chambres: Number(req.body.chambres),
      salons: Number(req.body.salons),
      cuisines: Number(req.body.cuisines),
      sallesBain: Number(req.body.sallesBain),
      toilettes: Number(req.body.toilettes),
      balcon: req.body.balcon === 'true',
      garage: req.body.garage === 'true',
      piscine: req.body.piscine === 'true',
      images: imagePaths,
    };

    const annonce = new Annonce(data);
    await annonce.save();
    res.status(201).json(annonce);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

// 📋 Récupérer toutes les annonces
const getAllAnnonces = async (_req, res) => {
  try {
    const annonces = await Annonce.find().sort({ createdAt: -1 });
    res.status(200).json(annonces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible de récupérer les annonces' });
  }
};

// 🔍 Récupérer une annonce par ID
const getAnnonceById = async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }
    res.status(200).json(annonce);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération de l’annonce' });
  }
};

module.exports = {
  createAnnonce,
  getAllAnnonces,
  getAnnonceById,
};
