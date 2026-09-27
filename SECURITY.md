# Sécurité de World Quizz Challenge

## Signaler une vulnérabilité

Ne publiez pas de secret, de jeton, de donnée de joueur ni de procédure d’exploitation dans une issue publique. Contactez directement le propriétaire du dépôt avec les étapes minimales de reproduction, l’impact estimé et la version concernée.

## Principes appliqués

- Les secrets VAPID restent dans les variables d’environnement de l’hébergeur ; seule la clé publique est transmise au navigateur.
- Les requêtes D1 utilisent des paramètres liés et les parties ne sont accessibles qu’à leurs deux participants.
- Les réponses API ne sont pas mises en cache et ne renvoient pas de détails d’erreur internes.
- Les dépendances, le lint, TypeScript, la compilation et les contrôles de sécurité sont vérifiés par CI en lecture seule.
- Aucune collecte analytique ni publicitaire n’est activée.

Les corrections de sécurité doivent conserver les données et fonctionnalités existantes et être testées sur la PWA avant publication.
