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
  const isFavori = favoris.some((f) => f.chant_id === chantId);

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
    const res = await fetch(API_FAVORIS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        utilisateur_id: USER_ID,
        chant_id: chantId,
        date_favori: new Date().toISOString().split("T")[0],
      }),
    });
    const newFav: Favori = await res.json();
    addFavoriForUser(USER_ID, newFav);
  };

  const remove = async () => {
    const fav = favoris.find((f) => f.chant_id === chantId);
    if (!fav) return;

    await fetch(`${API_FAVORIS}?id=${fav.id}`, { method: "DELETE" });
    removeFavoriForUser(fav.utilisateur_id, chantId);
  };

  return (
    <button
      onClick={isFavori ? remove : add}
      className="btn btn-ghost p-1"
    >
      {isFavori ? <HeartFull size={size} /> : <HeartEmpty size={size} />}
    </button>
  );
}
