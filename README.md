# 🚀 Vendstoc-App (GloireHub API & Webhook Service)

Système automatisé de traitement et de distribution de paiements. L'application écoute les notifications de paiement Mobile Money (via le Webhook Monetbil) et déclenche de manière autonome un contrat intelligent (Smart Contract) sur la blockchain pour transférer instantanément les fonds aux vendeurs tout en prélevant la commission de la plateforme.

## 🛠️ Fonctionnalités
- **Réception Webhook :** Interception automatique des transactions réussies en Mobile Money.
- **Engine Web3 / Python :** Signature et exécution autonomes des interactions avec le Smart Contract.
- **Split Payment Sécurisé :** Distribution instantanée et on-chain (Part Vendeur + Commission Plateforme).
- **Prêt pour la production :** Configuré spécifiquement pour un déploiement stable sur **Railway** avec Gunicorn.

---

## 📋 Variables d'environnement à configurer (Railway)

Pour que le serveur fonctionne correctement, ajoute ces variables d'environnement dans l'onglet **Variables** de ton projet Railway :

| Variable | Description | Exemple / Valeur |
| :--- | :--- | :--- |
| `PORT` | Port d'écoute du serveur | *(Attribué automatiquement par Railway)* |
| `BLOCKCHAIN_RPC_URL` | URL du nœud RPC de la blockchain | `https://rpc.ankr.com/eth_holesky` |
| `CONTRACT_ADDRESS` | Adresse de ton Smart Contract déployé | `0x...` |
| `SERVER_WALLET_ADDRESS`| Adresse publique du portefeuille de ton serveur | `0x...` |
| `WALLET_PRIVATE_KEY` | Clé privée du portefeuille serveur (pour signer les tx) | *(Ta clé privée secrète)* |

---

## 🏗️ Structure des fichiers principaux
- `app.py` : Serveur Flask principal gérant la route du webhook et la logique Web3.
- `Procfile` : Commande de démarrage de production (`web: gunicorn app:app`).
- `requirements.txt` : Liste des dépendances Python requises pour l'environnement.
- `paiement.html` : Interface frontend intégrant la passerelle Monetbil et l'option Crypto.

---

## 🚀 Déploiement sur Railway
1. Connecte ton dépôt GitHub `Bai621014/vendstoc-app` à ton tableau de bord Railway.
2. Ajoute les variables d'environnement listées ci-dessus.
3. Railway détectera automatiquement le `Procfile` et déploiera l'application.
4. Configure l'URL de ton webhook dans ton tableau de bord Monetbil : `https://ton-app-railway.up.railway.app/webhook/monetbil`.
