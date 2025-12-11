import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

interface RatingProps {
  pisteId: number;
  userId: number;
  onStatsChange?: (stats: { average: number; total: number }) => void;
  initialAverage?: number;
  initialCount?: number;
}

const ensureNumber = (value: number | undefined | null) =>
  typeof value === "number" && !Number.isNaN(value) ? value : 0;

const clampCount = (value: number | undefined | null) =>
  Math.max(0, Math.floor(ensureNumber(value)));

const computeAfterRating = (
  currentStats: { average: number; total: number },
  previousRating: number | null,
  value: number
) => {
  const { average, total } = currentStats;
  const sum = average * total;

  if (previousRating === null) {
    const newTotal = total + 1;
    return {
      average: newTotal === 0 ? 0 : (sum + value) / newTotal,
      total: newTotal,
    };
  }

  if (value === previousRating) {
    return currentStats;
  }

  return {
    average: total === 0 ? value : (sum - previousRating + value) / total,
    total,
  };
};

const computeAfterRemoval = (
  currentStats: { average: number; total: number },
  previousRating: number | null
) => {
  if (previousRating === null) {
    return currentStats;
  }
  const { average, total } = currentStats;
  if (total <= 1) {
    return { average: 0, total: 0 };
  }
  const newTotal = total - 1;
  const sum = average * total;
  return {
    average: newTotal === 0 ? 0 : (sum - previousRating) / newTotal,
    total: newTotal,
  };
};

export default function RatingStars({
  pisteId,
  userId,
  onStatsChange,
  initialAverage = 0,
  initialCount = 0,
}: RatingProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [noteId, setNoteId] = useState<number | null>(null);
  const [stats, setStats] = useState({
    average: ensureNumber(initialAverage),
    total: clampCount(initialCount),
  });

  const refreshStats = useCallback(async () => {
    if (!userId) return;

    const res = await fetch(apiUrl(`/api/noter/?piste_id=${pisteId}`));
    if (!res.ok) return;

    const data = await res.json();
    const averageValue = ensureNumber(data.moyenne);
    const totalValue = clampCount(data.nb_notes);

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

    const nextStats = {
      average: averageValue,
      total: totalValue,
    };
    setStats(nextStats);
    onStatsChange?.(nextStats);
  }, [pisteId, userId, onStatsChange]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    setStats({
      average: ensureNumber(initialAverage),
      total: clampCount(initialCount),
    });
  }, [initialAverage, initialCount]);

  const handleRate = async (value: number) => {
    if (!userId) return;
    const updatedStats = computeAfterRating(stats, rating, value);
    setRating(value);
    setStats(updatedStats);
    onStatsChange?.(updatedStats);

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
    const updatedStats = computeAfterRemoval(stats, rating);
    setRating(null);
    setNoteId(null);
    setStats(updatedStats);
    onStatsChange?.(updatedStats);

    await fetch(apiUrl(`/api/noter/${noteId}/`), {
      method: "DELETE",
    });

    await refreshStats();
  };

  return (
    <div className="flex items-center gap-3 mt-2">
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

      {rating !== null && (
        <button
          onClick={handleRemove}
          className="btn btn-ghost h-6 w-6 p-0 text-base"
          title="Supprimer ma note"
          aria-label="Supprimer ma note"
        >
          ×
        </button>
      )}
    </div>
  );
}
