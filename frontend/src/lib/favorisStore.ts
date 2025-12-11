export type Favori = {
  id: number;
  utilisateur_id: number;
  chant_id: number;
  date_favori?: string;
};

type Subscriber = (favoris: Favori[]) => void;

const favorisByUser = new Map<number, Favori[]>();
const subscribersByUser = new Map<number, Set<Subscriber>>();
const initializedUsers = new Set<number>();

const notify = (userId: number) => {
  const favoris = favorisByUser.get(userId) ?? [];
  const subscribers = subscribersByUser.get(userId);
  if (!subscribers) return;
  subscribers.forEach((cb) => cb(favoris));
};

export const subscribeToFavoris = (
  userId: number,
  callback: Subscriber
): (() => void) => {
  if (!subscribersByUser.has(userId)) {
    subscribersByUser.set(userId, new Set());
  }
  const set = subscribersByUser.get(userId)!;
  set.add(callback);
  callback(favorisByUser.get(userId) ?? []);

  return () => {
    set.delete(callback);
    if (set.size === 0) {
      subscribersByUser.delete(userId);
    }
  };
};

export const setFavorisForUser = (userId: number, favoris: Favori[]) => {
  favorisByUser.set(userId, favoris);
  initializedUsers.add(userId);
  notify(userId);
};

export const addFavoriForUser = (userId: number, favori: Favori) => {
  const current = favorisByUser.get(userId) ?? [];
  if (current.some((f) => f.id === favori.id)) {
    return;
  }

  const existingIndex = current.findIndex((f) => f.chant_id === favori.chant_id);
  if (existingIndex !== -1) {
    const next = [...current];
    next[existingIndex] = favori;
    favorisByUser.set(userId, next);
    initializedUsers.add(userId);
    notify(userId);
    return;
  }

  favorisByUser.set(userId, [...current, favori]);
  initializedUsers.add(userId);
  notify(userId);
};

export const removeFavoriForUser = (userId: number, chantId: number) => {
  const current = favorisByUser.get(userId) ?? [];
  if (!current.some((f) => f.chant_id === chantId)) {
    return;
  }
  favorisByUser.set(
    userId,
    current.filter((f) => f.chant_id !== chantId)
  );
  notify(userId);
};

export const hasFavorisForUser = (userId: number) => initializedUsers.has(userId);
