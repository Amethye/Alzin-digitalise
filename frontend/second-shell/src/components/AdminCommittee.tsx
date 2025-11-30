import { useEffect, useState } from "react";

type CommitteeData = {
  committee: string[];
  helpers: string[];
};

const toTextarea = (items: string[]) => items.join("\n");
const parseTextarea = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export default function AdminCommittee() {
  const [committeeText, setCommitteeText] = useState("");
  const [helpersText, setHelpersText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/committee", {
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Impossible de charger les informations (code ${response.status})`);
        }
        const data: CommitteeData = await response.json();
        setCommitteeText(toTextarea(Array.isArray(data.committee) ? data.committee : []));
        setHelpersText(toTextarea(Array.isArray(data.helpers) ? data.helpers : []));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setError("Chargement trop long. Vérifie que l'API /api/committee répond.");
        } else {
          setError(err instanceof Error ? err.message : "Erreur inconnue");
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const committee = parseTextarea(committeeText);
    const helpers = parseTextarea(helpersText);

    setSaving(true);
    try {
      const response = await fetch("/api/committee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ committee, helpers }),
      });

      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        const message = typeof details.error === "string" ? details.error : "Enregistrement impossible.";
        throw new Error(message);
      }

      const data: CommitteeData = await response.json();
      setCommitteeText(toTextarea(Array.isArray(data.committee) ? data.committee : committee));
      setHelpersText(toTextarea(Array.isArray(data.helpers) ? data.helpers : helpers));
      setSuccess("Informations mises à jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl rounded-lg bg-white p-6 shadow-md">
      <h1 className="text-2xl font-bold text-bleu">Comité CAP</h1>
      <p className="mt-2 text-sm text-gray-600">
        Modifie les listes ci-dessous (une personne par ligne). Les modifications sont visibles immédiatement dans le
        footer du site.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label htmlFor="committee" className="block text-sm font-medium text-gray-700">
            Membres du comité (une personne par ligne)
          </label>
          <textarea
            id="committee"
            name="committee"
            rows={6}
            className="mt-2 w-full rounded-md border border-gray-300 p-3 text-sm shadow-sm focus:border-bleu focus:outline-none focus:ring-2 focus:ring-bleu"
            placeholder="Ex: Prénom Nom"
            value={committeeText}
            onChange={(event) => setCommitteeText(event.target.value)}
            disabled={saving}
          />
        </div>

        <div>
          <label htmlFor="helpers" className="block text-sm font-medium text-gray-700">
            Avec l'aide de (une personne par ligne)
          </label>
          <textarea
            id="helpers"
            name="helpers"
            rows={4}
            className="mt-2 w-full rounded-md border border-gray-300 p-3 text-sm shadow-sm focus:border-bleu focus:outline-none focus:ring-2 focus:ring-bleu"
            placeholder="Ex: Prénom Nom"
            value={helpersText}
            onChange={(event) => setHelpersText(event.target.value)}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          {loading && <span className="text-sm text-gray-500">Chargement…</span>}
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-bleu px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-200"
            disabled={saving}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  );
}
