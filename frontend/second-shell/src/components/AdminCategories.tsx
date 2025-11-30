import React, { useEffect, useState } from "react";

const AdminCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCat, setNewCat] = useState("");

  const fetchCats = async () => {
    const res = await fetch("/api/categories/");
    setCategories(await res.json());
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const addCategory = async () => {
    if (!newCat.trim()) return;
    await fetch("/api/categories/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat }),
    });
    setNewCat("");
    fetchCats();
  };

  const deleteCategory = async (name: string) => {
    if (name === "Autre") return; // empêche de supprimer la catégorie par défaut
    await fetch(`/api/categories/${name}`, { method: "DELETE" });
    fetchCats();
  };

  return (
      <div className="mx-auto w-full max-w-md rounded border border-bleu/30 bg-white px-4 py-5 shadow-sm sm:px-6">
      <h2 className="mb-3 text-lg font-bold text-bleu sm:text-xl">Gérer les catégories</h2>

      {/* Ajouter une nouvelle catégorie */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="Nouvelle catégorie"
          className="flex-1 rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={addCategory}
          className="rounded bg-bleu px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
        >
          Ajouter
        </button>
      </div>

      {/* Liste des catégories existantes */}
        <ul className="space-y-2 text-sm text-gray-700 sm:text-base">
        {categories.map((cat) => (
            <li key={cat} className="flex items-center justify-between gap-3 rounded border border-transparent px-2 py-2 hover:border-bleu/40">
            {cat}
            {cat !== "Autre" && (
                <button
                onClick={() => deleteCategory(cat)}
                className="rounded bg-red-500 px-3 py-1 text-sm text-white transition hover:bg-red-600"
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
