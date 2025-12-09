import React, { useState, useEffect } from "react";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) setEmail(storedEmail);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setMessage("Impossible de déterminer l'utilisateur.");
      return;
    }

    if (newPwd !== confirm) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
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

      if (!res.ok) {
        setMessage(data.error || "Erreur lors du changement.");
      } else {
        setMessage("Mot de passe modifié avec succès !");
      }
    } catch {
      setMessage("Erreur serveur.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-xl bg-purple-50/40 border border-mauve/30">

      {message && (
        <p className="rounded-lg border border-mauve bg-mauve/10 px-3 py-2 text-mauve">
          {message}
        </p>
      )}

      <p className="text-sm">Utilisateur : <strong>{email || "Inconnu"}</strong></p>

      <div>
        <label>Ancien mot de passe</label>
        <input
          type="password"
          value={oldPwd}
          onChange={(e) => setOldPwd(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
      </div>

      <div>
        <label>Nouveau mot de passe</label>
        <input
          type="password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
      </div>

      <div>
        <label>Confirmer le mot de passe</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-mauve text-white px-4 py-2 rounded-lg shadow hover:bg-mauve/80 transition"
      >
        {loading ? "En cours..." : "Modifier le mot de passe"}
      </button>

    </form>
  );
}