const express = require('express');
const Residence = require('../models/Residence.js');
const { auth, authorizeRoles } = require('../middleware/auth.js');
const upload = require('../utils/upload.js');

const router = express.Router();

/**
 * ✅ Route GET - Liste publique des résidences avec filtres facultatifs
 */
router.get('/', async (req, res) => {
  try {
    const { city, title, maxPrice } = req.query;
    const filter = {};

    if (city) filter.location = { $regex: city, $options: 'i' };
    if (title) filter.title = { $regex: title, $options: 'i' };
    if (maxPrice) filter.price = { $lte: Number(maxPrice) };

    const residences = await Residence.find(filter).sort({ createdAt: -1 });
    res.json(residences);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la récupération des résidences.' });
  }
});

/**
 * ✅ Route GET - Détails d’une résidence par ID
 */
router.get('/:id', async (req, res) => {
  try {
    const residence = await Residence.findById(req.params.id);
    if (!residence) return res.status(404).json({ message: 'Résidence non trouvée.' });
    res.json(residence);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

/**
 * ✅ Route POST - Création d'une résidence (authentifié + rôle autorisé)
 */
router.post(
  '/',
  auth,
  authorizeRoles('owner', 'admin', 'client'),
  upload.array('media', 10),
  async (req, res) => {
    try {
      const {
        title,
        description,
        location,
        address,
        reference,
        type,
        price,
        owner,
        amenities,
        existingImages
      } = req.body;

      // Validation de base
      if (!title?.trim()) return res.status(400).json({ message: 'Le titre est requis.' });
      if (!location?.trim()) return res.status(400).json({ message: 'La localisation est requise.' });
      if (!type) return res.status(400).json({ message: 'Le type est requis.' });

      const priceNum = Number(price);
      if (isNaN(priceNum) || priceNum < 1000 || priceNum > 1000000) {
        return res.status(400).json({ message: 'Le prix doit être entre 1000 et 1000000 FCFA.' });
      }

      const validTypes = ['Hôtel', 'Appartement', 'Villa', 'Studio', 'Suite', 'Chambre'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: `Type invalide. Types acceptés : ${validTypes.join(', ')}` });
      }

      if (reference?.trim()) {
        const refExist = await Residence.findOne({ reference: reference.trim() });
        if (refExist) {
          return res.status(400).json({ message: 'Référence déjà utilisée.' });
        }
      }

      // Traitement des fichiers uploadés
      const media = (req.files || []).map(file => ({
        url: `/uploads/${file.filename}`,
        type: file.mimetype.startsWith('video/') ? 'video' : 'image'
      }));

      // Traitement des médias existants (en cas d’édition)
      let existingMedia = [];
      try {
        existingMedia = JSON.parse(existingImages || '[]');
      } catch (_) {}

      // Traitement des équipements
      let amenitiesArray = [];
      try {
        amenitiesArray = JSON.parse(amenities || '[]').filter(a => typeof a === 'string');
      } catch (_) {}

      const residenceData = {
        title: title.trim(),
        description: description?.trim(),
        location: location.trim(),
        address: address?.trim(),
        reference: reference?.trim(),
        type,
        price: priceNum,
        owner: owner || req.user.id,
        media: [...existingMedia, ...media],
        amenities: amenitiesArray
      };

      const residence = new Residence(residenceData);
      await residence.save();

      res.status(201).json({ message: 'Résidence créée avec succès', residence });
    } catch (err) {
      console.error(err);
      if (err.name === 'ValidationError') {
        const details = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ message: 'Erreur de validation', details });
      }
      res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
  }
);

/**
 * ✅ Route PUT - Modifier une résidence (authentifié)
 */
router.put('/:id', auth, upload.array('media', 10), async (req, res) => {
  try {
    const residence = await Residence.findById(req.params.id);
    if (!residence) return res.status(404).json({ message: 'Résidence non trouvée.' });

    // Autorisation : propriétaire ou admin
    if (residence.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé.' });
    }

    const {
      title,
      description,
      location,
      address,
      reference,
      type,
      price,
      amenities,
      existingImages,
      mediaToDelete
    } = req.body;

    const updateData = {};

    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (location) updateData.location = location.trim();
    if (address) updateData.address = address.trim();
    if (reference) updateData.reference = reference.trim();
    if (type) updateData.type = type;
    if (price) updateData.price = Number(price);

    // Traitement des médias
    let currentMedia = residence.media || [];

    // Supprimer médias marqués pour suppression
    if (mediaToDelete) {
      try {
        const toDelete = JSON.parse(mediaToDelete);
        currentMedia = currentMedia.filter(m => !toDelete.includes(m._id.toString()));
      } catch (_) {}
    }

    // Ajouter médias existants (frontend)
    try {
      const existingParsed = JSON.parse(existingImages || '[]');
      currentMedia.push(...existingParsed);
    } catch (_) {}

    // Ajouter les nouveaux médias uploadés
    if (req.files) {
      const newMedia = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        type: file.mimetype.startsWith('video/') ? 'video' : 'image'
      }));
      currentMedia.push(...newMedia);
    }

    updateData.media = currentMedia;

    // Équipements
    try {
      updateData.amenities = JSON.parse(amenities || '[]');
    } catch (_) {}

    const updated = await Residence.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({ message: 'Résidence modifiée avec succès', residence: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour.' });
  }
});

/**
 * ✅ Route DELETE - Supprimer une résidence
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const residence = await Residence.findById(req.params.id);
    if (!residence) return res.status(404).json({ message: 'Résidence non trouvée.' });

    // Autorisation : propriétaire ou admin
    if (residence.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    await Residence.findByIdAndDelete(req.params.id);
    res.json({ message: 'Résidence supprimée avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
});

module.exports = router;
