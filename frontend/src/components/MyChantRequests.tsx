import React, { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

type ChantRequest = {
  id: number;
  nom_chant: string;
  auteur: string;
  ville_origine: string;
  description: string;
  categories: string[];
  statut: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE";
  justification_refus?: string | null;
  date_creation: string;
  date_decision?: string | null;
};

const API_DEMANDES = "/api/demandes-chants/";

export default function MyChantRequests() {
  const [requests, setRequests] = useState<ChantRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const load = async () => {
    const email = localStorage.getItem("email");
    setUserEmail(email);
    if (!email) {
      setLoading(false);
      setRequests([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiUrl(API_DEMANDES), {
        headers: { "X-User-Email": email },
      });
      if (!res.ok) {
        throw new Error("Impossible de récupérer tes demandes.");
      }
      const data = await res.json();
      setRequests(data);
    } catch (e: any) {
      setError(e?.message ?? "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const statusLabel: Record<ChantRequest["statut"], string> = {
    EN_ATTENTE: "En attente",
    ACCEPTEE: "Acceptée",
    REFUSEE: "Refusée",
  };

  const statusClass: Record<ChantRequest["statut"], string> = {
    EN_ATTENTE: "bg-yellow-100 text-yellow-800",
    ACCEPTEE: "bg-green-100 text-green-700",
    REFUSEE: "bg-red-100 text-red-700",
  };

  if (!userEmail) {
    return (
      <div className="px-6 py-10 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-mauve mb-4">Mes demandes</h1>
        <p className="text-gray-600">Connecte-toi pour voir l'historique de tes demandes.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-mauve">Mes demandes</h1>
          <p className="text-sm text-gray-500">
            Historique de tes propositions de chants et leurs statuts.
          </p>
        </div>
        <button
          onClick={load}
          className="btn"
        >
          Actualiser
        </button>
      </div>

      {loading && <p className="text-gray-600">Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && requests.length === 0 && (
        <p className="text-gray-500">
          Tu n'as pas encore soumis de demande. Utilise le bouton "+" sur la page des chants pour proposer un nouveau chant.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {requests.map((request) => (
          <article
            key={request.id}
            className="rounded-xl border border-mauve/40 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-mauve">
                {request.nom_chant}
              </h2>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass[request.statut]}`}
              >
                {statusLabel[request.statut]}
              </span>
            </div>

            <p className="text-sm text-gray-500">
              Envoyée le {new Date(request.date_creation).toLocaleDateString("fr-BE")}
              {request.date_decision
                ? ` · Décision le ${new Date(request.date_decision).toLocaleDateString("fr-BE")}`
                : ""}
            </p>

            {request.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {request.categories.map((cat) => (
                  <span key={cat} className="text-xs rounded-full bg-mauve/10 text-mauve px-3 py-1">
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {request.description && (
              <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">
                {request.description}
              </p>
            )}

            {request.statut === "REFUSEE" && request.justification_refus && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <p className="font-semibold">Justification du refus :</p>
                <p>{request.justification_refus}</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
