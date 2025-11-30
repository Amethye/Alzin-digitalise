import React, { useEffect, useState } from "react";

type Pin = {
  id: number;
  title: string;
  price: string;
  description: string;
  imageUrl: string;
  category: string;
  stock: number;
};

type CartItem = Pin & { quantity: number };

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const API_URL = `${API_BASE}/api/pins/`;

const pinsPerPage = 40;

const MemberPins: React.FC = () => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [categorySearch, setCategorySearch] = useState("");
  const [search, setSearch] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"" | "success" | "info">("");

  const fetchPins = async () => {
    try {
      const res = await fetch(API_URL, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur lors du chargement des pins");
      const data: Pin[] = await res.json();
      setPins(data);
      setQuantities((prev) => {
        const next = { ...prev };
        data.forEach((pin) => {
          if (next[pin.id] === undefined) {
            next[pin.id] = "1";
          }
        });
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPins();
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      const parsed: CartItem[] = JSON.parse(storedCart);
      setCart(parsed);
      setQuantities((prev) => {
        const next = { ...prev };
        parsed.forEach((item) => {
          next[item.id] = String(item.quantity);
        });
        return next;
      });
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        setIsAuthenticated(res.ok);
      } catch (err) {
        console.error("Impossible de déterminer l'authentification", err);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    setPageInput(String(currentPage));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  const updateCart = (nextCart: CartItem[]) => {
    setCart(nextCart);
    localStorage.setItem("cart", JSON.stringify(nextCart));
  };

  const normalizeQuantity = (pinId: number, fallback = 1) => {
    const value = quantities[pinId];
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1) {
      return Math.floor(parsed);
    }
    return fallback;
  };

  const handleQuantityInput = (pinId: number, value: string) => {
    setQuantities((prev) => ({
      ...prev,
      [pinId]: value,
    }));
  };

  const adjustQuantity = (pinId: number, delta: number) => {
    const current = normalizeQuantity(pinId);
    const next = Math.max(1, current + delta);
    setQuantities((prev) => ({
      ...prev,
      [pinId]: String(next),
    }));
  };

  const addToCart = (pin: Pin) => {
    const normalizedQty = normalizeQuantity(pin.id);
    const existing = cart.find((item) => item.id === pin.id);

    let updatedCart: CartItem[];
    if (existing) {
      updatedCart = cart.map((item) =>
        item.id === pin.id
          ? { ...item, quantity: item.quantity + normalizedQty }
          : item,
      );
    } else {
      updatedCart = [...cart, { ...pin, quantity: normalizedQty }];
    }

    updateCart(updatedCart);
    setMessage(`${pin.title} ajouté au panier (x${normalizedQty}).`);
    setMessageType("success");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [message]);

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

  const allCategories = Array.from(
    new Set(pins.map((p) => normalizeCategory(p.category))),
  ).sort(sortCategories);

  const categoryFiltered = categorySearch
    ? pins.filter((p) => normalizeCategory(p.category) === categorySearch)
    : pins;

  const textFiltered = search
    ? categoryFiltered.filter((p) =>
        (p.title + " " + p.description)
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : categoryFiltered;

  const sortedPins = [...textFiltered].sort((a, b) => {
    const catComparison = sortCategories(
      normalizeCategory(a.category),
      normalizeCategory(b.category),
    );
    if (catComparison !== 0) return catComparison;
    return a.title.localeCompare(b.title);
  });

  const totalPages = Math.max(1, Math.ceil(sortedPins.length / pinsPerPage));
  const start = (currentPage - 1) * pinsPerPage;
  const end = start + pinsPerPage;
  const paginatedPins = sortedPins.slice(start, end);

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

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-5 sm:gap-8 sm:px-6">
      <div className="flex w-full max-w-5xl flex-col gap-4 rounded-lg bg-white px-4 py-5 shadow sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-bleu sm:text-3xl">
              Liste des articles
            </h1>
            <p className="text-sm text-gray-600 sm:text-base">
              Parcourez nos pin&apos;s par catégorie, ajustez la quantité puis
              ajoutez-les à votre panier.
            </p>
          </div>
          <a
            href="/cart"
            className="inline-flex items-center justify-center rounded-full border border-bleu px-3 py-2 text-sm font-semibold text-bleu transition hover:bg-blue-50 sm:text-base"
          >
            Voir mon panier ({totalCartItems})
          </a>
        </div>

        {message && (
          <div
            className={`rounded-md border px-3 py-2 text-sm sm:text-base ${
              messageType === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-bleu/30 bg-blue-50 text-bleu"
            }`}
          >
            {message}
            <a href="/cart" className="ml-2 underline hover:no-underline">
              Ouvrir le panier
            </a>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher un article..."
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <select
            value={categorySearch}
            onChange={(e) => {
              setCategorySearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 sm:max-w-xs"
          >
            <option value="">Toutes les catégories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex w-full flex-col gap-6 sm:gap-8">
        {sortedCategories.length === 0 ? (
          <div className="rounded-lg border border-bleu/20 bg-white px-4 py-6 text-center text-sm text-gray-600 shadow sm:text-base">
            Aucun article ne correspond à votre recherche.
          </div>
        ) : (
          sortedCategories.map((cat) => (
            <div key={cat}>
              <h2 className="mb-4 text-xl font-semibold text-bleu sm:text-2xl">
                {cat}
              </h2>
              <div className="grid w-full grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {groupedPins[cat].map((pin) => {
                  const lineQuantity = normalizeQuantity(pin.id);
                  const lineTotal =
                    parseFloat(pin.price) * (lineQuantity || 1);

                  return (
                    <div
                      key={pin.id}
                      className="mx-auto flex max-w-[22rem] flex-col gap-3 rounded-lg border border-bleu/20 bg-white p-3 shadow-sm transition hover:shadow-md sm:mx-0 sm:max-w-none sm:p-4"
                    >
                      <img
                        src={pin.imageUrl}
                        alt={pin.title}
                        className="h-32 w-full rounded-lg object-cover sm:h-44 lg:h-48"
                      />
                      <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                        {pin.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-700 sm:text-base">
                        {pin.description.split("\n").map((line, index) => (
                          <React.Fragment key={index}>
                            {line}
                            <br />
                          </React.Fragment>
                        ))}
                      </p>
                      <p className="text-base font-semibold text-bleu sm:text-lg">
                        {pin.price} €
                      </p>

                      <div className="flex flex-col gap-2 border-t border-gray-200 pt-3 text-sm text-gray-700 sm:text-base">
                        <p className="font-semibold text-gray-900">
                          Stock disponible : {pin.stock}
                        </p>
                        {isAuthenticated ? (
                          <>
                            <span
                              className="text-sm font-medium text-gray-700"
                              id={`qty-label-${pin.id}`}
                            >
                              Quantité
                            </span>
                            <div
                              className="flex items-center gap-2"
                              aria-labelledby={`qty-label-${pin.id}`}
                            >
                              <button
                                type="button"
                                onClick={() => adjustQuantity(pin.id, -1)}
                                className="h-9 w-9 rounded-full border border-gray-300 text-lg font-semibold text-gray-600 transition hover:bg-gray-100"
                                aria-label={`Diminuer la quantité de ${pin.title}`}
                              >
                                −
                              </button>
                              <input
                                id={`qty-${pin.id}`}
                                type="number"
                                min={1}
                                value={quantities[pin.id] ?? "1"}
                                onChange={(e) =>
                                  handleQuantityInput(pin.id, e.target.value)
                                }
                                className="w-16 rounded border border-gray-300 px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
                              />
                              <button
                                type="button"
                                onClick={() => adjustQuantity(pin.id, 1)}
                                className="h-9 w-9 rounded-full border border-gray-300 text-lg font-semibold text-gray-600 transition hover:bg-gray-100"
                                aria-label={`Augmenter la quantité de ${pin.title}`}
                              >
                                +
                              </button>
                            </div>
                            <p className="text-sm text-gray-600">
                              Sous-total :{" "}
                              <strong>{lineTotal.toFixed(2)} €</strong>
                            </p>
                            <button
                              onClick={() => addToCart(pin)}
                              className="w-full rounded bg-green-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
                            >
                              Ajouter au panier
                            </button>
                          </>
                        ) : isAuthenticated === false ? (
                          <p className="text-sm italic text-gray-500 sm:text-base">
                            Connecte-toi pour ajouter cet article au panier.
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 sm:text-base">
                            Vérification en cours…
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

{/* Pagination */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm sm:text-base">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          aria-label="Page précédente"
          title="Page précédente"
          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg font-semibold transition-colors duration-150 ${
            currentPage === 1
              ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
              : "border-bleu text-bleu hover:bg-bleu hover:text-white"
          }`}
        >
          {"\u2190"}
        </button>

        <span className="rounded-full border-2 border-bleu/40 bg-bleu/5 px-4 py-2 font-semibold text-bleu">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          aria-label="Page suivante"
          title="Page suivante"
          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-lg font-semibold transition-colors duration-150 ${
            currentPage === totalPages
              ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
              : "border-bleu text-bleu hover:bg-bleu hover:text-white"
          }`}
        >
          {"\u2192"}
        </button>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 text-sm sm:flex-row sm:text-base">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setPageInput((prev) => {
                  const current = Number(prev) || currentPage;
                  return String(Math.max(1, current - 1));
                })
              }
              className="h-9 w-9 rounded-full border border-gray-300 text-lg font-semibold text-gray-600 transition hover:bg-gray-100"
              aria-label="Diminuer le numéro de page"
            >
              −
            </button>
            <input
              id="pins-page-input"
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              className="h-10 w-16 rounded-full border-2 border-gray-200 px-3 text-center font-semibold text-gray-700 focus:border-bleu focus:outline-none focus:ring-2 focus:ring-bleu/40 sm:w-20"
            />
            <button
              type="button"
              onClick={() =>
                setPageInput((prev) => {
                  const current = Number(prev) || currentPage;
                  return String(Math.min(totalPages, current + 1));
                })
              }
              className="h-9 w-9 rounded-full border border-gray-300 text-lg font-semibold text-gray-600 transition hover:bg-gray-100"
              aria-label="Augmenter le numéro de page"
            >
              +
            </button>
          </div>
          <button
            onClick={() => {
              if (isPageInputValid) {
                setCurrentPage(parsedPageInput);
              }
            }}
            disabled={!isPageInputValid}
            className={`w-full rounded-full border-2 px-4 py-2 font-semibold transition sm:w-auto ${
              !isPageInputValid
                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                : "border-bleu bg-bleu text-white hover:bg-bleu/90"
            }`}
          >
            Valider
          </button>
      </div>
    </div>
  );
};

export default MemberPins;
