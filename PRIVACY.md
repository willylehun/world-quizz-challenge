# Préparation à la protection des données

WQC ne demande ni compte externe, ni adresse e-mail, ni identité civile. L’application conserve uniquement les données nécessaires au jeu : pseudo choisi, progression locale, historique de duels, réponses et scores, jeton d’accès haché côté serveur, et abonnement de notification lorsque le joueur l’active volontairement.

## État actuel

- Aucune publicité, aucun traceur et aucune mesure d’audience ne sont intégrés.
- La progression solo et le jeton de profil restent dans le stockage local du navigateur.
- Les parties multijoueurs et abonnements push sont stockés dans D1 afin d’assurer les invitations, tours, résultats et notifications.
- Le bouton de réinitialisation remet à zéro les statistiques et la progression prévues sans supprimer le profil ni les parties existantes.

## Avant toute future collecte de statistiques

Documenter la finalité, la base légale, les champs exacts, la durée de conservation, les destinataires et le mécanisme d’exercice des droits. Recueillir un consentement explicite lorsque nécessaire, minimiser ou agréger les données, et ne jamais placer de clé de base de données privilégiée dans le frontend. Aucun dispositif de collecte supplémentaire ne doit être activé sans validation préalable.
