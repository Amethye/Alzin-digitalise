import React, { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";
import FavoriButton from "./FavoriButton";

type Evenement = {
  id: number;
  nom_evenement: string;
  date_evenement: string;
  lieu: string;
  annonce_fil_actu: string;
  histoire: string;
  chants?: ChantSummary[];
};

type ChantSummary = {
  id: number;
  nom_chant: string;
  auteur: string | null;
  description: string | null;
  categories: string[];
  illustration_chant_url?: string | null;
};

export default function EvenementDetail({ id }: { id: number }) {
  const [event, setEvent] = useState<Evenement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [USER_ID, setUSER_ID] = useState<number | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem("utilisateur_id");
    if (storedId) {
      setUSER_ID(Number(storedId));
    }

    const load = async () => {
      try {
        const res = await fetch(apiUrl(`/api/evenements/${id}/`));
        if (!res.ok) throw new Error("Évènement introuvable");

        const data = await res.json();
        setEvent(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!event) return null;

  const date = new Date(event.date_evenement).toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const chants = event.chants ?? [];

  return (
    <article className="w-full mx-auto flex flex-col gap-4 bg-bordeau/10 p-6 shadow rounded-xl">
      <h1 className="text-3xl font-bold text-bordeau">{event.nom_evenement}</h1>

      <p className="text-gray-700 text-sm">
        {date} — <span className="font-semibold">{event.lieu}</span>
      </p>

      {event.annonce_fil_actu && (
        <p className="text-gray-800">{event.annonce_fil_actu}</p>
      )}

      {event.histoire && (
        <section>
          <h2 className="text-xl font-semibold text-bordeau mt-2">Histoire</h2>
          <p className="whitespace-pre-line text-gray-700">{event.histoire}</p>
        </section>
      )}

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-bordeau">Chants de l'évènement/h2>
          <span className="text-sm text-gray-500">
            {chants.length} chant{chants.length > 1 ? "s" : ""}
          </span>
        </div>
        {chants.length === 0 ? (
          <p className="mt-2 text-gray-600">
            Aucun chant n'a encore été associé à cet événement.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {chants.map((chant) => (
              <article
                key={chant.id}
                className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm transition hover:border-bordeau/60"
              >
                {chant.illustration_chant_url && (
                  <img
                    src={chant.illustration_chant_url}
                    alt={chant.nom_chant}
                    className="h-20 w-20 flex-none rounded-lg object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col gap-1">
                  <a
                    href={`/chants/${chant.id}`}
                    className="text-lg font-semibold text-bordeau transition hover:text-bordeau/70"
                  >
                    {chant.nom_chant}
                  </a>
                  <p className="text-sm text-gray-600">
                    {chant.auteur ? `Auteur · ${chant.auteur}` : "Auteur inconnu"}
                  </p>
                  {chant.description && (
                    <p className="text-sm text-gray-500">{chant.description}</p>
                  )}
                  {chant.categories?.length ? (
                    <div className="flex flex-wrap gap-2 text-[0.65rem] font-semibold uppercase tracking-wide text-bordeau/70">
                      {chant.categories.map((category) => (
                        <span
                          key={`${chant.id}-${category}`}
                          className="rounded-full border border-bordeau/40 bg-bordeau/5 px-2 py-1"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="self-start">
                  <FavoriButton chantId={chant.id} USER_ID={USER_ID} size={30} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <a
        href="/events"
        className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-bordeau px-4 py-1.5 text-xs font-semibold text-bordeau hover:bg-bordeau/10"
      >
        <span aria-hidden>←</span>
        Retour aux évènements
      </a>
    </article>
  );
}
