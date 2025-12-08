import React, { useEffect, useState } from "react";

type Chant = {
  id: number;
  nom_chant: string;
  auteur: string | null;
  ville_origine: string | null;
  illustration_chant_url?: string;
  paroles: string;
  paroles_pdf_url?: string;
  description: string | null;
  partition_url?: string;
  categories: string[];
  pistes_audio: {
    id: number;
    fichier_mp3: string | null;
  }[];
};

type FormState = {
  nom_chant: string;
  auteur: string;
  ville_origine: string;
  paroles: string;
  description: string;
  categories: string[];

  illustration_chant: File | null;
  paroles_pdf: File | null;
  partition: File | null;

  new_audio: File | null;
};

const API_CHANTS = "http://127.0.0.1:8000/api/chants/";
const API_CATEGORIES = "http://127.0.0.1:8000/api/categories/";
const API_AUDIO = "http://127.0.0.1:8000/api/pistes-audio/";

const initialForm: FormState = {
  nom_chant: "",
  auteur: "",
  ville_origine: "",
  paroles: "",
  description: "",
  categories: [],

  illustration_chant: null,
  paroles_pdf: null,
  partition: null,

  new_audio: null,
};

export default function AdminChants() {
  const [chants, setChants] = useState<Chant[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const [search, setSearch] = useState("");
  const [showCatMenu, setShowCatMenu] = useState(false);

  // PREVIEWS
  const [previewIllustration, setPreviewIllustration] = useState<string | undefined>(undefined);
  const [previewPDF, setPreviewPDF] = useState<string | undefined>(undefined);
  const [previewPartition, setPreviewPartition] = useState<string | undefined>(undefined);

  // LOAD
  useEffect(() => {
    fetch(API_CHANTS).then(r => r.json()).then(setChants);
    fetch(API_CATEGORIES)
      .then(r => r.json())
      .then((cats) => setCategories(cats.map((c: any) => c.nom_categorie)));
  }, []);

  // INPUT HANDLER
  const handleChange = (e: any) => {
    const { name, value, files } = e.target;

    if (files) {
      const file = files[0];
      setForm((f) => ({ ...f, [name]: file }));

      if (name === "illustration_chant") setPreviewIllustration(URL.createObjectURL(file));
      if (name === "paroles_pdf") setPreviewPDF(file.name);
      if (name === "partition") setPreviewPartition(file.name);

      return;
    }

    setForm((f) => ({ ...f, [name]: value }));
  };

  // CLEAR FILES
  const clearIllustration = () => {
    setForm((f) => ({ ...f, illustration_chant: null }));
    setPreviewIllustration(undefined);
  };

  const clearPDF = () => {
    setForm((f) => ({ ...f, paroles_pdf: null }));
    setPreviewPDF(undefined);
  };

  const clearPartition = () => {
    setForm((f) => ({ ...f, partition: null }));
    setPreviewPartition(undefined);
  };

  // START EDIT
  const startEdit = (c: Chant) => {
    setEditingId(c.id);
    setForm({
      nom_chant: c.nom_chant,
      auteur: c.auteur || "",
      ville_origine: c.ville_origine || "",
      paroles: c.paroles,
      description: c.description || "",
      categories: c.categories,

      illustration_chant: null,
      paroles_pdf: null,
      partition: null,
      new_audio: null,
    });

    setPreviewIllustration(c.illustration_chant_url ?? undefined);
    setPreviewPDF(c.paroles_pdf_url ? c.paroles_pdf_url.split("/").pop() ?? undefined : undefined);
    setPreviewPartition(c.partition_url ? c.partition_url.split("/").pop() ?? undefined : undefined);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setPreviewIllustration(undefined);
    setPreviewPDF(undefined);
    setPreviewPartition(undefined);
  };

  /** SAVE (CREATE + UPDATE) */
  const saveChant = async (id?: number) => {
    const formData = new FormData();

    formData.append("nom_chant", form.nom_chant);
    formData.append("auteur", form.auteur || "");
    formData.append("ville_origine", form.ville_origine || "");
    formData.append("paroles", form.paroles);
    formData.append("description", form.description || "");

    // Catégories → liste JSON
    formData.append("categories", JSON.stringify(form.categories));

    if (form.illustration_chant) formData.append("illustration_chant", form.illustration_chant);
    if (form.paroles_pdf) formData.append("paroles_pdf", form.paroles_pdf);
    if (form.partition) formData.append("partition", form.partition);

    const method = id ? "PUT" : "POST";
    const url = id ? `${API_CHANTS}${id}/` : API_CHANTS;

    const res = await fetch(url, { method, body: formData });
    if (!res.ok) return alert("Erreur lors de l’enregistrement.");

    // Upload audio si présent
    if (form.new_audio && (id || res.ok)) {
      const chantId = id ?? (await res.json()).id;
      const audioData = new FormData();
      audioData.append("fichier_mp3", form.new_audio);
      audioData.append("chant_id", chantId.toString());
      await fetch(API_AUDIO, { method: "POST", body: audioData });
    }

    cancelEdit();
    fetch(API_CHANTS).then(r => r.json()).then(setChants);
  };

  /** DELETE CHANT */
  const deleteChant = async (id: number) => {
    if (!confirm("Supprimer ce chant ?")) return;

    const res = await fetch(`${API_CHANTS}${id}/`, { method: "DELETE" });
    if (res.ok) fetch(API_CHANTS).then(r => r.json()).then(setChants);
  };

  /** DELETE une piste audio */
  const deleteAudio = async (audioId: number) => {
    if (!confirm("Supprimer cette piste audio ?")) return;
    await fetch(`http://127.0.0.1:8000/api/pistes-audio/${audioId}/`, {
      method: "DELETE",
    });
    fetch(API_CHANTS).then(r => r.json()).then(setChants);
  };

  /** GROUP BY CATEGORIES + SEARCH */
  const chantsParCategorie: Record<string, Chant[]> = {};

  chants
    .filter((c) =>
      c.nom_chant.toLowerCase().includes(search.toLowerCase())
    )
    .forEach((c) => {
      if (c.categories.length === 0) {
        chantsParCategorie["Sans catégorie"] ??= [];
        chantsParCategorie["Sans catégorie"].push(c);
      } else {
        c.categories.forEach((cat) => {
          chantsParCategorie[cat] ??= [];
          chantsParCategorie[cat].push(c);
        });
      }
    });

  return (
    <div className="flex flex-col gap-10 p-8 w-full">

      {/* ------------------------------ */}
      {/* BARRE DE RECHERCHE */}
      {/* ------------------------------ */}
      <input
        type="text"
        placeholder="Rechercher un chant..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-mauve"
      />

      {/* ------------------------------ */}
      {/* FORMULAIRE */}
      {/* ------------------------------ */}
      <section className="w-full rounded-xl border border-mauve/40 bg-white p-8 shadow-md">
        <h2 className="text-2xl font-bold text-mauve mb-6">
          {editingId ? "Modifier un chant" : "Ajouter un chant"}
        </h2>

        {/* TEXT FIELDS */}
        <div className="grid gap-4 w-full">
          <input
            name="nom_chant"
            placeholder="Nom du chant *"
            value={form.nom_chant}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-mauve"
            required
          />
          <input
            name="auteur"
            placeholder="Auteur"
            value={form.auteur}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-mauve"
          />
          <input
            name="ville_origine"
            placeholder="Ville d'origine"
            value={form.ville_origine}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-mauve"
          />

          <textarea
            name="paroles"
            placeholder="Paroles *"
            value={form.paroles}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm h-32 focus:ring-2 focus:ring-mauve"
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm h-24 focus:ring-2 focus:ring-mauve"
          />
        </div>

        {/* ------------------------------ */}
        {/* CATEGORIES (MENU DÉROULANT) */}
        {/* ------------------------------ */}
        <div className="mt-6">
          <h3 className="font-semibold text-lg text-gray-800 mb-2">Catégories</h3>

          <div className="relative inline-block w-full">
            <button
              type="button"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-left shadow-sm focus:ring-2 focus:ring-mauve"
              onClick={() => setShowCatMenu((v) => !v)}
            >
              {form.categories.length === 0
                ? "Sélectionner des catégories"
                : form.categories.join(", ")}
            </button>

            {showCatMenu && (
              <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-300 bg-white shadow-lg max-h-60 overflow-y-auto">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    onClick={() => {
                      setForm((f) =>
                        f.categories.includes(cat)
                          ? { ...f, categories: f.categories.filter((c) => c !== cat) }
                          : { ...f, categories: [...f.categories, cat] }
                      );
                    }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.categories.includes(cat)}
                      readOnly
                    />
                    <span>{cat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ajouter nouvelle catégorie */}
          <input
            placeholder="Ajouter une catégorie..."
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                const val = e.currentTarget.value.trim();
                if (!val) return;
                await fetch(API_CATEGORIES, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ nom_categorie: val }),
                });
                setCategories((prev) => [...prev, val]);
                setForm((f) => ({ ...f, categories: [...f.categories, val] }));
                e.currentTarget.value = "";
              }
            }}
            className="mt-3 rounded-xl border border-gray-300 px-4 py-2 shadow-sm w-full focus:ring-2 focus:ring-mauve"
          />
        </div>

        {/* ------------------------------ */}
        {/* UPLOAD ILLUSTRATION */}
        {/* ------------------------------ */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Illustration</span>
            <label className="inline-flex cursor-pointer items-center rounded-lg bg-mauve px-5 py-2 text-white font-semibold hover:bg-purple-600 transition">
              {previewIllustration ? "Changer" : "Choisir un fichier"}
              <input type="file" accept="image/*" name="illustration_chant" className="hidden" onChange={handleChange} />
            </label>
          </div>

          {previewIllustration && (
            <div className="mt-3 flex flex-col items-center">
              <img src={previewIllustration} className="w-full max-w-lg h-48 rounded-xl shadow object-cover" />
              <button onClick={clearIllustration} className="mt-2 text-red-600 font-semibold text-sm">
                Retirer le fichier
              </button>
            </div>
          )}
        </div>

        {/* ------------------------------ */}
        {/* UPLOAD PDF */}
        {/* ------------------------------ */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Paroles PDF</span>
            <label className="inline-flex cursor-pointer items-center rounded-lg bg-mauve px-5 py-2 text-white font-semibold hover:bg-purple-600 transition">
              {previewPDF ? "Changer" : "Choisir un fichier"}
              <input type="file" accept="application/pdf" name="paroles_pdf" className="hidden" onChange={handleChange} />
            </label>
          </div>

          {previewPDF && (
            <div className="mt-2 flex flex-col items-center">
              <p className="text-gray-700 text-sm">📄 {previewPDF}</p>
              <button onClick={clearPDF} className="mt-1 text-red-600 font-semibold text-sm">
                Retirer le fichier
              </button>
            </div>
          )}
        </div>

        {/* ------------------------------ */}
        {/* UPLOAD PARTITION */}
        {/* ------------------------------ */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Partition</span>
            <label className="inline-flex cursor-pointer items-center rounded-lg bg-mauve px-5 py-2 text-white font-semibold hover:bg-purple-600 transition">
              {previewPartition ? "Changer" : "Choisir un fichier"}
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" name="partition" className="hidden" onChange={handleChange} />
            </label>
          </div>

          {previewPartition && (
            <div className="mt-2 flex flex-col items-center">
              <p className="text-gray-700 text-sm">🎵 {previewPartition}</p>
              <button onClick={clearPartition} className="mt-1 text-red-600 font-semibold text-sm">
                Retirer le fichier
              </button>
            </div>
          )}
        </div>

        {/* ------------------------------ */}
        {/* AUDIO MP3 */}
        {/* ------------------------------ */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Ajouter une piste audio</h3>

            <label className="inline-flex cursor-pointer items-center rounded-lg bg-mauve px-5 py-2 text-white font-semibold hover:bg-purple-600 transition">
              Ajouter MP3
              <input
                type="file"
                accept=".mp3"
                name="new_audio"
                className="hidden"
                onChange={handleChange}
              />
            </label>
          </div>

          {form.new_audio && (
            <p className="mt-2 text-sm text-gray-700">
              🎧 {form.new_audio.name}
            </p>
          )}
        </div>

        {/* ------------------------------ */}
        {/* SUBMIT */}
        {/* ------------------------------ */}
        <button
          onClick={() => saveChant(editingId ?? undefined)}
          className="mt-10 w-full bg-mauve rounded-xl px-6 py-3 text-white text-lg font-semibold hover:bg-purple-600 shadow"
        >
          {editingId ? "Mettre à jour" : "Ajouter"}
        </button>
      </section>

      {/* ------------------------------ */}
      {/* LISTE DES CHANTS PAR CATEGORIE */}
      {/* ------------------------------ */}
      <section className="mt-10">
        {Object.entries(chantsParCategorie).map(([cat, liste]) => (
          <div key={cat} className="mb-10">
            <h2 className="text-2xl font-bold text-mauve mb-4">{cat}</h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {liste.map((c) => (
                <div key={c.id} className="rounded-xl border border-mauve/30 bg-white shadow p-6">

                  <h3 className="text-xl font-bold text-mauve">{c.nom_chant}</h3>

                  {c.auteur && <p className="text-sm text-gray-600">{c.auteur}</p>}
                  {c.ville_origine && <p className="text-sm italic text-gray-700">{c.ville_origine}</p>}

                  {c.description && <p className="mt-3 text-gray-800">{c.description}</p>}

                  {c.illustration_chant_url && (
                    <img src={c.illustration_chant_url} className="mt-4 rounded-xl w-full h-40 object-cover shadow" />
                  )}

                  {/* Pistes audio */}
                  {c.pistes_audio.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm text-gray-700">Pistes audio :</h4>

                      {c.pistes_audio.map((pa) => (
                        <div key={pa.id} className="mt-2 bg-gray-50 rounded-lg p-3 shadow-sm">

                          {/* Prévisualisation audio */}
                          <audio
                            controls
                            className="w-full"
                            src={pa.fichier_mp3 ?? undefined}
                          />

                          <div className="flex justify-between mt-2">
                            <span className="text-xs text-gray-600">MP3 #{pa.id}</span>

                            <button
                              onClick={() => deleteAudio(pa.id)}
                              className="text-red-600 font-bold hover:text-red-800"
                            >
                              ✖
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => startEdit(c)}
                      className="rounded bg-yellow-500 text-white px-4 py-1 shadow hover:bg-yellow-600"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => deleteChant(c.id)}
                      className="rounded bg-red-600 text-white px-4 py-1 shadow hover:bg-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}