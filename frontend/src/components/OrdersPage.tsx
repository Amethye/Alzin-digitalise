import { useEffect, useState } from "react";

type Commande = {
  id: number;
  date_commande: string;
  status: string;
};

type AlzinPerso = {
  id: number;
  nom_chansonnier_perso: string;
  couleur: string;
  type_papier: string;
  prix_vente_unite: string;
  date_creation: string;
};

type ActiveTab = "en_cours" | "passees" | "alzins";

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-BE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// Heuristique simple pour classer les statuts "passés"
function isPastStatus(status: string) {
  const s = (status || "").toLowerCase();
  const keywords = [
    "terminée",
    "terminee",
    "livrée",
    "livree",
    "annulée",
    "annulee",
    "expédiée",
    "expediee",
    "envoyée",
    "envoyee",
  ];
  return keywords.some((k) => s.includes(k));
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("en_cours");
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [alzins, setAlzins] = useState<AlzinPerso[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) {
      setError("Tu dois être connecté pour voir tes commandes.");
      setLoading(false);
      return;
    }

    const headers = {
      "X-User-Email": email,
    };

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [resCmd, resAlzins] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/mes-commandes/", {
            headers,
          }),
          fetch("http://127.0.0.1:8000/api/mes-chansonniers/", {
            headers,
          }),
        ]);

        if (!resCmd.ok) {
          throw new Error("Erreur lors du chargement des commandes.");
        }
        if (!resAlzins.ok) {
          throw new Error("Erreur lors du chargement des alzins personnalisés.");
        }

        const dataCmd: Commande[] = await resCmd.json();
        const dataAlzins: AlzinPerso[] = await resAlzins.json();

        setCommandes(dataCmd || []);
        setAlzins(dataAlzins || []);
      } catch (e: any) {
        setError(e.message || "Une erreur est survenue.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const commandesEnCours = commandes.filter((c) => !isPastStatus(c.status));
  const commandesPassees = commandes.filter((c) => isPastStatus(c.status));

  const handleCreateOrder = async () => {
    const email = localStorage.getItem("email");
    if (!email) {
      setError("Tu dois être connecté pour créer une commande.");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const res = await fetch("http://127.0.0.1:8000/api/mes-commandes/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": email,
        },
        body: JSON.stringify({
          status: "PANIER", // statut par défaut pour une nouvelle commande
        }),
      });

      if (!res.ok) {
        throw new Error("Impossible de créer une nouvelle commande.");
      }

      const newCommande: Commande = await res.json();
      setCommandes((prev) => [newCommande, ...prev]);
      setActiveTab("en_cours");
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue lors de la création.");
    } finally {
      setCreating(false);
    }
  };

  const renderCommandesList = (items: Commande[], emptyText: string) => {
    if (items.length === 0) {
      return (
        <p className="text-sm text-gray-600 sm:text-base">
          {emptyText}
        </p>
      );
    }

    return (
      <ul className="space-y-3">
        {items.map((c) => (
          <li
            key={c.id}
            className="flex flex-col rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-mauve sm:text-base">
                Commande #{c.id}
              </p>
              <p className="text-xs text-gray-600 sm:text-sm">
                Date : {formatDate(c.date_commande)}
              </p>
              <p className="text-xs text-gray-500 sm:text-sm">
                Statut : <span className="font-medium">{c.status || "—"}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const renderAlzinsList = () => {
    if (alzins.length === 0) {
      return (
        <p className="text-sm text-gray-600 sm:text-base">
          Tu n’as pas encore d’alzin personnalisé.
        </p>
      );
    }

    return (
      <ul className="space-y-3">
        {alzins.map((a) => (
          <li
            key={a.id}
            className="flex flex-col rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-mauve sm:text-base">
                {a.nom_chansonnier_perso}
              </p>
              <p className="text-xs text-gray-600 sm:text-sm">
                Créé le : {formatDate(a.date_creation)}
              </p>
              <p className="text-xs text-gray-500 sm:text-sm">
                Couleur : <span className="font-medium">{a.couleur}</span> ·
                Type de papier : <span className="font-medium">{a.type_papier}</span>
              </p>
            </div>
            <div className="mt-2 text-xs font-semibold text-gray-700 sm:mt-0 sm:text-sm">
              {a.prix_vente_unite ? `${a.prix_vente_unite} €` : ""}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl rounded-xl bg-white px-4 py-6 text-center text-sm text-gray-600 shadow-lg sm:px-6 sm:py-8 sm:text-base">
        Chargement de tes commandes...
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl rounded-xl bg-white px-4 py-6 shadow-lg sm:px-6 sm:py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mauve sm:text-3xl">
            Commandes d&apos;Alzin
          </h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            Consulte tes commandes, ton historique et tes alzins personnalisés.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600 sm:text-base">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        {/* Panneau vertical gauche */}
        <aside className="w-full shrink-0 rounded-xl bg-gray-50 p-4 lg:w-64">
          <nav className="space-y-2">
            <button
              type="button"
              onClick={() => setActiveTab("en_cours")}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium sm:text-base ${
                activeTab === "en_cours"
                  ? "bg-mauve text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>Mes commandes en cours</span>
              <span className="text-xs opacity-80">
                {commandesEnCours.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("passees")}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium sm:text-base ${
                activeTab === "passees"
                  ? "bg-mauve text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>Mes commandes passées</span>
              <span className="text-xs opacity-80">
                {commandesPassees.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("alzins")}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium sm:text-base ${
                activeTab === "alzins"
                  ? "bg-mauve text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>Mes alzins personnalisés</span>
              <span className="text-xs opacity-80">
                {alzins.length}
              </span>
            </button>
          </nav>

          {/* Bouton + toujours visible */}
          <button
            type="button"
            onClick={handleCreateOrder}
            disabled={creating}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-mauve px-3 py-2 text-sm font-semibold text-mauve duration-150 hover:bg-mauve hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
          >
            <span className="text-lg leading-none">+</span>
            <span>
              {creating ? "Création..." : "Nouvelle commande"}
            </span>
          </button>
        </aside>

        {/* Contenu principal */}
        <section className="flex-1 rounded-xl bg-white">
          {activeTab === "en_cours" && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-mauve sm:text-xl">
                Mes commandes en cours
              </h2>
              {renderCommandesList(
                commandesEnCours,
                "Tu n’as pas encore de commande en cours."
              )}
            </div>
          )}

          {activeTab === "passees" && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-mauve sm:text-xl">
                Mes commandes passées
              </h2>
              {renderCommandesList(
                commandesPassees,
                "Tu n’as pas encore de commande passée."
              )}
            </div>
          )}

          {activeTab === "alzins" && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-mauve sm:text-xl">
                Mes alzins personnalisés
              </h2>
              {renderAlzinsList()}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
