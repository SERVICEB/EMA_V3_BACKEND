const Residence = require('../models/Residence.cjs');
const fs = require('fs');
const path = require('path');

/**
 * 🔄 Récupérer toutes les résidences
 */
const getAllResidences = async (req, res) => {
  try {
    const residences = await Residence.find().populate('owner', 'fullName email');
    res.json(residences);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du chargement des résidences' });
  }
};

/**
 * 🔍 Obtenir une résidence par son ID
 */
const getResidenceById = async (req, res) => {
  try {
    const residence = await Residence.findById(req.params.id).populate('owner', 'fullName email');
    if (!residence) {
      return res.status(404).json({ message: 'Résidence non trouvée' });
    }
    res.json(residence);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de la résidence' });
  }
};

/**
 * 🏡 Obtenir les résidences par propriétaire
 */
const getResidencesByOwner = async (req, res) => {
  try {
    const residences = await Residence.find({ owner: req.params.ownerId });
    res.json(residences);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du chargement des résidences du propriétaire' });
  }
};

/**
 * ➕ Créer une nouvelle résidence
 */
const createResidence = async (req, res) => {
  try {
    const {
      title,
      description,
      address,
      price,
      location,
      availability,
      type
    } = req.body;

    const owner = req.user.id;

    const images = req.files ? req.files.map(file => file.path) : [];

    const newResidence = new Residence({
      title,
      description,
      address,
      price,
      location,
      availability,
      type,
      owner,
      images
    });

    const savedResidence = await newResidence.save();
    res.status(201).json(savedResidence);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la résidence' });
  }
};

/**
 * ✏️ Modifier une résidence
 */
const updateResidence = async (req, res) => {
  try {
    const residence = await Residence.findById(req.params.id);
    if (!residence) {
      return res.status(404).json({ message: 'Résidence non trouvée' });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (residence.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const {
      title,
      description,
      address,
      price,
      location,
      availability,
      type
    } = req.body;

    const updatedData = {
      title,
      description,
      address,
      price,
      location,
      availability,
      type
    };

    // Ajouter les nouvelles images si elles existent
    if (req.files && req.files.length > 0) {
      updatedData.images = req.files.map(file => file.path);
    }

    const updatedResidence = await Residence.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.json(updatedResidence);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};

/**
 * ❌ Supprimer une résidence
 */
const deleteResidence = async (req, res) => {
  try {
    const residence = await Residence.findById(req.params.id);
    if (!residence) {
      return res.status(404).json({ message: 'Résidence non trouvée' });
    }

    if (residence.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Supprimer les fichiers images associés
    if (residence.images && residence.images.length > 0) {
      residence.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      });
    }

    await residence.deleteOne();
    res.json({ message: 'Résidence supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};

module.exports = {
  getAllResidences,
  getResidenceById,
  getResidencesByOwner,
  createResidence,
  updateResidence,
  deleteResidence
};
