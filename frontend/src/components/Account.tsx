import { useState, useEffect } from "react";

interface UserInfo {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  pseudo: string;
  ville: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    pseudo: "",
    ville: "",
  });

  // Charger les infos utilisateur
  useEffect(() => {
    const email = localStorage.getItem("email");

    if (!email) {
      setError("Aucun utilisateur connecté.");
      return;
    }

    fetch("http://127.0.0.1:8000/api/me/", {
      headers: {
        "X-User-Email": email,
      },
    })
      .then((res) => res.json())
      .then((data: UserInfo) => {
        if (data.error) {
          setError(data.error);
          return;
        }

        setUser(data);
        setForm({
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          pseudo: data.pseudo,
          ville: data.ville,
        });
      })
      .catch(() => setError("Impossible de récupérer les informations."));
  }, []);

  // Gestion des champs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Soumission de la mise à jour
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = localStorage.getItem("email");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/me/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": email || "",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Erreur lors de la mise à jour");
        return;
      }

      // Mettre à jour la page
      setUser({ ...user!, ...form });
      setEditMode(false);

      // Mettre à jour l'email stocké si modifié
      localStorage.setItem("email", form.email.toLowerCase());

    } catch (err: any) {
      setError("Erreur serveur.");
    }
  };

  // Aucun utilisateur encore chargé
  if (!user)
    return (
      <p className="text-center text-sm text-gray-600 sm:text-base">
        Chargement des informations...
      </p>
    );

  return (
    <div className="w-full max-w-xl space-y-5">
      <h1 className="text-2xl font-bold text-mauve sm:text-3xl">Mon compte</h1>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {editMode ? (
        // MODE ÉDITION
        <form
          className="mb-6 space-y-4 rounded-2xl bg-gray-100 px-4 py-5 shadow sm:px-6"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="font-semibold block mb-1">Nom</label>
            <input
              type="text"
              name="nom"
              value={form.nom}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mauve"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Prénom</label>
            <input
              type="text"
              name="prenom"
              value={form.prenom}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mauve"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mauve"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Pseudo</label>
            <input
              type="text"
              name="pseudo"
              value={form.pseudo}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mauve"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Ville</label>
            <input
              type="text"
              name="ville"
              value={form.ville}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mauve"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-mauve px-4 py-2 text-white shadow transition hover:bg-mauve/80"
            >
              Sauvegarder
            </button>

            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="rounded-lg border px-4 py-2"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        // MODE AFFICHAGE
        <div className="mb-6 space-y-2 rounded-2xl bg-gray-100 px-4 py-5 shadow sm:px-6">
          <p><span className="font-semibold text-mauve">Nom :</span> {user.nom}</p>
          <p><span className="font-semibold text-mauve">Prénom :</span> {user.prenom}</p>
          <p><span className="font-semibold text-mauve">Pseudo :</span> {user.pseudo}</p>
          <p><span className="font-semibold text-mauve">Ville :</span> {user.ville}</p>
          <p><span className="font-semibold text-mauve">Email :</span> {user.email}</p>

          <button
            onClick={() => setEditMode(true)}
            className="mt-4 rounded-lg bg-mauve px-4 py-2 text-white shadow transition hover:bg-mauve/80"
          >
            Modifier
          </button>
        </div>
      )}
    </div>
  );
}