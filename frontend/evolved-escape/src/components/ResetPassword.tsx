// src/pages/ResetPassword.tsx
import React, { useState, useEffect } from "react";

const ResetPassword: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Récupère le token depuis l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage("Lien invalide.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://cap.fede.fpms.ac.be/api/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );

      const data = await res.json();
      if (data.ok) {
        setMessage("✅ Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.");
      } else {
        setMessage("❌ " + (data.error || "Erreur lors de la réinitialisation."));
      }
    } catch (err) {
      setMessage("❌ Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-6 sm:px-6">
      <div className="w-full max-w-md rounded-xl bg-white px-5 py-6 shadow-lg sm:px-8">
        <h1 className="mb-4 text-xl font-bold text-bleu sm:text-2xl">Réinitialisation du mot de passe</h1>
        {message && (
          <div className="mb-4 rounded border border-bleu/30 bg-blue-50 px-3 py-2 text-sm text-gray-800 sm:text-base">
            {message}
          </div>
        )}
        {!message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Confirmez le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg border-2 border-bleu bg-bleu px-4 py-2 text-white transition duration-150 hover:bg-blue-50 hover:text-bleu disabled:opacity-50"
            >
              {loading ? "En cours..." : "Réinitialiser"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
