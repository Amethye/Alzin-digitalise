import { useState, useEffect } from "react";

interface UserInfo {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  pseudo: string;
  ville: string;
}

type ApiUserResponse = UserInfo | { error: string };

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

  // Charger l'utilisateur
  useEffect(() => {
    const email = localStorage.getItem("email");

    if (!email) {
      setError("Aucun utilisateur connecté.");
      return;
    }

    fetch("http://100.72.62.18:8000/api/me/", {
      headers: { "X-User-Email": email },
    })
      .then((res) => res.json())
      .then((data: ApiUserResponse) => {
        if ("error" in data) {
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
      .catch(() =>
        setError("Impossible de récupérer les informations.")
      );
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = localStorage.getItem("email");

    const res = await fetch("http://100.72.62.18:8000/api/me/", {
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

    setUser({ ...user!, ...form });
    localStorage.setItem("email", form.email.toLowerCase());
    setEditMode(false);
  };

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-gray-500 text-lg">Chargement…</p>
      </div>
    );

  return (
    <div className="flex flex-col items-center px-4 pt-10 min-h-[calc(100vh-200px)]">

      <div className="w-full max-w-2xl mb-10">
        <h1 className="text-3xl font-bold text-mauve mb-6">
          Mon compte
        </h1>

        {error && (
          <p className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-red-600">
            {error}
          </p>
        )}

        {/* MODE ÉDITION */}
        {editMode ? (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-purple-50/40 border border-mauve/30 p-6 shadow-md space-y-5"
          >
            {["nom", "prenom", "email", "pseudo", "ville"].map((field) => (
              <div key={field}>
                <label className="font-semibold text-mauve block mb-1">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field === "email" ? "email" : "text"}
                  name={field}
                  value={(form as any)[field]}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-mauve/30 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-mauve"
                />
              </div>
            ))}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                className="rounded-lg bg-mauve text-white px-4 py-2 shadow hover:bg-mauve/80 transition"
              >
                Sauvegarder
              </button>

              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="rounded-lg border border-mauve px-4 py-2 hover:bg-mauve/10 transition"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => (window.location.href = "/reset-password")}
                className="rounded-lg bg-mauve px-4 py-2 text-white shadow hover:bg-mauve/80 transition"
              >
                Modifier mon mot de passe
              </button>
            </div>
          </form>
        ) : (
          // MODE AFFICHAGE
          <div className="rounded-2xl bg-purple-50/40 border border-mauve/30 p-6 shadow-md space-y-3">
            <p><span className="font-semibold text-mauve">Nom :</span> {user.nom}</p>
            <p><span className="font-semibold text-mauve">Prénom :</span> {user.prenom}</p>
            <p><span className="font-semibold text-mauve">Pseudo :</span> {user.pseudo}</p>
            <p><span className="font-semibold text-mauve">Ville :</span> {user.ville}</p>
            <p><span className="font-semibold text-mauve">Email :</span> {user.email}</p>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setEditMode(true)}
                className="rounded-lg bg-mauve px-4 py-2 text-white shadow hover:bg-mauve/80 transition"
              >
                Modifier mes données
              </button>

              <button
                onClick={() => (window.location.href = "/reset-password")}
                className="rounded-lg bg-mauve px-4 py-2 text-white shadow hover:bg-mauve/80 transition"
              >
                Changer mon mot de passe
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}