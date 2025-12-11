import React, { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";
import DeleteButton from "../DeleteButton";

const AdminCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCat, setNewCat] = useState("");

  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [USER_ID, setUSER_ID] = useState<number |null>(null);

  const API_PATH = "/api/categories/";

const fetchCats = async () => {
  const res = await fetch(apiUrl(API_PATH));
  const data = await res.json();

  setCategories(data.map((c: any) => c.nom_categorie));
};

  useEffect(() => {
    fetchCats();
  }, []);

  /** Ajouter catégorie */
  const addCategory = async () => {
    if (!newCat.trim()) return;

    await fetch(apiUrl(API_PATH), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
         nom_categorie: newCat, 
         utilisateur_id: USER_ID,
        }),
    });

    setNewCat("");
    fetchCats();
  };

  /** Enregistrer modification */
  const saveEdit = async (oldName: string) => {
    await fetch(apiUrl(API_PATH), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        old_name: oldName,
        new_name: editValue,
        utilisateur_id: USER_ID,
      }),
    });

    setEditingCat(null);
    setEditValue("");
    fetchCats();
  };

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl border border-bordeau/30 bg-white px-5 py-6 shadow-md sm:px-6">
      <h2 className="mb-4 text-xl font-bold text-bordeau">Gérer les catégories</h2>

      {/* Ajouter */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
          placeholder="Nouvelle catégorie"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-bordeau/40"
        />
        <button
          onClick={addCategory}
          className="btn btn-solid"
        >
          Ajouter
        </button>
      </div>

      {/* Liste */}
      <ul className="space-y-2 text-sm sm:text-base">
        {categories.map((cat) => (
          <li
            key={cat}
            className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 shadow-sm transition hover:border-bordeau/50 hover:bg-bordeau/5"
          >
            {/* MODE ÉDITION */}
            {editingCat === cat ? (
              <div className="flex w-full items-center gap-2">
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1"
                />

                {/* ✔ Bouton vert */}
                <button
                  onClick={() => saveEdit(cat)}
                  className="btn btn-solid bg-green-500 hover:bg-green-600 border-green-500"
                >
                  ✔
                </button>

                {/* ✖ Bouton rouge */}
                <button
                  onClick={() => {
                    setEditingCat(null);
                    setEditValue("");
                  }}
                  className="btn btn-danger"
                >
                  ✖
                </button>
              </div>
            ) : (
              <>
                <span className="font-medium text-gray-800">{cat}</span>

                <div className="flex gap-2">
                  {/* Modifier */}
                  {cat !== "Autre" && (
                    <button
                      onClick={() => {
                        setEditingCat(cat);
                        setEditValue(cat);
                      }}
                      className="btn btn-warning"
                    >
                      Modifier
                    </button>
                  )}

                  {/* Supprimer */}
                  {cat !== "Autre" && (
                    <DeleteButton
                      endpoint={`/api/categories/?delete=${encodeURIComponent(
                        cat
                      )}`}
                      confirmMessage={`Supprimer la catégorie « ${cat} » ?`}
                      onSuccess={fetchCats}
                    />
                  )}
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminCategories;
