import React, { useEffect, useState } from "react";
import FavoriButton from "@components/FavoriButton";

type Chant = {
  id: number;
  nom_chant: string;
  auteur: string;
  illustration_chant_url?: string;
  categories: string[];
  pistes_audio: { id: number; fichier_mp3: string }[];
};

type Favori = {
  id: number;
  utilisateur_id: number;
  chant_id: number;
};

const API_CHANTS = "http://100.72.62.18:8000/api/chants/";
const API_FAVORIS = "http://100.72.62.18:8000/api/favoris/";

export default function FavorisPage() {
  const [USER_ID, setUSER_ID] = useState<number | null>(null);
  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [chants, setChants] = useState<Chant[]>([]);
  const [loading, setLoading] = useState(true);

  // Recherche + filtre catégorie + pagination
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Toutes");

  const PER_PAGE = 9;
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handler = () => window.location.reload();
    window.addEventListener("favoriUpdated", handler);
    return () => window.removeEventListener("favoriUpdated", handler);
  }, []);

  // Charger utilisateur
  useEffect(() => {
    const id = localStorage.getItem("utilisateur_id");
    if (id) setUSER_ID(Number(id));
  }, []);

  // Charger favoris + chants
  useEffect(() => {
    if (!USER_ID) return;

    const load = async () => {
      setLoading(true);

      const resFav = await fetch(`${API_FAVORIS}?utilisateur_id=${USER_ID}`);
      const favData = await resFav.json();
      setFavoris(favData);

      const resChants = await fetch(API_CHANTS);
      const allChants = await resChants.json();

      const favChants = allChants.filter((c: Chant) =>
        favData.some((f: Favori) => f.chant_id === c.id)
      );

      setChants(favChants);
      setLoading(false);
    };

    load();
  }, [USER_ID]);

  // Recherche
  const searched = chants.filter((c) =>
    `${c.nom_chant} ${c.auteur}`.toLowerCase().includes(search.toLowerCase())
  );

  // Filtre catégorie
  const filtered = searched.filter((c) =>
    filterCat === "Toutes"
      ? true
      : (c.categories.length ? c.categories : ["Autre"]).includes(filterCat)
  );

  // Regrouper par catégories
  const categoriesMap: Record<string, Chant[]> = {};
  filtered.forEach((chant) => {
    const catList = chant.categories.length ? chant.categories : ["Autre"];
    catList.forEach((cat) => {
      if (!categoriesMap[cat]) categoriesMap[cat] = [];
      categoriesMap[cat].push(chant);
    });
  });

  // Liste des catégories
  const allCategories = [
    "Toutes",
    ...new Set(chants.flatMap((c) =>
      c.categories.length ? c.categories : ["Autre"]
    )),
  ].sort((a, b) => a.localeCompare(b, "fr"));

  // Pagination
  const categoriesList = Object.keys(categoriesMap).sort((a, b) =>
    a.localeCompare(b, "fr")
  );

  const totalPages = Math.ceil(categoriesList.length / PER_PAGE);
  const visibleCategories = categoriesList.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  if (!USER_ID)
    return <p className="text-center text-gray-500 mt-10">Veuillez vous connecter.</p>;

  if (loading)
    return <p className="text-center mt-10">Chargement…</p>;

  return (
    <div className="px-10 py-10 flex flex-col gap-10 w-full">
      <h1 className="text-3xl font-bold text-mauve">Mes favoris</h1>

      {/* Barre de recherche + catégorie */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Rechercher un favori..."
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

      {/* Groupe par catégories */}
      {visibleCategories.map((cat) => {
        const sortedChants = [...categoriesMap[cat]].sort((a, b) =>
          a.nom_chant.localeCompare(b.nom_chant, "fr")
        );

        return (
          <div key={cat}>
            <h2 className="text-2xl font-bold text-mauve mt-6 mb-3">{cat}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedChants.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => (window.location.href = `/chants/${ch.id}`)}
                  className="border border-mauve/30 rounded-xl p-5 shadow bg-white cursor-pointer hover:bg-mauve/5 transition"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-mauve">{ch.nom_chant}</h3>

                    <div onClick={(e) => e.stopPropagation()}>
                      <FavoriButton chantId={ch.id} USER_ID={USER_ID} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-6">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-4 py-2 rounded-lg border ${
                page === i + 1
                  ? "bg-mauve text-white"
                  : "border-mauve/40 hover:bg-mauve/10"
              }`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}