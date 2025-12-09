import React, { useEffect, useState } from "react";

type Evenement = {
  id: number;
  nom_evenement: string;
  date_evenement: string;
  lieu: string;
  annonce_fil_actu: string;
  histoire: string;
};

const API_BASE_URL =
  import.meta.env.PUBLIC_API_URL ?? "http://100.72.62.18:8000";

export default function EvenementsTimeline() {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/evenements/`);
        if (!res.ok) throw new Error("Erreur lors du chargement");

        const data: Evenement[] = await res.json();
        const sorted = [...data].sort(
          (a, b) =>
            new Date(a.date_evenement).getTime() -
            new Date(b.date_evenement).getTime()
        );
        setEvenements(sorted);
      } catch (err: any) {
        setError(err.message ?? "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <p className="text-gray-600">Chargement…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (evenements.length === 0)
    return <p className="text-gray-600">Aucun évènement.</p>;

  return (
    <div className="relative mx-auto max-w-3xl">
      {/* ligne verticale */}
      <div className="absolute left-4 top-0 h-full w-px bg-mauve/30 md:left-1/2" />

      <div className="space-y-8">
        {evenements.map((e, index) => {
          const dateObj = new Date(e.date_evenement);
          const dateLabel = dateObj.toLocaleDateString("fr-BE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

          const isLeft = index % 2 === 0;

          return (
            <div
              key={e.id}
              className="relative flex flex-col md:flex-row"
            >
              {/* point sur la ligne */}
              <div className="absolute left-4 top-2 h-3 w-3 -translate-x-1/2 rounded-full bg-mauve md:left-1/2" />

              <div
                className={`mt-0 w-full md:w-1/2 ${
                  isLeft ? "md:pr-8 md:text-right" : "md:ml-auto md:pl-8"
                }`}
              >
                <div className="ml-10 rounded-xl bg-white p-4 shadow md:ml-0">
                  <p className="text-xs font-semibold uppercase text-mauve">
                    {dateLabel} — {e.lieu}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-gray-900">
                    {e.nom_evenement}
                  </h3>

                  {e.annonce_fil_actu.trim() !== "" && (
                    <p className="mt-1 text-sm text-gray-700 line-clamp-3">
                      {e.annonce_fil_actu}
                    </p>
                  )}

                  <a
                    href={`/evenements/${e.id}`}
                    className="mt-2 inline-flex items-center rounded-full border border-mauve px-3 py-1 text-xs font-semibold text-mauve hover:bg-mauve/10"
                  >
                    Voir l’évènement
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
