export function sortCategoriesWithAutreLast(categories: string[]): string[] {
  const AUTRE = "autre";

  return [...categories].sort((a, b) => {
    const aIsAutre = a.trim().toLowerCase() === AUTRE;
    const bIsAutre = b.trim().toLowerCase() === AUTRE;

    if (aIsAutre && !bIsAutre) return 1;
    if (!aIsAutre && bIsAutre) return -1;
    return a.localeCompare(b, "fr");
  });
}
