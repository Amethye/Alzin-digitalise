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

// SVG cœur rempli
const HeartFull = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#8B5CF6">
    <path d="M12 21s-6.2-4.35-9.33-8.22C-1.28 8.39 1.02 3 5.6 3c2.2 0 4.14 1.22 5.4 3.09C12.26 4.22 14.2 3 16.4 3c4.58 0 6.88 5.39 2.93 9.78C18.2 16.65 12 21 12 21z" />
  </svg>
);

// SVG cœur vide
const HeartEmpty = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
    <path d="M12 21s-6.2-4.35-9.33-8.22C-1.28 8.39 1.02 3 5.6 3c2.2 0 4.14 1.22 5.4 3.09C12.26 4.22 14.2 3 16.4 3c4.58 0 6.88 5.39 2.93 9.78C18.2 16.65 12 21 12 21z" />
  </svg>
);

export default function ListeChants() {
  const [chants, setChants] = useState<Chant[]>([]);
  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [USER_ID, setUSER_ID] = useState<number | null>(null);
  const [loadedUser, setLoadedUser] = useState(false);

  // Recherche + filtre + pagination
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Toutes");
  const PER_PAGE = 12;
  const [page, setPage] = useState(1);

  // Charger données
  const loadData = async (userId: number | null) => {
    const resChants = await fetch(API_CHANTS);
    const data = await resChants.json();
    setChants(data);

    if (userId !== null) {
      const resFav = await fetch(`${API_FAVORIS}?utilisateur_id=${userId}`);
      setFavoris(await resFav.json());
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem("utilisateur_id");
    const parsed = raw && !isNaN(Number(raw)) ? Number(raw) : null;

    setUSER_ID(parsed);
    setLoadedUser(true);
    loadData(parsed);
  }, []);

  // Vérifier favoris
  const isFavoris = (chantId: number) =>
    favoris.some((f) => f.chant_id === chantId && f.utilisateur_id === USER_ID);

  // Ajouter / retirer favoris
  const addFavori = async (chantId: number) => {
    if (USER_ID === null) return;
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
    if (USER_ID === null) return;
    isFavoris(chantId) ? removeFavori(chantId) : addFavori(chantId);
  };

  //  RECHERCHE
  const searched = chants.filter((c) =>
    `${c.nom_chant} ${c.auteur} ${c.ville_origine}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );


  // FILTRE PAR CATÉGORIE
  const filtered = searched.filter((c) =>
    filterCat === "Toutes"
      ? true
      : (c.categories.length ? c.categories : ["Autre"]).includes(filterCat)
  );

  //  GROUPER PAR CATÉGORIE
  const categoriesMap: Record<string, Chant[]> = {};

  filtered.forEach((chant) => {
    const cats = chant.categories.length ? chant.categories : ["Autre"];
    cats.forEach((cat) => {
      if (!categoriesMap[cat]) categoriesMap[cat] = [];
      categoriesMap[cat].push(chant);
    });
  });


  // CATÉGORIES DISPONIBLES
  const allCategories = [
    "Toutes",
    ...Array.from(
      new Set(
        chants.flatMap((c) => (c.categories.length ? c.categories : ["Autre"]))
      )
    ).sort((a, b) => a.localeCompare(b, "fr")),
  ];

  return (
    <div className="px-10 py-10 flex flex-col gap-10 w-full">
      <h1 className="text-3xl font-bold text-mauve">Liste de chants</h1>

      {/* Recherche + filtre */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Rechercher un chant..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border border-mauve/40 p-3 rounded-lg flex-1"
        />

        <select
          value={filterCat}
          onChange={(e) => {
            setFilterCat(e.target.value);
            setPage(1);
          }}
          className="border border-mauve/40 p-3 rounded-lg w-full md:w-60"
        >
          {allCategories.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* AFFICHAGE GROUPÉ PAR CATÉGORIE */}
      {Object.keys(categoriesMap)
        .sort((a, b) => a.localeCompare(b, "fr"))
        .map((cat) => {
          const list = categoriesMap[cat].sort((a, b) =>
            a.nom_chant.localeCompare(b.nom_chant, "fr")
          );

          return (
            <div key={cat}>
              <h2 className="text-2xl font-bold text-mauve mt-6 mb-3">{cat}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {list.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => (window.location.href = `/chants/${ch.id}`)}
                    className="border border-mauve/30 rounded-xl p-5 shadow bg-white cursor-pointer hover:bg-mauve/5 transition"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-mauve">{ch.nom_chant}</h3>

                      {loadedUser && USER_ID !== null && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavori(ch.id);
                          }}
                        >
                          {isFavoris(ch.id) ? <HeartFull /> : <HeartEmpty />}
                        </button>
                      )}
                    </div>

                    {ch.auteur && (
                      <p className="mt-2 text-gray-600">
                        <strong>Auteur :</strong> {ch.auteur}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}