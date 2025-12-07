import React, { useEffect, useState } from "react";

const AdminCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCat, setNewCat] = useState("");

  const fetchCats = async () => {
    const res = await fetch("http://127.0.0.1:8000/api/categories/");
    setCategories(await res.json());
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const addCategory = async () => {
    if (!newCat.trim()) return;
    await fetch("http://127.0.0.1:8000/api/categories/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat }),
    });
    setNewCat("");
    fetchCats();
  };

  const deleteCategory = async (name: string) => {
    if (name === "Autre") return;
    await fetch(`http://127.0.0.1:8000/api/categories/?delete=${name}`, {
      method: "DELETE",
    });
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
            <span className="font-medium text-gray-800">{cat}</span>

            {cat !== "Autre" && (
              <button
                onClick={() => deleteCategory(cat)}
                className="rounded-lg bg-red-500 px-3 py-1 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Supprimer
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminCategories;