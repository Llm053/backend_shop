const nodemailer = require('nodemailer');

// Configuration du transporteur email
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER || 'smartml0223@gmail.com';
  const emailPass = process.env.EMAIL_PASS || 'uutchkgilagtxncx';
  
  console.log('📧 Configuration email:', { 
    user: emailUser, 
    hasPassword: !!emailPass
  });
  
  try {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
  } catch (error) {
    console.error('❌ Erreur configuration email:', error);
    return null;
  }
};

// Envoyer un email de nouvelle commande aux admins/employés
const sendNewOrderNotification = async (orderData, adminEmails) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('⚠️ Transporteur email non configuré - email ignoré');
      return { success: false, error: 'Configuration email manquante' };
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@stockshop.ml',
      to: adminEmails.join(','),
      subject: `🛒 Nouvelle Commande #${orderData.numero_commande}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 30px;">
              📦 Nouvelle Commande Reçue
            </h2>
            
            <div style="background: #3b82f6; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h3 style="margin: 0;">Commande #${orderData.numero_commande}</h3>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h4 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Informations Client</h4>
              <p><strong>Nom:</strong> ${orderData.customer_name}</p>
              <p><strong>Téléphone:</strong> ${orderData.customer_phone}</p>
              <p><strong>Email:</strong> ${orderData.customer_email || 'Non fourni'}</p>
              <p><strong>Adresse:</strong> ${orderData.customer_address}</p>
              <p><strong>Ville:</strong> ${orderData.customer_city}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h4 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Détails de la Commande</h4>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                ${orderData.items.map(item => `
                  <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                    <span>${item.product_name} x${item.quantity}</span>
                    <span style="font-weight: bold;">${parseInt(item.total_price).toLocaleString()} FCFA</span>
                  </div>
                `).join('')}
                <div style="display: flex; justify-content: space-between; padding: 15px 0 5px; font-size: 18px; font-weight: bold; color: #1f2937; border-top: 2px solid #3b82f6; margin-top: 10px;">
                  <span>Total:</span>
                  <span>${parseInt(orderData.total_amount).toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>
            
            ${orderData.notes ? `
              <div style="margin-bottom: 20px;">
                <h4 style="color: #374151;">Notes:</h4>
                <p style="background: #fef3c7; padding: 10px; border-radius: 8px; border-left: 4px solid #f59e0b;">${orderData.notes}</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px;">
                Connectez-vous à l'interface admin pour traiter cette commande
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
            <p>Stock Shop Mali - Système de gestion automatisé</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de nouvelle commande envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Erreur envoi email nouvelle commande:', error);
    return { success: false, error: error.message };
  }
};

// Envoyer un email de validation de commande au client
const sendOrderValidationEmail = async (orderData) => {
  if (!orderData.customer_email) {
    console.log('ℹ️ Pas d\'email client pour la validation');
    return { success: false, error: 'Pas d\'email client' };
  }

  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('⚠️ Transporteur email non configuré - email ignoré');
      return { success: false, error: 'Configuration email manquante' };
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@stockshop.ml',
      to: orderData.customer_email,
      subject: `✅ Votre Commande #${orderData.numero_commande} est Validée`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0f9ff;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 30px;">
              ✅ Commande Validée !
            </h2>
            
            <div style="background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h3 style="margin: 0;">Commande #${orderData.numero_commande}</h3>
              <p style="margin: 5px 0 0;">Status: Validée - Faisabilité confirmée</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Bonjour <strong>${orderData.customer_name}</strong>,
              </p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Nous avons le plaisir de vous informer que votre commande a été validée et que tous les produits sont disponibles.
              </p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h4 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Résumé de votre Commande</h4>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                ${orderData.items.map(item => `
                  <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                    <span>${item.product_name} x${item.quantity}</span>
                    <span style="font-weight: bold;">${parseInt(item.total_price).toLocaleString()} FCFA</span>
                  </div>
                `).join('')}
                <div style="display: flex; justify-content: space-between; padding: 15px 0 5px; font-size: 18px; font-weight: bold; color: #1f2937; border-top: 2px solid #10b981; margin-top: 10px;">
                  <span>Total:</span>
                  <span>${parseInt(orderData.total_amount).toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>
            
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="color: #1e40af; margin-top: 0;">📍 Informations de Livraison</h4>
              <p style="margin: 5px 0; color: #1f2937;"><strong>Adresse:</strong> ${orderData.customer_address}</p>
              <p style="margin: 5px 0; color: #1f2937;"><strong>Ville:</strong> ${orderData.customer_city}</p>
              <p style="margin: 5px 0; color: #1f2937;"><strong>Téléphone:</strong> ${orderData.customer_phone}</p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <h4 style="color: #92400e; margin-top: 0;">🚚 Prochaines Étapes</h4>
              <p style="margin: 5px 0; color: #1f2937;">• Votre commande est en cours de préparation</p>
              <p style="margin: 5px 0; color: #1f2937;">• Vous serez contacté pour organiser la livraison</p>
              <p style="margin: 5px 0; color: #1f2937;">• Paiement à la livraison (uniquement à Bamako)</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px;">
                Pour toute question, contactez-nous au: <strong>+223 XX XX XX XX</strong>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
            <p>Stock Shop Mali - Votre partenaire électronique au Mali</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de validation envoyé au client:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Erreur envoi email validation:', error);
    return { success: false, error: error.message };
  }
};

// Envoyer la facture par email après livraison
const sendInvoiceEmail = async (orderData, invoiceHtml) => {
  if (!orderData.customer_email) {
    console.log('ℹ️ Pas d\'email client pour la facture');
    return { success: false, error: 'Pas d\'email client' };
  }

  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('⚠️ Transporteur email non configuré - email ignoré');
      return { success: false, error: 'Configuration email manquante' };
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@stockshop.ml',
      to: orderData.customer_email,
      subject: `🧾 Facture - Commande #${orderData.numero_commande} Livrée`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0fdf4;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; text-align: center; margin-bottom: 30px;">
              🎉 Commande Livrée avec Succès !
            </h2>
            
            <div style="background: #059669; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h3 style="margin: 0;">Commande #${orderData.numero_commande}</h3>
              <p style="margin: 5px 0 0;">Status: Livrée ✅</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Bonjour <strong>${orderData.customer_name}</strong>,
              </p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Votre commande a été livrée avec succès ! Merci pour votre confiance.
              </p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Vous trouverez ci-joint votre facture détaillée.
              </p>
            </div>
            
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="color: #1e40af; margin-top: 0;">🧾 Facture</h4>
              ${invoiceHtml || `
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                  ${orderData.items.map(item => `
                    <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                      <span>${item.product_name} x${item.quantity}</span>
                      <span style="font-weight: bold;">${parseInt(item.total_price).toLocaleString()} FCFA</span>
                    </div>
                  `).join('')}
                  <div style="display: flex; justify-content: space-between; padding: 15px 0 5px; font-size: 18px; font-weight: bold; color: #1f2937; border-top: 2px solid #059669; margin-top: 10px;">
                    <span>Total Payé:</span>
                    <span>${parseInt(orderData.total_amount).toLocaleString()} FCFA</span>
                  </div>
                </div>
              `}
            </div>
            
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
              <h4 style="color: #065f46; margin-top: 0;">💚 Merci pour votre confiance !</h4>
              <p style="margin: 5px 0; color: #1f2937;">N'hésitez pas à nous recommander à vos proches</p>
              <p style="margin: 5px 0; color: #1f2937;">Pour tout service après-vente, contactez-nous</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px;">
                Support client: <strong>+223 XX XX XX XX</strong> | Email: <strong>contact@stockshop.ml</strong>
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
            <p>Stock Shop Mali - Votre partenaire électronique au Mali</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Facture envoyée par email:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Erreur envoi facture par email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendNewOrderNotification,
  sendOrderValidationEmail,
  sendInvoiceEmail
};