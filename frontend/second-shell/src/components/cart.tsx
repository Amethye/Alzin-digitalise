import React, { useEffect, useState } from "react";

type Pin = {
  id: number;
  title: string;
  price: string;
  description: string;
  imageUrl: string;
  quantity?: number;
};

const Cart: React.FC = () => {
  const [cart, setCart] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"" | "success" | "error">("");
  const [quantityInputs, setQuantityInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      const parsed = JSON.parse(storedCart);
      setCart(parsed);
      const initialInputs: Record<number, string> = {};
      parsed.forEach((item: Pin) => {
        const currentQty = item.quantity ? String(item.quantity) : "1";
        initialInputs[item.id] = currentQty;
      });
      setQuantityInputs(initialInputs);
    }
  }, []);

  const persistCart = (updatedCart: Pin[]) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    if (updatedCart.length > 0) {
      setMessage("");
      setMessageType("");
    }
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (!Number.isFinite(newQuantity) || newQuantity < 1) return;
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity: newQuantity } : item,
    );
    persistCart(updatedCart);
    setQuantityInputs((prev) => ({
      ...prev,
      [id]: String(newQuantity),
    }));
  };

  const handleQuantityInput = (id: number, value: string) => {
    setQuantityInputs((prev) => ({
      ...prev,
      [id]: value,
    }));

    const parsedValue = Number(value);
    if (Number.isInteger(parsedValue) && parsedValue >= 1) {
      updateQuantity(id, parsedValue);
    }
  };

  const adjustQuantity = (id: number, delta: number) => {
    const current = cart.find((item) => item.id === id);
    const currentQty = current?.quantity ?? 1;
    const nextQty = Math.max(1, currentQty + delta);
    updateQuantity(id, nextQty);
  };

  const removeFromCart = (id: number) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    persistCart(updatedCart);
  };

  const total = cart.reduce(
    (sum, item) => sum + parseFloat(item.price) * (item.quantity || 1),
    0,
  );

  const checkout = async () => {
    if (!cart.length) return;
    setLoading(true);
    setMessage("");
    setMessageType("");

    const items = cart.map((item) => ({
      id: item.id,
      title: item.title,
      price: parseFloat(item.price),
      quantity: item.quantity || 1,
    }));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const j = await res.json();
        setMessage(j.error || `Erreur ${res.status}`);
        setMessageType("error");
      } else {
        setMessage("Commande envoyée avec succès !");
        setMessageType("success");
        setCart([]);
        localStorage.removeItem("cart");
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    } catch (err) {
      setMessage("Erreur réseau lors de la commande.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0)
    return (
      <div className="flex w-full max-w-3xl flex-col items-center gap-4 rounded-lg bg-white px-4 py-6 text-center shadow sm:px-6">
        {messageType === "success" ? (
          <>
            <p className="text-base font-semibold text-green-600 sm:text-lg">
              {message || "Commande envoyée avec succès !"}
            </p>
            <p className="text-sm text-gray-600 sm:text-base">
              Nous vous confirmerons la réservation par email. En attendant, vous pouvez continuer vos achats.
            </p>
          </>
        ) : (
          <>
            <p className="text-base font-semibold text-bleu sm:text-lg">
              Votre panier est vide.
            </p>
            <p className="text-sm text-gray-600 sm:text-base">
              Explorez nos pin's folkloriques et ajoutez vos coups de cœur.
            </p>
          </>
        )}
        <a
          href="/pins"
          className="inline-flex items-center justify-center rounded-full border border-bleu px-4 py-2 text-sm font-semibold text-bleu transition hover:bg-blue-50 sm:text-base"
        >
          {messageType === "success" ? "Découvrir d'autres articles" : "Voir les articles"}
        </a>
      </div>
    );

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5 rounded-lg bg-white px-4 py-5 shadow sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-bleu sm:text-2xl">Votre Panier</h2>
          <p className="text-sm text-gray-600 sm:text-base">
            Ajustez les quantités puis validez pour envoyer votre commande à la CAP.
          </p>
        </div>
        <a
          href="/pins"
          className="inline-flex items-center justify-center rounded-full border border-bleu px-4 py-2 text-sm font-semibold text-bleu transition hover:bg-blue-50 sm:text-base"
        >
          Continuer mes achats
        </a>
      </div>

      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
        {cart.map((item) => {
          const quantity = item.quantity ?? 1;
          const lineTotal = parseFloat(item.price) * quantity;

          return (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border bg-slate-50 p-4 shadow-sm sm:p-5"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-40 w-full rounded-lg object-cover sm:h-48"
              />

              <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-700 sm:text-base">
                {item.description.split("\n").map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </p>
              <p className="font-semibold text-bleu">{item.price} €</p>
              <p className="text-sm text-gray-600">
                Total article : <strong>{lineTotal.toFixed(2)} €</strong>
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Quantité :</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustQuantity(item.id, -1)}
                    className="h-8 w-8 rounded-full border border-gray-300 text-lg font-semibold text-gray-600 transition hover:bg-gray-100"
                    aria-label={`Diminuer la quantité de ${item.title}`}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantityInputs[item.id] ?? String(quantity)}
                    onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                    className="w-16 rounded border px-2 py-1 text-center"
                    aria-label={`Quantité pour ${item.title}`}
                  />
                  <button
                    type="button"
                    onClick={() => adjustQuantity(item.id, 1)}
                    className="h-8 w-8 rounded-full border border-gray-300 text-lg font-semibold text-gray-600 transition hover:bg-gray-100"
                    aria-label={`Augmenter la quantité de ${item.title}`}
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="w-fit rounded bg-red-500 px-3 py-1 text-sm text-white transition hover:bg-red-600"
              >
                Retirer du panier
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-bleu/30 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-base font-semibold text-gray-900 sm:text-lg">
            Total panier : <span className="text-bleu">{total.toFixed(2)} €</span>
          </p>
          <p className="text-xs text-gray-600 sm:text-sm">
            La commande sera envoyée à votre nom.
          </p>
        </div>
        <button
          onClick={checkout}
          disabled={loading}
          className="rounded bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50 sm:text-base"
        >
          {loading ? "Envoi..." : "Passer la commande"}
        </button>
      </div>

      {message && cart.length > 0 && (
        <p
          className={`mt-2 text-center text-sm sm:text-base ${
            messageType === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default Cart;
