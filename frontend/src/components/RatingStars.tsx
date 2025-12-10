import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

interface RatingProps {
  pisteId: number;
  userId: number;
  onStatsChange?: (stats: { average: number; total: number }) => void;
}

export default function RatingStars({ pisteId, userId, onStatsChange }: RatingProps) {
  const [rating, setRating] = useState<number | null>(null);     // note utilisateur
  const [noteId, setNoteId] = useState<number | null>(null);     // id de la note utilisateur

  const refreshStats = useCallback(async () => {
    if (!userId) return;

    const res = await fetch(apiUrl(`/api/noter/?piste_id=${pisteId}`));
    if (!res.ok) return;

    const data = await res.json();
    const averageValue = typeof data.moyenne === "number" ? data.moyenne : 0;
    const totalValue = typeof data.nb_notes === "number" ? data.nb_notes : 0;

    const my = Array.isArray(data.notes)
      ? data.notes.find((n: any) => n.utilisateur_id === userId)
      : null;

    if (my) {
      setRating(my.valeur_note);
      setNoteId(my.id);
    } else {
      setRating(null);
      setNoteId(null);
    }

    onStatsChange?.({ average: averageValue, total: totalValue });
  }, [pisteId, userId, onStatsChange]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);



  const handleRate = async (value: number) => {
    if (!userId) return;
    setRating(value);

    await fetch(apiUrl("/api/noter/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        utilisateur_id: userId,
        piste_audio_id: pisteId,
        valeur_note: value,
      }),
    });

    await refreshStats();
  };

  const handleRemove = async () => {
    if (!noteId) return;

    await fetch(apiUrl(`/api/noter/${noteId}/`), {
      method: "DELETE",
    });

    await refreshStats();
  };

  return (
    <div className="flex items-center gap-3 mt-2">

      {/* ⭐ Étoiles */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((v) => (
          <span
            key={v}
            className={`cursor-pointer text-2xl transition ${
              rating !== null && v <= rating
                ? "text-yellow-400"
                : "text-gray-400"
            }`}
            onClick={() => handleRate(v)}
          >
            ★
          </span>
        ))}
      </div>

      {/* Supprimer ma note */}
      {rating !== null && (
        <button
          onClick={handleRemove}
          className="w-6 h-6 flex items-center justify-center rounded-full border border-mauve/40 text-mauve text-sm font-bold hover:bg-mauve/10 transition"
          title="Supprimer ma note"
          aria-label="Supprimer ma note"
        >
          ×
        </button>
      )}
    </div>
  );
}
