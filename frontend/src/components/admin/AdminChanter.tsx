import React, { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";
import DeleteButton from "../DeleteButton";

type ChanterRow = {
  id: number;
  chant_id: number;
  evenement_id: number;
  chant_nom?: string;
  evenement_nom?: string;
  date_evenement?: string;
};

type Chant = {
  id: number;
  nom_chant: string;
};

type Evenement = {
  id: number;
  nom_evenement: string;
  date_evenement: string; // ISO string
};

const API_CHANTER = "/api/chanter/";
const API_CHANTS = "/api/chants/";
const API_EVENTS = "/api/evenements/";

export default function AdminChanter() {
  const [links, setLinks] = useState<ChanterRow[]>([]);
  const [chants, setChants] = useState<Chant[]>([]);
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [selectedChantId, setSelectedChantId] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resLinks, resChants, resEvents] = await Promise.all([
        fetch(apiUrl(API_CHANTER)),
        fetch(apiUrl(API_CHANTS)),
        fetch(apiUrl(API_EVENTS)),
      ]);

      if (!resLinks.ok || !resChants.ok || !resEvents.ok) {
        throw new Error("Impossible de charger les données.");
      }

      const dataLinks: ChanterRow[] = await resLinks.json();
      const dataChants: Chant[] = await resChants.json();
      const dataEvents: Evenement[] = await resEvents.json();

      setLinks(dataLinks);
      setChants(dataChants);
      setEvenements(dataEvents);
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedChantId || !selectedEventId) {
      alert("Choisis un chant et un évènement.");
      return;
    }

    const payload = {
      chant_id: Number(selectedChantId),
      evenement_id: Number(selectedEventId),
    };

    try {
      const res = await fetch(apiUrl(API_CHANTER), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Impossible d'ajouter le lien.");
      }

      await loadAll();
      setSelectedChantId("");
      setSelectedEventId("");
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de l'ajout.");
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("fr-BE");
  };

  const getChantName = (id: number) =>
    chants.find((c) => c.id === id)?.nom_chant ?? `Chant #${id}`;

  const getEventLabel = (id: number) => {
    const ev = evenements.find((e) => e.id === id);
    if (!ev) return `Évènement #${id}`;
    return `${ev.nom_evenement} (${formatDate(ev.date_evenement)})`;
  };

  return (
    <section className="w-full max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-mauve">
        Lier les chants aux évènements
      </h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Formulaire d'ajout */}
      <form
        onSubmit={handleAdd}
        className="rounded-2xl bg-white p-6 shadow-md border border-gray-100 space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-800">
          Ajouter un lien chant ↔ évènement
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Évènement
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-mauve/40"
            >
              <option value="">Sélectionne un évènement</option>
              {evenements
                .slice()
                .sort((a, b) =>
                  a.date_evenement.localeCompare(b.date_evenement)
                )
                .map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nom_evenement} — {formatDate(ev.date_evenement)}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Chant</label>
            <select
              value={selectedChantId}
              onChange={(e) => setSelectedChantId(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-mauve/40"
            >
              <option value="">Sélectionne un chant</option>
              {chants
                .slice()
                .sort((a, b) => a.nom_chant.localeCompare(b.nom_chant))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom_chant}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-mauve px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-600"
          >
            Ajouter
          </button>
        </div>
      </form>

      {/* Liste des liens */}
      <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-100">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Liens existants
        </h2>

        {loading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : links.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucun lien chant-évènement pour l’instant.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="px-4 py-2">Évènement</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Chant</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((l) => {
                  const ev = evenements.find((e) => e.id === l.evenement_id);
                  const evDate = ev?.date_evenement ?? l.date_evenement;
                  return (
                    <tr
                      key={l.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-2">
                        {l.evenement_nom ?? getEventLabel(l.evenement_id)}
                      </td>
                      <td className="px-4 py-2">
                        {formatDate(evDate ?? undefined)}
                      </td>
                      <td className="px-4 py-2">
                        {l.chant_nom ?? getChantName(l.chant_id)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end">
                          <DeleteButton
                            endpoint={`${API_CHANTER}${l.id}/`}
                            confirmMessage="Supprimer ce lien chant-évènement ?"
                            onSuccess={loadAll}
                            onError={(message) => setError(message)}
                            className="px-3 py-1 text-xs"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
