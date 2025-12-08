import React, { useState } from "react";

export default function ResetPassword() {
  const email = localStorage.getItem("email") || "";

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPwd !== confirm) {
      setMessage("❌ Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const res = await fetch("http://127.0.0.1:8000/api/auth/reset-password/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        old_password: oldPwd,
        new_password: newPwd,
      }),
    });

    const data = await res.json();

    if (data.ok) {
      setMessage("✅ Mot de passe modifié avec succès !");
    } else {
      setMessage("❌ " + data.error);
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-mauve/30 rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-mauve mb-4">
          Modifier mon mot de passe
        </h1>

        {message && (
          <div className="mb-4 rounded-lg bg-mauve/10 border border-mauve px-4 py-3 text-mauve">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-medium text-mauve block mb-1">
              Ancien mot de passe
            </label>
            <input
              type="password"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-mauve/40 focus:ring-2 focus:ring-mauve"
            />
          </div>

          <div>
            <label className="font-medium text-mauve block mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-mauve/40 focus:ring-2 focus:ring-mauve"
            />
          </div>

          <div>
            <label className="font-medium text-mauve block mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-mauve/40 focus:ring-2 focus:ring-mauve"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-mauve text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-mauve/80 transition disabled:opacity-50"
          >
            {loading ? "En cours…" : "Mettre à jour"}
          </button>
        </form>
      </div>
    </div>
  );
}