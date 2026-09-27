# Application Android WQC

Ce module transforme le site WQC en Trusted Web Activity (TWA) avec Android Browser Helper. Il cible Android 16 / API 36 et ne contient aucune clé secrète ni clé de signature.

## Identifiant et URL

- Application ID : `com.byw.worldquizzchallenge`
- URL de lancement : `https://world-quizz-challenge.wbuan15.chatgpt.site/game.html`
- Version initiale : `1.0.0` (`versionCode 1`)

L’Application ID devient définitif après la première publication Google Play. Le valider avant de créer la fiche Play.

## Build local

Pré-requis : JDK 17, Android SDK API 36 et Gradle 8.13.

```sh
gradle -p android lintRelease bundleRelease --no-daemon
```

Le bundle de production se trouve ensuite sous `android/app/build/outputs/bundle/release/`. La signature d’upload doit être configurée hors du dépôt, idéalement via les mécanismes sécurisés du poste de publication ou de Google Play. Aucun keystore ne doit être commité.

## Association au domaine

Après création de l’application dans Play Console :

1. activer Play App Signing ;
2. copier l’empreinte SHA-256 du certificat de signature d’application Play ;
3. remplacer le marqueur dans `assetlinks.template.json` ;
4. publier le contenu obtenu sur `/.well-known/assetlinks.json` du domaine WQC ;
5. vérifier que cette URL répond directement en HTTPS avec `Content-Type: application/json`, sans redirection ;
6. tester la version distribuée par Play sur un appareil Android.

Tant que l’empreinte Play n’est pas connue, le fichier public `assetlinks.json` n’est volontairement pas créé : une association fictive ferait échouer la vérification de la TWA.
