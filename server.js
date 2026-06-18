const express = require('express');
const https = require('https');
const fs = require('fs'); // Module pour écrire les fichiers de traçabilité
const path = require('path');
const cors = require('cors'); // ✅ AJOUT : Autorise la communication avec Vercel
const { Web3 } = require('web3'); // ✅ AJOUT : Intégration Web3 Blockchain

const app = express();

// ✅ CONFIGURATION CORS : Permet à ton front-end Vercel d'appeler cette API
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CONFIGURATION ACCÈS STATIQUE : Pour que l'interface admin.html fonctionne enfin
app.use(express.static(__dirname));

// ==========================================
// 🌌 CONFIGURATION WEB3 & SMART CONTRACTS
// ==========================================
const web3 = new Web3(process.env.RPC_URL);
const walletAddress = process.env.SERVER_WALLET_ADDRESS;
const privateKey = process.env.SERVER_PRIVATE_KEY; 

if (privateKey) {
    try {
        const account = web3.eth.accounts.wallet.add(privateKey);
        console.log(`🚀 Portefeuille connecté avec succès : ${account[0].address}`);
    } catch (error) {
        console.error("❌ Erreur d'initialisation du portefeuille Web3 :", error.message);
    }
}

// ==========================================
// ⚙️ CONFIGURATION PASSERELLES (INFOBIP, ETC.)
// ==========================================
const INFOBIP_URL = process.env.INFOBIP_URL || "jrwjyk.api.infobip.com";
const INFOBIP_API_KEY = process.env.INFOBIP_API_KEY || "7029a057fc5ed3ded598d069b3b9b94e-c689f015-967e-4e35-aa52-f1e4e2b3eed4";
const INFOBIP_MESSAGE_ID = process.env.INFOBIP_MESSAGE_ID || "TON_MESSAGE_ID_ICI";

// Fichier où seront stockées toutes les traces
const LOG_FILE = path.join(__dirname, 'transactions.log');

// Fonction maîtresse pour la traçabilité
function inscrireDansLhistorique(typeEvenement, details) {
    const maintenant = new Date();
    const horodatage = maintenant.toISOString().replace('T', ' ').substring(0, 19);
    
    // Ligne formatée proprement pour le fichier de log
    const ligneLog = `[${horodatage}] [${typeEvenement}] : ${JSON.stringify(details)}\n`;
    
    // Écriture invisible et sécurisée en fin de fichier
    fs.appendFile(LOG_FILE, ligneLog, (err) => {
        if (err) console.error("❌ Erreur d'écriture dans le fichier de traçabilité :", err);
    });
}

// Fonction utilitaire pour envoyer les SMS de notification
function envoyerNotificationSMS(numero, texteMessage, typeSms) {
    const payload = JSON.stringify({
        "messages": [
            {
                "destinations": [{ "to": numero }],
                "from": "GloirePay",
                "text": texteMessage
            }
        ]
    });

    const options = {
        hostname: INFOBIP_URL,
        path: '/sms/2/text/advanced',
        method: 'POST',
        headers: {
            'Authorization': `App ${INFOBIP_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`[SMS] Envoyé au ${numero}`);
            inscrireDansLhistorique("SMS_NOTIF_SUCCES", { numero, type: typeSms, reponse: data });
        });
    });

    req.on('error', (e) => {
        console.error(`[SMS] Erreur :`, e.message);
        inscrireDansLhistorique("SMS_NOTIF_ECHEC", { numero, type: typeSms, erreur: e.message });
    });

    req.write(payload);
    req.end();
}

// ==========================================
// 🛣️ ROUTES DE L'APPLICATION
// ==========================================

// 1. Page d'accueil du serveur GloireHub
app.get('/', (req, res) => {
    res.status(200).send('🚀 Serveur GloireHub (API GloirePay) actif, sécurisé, Web3 et CORS configurés.');
});

// Route bonus secrète pour lire l'historique depuis ton navigateur
app.get('/api/admin/logs', (req, res) => {
    if (fs.existsSync(LOG_FILE)) {
        fs.readFile(LOG_FILE, 'utf8', (err, data) => {
            if (err) return res.status(500).send("Erreur de lecture.");
            res.header('Content-Type', 'text/plain; charset=utf-8');
            res.status(200).send(data);
        });
    } else {
        res.status(200).send("Aucune transaction enregistrée pour le moment.");
    }
});

// 2. ROUTE : Déclencher l'envoi du SMS OTP (Authentification 2FA)
app.post('/api/send-otp', (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: "Numéro requis." });

    inscrireDansLhistorique("OTP_DEMANDE", { numero: phoneNumber });

    const payload = JSON.stringify({ "pinId": INFOBIP_MESSAGE_ID, "to": phoneNumber });
    const options = {
        hostname: INFOBIP_URL, path: '/2fa/2/pin', method: 'POST',
        headers: { 'Authorization': `App ${INFOBIP_API_KEY}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
    };

    const reqInfobip = https.request(options, (resInfobip) => {
        let data = '';
        resInfobip.on('data', (chunk) => { data += chunk; });
        resInfobip.on('end', () => {
            try {
                const response = JSON.parse(data);
                inscrireDansLhistorique("OTP_ENVOYE_INFOBIP", { numero: phoneNumber, pinId: response.pinId });
                return res.status(200).json({ success: true, pinId: response.pinId });
            } catch (e) {
                return res.status(500).json({ success: false, message: "Erreur traitement réponse OTP." });
            }
        });
    });
    reqInfobip.write(payload);
    reqInfobip.end();
});

// 3. ROUTE : Vérifier le code 2FA saisi par le client
app.post('/api/verify-otp', (req, res) => {
    const { pinId, pinCode } = req.body;
    if (!pinId || !pinCode) return res.status(400).json({ success: false, message: "Données manquantes." });

    const payload = JSON.stringify({ "pin": pinCode });
    const options = {
        hostname: INFOBIP_URL, path: `/2fa/2/pin/${pinId}/verify`, method: 'POST',
        headers: { 'Authorization': `App ${INFOBIP_API_KEY}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
    };

    const reqInfobip = https.request(options, (resInfobip) => {
        let data = '';
        resInfobip.on('data', (chunk) => { data += chunk; });
        resInfobip.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.verified) {
                    inscrireDansLhistorique("OTP_VERIFICATION_REUSSIT", { pinId });
                    return res.status(200).json({ success: true, message: "Validé !" });
                } else {
                    inscrireDansLhistorique("OTP_VERIFICATION_ECHEC", { pinId, codeTente: pinCode });
                    return res.status(400).json({ success: false, message: "Code incorrect." });
                }
            } catch (e) {
                return res.status(500).json({ success: false, message: "Erreur vérification OTP." });
            }
        });
    });
    reqInfobip.write(payload);
    reqInfobip.end();
});

// 4. Webhook principal : Monetbil, Stripe, GloireCoin
app.post('/newpaiements/webhook', (req, res) => {
    const paymentData = req.body;
    
    const paymentMethod = paymentData.operator || paymentData.method; 
    const amount = paymentData.amount || "1500";
    const status = paymentData.status;

    const phoneEnvoie = paymentData.sender_phone || "+235XXXXXXXX"; 
    const phoneRecoit = paymentData.receiver_phone || "+235XXXXXXXX";

    inscrireDansLhistorique("WEBHOOK_NOTIF_RECUE", { methode: paymentMethod, montant: amount, statut: status });

    const maintenant = new Date();
    const heureFormatee = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');

    if (status === 'SUCCESS' || status === 'success') {
        inscrireDansLhistorique("PAIEMENT_VALIDE", { de: phoneEnvoie, pour: phoneRecoit, montant: amount });

        // A. SMS POUR CELUI QUI REÇOIT L'ARGENT
        const smsDestinataire = `Le bonheur est venu chez vous avec succès, vous venez de recevoir ${amount} de ${phoneEnvoie} À ${heureFormatee}, gérer-le pour votre bien Boss.`;
        envoyerNotificationSMS(phoneRecoit, smsDestinataire, "RECEPTION");

        // B. SMS POUR CELUI QUI ENVOIE L'ARGENT
        const smsExpediteur = `Vous avez envoyé ${amount} avec succès au ${phoneRecoit}. Semez l'argent dans la bonne terre Boss et l'autre arrive encore à vous.`;
        envoyerNotificationSMS(phoneEnvoie, smsExpediteur, "ENVOI");

        return res.status(200).send('Accusés de réception positifs envoyés et traçabilité sauvegardée.');
    } else {
        inscrireDansLhistorique("PAIEMENT_ATTENTE_OU_ECHEC", { statut: status, montant: amount });
        return res.status(200).send('Notification gérée.');
    }
});

// ==========================================
// 🚀 DÉMARRAGE DU SERVEUR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n==============================================`);
    console.log(`🚀 GloireHub connecté sur le port ${PORT}`);
    console.log(`==============================================\n`);
});
