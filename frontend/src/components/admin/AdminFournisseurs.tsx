import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";

type Fournisseur = {
  id: number;
  nom_fournisseur: string;
  ville_fournisseur: string;
};

type FormState = {
  nom_fournisseur: string;
  ville_fournisseur: string;
};

const initialForm: FormState = {
  nom_fournisseur: "",
  ville_fournisseur: "",
};

export default function AdminFournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFournisseurs() {
      try {
        setLoading(true);
        const res = await fetch(apiUrl("/api/fournisseurs/"));
        if (!res.ok) throw new Error("Impossible de charger les fournisseurs.");
        const data: Fournisseur[] = await res.json();
        setFournisseurs(data);
      } catch (e: any) {
        setError(e.message || "Erreur lors du chargement des fournisseurs.");
      } finally {
        setLoading(false);
      }
    }

    fetchFournisseurs();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(apiUrl("/api/fournisseurs/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la création du fournisseur.");
      }

      const created: Fournisseur = await res.json();
      setFournisseurs((prev) => [...prev, created]);
      setForm(initialForm);
    } catch (e: any) {
      setError(e.message || "Erreur lors de la création du fournisseur.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (f: Fournisseur) => {
    setEditingId(f.id);
    setForm({
      nom_fournisseur: f.nom_fournisseur,
      ville_fournisseur: f.ville_fournisseur,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSaveEdit = async (id: number) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(apiUrl(`/api/fournisseurs/${id}/`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la mise à jour du fournisseur.");
      }

      const updated: Fournisseur = await res.json();
      setFournisseurs((prev) =>
        prev.map((f) => (f.id === id ? updated : f))
      );
      setEditingId(null);
      setForm(initialForm);
    } catch (e: any) {
      setError(e.message || "Erreur lors de la mise à jour du fournisseur.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer ce fournisseur ?")) return;

    try {
      const res = await fetch(apiUrl(`/api/fournisseurs/${id}/`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression.");
      setFournisseurs((prev) => prev.filter((f) => f.id !== id));
    } catch (e: any) {
      alert(e.message || "Erreur lors de la suppression.");
    }
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      <h1 className="text-xl font-bold text-bordeau sm:text-2xl">
        Gestion des fournisseurs
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-bordeau sm:text-base">
          Ajouter un fournisseur
        </h2>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-bordeau mb-1">
              Nom
            </label>
            <input
              type="text"
              name="nom_fournisseur"
              value={form.nom_fournisseur}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-bordeau mb-1">
              Ville
            </label>
            <input
              type="text"
              name="ville_fournisseur"
              value={form.ville_fournisseur}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center rounded-md bg-bordeau-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-bordeau-700 disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "Ajouter"}
        </button>
      </form>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-bordeau sm:text-base">
          Fournisseurs existants
        </h2>

        {loading ? (
          <p className="text-sm text-gray-600">Chargement…</p>
        ) : fournisseurs.length === 0 ? (
          <p className="text-sm text-gray-600">
            Aucun fournisseur enregistré.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {fournisseurs.map((f) => (
              <li
                key={f.id}
                className="flex flex-col gap-2 rounded-md border border-gray-100 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                {editingId === f.id ? (
                  <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:gap-2">
                    <input
                      type="text"
                      name="nom_fournisseur"
                      value={form.nom_fournisseur}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs sm:text-sm"
                    />
                    <input
                      type="text"
                      name="ville_fournisseur"
                      value={form.ville_fournisseur}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs sm:text-sm"
                    />
                  </div>
                ) : (
                  <div className="flex-1">
                    <p className="font-semibold text-bordeau">
                      {f.nom_fournisseur}
                    </p>
                    <p className="text-xs text-gray-600">
                      {f.ville_fournisseur || "Ville inconnue"}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {editingId === f.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(f.id)}
                        disabled={saving}
                        className="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="rounded-md bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-300"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartEdit(f)}
                      className="rounded-md bg-bordeau-100 px-3 py-1 text-xs font-semibold text-bordeau hover:bg-bordeau-200"
                    >
                      Modifier
                    </button>
                  )}

                  <button
  type="button"
  onClick={() => handleDelete(f.id)}
  className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
>
  Supprimer
</button>

                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
