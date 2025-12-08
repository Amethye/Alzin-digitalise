import React, { useEffect, useState } from "react";

type Chant = {
  id: number;
  nom_chant: string;
  auteur: string;
  illustration_chant_url?: string;
  categories: string[];
  pistes_audio: {
    id: number;
    fichier_mp3: string;
  }[];
};

type Favori = {
  id: number;
  utilisateur_id: number;
  chant_id: number;
};

const API_CHANTS = "http://127.0.0.1:8000/api/chants/";
const API_FAVORIS = "http://127.0.0.1:8000/api/favoris/";

export default function FavorisPage() {
  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [chants, setChants] = useState<Chant[]>([]);
  const [loading, setLoading] = useState(true);

  const USER_ID = Number(localStorage.getItem("utilisateur_id"));

  const loadData = async () => {
    setLoading(true);

    // chargement des favoris de l'utilisateur
    const resFav = await fetch(`${API_FAVORIS}?utilisateur_id=${USER_ID}`);
    const favData = await resFav.json();
    setFavoris(favData);

    // chargement de tous les chants
    const resChants = await fetch(API_CHANTS);
    const chantData = await resChants.json();

    // filtrer seulement ceux en favoris
    const favorisChants = chantData.filter((c: Chant) =>
      favData.some((f: Favori) => f.chant_id === c.id)
    );

    setChants(favorisChants);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // retirer un favoris
  const removeFavori = async (chantId: number) => {
    const fav = favoris.find(f => f.chant_id === chantId && f.utilisateur_id === USER_ID);
    if (!fav) return;

    await fetch(`${API_FAVORIS}?id=${fav.id}`, {
      method: "DELETE",
    });

    loadData();
  };

  if (!USER_ID)
    return (
      <p className="text-center text-gray-500 text-lg mt-10">
        Vous devez être connecté pour voir vos favoris ❤️
      </p>
    );

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Chargement...</p>;

  return (
    <div className="px-10 py-10 flex flex-col gap-8 w-full">
      <h1 className="text-3xl font-bold text-mauve">Mes favoris ❤️</h1>

      {chants.length === 0 && (
        <p className="text-gray-500 text-lg mt-10">
          Aucun chant en favoris pour l’instant.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
        {chants.map(ch => (
          <div
            key={ch.id}
            className="border border-mauve/30 rounded-xl p-5 shadow bg-white w-full"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-mauve">{ch.nom_chant}</h2>

              {/* ❤️ bouton favoris */}
              <button
                onClick={() => removeFavori(ch.id)}
                className="text-3xl transition"
              >
                <span className="text-mauve">❤️</span>
              </button>
            </div>

            {/* Illustration */}
            {ch.illustration_chant_url && (
              <img
                src={ch.illustration_chant_url}
                className="mt-3 w-full h-48 object-cover rounded-lg shadow"
              />
            )}

            {/* Auteur */}
            {ch.auteur && (
              <p className="mt-3 text-gray-700">
                <strong>Auteur : </strong> {ch.auteur}
              </p>
            )}

            {/* Catégories */}
            {ch.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {ch.categories.map(cat => (
                  <span
                    key={cat}
                    className="px-3 py-1 bg-mauve/10 text-mauve rounded-full text-sm"
                  >
                    {cat}
        c features like a vertical panel and a "+" button. To respect the existing style, I'l          </span>
                ))}
              </div>
            )}

            {/* Audio */}
            {ch.pistes_audio.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {ch.pistes_audio.map(p => (
                  <audio key={p.id} controls className="w-full">
                    <source src={p.fichier_mp3} type="audio/mpeg" />
                  </audio>
                ))}
              </div>
            )}

            <a
              href={`/chants/${ch.id}`}
              className="mt-4 block w-full bg-mauve text-white text-center py-2 rounded-lg hover:bg-mauve/90"
            >
              Voir le chant
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}