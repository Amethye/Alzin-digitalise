import React, { useEffect, useState } from "react";
import FavoriButton from "@components/FavoriButton";

type Chant = {
  id: number;
  nom_chant: string;
  auteur: string | null;
  ville_origine: string | null;
  paroles: string | null;
  description: string | null;
  illustration_chant_url?: string;
  paroles_pdf_url?: string;
  partition_url?: string;
  categories: string[];
  pistes_audio: { id: number; fichier_mp3: string }[];
};

const API_CHANTS = "http://127.0.0.1:8000/api/chants/";

export default function ChantPage({ id }: { id: number }) {
  const [chant, setChant] = useState<Chant | null>(null);
  const [USER_ID, setUSER_ID] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = localStorage.getItem("utilisateur_id");
    if (uid) setUSER_ID(Number(uid));
  }, []);

  // Charger le chant
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_CHANTS}${id}/`);
      setChant(await res.json());
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading || !chant) return <p className="text-center mt-10">Chargement…</p>;

  return (
    <div className="px-10 py-10 flex flex-col gap-8 max-w-4xl mx-auto font-sans">

      {/* Titre + favori */}
      <div className="flex justify-between items-start">
        <h1 className="text-4xl font-bold text-mauve">{chant.nom_chant}</h1>

        {USER_ID && (
          <FavoriButton chantId={chant.id} USER_ID={USER_ID} size={40} />
        )}
      </div>

      {/* Auteur / ville */}
      <div className="text-gray-700 text-lg space-y-1">
        <p><strong>Auteur :</strong> {chant.auteur || "—"}</p>
        <p><strong>Ville d'origine :</strong> {chant.ville_origine || "—"}</p>
      </div>

      {/* Illustration */}
      <div>
        <p className="text-sm font-semibold text-mauve mb-1">Illustration</p>
        {chant.illustration_chant_url ? (
          <img src={chant.illustration_chant_url} className="w-full max-h-96 object-cover rounded-xl shadow" />
        ) : (
          <p className="text-gray-500 italic">Aucune illustration</p>
        )}
      </div>

      {/* Catégories */}
      <div>
        <p className="text-sm font-semibold text-mauve mb-1">Catégories</p>
        {chant.categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {chant.categories.map((cat) => (
              <span key={cat} className="px-3 py-1 bg-mauve/10 text-mauve rounded-full text-sm">
                {cat}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">Aucune catégorie</p>
        )}
      </div>

      {/* Description */}
      <div>
        <p className="text-sm font-semibold text-mauve mb-1">Description</p>
        <p className="text-gray-700">{chant.description || "—"}</p>
      </div>

      {/* Paroles */}
      <div>
        <h2 className="text-2xl font-semibold text-mauve mb-3">Paroles</h2>
        <pre className="whitespace-pre-wrap bg-purple-50 p-4 rounded-xl border border-mauve/20 font-sans tracking-wide leading-relaxed">
          {chant.paroles || "Aucune parole disponible."}
        </pre>
      </div>

      {/* PDF */}
      <div>
        <p className="text-sm font-semibold text-mauve mb-1">PDF des paroles</p>
        {chant.paroles_pdf_url ? (
          <a href={chant.paroles_pdf_url} target="_blank" className="inline-block bg-mauve text-white px-4 py-2 rounded-lg">
            Télécharger
          </a>
        ) : (
          <p className="text-gray-500 italic">Aucun fichier PDF</p>
        )}
      </div>

      {/* Partition */}
      <div>
        <p className="text-sm font-semibold text-mauve mb-1">Partition</p>
        {chant.partition_url ? (
          <a href={chant.partition_url} target="_blank" className="inline-block bg-mauve/80 text-white px-4 py-2 rounded-lg">
            Voir la partition
          </a>
        ) : (
          <p className="text-gray-500 italic">Aucune partition</p>
        )}
      </div>

      {/* Audio */}
      <div>
        <h2 className="text-2xl font-semibold text-mauve mb-3">Audio</h2>
        {chant.pistes_audio.length > 0 ? (
          chant.pistes_audio.map((p) => (
            <audio key={p.id} controls className="w-full mb-2">
              <source src={p.fichier_mp3} type="audio/mpeg" />
            </audio>
          ))
        ) : (
          <p className="text-gray-500 italic">Aucun audio disponible.</p>
        )}
      </div>

      <button
        onClick={() => history.back()}
        className="mt-6 px-4 py-2 border border-mauve text-mauve rounded-lg hover:bg-mauve hover:text-white transition"
      >
        ← Retour
      </button>
    </div>
  );
}