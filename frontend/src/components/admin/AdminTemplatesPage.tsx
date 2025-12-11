import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "../../lib/api";

type Template = {
  id: number;
  nom_template: string;
  description: string;
  couleur: string;
  type_papier: string;
  chant_ids?: number[];
};

type Chant = {
  id: number;
  nom_chant: string;
  categories: string[];
};

type Categorie = {
  id: number;
  nom_categorie: string;
};

type FormState = {
  nom_template: string;
  description: string;
  couleur: string;
  type_papier: string;
};

const initialForm: FormState = {
  nom_template: "",
  description: "",
  couleur: "",
  type_papier: "",
};

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [chants, setChants] = useState<Chant[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);

  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedChantIds, setSelectedChantIds] = useState<number[]>([]);

  const [chantSearch, setChantSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ------------------ chargement initial ------------------
  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        setError(null);

        const [resTpl, resChants, resCats] = await Promise.all([
          fetch(apiUrl("/api/templates-chansonniers/")),
          fetch(apiUrl("/api/chants/")),
          fetch(apiUrl("/api/categories/")),
        ]);

        if (!resTpl.ok) throw new Error("Impossible de charger les templates.");
        if (!resChants.ok) throw new Error("Impossible de charger les chants.");
        if (!resCats.ok) throw new Error("Impossible de charger les catégories.");

        const dataTpl: Template[] = await resTpl.json();
        const dataChantsRaw: any[] = await resChants.json();
        const dataCats: Categorie[] = await resCats.json();

        const dataChants: Chant[] = dataChantsRaw.map((c) => ({
          id: c.id,
          nom_chant: c.nom_chant,
          categories: Array.isArray(c.categories) ? c.categories : [],
        }));

        setTemplates(dataTpl || []);
        setChants(dataChants || []);
        setCategories(dataCats || []);
      } catch (e: any) {
        setError(e.message || "Erreur lors du chargement initial.");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  // ------------------ helpers form ------------------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // comme dans AlzinPerso : ajoute tous les chants d'une catégorie
  const handleAddCategoryChants = (catName: string) => {
    const idsToAdd = chants
      .filter((c) =>
        c.categories.some(
          (cat) => cat.trim().toLowerCase() === catName.trim().toLowerCase()
        )
      )
      .map((c) => c.id);

    setSelectedChantIds((prev) => {
      const set = new Set(prev);
      idsToAdd.forEach((id) => set.add(id));
      return Array.from(set);
    });
  };

  const handleClearSelection = () => {
    setSelectedChantIds([]);
  };

  const toggleChant = (id: number) => {
    setSelectedChantIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const filteredChants = useMemo(() => {
    let list = chants;

    if (selectedCategoryFilter) {
      list = list.filter((c) =>
        c.categories.some(
          (cat) =>
            cat.trim().toLowerCase() ===
            selectedCategoryFilter.trim().toLowerCase()
        )
      );
    }

    if (chantSearch.trim()) {
      const q = chantSearch.toLowerCase();
      list = list.filter((c) => c.nom_chant.toLowerCase().includes(q));
    }

    return list;
  }, [chants, chantSearch, selectedCategoryFilter]);

  const resetForm = () => {
    setForm(initialForm);
    setSelectedChantIds([]);
    setSelectedCategoryFilter(null);
    setChantSearch("");
  };

  // ------------------ submit ------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!form.nom_template.trim()) {
        throw new Error("Merci de donner un nom au template.");
      }
      if (selectedChantIds.length === 0) {
        throw new Error("Merci de sélectionner au moins un chant.");
      }

      const payload = {
        ...form,
        chant_ids: selectedChantIds,
      };

      const res = await fetch(apiUrl("/api/templates-chansonniers/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(
          `Erreur lors de la création du template. ${txt || ""}`.trim()
        );
      }

      const created: Template = await res.json();
      setTemplates((prev) => [created, ...prev]);
      resetForm();
      setSuccess("Template créé avec succès.");
    } catch (e: any) {
      setError(e.message || "Erreur lors de la création du template.");
    } finally {
      setSaving(false);
    }
  };

  // ------------------ rendu ------------------
  return (
    <div className="w-full max-w-5xl space-y-6">
      <h1 className="text-xl font-bold text-mauve sm:text-2xl">
        Création de template de chansonnier
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        {error && (
          <p className="text-sm text-red-600 mb-1">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-600 mb-1">
            {success}
          </p>
        )}

        {/* infos générales */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-mauve mb-1">
              Nom du template
            </label>
            <input
              type="text"
              name="nom_template"
              value={form.nom_template}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-mauve mb-1">
              Couleur (indicative)
            </label>
            <input
              type="text"
              name="couleur"
              value={form.couleur}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Ex. Bordeaux"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-mauve mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-mauve mb-1">
            Type de papier
          </label>
          <input
            type="text"
            name="type_papier"
            value={form.type_papier}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Ex. 120g ivoire"
          />
        </div>

        {/* sélection catégories + chants */}
        <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="text-base font-semibold text-mauve sm:text-lg">
              Chants du template
            </h2>
            <p className="text-xs text-gray-600 sm:text-sm">
              {selectedChantIds.length} chant(s) sélectionné(s)
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            {/* colonne catégories */}
            <aside className="w-full rounded-lg bg-white p-3 shadow-sm lg:w-64">
              <h3 className="mb-2 text-xs font-semibold text-gray-700 sm:text-sm">
                Catégories
              </h3>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter(null)}
                  className={`btn w-full justify-start text-left text-xs sm:text-sm ${
                    selectedCategoryFilter === null
                      ? "btn-solid"
                      : "btn-ghost text-gray-700"
                  }`}
                >
                  Tous les chants
                </button>

                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between gap-1"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCategoryFilter(cat.nom_categorie)
                      }
                      className={`btn flex-1 justify-start text-left text-xs sm:text-sm ${
                        selectedCategoryFilter === cat.nom_categorie
                          ? "btn-solid"
                          : "btn-ghost text-gray-700"
                      }`}
                    >
                      {cat.nom_categorie}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddCategoryChants(cat.nom_categorie)
                      }
                      className="btn btn-ghost px-2 py-1 text-lg"
                      title="Ajouter tous les chants de cette catégorie"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleClearSelection}
                className="btn btn-secondary mt-3 w-full text-xs sm:text-sm"
              >
                Vider la sélection
              </button>
            </aside>

            {/* colonne liste de chants */}
            <div className="flex-1 space-y-3">
              <input
                type="text"
                value={chantSearch}
                onChange={(e) => setChantSearch(e.target.value)}
                placeholder="Rechercher un chant…"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-mauve sm:text-base"
              />

              <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                {filteredChants.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500">
                    Aucun chant ne correspond à ta recherche.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {filteredChants.map((c) => {
                      const checked = selectedChantIds.includes(c.id);
                      return (
                        <li
                          key={c.id}
                          className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50"
                          onClick={() => toggleChant(c.id)}
                        >
                          <input
                            type="checkbox"
                            checked={!!checked}
                            onChange={() => toggleChant(c.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded border-gray-300 text-mauve focus:ring-mauve"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">
                              {c.nom_chant}
                            </span>
                            {c.categories.length > 0 && (
                              <span className="text-xs text-gray-500">
                                {c.categories.join(" · ")}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "Créer le template"}
        </button>
      </form>

      {/* liste des templates existants */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-mauve">
          Templates existants
        </h2>

        {templates.length === 0 ? (
          <p className="text-sm text-gray-600">
            Aucun template enregistré pour l'instant.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {templates.map((t) => (
              <li
                key={t.id}
                className="rounded-md border border-gray-100 px-3 py-2"
              >
                <p className="font-semibold text-mauve">{t.nom_template}</p>
                {t.description && (
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {t.description}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Papier : {t.type_papier || "-"} • Couleur :{" "}
                  {t.couleur || "-"} • Chants :{" "}
                  {t.chant_ids?.length ?? 0}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
