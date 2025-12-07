import React, { useEffect, useState } from "react";

type Chant = {
  id: number;
  nom_chant: string;
  categories: string[];
};

const API_URL = "http://127.0.0.1:8000/api/chants/";
const AUTRE = "Autre";

export default function ChantsList() {
  const [chants, setChants] = useState<Chant[]>([]);
  const [search, setSearch] = useState("");

  // Charger les chants
  useEffect(() => {
    const load = async () => {
      const res = await fetch(API_URL);
      const data = await res.json();

      // Ajouter "Autre" si aucune catégorie
      const formatted = data.map((c: Chant) => ({
        ...c,
        categories:
          c.categories && c.categories.length > 0
            ? c.categories
            : [AUTRE],
      }));

      setChants(formatted);
    };

    load();
  }, []);

  // Filtre recherche
  const filtered = chants.filter((c) =>
    c.nom_chant.toLowerCase().includes(search.toLowerCase())
  );

  // Regroupement par catégorie
  const grouped: Record<string, Chant[]> = {};

  filtered.forEach((chant) => {
    chant.categories.forEach((cat) => {
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(chant);
    });
  });

  // Tri alphabétique des catégories (Autre à la fin)
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    if (a === AUTRE) return 1;
    if (b === AUTRE) return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="p-6 flex flex-col gap-8">

      {/* Recherche */}
      <input
        type="text"
        placeholder="Rechercher un chant..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md border p-2 rounded shadow-sm bg-white"
      />

      {/* Catégories */}
      <div className="flex flex-col gap-10 w-full">
        {sortedCategories.map((cat) => {
          // TRI ALPHABÉTIQUE DES CHANTS DANS CHAQUE CATÉGORIE
          const sortedChants = [...grouped[cat]].sort((a, b) =>
            a.nom_chant.localeCompare(b.nom_chant)
          );

          return (
            <div key={cat}>
              <h2 className="text-2xl font-bold text-mauve mb-3">{cat}</h2>

              <ul className="flex flex-col gap-2">
                {sortedChants.map((chant) => (
                  <li
                    key={chant.id}
                    className="
                      px-4 py-2 rounded-lg bg-white shadow 
                      border border-mauve/20 
                      hover:border-mauve/50 transition
                    "
                  >
                    <a href={`/chants/${chant.id}`}  className="font-semibold text-mauve">
                      {chant.nom_chant}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

    </div>
  );
}