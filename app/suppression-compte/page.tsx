import type { Metadata } from "next";
import DeleteAccountClient from "./DeleteAccountClient";

export const metadata: Metadata = {
  title: "Suppression du compte | World Quizz Challenge",
  description: "Supprimer définitivement un profil World Quizz Challenge et ses données.",
};

export default function DeleteAccountPage() {
  return (
    <main className="legal-shell">
      <article className="legal-card legal-card-narrow">
        <a className="legal-back" href="/game.html">← Retour à WQC</a>
        <p className="legal-kicker">Gestion des données</p>
        <h1>Supprimer mon profil WQC</h1>
        <p>La suppression efface définitivement le pseudo, les défis, les réponses, les scores de duel, la liste d’amis, les recherches d’adversaire aléatoire et les abonnements aux notifications. La progression conservée localement sur cet appareil est également effacée.</p>
        <DeleteAccountClient />
        <p className="legal-footnote">Cette action est irréversible. Vous pouvez télécharger une copie des données avant de confirmer.</p>
        <a href="/confidentialite">Consulter la politique de confidentialité</a>
      </article>
    </main>
  );
}
