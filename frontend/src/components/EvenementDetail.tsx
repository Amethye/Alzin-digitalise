import React, { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

type Evenement = {
  id: number;
  nom_evenement: string;
  date_evenement: string;
  lieu: string;
  annonce_fil_actu: string;
  histoire: string;
};

export default function EvenementDetail({ id }: { id: number }) {
  const [event, setEvent] = useState<Evenement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  return (
    <article className="max-w-3xl mx-auto flex flex-col gap-4 bg-white p-6 shadow rounded-xl">
      <h1 className="text-3xl font-bold text-mauve">{event.nom_evenement}</h1>

      <p className="text-gray-700 text-sm">
        {date} — <span className="font-semibold">{event.lieu}</span>
      </p>

      {event.annonce_fil_actu && (
        <p className="text-gray-800">{event.annonce_fil_actu}</p>
      )}

      {event.histoire && (
        <section>
          <h2 className="text-xl font-semibold text-mauve mt-2">Histoire</h2>
          <p className="whitespace-pre-line text-gray-700">{event.histoire}</p>
        </section>
      )}

      <a
        href="/events"
        className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-mauve px-4 py-1.5 text-xs font-semibold text-mauve hover:bg-mauve/10"
      >
        <span aria-hidden>←</span>
        Retour aux évènements
      </a>
    </article>
  );
}
