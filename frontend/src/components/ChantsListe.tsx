import React, { useEffect, useState } from "react";
import FavoriButton from "@components/FavoriButton";
import { apiUrl } from "../lib/api";
import { sortCategoriesWithAutreLast } from "../lib/categories";

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
const API_CATEGORIES = "/api/categories/";
const API_DEMANDES_CHANTS = "/api/demandes-chants/";

type RequestFormState = {
  nom_chant: string;
  auteur: string;
  ville_origine: string;
  paroles: string;
  description: string;
  illustration_chant: File | null;
  paroles_pdf: File | null;
  partition: File | null;
  new_audio: File[];
};

const requestInitialState: RequestFormState = {
  nom_chant: "",
  auteur: "",
  ville_origine: "",
  paroles: "",
  description: "",
  illustration_chant: null,
  paroles_pdf: null,
  partition: null,
  new_audio: [],
};

export default function ChantsListe() {
  const [chants, setChants] = useState<Chant[]>([]);
  const [USER_ID, setUSER_ID] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Recherche + filtre
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Toutes");
  const PER_PAGE = 20;
  const [page, setPage] = useState(1);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Demande d'ajout
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState<RequestFormState>(requestInitialState);
  const [requestSelectedCats, setRequestSelectedCats] = useState<string[]>([]);
  const [requestPreviewIllustration, setRequestPreviewIllustration] = useState<string>();
  const [requestPreviewPDF, setRequestPreviewPDF] = useState<string>();
  const [requestPreviewPartition, setRequestPreviewPartition] = useState<string>();
  const [requestPreviewAudio, setRequestPreviewAudio] = useState<string[]>([]);
  const [requestFeedback, setRequestFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [fileResetKey, setFileResetKey] = useState(0);

  // Charger chants
  useEffect(() => {
    fetch(apiUrl(API_CHANTS))
      .then((r) => r.json())
      .then(setChants);

    const rawId = localStorage.getItem("utilisateur_id");
    const id = rawId && !isNaN(Number(rawId)) ? Number(rawId) : null;
    setUSER_ID(id);
    setUserEmail(localStorage.getItem("email"));
  }, []);

  useEffect(() => {
    fetch(apiUrl(API_CATEGORIES))
      .then((r) => r.json())
      .then((data) =>
        setAvailableCategories(
          sortCategoriesWithAutreLast(data.map((cat: any) => cat.nom_categorie))
        )
      )
      .catch(() => setAvailableCategories([]));
  }, []);

  // Recherche
  const searched = chants.filter((c) => {
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginatedChants = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Groupement par catégories
  const categoriesMap: Record<string, Chant[]> = {};

  paginatedChants.forEach((chant) => {
    const cats = chant.categories.length ? chant.categories : ["Autre"];
    cats.forEach((cat) => {
      if (filterCat !== "Toutes" && cat !== filterCat) return;
      if (!categoriesMap[cat]) categoriesMap[cat] = [];
      categoriesMap[cat].push(chant);
    });
  });

  // Liste catégories disponibles
  const categoriesForFilter = sortCategoriesWithAutreLast(
    Array.from(
      new Set(
        chants.flatMap((c) => (c.categories.length ? c.categories : ["Autre"]))
      )
    )
  );
  const categoryFilterOptions = ["Toutes", ...categoriesForFilter];
  const requestCategories = availableCategories.length
    ? availableCategories
    : categoriesForFilter;

  const toggleRequestForm = () => {
    if (!USER_ID || !userEmail) {
      alert("Connecte-toi pour demander l'ajout d'un chant.");
      return;
    }
    setShowRequestForm((prev) => !prev);
    setRequestFeedback(null);
  };

  const resetRequestFormState = () => {
    setRequestForm(requestInitialState);
    setRequestSelectedCats([]);
    setRequestPreviewIllustration(undefined);
    setRequestPreviewPDF(undefined);
    setRequestPreviewPartition(undefined);
    setRequestPreviewAudio([]);
    setFileResetKey((k) => k + 1);
  };

  const handleRequestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;

    if (name === "new_audio" && files) {
      const fileList = Array.from(files);
      setRequestForm((prev) => ({ ...prev, new_audio: [...prev.new_audio, ...fileList] }));
      setRequestPreviewAudio((prev) => [...prev, ...fileList.map((f) => f.name)]);
      return;
    }

    if (files && files[0]) {
      const file = files[0];
      setRequestForm((prev) => ({ ...prev, [name]: file }));
      if (name === "illustration_chant") setRequestPreviewIllustration(URL.createObjectURL(file));
      if (name === "paroles_pdf") setRequestPreviewPDF(file.name);
      if (name === "partition") setRequestPreviewPartition(file.name);
      return;
    }

    setRequestForm((prev) => ({ ...prev, [name]: value }));
  };

  const removeRequestAudio = (index: number) => {
    setRequestForm((prev) => {
      const copy = [...prev.new_audio];
      copy.splice(index, 1);
      return { ...prev, new_audio: copy };
    });

    setRequestPreviewAudio((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
    setFileResetKey((k) => k + 1);
  };

  const clearIllustration = () => {
    setRequestForm((prev) => ({ ...prev, illustration_chant: null }));
    setRequestPreviewIllustration(undefined);
    setFileResetKey((k) => k + 1);
  };

  const clearPDF = () => {
    setRequestForm((prev) => ({ ...prev, paroles_pdf: null }));
    setRequestPreviewPDF(undefined);
    setFileResetKey((k) => k + 1);
  };

  const clearPartition = () => {
    setRequestForm((prev) => ({ ...prev, partition: null }));
    setRequestPreviewPartition(undefined);
    setFileResetKey((k) => k + 1);
  };

  const submitRequest = async () => {
    if (!USER_ID || !userEmail) {
      alert("Connecte-toi pour faire une demande.");
      return;
    }

    if (!requestForm.nom_chant.trim()) {
      setRequestFeedback({ type: "error", message: "Indique au minimum le nom du chant et les paroles du chant." });
      return;
    }

    setRequestSubmitting(true);
    setRequestFeedback(null);

    try {
      const fd = new FormData();
      fd.append("nom_chant", requestForm.nom_chant);
      fd.append("auteur", requestForm.auteur);
      fd.append("ville_origine", requestForm.ville_origine);
      fd.append("paroles", requestForm.paroles);
      fd.append("description", requestForm.description);

      const catsToSend =
        requestSelectedCats.length > 0 ? requestSelectedCats : ["Autre"];
      catsToSend.forEach((cat) => fd.append("categories", cat));

      if (requestForm.illustration_chant)
        fd.append("illustration_chant", requestForm.illustration_chant);
      if (requestForm.paroles_pdf)
        fd.append("paroles_pdf", requestForm.paroles_pdf);
      if (requestForm.partition)
        fd.append("partition", requestForm.partition);

      requestForm.new_audio.forEach((file) => fd.append("new_audio", file));

      const res = await fetch(apiUrl(API_DEMANDES_CHANTS), {
        method: "POST",
        headers: { "X-User-Email": userEmail },
        body: fd,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Erreur lors de l'envoi de la demande.");
      }

      setRequestFeedback({ type: "success", message: "Ta demande a bien été envoyée !" });
      resetRequestFormState();
      setShowRequestForm(false);
    } catch (err: any) {
      setRequestFeedback({ type: "error", message: err.message || "Impossible d'envoyer la demande." });
    } finally {
      setRequestSubmitting(false);
    }
  };

  return (
    <div className="px-10 py-10 flex flex-col gap-10 w-full">
      <h1 className="text-3xl font-bold text-bordeau">Liste de chants</h1>

      {/* Recherche + filtre */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Rechercher un chant..."
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
          {categoryFilterOptions.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className={`text-sm ${USER_ID ? "text-bordeau font-semibold" : "text-gray-600"}`}>
            Propose un nouveau chant à la communauté
          </p>
          <button
            onClick={toggleRequestForm}
            className={`btn ${
              USER_ID
                ? showRequestForm
                  ? "btn-danger"
                  : "btn-solid"
                : "btn-secondary cursor-not-allowed opacity-60"
            }`}
            disabled={!USER_ID}
          >
            <span className="text-lg leading-none">{showRequestForm ? "×" : "+"}</span>
            {showRequestForm ? "Fermer le formulaire" : "Faire une demande d'ajout"}
          </button>
        </div>
        {!USER_ID && (
          <div>
            <p className="text-xs text-gray-500">
              Connecte-toi pour demander l'ajout d'un chant.
            </p>
            <p className="text-xs text-gray-500">
              Connecte-toi pour mettre des chants en favoris.
            </p>
          </div>
        )}
        {requestFeedback && (
          <p
            className={`text-sm ${
              requestFeedback.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {requestFeedback.message}
          </p>
        )}
      </div>

      {showRequestForm && USER_ID && (
        <section className="rounded-xl border border-bordeau/40 bg-white p-6 shadow flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-bordeau">
              Demander l'ajout d'un chant
            </h2>
            <button
              className="btn btn-ghost text-sm"
              onClick={resetRequestFormState}
            >
              Réinitialiser
            </button>
          </div>

          <div className="grid gap-4">
            <input
              name="nom_chant"
              placeholder="Nom du chant"
              value={requestForm.nom_chant}
              onChange={handleRequestChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-bordeau"
            />
            <input
              name="auteur"
              placeholder="Auteur"
              value={requestForm.auteur}
              onChange={handleRequestChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-bordeau"
            />
            <input
              name="ville_origine"
              placeholder="Ville d'origine"
              value={requestForm.ville_origine}
              onChange={handleRequestChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-bordeau"
            />
            <textarea
              name="paroles"
              placeholder="Paroles"
              value={requestForm.paroles}
              onChange={handleRequestChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-bordeau h-28"
            />
            <textarea
              name="description"
              placeholder="Description"
              value={requestForm.description}
              onChange={handleRequestChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-bordeau h-20"
            />
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Catégories</h3>
            <div className="flex flex-wrap gap-2">
              {(requestCategories.length ? requestCategories : ["Autre"]).map((cat) => (
                <label
                  key={cat}
                  className={`px-3 py-1 border rounded-full cursor-pointer ${
                    requestSelectedCats.includes(cat)
                      ? "bg-bordeau text-white border-bordeau"
                      : "border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={requestSelectedCats.includes(cat)}
                    onChange={() => {
                      if (requestSelectedCats.includes(cat)) {
                        setRequestSelectedCats(requestSelectedCats.filter((c) => c !== cat));
                      } else {
                        setRequestSelectedCats([...requestSelectedCats, cat]);
                      }
                    }}
                  />
                  {cat}
                </label>
              ))}
            </div>
            {requestSelectedCats.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                (Sans sélection, ta demande ira dans la catégorie "Autre")
              </p>
            )}
          </div>

          <div className="grid gap-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Illustration</span>
                <div className="flex gap-2 items-center">
                  <input
                    key={`illustration-${fileResetKey}`}
                    id={`illustration-${fileResetKey}`}
                    type="file"
                    name="illustration_chant"
                    accept="image/*"
                    className="hidden"
                    onChange={handleRequestChange}
                  />
                  {!requestPreviewIllustration ? (
                    <label
                      htmlFor={`illustration-${fileResetKey}`}
                      className="btn btn-ghost text-sm"
                    >
                      Ajouter un fichier
                    </label>
                  ) : (
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`illustration-${fileResetKey}`}
                        className="btn btn-outline text-xs px-2 py-1"
                      >
                        Changer
                      </label>
                      <button
                        className="btn btn-danger text-xs px-2 py-1"
                        onClick={clearIllustration}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {requestPreviewIllustration && (
                <img
                  src={requestPreviewIllustration}
                  className="mt-2 h-40 w-full max-w-md object-cover rounded-xl shadow"
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Paroles PDF</span>
                <div className="flex gap-2 items-center">
                  <input
                    key={`pdf-${fileResetKey}`}
                    id={`pdf-${fileResetKey}`}
                    type="file"
                    name="paroles_pdf"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleRequestChange}
                  />
                  {!requestPreviewPDF ? (
                    <label
                      htmlFor={`pdf-${fileResetKey}`}
                      className="btn btn-ghost text-sm"
                    >
                      Ajouter un fichier
                    </label>
                  ) : (
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`pdf-${fileResetKey}`}
                        className="btn btn-outline text-xs px-2 py-1"
                      >
                        Changer
                      </label>
                      <button
                        className="btn btn-danger text-xs px-2 py-1"
                        onClick={clearPDF}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {requestPreviewPDF && <p className="mt-1 text-sm">📄 {requestPreviewPDF}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Partition</span>
                <div className="flex gap-2 items-center">
                  <input
                    key={`partition-${fileResetKey}`}
                    id={`partition-${fileResetKey}`}
                    type="file"
                    name="partition"
                    accept=".pdf,.png,.jpg"
                    className="hidden"
                    onChange={handleRequestChange}
                  />
                  {!requestPreviewPartition ? (
                    <label
                      htmlFor={`partition-${fileResetKey}`}
                      className="btn btn-ghost text-sm"
                    >
                      Ajouter un fichier
                    </label>
                  ) : (
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`partition-${fileResetKey}`}
                        className="btn btn-outline text-xs px-2 py-1"
                      >
                        Changer
                      </label>
                      <button
                        className="btn btn-danger text-xs px-2 py-1"
                        onClick={clearPartition}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {requestPreviewPartition && <p className="mt-1 text-sm">🎵 {requestPreviewPartition}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Pistes audio (MP3 / M4A)</span>
                <div className="flex items-center gap-2">
                  <input
                    key={`audio-${fileResetKey}`}
                    id={`audio-${fileResetKey}`}
                    type="file"
                    name="new_audio"
                    multiple
                    accept=".mp3,.m4a"
                    className="hidden"
                    onChange={handleRequestChange}
                  />
                  <label
                    htmlFor={`audio-${fileResetKey}`}
                    className="btn btn-ghost text-sm"
                  >
                    Ajouter un fichier
                  </label>
                  {requestPreviewAudio.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline text-xs px-2 py-1"
                      onClick={() => {
                        setRequestForm((prev) => ({ ...prev, new_audio: [] }));
                        setRequestPreviewAudio([]);
                        setFileResetKey((k) => k + 1);
                      }}
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
              </div>
              {requestPreviewAudio.map((file, index) => (
                <div key={`${file}-${index}`} className="flex items-center gap-3 mt-1">
                  <p className="text-sm">🎧 {file}</p>
                  <button
                    onClick={() => removeRequestAudio(index)}
                    className="btn btn-danger text-sm px-3 py-1"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={() => {
                resetRequestFormState();
                setShowRequestForm(false);
              }}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={submitRequest}
              disabled={requestSubmitting}
              className="btn btn-solid disabled:opacity-60"
            >
              {requestSubmitting ? "Envoi en cours..." : "Confirmer ma demande d'ajout du chant"}
            </button>
          </div>
        </section>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">
          Aucun chant ne correspond à ta recherche.
        </p>
      ) : (
        <>
          {sortCategoriesWithAutreLast(Object.keys(categoriesMap)).map((cat) => {
            const list = categoriesMap[cat].sort((a, b) =>
              a.nom_chant.localeCompare(b.nom_chant, "fr")
            );

            return (
              <div key={cat}>
                <h2 className="text-2xl font-bold text-bordeau mt-6 mb-3">{cat}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {list.map((ch) => (
                    <div
                      key={ch.id}
                      onClick={() => (window.location.href = `/chants/${ch.id}`)}
                      className="border border-bordeau/30 rounded-xl p-5 shadow bg-white cursor-pointer hover:bg-bordeau/5 transition"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold text-bordeau">
                          {ch.nom_chant}
                        </h3>

                        {/* FAVORIS */}
                        <span onClick={(e) => e.stopPropagation()}>
                          {USER_ID ? (
                            <FavoriButton chantId={ch.id} USER_ID={USER_ID} size={34} />
                          ) : (
                            <div
                              className="opacity-40 cursor-not-allowed border border-bordeau/30 rounded-full p-2"
                              title="Connecte-toi pour ajouter aux favoris"
                            >
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="#8B5CF6">
                                <path d="M12 21s-6.2-4.3-9.3-7.4C-1 11-.5 6.5 2.3 4.2 5.1 1.9 9 3 12 6c3-3 6.9-4.1 9.7-1.8 2.8 2.3 3.3 6.8.6 9.4C18.2 16.7 12 21 12 21z"/>
                              </svg>
                            </div>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filtered.length > PER_PAGE && (
            <div className="flex justify-center gap-3 mt-6">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`btn ${page === i + 1 ? "btn-solid" : "btn-ghost"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
