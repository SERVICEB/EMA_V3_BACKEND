import Residence from '../models/Residence.js';

/**
 * 🔧 Utilitaire pour deviner le type média à partir du mimetype ou de l'URL
 */
const getFileType = (value) => {
  if (!value) return 'image';
  if (typeof value === 'string') {
    const ext = value.split('.').pop().toLowerCase();
    return ['mp4', 'mov', 'webm'].includes(ext) ? 'video' : 'image';
  }
  if (value.mimetype) {
    return value.mimetype.startsWith('video/') ? 'video' : 'image';
  }
  return 'image';
};

// 🔍 GET all
export const getResidences = async (req, res) => {
  try {
    const residences = await Residence.find().sort({ createdAt: -1 });
    res.status(200).json(residences);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔍 GET by ID
export const getResidenceById = async (req, res) => {
  try {
    const residence = await Residence.findById(req.params.id);
    if (!residence) return res.status(404).json({ message: 'Résidence introuvable' });
    res.status(200).json(residence);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➕ CREATE
export const createResidence = async (req, res) => {
  try {
    const {
      title,
      type,
      price,
      location,
      address,
      description,
      reference,
      amenities,
    } = req.body;

    if (!title || !price || !location) {
      return res.status(400).json({ message: 'Champs requis (titre, prix, localisation).' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Veuillez ajouter au moins une image ou vidéo.' });
    }

    const media = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      type: getFileType(file),
    }));

    const residence = new Residence({
      title,
      type,
      price,
      location,
      address,
      description,
      reference: reference || `RES-${Date.now()}`,
      amenities: amenities ? JSON.parse(amenities) : [],
      media,
      owner: req.user.id,
    });

    await residence.save();
    res.status(201).json(residence);
  } catch (err) {
    console.error('Erreur création résidence:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la création.' });
  }
};

// ✏️ UPDATE
export const updateResidence = async (req, res) => {
  try {
    const residence = await Residence.findById(req.params.id);
    if (!residence) return res.status(404).json({ message: 'Résidence introuvable' });

    if (residence.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const {
      title,
      type,
      price,
      location,
      address,
      description,
      reference,
      amenities,
      existingImages,
    } = req.body;

    if (title !== undefined) residence.title = title;
    if (type !== undefined) residence.type = type;
    if (price !== undefined) residence.price = price;
    if (location !== undefined) residence.location = location;
    if (address !== undefined) residence.address = address;
    if (description !== undefined) residence.description = description;
    if (reference !== undefined) residence.reference = reference;
    if (amenities !== undefined) {
      residence.amenities = JSON.parse(amenities);
    }

    let existingMedia = [];
    if (existingImages) {
      const parsed = JSON.parse(existingImages);
      existingMedia = Array.isArray(parsed)
        ? parsed.map((url) => ({
            url,
            type: getFileType(url),
          }))
        : [];
    }

    if (req.files && req.files.length > 0) {
      const newMedia = req.files.map((file) => ({
        url: `/uploads/${file.filename}`,
        type: getFileType(file),
      }));
      residence.media = [...existingMedia, ...newMedia];
    } else {
      residence.media = existingMedia;
    }

    await residence.save();
    res.status(200).json(residence);
  } catch (err) {
    console.error('Erreur update résidence:', err);
    res.status(500).json({ message: err.message });
  }
};

// ❌ DELETE
export const deleteResidence = async (req, res) => {
  try {
    const residence = await Residence.findById(req.params.id);
    if (!residence) return res.status(404).json({ message: 'Résidence introuvable' });

    if (residence.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await residence.deleteOne();
    res.status(200).json({ message: 'Résidence supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
