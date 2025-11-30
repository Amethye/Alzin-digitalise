// src/pages/RequestPasswordReset.tsx
import { useState } from "react";

const RequestPasswordReset = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.");
      } else {
        setMessage(`Erreur : ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-6 sm:px-6">
      <div className="w-full max-w-md rounded-xl bg-white px-5 py-6 shadow-lg sm:px-8">
      <h1 className="mb-4 text-xl font-bold text-bleu sm:text-2xl">Réinitialiser votre mot de passe</h1>
      {message && <p className="text-sm text-gray-700 sm:text-base">{message}</p>}
      {!message && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Entrez votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-lg border-2 border-bleu bg-bleu px-4 py-2 text-white transition duration-150 hover:bg-blue-50 hover:text-bleu disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
          </button>
        </form>
      )}
      </div>
    </div>
  );
};

export default RequestPasswordReset;
