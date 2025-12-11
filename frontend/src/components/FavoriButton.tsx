import React, { useEffect, useState } from "react";
import {
  addFavoriForUser,
  hasFavorisForUser,
  removeFavoriForUser,
  setFavorisForUser,
  subscribeToFavoris,
  type Favori,
} from "../lib/favorisStore";

const API_FAVORIS = "/api/favoris/";

const HeartFull = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#8B5CF6">
    <path d="M12 21s-6.2-4.35-9.33-8.22C-1.28 8.39 1.02 3 5.6 3c2.2 0 4.14 1.22 5.4 3.09C12.26 4.22 14.2 3 16.4 3c4.58 0 6.88 5.39 2.93 9.78C18.2 16.65 12 21 12 21z"/>
  </svg>
);

const HeartEmpty = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
    <path d="M12 21s-6.2-4.35-9.33-8.22C-1.28 8.39 1.02 3 5.6 3c2.2 0 4.14 1.22 5.4 3.09C12.26 4.22 14.2 3 16.4 3c4.58 0 6.88 5.39 2.93 9.78C18.2 16.65 12 21 12 21z"/>
  </svg>
);

export default function FavoriButton({
  chantId,
  USER_ID,
  size = 34,
}: {
  chantId: number;
  USER_ID: number | null;
  size?: number;
}) {
  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [processing, setProcessing] = useState(false);
  const isFavori = favoris.some((f) => f.chant_id === chantId);
  const displayedFavori = optimistic ?? isFavori;

  useEffect(() => {
    if (!USER_ID) return;
    const unsubscribe = subscribeToFavoris(USER_ID, setFavoris);

    if (!hasFavorisForUser(USER_ID)) {
      fetch(`${API_FAVORIS}?utilisateur_id=${USER_ID}`)
        .then((r) => r.json())
        .then((data) => setFavorisForUser(USER_ID, data));
    }

    return () => unsubscribe();
  }, [USER_ID]);

  const add = async () => {
    if (!USER_ID) return;
    setOptimistic(true);
    setProcessing(true);
    const optimisticDate = new Date().toISOString().split("T")[0];
    const optimisticFav: Favori = {
      id: -Date.now(),
      utilisateur_id: USER_ID,
      chant_id: chantId,
      date_favori: optimisticDate,
    };
    addFavoriForUser(USER_ID, optimisticFav);
    try {
      const res = await fetch(API_FAVORIS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utilisateur_id: USER_ID,
          chant_id: chantId,
          date_favori: optimisticDate,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.error) {
        throw new Error(payload.error || "Impossible d’ajouter ce favori.");
      }
      const newFav: Favori = payload;
      addFavoriForUser(USER_ID, newFav);
    } catch (err: any) {
      removeFavoriForUser(USER_ID, chantId);
      alert(err?.message || "Impossible d’ajouter ce favori.");
    } finally {
      setProcessing(false);
      setOptimistic(null);
    }
  };

  const remove = async () => {
    const fav = favoris.find((f) => f.chant_id === chantId);
    if (!fav || !USER_ID) return;
    removeFavoriForUser(USER_ID, chantId);
    setOptimistic(false);
    setProcessing(true);
    try {
      const res = await fetch(`${API_FAVORIS}?id=${fav.id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.error) {
        throw new Error(payload.error || "Impossible de retirer ce favori.");
      }
    } catch (err: any) {
      addFavoriForUser(USER_ID, fav);
      alert(err?.message || "Impossible de retirer ce favori.");
    } finally {
      setProcessing(false);
      setOptimistic(null);
    }
  };

  return (
    <button
      onClick={displayedFavori ? remove : add}
      className="btn btn-ghost p-1"
      disabled={processing}
    >
      {displayedFavori ? <HeartFull size={size} /> : <HeartEmpty size={size} />}
    </button>
  );
}
