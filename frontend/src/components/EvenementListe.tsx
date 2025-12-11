import React, { useEffect, useState } from "react";

type Evenement = {
  id: number;
  nom_evenement: string;
  date_evenement: string; // "YYYY-MM-DD"
  lieu: string;
  annonce_fil_actu: string; // possiblement ""
  histoire: string;        // possiblement ""
};

type Chant = { id: number; nom_chant: string };
type ChanterLink = { id: number; chant_id: number; evenement_id: number };

const API_EVENT = "/api/evenements/";
const API_CHANTER = "/api/chanter/";
const API_CHANTS = "/api/chants/";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  return d.toLocaleDateString("fr-BE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function normalizeDate(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function EvenementsList() {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [chantsByEvent, setChantsByEvent] = useState<Record<number, { id: number; nom: string }[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvenements = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resEvents, resLinks, resChants] = await Promise.all([
        fetch(API_EVENT),
        fetch(API_CHANTER),
        fetch(API_CHANTS),
      ]);

      if (!resEvents.ok || !resLinks.ok || !resChants.ok) {
        throw new Error("Erreur lors du chargement des évènements ou des chants");
      }

      const events: Evenement[] = await resEvents.json();
      const links: ChanterLink[] = await resLinks.json();
      const chants: Chant[] = await resChants.json();

      const chantNames = new Map<number, string>(chants.map((c) => [c.id, c.nom_chant]));

      const grouped: Record<number, { id: number; nom: string }[]> = {};
      links.forEach((l) => {
        if (!grouped[l.evenement_id]) grouped[l.evenement_id] = [];
        grouped[l.evenement_id].push({
          id: l.chant_id,
          nom: chantNames.get(l.chant_id) ?? `Chant #${l.chant_id}`,
        });
      });

      setEvenements(events);
      setChantsByEvent(grouped);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvenements();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = evenements
    .filter((e) => normalizeDate(e.date_evenement) >= today)
    .sort(
      (a, b) =>
        normalizeDate(a.date_evenement).getTime() -
        normalizeDate(b.date_evenement).getTime()
    );

  const past = evenements
    .filter((e) => normalizeDate(e.date_evenement) < today)
    .sort(
      (a, b) =>
        normalizeDate(b.date_evenement).getTime() -
        normalizeDate(a.date_evenement).getTime()
    );

  if (loading) return <p className="text-gray-600">Chargement des évènements…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (evenements.length === 0) return <p className="text-gray-600">Aucun évènement pour le moment.</p>;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-bordeau">À venir</h2>
          <div className="space-y-4">
            {upcoming.map((e) => (
              <a
                key={e.id}
                href={`/evenements/${e.id}`}
                className="block rounded-xl border border-bordeau/30 bg-white p-4 shadow hover:shadow-md transition"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold text-bordeau">
                    {e.nom_evenement}
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-bordeau/10 px-3 py-1 text-xs font-medium text-bordeau">
                    {formatDate(e.date_evenement)} • {e.lieu}
                  </span>
                </div>

                {e.annonce_fil_actu.trim() !== "" && (
                  <p className="text-sm text-gray-700">{e.annonce_fil_actu}</p>
                )}

                {chantsByEvent[e.id]?.length ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-semibold text-bordeau">Chants prévus :</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {chantsByEvent[e.id].map((c) => (
                        <li key={c.id}>{c.nom}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {e.histoire.trim() !== "" && (
                  <details className="mt-1 text-sm text-gray-700">
                    <summary className="cursor-pointer font-medium text-bordeau">
                      Voir le récit
                    </summary>
                    <p className="mt-1 whitespace-pre-line">{e.histoire}</p>
                  </details>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-bordeau">Évènements passés</h2>
          <div className="space-y-4">
            {past.map((e) => (
              <a
                key={e.id}
                href={`/evenements/${e.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow transition"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {e.nom_evenement}
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {formatDate(e.date_evenement)} • {e.lieu}
                  </span>
                </div>

                {e.histoire.trim() !== "" ? (
                  <p className="line-clamp-3 whitespace-pre-line text-sm text-gray-700">
                    {e.histoire}
                  </p>
                ) : e.annonce_fil_actu.trim() !== "" ? (
                  <p className="text-sm text-gray-600">{e.annonce_fil_actu}</p>
                ) : null}

                {chantsByEvent[e.id]?.length ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-semibold text-gray-800">Chants associés :</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {chantsByEvent[e.id].map((c) => (
                        <li key={c.id}>{c.nom}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

