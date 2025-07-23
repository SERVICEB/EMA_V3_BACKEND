const express = require('express');
const { auth } = require('../middleware/auth.js');
const { createReservation } = require('../controllers/reservationController.js');
const Reservation = require('../models/Reservation.js');
const Residence = require('../models/Residence.js');

const router = express.Router();

// ✅ Créer une réservation (via contrôleur)
router.post('/', auth, createReservation);

// ✅ Récupérer les réservations d'un propriétaire
router.get('/owner', auth, async (req, res) => {
  try {
    const ownerId = req.user.id;
    const residences = await Residence.find({ owner: ownerId });
    const residenceIds = residences.map(r => r._id);

    // ✅ Utiliser residenceId au lieu de residence
    const reservations = await Reservation.find({ residenceId: { $in: residenceIds } })
      .populate('userId', 'name email phone') // ✅ userId au lieu de user
      .populate('residenceId', 'title location prixParNuit price') // ✅ residenceId
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    console.error('Erreur réservations propriétaire :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ✅ Récupérer les réservations d'un client
router.get('/client', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ Utiliser userId au lieu de user
    const reservations = await Reservation.find({ userId: userId })
      .populate('residenceId', 'title location prixParNuit price media') // ✅ residenceId
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    console.error('Erreur réservations client :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ✅ Modifier le statut d'une réservation
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ownerId = req.user.id;

    const validStatuses = ['en attente', 'confirmée', 'annulée'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    // ✅ Populer avec les nouveaux noms de champs
    const reservation = await Reservation.findById(id).populate('residenceId');
    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    // ✅ Accès via residenceId au lieu de residence
    if (reservation.residenceId.owner.toString() !== ownerId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    reservation.status = status;
    await reservation.save();

    // ✅ Re-populer avec les nouveaux noms
    await reservation.populate('userId', 'name email');
    await reservation.populate('residenceId', 'title location');

    res.json(reservation);
  } catch (error) {
    console.error('Erreur mise à jour statut :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ✅ Récupérer une réservation par ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // ✅ Populer avec les nouveaux noms de champs
    const reservation = await Reservation.findById(id)
      .populate('userId', 'name email phone')
      .populate('residenceId', 'title location prixParNuit price media owner');

    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    // ✅ Vérification avec les nouveaux noms
    const isOwner = reservation.residenceId.owner.toString() === userId;
    const isClient = reservation.userId._id.toString() === userId;

    if (!isOwner && !isClient) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Erreur récupération réservation :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ✅ Supprimer une réservation
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // ✅ Populer avec residenceId
    const reservation = await Reservation.findById(id).populate('residenceId');
    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    // ✅ Vérification avec les nouveaux noms
    const isOwner = reservation.residenceId.owner.toString() === userId;
    const isClient = reservation.userId.toString() === userId; // ✅ userId

    if (!isOwner && !isClient) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await Reservation.findByIdAndDelete(id);
    res.json({ message: 'Réservation supprimée' });
  } catch (error) {
    console.error('Erreur suppression réservation :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// ✅ Statistiques des réservations (propriétaire)
router.get('/stats/owner', auth, async (req, res) => {
  try {
    const ownerId = req.user.id;
    const residences = await Residence.find({ owner: ownerId });
    const residenceIds = residences.map(r => r._id);

    // ✅ Utiliser residenceId dans toutes les requêtes
    const [total, confirmed, pending, cancelled, revenue] = await Promise.all([
      Reservation.countDocuments({ residenceId: { $in: residenceIds } }),
      Reservation.countDocuments({ residenceId: { $in: residenceIds }, status: 'confirmée' }),
      Reservation.countDocuments({ residenceId: { $in: residenceIds }, status: 'en attente' }),
      Reservation.countDocuments({ residenceId: { $in: residenceIds }, status: 'annulée' }),
      Reservation.aggregate([
        { $match: { residenceId: { $in: residenceIds }, status: 'confirmée' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ])
    ]);

    res.json({
      totalReservations: total,
      confirmedReservations: confirmed,
      pendingReservations: pending,
      cancelledReservations: cancelled,
      totalRevenue: revenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Erreur stats réservations :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;