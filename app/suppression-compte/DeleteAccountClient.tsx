"use client";

import { FormEvent, useEffect, useState } from "react";

type Profile = { id: string; name: string; createdAt: string };

const LOCAL_KEYS = [
  "wqc-classic", "wqc-training", "wqc-challenge", "wqc-wallet", "wqc-question-history",
  "wqc-continent-stats", "wqc-profile", "wqc-profile-token",
];

export default function DeleteAccountClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState("Chargement du profil…");
  const [busy, setBusy] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    fetch(`/api/game/me?_=${Date.now()}`, { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Aucun profil WQC n’est reconnu dans ce navigateur.");
        return response.json() as Promise<{ profile: Profile }>;
      })
      .then((data) => { setProfile(data.profile); setStatus(""); })
      .catch((error: Error) => setStatus(error.message));
  }, []);

  async function downloadData() {
    setStatus("Préparation de l’export…");
    try {
      const response = await fetch(`/api/game/export-profile?_=${Date.now()}`, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("Impossible d’exporter les données.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `wqc-donnees-${profile?.name || "profil"}.json`;
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      setStatus("Export téléchargé.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Export impossible."); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("Suppression en cours…");
    try {
      const response = await fetch("/api/game/delete-profile", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const data = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error || "La suppression a échoué.");
      LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
      setProfile(null); setConfirmation(""); setDeleted(true); setStatus(data.message || "Profil supprimé.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "La suppression a échoué."); }
    finally { setBusy(false); }
  }

  if (deleted) {
    return <div className="legal-success"><h2>Profil supprimé</h2><p>{status}</p><a className="legal-primary" href="/game.html">Retour à WQC</a></div>;
  }

  return (
    <div className="account-delete-panel">
      {profile ? (
        <>
          <div className="legal-profile"><span>Profil reconnu</span><strong>{profile.name}</strong></div>
          <button className="legal-secondary" type="button" onClick={downloadData} disabled={busy}>Télécharger mes données avant suppression</button>
          <form onSubmit={submit}>
            <label htmlFor="confirmation">Pour confirmer, recopiez exactement <strong>{profile.name}</strong></label>
            <input id="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} maxLength={20} autoComplete="off" required />
            <button className="legal-danger" type="submit" disabled={busy || confirmation !== profile.name}>Supprimer définitivement mon profil</button>
          </form>
        </>
      ) : (
        <p>Ouvrez cette page dans le même navigateur ou appareil que celui où le profil a été créé. La suppression sans session n’est pas autorisée afin d’empêcher qu’un tiers supprime un profil en connaissant seulement son pseudo.</p>
      )}
      <p className="legal-status" role="status">{status}</p>
    </div>
  );
}
