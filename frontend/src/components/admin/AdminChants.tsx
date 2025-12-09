import React, { useEffect, useState } from "react";

type Chant = {
  id: number;
  nom_chant: string;
  auteur: string;
  ville_origine: string;
  paroles: string;
  description: string;
  illustration_chant_url?: string;
  paroles_pdf_url?: string;
  partition_url?: string;
  categories: string[];
  pistes_audio: {
    id: number;
    fichier_mp3: string;
  }[];
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
  new_audio: File | null;
};

const API_CHANTS = "http://127.0.0.1:8000/api/chants/";
const API_CATEGORIES = "http://127.0.0.1:8000/api/categories/";
const API_APPARTENIR = "http://127.0.0.1:8000/api/appartenir/";
const API_AUDIO = "http://127.0.0.1:8000/api/pistes-audio/";

const initialForm: FormState = {
  nom_chant: "",
  auteur: "",
  ville_origine: "",
  paroles: "",
  description: "",
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
  const [newCat, setNewCat] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  // PREVIEWS
  const [previewIllustration, setPreviewIllustration] = useState<string>();
  const [previewPDF, setPreviewPDF] = useState<string>();
  const [previewPartition, setPreviewPartition] = useState<string>();

  // FILTRES
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Toutes");
  const [order, setOrder] = useState("AZ");

  // PAGINATION
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const loadData = () => {
    fetch(API_CHANTS).then(r => r.json()).then(setChants);
    fetch(API_CATEGORIES).then(r => r.json()).then(data =>
      setCategories(data.map((c: any) => c.nom_categorie))
    );
  };

  useEffect(() => loadData(), []);

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
      new_audio: null,
    });
    
    setSelectedCats(c.categories || []);
    setPreviewIllustration(c.illustration_chant_url);
    setPreviewPDF(c.paroles_pdf_url?.split("/").pop());
    setPreviewPartition(c.partition_url?.split("/").pop());

    window.scrollTo({ top: 0, behavior: "smooth" })
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setPreviewIllustration(undefined);
    setPreviewPDF(undefined);
    setPreviewPartition(undefined);
    setSelectedCats([]);
  };

  const saveChant = async () => {
    const fd = new FormData();
    fd.append("nom_chant", form.nom_chant);
    fd.append("auteur", form.auteur);
    fd.append("ville_origine", form.ville_origine);
    fd.append("paroles", form.paroles);
    fd.append("description", form.description);

    // Catégories
    const finalCategories = selectedCats.length > 0 ? selectedCats : ["Autre"];
    
    finalCategories.forEach((cat) => {
      fd.append("categories", cat);
    });

    if (form.illustration_chant) fd.append("illustration_chant", form.illustration_chant);
    if (form.paroles_pdf) fd.append("paroles_pdf", form.paroles_pdf);
    if (form.partition) fd.append("partition", form.partition);

    const url = editingId ? `${API_CHANTS}${editingId}/` : API_CHANTS;
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, { method, body: fd });
    if (!res.ok) return alert("Erreur lors de l’enregistrement");

    const chantId = editingId ?? (await res.json()).id;

  
    await fetch(`${API_APPARTENIR}?chant_id=${chantId}`, {
      method: "DELETE",
    });

    for (const cat of finalCategories) {
      await fetch(API_APPARTENIR, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chant_id: chantId,
          categorie: cat,
        }),
      });
    }

    if (form.new_audio) {
      const fd2 = new FormData();
      fd2.append("fichier_mp3", form.new_audio);
      fd2.append("chant_id", chantId.toString());
      await fetch(API_AUDIO, { method: "POST", body: fd2 });
    }

    cancelEdit();
    loadData();
  };

  const deleteCategorieFromChant = async (chantId: number, cat: string) => {
    await fetch(`${API_APPARTENIR}?chant_id=${chantId}&categorie=${cat}`, {
      method: "DELETE",
    });
    loadData();
  };
  const deleteChant = async (id: number) => {
    if (!confirm("Supprimer ce chant ?")) return;

    await fetch(`${API_CHANTS}${id}/`, {
      method: "DELETE",
    });

    loadData();
  };

  const clearIllustration = () => {
    setForm(f => ({ ...f, illustration_chant: null }));
    setPreviewIllustration(undefined);
  };

  const clearPDF = () => {
    setForm(f => ({ ...f, paroles_pdf: null }));
    setPreviewPDF(undefined);
  };

  const clearPartition = () => {
    setForm(f => ({ ...f, partition: null }));
    setPreviewPartition(undefined);
  };


  const filtered = chants
    .filter(c => filterCat === "Toutes" || c.categories.includes(filterCat))
    .filter(c =>
      `${c.nom_chant} ${c.auteur} ${c.ville_origine}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) =>
      order === "AZ"
        ? a.nom_chant.localeCompare(b.nom_chant, "fr")
        : b.nom_chant.localeCompare(a.nom_chant, "fr")
    );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const displayed = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => setPage(1), [search, filterCat, order]);

  return (
    <div className="w-full min-h-screen px-10 py-8 flex flex-col gap-12">

      {/* FORMULAIRE */}
      <section className="w-full rounded-xl border border-mauve/40 bg-white p-8 shadow">
        <h2 className="text-2xl font-bold text-mauve mb-6">
          {editingId ? "Modifier un chant" : "Ajouter un chant"}
        </h2>

        {/* CHAMPS TEXTE */}
        <div className="grid gap-4 w-full">
          <input name="nom_chant" placeholder="Nom du chant" value={form.nom_chant}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve w-full"/>

          <input name="auteur" placeholder="Auteur" value={form.auteur}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve w-full"/>

          <input name="ville_origine" placeholder="Ville d'origine" value={form.ville_origine}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve w-full"/>

          <textarea name="paroles" placeholder="Paroles" value={form.paroles}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve w-full h-28" />

          <textarea name="description" placeholder="Description" value={form.description}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve w-full h-20" />
        </div>
        {/* Sélection des catégories */}
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-2">Catégories</h3>

          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <label
                key={cat}
                className={`px-3 py-1 border rounded-full cursor-pointer select-none ${
                  selectedCats.includes(cat)
                    ? "bg-mauve text-white border-mauve"
                    : "border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={selectedCats.includes(cat)}
                  onChange={() => {
                    if (selectedCats.includes(cat)) {
                      setSelectedCats(selectedCats.filter((c) => c !== cat));
                    } else {
                      setSelectedCats([...selectedCats, cat]);
                    }
                  }}
                />
                {cat}
              </label>
            ))}
          </div>

          {selectedCats.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              (Aucune catégorie → sera classé dans "Autre")
            </p>
          )}
        </div>

        {/* FICHIERS */}
        <div className="mt-8 grid gap-8">

          {/* ILLUSTRATION */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Illustration</span>
              <div className="flex gap-2">
                <label className="bg-mauve text-white px-3 py-1 rounded-lg cursor-pointer text-sm">
                  {previewIllustration ? "Changer" : "Ajouter"}
                  <input type="file" name="illustration_chant" accept="image/*"
                    className="hidden" onChange={handleChange} />
                </label>

                {previewIllustration && (
                  <button onClick={clearIllustration}
                    className="bg-red-500 text-white px-3 py-1 text-sm rounded-lg">
                    Retirer
                  </button>
                )}
              </div>
            </div>

            {previewIllustration && (
              <img src={previewIllustration}
                className="mt-2 h-40 w-full max-w-md object-cover rounded-xl shadow" />
            )}
          </div>

          {/* PDF */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Paroles PDF</span>

              <div className="flex gap-2">
                <label className="bg-mauve text-white px-3 py-1 rounded-lg cursor-pointer text-sm">
                  {previewPDF ? "Changer" : "Ajouter"}
                  <input type="file" name="paroles_pdf" accept="application/pdf"
                    className="hidden" onChange={handleChange} />
                </label>

                {previewPDF && (
                  <button onClick={clearPDF}
                    className="bg-red-500 text-white px-3 py-1 text-sm rounded-lg">
                    Retirer
                  </button>
                )}
              </div>
            </div>

            {previewPDF && (
              <p className="mt-1 text-gray-700 text-sm">📄 {previewPDF}</p>
            )}
          </div>

          {/* PARTITION */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Partition</span>

              <div className="flex gap-2">
                <label className="bg-mauve text-white px-3 py-1 rounded-lg cursor-pointer text-sm">
                  {previewPartition ? "Changer" : "Ajouter"}
                  <input type="file" name="partition" accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden" onChange={handleChange} />
                </label>

                {previewPartition && (
                  <button onClick={clearPartition}
                    className="bg-red-500 text-white px-3 py-1 text-sm rounded-lg">
                    Retirer
                  </button>
                )}
              </div>
            </div>

            {previewPartition && (
              <p className="mt-1 text-gray-700 text-sm">🎵 {previewPartition}</p>
            )}
          </div>

          {/* MP3 */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Piste audio (MP3)</span>

              <div className="flex gap-2">
                <label className="bg-mauve text-white px-3 py-1 rounded-lg cursor-pointer text-sm">
                  {form.new_audio ? "Changer" : "Ajouter"}
                  <input type="file" name="new_audio" accept=".mp3"
                    className="hidden" onChange={handleChange} />
                </label>

                {form.new_audio && (
                  <button onClick={() => setForm(f => ({ ...f, new_audio: null }))}
                    className="bg-red-500 text-white px-3 py-1 text-sm rounded-lg">
                    Retirer
                  </button>
                )}
              </div>
            </div>

            {form.new_audio && (
              <p className="mt-1 text-gray-700 text-sm">🎧 {form.new_audio.name}</p>
            )}
          </div>
        </div>

        {/* BOUTON FINAL */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={saveChant}
            className="bg-mauve text-white px-6 py-3 rounded-xl text-lg font-semibold shadow hover:bg-mauve/80 transition w-full max-w-sm"
          >
            {editingId ? "Mettre à jour le chant" : "Créer le chant"}
          </button>
        </div>

      </section>

      {/* LISTE */}
      <section className="rounded-xl bg-white p-8 shadow border border-mauve/40">
        <h2 className="text-2xl font-bold text-mauve mb-6">Liste des chants</h2>

        {/* Recherche + filtres */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-mauve/50 rounded-lg p-3 flex-1"
          />

          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="border border-mauve/50 rounded-lg p-3"
          >
            <option value="Toutes">Toutes</option>
            {categories.map(cat => (
              <option key={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={order}
            onChange={e => setOrder(e.target.value)}
            className="border border-mauve/50 rounded-lg p-3"
          >
            <option value="AZ">A → Z</option>
            <option value="ZA">Z → A</option>
          </select>
        </div>

        {/* LISTE DES CHANTS */}
        <div className="flex flex-col gap-6">
          {displayed.map(c => (
            <div key={c.id} className="border rounded-xl p-4 shadow">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-mauve">{c.nom_chant}</h3>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(c)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Modifier
                  </button>

                  <button
                    onClick={() => deleteChant(c.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mt-2">
                {c.categories.map(cat => (
                  <span key={cat} className="px-3 py-1 bg-gray-200 rounded-full text-sm">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center gap-3 mt-6">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-4 py-2 rounded-lg border ${
                page === i + 1 ? "bg-mauve text-white" : "border-mauve/40"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}