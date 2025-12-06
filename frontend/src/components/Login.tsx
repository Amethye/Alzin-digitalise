import React, { useState } from "react";

interface LoginFormProps {
  next?: string;
}

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const LoginForm: React.FC<LoginFormProps> = ({ next = "/" }) => {
  const [ident, setIdent] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmedIdent = ident.trim();
    if (!trimmedIdent || !password) {
      setError("Email et mot de passe requis.");
      return;
    }

    if (!isEmail(trimmedIdent)) {
      setError("Saisis un email valide.");
      return;
    }

    const payload = {
      email: trimmedIdent.toLowerCase(),
      password,
    };

    try {
      setIsLoading(true);

      const res = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {}

      if (!res.ok || !data.success) {
        setError(data.error || `Erreur ${res.status}`);
        return;
      }

      // ➜ ENREGISTRER L'EMAIL POUR LE COMPTE
      localStorage.setItem("email", payload.email);

      // ➜ REDIRECTION
      window.location.href = next || "/";

    } catch (err) {
      console.error(err);
      setError("Erreur réseau, réessaie plus tard.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl bg-white px-5 py-6 shadow-lg sm:px-8">
      <h1 className="mb-2 bg-white text-xl font-semibold text-mauve sm:text-2xl">Connexion</h1>

      <form onSubmit={handleSubmit} className="stack" noValidate>

        <label htmlFor="ident">Email</label>
        <input
          id="ident"
          name="ident"
          type="text"
          placeholder="email"
          autoComplete="username"
          value={ident}
          onChange={(e) => setIdent(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve"
          required
        />

        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve"
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg border-2 border-mauve bg-mauve px-4 py-2 text-white transition hover:bg-mauve-50 hover:text-mauve disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Connexion..." : "Se connecter"}
        </button>

        {error && (
          <p aria-live="polite" style={{ color: "#b00" }}>
            {error}
          </p>
        )}

        <style>
          {`
            .stack { display:flex; flex-direction:column; gap:.8rem; max-width:380px; }
            input, button { padding:.55rem .7rem; font-size:1rem; }
          `}
        </style>
      </form>

      <a href="/RequestPasswordReset" className="text-sm text-gray-600 hover:underline">
        Mot de passe oublié ?
      </a>
    </div>
  );
};

export default LoginForm;