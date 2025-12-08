import React, { useEffect, useState } from "react";

type Chant = {
  id: number;
  nom_chant: string;
  auteur: string;
  ville_origine: string;
  paroles: string;
  description: string;
  illustration_chant_url?: string;
  paroles_pdf_url?: string;
  partition_url?: string;
  categories: string[];
  pistes_audio: { id: number; fichier_mp3: string }[];
};

type Favori = {
  id: number;
  utilisateur_id: number;
  chant_id: number;
};

const API_CHANT = "http://127.0.0.1:8000/api/chants/";
const API_FAVORIS = "http://127.0.0.1:8000/api/favoris/";


export default function ChantDetail({ id }: { id: string }) {
  const chantId = Number(id);

  const USER_ID = Number(localStorage.getItem("utilisateur_id"));

  const [chant, setChant] = useState<Chant | null>(null);
  const [favoriId, setFavoriId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger le chant + favoris
  const loadData = async () => {
    setLoading(true);

    // Charger le chant
    const res = await fetch(`${API_CHANT}${chantId}/`);
    const data = await res.json();
    setChant(data);

    // Charger les favoris
    if (USER_ID) {
      const favRes = await fetch(`${API_FAVORIS}?utilisateur_id=${USER_ID}`);
      const favData: Favori[] = await favRes.json();

      const f = favData.find(f => f.chant_id === chantId);
      setFavoriId(f ? f.id : null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Ajouter favori
  const addFavori = async () => {
    if (!USER_ID) return alert("Vous devez être connecté.");

    const res = await fetch(API_FAVORIS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        utilisateur_id: USER_ID,
        chant_id: chantId,
        date_favori: new Date().toISOString().split("T")[0],
      }),
    });

    const data = await res.json();
    setFavoriId(data.id);
  };

  // Supprimer favori
  const removeFavori = async () => {
    if (!favoriId) return;

    await fetch(`${API_FAVORIS}?id=${favoriId}`, {
      method: "DELETE",
    });

    setFavoriId(null);
  };

  if (loading || !chant)
    return <p className="text-center mt-10 text-gray-500">Chargement...</p>;

  const isFav = favoriId !== null;

  return (
    <div className="px-10 py-10 max-w-4xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <h1 className="text-4xl font-bold text-mauve">{chant.nom_chant}</h1>

        {USER_ID && (
          <button
            onClick={isFav ? removeFavori : addFavori}
            className="text-4xl transition"
          >
            {isFav ? (
              <span className="text-mauve">❤️</span>
            ) : (
              <span className="text-mauve/30">🤍</span>
            )}
          </button>
        )}
      </div>

      {/* Illustration */}
      {chant.illustration_chant_url && (
        <img
          src={chant.illustration_chant_url}
          className="w-full h-80 object-cover rounded-xl shadow mt-6"
        />
      )}

      {/* Infos */}
      <div className="mt-6 text-gray-700">
        {chant.auteur && (
          <p><strong>Auteur :</strong> {chant.auteur}</p>
        )}
        {chant.ville_origine && (
          <p><strong>Ville d'origine :</strong> {chant.ville_origine}</p>
        )}
      </div>

      {/* Description */}
      {chant.description && (
        <p className="mt-6 whitespace-pre-line">{chant.description}</p>
      )}

      {/* Paroles */}
      <h2 className="text-2xl font-bold text-mauve mt-10">Paroles</h2>
      <p className="whitespace-pre-line mt-3">{chant.paroles}</p>

      {/* PDF */}
      {chant.paroles_pdf_url && (
        <a
          href={chant.paroles_pdf_url}
          target="_blank"
          className="mt-4 inline-block text-mauve underline"
        >
          📄 Télécharger le PDF
        </a>
      )}

      {/* Partition */}
      {chant.partition_url && (
        <a
          href={chant.partition_url}
          target="_blank"
          className="mt-3 block text-mauve underline"
        >
          🎵 Télécharger la partition
        </a>
      )}

      {/* Catégories */}
      {chant.categories.length > 0 && (
        <>
          <h2 className="text-xl font-bold text-mauve mt-10">Catégories</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {chant.categories.map(cat => (
              <span
                key={cat}
                className="px-3 py-1 bg-mauve/10 text-mauve rounded-full text-sm"
              >
                {cat}
              </span>
            ))}
          </div>
        </>
      )}

      {/* AUDIO */}
      {chant.pistes_audio.length > 0 && (
        <>
          <h2 className="text-xl font-bold text-mauve mt-10">Pistes audio</h2>

          <div className="flex flex-col gap-4 mt-3">
            {chant.pistes_audio.map(pa => (
              <audio key={pa.id} controls className="w-full">
                <source src={pa.fichier_mp3} type="audio/mpeg" />
              </audio>
            ))}
          </div>
        </>
      )}
    </div>
  );
}