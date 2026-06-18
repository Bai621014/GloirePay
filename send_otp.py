import http.client
import json
import os

def envoyer_sms_otp(numero_telephone):
    # 1. Récupération des accès sécurisés
    INFOBIP_URL = os.environ.get("INFOBIP_URL", "jrwjyk.api.infobip.com")
    API_KEY = os.environ.get("INFOBIP_API_KEY", "7029a057fc5ed3ded598d069b3b9b94e-c689f015-967e-4e35-aa52-f1e4e2b3eed4")
    
    # /!\ METS ICI LE MESSAGE ID REÇU LORS DE L'EXÉCUTION DE "create_template.py" /!\
    MESSAGE_ID = os.environ.get("INFOBIP_MESSAGE_ID", "TON_MESSAGE_ID_ICI")

    if MESSAGE_ID == "TON_MESSAGE_ID_ICI":
        print("Erreur : Tu dois remplacer 'TON_MESSAGE_ID_ICI' par le messageId généré par ton template.")
        return

    conn = http.client.HTTPSConnection(INFOBIP_URL)

    # 2. Préparation du destinataire (Le numéro doit inclure l'indicatif, ex: 235xxxxxx pour le Tchad)
    payload = json.dumps({
        "pinId": MESSAGE_ID,
        "to": numero_telephone
    })

    headers = {
        'Authorization': f'App {API_KEY}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

    try:
        print(f"Envoi du code de validation au numéro : {numero_telephone}...")
        # Route officielle Infobip 2FA pour générer et envoyer un PIN automatiquement
        conn.request("POST", "/2fa/2/pin", payload, headers)
        
        res = conn.getresponse()
        data = res.read().decode("utf-8")
        
        print("\n--- RÉPONSE ENVOI SMS ---")
        print(data)
        print("-------------------------\n")
        print("Important pour ton backend : Sauvegarde le 'pinId' reçu pour pouvoir vérifier la saisie du client.")

    except Exception as e:
        print(f"Erreur d'envoi : {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    # Exemple de test local (Remplace par ton propre numéro pour tester la réception)
    # Format international requis, sans le symbole '+' (ex: 23560000000)
    NUMERO_TEST = "235XXXXXXXX" 
    
    if "X" in NUMERO_TEST:
        print("Note : Configure un vrai numéro de téléphone dans le code pour tester le SMS.")
    else:
        envoyer_sms_otp(NUMERO_TEST)
