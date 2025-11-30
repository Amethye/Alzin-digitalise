import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const API_URL = `${API_BASE}/api/pins/requests/`;

const CustomPinRequest: React.FC = () => {
  const [title, setTitle] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title || !logo) {
      setError("Merci de renseigner un titre et d'ajouter un logo.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("quantity", String(quantity));
      formData.append("notes", notes);
      formData.append("logo", logo);

      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l’envoi de la demande");
      }

      setTitle("");
      setQuantity(1);
      setNotes("");
      setLogo(null);
      setSuccess("Votre demande a bien été envoyée !");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-6 sm:gap-8 sm:px-6">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-4 rounded-xl border bg-white px-4 py-5 shadow-md sm:px-6"
      >
        <h2 className="text-lg font-bold text-bleu sm:text-xl">Demande de Pins personnalisé</h2>

        <input
          type="text"
          placeholder="Titre du pin"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded"
          required
        />

        <input
          type="number"
          placeholder="Quantité"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          min={1}
          className="border p-2 rounded"
          required
        />

        <textarea
          placeholder="Notes (facultatif)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setLogo(e.target.files?.[0] || null)}
          className="border p-2 rounded"
          required
        />

        <button
          type="submit"
          className="rounded bg-green-500 px-4 py-2 text-white transition hover:bg-green-600"
        >
          Envoyer
        </button>

        {success && <p className="text-sm text-green-600 sm:text-base">{success}</p>}
        {error && <p className="text-sm text-red-600 sm:text-base">{error}</p>}
      </form>
    </div>
  );
};

export default CustomPinRequest;
