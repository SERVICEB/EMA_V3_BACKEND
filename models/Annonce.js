import mongoose from 'mongoose';

const annonceSchema = new mongoose.Schema({
  typeAnnonce: { type: String, required: true }, // location / vente
  typeBien: { type: String, required: true },
  prix: { type: Number, required: true },
  superficie: Number,
  description: String,
  chambres: Number,
  salons: Number,
  cuisines: Number,
  sallesBain: Number,
  toilettes: Number,
  balcon: Boolean,
  garage: Boolean,
  piscine: Boolean,
  ville: String,
  quartier: String,
  nomContact: String,
  telephone: String,
  email: String,
  images: [String], // URLs des images uploadées
}, { timestamps: true });

const Annonce = mongoose.model('Annonce', annonceSchema);

export default Annonce;
