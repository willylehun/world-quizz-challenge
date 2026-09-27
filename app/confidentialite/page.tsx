import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confidentialité | World Quizz Challenge",
  description: "Politique de confidentialité de World Quizz Challenge.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-shell">
      <article className="legal-card">
        <a className="legal-back" href="/game.html">← Retour à WQC</a>
        <p className="legal-kicker">World Quizz Challenge</p>
        <h1>Politique de confidentialité</h1>
        <p className="legal-updated">Dernière mise à jour : 27 septembre 2026</p>

        <section>
          <h2>Résumé</h2>
          <p>WQC est un jeu de quiz édité sous la signature « By W ». Aucun compte externe, aucune adresse e-mail, aucune publicité et aucun outil de suivi publicitaire ou analytique ne sont utilisés.</p>
        </section>

        <section>
          <h2>Données traitées</h2>
          <ul>
            <li>Le pseudo WQC, un identifiant interne, la date de création du profil et un jeton d’accès conservé sous forme hachée côté serveur.</li>
            <li>Les invitations, questions, réponses, scores et résultats nécessaires aux défis entre joueurs.</li>
            <li>La liste d’amis choisie par le joueur et, pendant sept jours au maximum, les recherches d’adversaire aléatoire ou invitations restées sans réponse.</li>
            <li>La progression solo, les meilleurs scores et le solde WQC, conservés uniquement dans le stockage local de l’appareil.</li>
            <li>Un abonnement technique aux notifications push uniquement si le joueur les active volontairement.</li>
            <li>Des identifiants techniques hachés et temporaires utilisés pour limiter les abus, sans conserver l’adresse réseau en clair.</li>
          </ul>
        </section>

        <section>
          <h2>Finalités et partage</h2>
          <p>Ces données servent uniquement à fournir le jeu, synchroniser les défis, afficher les statistiques, envoyer les notifications demandées et protéger le service contre les abus. Elles ne sont ni vendues, ni utilisées pour de la publicité ciblée. L’hébergement technique peut traiter les données strictement nécessaires au fonctionnement du service.</p>
        </section>

        <section>
          <h2>Conservation et sécurité</h2>
          <p>Les données serveur sont conservées tant que le profil existe. Les invitations non acceptées et recherches d’adversaire aléatoire expirent automatiquement après sept jours. Les compteurs anti-abus expirent également. Les échanges utilisent HTTPS et la session repose sur un cookie sécurisé, non accessible au JavaScript. Les données locales restent sur l’appareil jusqu’à leur réinitialisation, leur suppression ou l’effacement des données du navigateur.</p>
        </section>

        <section>
          <h2>Vos choix et vos droits</h2>
          <p>Depuis le menu Profil, le joueur peut télécharger une copie de ses données serveur ou supprimer définitivement son profil. La suppression efface le profil, ses défis, ses réponses, ses scores de duel, sa liste d’amis, ses recherches aléatoires et ses abonnements aux notifications. Elle est aussi accessible depuis la page Web dédiée.</p>
          <div className="legal-actions">
            <a className="legal-primary" href="/suppression-compte">Supprimer un profil</a>
            <a href="/game.html">Ouvrir le jeu</a>
          </div>
        </section>

        <section>
          <h2>Contact</h2>
          <p>Pour toute question qui ne peut pas être traitée dans l’application, contactez le responsable depuis le dépôt public WQC, sans publier de jeton, de donnée personnelle ni d’information sensible.</p>
          <a href="https://github.com/willylehun/world-quizz-challenge" target="_blank" rel="noreferrer">Dépôt public WQC</a>
        </section>
        <section><h2>Règles de conduite</h2><p>Les pseudos et comportements abusifs sont interdits. Les règles applicables et les outils de signalement/blocage sont décrits sur la page dédiée.</p><a href="/conditions-utilisation">Consulter les règles d’utilisation</a></section>
      </article>
    </main>
  );
}
