const express = require('express');
const { auth } = require('../middleware/auth.js');
const { createReservation } = require('../controllers/reservationController.js');
const Reservation = require('../models/Reservation.js');
const Residence = require('../models/Residence.js');

const router = express.Router();

// ✅ Créer une réservation (via contrôleur)
router.post('/', auth, createReservation);

// ✅ Récupérer les réservations d’un propriétaire
router.get('/owner', auth, async (req, res) => {
  try {
    const ownerId = req.user.id;
    const residences = await Residence.find({ owner: ownerId });
    const residenceIds = residences.map(r => r._id);

    const reservations = await Reservation.find({ residence: { $in: residenceIds } })
      .populate('user', 'name email phone')
      .populate('residence', 'title location prixParNuit price')
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    console.error('Erreur réservations propriétaire :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Récupérer les réservations d’un client
router.get('/client', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const reservations = await Reservation.find({ user: userId })
      .populate('residence', 'title location prixParNuit price media')
      .sort({ createdAt: -1 });

    res.json(reservations);
  } catch (error) {
    console.error('Erreur réservations client :', error);
    res.status(500).json({ message: 'Erreur serveur' });
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

    const reservation = await Reservation.findById(id).populate('residence');
    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    if (reservation.residence.owner.toString() !== ownerId) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    reservation.status = status;
    await reservation.save();

    await reservation.populate('user', 'name email');
    await reservation.populate('residence', 'title location');

    res.json(reservation);
  } catch (error) {
    console.error('Erreur mise à jour statut :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Récupérer une réservation par ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reservation = await Reservation.findById(id)
      .populate('user', 'name email phone')
      .populate('residence', 'title location prixParNuit price media owner');

    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    const isOwner = reservation.residence.owner.toString() === userId;
    const isClient = reservation.user._id.toString() === userId;

    if (!isOwner && !isClient) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Erreur récupération réservation :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Supprimer une réservation
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reservation = await Reservation.findById(id).populate('residence');
    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    const isOwner = reservation.residence.owner.toString() === userId;
    const isClient = reservation.user.toString() === userId;

    if (!isOwner && !isClient) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await Reservation.findByIdAndDelete(id);
    res.json({ message: 'Réservation supprimée' });
  } catch (error) {
    console.error('Erreur suppression réservation :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Statistiques des réservations (propriétaire)
router.get('/stats/owner', auth, async (req, res) => {
  try {
    const ownerId = req.user.id;
    const residences = await Residence.find({ owner: ownerId });
    const residenceIds = residences.map(r => r._id);

    const [total, confirmed, pending, cancelled, revenue] = await Promise.all([
      Reservation.countDocuments({ residence: { $in: residenceIds } }),
      Reservation.countDocuments({ residence: { $in: residenceIds }, status: 'confirmée' }),
      Reservation.countDocuments({ residence: { $in: residenceIds }, status: 'en attente' }),
      Reservation.countDocuments({ residence: { $in: residenceIds }, status: 'annulée' }),
      Reservation.aggregate([
        { $match: { residence: { $in: residenceIds }, status: 'confirmée' } },
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
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
