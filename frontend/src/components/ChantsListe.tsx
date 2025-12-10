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
  pistes_audio: { id: number; fichier_mp3: string }[];
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
  const searched = chants.filter((c) =>
    `${c.nom_chant} ${c.auteur} ${c.ville_origine}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Filtre catégorie
  const filtered = searched.filter((c) =>
    filterCat === "Toutes"
      ? true
      : (c.categories.length ? c.categories : ["Autre"]).includes(filterCat)
  );

  // Groupement par catégories
  const categoriesMap: Record<string, Chant[]> = {};

  filtered.forEach((chant) => {
    const cats = chant.categories.length ? chant.categories : ["Autre"];
    cats.forEach((cat) => {
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
      setRequestFeedback({ type: "error", message: "Indique au minimum le nom du chant." });
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
      <h1 className="text-3xl font-bold text-mauve">Liste de chants</h1>

      {/* Recherche + filtre */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Rechercher un chant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-mauve/40 p-3 rounded-lg flex-1"
        />

        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="border border-mauve/40 p-3 rounded-lg w-full md:w-60"
        >
          {categoryFilterOptions.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
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
          <p className="text-xs text-gray-500">
            Connecte-toi pour demander l'ajout d'un chant.
          </p>
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
        <section className="rounded-xl border border-mauve/40 bg-white p-6 shadow flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-mauve">
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
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve"
            />
            <input
              name="auteur"
              placeholder="Auteur"
              value={requestForm.auteur}
              onChange={handleRequestChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve"
            />
            <input
              name="ville_origine"
              placeholder="Ville d'origine"
              value={requestForm.ville_origine}
              onChange={handleRequestChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve"
            />
            <textarea
              name="paroles"
              placeholder="Paroles"
              value={requestForm.paroles}
              onChange={handleRequestChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve h-28"
            />
            <textarea
              name="description"
              placeholder="Description"
              value={requestForm.description}
              onChange={handleRequestChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve h-20"
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
                      ? "bg-mauve text-white border-mauve"
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
                <div className="flex gap-2">
                  <label className="btn btn-solid cursor-pointer text-sm">
                    {requestPreviewIllustration ? "Changer" : "Ajouter"}
                    <input
                      key={`illustration-${fileResetKey}`}
                      type="file"
                      name="illustration_chant"
                      accept="image/*"
                      className="hidden"
                      onChange={handleRequestChange}
                    />
                  </label>
                  {requestPreviewIllustration && (
                    <button
                      className="btn btn-danger text-sm"
                      onClick={clearIllustration}
                    >
                      Supprimer
                    </button>
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
                <div className="flex gap-2">
                  <label className="btn btn-solid cursor-pointer text-sm">
                    {requestPreviewPDF ? "Changer" : "Ajouter"}
                    <input
                      key={`pdf-${fileResetKey}`}
                      type="file"
                      name="paroles_pdf"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleRequestChange}
                    />
                  </label>
                  {requestPreviewPDF && (
                    <button
                      className="btn btn-danger text-sm"
                      onClick={clearPDF}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
              {requestPreviewPDF && <p className="mt-1 text-sm">📄 {requestPreviewPDF}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Partition</span>
                <div className="flex gap-2">
                  <label className="btn btn-solid cursor-pointer text-sm">
                    {requestPreviewPartition ? "Changer" : "Ajouter"}
                    <input
                      key={`partition-${fileResetKey}`}
                      type="file"
                      name="partition"
                      accept=".pdf,.png,.jpg"
                      className="hidden"
                      onChange={handleRequestChange}
                    />
                  </label>
                  {requestPreviewPartition && (
                    <button
                      className="btn btn-danger text-sm"
                      onClick={clearPartition}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
              {requestPreviewPartition && <p className="mt-1 text-sm">🎵 {requestPreviewPartition}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Pistes audio (MP3)</span>
                <label className="btn btn-solid cursor-pointer text-sm">
                  Ajouter
                  <input
                    key={`audio-${fileResetKey}-${requestPreviewAudio.length}`}
                    type="file"
                    name="new_audio"
                    multiple
                    accept=".mp3"
                    className="hidden"
                    onChange={handleRequestChange}
                  />
                </label>
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

      {/* Groupement */}
      {sortCategoriesWithAutreLast(Object.keys(categoriesMap))
        .map((cat) => {
          const list = categoriesMap[cat].sort((a, b) =>
            a.nom_chant.localeCompare(b.nom_chant, "fr")
          );

          return (
            <div key={cat}>
              <h2 className="text-2xl font-bold text-mauve mt-6 mb-3">{cat}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {list.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => (window.location.href = `/chants/${ch.id}`)}
                    className="border border-mauve/30 rounded-xl p-5 shadow bg-white cursor-pointer hover:bg-mauve/5 transition"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-mauve">
                        {ch.nom_chant}
                      </h3>

                      {/* FAVORIS → remplace tout le code précédent */}
                      {USER_ID && (
                        <span onClick={(e) => e.stopPropagation()}>
                          <FavoriButton chantId={ch.id} USER_ID={USER_ID} size={34} />
                        </span>
                      )}
                    </div>

                    {ch.auteur && (
                      <p className="mt-2 text-gray-600">
                        <strong>Auteur :</strong> {ch.auteur}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
