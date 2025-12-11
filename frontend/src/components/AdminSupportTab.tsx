import { useEffect, useState } from "react";

type SupportTicket = {
  id: number;
  objet: string;
  description: string;
  status: string;
  created_at: string;
  utilisateur: {
    id: number;
    pseudo: string;
    email: string;
  };
  has_attachments: boolean;
};

type TicketDetail = SupportTicket & {
  attachments?: {
    id: number;
    filename: string;
    url: string | null;
  }[];
  internal_notes?: string;
};

type Me = {
  id: number;
  pseudo: string;
  role: string;
};

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-BE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminSupportTab() {
  const [me, setMe] = useState<Me | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("");

  const email = typeof window !== "undefined" ? localStorage.getItem("email") : null;

  useEffect(() => {
    if (!email) {
      setError("Tu dois être connecté pour accéder à l'administration.");
      setLoading(false);
      return;
    }

    const headers: Record<string, string> = {
      "X-User-Email": email,
    };

    async function fetchAll() {
      try {
        setLoading(true);
        setError(null);

        // Vérifier le rôle + charge utilisateur
        const resMe = await fetch("/api/me/", { headers });
        if (!resMe.ok) {
          throw new Error("Impossible de charger ton profil.");
        }
        const meData = await resMe.json();
        setMe({
          id: meData.id,
          pseudo: meData.pseudo,
          role: meData.role,
        });

        if (meData.role !== "admin") {
          setError("Accès réservé aux administrateurs.");
          setLoading(false);
          return;
        }

        // Charger les tickets
        const url = statusFilter
          ? `/api/admin/support/?status=${encodeURIComponent(statusFilter)}`
          : "/api/admin/support/";

        const resTickets = await fetch(url, { headers });
        if (!resTickets.ok) {
          throw new Error("Impossible de charger les demandes de support.");
        }

        const dataTickets: SupportTicket[] = await resTickets.json();
        setTickets(dataTickets);
      } catch (e: any) {
        setError(e.message || "Une erreur est survenue.");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [email, statusFilter]);

  const handleSelectTicket = async (id: number) => {
    if (!email) return;

    const headers: Record<string, string> = {
      "X-User-Email": email,
    };

    try {
      setLoadingDetail(true);
      setError(null);

      const res = await fetch(`/api/admin/support/${id}/`, {
        headers,
      });

      if (!res.ok) {
        throw new Error("Impossible de charger le détail de cette demande.");
      }

      const detail: TicketDetail = await res.json();
      setSelectedTicket(detail);
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!email || !selectedTicket) return;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-User-Email": email,
    };

    try {
      setUpdating(true);
      setError(null);

      const res = await fetch(
        `/api/admin/support/${selectedTicket.id}/`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) {
        throw new Error("Impossible de mettre à jour le statut.");
      }

      // Met à jour l'état local
      setSelectedTicket((prev) =>
        prev ? { ...prev, status: newStatus } : prev
      );
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id ? { ...t, status: newStatus } : t
        )
      );
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white px-4 py-6 text-sm text-gray-600 shadow-sm sm:px-6 sm:py-8 sm:text-base">
        Chargement des demandes de support...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white px-4 py-6 shadow-sm sm:px-6 sm:py-8">
        <p className="text-sm font-medium text-red-600 sm:text-base">{error}</p>
      </div>
    );
  }

  if (!me || me.role !== "admin") {
    return (
      <div className="rounded-xl bg-white px-4 py-6 shadow-sm sm:px-6 sm:py-8">
        <p className="text-sm text-gray-700 sm:text-base">
          Accès réservé aux administrateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white px-4 py-6 shadow-sm sm:px-6 sm:py-8 lg:flex-row">
      {/* Liste des tickets */}
      <section className="w-full lg:w-1/2 lg:border-r lg:border-gray-200 lg:pr-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-bordeau sm:text-xl">
            Demandes de support
          </h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bordeau sm:w-48 sm:text-base"
          >
            <option value="">Tous les statuts</option>
            <option value="new">Nouvelles</option>
            <option value="in_progress">En cours</option>
            <option value="closed">Clôturées</option>
          </select>
        </div>

        {tickets.length === 0 ? (
          <p className="text-sm text-gray-600 sm:text-base">
            Aucune demande de support pour le moment.
          </p>
        ) : (
          <ul className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
            {tickets.map((t) => (
              <li
                key={t.id}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-sm shadow-sm transition hover:bg-gray-50 sm:text-base ${
                  selectedTicket?.id === t.id
                    ? "border-bordeau bg-bordeau/5"
                    : "border-gray-200"
                }`}
                onClick={() => handleSelectTicket(t.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">
                      {t.objet}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t.utilisateur.pseudo} · {t.utilisateur.email}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      t.status === "new"
                        ? "bg-bordeau-100 text-bordeau-800"
                        : t.status === "in_progress"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {t.status === "new"
                      ? "Nouvelle"
                      : t.status === "in_progress"
                      ? "En cours"
                      : "Clôturée"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-gray-600 sm:text-sm">
                  {t.description}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Reçue le {formatDate(t.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Détail du ticket sélectionné */}
      <section className="w-full lg:w-1/2 lg:pl-4">
        {loadingDetail && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
            Chargement du détail...
          </div>
        )}

        {!loadingDetail && !selectedTicket && (
          <div className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-sm text-gray-500">
            Sélectionne une demande dans la liste pour voir le détail.
          </div>
        )}

        {!loadingDetail && selectedTicket && (
          <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 sm:px-4 sm:py-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-bordeau sm:text-lg">
                  {selectedTicket.objet}
                </h3>
                <p className="text-xs text-gray-500 sm:text-sm">
                  #{selectedTicket.id} · {selectedTicket.utilisateur.pseudo} ·{" "}
                  {selectedTicket.utilisateur.email}
                </p>
              </div>
              <select
                value={selectedTicket.status}
                onChange={(e) => handleChangeStatus(e.target.value)}
                disabled={updating}
                className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-bordeau sm:text-sm"
              >
                <option value="new">Nouvelle</option>
                <option value="in_progress">En cours</option>
                <option value="closed">Clôturée</option>
              </select>
            </div>

            <div>
              <h4 className="mb-1 text-xs font-semibold text-gray-700 sm:text-sm">
                Description
              </h4>
              <p className="whitespace-pre-wrap text-sm text-gray-800 sm:text-base">
                {selectedTicket.description}
              </p>
            </div>

            {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
              <div>
                <h4 className="mb-1 text-xs font-semibold text-gray-700 sm:text-sm">
                  Pièces jointes
                </h4>
                <ul className="list-inside list-disc text-xs text-bordeau sm:text-sm">
                  {selectedTicket.attachments.map((att) =>
                    att.url ? (
                      <li key={att.id}>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline hover:text-bordeau-800"
                        >
                          {att.filename}
                        </a>
                      </li>
                    ) : (
                      <li key={att.id}>{att.filename}</li>
                    )
                  )}
                </ul>
              </div>
            )}

            <p className="text-xs text-gray-400">
              Reçue le {formatDate(selectedTicket.created_at)}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
