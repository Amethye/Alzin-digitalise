import React, { useEffect, useState } from "react";

interface PenneRequest {
  id: number;
  couleur: string;
  liseré: string;
  broderie: string;
  tourDeTete: string;
  status: "en attente" | "traitée";
}

interface OrderItem {
  title: string;
  price: number;
  quantity: number;
}

interface UserOrder {
  id: string;
  status: string;
  created_at: string;
  items: OrderItem[];
  total_price?: number;
}

interface CustomPinRequest {
  id: number;
  title: string;
  quantity: number;
  notes: string;
  logoUrl: string;
  status: "en attente" | "validée" | "refusée";
  created_at: string;
}

const MyOrders: React.FC = () => {
  const [pennes, setPennes] = useState<PenneRequest[]>([]);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [customPins, setCustomPins] = useState<CustomPinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const resOrders = await fetch("/api/orders", { credentials: "include" });
      const dataOrders: UserOrder[] = resOrders.ok ? await resOrders.json() : [];
      setOrders(dataOrders);

      const resPennes = await fetch("/api/penne-requests/", { credentials: "include" });
      const dataPennes: PenneRequest[] = resPennes.ok ? await resPennes.json() : [];
      setPennes(dataPennes);

      const resCustomPins = await fetch("/api/pins/requests/", { credentials: "include" });
      const dataCustomPins: CustomPinRequest[] = resCustomPins.ok ? await resCustomPins.json() : [];
      setCustomPins(dataCustomPins);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading)
    return <p className="text-center text-sm text-gray-600 sm:text-base">Chargement des commandes...</p>;
  if (error)
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-lg bg-white px-4 py-5 text-center shadow sm:px-6">
        <p className="text-sm text-red-600 sm:text-base">{error}</p>
        <button
          onClick={fetchOrders}
          className="mx-auto rounded-full bg-bleu px-4 py-2 text-sm font-semibold text-white transition hover:bg-bleu/90 sm:text-base"
        >
          Réessayer
        </button>
      </div>
    );

  const renderStatusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    let color = "bg-gray-100 text-gray-700 border-gray-200";
    if (["validée", "traitée", "expédiée"].includes(normalized)) {
      color = "bg-green-100 text-green-700 border-green-200";
    } else if (["en attente"].includes(normalized)) {
      color = "bg-yellow-100 text-yellow-700 border-yellow-200";
    } else if (["annulée", "refusée"].includes(normalized)) {
      color = "bg-red-100 text-red-700 border-red-200";
    }
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide sm:text-sm ${color}`}>
        {status}
      </span>
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6">
      <section className="flex flex-col gap-4 rounded-lg bg-white px-4 py-5 shadow sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-bleu sm:text-3xl">Mes commandes</h1>
            <p className="text-sm text-gray-600 sm:text-base">
              Retrouvez ici le suivi de vos pennes, commandes d&apos;articles et demandes personnalisées.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchOrders}
              className="rounded-full border border-bleu px-3 py-2 text-sm font-semibold text-bleu transition hover:bg-blue-50 sm:text-base"
            >
              Actualiser
            </button>
            <a
              href="/pins"
              className="rounded-full bg-bleu px-3 py-2 text-sm font-semibold text-white transition hover:bg-bleu/90 sm:text-base"
            >
              Continuer mes achats
            </a>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-lg bg-white px-4 py-5 shadow sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-bleu sm:text-xl">Mes demandes de penne</h2>
          {pennes.length > 0 && (
            <span className="text-sm text-gray-500 sm:text-base">
              {pennes.length} demande{pennes.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {pennes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-bleu/30 bg-blue-50/30 px-4 py-4 text-sm text-gray-600 sm:text-base">
            Aucune demande de penne enregistrée.{" "}
            <a href="/DemandePenne" className="text-bleu underline hover:no-underline">
              Faire une demande
            </a>
          </div>
        ) : (
          <ul className="space-y-4">
            {pennes.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-lg border border-bleu/30 bg-white px-4 py-4 text-sm text-gray-700 shadow-sm sm:px-5 sm:text-base"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 sm:text-base">
                    Demande #{p.id}
                  </p>
                  {renderStatusBadge(p.status)}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <p><strong className="text-bleu">Couleur :</strong> {p.couleur}</p>
                  <p><strong className="text-bleu">Liseré :</strong> {p.liseré}</p>
                  <p><strong className="text-bleu">Broderie :</strong> {p.broderie}</p>
                  <p><strong className="text-bleu">Tour de tête :</strong> {p.tourDeTete}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg bg-white px-4 py-5 shadow sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-bleu sm:text-xl">Mes commandes d&apos;articles</h2>
          {orders.length > 0 && (
            <span className="text-sm text-gray-500 sm:text-base">
              {orders.length} commande{orders.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-bleu/30 bg-blue-50/30 px-4 py-4 text-sm text-gray-600 sm:text-base">
            Aucune commande d&apos;articles.{" "}
            <a href="/pins" className="text-bleu underline hover:no-underline">
              Découvrir les pin&apos;s
            </a>
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => {
              const totalAmount =
                order.total_price ??
                order.items.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0,
                );

              return (
                <li
                  key={order.id}
                  className="flex flex-col gap-2 rounded-lg border border-bleu/30 bg-white px-4 py-4 text-sm text-gray-700 shadow-sm sm:px-5 sm:text-base"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 sm:text-base">
                        Commande #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500 sm:text-sm">
                        Passée le {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    {renderStatusBadge(order.status)}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 sm:text-base">
                    Montant total : <span className="text-bleu">{totalAmount.toFixed(2)} €</span>
                  </p>
                  <div>
                    <p className="mb-1 font-semibold text-bleu">Détail des articles :</p>
                    <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600 sm:text-base">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.title} — {item.quantity} × {item.price} €
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg bg-white px-4 py-5 shadow sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-bleu sm:text-xl">Mes commandes de pins personnalisés</h2>
          {customPins.length > 0 && (
            <span className="text-sm text-gray-500 sm:text-base">
              {customPins.length} commande{customPins.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {customPins.length === 0 ? (
          <div className="rounded-lg border border-dashed border-bleu/30 bg-blue-50/30 px-4 py-4 text-sm text-gray-600 sm:text-base">
            Aucune demande personnalisée.{" "}
            <a href="/demande-pins" className="text-bleu underline hover:no-underline">
              Créer une demande
            </a>
          </div>
        ) : (
          <ul className="space-y-4">
            {customPins.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-lg border border-bleu/30 bg-white px-4 py-4 text-sm text-gray-700 shadow-sm sm:px-5 sm:text-base"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 sm:text-base">
                    Demande #{p.id}
                  </p>
                  {renderStatusBadge(p.status)}
                </div>
                <p><strong className="text-bleu">Titre :</strong> {p.title}</p>
                <p><strong className="text-bleu">Quantité :</strong> {p.quantity}</p>
                <p><strong className="text-bleu">Notes :</strong> {p.notes || "—"}</p>
                <p>
                  <strong className="text-bleu">Date :</strong>{" "}
                  {new Date(p.created_at).toLocaleString()}
                </p>
                {p.logoUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={p.logoUrl}
                      alt={p.title}
                      className="h-28 w-28 rounded border object-contain sm:h-32 sm:w-32"
                    />
                    <a
                      href={p.logoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-bleu underline hover:no-underline sm:text-base"
                    >
                      Voir le visuel
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default MyOrders;
