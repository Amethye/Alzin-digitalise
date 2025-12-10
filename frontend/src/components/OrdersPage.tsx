import { useEffect, useState } from "react";
import LogoUrl from "@images/LogoFPMs.svg?url";
import { apiUrl } from "../lib/api";
import DeleteButton from "./DeleteButton";

type Commande = {
  id: number;
  date_commande: string;
  status?: string;
};

type AlzinPerso = {
  id: number;
  nom_chansonnier_perso: string;
  couleur: string;
  type_papier: string;
  prix_vente_unite: string;
  date_creation: string;
};

type FournisseurBase = {
  id: number;
  nom_fournisseur: string;
  ville_fournisseur: string;
  type_reliure: string;
};

type Fournisseur = FournisseurBase & {
  local: boolean;
};

type ActiveTab = "en_cours" | "passees" | "alzins";

const logoSrc = LogoUrl.split("?")[0];

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

function isPastStatus(status: string | undefined) {
  if (!status) return false;
  const s = status.toLowerCase();
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
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noUser, setNoUser] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Formulaire "Nouvelle commande" / "Modifier commande"
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedAlzinId, setSelectedAlzinId] = useState<number | "">("");
  const [selectedFournisseurId, setSelectedFournisseurId] = useState<
    number | ""
  >("");
  const [quantity, setQuantity] = useState<number>(1);
  const [editingCommandeId, setEditingCommandeId] = useState<number | null>(
    null
  );

  useEffect(() => {
    const email = localStorage.getItem("email");

    if (!email) {
      setNoUser(true);
      setLoading(false);
      return;
    }
    setUserEmail(email);

    const authHeaders: Record<string, string> = {
      "X-User-Email": email,
    };

    async function fetchAll() {
      try {
        setLoading(true);
        setError(null);

        const [resCmd, resAlzins, resMe, resFournisseurs] = await Promise.all([
          fetch(apiUrl("/api/mes-commandes/"), {
            headers: authHeaders,
          }),
          fetch(apiUrl("/api/mes-chansonniers/"), {
            headers: authHeaders,
          }),
          fetch(apiUrl("/api/me/"), {
            headers: authHeaders,
          }),
          fetch(apiUrl("/api/fournisseurs/")),
        ]);

        if (
          resCmd.status === 401 ||
          resCmd.status === 403 ||
          resCmd.status === 404
        ) {
          setNoUser(true);
          setLoading(false);
          return;
        }

        if (!resCmd.ok) {
          throw new Error("Erreur lors du chargement des commandes.");
        }
        if (!resAlzins.ok) {
          throw new Error("Erreur lors du chargement des alzins personnalisés.");
        }
        if (!resMe.ok) {
          throw new Error("Erreur lors du chargement de ton profil.");
        }
        if (!resFournisseurs.ok) {
          throw new Error("Erreur lors du chargement des fournisseurs.");
        }

        const dataCmd: Commande[] = await resCmd.json();
        const dataAlzins: AlzinPerso[] = await resAlzins.json();
        const me = await resMe.json();
        const dataFournisseursRaw: FournisseurBase[] =
          await resFournisseurs.json();

        const villeUser = (me.ville as string | undefined) || "";

        const dataFournisseurs: Fournisseur[] = dataFournisseursRaw.map((f) => ({
          ...f,
          local:
            !!villeUser &&
            f.ville_fournisseur.trim().toLowerCase() ===
              villeUser.trim().toLowerCase(),
        }));

        setCommandes(dataCmd || []);
        setAlzins(dataAlzins || []);
        setFournisseurs(dataFournisseurs || []);
      } catch (e: any) {
        setError(e.message || "Une erreur est survenue.");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  const commandesEnCours = commandes.filter((c) => !isPastStatus(c.status));
  const commandesPassees = commandes.filter((c) => isPastStatus(c.status));

  const localFournisseurs = fournisseurs.filter((f) => f.local);
  const otherFournisseurs = fournisseurs.filter((f) => !f.local);

  const resetOrderForm = () => {
    setSelectedAlzinId("");
    setSelectedFournisseurId("");
    setQuantity(1);
    setEditingCommandeId(null);
  };

  const handleOpenOrderForm = () => {
    resetOrderForm();
    setShowOrderForm(true);
    setError(null);
  };

  const handleCancelOrderForm = () => {
    setShowOrderForm(false);
    resetOrderForm();
  };

  const handleCreateOrUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = localStorage.getItem("email");
    if (!email) {
      setNoUser(true);
      setError("Tu dois être connecté pour créer une commande.");
      return;
    }

    if (!selectedAlzinId || !selectedFournisseurId || quantity <= 0) {
      setError("Merci de remplir tous les champs de la commande.");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const headersWithEmail = {
        "Content-Type": "application/json",
        "X-User-Email": email,
      };

      let commandeId = editingCommandeId;

      // CAS 1 : création d'une nouvelle commande
      if (!commandeId) {
        const resCmd = await fetch(apiUrl("/api/mes-commandes/"), {
          method: "POST",
          headers: headersWithEmail,
          body: JSON.stringify({
            status: "PANIER",
          }),
        });

        if (!resCmd.ok) {
          throw new Error("Impossible de créer la commande.");
        }

        const newCommande: Commande = await resCmd.json();
        commandeId = newCommande.id;

        // On ajoute la commande dans la liste affichée
        setCommandes((prev) => [newCommande, ...prev]);
      } else {
        // CAS 2 : édition d'une commande existante
        // On vide les lignes de cette commande pour les recréer proprement
        await fetch(
          apiUrl(`/api/details-commande/?commande_id=${commandeId}`),
          {
            method: "DELETE",
          }
        );
      }

      // Ajout / recréation de la ligne de commande
      const resLigne = await fetch(
        apiUrl("/api/commandes-lignes/"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            commande_id: commandeId,
            chansonnier_perso_id: selectedAlzinId,
            quantite: quantity,
          }),
        }
      );

      if (!resLigne.ok) {
        throw new Error("Impossible d'ajouter l'alzin à la commande.");
      }

      // Enregistrer le fournisseur choisi pour ce chansonnier
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const resFournir = await fetch(apiUrl("/api/fournir/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fournisseur_id: selectedFournisseurId,
          chansonnier_perso_id: selectedAlzinId,
          date_fourniture: today,
        }),
      });

      if (!resFournir.ok) {
        throw new Error("Impossible d'enregistrer le fournisseur.");
      }

      setActiveTab("en_cours");
      handleCancelOrderForm();
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue lors de la création.");
    } finally {
      setCreating(false);
    }
  };

  const handleEditCommande = (commandeId: number) => {
    setEditingCommandeId(commandeId);
    setShowOrderForm(true);
    setError(null);
    // Pour l'instant, on laisse le formulaire vide : l'utilisateur resélectionne alzin/fournisseur/quantité
    // (si tu veux, on pourra plus tard préremplir en allant chercher les détails de commande)
  };

  const renderCommandesList = (items: Commande[], emptyText: string) => {
    if (items.length === 0) {
      return (
        <p className="text-sm text-gray-600 sm:text-base">{emptyText}</p>
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
              {c.status && (
                <p className="text-xs text-gray-500 sm:text-sm">
                  Statut : <span className="font-medium">{c.status}</span>
                </p>
              )}
            </div>
            <div className="mt-2 flex gap-2 sm:mt-0">
              <button
                type="button"
                onClick={() => handleEditCommande(c.id)}
                className="rounded-lg border border-mauve px-3 py-1 text-xs font-semibold text-mauve hover:bg-mauve/10 sm:text-sm"
              >
                Modifier
              </button>
              <DeleteButton
                endpoint={`/api/mes-commandes/${c.id}/`}
                confirmMessage="Es-tu sûr(e) de vouloir supprimer cette commande ?"
                requestInit={
                  userEmail
                    ? {
                        headers: {
                          "X-User-Email": userEmail,
                        },
                      }
                    : undefined
                }
                disabled={!userEmail}
                onSuccess={() =>
                  setCommandes((prev) => prev.filter((cmd) => cmd.id !== c.id))
                }
                onError={(message) => setError(message)}
                className="rounded-lg border border-red-500 px-3 py-1 text-xs font-semibold text-red-600 bg-transparent hover:bg-red-50 sm:text-sm"
              />
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
              Couleur : <span className="font-medium">{a.couleur}</span> · Type de papier :{" "}
              <span className="font-medium">{a.type_papier}</span>
            </p>
          </div>

          <div className="mt-3 flex gap-2 sm:mt-0">
            {/* Bouton Modifier (même style que commandes) */}
            <a
              href={`/alzin-perso?id=${a.id}`}
              className="rounded-lg border border-mauve px-3 py-1 text-xs font-semibold text-mauve hover:bg-mauve/10 sm:text-sm"
            >
              Modifier
            </a>

            {/* Bouton Supprimer (même style que commandes) */}
            <DeleteButton
              endpoint={`/api/mes-chansonniers/${a.id}/`}
              confirmMessage="Es-tu sûr(e) de vouloir supprimer cet alzin personnalisé ?"
              requestInit={
                userEmail
                  ? {
                      headers: {
                        "X-User-Email": userEmail,
                      },
                    }
                  : undefined
              }
              disabled={!userEmail}
              onSuccess={() =>
                setAlzins((prev) => prev.filter((al) => al.id !== a.id))
              }
              onError={(message) =>
                setError(
                  message ||
                    "Erreur lors de la suppression de l'alzin personnalisé."
                )
              }
              className="rounded-lg border border-red-500 px-3 py-1 text-xs font-semibold text-red-600 bg-transparent hover:bg-red-50 sm:text-sm"
            />
          </div>
        </li>
      ))}
    </ul>
  );
};


  // ➜ Cas "pas connecté"
  if (noUser) {
    return (
      <div className="flex w-full max-w-3xl flex-col items-center justify-center rounded-xl bg-white px-6 py-10 text-center shadow-lg sm:px-10 sm:py-14">
        <img
          src={logoSrc}
          alt="Logo Alzin"
          className="mb-6 h-20 w-auto opacity-90"
        />
        <h1 className="mb-3 text-2xl font-bold text-mauve sm:text-3xl">
          Deviens membre pour commander ton Alzin
        </h1>
        <p className="mb-6 max-w-xl text-sm text-gray-600 sm:text-base">
          Les commandes d&apos;Alzin sont réservées aux membres connectés. Crée ton
          compte ou connecte-toi pour accéder à la boutique et suivre tes
          commandes.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-mauve px-5 py-2.5 text-sm font-semibold text-white shadow-sm duration-150 hover:bg-purple-800 sm:text-base"
          >
            Devenir membre
          </a>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-mauve px-5 py-2.5 text-sm font-semibold text-mauve duration-150 hover:bg-mauve hover:text-white sm:text-base"
          >
            Se connecter
          </a>
        </div>
      </div>
    );
  }

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
            Consulte tes commandes, ton historique et tes alzins personnalisés.  <br /> Nous te mettrons en contact avec le fournisseur au plus vite !
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
              <span className="text-xs opacity-80">{alzins.length}</span>
            </button>
          </nav>

          {/* Bouton + toujours visible : nouvelle commande */}
          <button
            type="button"
            onClick={handleOpenOrderForm}
            disabled={creating}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-mauve px-3 py-2 text-sm font-semibold text-mauve duration-150 hover:bg-mauve hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
          >
            <span className="text-lg leading-none">+</span>
            <span>
              {editingCommandeId
                ? "Modifier la commande"
                : creating
                ? "En cours..."
                : "Nouvelle commande"}
            </span>
          </button>

          {/* Bouton + nouvel alzin perso */}
          <a
            href="/alzin-perso"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-mauve px-3 py-2 text-sm font-semibold text-mauve duration-150 hover:bg-mauve/10 sm:text-base"
          >
            <span className="text-lg leading-none">+</span>
            <span>Nouvel alzin perso</span>
          </a>
        </aside>

        {/* Contenu principal */}
        <section className="flex-1 rounded-xl bg-white">
          {/* Formulaire commande */}
          {showOrderForm && (
            <form
              onSubmit={handleCreateOrUpdateOrder}
              className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 sm:px-5 sm:py-5"
            >
              <h2 className="text-base font-semibold text-mauve sm:text-lg">
                {editingCommandeId
                  ? `Modifier la commande #${editingCommandeId}`
                  : "Nouvelle commande"}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="alzin"
                    className="text-xs font-medium text-gray-700 sm:text-sm"
                  >
                    Alzin personnalisé
                  </label>
                  <select
                    id="alzin"
                    value={selectedAlzinId}
                    onChange={(e) =>
                      setSelectedAlzinId(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-mauve sm:text-base"
                    required
                  >
                    <option value="">Sélectionne un alzin</option>
                    {alzins.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nom_chansonnier_perso}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="quantite"
                    className="text-xs font-medium text-gray-700 sm:text-sm"
                  >
                    Quantité
                  </label>
                  <input
                    id="quantite"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Number(e.target.value) || 1)
                    }
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-mauve sm:text-base"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="fournisseur"
                  className="text-xs font-medium text-gray-700 sm:text-sm"
                >
                  Fournisseur
                </label>
                <select
                  id="fournisseur"
                  value={selectedFournisseurId}
                  onChange={(e) =>
                    setSelectedFournisseurId(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-mauve sm:text-base"
                  required
                >
                  <option value="">Sélectionne un fournisseur</option>
                  {localFournisseurs.length > 0 && (
                    <optgroup label="Fournisseurs recommandés (ta ville)">
                      {localFournisseurs.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nom_fournisseur} ({f.ville_fournisseur})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {otherFournisseurs.length > 0 && (
                    <optgroup label="Autres fournisseurs">
                      {otherFournisseurs.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nom_fournisseur} ({f.ville_fournisseur})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {localFournisseurs.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Aucun fournisseur local détecté, tu peux en choisir un dans
                    la liste globale.
                  </p>
                )}
              </div>

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelOrderForm}
                  className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:text-base"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-mauve px-4 py-1.5 text-sm font-semibold text-white shadow-sm duration-150 hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                >
                  {creating
                    ? editingCommandeId
                      ? "Mise à jour..."
                      : "Création..."
                    : editingCommandeId
                    ? "Mettre à jour la commande"
                    : "Valider la commande"}
                </button>
              </div>
            </form>
          )}

          {/* Contenu selon l'onglet */}
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
