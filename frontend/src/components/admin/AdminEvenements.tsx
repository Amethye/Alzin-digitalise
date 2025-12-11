import React, { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";
import DeleteButton from "../DeleteButton";

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

type Chant = { id: number; nom_chant: string };
type ChanterLink = { id: number; chant_id: number; evenement_id: number };

const API_URL = "/api/evenements/";
const API_CHANTS = "/api/chants/";
const API_CHANTER = "/api/chanter/";

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

  const [chants, setChants] = useState<Chant[]>([]);
  const [eventChants, setEventChants] = useState<ChanterLink[]>([]);
  const [pendingChants, setPendingChants] = useState<number[]>([]);
  const [selectedChantId, setSelectedChantId] = useState<string>("");

  const [loading, setLoading] = useState(true);

  /** Charger les évènements */
  const loadEvenements = async () => {
    setLoading(true);
    const res = await fetch(apiUrl(API_URL));
    const data = await res.json();
    setEvenements(data);
    setLoading(false);
  };

  /** Charger tous les chants (pour le sélecteur) */
  const loadChants = async () => {
    const res = await fetch(apiUrl(API_CHANTS));
    const data = await res.json();
    setChants(data);
  };

  /** Charger les chants liés à un évènement existant */
  const loadEventChants = async (evId: number) => {
    const res = await fetch(apiUrl(`${API_CHANTER}?evenement_id=${evId}`));
    const data: ChanterLink[] = await res.json();
    setEventChants(data);
  };

  useEffect(() => {
    loadEvenements();
    loadChants();
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
      date_evenement: ev.date_evenement,
      lieu: ev.lieu,
      annonce_fil_actu: ev.annonce_fil_actu ?? "",
      histoire: ev.histoire ?? "",
    });
    loadEventChants(ev.id);
    setPendingChants([]);
    setSelectedChantId("");
  };

  const cancelEdit = () => {
    resetForm();
    setEventChants([]);
    setPendingChants([]);
    setSelectedChantId("");
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

    const createdId = id ?? (await res.json())?.id;

    // Création : on envoie les liens de chants en attente
    if (!id && createdId && pendingChants.length > 0) {
      for (const chantId of pendingChants) {
        await fetch(apiUrl(API_CHANTER), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chant_id: chantId, evenement_id: createdId }),
        });
      }
    }

    resetForm();
    setEventChants([]);
    setPendingChants([]);
    setSelectedChantId("");
    loadEvenements();
  };

  /** AJOUTER / RETIRER UN CHANT LIÉ */
  const addChantToEvent = async () => {
    if (!selectedChantId) {
      alert("Sélectionne un chant.");
      return;
    }
    const chantId = Number(selectedChantId);

    // Mode édition : on crée le lien en base
    if (editingId) {
      if (eventChants.some((l) => l.chant_id === chantId)) {
        alert("Ce chant est déjà associé à cet évènement.");
        return;
      }
      const res = await fetch(apiUrl(API_CHANTER), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chant_id: chantId, evenement_id: editingId }),
      });
      if (!res.ok) {
        alert("Impossible d'ajouter ce chant à l'évènement.");
        return;
      }
      setSelectedChantId("");
      loadEventChants(editingId);
      return;
    }

    // Mode création : on empile localement jusqu'à la création effective
    if (pendingChants.includes(chantId)) {
      alert("Ce chant est déjà dans la liste.");
      return;
    }
    setPendingChants((prev) => [...prev, chantId]);
    setSelectedChantId("");
  };

  const removePendingChant = (chantId: number) => {
    setPendingChants((prev) => prev.filter((id) => id !== chantId));
  };

  const renderChantsList = () => {
    if (editingId !== null) {
      const currentEditingId = editingId;
      if (eventChants.length === 0) {
        return <p className="text-sm text-gray-500">Aucun chant lié.</p>;
      }

      return (
        <ul className="space-y-2">
          {eventChants.map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between rounded bg-white px-3 py-2 shadow-sm"
            >
              <span>
                {chants.find((c) => c.id === link.chant_id)?.nom_chant ??
                  `Chant #${link.chant_id}`}
              </span>
              <DeleteButton
                endpoint={`${API_CHANTER}?id=${link.id}`}
                label="Retirer"
                confirmMessage="Retirer ce chant de l'évènement ?"
                onSuccess={() => loadEventChants(currentEditingId)}
                className="text-sm text-red-600 font-semibold bg-transparent px-0 py-0"
              />
            </li>
          ))}
        </ul>
      );
    }

    if (pendingChants.length === 0) {
      return <p className="text-sm text-gray-500">Aucun chant lié.</p>;
    }

    return (
      <ul className="space-y-2">
        {pendingChants.map((chantId) => (
          <li
            key={chantId}
            className="flex items-center justify-between rounded bg-white px-3 py-2 shadow-sm"
          >
            <span>
              {chants.find((c) => c.id === chantId)?.nom_chant ?? `Chant #${chantId}`}
            </span>
            <button
              type="button"
              onClick={() => removePendingChant(chantId)}
              className="text-sm text-red-600 font-semibold"
            >
              Retirer
            </button>
          </li>
        ))}
      </ul>
    );
  };

  // ------------------------------------------------------------------

  return (
    <div className="flex w-full flex-col gap-10 p-8">
      {/* FORMULAIRE */}
      <section className="w-full rounded-xl border border-bordeau/40 bg-white p-8 shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-bordeau">
          {editingId ? "Modifier un évènement" : "Ajouter un évènement"}
        </h2>

        <div className="grid gap-4 w-full md:grid-cols-2">
          <input
            name="nom_evenement"
            placeholder="Nom de l'évènement *"
            value={form.nom_evenement}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-bordeau md:col-span-2"
          />

          <input
            type="date"
            name="date_evenement"
            value={form.date_evenement}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-bordeau"
          />

          <input
            name="lieu"
            placeholder="Lieu *"
            value={form.lieu}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm focus:ring-2 focus:ring-bordeau"
          />

          <textarea
            name="annonce_fil_actu"
            placeholder="Annonce (fil actu)"
            value={form.annonce_fil_actu}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm md:col-span-2 h-24 focus:ring-2 focus:ring-bordeau"
          />

          <textarea
            name="histoire"
            placeholder="Histoire / compte-rendu"
            value={form.histoire}
            onChange={handleChange}
            className="rounded-xl border border-gray-300 px-4 py-3 shadow-sm md:col-span-2 h-32 focus:ring-2 focus:ring-bordeau"
          />
        </div>

        <div className="mt-6 rounded-xl border border-bordeau/30 bg-gray-50 p-4">
          <h3 className="font-semibold text-bordeau mb-3">Chants associés</h3>

          <div className="flex flex-col md:flex-row gap-3 items-center mb-3">
            <select
              value={selectedChantId}
              onChange={(e) => setSelectedChantId(e.target.value)}
              className="rounded-lg border px-3 py-2 flex-1"
            >
              <option value="">Choisir un chant…</option>
              {chants
                .slice()
                .sort((a, b) => a.nom_chant.localeCompare(b.nom_chant, "fr"))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom_chant}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={addChantToEvent}
              className="rounded bg-bordeau text-white px-4 py-2"
            >
              Ajouter
            </button>
          </div>

          {renderChantsList()}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => saveEvenement(editingId ?? undefined)}
            className="rounded-xl bg-bordeau px-6 py-3 text-lg font-semibold text-white shadow hover:bg-bordeau-600 transition"
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
        <h2 className="mb-4 text-2xl font-bold text-bordeau">Liste des évènements</h2>

        {loading ? (
          <p className="text-gray-600">Chargement…</p>
        ) : evenements.length === 0 ? (
          <p className="text-gray-600">Aucun évènement enregistré.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {evenements.map((e) => (
              <div
                key={e.id}
                className="flex flex-col justify-between rounded-xl border border-bordeau/30 bg-white p-6 shadow"
              >
                <div>
                  <h3 className="text-xl font-bold text-bordeau">{e.nom_evenement}</h3>
                  <p className="text-sm text-gray-700">
                    {new Date(e.date_evenement).toLocaleDateString("fr-BE")} —{" "}
                    <span className="font-semibold">{e.lieu}</span>
                  </p>

                  {e.annonce_fil_actu && (
                    <p className="mt-3 text-sm text-gray-800 line-clamp-3">{e.annonce_fil_actu}</p>
                  )}

                  {e.histoire && (
                    <p className="mt-2 text-xs text-gray-600 line-clamp-2 italic">{e.histoire}</p>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => startEdit(e)}
                    className="rounded bg-yellow-500 px-4 py-1 text-sm font-semibold text-white shadow hover:bg-yellow-600"
                  >
                    Modifier
                  </button>
                  <DeleteButton
                    endpoint={`${API_URL}${e.id}/`}
                    confirmMessage="Supprimer cet évènement ?"
                    onSuccess={() => {
                      loadEvenements();
                      if (editingId === e.id) cancelEdit();
                    }}
                    onError={(message) => alert(message || "Erreur lors de la suppression.")}
                    className="rounded bg-red-600 px-4 py-1 text-sm font-semibold text-white shadow hover:bg-red-700"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
