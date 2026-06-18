import http.client
import json
import os

def creer_template_sms():
    # 1. Récupération sécurisée de l'URL et de la clé API
    INFOBIP_URL = os.environ.get("INFOBIP_URL", "jrwjyk.api.infobip.com")
    API_KEY = os.environ.get("INFOBIP_API_KEY", "7029a057fc5ed3ded598d069b3b9b94e-c689f015-967e-4e35-aa52-f1e4e2b3eed4")

    # /!\ METS ICI L'APPLICATION ID QUE TU AS REÇU EN EXÉCUTANT LE PREMIER SCRIPT /!\
    APPLICATION_ID = os.environ.get("INFOBIP_APP_ID", "TON_APPLICATION_ID_ICI")

    if APPLICATION_ID == "TON_APPLICATION_ID_ICI":
        print("Attention : Tu dois remplacer 'TON_APPLICATION_ID_ICI' par le code reçu au premier script.")
        return

    conn = http.client.HTTPSConnection(INFOBIP_URL)

    # 2. Définition du modèle de SMS (4 chiffres, valide 15 min)
    payload = json.dumps({
        "pinType": "NUMERIC",
        "pinLength": 4,
        "messageText": "Votre code de validation GloirePay est {{pin}}. Il est valide pendant 15 minutes.",
        "senderId": "GloirePay"  # Le nom qui s'affichera en haut du SMS sur le téléphone
    })

    headers = {
        'Authorization': f'App {API_KEY}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

    try:
        # Envoi de la requête vers la route des messages de ton application
        route = f"/2fa/2/applications/{APPLICATION_ID}/messages"
        conn.request("POST", route, payload, headers)
        
        res = conn.getresponse()
        data = res.read().decode("utf-8")
        
        print("\n--- RÉPONSE INFOBIP (TEMPLATE RÉUSSI) ---")
        print(data)
        print("-----------------------------------------\n")
        print("Note importante : Garde précieusement le 'messageId' reçu dans cette réponse.")

    except Exception as e:
        print(f"Une erreur est survenue : {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    creer_template_sms()
