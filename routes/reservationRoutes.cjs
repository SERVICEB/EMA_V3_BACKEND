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

// ✅ Modifier le statut d'une réservation (VERSION DEBUG)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ownerId = req.user.id; // Maintenant c'est une string (grâce au middleware corrigé)

    console.log('🔍 DEBUG Status Update:');
    console.log('- Reservation ID:', id);
    console.log('- New Status:', status);
    console.log('- Owner ID (string):', ownerId, typeof ownerId);

    const validStatuses = ['en attente', 'confirmée', 'annulée'];
    if (!validStatuses.includes(status)) {
      console.log('❌ Statut invalide:', status);
      return res.status(400).json({ message: 'Statut invalide' });
    }

    // ✅ Chercher la réservation avec populate
    const reservation = await Reservation.findById(id).populate('residenceId');
    
    if (!reservation) {
      console.log('❌ Réservation non trouvée:', id);
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    console.log('📋 Réservation trouvée:');
    console.log('- Reservation userId:', reservation.userId?.toString());
    console.log('- Residence:', reservation.residenceId?.title);
    console.log('- Residence owner:', reservation.residenceId?.owner?.toString());

    // ✅ Vérification d'autorisation
    if (!reservation.residenceId) {
      console.log('❌ Résidence non populée');
      return res.status(500).json({ message: 'Erreur: résidence non trouvée' });
    }

    // ✅ Comparaison string vs string
    const residenceOwnerId = reservation.residenceId.owner.toString();
    const userOwnerId = ownerId; // Déjà une string maintenant

    console.log('🔐 Vérification autorisation:');
    console.log('- Residence Owner ID (string):', residenceOwnerId, typeof residenceOwnerId);
    console.log('- Current User ID (string):', userOwnerId, typeof userOwnerId);
    console.log('- Match:', residenceOwnerId === userOwnerId);

    if (residenceOwnerId !== userOwnerId) {
      console.log('❌ Non autorisé - IDs ne correspondent pas');
      return res.status(403).json({ 
        message: 'Non autorisé - Vous n\'êtes pas le propriétaire de cette résidence',
        debug: {
          residenceOwner: residenceOwnerId,
          currentUser: userOwnerId,
          reservationId: id
        }
      });
    }

    // ✅ Mise à jour du statut
    console.log('✅ Autorisation OK - Mise à jour du statut');
    reservation.status = status;
    await reservation.save();

    // ✅ Re-populer pour la réponse
    await reservation.populate('userId', 'name email');
    await reservation.populate('residenceId', 'title location');

    console.log('✅ Statut mis à jour avec succès');
    res.json(reservation);

  } catch (error) {
    console.error('💥 Erreur mise à jour statut :', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ Récupérer une réservation par ID (CORRIGÉ)
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // ✅ Populer avec les nouveaux noms de champs
    const reservation = await Reservation.findById(id)
      .populate('userId', 'name email phone')
      .populate('residenceId', 'title location prixParNuit price media owner');

    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée' });

    // ✅ Vérification avec les nouveaux noms (CORRECTION ICI)
    const isOwner = reservation.residenceId.owner.toString() === userId;
    const isClient = reservation.userId.toString() === userId; // ✅ Retiré ._id car userId est déjà l'ObjectId

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

// ✅ Route de debug temporaire (à retirer en production)
router.get('/debug/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('🔍 DEBUG INFO:');
    console.log('- Reservation ID:', id);
    console.log('- Current User ID:', userId);

    // Test 1: Réservation existe-t-elle ?
    const reservation = await Reservation.findById(id);
    console.log('- Reservation found:', !!reservation);
    
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    console.log('- Reservation userId:', reservation.userId);
    console.log('- Reservation residenceId:', reservation.residenceId);

    // Test 2: Résidence existe-t-elle ?
    const residence = await Residence.findById(reservation.residenceId);
    console.log('- Residence found:', !!residence);
    console.log('- Residence owner:', residence?.owner);

    // Test 3: Populate fonctionne-t-il ?
    const reservationPopulated = await Reservation.findById(id)
      .populate('residenceId')
      .populate('userId');

    console.log('- Populated residence:', !!reservationPopulated.residenceId);
    console.log('- Populated user:', !!reservationPopulated.userId);

    res.json({
      reservation: {
        id: reservation._id,
        userId: reservation.userId,
        residenceId: reservation.residenceId,
        status: reservation.status
      },
      residence: residence ? {
        id: residence._id,
        title: residence.title,
        owner: residence.owner
      } : null,
      currentUser: userId,
      isOwner: residence?.owner?.toString() === userId,
      isClient: reservation.userId?.toString() === userId
    });

  } catch (error) {
    console.error('💥 Erreur debug:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;