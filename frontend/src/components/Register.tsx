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

  // --- VALIDATIONS LOCALES ---
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { nom, prenom, email, pseudo, ville, password, password2 } = form;

    // Vérification champs obligatoires
    if (!nom || !prenom || !email || !pseudo || !ville || !password || !password2) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    // Vérification email format
    if (!isValidEmail(email)) {
      setError("Format d'adresse email invalide.");
      return;
    }

    // Vérification MDP identiques
    if (password !== password2) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    // --- VÉRIFICATION CÔTÉ BACKEND (pseudo + nom+prenom) ---
    try {
      const check = await fetch(
        `/api/utilisateurs/check?email=${encodeURIComponent(email)}&pseudo=${encodeURIComponent(
          pseudo
        )}&nom=${encodeURIComponent(nom)}&prenom=${encodeURIComponent(prenom)}`
      );

      const checkData = await check.json();

      if (!check.ok) {
        setError(checkData.error || "Erreur lors de la vérification.");
        return;
      }

      if (checkData.existsNomPrenom) {
        setError("Un utilisateur avec le même nom et prénom existe déjà.");
        return;
      }

      if (checkData.existsPseudo) {
        setError("Ce pseudo est déjà utilisé.");
        return;
      }

      if (checkData.existsEmail) {
        setError("Un compte avec cette adresse email existe déjà.");
        return;
      }

    } catch {
      setError("Erreur serveur pendant la vérification.");
      return;
    }

    // --- INSCRIPTION ---
    try {
      const res = await fetch("/api/utilisateurs/", {
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
      <h1 className="mb-2 text-xl font-semibold text-bordeau sm:text-2xl">Inscription</h1>

      <form onSubmit={handleSubmit} className="stack" noValidate>
        {["nom","prenom","email","pseudo","ville"].map((field) => (
          <div key={field}>
            <label className="font-semibold capitalize">{field}</label>
            <input
              type={field === "email" ? "email" : "text"}
              name={field}
              value={(form as any)[field]}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-bordeau w-full"
            />
          </div>
        ))}

        <label className="font-semibold">Mot de passe</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-bordeau w-full"
        />

        <label className="font-semibold">Confirmer le mot de passe</label>
        <input
          type="password"
          name="password2"
          value={form.password2}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-bordeau w-full"
        />

        <button type="submit" className="btn btn-solid mt-4 w-full">
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