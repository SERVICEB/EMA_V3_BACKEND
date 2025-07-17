const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true,
    minlength: [2, 'Le prénom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },
  lastName: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Format d\'email invalide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  role: {
    type: String,
    enum: {
      values: ['client', 'admin', 'proprietaire', 'owner'],
      message: 'Le rôle doit être client, admin, proprietaire ou owner'
    },
    default: 'client'
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Index pour optimiser les requêtes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Virtuel pour le nom complet
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Middleware pour debug
userSchema.pre('save', function(next) {
  console.log('🔍 Pre-save User:', {
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    role: this.role,
    isNew: this.isNew
  });
  next();
});

userSchema.post('save', function(doc, next) {
  console.log('✅ Post-save User:', doc._id);
  next();
});

// Gestion des erreurs de validation
userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    console.error('❌ Erreur de duplication:', error.keyValue);
    next(new Error('Cet email est déjà utilisé'));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);