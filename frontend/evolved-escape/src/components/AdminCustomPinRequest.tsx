import React, { useEffect, useState } from "react";

type Request = {
  id: number;
  title: string;
  quantity: number;
  notes: string;
  logoUrl: string;
  status: string; // ex: "en attente" | "validée" | "refusée"
  user_nom?: string;
  user_prenom?: string;
  user_email?: string;
  created_at: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const API_URL = `${API_BASE}/api/pins/requests`;

const AdminCustomPinRequests: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);

  const formatUserName = (req: Request) => {
    const fullName = `${req.user_prenom ?? ""} ${req.user_nom ?? ""}`.trim();
    if (fullName) return fullName;
    if (req.user_email) return req.user_email;
    return "Utilisateur inconnu";
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/admin`, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur lors du chargement des demandes");
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteRequest = async (id: number) => {
    if (!confirm("Supprimer cette demande ?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6">
      <h1 className="text-2xl font-bold text-bleu sm:text-3xl">Demandes de Pins personnalisés</h1>
      {requests.length === 0 ? (
        <p className="text-center text-sm text-gray-600 sm:text-base">Aucune demande de penne pour le moment.</p>
      ) : (
        <ul className="space-y-4">
          {requests.map((req) => (
            <li
              key={req.id}
              className="space-y-2 rounded-lg border border-bleu/30 bg-white px-4 py-4 text-sm text-gray-700 shadow-sm sm:px-5 sm:text-base"
            >
              <p><strong className="text-bleu">Titre :</strong> {req.title}</p>
              <p><strong className="text-bleu">Quantité :</strong> {req.quantity}</p>
              <p><strong className="text-bleu">Notes :</strong> {req.notes || "—"}</p>
              <p><strong className="text-bleu">Date :</strong> {new Date(req.created_at).toLocaleString()}</p>
              <p><strong className="text-bleu">Utilisateur :</strong> {formatUserName(req)}</p>
              <img
                src={req.logoUrl}
                alt="logo"
                className="h-28 w-28 rounded border object-contain sm:h-32 sm:w-32"
              />
              <div>
                <a
                  href={req.logoUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg border-2 border-bleu bg-bleu px-4 py-1 text-sm font-semibold text-white transition duration-150 hover:bg-blue-50 hover:text-bleu"
                >
                  Télécharger
                </a>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                  <span className="mr-2">Statut :</span>
                  <select
                    value={req.status}
                    onChange={(e) => updateStatus(req.id, e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="en attente">En attente</option>
                    <option value="validée">Validée</option>
                    <option value="refusée">Refusée</option>
                  </select>
                </label>
                <button
                  onClick={() => deleteRequest(req.id)}
                  className="rounded bg-red-500 px-3 py-1 text-sm text-white transition hover:bg-red-600"
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default AdminCustomPinRequests;
