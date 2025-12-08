import React, { useEffect, useState } from "react";

type Chant = {
  id: number;
  nom_chant: string;
};

const API_URL = "http://127.0.0.1:8000/api/chants/";

export default function ChantsList() {
  const [chants, setChants] = useState<Chant[]>([]);
  const [search, setSearch] = useState("");

  // Charger les chants
  useEffect(() => {
    const load = async () => {
      const res = await fetch(API_URL);
      const data = await res.json();

      // Ne garder que id + nom
      const formatted = data.map((c: any) => ({
        id: c.id,
        nom_chant: c.nom_chant,
      }));

      // Tri alphabétique
      formatted.sort((a: Chant, b: Chant) =>
        a.nom_chant.localeCompare(b.nom_chant)
      );

      setChants(formatted);
    };

    load();
  }, []);

  // Filtre recherche
  const filtered = chants.filter((c) =>
    c.nom_chant.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 flex flex-col gap-6 w-full max-w-2xl mx-auto">

      {/* Recherche */}
      <input
        type="text"
        placeholder="Rechercher un chant..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border p-3 rounded-xl shadow-sm bg-white"
      />

      {/* Liste simple */}
      <ul className="flex flex-col gap-3">
        {filtered.map((chant) => (
          <li
            key={chant.id}
            className="px-4 py-3 rounded-lg bg-white shadow border border-mauve/20 hover:border-mauve/50 transition"
          >
            <a href={`/chants/${chant.id}`} className="font-semibold text-mauve">
              {chant.nom_chant}
            </a>
          </li>
        ))}
      </ul>

    </div>
  );
}