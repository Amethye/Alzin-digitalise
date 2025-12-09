import React, { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";

type Evenement = {
  id: number;
  nom_evenement: string;
  date_evenement: string; // "YYYY-MM-DD"
  lieu: string;
  annonce_fil_actu: string;
  histoire: string;
};

type FormState = {
  nom_evenement: string;
  date_evenement: string;
  lieu: string;
  annonce_fil_actu: string;
  histoire: string;
};

const API_URL = "/api/evenements/";

const initialForm: FormState = {
  nom_evenement: "",
  date_evenement: "",
  lieu: "",
  annonce_fil_actu: "",
  histoire: "",
};

export default function AdminEvenements() {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const [loading, setLoading] = useState(true);

  /** Charger les évènements */
  const loadEvenements = async () => {
    setLoading(true);
    const res = await fetch(apiUrl(API_URL));
    const data = await res.json();
    setEvenements(data);
    setLoading(false);
  };

  useEffect(() => {
    loadEvenements();
  }, []);

  /** GESTION FORMULAIRE */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  /** MODIFICATION */
  const startEdit = (ev: Evenement) => {
    setEditingId(ev.id);
    setForm({
      nom_evenement: ev.nom_evenement,
      date_evenement: ev.date_evenement, // déjà "YYYY-MM-DD"
      lieu: ev.lieu,
      annonce_fil_actu: ev.annonce_fil_actu ?? "",
      histoire: ev.histoire ?? "",
    });
  };

  const cancelEdit = () => {
    resetForm();
  };

  /** ENREGISTRER / AJOUTER */
  const saveEvenement = async (id?: number) => {
    if (!form.nom_evenement || !form.date_evenement || !form.lieu) {
      alert("Nom, date et lieu sont obligatoires.");
      return;
    }

    const payload = {
      nom_evenement: form.nom_evenement,
      date_evenement: form.date_evenement,
      lieu: form.lieu,
      annonce_fil_actu: form.annonce_fil_actu || "",
      histoire: form.histoire || "",
    };

    const method = id ? "PUT" : "POST";
    const url = apiUrl(id ? `${API_URL}${id}/` : API_URL);

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("Erreur lors de l’enregistrement de l’évènement.");
      return;
    }

    resetForm();
    loadEvenements();
  };

  /** SUPPRESSION */
  const deleteEvenement = async (id: number) => {
    if (!confirm("Supprimer cet évènement ?")) return;

    const res = await fetch(apiUrl(`${API_URL}${id}/`), { method: "DELETE" });
    if (res.ok) {
      loadEvenements();
    } else {
      alert("Erreur lors de la suppression.");
    }
  };

  // ------------------------------------------------------------------

  return (
    <div className="flex w-full flex-col gap-10 p-8">
      {/* FORMULAIRE */}
      <section className="w-full rounded-xl border border-mauve/40 bg-white p-8 shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-mauve">
          {editingId ? "Modifier un évènement" : "Ajouter un évènement"}
        </h2>

        <div className="grid gap-4 w-full md:grid-cols-2">
          <input
            name="nom_evenement"
            placeholder="Nom de l'évènement *"
            value={form.nom_evenement}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-mauve md:col-span-2"
          />

          <input
            type="date"
            name="date_evenement"
            value={form.date_evenement}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-mauve"
          />

          <input
            name="lieu"
            placeholder="Lieu *"
            value={form.lieu}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-mauve"
          />

          <textarea
            name="annonce_fil_actu"
            placeholder="Annonce (fil actu)"
            value={form.annonce_fil_actu}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm md:col-span-2 h-24 focus:ring-2 focus:ring-mauve"
          />

          <textarea
            name="histoire"
            placeholder="Histoire / compte-rendu"
            value={form.histoire}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm md:col-span-2 h-32 focus:ring-2 focus:ring-mauve"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => saveEvenement(editingId ?? undefined)}
            className="rounded-xl bg-mauve px-6 py-3 text-lg font-semibold text-white shadow hover:bg-purple-600 transition"
          >
            {editingId ? "Mettre à jour" : "Ajouter"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-xl border border-gray-400 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Annuler
            </button>
          )}
        </div>
      </section>

      {/* LISTE DES ÉVÈNEMENTS */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-mauve">Liste des évènements</h2>

        {loading ? (
          <p className="text-gray-600">Chargement…</p>
        ) : evenements.length === 0 ? (
          <p className="text-gray-600">Aucun évènement enregistré.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {evenements.map((e) => (
              <div
                key={e.id}
                className="flex flex-col justify-between rounded-xl border border-mauve/30 bg-white p-6 shadow"
              >
                <div>
                  <h3 className="text-xl font-bold text-mauve">{e.nom_evenement}</h3>
                  <p className="text-sm text-gray-700">
                    {new Date(e.date_evenement).toLocaleDateString("fr-BE")} —{" "}
                    <span className="font-semibold">{e.lieu}</span>
                  </p>

                  {e.annonce_fil_actu && (
                    <p className="mt-3 text-sm text-gray-800 line-clamp-3">
                      {e.annonce_fil_actu}
                    </p>
                  )}

                  {e.histoire && (
                    <p className="mt-2 text-xs text-gray-600 line-clamp-2 italic">
                      {e.histoire}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => startEdit(e)}
                    className="rounded bg-yellow-500 px-4 py-1 text-sm font-semibold text-white shadow hover:bg-yellow-600"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => deleteEvenement(e.id)}
                    className="rounded bg-red-600 px-4 py-1 text-sm font-semibold text-white shadow hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
