import React, { useState } from "react";

const PasswordForm: React.FC = () => {
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [form, setForm] = useState({ old_password: "", new_password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg({ text: "", type: "" });

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      if (res.ok) {
        setMsg({ text: "Mot de passe mis à jour ✅", type: "ok" });
        setForm({ old_password: "", new_password: "" });
      } else {
        const data = await res.json();
        setMsg({ text: data.error || "Erreur lors de la mise à jour", type: "err" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: "Erreur réseau", type: "err" });
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl bg-white px-5 py-6 shadow-lg sm:px-8">
      <h1 className="mb-2 bg-white text-xl font-semibold text-bleu sm:text-2xl">Changer mon mot de passe</h1>
      <form onSubmit={handleSubmit} className="stack">
        <input
          name="old_password"
          type="password"
          placeholder="Ancien mot de passe"
          value={form.old_password}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          name="new_password"
          type="password"
          placeholder="Nouveau mot de passe (min 8)"
          value={form.new_password}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          minLength={8}
          required
        />
        <button
          type="submit"
          className="rounded-lg border-2 border-bleu bg-bleu px-4 py-2 text-white transition duration-150 hover:bg-blue-50 hover:text-bleu"
        >
          Mettre à jour
        </button>
        <div
          id="msg"
          aria-live="polite"
          className={msg.type === "ok" ? "ok mt-2" : msg.type === "err" ? "err mt-2" : ""}
        >
          {msg.text}
        </div>
        <style>
          {`
            .stack { display:flex; flex-direction:column; gap:.75rem; max-width:360px; }
            input, button { padding:.55rem .7rem; font-size:1rem; }
            .ok { color:green; font-weight:bold; }
            .err { color:red; font-weight:bold; }
          `}
        </style>
      </form>
    </div>
  );
};

export default PasswordForm;
