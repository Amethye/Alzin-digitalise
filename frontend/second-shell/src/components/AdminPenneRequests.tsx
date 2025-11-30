import React, { useEffect, useState } from "react";

interface PenneRequest {
  id: string;
  user_nom: string;
  user_prenom: string;
  couleur: string;
  liseré: string;
  broderie: string;
  tourDeTete: string;
  status: "en attente" | "traitée" | "refusée";
}

const AdminPenneRequests: React.FC = () => {
  const [requests, setRequests] = useState<PenneRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/penne-requests/", { credentials: "include" });
      if (!res.ok) throw new Error("Erreur lors du chargement des demandes");
      const data: PenneRequest[] = await res.json();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: "en attente" | "traitée" | "refusée") => {
    try {
      const res = await fetch(`/api/admin/penne-requests/${id}`, {
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

  const deleteRequest = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette demande ?")) return;
    try {
      const res = await fetch(`/api/admin/penne-requests/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading)
    return <p className="text-center text-sm text-gray-600 sm:text-base">Chargement des demandes…</p>;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6">
      <h1 className="text-2xl font-bold text-bleu sm:text-3xl">Demandes de Penne</h1>
      {requests.length === 0 ? (
        <p className="text-center text-sm text-gray-600 sm:text-base">Aucune demande de penne pour le moment.</p>
      ) : (
      <ul className="space-y-4">
        {requests.map((req) => (
          <li key={req.id} className="flex flex-col gap-2 rounded-lg border border-bleu/30 bg-white px-4 py-4 text-sm text-gray-700 shadow-sm sm:px-5 sm:text-base">
            <p>
              <span className="font-semibold text-bleu">Utilisateur :</span> {req.user_nom}{" "}
              {req.user_prenom}
            </p>
            <p>
              <span className="font-semibold text-bleu">Couleur :</span> {req.couleur}
            </p>
            <p>
              <span className="font-semibold text-bleu">Liseré :</span> {req["liseré"]}
            </p>
            <p>
              <span className="font-semibold text-bleu">Broderie :</span> {req.broderie}
            </p>
            <p>
              <span className="font-semibold text-bleu">Tour de tête :</span> {req.tourDeTete}
            </p>
            <p>
              <span className="font-semibold text-bleu">Statut :</span>
              <select
                value={req.status}
                onChange={(e) =>
                  updateStatus(req.id, e.target.value as "en attente" | "traitée" | "refusée")
                }
                className="ml-2 rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="en attente">En attente</option>
                <option value="traitée">Traitée</option>
                <option value="refusée">Refusée</option>
              </select>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => deleteRequest(req.id)}
                className="rounded bg-red-500 px-3 py-1 text-sm text-white transition hover:bg-red-600"
              >
                Supprimer la demande
              </button>
            </div>
          </li>
        ))}
      </ul>)}
    </main>
  );
};

export default AdminPenneRequests;
