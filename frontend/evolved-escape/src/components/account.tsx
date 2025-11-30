import { useState, useEffect } from "react";

interface UserInfo {
  nom: string;
  prenom: string;
  email: string;
  member_id: string;
  identifiant: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nom: "", prenom: "", email: "" });

  useEffect(() => {
    fetch("/api/me/info")
      .then((res) => res.json())
      .then((data: UserInfo) => {
        setUser(data);
        setForm({ nom: data.nom, prenom: data.prenom, email: data.email });
      })
      .catch((err) => setError("Impossible de récupérer les informations."));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/me/info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }
      setUser({ ...user!, ...form });
      setEditMode(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!user)
    return <p className="text-center text-sm text-gray-600 sm:text-base">Chargement des informations...</p>;

  return (
    <div className="w-full max-w-xl space-y-5">
      <h1 className="text-2xl font-bold text-bleu sm:text-3xl">Mon compte</h1>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 sm:text-base">{error}</p>}

      {editMode ? (
        <form className="mb-6 space-y-4 rounded-2xl bg-gray-100 px-4 py-5 shadow sm:px-6" onSubmit={handleSubmit}>
          <div>
            <label className="font-semibold block mb-1">Nom</label>
            <input
              type="text"
              name="nom"
              value={form.nom}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="font-semibold block mb-1">Prénom</label>
            <input
              type="text"
              name="prenom"
              value={form.prenom}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="font-semibold block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded-lg bg-bleu px-4 py-2 text-white shadow transition hover:bg-bleu/80">
              Sauvegarder
            </button>
            <button type="button" onClick={() => setEditMode(false)} className="rounded-lg border px-4 py-2">
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 space-y-2 rounded-2xl bg-gray-100 px-4 py-5 shadow sm:px-6">
          <p className="text-sm text-gray-700 sm:text-base"><span className="font-semibold text-bleu">Nom :</span> {user.nom}</p>
          <p className="text-sm text-gray-700 sm:text-base"><span className="font-semibold text-bleu">Prénom :</span> {user.prenom}</p>
          <p className="text-sm text-gray-700 sm:text-base"><span className="font-semibold text-bleu">Identifiant :</span> {user.identifiant}</p>
          <p className="text-sm text-gray-700 sm:text-base"><span className="font-semibold text-bleu">Email :</span> {user.email}</p>

          <button
            onClick={() => setEditMode(true)}
            className="mt-4 rounded-lg bg-bleu px-4 py-2 text-white shadow transition hover:bg-bleu/80"
          >
            Modifier
          </button>
        </div>
      )}

      <a
        href="/app/password"
        className="inline-block rounded-lg bg-bleu px-4 py-2 text-white shadow transition hover:bg-bleu/80"
      >
        Changer mon mot de passe
      </a>
    </div>
  );
}
