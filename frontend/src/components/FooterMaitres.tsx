import { useEffect, useState } from "react";
import { apiUrl } from "../lib/api";

type Props = {
  initial: string[];
};

export default function FooterMaitres({ initial }: Props) {
  const [maitres, setMaitres] = useState<string[]>(initial);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(apiUrl("/api/maitres/"));
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!cancelled && Array.isArray(data?.maitres)) {
          setMaitres(data.maitres);
        }
      } catch {
        // On laisse la liste initiale si l'API est indisponible
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [initial]);

  if (!maitres.length) {
    return (
      <ul id="footer-maitres" className="flex flex-col gap-2">
        <li>Aucun maître de chant disponible</li>
      </ul>
    );
  }

  return (
    <ul id="footer-maitres" className="flex flex-col gap-2">
      {maitres.map((name) => (
        <li key={name}>{name}</li>
      ))}
    </ul>
  );
}
