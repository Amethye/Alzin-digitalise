import React, { useEffect, useState } from "react";
import FavoriButton from "@components/FavoriButton";
import { apiUrl } from "../lib/api";

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

const API_CHANTS = "/api/chants/";

export default function ChantsListe() {
  const [chants, setChants] = useState<Chant[]>([]);
  const [USER_ID, setUSER_ID] = useState<number | null>(null);

  // Recherche + filtre
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Toutes");

  // Charger chants
  useEffect(() => {
    fetch(apiUrl(API_CHANTS))
      .then((r) => r.json())
      .then(setChants);

    const raw = localStorage.getItem("utilisateur_id");
    const id = raw && !isNaN(Number(raw)) ? Number(raw) : null;
    setUSER_ID(id);
  }, []);

  // Recherche
  const searched = chants.filter((c) =>
    `${c.nom_chant} ${c.auteur} ${c.ville_origine}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Filtre catégorie
  const filtered = searched.filter((c) =>
    filterCat === "Toutes"
      ? true
      : (c.categories.length ? c.categories : ["Autre"]).includes(filterCat)
  );

  // Groupement par catégories
  const categoriesMap: Record<string, Chant[]> = {};

  filtered.forEach((chant) => {
    const cats = chant.categories.length ? chant.categories : ["Autre"];
    cats.forEach((cat) => {
      if (!categoriesMap[cat]) categoriesMap[cat] = [];
      categoriesMap[cat].push(chant);
    });
  });

  // Liste catégories disponibles
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
          onChange={(e) => setSearch(e.target.value)}
          className="border border-mauve/40 p-3 rounded-lg flex-1"
        />

        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="border border-mauve/40 p-3 rounded-lg w-full md:w-60"
        >
          {allCategories.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Groupement */}
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
                      <h3 className="text-xl font-bold text-mauve">
                        {ch.nom_chant}
                      </h3>

                      {/* FAVORIS → remplace tout le code précédent */}
                      {USER_ID && (
                        <span onClick={(e) => e.stopPropagation()}>
                          <FavoriButton chantId={ch.id} USER_ID={USER_ID} size={34} />
                        </span>
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
