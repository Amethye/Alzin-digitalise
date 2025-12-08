import React, { useEffect, useState } from "react";

type Chant = {
  id: number;
  nom_chant: string;
  auteur: string;
  ville_origine: string;
  paroles: string;
  description: string;
  categories: string[];
  pistes_audio: { id: number; fichier_mp3: string }[];
};

type Favori = {
  id: number;
  chant_id: number;
  utilisateur_id: number;
};

const API_CHANTS = "http://127.0.0.1:8000/api/chants/";
const API_FAVORIS = "http://127.0.0.1:8000/api/favoris/";

export default function ListeChants() {
  const [chants, setChants] = useState<Chant[]>([]);
  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [USER_ID, setUSER_ID] = useState<number | null>(null);

  const [search, setSearch] = useState("");

  // Charger chants + favoris
  const loadData = async (userId: number | null) => {
    const resChants = await fetch(API_CHANTS);
    const dataChants = await resChants.json();
    setChants(dataChants);

    if (userId) {
      const resFav = await fetch(`${API_FAVORIS}?utilisateur_id=${userId}`);
      const dataFav = await resFav.json();
      setFavoris(dataFav);
    }
  };

  useEffect(() => {
    const storageId = localStorage.getItem("utilisateur_id");
    const parsed = storageId && !isNaN(Number(storageId)) ? Number(storageId) : null;

    console.log("ID utilisateur récupéré :", parsed);
    setUSER_ID(parsed);
    loadData(parsed);
  }, []);

  const isFavoris = (chantId: number) =>
    favoris.some((f) => f.chant_id === chantId && f.utilisateur_id === USER_ID);

  const addFavori = async (chantId: number) => {
    if (!USER_ID) return;
    await fetch(API_FAVORIS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        utilisateur_id: USER_ID,
        chant_id: chantId,
        date_favori: new Date().toISOString().split("T")[0],
      }),
    });
    loadData(USER_ID);
  };

  const removeFavori = async (chantId: number) => {
    const fav = favoris.find(
      (f) => f.chant_id === chantId && f.utilisateur_id === USER_ID
    );
    if (!fav) return;

    await fetch(`${API_FAVORIS}?id=${fav.id}`, { method: "DELETE" });
    loadData(USER_ID);
  };

  const toggleFavori = (chantId: number) => {
    if (!USER_ID) return;
    if (isFavoris(chantId)) removeFavori(chantId);
    else addFavori(chantId);
  };

  // ----------------------
  //    RECHERCHE
  // ----------------------
  const filteredChants = chants.filter((c) =>
    `${c.nom_chant} ${c.auteur} ${c.ville_origine}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ----------------------
  //   GROUPER PAR CAT
  // ----------------------
  const categoriesMap: Record<string, Chant[]> = {};

  filteredChants.forEach((chant) => {
    const chantCats = chant.categories.length > 0 ? chant.categories : ["Autre"];

    chantCats.forEach((cat) => {
      if (!categoriesMap[cat]) categoriesMap[cat] = [];
      categoriesMap[cat].push(chant);
    });
  });

  return (
    <div className="px-10 py-10 flex flex-col gap-10 w-full">

      <h1 className="text-3xl font-bold text-mauve">Chants classés par catégorie</h1>

      {/* Recherche */}
      <input
        type="text"
        placeholder="Rechercher un chant..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-mauve/40 p-3 rounded-lg w-full max-w-md"
      />

      {/* AFFICHAGE PAR CATÉGORIE */}
      {Object.keys(categoriesMap)
        .sort((a, b) => a.localeCompare(b, "fr"))
        .map((cat) => (
          <div key={cat} className="w-full">
            <h2 className="text-2xl font-bold text-mauve mt-6 mb-3">{cat}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {categoriesMap[cat].map((ch) => (
                <div
                  key={ch.id}
                  className="border border-mauve/30 rounded-xl p-5 shadow bg-white"
                >
                  {/* HEADER */}
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-mauve">{ch.nom_chant}</h3>

                    {USER_ID && (
                      <button
                        onClick={() => toggleFavori(ch.id)}
                        className="text-3xl"
                      >
                        {isFavoris(ch.id) ? (
                          <span className="text-mauve">❤️</span>
                        ) : (
                          <span className="text-mauve/30">♡</span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Auteur */}
                  {ch.auteur && (
                    <p className="mt-2 text-gray-600">
                      <strong>Auteur :</strong> {ch.auteur}
                    </p>
                  )}

                  {/* Audio */}
                  {ch.pistes_audio.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {ch.pistes_audio.map((p) => (
                        <audio key={p.id} controls className="w-full">
                          <source src={p.fichier_mp3} type="audio/mpeg" />
                        </audio>
                      ))}
                    </div>
                  )}

                  {/* Paroles */}
                  <button
                    onClick={() => alert(ch.paroles)}
                    className="mt-4 w-full bg-mauve text-white py-2 rounded-lg hover:bg-mauve/90"
                  >
                    Voir les paroles
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}