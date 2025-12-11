import { useState, useEffect } from "react";
import { apiUrl } from "../lib/api";

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  ACCEPTEE: "Acceptée",
  REFUSEE: "Refusée",
};

const STATUS_CLASSES: Record<string, string> = {
  EN_ATTENTE: "text-yellow-700 bg-yellow-50 border-yellow-200",
  ACCEPTEE: "text-green-700 bg-green-50 border-green-200",
  REFUSEE: "text-red-700 bg-red-50 border-red-200",
};

interface UserInfo {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  pseudo: string;
  ville: string;
  role: string;
}

type ApiUserResponse = UserInfo | { error: string };

export default function AccountPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    pseudo: "",
    ville: "",
  });

  const [chantRequests, setChantRequests] = useState<any[]>([]);
  const [audioRequests, setAudioRequests] = useState<any[]>([]);
  const [modRequests, setModRequests] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Charger l'utilisateur
  useEffect(() => {
    const email = localStorage.getItem("email");

    if (!email) {
      setError("Aucun utilisateur connecté.");
      return;
    }

    fetch(apiUrl("/api/me/"), {
      headers: { "X-User-Email": email },
    })
      .then((res) => res.json())
      .then((data: ApiUserResponse) => {
        if ("error" in data) {
          setError(data.error);
          return;
        }

        setUser(data);
        const isAdmin = data.role?.toLowerCase() === "admin";
        localStorage.setItem("role", data.role);
        localStorage.setItem("is_admin", String(isAdmin));
        setForm({
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          pseudo: data.pseudo,
          ville: data.ville,
        });
      })
      .catch(() =>
        setError("Impossible de récupérer les informations.")
      );
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);

      const headers = { "X-User-Email": user.email };

      const fetchList = async (path: string, label: string) => {
        try {
          const res = await fetch(apiUrl(path), { headers });
          if (!res.ok) {
            setHistoryError((prev) =>
              prev ? `${prev} · Impossible de charger ${label}.` : `Impossible de charger ${label}.`
            );
            return [];
          }
          return res.json();
        } catch {
          setHistoryError((prev) =>
            prev ? `${prev} · Impossible de charger ${label}.` : `Impossible de charger ${label}.`
          );
          return [];
        }
      };

      try {
        const [chants, audios, mods] = await Promise.all([
          fetchList("/api/demandes-chants/", "les demandes d'ajout de chants"),
          fetchList("/api/demandes-audio/", "les demandes de pistes audio"),
          fetchList("/api/demandes-modification/", "les demandes de modification"),
        ]);

        setChantRequests(chants);
        setAudioRequests(audios);
        setModRequests(mods);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = localStorage.getItem("email");

    const res = await fetch(apiUrl("/api/me/"), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-User-Email": email || "",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      setError(data.error || "Erreur lors de la mise à jour");
      return;
    }

    setUser({ ...user!, ...form });
    localStorage.setItem("email", form.email.toLowerCase());
    setEditMode(false);
  };

  const renderStatusBadge = (status: string) => {
    const label = STATUS_LABELS[status] ?? status;
    const statusClasses = STATUS_CLASSES[status] ?? "text-gray-700 bg-gray-50 border-gray-200";
    return (
      <span
        className={`text-xs rounded-full border px-2 py-0.5 font-semibold ${statusClasses}`}
      >
        {label}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-220px)] flex items-center justify-center">
        <p className="text-center text-gray-500 text-lg">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl px-4 pt-10 pb-20 min-h-[calc(100vh-220px)] mx-auto">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-2xl bg-purple-50/40 border border-mauve/30 p-6 shadow-md space-y-5">
            <h1 className="text-3xl font-bold text-mauve">
              Mon compte
            </h1>

            {error && (
              <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-red-600">
                {error}
              </p>
            )}

            {editMode ? (
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {["nom", "prenom", "email", "pseudo", "ville"].map((field) => (
                  <div key={field}>
                    <label className="font-semibold text-mauve block mb-1">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <input
                      type={field === "email" ? "email" : "text"}
                      name={field}
                      value={(form as any)[field]}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-mauve/30 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-mauve"
                    />
                  </div>
                ))}

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    className="btn btn-solid"
                  >
                    Sauvegarder
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="btn"
                  >
                    Annuler
                  </button>

                  <button
                    type="button"
                    onClick={() => (window.location.href = "/reset-password")}
                    className="btn btn-solid"
                  >
                    Modifier mon mot de passe
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <p><span className="font-semibold text-mauve">Nom :</span> {user.nom}</p>
                <p><span className="font-semibold text-mauve">Prénom :</span> {user.prenom}</p>
                <p><span className="font-semibold text-mauve">Pseudo :</span> {user.pseudo}</p>
                <p><span className="font-semibold text-mauve">Ville :</span> {user.ville}</p>
                <p><span className="font-semibold text-mauve">Email :</span> {user.email}</p>

                <div className="flex flex-wrap gap-3 pt-3">
                  <button
                    onClick={() => setEditMode(true)}
                    className="btn btn-solid"
                  >
                    Modifier mes données
                  </button>

                  <button
                    onClick={() => (window.location.href = "/reset-password")}
                    className="btn btn-solid"
                  >
                    Changer mon mot de passe
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-mauve">Historique des demandes</h2>
            {historyLoading && (
              <p className="text-sm text-gray-500">Chargement de l'historique…</p>
            )}
          </div>
          {historyError && (
            <p className="text-sm text-red-600">{historyError}</p>
          )}

          <section className="rounded-2xl border border-mauve/30 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-mauve">Demandes d'ajout de chants</h3>
              <span className="text-sm text-gray-500">{chantRequests.length} demande(s)</span>
            </div>
            {historyLoading ? (
              <p className="text-sm text-gray-500">Chargement…</p>
            ) : chantRequests.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Aucune demande pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {chantRequests.map((req) => (
                  <div key={req.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-mauve">{req.nom_chant}</p>
                      {renderStatusBadge(req.statut)}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(req.date_creation).toLocaleDateString("fr-FR")}
                    </p>
                    {req.description && (
                      <p className="text-sm text-gray-700 mt-1">{req.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-mauve/30 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-mauve">Demandes d'ajout de pistes audio</h3>
              <span className="text-sm text-gray-500">{audioRequests.length} demande(s)</span>
            </div>
            {historyLoading ? (
              <p className="text-sm text-gray-500">Chargement…</p>
            ) : audioRequests.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Aucune demande pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {audioRequests.map((req) => (
                  <div key={req.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-mauve">{req.chant?.nom_chant || "Piste audio"}</p>
                      {renderStatusBadge(req.statut)}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(req.date_creation).toLocaleDateString("fr-FR")}
                    </p>
                    {req.fichier_mp3_url ? (
                      <a
                        href={req.fichier_mp3_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 underline mt-1 block"
                      >
                        Fichier proposé
                      </a>
                    ) : (
                      <p className="text-sm text-gray-700 mt-1">Aucun fichier associé.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-mauve/30 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-mauve">Demandes de modification</h3>
              <span className="text-sm text-gray-500">{modRequests.length} demande(s)</span>
            </div>
            {historyLoading ? (
              <p className="text-sm text-gray-500">Chargement…</p>
            ) : modRequests.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Aucune demande pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {modRequests.map((req) => (
                  <div key={req.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-mauve">{req.nom_chant}</p>
                      {renderStatusBadge(req.statut)}
                    </div>
                    <p className="text-xs text-gray-500">
                      Chant original : {req.chant_nom}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(req.date_creation).toLocaleDateString("fr-FR")}
                    </p>
                    {req.description && (
                      <p className="text-sm text-gray-700 mt-1">{req.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
