import { useState } from "react";

interface SignupFormProps {
  next?: string; // redirection après inscription
}

export default function Register({ next = "/" }: SignupFormProps) {
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    pseudo: "",
    ville: "",
    password: "",
    password2: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { nom, prenom, email, pseudo, ville, password, password2 } = form;

    if (!nom || !prenom || !email || !pseudo || !ville || !password || !password2) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    if (password !== password2) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/utilisateurs/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nom,
          prenom,
          email: email.toLowerCase(),
          pseudo,
          ville,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || `Erreur ${res.status}`);
        return;
      }

      setSuccess("Inscription réussie !");
      setForm({
        nom: "",
        prenom: "",
        email: "",
        pseudo: "",
        ville: "",
        password: "",
        password2: "",
      });

      setTimeout(() => (window.location.href = next), 1000);
    } catch {
      setError("Erreur serveur, réessaie plus tard.");
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl bg-white px-5 py-6 shadow-lg sm:px-8">
      <h1 className="mb-2 text-xl font-semibold text-mauve sm:text-2xl">Inscription</h1>

      <form onSubmit={handleSubmit} className="stack" noValidate>
        {["nom","prenom","email","pseudo","ville"].map((field) => (
          <div key={field}>
            <label className="font-semibold capitalize">{field}</label>
            <input
              type={field === "email" ? "email" : "text"}
              name={field}
              value={(form as any)[field]}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve w-full"
            />
          </div>
        ))}

        <label className="font-semibold">Mot de passe</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve w-full"
        />

        <label className="font-semibold">Confirmer le mot de passe</label>
        <input
          type="password"
          name="password2"
          value={form.password2}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve w-full"
        />

        <button
          type="submit"
          className="rounded-lg border-2 border-mauve bg-mauve px-4 py-2 mt-4 text-white transition hover:bg-mauve-50 hover:text-mauve"
        >
          S'inscrire
        </button>

        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}
      </form>

      <style>{`
        .stack { display: flex; flex-direction: column; gap: .8rem; }
      `}</style>
    </div>
  );
}