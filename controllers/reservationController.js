const Reservation = require('../models/Reservation.js');
const Residence = require('../models/Residence.js');

const createReservation = async (req, res) => {
  try {
    // Le frontend envoie residenceId, on le récupère ici
    const { residenceId, startDate, endDate, totalPrice, guestCount, notes } = req.body;

    // On récupère l'ID utilisateur depuis le middleware d'authentification (req.user)
    const userId = req.user?.id;

    // Debug : vérifier les données reçues
    console.log('📋 Données reçues :', { userId, residenceId, startDate, endDate, totalPrice, guestCount, notes });

    // Validation basique des champs requis
    if (!userId) return res.status(401).json({ message: 'Utilisateur non authentifié' });
    if (!residenceId || !startDate || !endDate || !totalPrice) {
      return res.status(400).json({ 
        message: 'Champs requis manquants.',
        required: ['residenceId', 'startDate', 'endDate', 'totalPrice'],
        received: { residenceId, startDate, endDate, totalPrice }
      });
    }

    // Validation du type totalPrice
    if (typeof totalPrice !== 'number' || totalPrice <= 0) {
      return res.status(400).json({ message: 'Le prix total doit être un nombre positif' });
    }
    if (guestCount && (typeof guestCount !== 'number' || guestCount < 1)) {
      return res.status(400).json({ message: 'Le nombre d\'invités doit être un nombre positif' });
    }

    // Conversion des dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ message: 'Format de date invalide' });
    }
    if (endDateObj <= startDateObj) {
      return res.status(400).json({ message: 'La date de fin doit être après la date de début' });
    }

    // Vérifier que la résidence existe
    const residence = await Residence.findById(residenceId);
    if (!residence) return res.status(404).json({ message: 'Résidence non trouvée' });

    // Vérifier que l'utilisateur ne réserve pas sa propre résidence
    if (residence.owner.toString() === userId) {
      return res.status(400).json({ message: 'Vous ne pouvez pas réserver votre propre résidence' });
    }

    // Vérifier conflit de réservations
    const conflictingReservation = await Reservation.findOne({
      residenceId: residenceId, // Changé de 'residence' à 'residenceId'
      status: { $ne: 'annulée' },
      $or: [
        {
          startDate: { $lt: endDateObj },
          endDate: { $gt: startDateObj }
        }
      ]
    });
    if (conflictingReservation) {
      return res.status(409).json({ 
        message: 'Ces dates ne sont pas disponibles.',
        conflictingDates: {
          start: conflictingReservation.startDate,
          end: conflictingReservation.endDate
        }
      });
    }

    // Préparer les données pour Mongoose (utiliser les noms de champs corrects)
    const reservationData = {
      userId: userId,                // Changé de 'user' à 'userId'
      residenceId: residenceId,      // Changé de 'residence' à 'residenceId'
      startDate: startDateObj,
      endDate: endDateObj,
      totalPrice,
      guestCount: guestCount || 1,
      status: 'en attente',
      ...(notes && { notes: notes.trim() }),
    };

    console.log('📋 Données à insérer:', reservationData);

    // Créer la réservation Mongoose
    const reservation = new Reservation(reservationData);

    // Valider avant sauvegarde
    const validationError = reservation.validateSync();
    if (validationError) {
      console.error('❌ Validation Error:', validationError);
      return res.status(400).json({
        message: 'Erreur de validation des données',
        errors: validationError.errors
      });
    }

    // Sauvegarder dans la base
    await reservation.save();

    // Populer user et residence pour la réponse (adapter selon votre schéma)
    // Si votre schéma utilise userId/residenceId, vous devrez peut-être ajuster le populate
    await reservation.populate('userId', 'name email');
    await reservation.populate('residenceId', 'title location price');

    console.log('✅ Réservation créée:', reservation._id);
    res.status(201).json(reservation);

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);

    // Gestion des erreurs mongoose
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Erreur de validation des données', errors: error.errors });
    }

    // Gestion des erreurs JSON Schema MongoDB (code 121)
    if (error.code === 121) {
      return res.status(400).json({ message: 'Les données ne respectent pas le schéma de validation', details: error.errInfo });
    }

    // Autres erreurs
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  createReservation,
};