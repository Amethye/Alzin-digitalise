import React, { useEffect, useState } from "react";

const AdminCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCat, setNewCat] = useState("");

  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const API_URL = "http://127.0.0.1:8000/api/categories/";

const fetchCats = async () => {
  const res = await fetch(API_URL);
  const data = await res.json();

  setCategories(data.map((c: any) => c.nom_categorie));
};

  useEffect(() => {
    fetchCats();
  }, []);

  /** Ajouter catégorie */
  const addCategory = async () => {
    if (!newCat.trim()) return;

    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom_categorie: newCat }),
    });

    setNewCat("");
    fetchCats();
  };

  /** Supprimer */
const deleteCategory = async (name: string) => {
  if (name === "Autre") return;

  await fetch(`${API_URL}?delete=${name}`, {
    method: "DELETE",
  });

  fetchCats();
};

  /** Enregistrer modification */
  const saveEdit = async (oldName: string) => {
    await fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        old_name: oldName,
        new_name: editValue,
      }),
    });

    setEditingCat(null);
    setEditValue("");
    fetchCats();
  };

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl border border-mauve/30 bg-white px-5 py-6 shadow-md sm:px-6">
      <h2 className="mb-4 text-xl font-bold text-mauve">Gérer les catégories</h2>

      {/* Ajouter */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
          placeholder="Nouvelle catégorie"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-mauve/40"
        />
        <button
          onClick={addCategory}
          className="rounded-lg bg-mauve px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 shadow-sm"
        >
          Ajouter
        </button>
      </div>

      {/* Liste */}
      <ul className="space-y-2 text-sm sm:text-base">
        {categories.map((cat) => (
          <li
            key={cat}
            className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 shadow-sm transition hover:border-mauve/50 hover:bg-mauve/5"
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
                  className="rounded-lg px-3 py-1 text-white 
                            !bg-green-500 hover:!bg-green-600"
                >
                  ✔
                </button>

                {/* ✖ Bouton rouge */}
                <button
                  onClick={() => {
                    setEditingCat(null);
                    setEditValue("");
                  }}
                  className="rounded-lg px-3 py-1 text-white 
                            !bg-red-500 hover:!bg-red-600"
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
                      className="rounded-lg bg-yellow-500 px-3 py-1 text-white hover:bg-yellow-600"
                    >
                      Modifier
                    </button>
                  )}

                  {/* Supprimer */}
                  {cat !== "Autre" && (
                    <button
                      onClick={() => deleteCategory(cat)}
                      className="rounded-lg bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                    >
                      Supprimer
                    </button>
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