const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Configuration MongoDB moderne (sans options dépréciées)
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB Connected');
  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;