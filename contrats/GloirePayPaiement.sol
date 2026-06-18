// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GloirePayPaiement
 * @dev Système de paiement autonome et sécurisé pour l'écosystème GloireMedia.
 * Gère la distribution instantanée des fonds et la commission de la plateforme.
 */
contract GloirePayPaiement {
    address payable public admin;
    uint256 public commissionPct; // Pourcentage de commission de la plateforme
    
    // Espace réservé pour l'adresse du Smart Contract du GloireCoin (V10)
    address public gloireCoinAddress; 

    // Événements mis à jour
    event PaymentShared(
        address indexed acheteur,
        address indexed vendeur,
        uint256 montantTotal,
        uint256 commission,
        uint256 partVendeur
    );
    event CommissionUpdated(uint256 nouveauPourcentage);
    event AdminChanged(address indexed ancienAdmin, address indexed nouvelAdmin);
    event GloireCoinAddressUpdated(address indexed nouvelleAdresse);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Seul l'admin GloirePay peut effectuer cette action");
        _;
    }

    constructor() {
        admin = payable(msg.sender);
        commissionPct = 4; // Configuration de la commission par défaut (4%)
    }

    /**
     * @dev Gère le paiement d'un service ou contenu GloireMedia et sépare automatiquement les fonds.
     * @param _vendeur L'adresse du portefeuille crypto du destinataire/créateur.
     */
    function payerArticle(address payable _vendeur) public payable {
        require(msg.value > 0, "Le montant doit etre superieur a 0");
        require(_vendeur != address(0), "Adresse du vendeur invalide");
        require(_vendeur != admin, "Le vendeur ne peut pas etre l'administrateur de la plateforme");

        // 1. Calcul des parts de l'écosystème
        uint256 montantCommission = (msg.value * commissionPct) / 100;
        uint256 montantVendeur = msg.value - montantCommission;

        // 2. Distribution instantanée et sécurisée via .call (anti-blocage de gas)
        if (montantCommission > 0) {
            (bool successAdmin, ) = admin.call{value: montantCommission}("");
            require(successAdmin, "Echec du transfert de la commission a l'admin GloirePay");
        }

        (bool successVendeur, ) = _vendeur.call{value: montantVendeur}("");
        require(successVendeur, "Echec du transfert instantane des fonds au vendeur");

        // 3. Suivi de l'événement pour le serveur GloireHub
        emit PaymentShared(msg.sender, _vendeur, msg.value, montantCommission, montantVendeur);
    }

    /**
     * @dev Permet à l'admin de modifier le taux de commission de GloirePay.
     * @param _nouveauPct Le nouveau pourcentage (ex: 5 pour 5%).
     */
    function modifierCommission(uint256 _nouveauPct) public onlyAdmin {
        require(_nouveauPct <= 20, "La commission ne peut pas depasser 20%"); 
        commissionPct = _nouveauPct;
        emit CommissionUpdated(_nouveauPct);
    }

    /**
     * @dev Associe l'adresse officielle du jeton GloireCoin (V10) à la passerelle de paiement.
     * @param _gloireCoin Adresse du contrat ERC-20 du GloireCoin.
     */
    function configurerGloireCoin(address _gloireCoin) public onlyAdmin {
        require(_gloireCoin != address(0), "Adresse du GloireCoin invalide");
        gloireCoinAddress = _gloireCoin;
        emit GloireCoinAddressUpdated(_gloireCoin);
    }

    /**
     * @dev Modifie l'adresse de l'administrateur principal.
     * @param _nouvelAdmin La nouvelle adresse.
     */
    function changerAdmin(address payable _nouvelAdmin) public onlyAdmin {
        require(_nouvelAdmin != address(0), "Nouvelle adresse invalide");
        require(_nouvelAdmin != admin, "L'adresse est deja celle de l'administrateur actuel"); // ✅ SÉCURITÉ : Évite le gaspillage de gaz

        emit AdminChanged(admin, _nouvelAdmin);
        admin = _nouvelAdmin;
    }
}
