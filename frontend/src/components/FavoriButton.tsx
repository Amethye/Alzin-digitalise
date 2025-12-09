import React, { useEffect, useState } from "react";

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
  const [favoris, setFavoris] = useState<any[]>([]);
  const isFavori = favoris.some((f) => f.chant_id === chantId);

  useEffect(() => {
    if (!USER_ID) return;
    fetch(`${API_FAVORIS}?utilisateur_id=${USER_ID}`)
      .then((r) => r.json())
      .then(setFavoris);
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
    const newFav = await res.json();
    setFavoris((old) => [...old, newFav]);
  };

  const remove = async () => {
    const fav = favoris.find((f) => f.chant_id === chantId);
    if (!fav) return;

    await fetch(`${API_FAVORIS}?id=${fav.id}`, { method: "DELETE" });
    setFavoris((old) => old.filter((f) => f.id !== fav.id));
    
  };

  return (
    <button onClick={isFavori ? remove : add}>
      {isFavori ? <HeartFull size={size} /> : <HeartEmpty size={size} />}
    </button>
  );
}