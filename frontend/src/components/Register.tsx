import { useState } from "react";

interface SignupFormProps {
  next?: string; // redirection après inscription
}

export default function SignupForm({ next }: SignupFormProps) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [ville, setVille] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Vérification basique
    if (!nom || !prenom || !email || !pseudo || !ville || !password || !password2) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    if (password !== password2) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/register/", {
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

      let data: any = {};
      try { data = await res.json(); } catch {}

      if (!res.ok || !data.success) {
        setError(data.error || `Erreur ${res.status}`);
        return;
      }

      // succès
      setSuccess("Inscription réussie !");
      setNom(""); 
      setPrenom(""); 
      setEmail(""); 
      setPseudo("");
      setVille("");
      setPassword(""); 
      setPassword2("");

      if (next) window.location.href = next;

    } catch (err) {
      console.error(err);
      setError("Erreur serveur, réessaie plus tard.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stack" noValidate>

      <label htmlFor="nom">Nom</label>
      <input
        id="nom"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        type="text"
        required
      />

      <label htmlFor="prenom">Prénom</label>
      <input
        id="prenom"
        value={prenom}
        onChange={(e) => setPrenom(e.target.value)}
        type="text"
        required
      />

      <label htmlFor="email">Email</label>
      <input
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        required
      />

      <label htmlFor="pseudo">Pseudo</label>
      <input
        id="pseudo"
        value={pseudo}
        onChange={(e) => setPseudo(e.target.value)}
        type="text"
        required
      />

      <label htmlFor="ville">Ville</label>
      <input
        id="ville"
        value={ville}
        onChange={(e) => setVille(e.target.value)}
        type="text"
        required
      />

      <label htmlFor="password">Mot de passe</label>
      <input
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        required
      />

      <label htmlFor="password2">Confirmer le mot de passe</label>
      <input
        id="password2"
        value={password2}
        onChange={(e) => setPassword2(e.target.value)}
        type="password"
        required
      />

      <button
        type="submit"
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        S'inscrire
      </button>

      {error && <p style={{ color: "#b00" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </form>
  );
}