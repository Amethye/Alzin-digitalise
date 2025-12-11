import { useEffect, useMemo, useState } from "react";
import LogoUrl from "@images/LogoFPMs.svg?url";
import { apiUrl } from "../lib/api";

const logoSrc = LogoUrl.split("?")[0];

type TemplateChansonnier = {
  id: number;
  nom_template: string;
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

type ChansonnierDetail = {
  id: number;
  nom_chansonnier_perso: string;
  couleur: string;
  type_papier: string;
  date_creation: string;
  template_id: number | null;
  chant_ids: number[];
};

export default function AlzinPersoPage() {
  const [noUser, setNoUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [templates, setTemplates] = useState<TemplateChansonnier[]>([]);
  const [chants, setChants] = useState<Chant[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);

  const [editId, setEditId] = useState<number | null>(null);

  // Champs du formulaire
  const [nom, setNom] = useState("");
  const [couleur, setCouleur] = useState("");
  const [typePapier, setTypePapier] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | "">("");

  // Chants sélectionnés
  const [selectedChantIds, setSelectedChantIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(
    null
  );

  const isEditMode = editId !== null;

  // ----------------------------------------
  // Chargement initial : user + données
  // ----------------------------------------
  useEffect(() => {
    const email = localStorage.getItem("email");

    if (!email) {
      setNoUser(true);
      setLoading(false);
      return;
    }

    const authHeaders: Record<string, string> = {
      "X-User-Email": email,
    };

    const searchParams = new URLSearchParams(window.location.search);
    const idParam = searchParams.get("id");
    const existingId = idParam ? Number(idParam) : null;
    if (existingId) {
      setEditId(existingId);
    }

    async function fetchAll() {
      try {
        setLoading(true);
        setError(null);

        // 1) templates + chants + catégories
        const [resTpl, resChants, resCats] = await Promise.all([
          fetch(apiUrl("/api/templates-chansonniers/")),
          fetch(apiUrl("/api/chants/")),
          fetch(apiUrl("/api/categories/")),
        ]);

        if (!resTpl.ok) {
          throw new Error("Erreur lors du chargement des templates.");
        }
        if (!resChants.ok) {
          throw new Error("Erreur lors du chargement des chants.");
        }
        if (!resCats.ok) {
          throw new Error("Erreur lors du chargement des catégories.");
        }

        const dataTpl: TemplateChansonnier[] = await resTpl.json();
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

        // 2) si on est en édition, charger le détail
        if (existingId) {
          const resDetail = await fetch(
            apiUrl(`/api/mes-chansonniers/${existingId}/`),
            {
              headers: authHeaders,
            }
          );

          if (resDetail.status === 404) {
            throw new Error("Cet alzin personnalisé n'existe plus.");
          }
          if (!resDetail.ok) {
            throw new Error(
              "Erreur lors du chargement des informations de l'alzin."
            );
          }

          const detail: ChansonnierDetail = await resDetail.json();

          setNom(detail.nom_chansonnier_perso);
          setCouleur(detail.couleur);
          setTypePapier(detail.type_papier);
          setSelectedTemplateId(detail.template_id ?? "");
          setSelectedChantIds(detail.chant_ids || []);
        } else {
          // Création : valeurs par défaut
          setNom("");
          setCouleur("");
          setTypePapier("");
          setSelectedTemplateId("");
          setSelectedChantIds([]);
        }
      } catch (e: any) {
        setError(e.message || "Une erreur est survenue.");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  // ----------------------------------------
  // Filtres de chants
  // ----------------------------------------
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

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter((c) => c.nom_chant.toLowerCase().includes(s));
    }

    return list;
  }, [chants, searchTerm, selectedCategoryFilter]);

  const toggleChantSelection = (id: number) => {
    setSelectedChantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

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

  // ----------------------------------------
  // Envoi du formulaire
  // ----------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const email = localStorage.getItem("email");
    if (!email) {
      setNoUser(true);
      return;
    }

    if (!nom || !couleur || !typePapier) {
      setError("Merci de remplir au minimum le nom, la couleur et le type de papier.");
      return;
    }

    if (selectedChantIds.length === 0) {
      setError("Merci de sélectionner au moins un chant.");
      return;
    }

    const payload = {
      nom_chansonnier_perso: nom,
      couleur,
      type_papier: typePapier,
      template_id: selectedTemplateId || null,
      chant_ids: selectedChantIds,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-User-Email": email,
    };

    try {
      setSaving(true);

      if (isEditMode && editId) {
        const res = await fetch(apiUrl(`/api/mes-chansonniers/${editId}/`), {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error("Impossible de mettre à jour cet alzin personnalisé.");
        }

        setSuccess("Alzin personnalisé mis à jour avec succès.");
      } else {
        const res = await fetch(apiUrl("/api/mes-chansonniers/"), {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error("Impossible de créer cet alzin personnalisé.");
        }

        setSuccess("Alzin personnalisé créé avec succès.");
      }

      // Redirection douce vers la page des commandes après un petit délai
      setTimeout(() => {
        window.location.href = "/orders";
      }, 800);
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    window.location.href = "/orders";
  };

  // ----------------------------------------
  // Écran "non membre"
  // ----------------------------------------
  if (noUser) {
    return (
      <div className="flex w-full max-w-3xl flex-col items-center justify-center rounded-xl bg-white px-6 py-10 text-center shadow-lg sm:px-10 sm:py-14">
        <img
          src={logoSrc}
          alt="Logo Alzin"
          className="mb-6 h-20 w-auto opacity-90"
        />
        <h1 className="mb-3 text-2xl font-bold text-mauve sm:text-3xl">
          Connecte-toi pour créer ton alzin
        </h1>
        <p className="mb-6 max-w-xl text-sm text-gray-600 sm:text-base">
          La création d&apos;alzins personnalisés est réservée aux membres connectés.
          Crée ton compte ou connecte-toi pour continuer.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-mauve px-5 py-2.5 text-sm font-semibold text-white shadow-sm duration-150 hover:bg-purple-800 sm:text-base"
          >
            Devenir membre
          </a>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-mauve px-5 py-2.5 text-sm font-semibold text-mauve duration-150 hover:bg-mauve hover:text-white sm:text-base"
          >
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // Loading
  // ----------------------------------------
  if (loading) {
    return (
      <div className="w-full max-w-5xl rounded-xl bg-white px-4 py-6 text-center text-sm text-gray-600 shadow-lg sm:px-6 sm:py-8 sm:text-base">
        Chargement de l&apos;éditeur d&apos;alzin personnalisé...
      </div>
    );
  }

  // ----------------------------------------
  // Formulaire principal
  // ----------------------------------------
  return (
    <div className="w-full max-w-5xl rounded-xl bg-white px-4 py-6 shadow-lg sm:px-6 sm:py-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mauve sm:text-3xl">
            {isEditMode ? "Modifier mon alzin personnalisé" : "Créer un alzin personnalisé"}
          </h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            Choisis un template, configure ton alzin et sélectionne les chants à inclure.
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
          {success}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Infos générales */}
        <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 sm:px-5 sm:py-5">
          <h2 className="text-base font-semibold text-mauve sm:text-lg">
            Informations générales
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700 sm:text-sm">
                Nom de l&apos;alzin
              </label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-mauve sm:text-base"
                placeholder="Ex. Alzin promo 2025"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700 sm:text-sm">
                Template de base
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => {
    const value = e.target.value;
    const newId = value ? Number(value) : "";

    setSelectedTemplateId(newId);

    // si un template est sélectionné, on applique ses chants
    if (value) {
      const tpl = templates.find((t) => t.id === Number(value));
      if (tpl && Array.isArray(tpl.chant_ids)) {
        setSelectedChantIds(tpl.chant_ids);
      } else {
        // pas de chants liés au template → on vide la sélection
        setSelectedChantIds([]);
      }
    } else {
      // "Blanc (par défaut)" : aucun template → pas de sélection automatique
      setSelectedChantIds([]);
    }
  }}
  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-mauve sm:text-base"
>
  <option value="">Blanc (par défaut)</option>
  {templates.map((t) => (
    <option key={t.id} value={t.id}>
      {t.nom_template}
    </option>
  ))}
</select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700 sm:text-sm">
                Couleur
              </label>
              <input
                type="text"
                value={couleur}
                onChange={(e) => setCouleur(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-mauve sm:text-base"
                placeholder="Ex. Bordeaux"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700 sm:text-sm">
                Type de papier
              </label>
              <input
                type="text"
                value={typePapier}
                onChange={(e) => setTypePapier(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-mauve sm:text-base"
                placeholder="Ex. 120g ivoire"
                required
              />
            </div>
          </div>
        </section>

        {/* Sélection des chants */}
        <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="text-base font-semibold text-mauve sm:text-lg">
              Sélection des chants
            </h2>
            <p className="text-xs text-gray-600 sm:text-sm">
              {selectedChantIds.length} chant(s) sélectionné(s)
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Colonne catégories */}
            <aside className="w-full rounded-lg bg-white p-3 shadow-sm lg:w-64">
              <h3 className="mb-2 text-xs font-semibold text-gray-700 sm:text-sm">
                Groupes / catégories
              </h3>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter(null)}
                  className={`btn w-full justify-start text-left text-xs sm:text-sm ${
                    selectedCategoryFilter === null ? "btn-solid" : "btn-ghost text-gray-700"
                  }`}
                >
                  Tous les chants
                </button>
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat.nom_categorie)}
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
                      onClick={() => handleAddCategoryChants(cat.nom_categorie)}
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

            {/* Colonne liste chants */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un chant..."
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-mauve sm:text-base"
                  />
                </div>
              </div>

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
                          onClick={() => toggleChantSelection(c.id)}
                        >
                          <input
                            type="checkbox"
                            checked={!!checked}
                            onChange={() => toggleChantSelection(c.id)}
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

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary sm:text-base"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-solid disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
          >
            {saving
              ? isEditMode
                ? "Mise à jour..."
                : "Création..."
              : isEditMode
              ? "Mettre à jour l'alzin"
              : "Créer l'alzin"}
          </button>
        </div>
      </form>
    </div>
  );
}
