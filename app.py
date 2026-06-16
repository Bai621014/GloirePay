import os
import json
from flask import Flask, request, jsonify
from web3 import Web3
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()

app = Flask(__name__)

# ==========================================
# 1. CONFIGURATION DE LA BLOCKCHAIN (WEB3)
# ==========================================
RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL", "https://rpc.ankr.com/eth_holesky")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
SERVER_PRIVATE_KEY = os.getenv("WALLET_PRIVATE_KEY")
SERVER_ADDRESS = os.getenv("SERVER_WALLET_ADDRESS") 

w3 = Web3(Web3.HTTPProvider(RPC_URL))

if w3.is_connected():
    print("🤖 [SYSTEM] Serveur connecté avec succès au nœud RPC Blockchain.")
else:
    print("⚠️ [SYSTEM WARNING] Échec de connexion au nœud RPC Blockchain.")

# ==========================================
# 2. CONFIGURATION DE L'ABI DU CONTRAT (MIS À JOUR)
# ==========================================
# Allégé et synchronisé : prend uniquement l'adresse du vendeur en paramètre
ABI_JSON = """[
    {
        "inputs": [
            {"internalType": "address payable", "name": "_vendeur", "type": "address"}
        ],
        "name": "payerArticle",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
]"""
contract = w3.eth.contract(address=w3.to_checksum_address(CONTRACT_ADDRESS), abi=json.loads(ABI_JSON))


# ==========================================
# 3. ROUTE WEBHOOK DE DÉTECTION AUTOMATIQUE
# ==========================================
@app.route('/webhook/monetbil', methods=['POST'])
def webhook_mobile_money():
    # Monetbil envoie les notifications au format formulaire standard (Form Data)
    # On utilise request.form, avec un fallback sur request.json au cas où
    data = request.form if request.form else request.json
    
    if not data:
        print("⚠️ [TRAITEMENT REJETÉ] Requête vide reçue.")
        return jsonify({"status": "error", "message": "Données manquantes"}), 400

    # Extraction du statut du paiement Mobile Money
    status = data.get('status')
    
    if status in ['success', 'SUCCESS']:
        print("💰 [NOTIFICATION MONETBIL] Dépôt Mobile Money validé avec succès !")
        
        # Récupération des métadonnées de la transaction (passées via le bouton ou l'API)
        adresse_vendeur = data.get('vendeur_crypto_address') 
        montant_eth = data.get('montant_crypto')  # Montant à envoyer en crypto au contrat
        
        if not adresse_vendeur or not montant_eth:
            print("⚠️ [DONNÉES INCOMPLÈTES] Adresse du vendeur ou montant crypto manquant dans le webhook.")
            return jsonify({"status": "error", "message": "Métadonnées de transaction incomplètes"}), 400
        
        try:
            print(f"🔄 [TRAITEMENT AUTOMATIQUE] Lancement du virement vers le vendeur : {adresse_vendeur}")
            
            # Appel de la fonction de distribution automatique (sans le paramètre commission qui est géré on-chain)
            tx_hash = declencher_paiement_blockchain(adresse_vendeur, montant_eth)
            
            print(f"📢 [SUCCÈS] Vendeur payé via le Smart Contract. Tx Hash: {tx_hash}")
            
            return jsonify({
                "status": "success", 
                "message": "Contrat intelligent exécuté avec succès !", 
                "tx_hash": tx_hash
            }), 200
            
        except Exception as e:
            print(f"❌ [ERREUR CRITIQUE BLOCKCHAIN] Échec du traitement : {e}")
            return jsonify({
                "status": "error", 
                "message": "Erreur lors de l'exécution automatique du contrat intelligent",
                "details": str(e)
            }), 500
            
    else:
        print(f"⚠️ [TRAITEMENT REJETÉ] Événement ignoré. Statut reçu : {status}")
        return jsonify({
            "status": "ignored", 
            "message": "Paiement non finalisé en Mobile Money, action annulée."
        }), 200


# ==========================================
# 4. ENGINE DE DISTRIBUTION CRYPTO AUTOMATIQUE
# ==========================================
def declencher_paiement_blockchain(vendeur, montant_eth):
    # Conversion du montant en Wei
    montant_wei = w3.to_wei(montant_eth, 'ether')
    
    # Récupération sécurisée du Nonce
    nonce = w3.eth.get_transaction_count(SERVER_ADDRESS)
    
    # Construction de l'appel (Uniquement l'adresse du vendeur passée au Smart Contract)
    tx = contract.functions.payerArticle(
        w3.to_checksum_address(vendeur)
    ).build_transaction({
        'from': SERVER_ADDRESS,
        'value': montant_wei,             # Le total des fonds envoyés qui seront séparés (Part Vendeur + Commission)
        'gas': 95000,                     # Ajusté car l'exécution consomme moins de gaz sans le paramètre supplémentaire
        'gasPrice': w3.eth.gas_price,     
        'nonce': nonce,
    })
    
    # Signature électronique via la clé privée du portefeuille serveur
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=SERVER_PRIVATE_KEY)
    
    # Envoi de la transaction sur la blockchain
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    return w3.to_hex(tx_hash)


# ==========================================
# 5. DÉMARRAGE DU SERVEUR
# ==========================================
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 [STATUT LOG] Serveur en mode écoute active sur le port {port}...")
    app.run(host='0.0.0.0', port=port)
