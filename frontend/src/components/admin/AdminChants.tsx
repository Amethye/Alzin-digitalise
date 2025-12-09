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

  new_audio: File[]; // MULTIPLE MP3
};

const API_CHANTS = "http://100.72.62.18:8000/api/chants/";
const API_CATEGORIES = "http://100.72.62.18:8000/api/categories/";
const API_APPARTENIR = "http://100.72.62.18:8000/api/appartenir/";
const API_AUDIO = "http://100.72.62.18:8000/api/pistes-audio/";

const initialForm: FormState = {
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

export default function AdminChants() {
  const [chants, setChants] = useState<Chant[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  // PREVIEWS
  const [previewIllustration, setPreviewIllustration] = useState<string>();
  const [previewPDF, setPreviewPDF] = useState<string>();
  const [previewPartition, setPreviewPartition] = useState<string>();
  const [previewAudio, setPreviewAudio] = useState<string[]>([]);

  // FILTRES
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Toutes");
  const [order, setOrder] = useState("AZ");

  // PAGINATION
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const loadData = () => {
    fetch(API_CHANTS)
      .then((r) => r.json())
      .then(setChants);

    fetch(API_CATEGORIES)
      .then((r) => r.json())
      .then((data) => setCategories(data.map((c: any) => c.nom_categorie)));
  };

  useEffect(() => loadData(), []);

  // ---------------------------------------------------------------------
  // DELETE AUDIO (BACKEND)
  // ---------------------------------------------------------------------
  const deleteAudio = async (id: number) => {
    if (!confirm("Supprimer cette piste audio ?")) return;

    await fetch(`${API_AUDIO}${id}/`, { method: "DELETE" });
    loadData();
  };

  // ---------------------------------------------------------------------
  // REMOVE AUDIO BEFORE SAVE (LOCAL)
  // ---------------------------------------------------------------------
  const removeNewAudio = (index: number) => {
  const updated = [...form.new_audio];
  updated.splice(index, 1);

  const updatedPreview = [...previewAudio];
  updatedPreview.splice(index, 1);

  setForm((f) => ({ ...f, new_audio: updated }));
  setPreviewAudio(updatedPreview);

  resetFileInput("new_audio");
};

  // ---------------------------------------------------------------------
  // HANDLE CHANGE
  // ---------------------------------------------------------------------
  const handleChange = (e: any) => {
    const { name, value, files } = e.target;

    // MULTIPLE MP3
    if (name === "new_audio" && files) {
      const arr: File[] = Array.from(files); // <-- on force le type

      setForm((f) => ({
        ...f,
        new_audio: [...(f.new_audio ?? []), ...arr], // <-- on évite le problème "null"
      }));

      setPreviewAudio((prev) => [
        ...prev,
        ...arr.map((a: File) => a.name), // <-- TypeScript comprend le type
      ]);

      return;
    }

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

  // ---------------------------------------------------------------------
  // START EDIT
  // ---------------------------------------------------------------------
  const startEdit = (c: Chant) => {
    setEditingId(c.id);

    setForm({
      nom_chant: c.nom_chant,
      auteur: c.auteur,
      ville_origine: c.ville_origine,
      paroles: c.paroles,
      description: c.description,

      illustration_chant: null,
      paroles_pdf: null,
      partition: null,
      new_audio: [],
    });

    setSelectedCats(c.categories);
    setPreviewIllustration(c.illustration_chant_url);
    setPreviewPDF(c.paroles_pdf_url?.split("/").pop());
    setPreviewPartition(c.partition_url?.split("/").pop());
    setPreviewAudio([]);
    resetFileInput("new_audio")

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------------------------------------------------------------------
  // CANCEL EDIT
  // ---------------------------------------------------------------------
  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setSelectedCats([]);

    setPreviewIllustration(undefined);
    setPreviewPDF(undefined);
    setPreviewPartition(undefined);
    setPreviewAudio([]);
  };

  // ---------------------------------------------------------------------
  // SAVE CHANT
  // ---------------------------------------------------------------------
  const saveChant = async () => {
    const fd = new FormData();

    fd.append("nom_chant", form.nom_chant);
    fd.append("auteur", form.auteur);
    fd.append("ville_origine", form.ville_origine);
    fd.append("paroles", form.paroles);
    fd.append("description", form.description);

    // Vérification doublon
    // Empêcher les doublons même si les données ne sont pas à jour
    const exists = chants.some((c) =>
      c.nom_chant.trim().toLowerCase() === form.nom_chant.trim().toLowerCase() &&
      (editingId === null || c.id !== editingId)
    );

    if (exists) {
      alert("Un chant avec ce nom existe déjà !");
      return;
    }

    // Catégories
    const finalCategories = selectedCats.length > 0 ? selectedCats : ["Autre"];
    finalCategories.forEach((cat) => fd.append("categories", cat));

    // Fichiers
    if (form.illustration_chant)
      fd.append("illustration_chant", form.illustration_chant);

    if (form.paroles_pdf)
      fd.append("paroles_pdf", form.paroles_pdf);

    if (form.partition)
      fd.append("partition", form.partition);

    // URL + méthode
    const url = editingId ? `${API_CHANTS}${editingId}/` : API_CHANTS;
    const method = editingId ? "PUT" : "POST"; // ← CORRECTION IMPORTANTE

    const res = await fetch(url, { method, body: fd });
    if (!res.ok) return alert("Erreur lors de l’enregistrement");

    const chantId = editingId ?? (await res.json()).id;

    // Mise à jour catégories
    await fetch(`${API_APPARTENIR}?chant_id=${chantId}`, { method: "DELETE" });

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

    // Upload MP3 multiple
    for (const mp3 of form.new_audio) {
      const fd2 = new FormData();
      fd2.append("fichier_mp3", mp3);
      fd2.append("chant_id", chantId.toString());
      await fetch(API_AUDIO, { method: "POST", body: fd2 });
    }

    cancelEdit();
    loadData();
};

  // ---------------------------------------------------------------------
  // DELETE CHANT
  // ---------------------------------------------------------------------
  const deleteChant = async (id: number) => {
    if (!confirm("Supprimer ce chant ?")) return;

    await fetch(`${API_CHANTS}${id}/`, { method: "DELETE" });
    loadData();
  };
  const resetFileInput = (name: string) => {
    const el = document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
    if (el) el.value = ""; // reset complet du champ file
  };

  // ---------------------------------------------------------------------
  // FILTRES + AFFICHAGE
  // ---------------------------------------------------------------------
  const filtered = chants
    .filter((c) => filterCat === "Toutes" || c.categories.includes(filterCat))
    .filter((c) =>
      `${c.nom_chant} ${c.auteur} ${c.ville_origine}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      order === "AZ"
        ? a.nom_chant.localeCompare(b.nom_chant, "fr")
        : b.nom_chant.localeCompare(a.nom_chant, "fr")
    );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const displayed = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => setPage(1), [search, filterCat, order]);

  // ---------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------
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

        {/* CATÉGORIES */}
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-2">Catégories</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <label
                key={cat}
                className={`px-3 py-1 border rounded-full cursor-pointer ${
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
                    if (selectedCats.includes(cat))
                      setSelectedCats(selectedCats.filter((c) => c !== cat));
                    else
                      setSelectedCats([...selectedCats, cat]);
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
          <div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Illustration</span>

              <div className="flex gap-2">
                {/* BOUTON CHANGER */}
                <label className="bg-mauve text-white px-3 py-1 rounded-lg cursor-pointer text-sm">
                  {previewIllustration ? "Changer" : "Ajouter"}
                  <input
                    type="file"
                    name="illustration_chant"
                    accept="image/*"
                    className="hidden"
                    onChange={handleChange}
                  />
                </label>

                {/* BOUTON SUPPRIMER */}
                {previewIllustration && (
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
                    onClick={async () => {
                      setPreviewIllustration(undefined);
                      setForm((f) => ({ ...f, illustration_chant: null }));
                      resetFileInput("illustration_chant");

                      if (editingId) {
                        await fetch(`${API_CHANTS}${editingId}/?field=illustration`, {
                          method: "DELETE",
                        });
                        loadData();
                      }
                    }}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>

            {previewIllustration && (
              <img
                src={previewIllustration}
                className="mt-2 h-40 w-full max-w-md object-cover rounded-xl shadow"
              />
            )}
          </div>

          {/* PDF */}
          <div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Paroles PDF</span>

              <div className="flex gap-2">
                {/* CHANGER */}
                <label className="bg-mauve text-white px-3 py-1 rounded-lg cursor-pointer text-sm">
                  {previewPDF ? "Changer" : "Ajouter"}
                  <input
                    type="file"
                    name="paroles_pdf"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleChange}
                  />
                </label>

                {/* SUPPRIMER */}
                {previewPDF && (
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
                    onClick={async () => {
                      setPreviewPDF(undefined);
                      setForm((f) => ({ ...f, paroles_pdf: null }));
                      resetFileInput("paroles_pdf");

                      if (editingId) {
                        await fetch(`${API_CHANTS}${editingId}/?field=pdf`, {
                          method: "DELETE",
                        });
                        loadData();
                      }
                    }}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>

            {previewPDF && <p className="mt-1 text-sm">📄 {previewPDF}</p>}
          </div>

          {/* PARTITION */}
          <div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Partition</span>

              <div className="flex gap-2">
                {/* CHANGER */}
                <label className="bg-mauve text-white px-3 py-1 rounded-lg cursor-pointer text-sm">
                  {previewPartition ? "Changer" : "Ajouter"}
                  <input
                    type="file"
                    name="partition"
                    accept=".pdf,.png,.jpg"
                    className="hidden"
                    onChange={handleChange}
                  />
                </label>

                {/* SUPPRIMER */}
                {previewPartition && (
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
                    onClick={async () => {
                      setPreviewPartition(undefined);
                      setForm((f) => ({ ...f, partition: null }));
                      resetFileInput("partition");

                      if (editingId) {
                        await fetch(`${API_CHANTS}${editingId}/?field=partition`, {
                          method: "DELETE",
                        });
                        loadData();
                      }
                    }}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>

            {previewPartition && <p className="mt-1 text-sm">🎵 {previewPartition}</p>}
          </div>

          {/* MULTIPLE MP3 */}
          <div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Pistes audio (MP3)</span>
              <label className="bg-mauve text-white px-3 py-1 rounded-lg cursor-pointer text-sm">
                Ajouter
                <input key = {previewAudio.length} type="file" name="new_audio" multiple accept=".mp3"
                  className="hidden" onChange={handleChange} />
              </label>
            </div>

            {/* NEW MP3 PREVIEW */}
            {previewAudio.length > 0 &&
              previewAudio.map((f, i) => (
                <div key={i} className="flex items-center gap-3 mt-1">
                  <p className="text-sm">🎧 {f}</p>
                  <button
                    onClick={() => removeNewAudio(i)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                  >
                    Retirer
                  </button>
                </div>
              ))}

            {/* EXISTING AUDIO (WHEN EDITING) */}
            {editingId && (
              <div className="flex flex-col gap-2 mt-3">
                <h4 className="text-lg font-semibold">Pistes existantes</h4>

                {chants.find((x) => x.id === editingId)?.pistes_audio.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    
                    <a
                      href={p.fichier_mp3}
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      🎧 {p.fichier_mp3.split("/").pop()}
                    </a>

                    <button
                      onClick={() => deleteAudio(p.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
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

      {/* LISTE DES CHANTS GROUPÉS PAR CATÉGORIE */}
      <section className="rounded-xl bg-white p-8 shadow border border-mauve/40">
        <h2 className="text-2xl font-bold text-mauve mb-6">Liste des chants</h2>

        {/* Recherche + Filtre catégorie */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">

          {/* Recherche */}
          <input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-mauve/50 rounded-lg p-3 flex-1"
          />

          {/* Filtre catégorie */}
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="border border-mauve/50 rounded-lg p-3 w-full md:w-60"
          >
            <option value="Toutes">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* GROUPEMENT PAR CATÉGORIE */}
        {categories.map((cat) => {
          const chantsDeCat = chants
            .filter((c) =>
              c.categories.map((x) => x.toLowerCase()).includes(cat.toLowerCase())
            )
            .filter((c) =>
              `${c.nom_chant} ${c.auteur} ${c.ville_origine}`
                .toLowerCase()
                .includes(search.toLowerCase())
            )
            .sort((a, b) => a.nom_chant.localeCompare(b.nom_chant, "fr"));

          if (chantsDeCat.length === 0) return null;

          return (
            <div key={cat} className="mb-8">
              <h3 className="text-lg font-semibold text-mauve mb-3">{cat}</h3>

              <div className="flex flex-col gap-3">
                {chantsDeCat.map((c) => (
                  <div
                    key={c.id}
                    className="border rounded-lg p-3 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-mauve truncate">
                        {c.nom_chant}
                      </h3>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => startEdit(c)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Modifier
                        </button>

                        <button
                          onClick={() => deleteChant(c.id)}
                          className="bg-red-600 text-white px-2 py-1 rounded text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}