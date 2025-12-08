import React, { useEffect, useState } from "react";

type Evenement = {
  id: number;
  nom_evenement: string;
  date_evenement: string; // "YYYY-MM-DD"
  lieu: string;
  annonce_fil_actu: string; // possiblement ""
  histoire: string;        // possiblement ""
};

const API_BASE_URL =
  import.meta.env.PUBLIC_API_URL ?? "http://127.0.0.1:8000";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvenements = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/evenements/`);
      if (!res.ok) {
        throw new Error("Erreur lors du chargement des évènements");
      }

      const data: Evenement[] = await res.json();
      setEvenements(data);
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

  if (loading) {
    return <p className="text-gray-600">Chargement des évènements…</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (evenements.length === 0) {
    return <p className="text-gray-600">Aucun évènement pour le moment.</p>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-mauve">À venir</h2>
          <div className="space-y-4">
            {upcoming.map((e) => (
              <article
                key={e.id}
                className="flex flex-col gap-2 rounded-xl border border-mauve/30 bg-white p-4 shadow"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold text-mauve">
                    {e.nom_evenement}
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-mauve/10 px-3 py-1 text-xs font-medium text-mauve">
                    {formatDate(e.date_evenement)} • {e.lieu}
                  </span>
                </div>

                {e.annonce_fil_actu.trim() !== "" && (
                  <p className="text-sm text-gray-700">
                    {e.annonce_fil_actu}
                  </p>
                )}

                {e.histoire.trim() !== "" && (
                  <details className="mt-1 text-sm text-gray-700">
                    <summary className="cursor-pointer font-medium text-mauve">
                      Voir le récit
                    </summary>
                    <p className="mt-1 whitespace-pre-line">{e.histoire}</p>
                  </details>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-mauve">
            Évènements passés
          </h2>
          <div className="space-y-4">
            {past.map((e) => (
              <article
                key={e.id}
                className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm opacity-90"
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
                  <p className="text-sm text-gray-600">
                    {e.annonce_fil_actu}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
