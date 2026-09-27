# Préparation à la protection des données

WQC ne demande ni compte externe, ni adresse e-mail, ni identité civile. L’application conserve uniquement les données nécessaires au jeu : pseudo choisi, progression locale, historique de duels, réponses et scores, jeton d’accès haché côté serveur, et abonnement de notification lorsque le joueur l’active volontairement.

## État actuel

- Aucune publicité, aucun traceur et aucune mesure d’audience ne sont intégrés.
- La progression solo reste dans le stockage local du navigateur. Le jeton de profil est conservé dans un cookie sécurisé HttpOnly ; les anciens jetons LocalStorage sont renouvelés puis supprimés automatiquement.
- Les parties multijoueurs et abonnements push sont stockés dans D1 afin d’assurer les invitations, tours, résultats et notifications.
- La protection anti-abus conserve uniquement des identifiants techniques hachés, sans adresse réseau en clair, et purge les compteurs expirés.
- Le bouton de réinitialisation remet à zéro les statistiques et la progression prévues sans supprimer le profil ni les parties existantes.
- Le joueur peut exporter ses données serveur depuis son profil ou la page de suppression du compte.
- Le joueur peut supprimer définitivement son profil, ses parties, ses réponses, ses statistiques de duel et ses abonnements push depuis l’application ou `/suppression-compte`.
- Un joueur peut signaler et bloquer un adversaire depuis le résultat d’un duel. Le motif, les identifiants concernés et la date du signalement sont conservés pour assurer la sécurité du service ; le blocage empêche immédiatement de nouvelles interactions.
- La politique publique est disponible sur `/confidentialite`.

## Avant toute future collecte de statistiques

Documenter la finalité, la base légale, les champs exacts, la durée de conservation, les destinataires et le mécanisme d’exercice des droits. Recueillir un consentement explicite lorsque nécessaire, minimiser ou agréger les données, et ne jamais placer de clé de base de données privilégiée dans le frontend. Aucun dispositif de collecte supplémentaire ne doit être activé sans validation préalable.
