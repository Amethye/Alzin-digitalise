import React, { useCallback, useEffect, useState } from "react";

interface OrderItem {
  pin_id: number;
  title: string;
  price: number;
  quantity: number;
  currentStock: number;
}

interface Order {
  id: string;
  user_id: string;
  user_nom: string;
  user_prenom: string;
  status: string;
  created_at: string;
  items: OrderItem[];
  total_price?: number;
  archived?: boolean;
}

interface OrdersProps {
  showArchived?: boolean;
}

const STATUS_OPTIONS = ["en attente", "validée", "expédiée", "annulée"] as const;

const Orders: React.FC<OrdersProps> = ({ showArchived = false }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("tous");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const endpoint = showArchived
        ? "/api/admin/orders/archived"
        : "/api/admin/orders";
      const res = await fetch(endpoint, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur fetch orders");

      const dataOrders: Order[] = await res.json();
      setOrders(
        dataOrders.map((order) => {
          const itemsWithStock = order.items.map((item) => ({
            ...item,
            currentStock: item.currentStock ?? 0,
          }));
          const computedTotal = itemsWithStock.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          );
          return {
            ...order,
            items: itemsWithStock,
            total_price: order.total_price ?? Number(computedTotal.toFixed(2)),
            archived: order.archived ?? false,
          };
        }),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    fetchOrders();
    setStatusFilter("tous");
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (showArchived) return;
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === newStatus) return;

    try {
      setUpdatingStatusId(orderId);

      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const payload = await res.json();
      if (!res.ok) {
        alert(payload.error || "Impossible de mettre à jour le statut");
        return;
      }

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const updatedItems = payload.items.map((item: OrderItem) => ({
            ...item,
            currentStock: item.currentStock ?? 0,
          }));
          const recomputedTotal = updatedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          );
          return {
            ...o,
            status: payload.status,
            items: updatedItems,
            total_price:
              payload.total_price ?? Number(recomputedTotal.toFixed(2)),
            archived: payload.archived ?? o.archived,
          };
        }),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const toggleArchiveOrder = async (orderId: string, shouldArchive: boolean) => {
    const confirmationMessage = shouldArchive
      ? "Voulez-vous archiver cette commande ?"
      : "Voulez-vous restaurer cette commande ?";
    if (!confirm(confirmationMessage)) return;

    try {
      setUpdatingStatusId(orderId);

      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ archived: shouldArchive }),
      });
      const payload = await res.json();
      if (!res.ok) {
        alert(payload.error || "Impossible de mettre à jour l'archive");
        return;
      }

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette commande ?")) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        alert(payload.error || "Impossible de supprimer la commande");
        return;
      }
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <p className="text-center text-sm text-gray-600 sm:text-base">
        Chargement des commandes…
      </p>
    );

  const pageTitle = showArchived
    ? "Commandes archivées"
    : "Toutes les commandes";
  const emptyMessage = showArchived
    ? "Aucune commande archivée pour le moment."
    : "Aucune commande pour le moment.";

  const filteredOrders = showArchived
    ? orders
    : orders.filter((order) =>
        statusFilter === "tous" ? true : order.status === statusFilter,
      );

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => {
    const totalAmount =
      order.total_price ??
      order.items.reduce((subtotal, item) => subtotal + item.price * item.quantity, 0);
    return sum + totalAmount;
  }, 0);

  const formatDate = (isoString: string) =>
    new Date(isoString).toLocaleString("fr-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const renderStatusBadge = (status: string) => {
    let classes =
      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide sm:text-sm ";
    switch (status) {
      case "validée":
      case "expédiée":
        classes += "border-green-200 bg-green-100 text-green-700";
        break;
      case "annulée":
        classes += "border-red-200 bg-red-100 text-red-700";
        break;
      default:
        classes += "border-yellow-200 bg-yellow-100 text-yellow-700";
        break;
    }
    return <span className={classes}>{status}</span>;
  };

  const activeFilters = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-600 sm:text-base">
        Filtrer par statut :
      </span>
      <div className="flex flex-wrap gap-2">
        {["tous", ...STATUS_OPTIONS].map((status) => {
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                isActive
                  ? "bg-bleu text-white shadow"
                  : "border border-bleu/40 text-bleu hover:bg-blue-50"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6">
      <header className="flex flex-col gap-3 rounded-lg bg-white px-4 py-5 shadow sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="text-2xl font-bold text-bleu sm:text-3xl">{pageTitle}</h1>
          <p className="text-sm text-gray-600 sm:text-base">
            Gérez les commandes {showArchived ? "archivées" : "actives"} et suivez leur statut.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={showArchived ? "/admin/commandes" : "/admin/commandes-archive"}
            className="rounded-full border border-bleu px-3 py-2 text-sm font-semibold text-bleu transition hover:bg-blue-50 sm:text-base"
          >
            {showArchived
              ? "Voir les commandes actives"
              : "Voir les commandes archivées"}
          </a>
          <button
            onClick={fetchOrders}
            className="rounded-full bg-bleu px-3 py-2 text-sm font-semibold text-white transition hover:bg-bleu/90 sm:text-base"
          >
            Actualiser
          </button>
        </div>
      </header>

      {!showArchived && (
        <section className="rounded-lg border border-bleu/20 bg-white px-4 py-3 shadow-sm sm:px-5">
          {activeFilters}
        </section>
      )}

      <section className="rounded-lg border border-bleu/20 bg-white px-4 py-4 shadow-sm sm:px-6">
        <h2 className="text-lg font-semibold text-bleu sm:text-xl">Commandes</h2>
        <p className="text-sm text-gray-600 sm:text-base">
          {filteredOrders.length} commande{filteredOrders.length > 1 ? "s" : ""} affichée{filteredOrders.length > 1 ? "s" : ""}.
        </p>
      {filteredOrders.length === 0 ? (
        <p className="text-center text-sm text-gray-600 sm:text-base">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-4">
          {filteredOrders.map((order) => {
            const totalAmount =
              order.total_price ??
              order.items.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0,
              );

            return (
              <li
                key={order.id}
                className="space-y-3 rounded-lg border border-bleu/30 bg-white px-4 py-4 text-sm text-gray-700 shadow sm:px-5 sm:text-base"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 sm:text-base">
                      Commande #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500 sm:text-sm">
                      Créée le {formatDate(order.created_at)}
                    </p>
                    <p className="text-sm text-gray-600 sm:text-base">
                      Client : {order.user_nom} {order.user_prenom}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {renderStatusBadge(order.status)}
                    {!showArchived && (
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="rounded border border-bleu/40 px-2 py-1 text-sm font-semibold text-bleu focus:border-bleu focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-base"
                        disabled={updatingStatusId === order.id}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <p>
                  <strong className="text-bleu">Montant total :</strong>{" "}
                  {totalAmount.toFixed(2)} €
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Article
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Quantité
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Prix unitaire
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Sous-total
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Stock actuel
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-600">
                      {order.items.map((item, idx) => {
                        const subTotal = item.price * item.quantity;
                        return (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-semibold text-gray-900">
                              {item.title}
                            </td>
                            <td className="px-3 py-2">{item.quantity}</td>
                            <td className="px-3 py-2">{item.price} €</td>
                            <td className="px-3 py-2">{subTotal.toFixed(2)} €</td>
                            <td className="px-3 py-2">{item.currentStock}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleArchiveOrder(order.id, !showArchived)}
                    className="rounded bg-bleu px-3 py-1 text-sm text-white transition hover:bg-blue-600 disabled:opacity-50"
                    disabled={updatingStatusId === order.id}
                  >
                    {showArchived
                      ? "Restaurer la commande"
                      : "Archiver la commande"}
                  </button>
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="rounded bg-red-500 px-3 py-1 text-sm text-white transition hover:bg-red-600"
                  >
                    Supprimer la commande
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      </section>
    </main>
  );
};

export default Orders;
