# 🚀 GloirePay (GloireHub API & Webhook Service)

Système automatisé de traitement et de distribution de paiements instantanés à l'international. L'application (propulsée par le serveur **GloireHub**) intercepte les notifications Mobile Money, gère l'écosystème **GloireMedia** et intègre le carburant **GloireCoin (V10)** ainsi que la traçabilité blockchain Web3.

## 🛠️ Fichiers de l'Écosystème
* `server.js` : Serveur backend Node.js / Express gérant l'API, les Webhooks, la validation 2FA (Infobip) et la connexion Web3.
* `package.json` : Fichier de configuration des dépendances de l'application (incluant `express`, `cors` et `web3`).
* `paiement.html` : Interface utilisateur d'initialisation et de choix du canal de règlement.
* `admin.html` : Tableau de bord sécurisé permettant de suivre l'historique et la traçabilité brute des transactions (`transactions.log`).
* `send_otp.py` / `initialiser_2fa.py` : Scripts utilitaires en Python pour la configuration de la sécurité SMS double facteur.

## 📋 Configuration de l'URL du Webhook
Une fois ton serveur déployé, configure l'URL de notification (Callback) dans ton espace développeur Monetbil pour recevoir les validations de paiement en direct :

👉 `https://ton-application-railway-ou-render.com/newpaiements/webhook`
