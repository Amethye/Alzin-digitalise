import React, { useEffect, useMemo, useState } from "react";
import FavoriButton from "@components/FavoriButton";
import { sortCategoriesWithAutreLast } from "../lib/categories";
import {
  hasFavorisForUser,
  setFavorisForUser,
  subscribeToFavoris,
  type Favori,
} from "../lib/favorisStore";

type Chant = {
  id: number;
  nom_chant: string;
  auteur: string;
  ville_origine: string;
  paroles: string;
  description: string;
  categories: string[];
};

const API_CHANTS = "/api/chants/";
const API_FAVORIS = "/api/favoris/";

export default function FavorisPage() {
  const [USER_ID, setUSER_ID] = useState<number | null>(null);
  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [allChants, setAllChants] = useState<Chant[]>([]);
  const [favorisLoaded, setFavorisLoaded] = useState(false);
  const [chantsLoaded, setChantsLoaded] = useState(false);

  // Recherche + filtre catégorie
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Toutes");

  // Charger utilisateur
  useEffect(() => {
    const id = localStorage.getItem("utilisateur_id");
    if (id) setUSER_ID(Number(id));
  }, []);

  // Charger la liste complète des chants (une seule fois)
  useEffect(() => {
    const loadChants = async () => {
      setChantsLoaded(false);
      try {
        const res = await fetch(API_CHANTS);
        const data = await res.json();
        setAllChants(data);
      } finally {
        setChantsLoaded(true);
      }
    };

    loadChants();
  }, []);

  // Abonnement aux favoris
  useEffect(() => {
    if (!USER_ID) {
      setFavoris([]);
      setFavorisLoaded(false);
      return;
    }

    let cancelled = false;
    const unsubscribe = subscribeToFavoris(USER_ID, (favList) => {
      if (!cancelled) setFavoris(favList);
    });

    if (hasFavorisForUser(USER_ID)) {
      setFavorisLoaded(true);
    } else {
      const loadFavoris = async () => {
        setFavorisLoaded(false);
        try {
          const resFav = await fetch(`${API_FAVORIS}?utilisateur_id=${USER_ID}`);
          const favData = await resFav.json();
          setFavorisForUser(USER_ID, favData);
        } catch (err) {
          console.error("Erreur lors du chargement des favoris", err);
        } finally {
          if (!cancelled) setFavorisLoaded(true);
        }
      };

      loadFavoris();
    }

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [USER_ID]);

  const favoriteChants = useMemo(() => {
    const ids = new Set(favoris.map((f) => f.chant_id));
    return allChants.filter((chant) => ids.has(chant.id));
  }, [favoris, allChants]);

  // Recherche
  const searched = favoriteChants.filter((c) => {
    const haystack = [
      c.nom_chant,
      c.auteur,
      c.ville_origine,
      c.paroles,
      c.description,
      ...(c.categories || []),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(search.toLowerCase());
  });

  // Filtre catégorie
  const filtered = searched.filter((c) =>
    filterCat === "Toutes"
      ? true
      : (c.categories.length ? c.categories : ["Autre"]).includes(filterCat)
  );

  const categoriesMap: Record<string, Chant[]> = {};
  filtered.forEach((chant) => {
    const catList = chant.categories.length ? chant.categories : ["Autre"];
    catList.forEach((cat) => {
      if (!categoriesMap[cat]) categoriesMap[cat] = [];
      categoriesMap[cat].push(chant);
    });
  });

  const sortedCategoryKeys = sortCategoriesWithAutreLast(Object.keys(categoriesMap));

  // Liste des catégories
  const categoriesForFilter = sortCategoriesWithAutreLast(
    Array.from(
      new Set(
        favoriteChants.flatMap((c) =>
          c.categories.length ? c.categories : ["Autre"]
        )
      )
    )
  );
  const allCategories = ["Toutes", ...categoriesForFilter];

  const totalFavorisDisplayed = filtered.length;

  if (!USER_ID)
    return <p className="text-center text-gray-500 mt-10">Veuillez vous connecter.</p>;

  const loading = !favorisLoaded || !chantsLoaded;

  if (loading)
    return <p className="text-center mt-10">Chargement…</p>;

  return (
    <div className="px-10 py-10 flex flex-col gap-10 w-full">
      <h1 className="text-3xl font-bold text-bordeau">
        Mes favoris <span className="text-bordeau/70">({totalFavorisDisplayed})</span>
      </h1>

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
          className="border border-bordeau/40 p-3 rounded-lg flex-1"
        />

        <select
          value={filterCat}
          onChange={(e) => {
            setFilterCat(e.target.value);
            setPage(1);
          }}
          className="border border-bordeau/40 p-3 rounded-lg w-full md:w-60"
        >
          {allCategories.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Groupe par catégories */}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">
          Aucun favori ne correspond à ta recherche.
        </p>
      ) : (
        <>
          {sortedCategoryKeys.map((category) => (
            <div key={category}>
              <h2 className="text-2xl font-bold text-bordeau mt-6 mb-3">{category}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...categoriesMap[category]]
                  .sort((a, b) => a.nom_chant.localeCompare(b.nom_chant, "fr"))
                  .map((ch) => (
                    <div
                      key={ch.id}
                      onClick={() => (window.location.href = `/chants/${ch.id}`)}
                      className="border border-bordeau/30 rounded-xl p-5 shadow bg-white cursor-pointer hover:bg-bordeau/5 transition"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-bordeau">{ch.nom_chant}</h3>

                        <div onClick={(e) => e.stopPropagation()}>
                          <FavoriButton chantId={ch.id} USER_ID={USER_ID} />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
