const mongoose = require('mongoose');

const residenceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  type: {
    type: String,
    required: [true, 'Le type est requis'],
    enum: {
      values: ['Hôtel', 'Appartement', 'Villa', 'Studio', 'Suite', 'Chambre'],
      message: 'Type de résidence invalide'
    }
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [1000, 'Le prix minimum est de 1000 FCFA'],
    max: [1000000, 'Le prix maximum est de 1000000 FCFA']
  },
  location: {
    type: String,
    required: [true, 'La localisation est requise'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  reference: {
    type: String,
    trim: true,
    // ✅ Définir l'unicité ici, pas avec index: true
    unique: true,
    sparse: true // Permet des valeurs null/undefined multiples
  },
  media: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    }
  }],
  amenities: [{
    type: String,
    trim: true
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le propriétaire est requis']
  },
  status: {
    type: String,
    enum: ['disponible', 'occupé', 'maintenance'],
    default: 'disponible'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// ✅ Index composé pour la recherche
residenceSchema.index({ location: 1, type: 1, price: 1 });
residenceSchema.index({ owner: 1, createdAt: -1 });

// ✅ NE PAS redéfinir l'index sur reference car unique: true le fait déjà
// residenceSchema.index({ reference: 1 }, { unique: true, sparse: true }); // ❌ À supprimer

module.exports = mongoose.model('Residence', residenceSchema);