import { useState } from "react";
import { apiUrl } from "../lib/api";

type DeleteButtonProps = {
  endpoint: string; // ex: /api/chants/12/
  label?: string;
  confirmMessage?: string;
  requestInit?: RequestInit;
  onSuccess?: () => void;
  onError?: (message: string) => void;
  className?: string;
  disabled?: boolean;
};

/**
 * Bouton de suppression réutilisable.
 * Il appelle l'endpoint passé en props et gère confirmation + erreurs basiques.
 */
export default function DeleteButton({
  endpoint,
  label = "Supprimer",
  confirmMessage = "Supprimer cet élément ?",
  requestInit,
  onSuccess,
  onError,
  className = "",
  disabled = false,
}: DeleteButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;
    if (confirmMessage && !confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const res = await fetch(apiUrl(endpoint), {
        method: "DELETE",
        ...(requestInit || {}),
      });

      if (!res.ok) throw new Error("Suppression impossible");

      onSuccess?.();
    } catch (err: any) {
      const message = err?.message || "Une erreur est survenue";
      if (onError) onError(message);
      else alert(message);
    } finally {
      setLoading(false);
    }
  };

  const baseClasses =
    "px-3 py-1 rounded text-sm font-semibold transition disabled:opacity-70 disabled:cursor-not-allowed";
  const colorClasses =
    className?.trim().length > 0 ? className : "bg-red-600 text-white";

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className={`${baseClasses} ${colorClasses}`}
    >
      {loading ? "..." : label}
    </button>
  );
}
