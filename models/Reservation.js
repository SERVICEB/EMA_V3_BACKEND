import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  // ✅ Utiliser userId au lieu de user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis']
  },
  // ✅ Utiliser residenceId au lieu de residence
  residenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Residence',
    required: [true, 'La résidence est requise']
  },
  startDate: {
    type: Date,
    required: [true, 'La date de début est requise']
  },
  endDate: {
    type: Date,
    required: [true, 'La date de fin est requise']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Le prix total est requis'],
    min: [0, 'Le prix total doit être supérieur ou égal à 0']
  },
  guestCount: {
    type: Number,
    default: 1,
    min: [1, 'Le nombre de personnes doit être au moins 1']
  },
  status: {
    type: String,
    enum: ['en attente', 'confirmée', 'annulée'],
    default: 'en attente'
  },
  notes: {
    type: String,
    maxlength: [500, 'Les notes ne peuvent pas dépasser 500 caractères']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  checkInTime: {
    type: String,
    default: '15:00'
  },
  checkOutTime: {
    type: String,
    default: '11:00'
  }
}, {
  timestamps: true,
  strict: true,
  strictQuery: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Virtuels pour compatibilité avec populate
reservationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

reservationSchema.virtual('residence', {
  ref: 'Residence',
  localField: 'residenceId',
  foreignField: '_id',
  justOne: true
});

// 🧠 Indexation (mise à jour avec les nouveaux noms de champs)
reservationSchema.index({ userId: 1, createdAt: -1 });
reservationSchema.index({ residenceId: 1, startDate: 1, endDate: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ startDate: 1, endDate: 1 });

// 📐 Virtuel : durée en jours
reservationSchema.virtual('duration').get(function () {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// 🔍 Méthodes utiles
reservationSchema.methods.overlaps = function (startDate, endDate) {
  return this.startDate < endDate && this.endDate > startDate;
};

reservationSchema.methods.isActive = function () {
  const now = new Date();
  return this.status === 'confirmée' && this.startDate <= now && this.endDate > now;
};

reservationSchema.methods.isFuture = function () {
  return this.startDate > new Date();
};

reservationSchema.methods.isPast = function () {
  return this.endDate < new Date();
};

// ⚠️ Validation cohérence des dates
reservationSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('La date de fin doit être après la date de début'));
  }
  next();
});

// 🛑 Blocage de certains champs après confirmation
reservationSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.status === 'confirmée') {
    const allowed = ['notes', 'paymentStatus', 'checkInTime', 'checkOutTime'];
    const keys = Object.keys(update);
    if (keys.some(key => !allowed.includes(key))) {
      return next(new Error('Impossible de modifier les détails d\'une réservation confirmée'));
    }
  }
  next();
});

const Reservation = mongoose.model('Reservation', reservationSchema);
export default Reservation;