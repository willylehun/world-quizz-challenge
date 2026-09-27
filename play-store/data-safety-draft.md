# Brouillon Data safety — à reporter dans Play Console

Ce document décrit l’état du code préparé. Vérifier une dernière fois les réponses dans Play Console au moment de l’envoi.

## Vue d’ensemble

- Données collectées : oui, uniquement pour les profils et défis.
- Données partagées avec des tiers à des fins commerciales : non.
- Chiffrement en transit : oui, HTTPS uniquement.
- Suppression des données : oui, dans l’application et sur la page Web dédiée.
- Publicité, profilage ou mesure d’audience : non.

## Déclarations proposées

| Catégorie Play | Donnée WQC | Collectée | Partagée | Finalité | Requise |
|---|---|---:|---:|---|---|
| Informations personnelles → Identifiants utilisateur | Pseudo et identifiant interne | Oui | Non | Fonctionnement du compte et défis | Oui pour le multijoueur |
| Activité dans l’application → Interactions | Questions, réponses, scores, invitations et résultats | Oui | Non | Fonctionnalité, statistiques et synchronisation des duels | Oui pour les défis |
| Contenu généré par l’utilisateur → Autre contenu | Pseudo choisi par le joueur | Oui | Non | Identification auprès des amis | Oui pour le multijoueur |
| Appareil ou autres identifiants | Abonnement push et identifiant technique anti-abus haché | Oui | Non | Notifications, sécurité et prévention des abus | Notifications facultatives ; anti-abus requis |

La progression solo, le solde WQC et les meilleurs scores restent dans le stockage local de l’appareil et ne sont pas envoyés au serveur.

## Conservation et suppression

- Les profils et données de défis sont conservés tant que le profil existe.
- Les compteurs anti-abus expirent automatiquement après leur courte fenêtre technique.
- Les abonnements push sont supprimés avec le profil.
- L’utilisateur peut exporter ses données serveur avant suppression.
- La suppression efface le profil, les défis associés, les réponses, les statistiques de duel, les signalements/blocages associés et les abonnements push.

## Réponses de formulaire à confirmer

- L’app permet la création d’un compte/profil : **oui**.
- Méthode : pseudo propre à l’application, sans e-mail ni mot de passe.
- Suppression dans l’app : **oui**.
- URL de suppression : `https://world-quizz-challenge.wbuan15.chatgpt.site/suppression-compte`.
- Politique de confidentialité : `https://world-quizz-challenge.wbuan15.chatgpt.site/confidentialite`.
