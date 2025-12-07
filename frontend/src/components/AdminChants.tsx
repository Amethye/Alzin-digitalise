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
};

type FormState = {
  nom_chant: string;
  auteur: string;
  ville_origine: string;
  paroles: string;
  description: string;
  illustration_chant: File | null;
  paroles_pdf: File | null;
  partition: File | null;
};

const API_URL = "http://127.0.0.1:8000/api/chants/";

const initialForm: FormState = {
  nom_chant: "",
  auteur: "",
  ville_origine: "",
  paroles: "",
  description: "",
  illustration_chant: null,
  paroles_pdf: null,
  partition: null,
};

export default function AdminChants() {
  const [chants, setChants] = useState<Chant[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  /** PREVIEWS — filenames or URLs */
  const [previewIllustration, setPreviewIllustration] = useState<string | null>(null);
  const [previewPDF, setPreviewPDF] = useState<string | null>(null);
  const [previewPartition, setPreviewPartition] = useState<string | null>(null);

  /** Charger les chants */
  const loadChants = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    setChants(data);
  };

  useEffect(() => {
    loadChants();
  }, []);

  /** GESTION FORMULAIRE */
  const handleChange = (e: any) => {
    const { name, value, files } = e.target;

    if (files && files.length > 0) {
      const file = files[0];
      setForm((f) => ({ ...f, [name]: file }));

      // Preview selon type
      if (name === "illustration_chant") {
        setPreviewIllustration(URL.createObjectURL(file));
      }
      if (name === "paroles_pdf") {
        setPreviewPDF(file.name);
      }
      if (name === "partition") {
        setPreviewPartition(file.name);
      }
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  /** RESET DES FICHIERS */
  const clearIllustration = () => {
    setForm((f) => ({ ...f, illustration_chant: null }));
    setPreviewIllustration(null);
  };

  const clearPDF = () => {
    setForm((f) => ({ ...f, paroles_pdf: null }));
    setPreviewPDF(null);
  };

  const clearPartition = () => {
    setForm((f) => ({ ...f, partition: null }));
    setPreviewPartition(null);
  };

  /** MODIFICATION */
  const startEdit = (c: Chant) => {
    setEditingId(c.id);
    setForm({
      nom_chant: c.nom_chant,
      auteur: c.auteur ?? "",
      ville_origine: c.ville_origine ?? "",
      paroles: c.paroles,
      description: c.description ?? "",
      illustration_chant: null,
      paroles_pdf: null,
      partition: null,
    });

    setPreviewIllustration(c.illustration_chant_url ?? null);
    setPreviewPDF(c.paroles_pdf_url ? c.paroles_pdf_url.split("/").pop() ?? null : null);
    setPreviewPartition(c.partition_url ? c.partition_url.split("/").pop() ?? null : null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setPreviewIllustration(null);
    setPreviewPDF(null);
    setPreviewPartition(null);
  };

  /** ENREGISTRER / AJOUTER */
  const saveChant = async (id?: number) => {
    const formData = new FormData();

    formData.append("nom_chant", form.nom_chant);
    formData.append("auteur", form.auteur || "");
    formData.append("ville_origine", form.ville_origine || "");
    formData.append("paroles", form.paroles);
    formData.append("description", form.description || "");

    if (form.illustration_chant) formData.append("illustration_chant", form.illustration_chant);
    if (form.paroles_pdf) formData.append("paroles_pdf", form.paroles_pdf);
    if (form.partition) formData.append("partition", form.partition);

    const method = id ? "PUT" : "POST";
    const url = id ? `${API_URL}${id}/` : API_URL;

    const res = await fetch(url, { method, body: formData });

    if (!res.ok) {
      alert("Erreur lors de l’enregistrement.");
      return;
    }

    cancelEdit();
    loadChants();
  };

  /** SUPPRESSION */
  const deleteChant = async (id: number) => {
    if (!confirm("Supprimer ce chant ?")) return;

    const res = await fetch(`${API_URL}${id}/`, { method: "DELETE" });
    if (res.ok) loadChants();
  };

  // ------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-10 p-8 w-full">

      {/* FORMULAIRE */}
      <section className="w-full rounded-xl border border-mauve/40 bg-white p-8 shadow-md">
        <h2 className="text-2xl font-bold text-mauve mb-6">
          {editingId ? "Modifier un chant" : "Ajouter un chant"}
        </h2>

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
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm h-28 focus:ring-2 focus:ring-mauve"
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

        {/* UPLOADS --------------------------------------------------- */}

        {/* Illustration */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-800">Illustration</span>

            <label className="inline-flex cursor-pointer items-center rounded-lg bg-mauve px-5 py-2 text-white text-sm font-semibold hover:bg-purple-600 transition">
              {previewIllustration ? "Changer" : "Choisir un fichier"}
              <input
                type="file"
                accept="image/*"
                name="illustration_chant"
                className="hidden"
                onChange={handleChange}
              />
            </label>
          </div>

          {previewIllustration && (
            <div className="flex flex-col items-center mt-3">
              <img
                src={previewIllustration}
                className="rounded-xl shadow w-full max-w-lg h-48 object-cover"
              />
              <button
                type="button"
                onClick={clearIllustration}
                className="mt-2 text-red-600 font-semibold text-sm hover:underline"
              >
                Retirer le fichier
              </button>
            </div>
          )}
        </div>

        {/* PDF */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-800">Paroles PDF</span>

            <label className="inline-flex cursor-pointer items-center rounded-lg bg-mauve px-5 py-2 text-white text-sm font-semibold hover:bg-purple-600 transition">
              {previewPDF ? "Changer" : "Choisir un fichier"}
              <input
                type="file"
                accept="application/pdf"
                name="paroles_pdf"
                className="hidden"
                onChange={handleChange}
              />
            </label>
          </div>

          {previewPDF && (
            <div className="flex flex-col items-center mt-2">
              <p className="text-sm text-gray-700 italic">📄 {previewPDF}</p>
              <button
                type="button"
                onClick={clearPDF}
                className="mt-1 text-red-600 font-semibold text-sm hover:underline"
              >
                Retirer le fichier
              </button>
            </div>
          )}
        </div>

        {/* Partition */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-800">Partition</span>

            <label className="inline-flex cursor-pointer items-center rounded-lg bg-mauve px-5 py-2 text-white text-sm font-semibold hover:bg-purple-600 transition">
              {previewPartition ? "Changer" : "Choisir un fichier"}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                name="partition"
                className="hidden"
                onChange={handleChange}
              />
            </label>
          </div>

          {previewPartition && (
            <div className="flex flex-col items-center mt-2">
              <p className="text-sm text-gray-700 italic">🎵 {previewPartition}</p>
              <button
                type="button"
                onClick={clearPartition}
                className="mt-1 text-red-600 font-semibold text-sm hover:underline"
              >
                Retirer le fichier
              </button>
            </div>
          )}
        </div>

        {/* BOUTON ENREGISTRER */}
        <button
          onClick={() => saveChant(editingId ?? undefined)}
          className="mt-8 w-full rounded-xl bg-mauve px-6 py-3 text-white text-lg font-semibold shadow hover:bg-purple-600 transition"
        >
          {editingId ? "Mettre à jour" : "Ajouter"}
        </button>
      </section>

      {/* LISTE DES CHANTS */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {chants.map((c) => (
          <div key={c.id} className="rounded-xl border border-mauve/30 bg-white shadow p-6">

            <h3 className="text-xl font-bold text-mauve">{c.nom_chant}</h3>

            {c.auteur && <p className="text-sm text-gray-600">{c.auteur}</p>}
            {c.ville_origine && <p className="text-sm italic text-gray-700">{c.ville_origine}</p>}
            {c.description && <p className="mt-3 text-gray-800">{c.description}</p>}

            {c.illustration_chant_url && (
              <img
                src={c.illustration_chant_url}
                className="mt-4 rounded-xl w-full h-40 object-cover shadow"
              />
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
      </section>
    </div>
  );
}