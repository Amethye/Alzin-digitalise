import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";

type MaitresData = {
  maitres: string[];
};

const toTextarea = (items: string[]) => items.join("\n");
const parseTextarea = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export default function AdminMaitres() {
  const [maitresText, setMaitresText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      try {
        const response = await fetch(apiUrl("/api/maitres/"), {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Impossible de charger (code ${response.status})`);
        }

        const data: MaitresData = await response.json();
        setMaitresText(toTextarea(data.maitres ?? []));
      } catch {
        setError("Impossible de charger les maîtres de chants.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => controller.abort();
  }, []);


  useEffect(() => {
    if (success) {
      setTimeout(() => {
        window.location.href = "/admindash";
      }, 1000); 
    }
  }, [success]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const maitres = parseTextarea(maitresText);
    setSaving(true);

    try {
      const response = await fetch(apiUrl("/api/maitres/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ maitres }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l’enregistrement.");
      }

      const data: MaitresData = await response.json();
      setMaitresText(toTextarea(data.maitres ?? maitres));
      setSuccess("Informations mises à jour.");
    } catch {
      setError("Impossible d’enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-xl rounded-xl border border-mauve/30 bg-white px-6 py-6 shadow-md sm:px-7 sm:py-7">
      
      <h1 className="mb-2 text-xl font-bold text-mauve sm:text-2xl">
        Maîtres de chants
      </h1>

      <p className="mb-4 text-sm text-gray-600">
        Modifie la liste ci-dessous. Les modifications
        sont visibles immédiatement dans le footer du site.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label htmlFor="maitres" className="block text-sm font-medium text-gray-700">
            Liste (une personne par ligne)
          </label>

          <textarea
            id="maitres"
            rows={6}
            className="
              mt-2 w-full rounded-lg border border-gray-300 
              px-3 py-3 text-sm shadow-sm
              focus:border-mauve focus:outline-none focus:ring-2 focus:ring-mauve
            "
            placeholder="Ex : Prénom Nom"
            value={maitresText}
            onChange={(e) => setMaitresText(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          {loading && <span className="text-sm text-gray-500">Chargement…</span>}

          <button
            type="submit"
            className="
              rounded-lg bg-mauve px-5 py-2 text-sm font-semibold text-white 
              shadow transition hover:bg-purple-600
              disabled:cursor-not-allowed disabled:bg-purple-300
            "
            disabled={saving}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>

      </form>
    </section>
  );
}