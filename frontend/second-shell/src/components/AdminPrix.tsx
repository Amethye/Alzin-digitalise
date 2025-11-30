import React, { useEffect, useState } from "react";

type Pin = {
  id: number;
  title: string;
  price: string;
  description: string;
  imageUrl: string;
  category: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const API_URL = `${API_BASE}/api/pins/`;

const AdminPrix: React.FC = () => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [search, setSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const pinsPerPage = 40;

  const fetchPins = async () => {
    try {
      const res = await fetch(API_URL, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur lors du chargement des pins");
      setPins(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPins();
  }, []);

  useEffect(() => {
    setPageInput(String(currentPage));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  const startEdit = (pin: Pin) => {
    setEditingId(pin.id);
    setNewPrice(pin.price);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewPrice("");
  };

  const handlePriceChange = async (pinId: number) => {
    if (!newPrice || isNaN(Number(newPrice))) {
      alert("Veuillez entrer un prix valide");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("price", newPrice);

      const res = await fetch(`${API_URL}${pinId}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur lors de la mise à jour du prix");
      }

      cancelEdit();
      fetchPins();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur inconnue");
    }
  };

  // --- Normalisation catégorie
  const normalizeCategory = (cat: string | null | undefined) => {
    if (!cat) return "Autre";
    const trimmed = cat.trim();
    if (trimmed === "") return "Autre";
    if (trimmed.toLowerCase() === "autre") return "Autre";
    return trimmed;
  };

  const sortCategories = (a: string, b: string) => {
    const AUTRE = "Autre";
    if (a === AUTRE && b !== AUTRE) return 1;
    if (b === AUTRE && a !== AUTRE) return -1;
    return a.localeCompare(b);
  };

  const allCategories = Array.from(new Set(pins.map((p) => normalizeCategory(p.category)))).sort(
    sortCategories
  );

  // --- Filtrage par catégorie
  const categoryFiltered = categorySearch
    ? pins.filter((p) => normalizeCategory(p.category) === categorySearch)
    : pins;

  // --- Filtrage texte
  const textFiltered = search
    ? categoryFiltered.filter((p) =>
        (p.title + " " + p.description)
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : categoryFiltered;

  // --- Ensuite tri sur textFiltered
  const sortedPins = [...textFiltered].sort((a, b) => {
    const catComparison = sortCategories(
      normalizeCategory(a.category),
      normalizeCategory(b.category)
    );
    if (catComparison !== 0) return catComparison;
    return a.title.localeCompare(b.title);
  });

  // --- Pagination
  const totalPages = Math.max(1, Math.ceil(sortedPins.length / pinsPerPage));
  const start = (currentPage - 1) * pinsPerPage;
  const end = start + pinsPerPage;
  const paginatedPins = sortedPins.slice(start, end);

  // --- Groupement par catégorie
  const groupedPins = paginatedPins.reduce((acc, pin) => {
    const cat = normalizeCategory(pin.category);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(pin);
    return acc;
  }, {} as Record<string, Pin[]>);

  const sortedCategories = Object.keys(groupedPins).sort(sortCategories);
  const parsedPageInput = Number(pageInput);
  const isPageInputValid =
    pageInput !== "" &&
    Number.isFinite(parsedPageInput) &&
    parsedPageInput >= 1 &&
    parsedPageInput <= totalPages &&
    parsedPageInput !== currentPage;

  return (
    <div className="flex w-full flex-col items-center gap-6 px-4 py-6 sm:gap-8 sm:px-6">
      <h1 className="text-2xl font-bold text-bleu sm:text-3xl">Admin Prix</h1>

      {/* Recherche et filtre */}
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
        placeholder="Rechercher un article..."
        className="mb-3 w-full max-w-md rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <select
        value={categorySearch}
        onChange={(e) => {
          setCategorySearch(e.target.value);
          setCurrentPage(1);
        }}
        className="mb-4 w-full max-w-md rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option value="">Toutes les catégories</option>
        {allCategories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {/* Liste */}
      {sortedCategories.map((cat) => (
        <div key={cat} className="w-full">
          <h2 className="mb-4 text-xl font-semibold text-bleu sm:text-2xl">{cat}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {groupedPins[cat].map((pin) => (
              <div
                key={pin.id}
                className="flex flex-col gap-3 rounded-lg border border-bleu/20 bg-white p-4 shadow-sm"
              >
                <img
                  src={pin.imageUrl}
                  alt={pin.title}
                  className="h-40 w-full rounded-lg object-cover sm:h-48"
                />
                <h3 className="text-lg font-bold text-bleu">{pin.title}</h3>
                                    <p className="text-sm text-gray-700 sm:text-base">
                                      {pin.description.split("\n").map((line, index) => (
                                        <React.Fragment key={index}>
                                          {line}
                                          <br />
                                        </React.Fragment>
                                      ))}
                                    </p>

                {editingId === pin.id ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={() => handlePriceChange(pin.id)}
                        className="w-full rounded bg-bleu px-3 py-2 text-sm font-semibold text-white transition hover:bg-bleu/80"
                      >
                        Valider
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="w-full rounded bg-gray-400 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-500"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-lg font-semibold text-bleu">{pin.price} €</span>
                    <button
                      onClick={() => startEdit(pin)}
                      className="rounded bg-yellow-400 px-3 py-1 text-sm font-semibold text-white transition hover:bg-yellow-500"
                    >
                      Modifier
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm sm:text-base">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className={`rounded border px-3 py-2 font-semibold transition-colors ${
            currentPage === 1
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-bleu text-white hover:bg-bleu/80"
          }`}
        >
          Précédent
        </button>

        <span className="rounded border bg-gray-100 px-3 py-2 text-gray-700">
          {currentPage} / {totalPages}
        </span>

        <input
          type="number"
          min={1}
          max={totalPages}
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          className="w-16 rounded border px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-400 sm:w-20"
        />

        <button
          onClick={() => {
            if (isPageInputValid) setCurrentPage(parsedPageInput);
          }}
          disabled={!isPageInputValid}
          className={`rounded border px-3 py-2 font-semibold transition-colors ${
            !isPageInputValid
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-bleu text-white hover:bg-bleu/80"
          }`}
        >
          Valider
        </button>

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className={`rounded border px-3 py-2 font-semibold transition-colors ${
            currentPage === totalPages
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-bleu text-white hover:bg-bleu/80"
          }`}
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default AdminPrix;
