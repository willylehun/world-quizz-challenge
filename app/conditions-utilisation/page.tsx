import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Règles d’utilisation | World Quizz Challenge",
  description: "Règles de conduite et d’utilisation de World Quizz Challenge.",
};

export default function TermsPage() {
  return (
    <main className="legal-shell">
      <article className="legal-card">
        <a className="legal-back" href="/game.html">← Retour à WQC</a>
        <p className="legal-kicker">World Quizz Challenge</p>
        <h1>Règles d’utilisation</h1>
        <p className="legal-updated">Dernière mise à jour : 27 septembre 2026</p>

        <section><h2>Un espace de jeu respectueux</h2><p>En créant un profil WQC, le joueur s’engage à choisir un pseudo respectueux et à utiliser les invitations uniquement pour jouer avec d’autres personnes. Aucun chat, image, commentaire ou publication publique n’est proposé.</p></section>
        <section><h2>Contenus et comportements interdits</h2><p>Sont interdits les pseudos ou comportements haineux, discriminatoires, menaçants, sexuels, violents, illégaux, trompeurs, usurpant une identité, divulguant des données personnelles, ainsi que le spam et l’envoi abusif d’invitations.</p></section>
        <section><h2>Signaler et bloquer</h2><p>Une invitation ou un adversaire peut être signalé et bloqué directement dans l’application. Le blocage annule les interactions en cours et empêche immédiatement de nouveaux défis entre les profils concernés. Un usage abusif ou contraire à ces règles peut entraîner la restriction ou la suppression du profil.</p></section>
        <section><h2>Données et suppression</h2><p>Le joueur peut exporter puis supprimer son profil et ses données à tout moment. Les détails figurent dans la politique de confidentialité.</p><div className="legal-actions"><a className="legal-primary" href="/confidentialite">Confidentialité</a><a href="/suppression-compte">Supprimer un profil</a></div></section>
      </article>
    </main>
  );
}
