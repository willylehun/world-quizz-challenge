# Checklist de publication Google Play

## Préparé dans le dépôt

- [x] Projet Android TWA, `minSdk 23`, `targetSdk 36`, `compileSdk 36`.
- [x] Application ID proposé : `com.byw.worldquizzchallenge`.
- [x] Trafic HTTP désactivé et URL WQC exclusivement HTTPS.
- [x] Sauvegarde Android des données désactivée.
- [x] Aucun keystore, jeton ou secret dans le dépôt.
- [x] CI Android avec actions épinglées, permissions minimales, timeout et build de contrôle.
- [x] Politique de confidentialité publique et parcours de suppression Web.
- [x] Export et suppression du profil dans l’application.
- [x] Signalement et blocage des profils.
- [x] Brouillons de fiche, Data safety, contenu de l’application et notes de version.
- [x] Icône 512 × 512 et bannière 1024 × 500 préparées.

## À faire avec le compte Play Console

- [ ] Confirmer définitivement l’Application ID avant la première création dans Play Console.
- [ ] Choisir compte personnel ou organisation ; pour une organisation, préparer le numéro D‑U‑N‑S et les justificatifs demandés.
- [ ] Fournir une adresse e-mail d’assistance publique dédiée.
- [ ] Créer l’application, accepter Play App Signing et conserver la clé d’upload hors du dépôt.
- [ ] Récupérer l’empreinte SHA-256 du certificat de signature **d’application Play**.
- [ ] Publier `/.well-known/assetlinks.json` à partir du modèle, puis vérifier la TWA installée depuis Play.
- [ ] Produire le bundle AAB de production signé avec la clé d’upload.
- [ ] Capturer au moins deux captures téléphone finales depuis la version distribuée.
- [ ] Remplir les formulaires Data safety, accès à l’application, contenu, audience cible et IARC à partir des brouillons.
- [ ] Ajouter les URL de confidentialité et de suppression de compte.
- [ ] Exécuter le rapport de pré-lancement sur plusieurs appareils et corriger tout blocage.
- [ ] Si le compte personnel a été créé après le 13 novembre 2023, terminer le test fermé requis avant l’accès à la production.

## Contrôles juste avant envoi

- [ ] Incrémenter `versionCode` à chaque nouvel AAB.
- [ ] Vérifier le domaine public, la PWA, les API, les notifications, la création/suppression de profil et les duels.
- [ ] Vérifier qu’aucune donnée de test offensante ni aucun secret n’apparaît dans le bundle ou la fiche.
- [ ] Vérifier que la fiche et les déclarations correspondent exactement à la version envoyée.
