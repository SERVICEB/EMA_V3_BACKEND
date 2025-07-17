const mongoose = require('mongoose');

/**
 * 📁 Sous-schéma pour les fichiers médias (image ou vidéo)
 */
const mediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  }
});

/**
 * 🏠 Schéma principal pour les résidences
 */
const residenceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    type: {
      type: String,
      required: true,
      enum: ['Hôtel', 'Appartement', 'Villa', 'Studio', 'Suite', 'Chambre']
    },
    price: {
      type: Number,
      required: true,
      min: 1000,
      max: 1000000
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      maxlength: 1000
    },
    reference: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // permet plusieurs documents sans ce champ (undefined)
      default: undefined // empêche explicitement null
    },
    amenities: [{
      type: String
    }],
    media: [mediaSchema],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// ✅ Création et export du modèle
const Residence = mongoose.model('Residence', residenceSchema);
module.exports = Residence;