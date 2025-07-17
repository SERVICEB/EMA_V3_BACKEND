// backend/middleware/verifyOwner.js
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js'; 

const verifyOwner = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Non autorisé : token manquant' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifie le rôle : ici "owner" pour accès réservé aux propriétaires
    if (user.role !== 'owner') {
      return res.status(403).json({ message: 'Accès réservé aux propriétaires' });
    }

    // Attache l'utilisateur à la requête pour être utilisé dans les contrôleurs
    req.user = user;
    next();
  } catch (err) {
    console.error('Erreur dans verifyOwner middleware:', err);
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

export default verifyOwner;
