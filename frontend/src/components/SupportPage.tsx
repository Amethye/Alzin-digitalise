import { useEffect, useState } from "react";
import LogoUrl from "@images/LogoFPMs.svg?url";

const logoSrc = LogoUrl.split("?")[0];

type Me = {
  id: number;
  pseudo: string;
  email: string;
};

export default function SupportPage() {
  const [noUser, setNoUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [me, setMe] = useState<Me | null>(null);

  const [objet, setObjet] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("email");

    if (!email) {
      setNoUser(true);
      setLoading(false);
      return;
    }

    const headers: Record<string, string> = {
      "X-User-Email": email,
    };

    async function fetchMe() {
      try {
        setLoading(true);
        setError(null);

        const resMe = await fetch("/api/me/", {
          headers,
        });

        if (resMe.status === 404 || resMe.status === 401) {
          setNoUser(true);
          setLoading(false);
          return;
        }

        if (!resMe.ok) {
          throw new Error("Erreur lors du chargement de ton profil.");
        }

        const data = await resMe.json();
        setMe({
          id: data.id,
          pseudo: data.pseudo,
          email: data.email,
        });
      } catch (e: any) {
        setError(e.message || "Une erreur est survenue.");
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const email = localStorage.getItem("email");
    if (!email) {
      setNoUser(true);
      return;
    }

    if (!objet.trim() || !description.trim()) {
      setError("Merci de remplir l'objet et la description.");
      return;
    }

    const formData = new FormData();
    formData.append("objet", objet);
    formData.append("description", description);

    if (files && files.length > 0) {
      Array.from(files).forEach((f) => {
        formData.append("fichiers", f);
      });
    }

    try {
      setSending(true);

      const res = await fetch("/api/support/", {
        method: "POST",
        headers: {
          "X-User-Email": email,
          // NE PAS définir Content-Type ici, le navigateur le gère pour FormData
        } as any,
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("Erreur support:", txt);
        throw new Error("Impossible d'envoyer ta demande de support.");
      }

      setSuccess("Ta demande de support a bien été envoyée. Merci !");
      setObjet("");
      setDescription("");
      setFiles(null);
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue lors de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  // Écran "non membre"
  if (noUser) {
    return (
      <div className="flex w-full max-w-3xl flex-col items-center justify-center rounded-xl bg-white px-6 py-10 text-center shadow-lg sm:px-10 sm:py-14">
        <img
          src={logoSrc}
          alt="Logo Alzin"
          className="mb-6 h-20 w-auto opacity-90"
        />
        <h1 className="mb-3 text-2xl font-bold text-mauve sm:text-3xl">
          Connecte-toi pour contacter le support
        </h1>
        <p className="mb-6 max-w-xl text-sm text-gray-600 sm:text-base">
          Les demandes de support sont réservées aux membres connectés.
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

  if (loading) {
    return (
      <div className="w-full max-w-5xl rounded-xl bg-white px-4 py-6 text-center text-sm text-gray-600 shadow-lg sm:px-6 sm:py-8 sm:text-base">
        Chargement du formulaire de support...
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl rounded-xl bg-white px-4 py-6 shadow-lg sm:px-6 sm:py-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mauve sm:text-3xl">
            Support &amp; recommandations
          </h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            Une question, une idée d&apos;amélioration, un bug ? Envoie-nous un message.
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
        {/* Infos utilisateur */}
        <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 sm:px-5 sm:py-5">
          <h2 className="text-base font-semibold text-mauve sm:text-lg">
            Tes informations
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700 sm:text-sm">
                Nom / pseudo
              </label>
              <input
                type="text"
                value={me?.pseudo || ""}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5 text-sm text-gray-700 sm:text-base"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700 sm:text-sm">
                Adresse e-mail
              </label>
              <input
                type="email"
                value={me?.email || ""}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5 text-sm text-gray-700 sm:text-base"
              />
            </div>
          </div>
        </section>

        {/* Contenu de la demande */}
        <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 sm:px-5 sm:py-5">
          <h2 className="text-base font-semibold text-mauve sm:text-lg">
            Détails de ta demande
          </h2>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700 sm:text-sm">
              Objet
            </label>
            <input
              type="text"
              value={objet}
              onChange={(e) => setObjet(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-mauve sm:text-base"
              placeholder="Ex. Problème de connexion, suggestion de nouvelle fonctionnalité..."
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700 sm:text-sm">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[150px] w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-mauve sm:text-base"
              placeholder="Explique ton problème ou ta recommandation avec le plus de détails possible."
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700 sm:text-sm">
              Pièces jointes (optionnel)
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="text-sm text-gray-700 sm:text-base"
            />
            <p className="mt-1 text-xs text-gray-500">
              Tu peux joindre des captures d&apos;écran, PDF, etc.
            </p>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-2">
          <a
            href="/orders"
            className="btn btn-secondary sm:text-base"
          >
            Annuler
          </a>
          <button
            type="submit"
            disabled={sending}
            className="btn btn-solid disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
          >
            {sending ? "Envoi en cours..." : "Envoyer ma demande"}
          </button>
        </div>
      </form>
    </div>
  );
}
