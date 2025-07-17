import nodemailer from 'nodemailer';

// Configuration du transporteur email (vous devrez configurer avec vos propres paramètres)
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou votre service email préféré
  auth: {
    user: process.env.EMAIL_USER, // votre email
    pass: process.env.EMAIL_PASS  // votre mot de passe d'application
  }
});

/**
 * Crée et envoie une notification de réservation
 * @param {Object} reservationData - Les données de la réservation
 * @param {string} userEmail - L'email de l'utilisateur
 * @param {string} notificationType - Le type de notification ('confirmation', 'modification', 'annulation')
 */
export const createReservationNotification = async (reservationData, userEmail, notificationType = 'confirmation') => {
  try {
    let subject, htmlContent;

    switch (notificationType) {
      case 'confirmation':
        subject = '✅ Confirmation de votre réservation';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c5aa0;">Confirmation de réservation</h2>
            <p>Bonjour,</p>
            <p>Votre réservation a été confirmée avec succès !</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Détails de votre réservation :</h3>
              <p><strong>ID de réservation :</strong> ${reservationData._id}</p>
              <p><strong>Résidence :</strong> ${reservationData.residenceId?.title || 'Non spécifiée'}</p>
              <p><strong>Date d'arrivée :</strong> ${new Date(reservationData.startDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Date de départ :</strong> ${new Date(reservationData.endDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Prix total :</strong> ${reservationData.totalPrice}€</p>
              ${reservationData.specialRequests ? `<p><strong>Demandes spéciales :</strong> ${reservationData.specialRequests}</p>` : ''}
            </div>
            
            <p>Nous avons hâte de vous accueillir !</p>
            <p>Cordialement,<br>L'équipe du restaurant</p>
          </div>
        `;
        break;

      case 'modification':
        subject = '📝 Modification de votre réservation';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f39c12;">Modification de réservation</h2>
            <p>Bonjour,</p>
            <p>Votre réservation a été modifiée avec succès !</p>
            
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12;">
              <h3>Nouveaux détails de votre réservation :</h3>
              <p><strong>ID de réservation :</strong> ${reservationData._id}</p>
              <p><strong>Résidence :</strong> ${reservationData.residenceId?.title || 'Non spécifiée'}</p>
              <p><strong>Date d'arrivée :</strong> ${new Date(reservationData.startDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Date de départ :</strong> ${new Date(reservationData.endDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Prix total :</strong> ${reservationData.totalPrice}€</p>
            </div>
            
            <p>Merci de noter ces nouveaux détails.</p>
            <p>Cordialement,<br>L'équipe du restaurant</p>
          </div>
        `;
        break;

      case 'annulation':
        subject = '❌ Annulation de votre réservation';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Annulation de réservation</h2>
            <p>Bonjour,</p>
            <p>Votre réservation a été annulée.</p>
            
            <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <h3>Réservation annulée :</h3>
              <p><strong>ID de réservation :</strong> ${reservationData._id}</p>
              <p><strong>Date prévue :</strong> ${new Date(reservationData.startDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Heure prévue :</strong> ${reservationData.endDate ? new Date(reservationData.endDate).toLocaleDateString('fr-FR') : 'Non spécifiée'}</p>
            </div>
            
            <p>Nous espérons vous revoir bientôt !</p>
            <p>Cordialement,<br>L'équipe du restaurant</p>
          </div>
        `;
        break;

      case 'nouvelle_reservation':
        subject = '🔔 Nouvelle réservation pour votre résidence';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Nouvelle Réservation</h2>
            <p>Bonjour,</p>
            <p>Vous avez reçu une nouvelle réservation pour votre résidence !</p>
            
            <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3>Détails de la réservation :</h3>
              <p><strong>ID de réservation :</strong> ${reservationData._id}</p>
              <p><strong>Résidence :</strong> ${reservationData.residenceId?.title || 'Non spécifiée'}</p>
              <p><strong>Date d'arrivée :</strong> ${new Date(reservationData.startDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Date de départ :</strong> ${new Date(reservationData.endDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Prix total :</strong> ${reservationData.totalPrice}€</p>
              <p><strong>Statut :</strong> ${reservationData.status}</p>
              
              ${reservationData.clientInfo ? `
                <h4>Informations du client :</h4>
                <p><strong>Nom :</strong> ${reservationData.clientInfo.name}</p>
                <p><strong>Email :</strong> ${reservationData.clientInfo.email}</p>
                <p><strong>Téléphone :</strong> ${reservationData.clientInfo.phone}</p>
              ` : ''}
            </div>
            
            <p>Connectez-vous à votre espace propriétaire pour gérer cette réservation.</p>
            <p>Cordialement,<br>L'équipe EMA</p>
          </div>
        `;
        break;

      default:
        throw new Error('Type de notification non reconnu');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: subject,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Notification envoyée avec succès:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envoie une notification SMS (optionnel - nécessite un service SMS comme Twilio)
 * @param {string} phoneNumber - Numéro de téléphone
 * @param {string} message - Message à envoyer
 */
export const sendSMSNotification = async (phoneNumber, message) => {
  try {
    // Ici vous pouvez intégrer un service SMS comme Twilio
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    
    console.log(`SMS envoyé à ${phoneNumber}: ${message}`);
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'envoi du SMS:', error);
    return { success: false, error: error.message };
  }
};

export default createReservationNotification;