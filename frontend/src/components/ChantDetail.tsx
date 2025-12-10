import React, { useCallback, useEffect, useState } from "react";
import FavoriButton from "@components/FavoriButton";
import RatingStars from "@components/RatingStars";
import Comments from "@components/Comment";

type Chant = {
  id: number;
  nom_chant: string;
  auteur: string | null;
  ville_origine: string | null;
  paroles: string | null;
  description: string | null;
  utilisateur_id?: number | null;
  utilisateur_pseudo?: string | null;
  illustration_chant_url?: string;
  paroles_pdf_url?: string;
  partition_url?: string;
  categories: string[];

  pistes_audio: {
    id: number;
    fichier_mp3: string;
    note_moyenne: number;
    nb_notes: number;
    utilisateur_id?: number | null;
    utilisateur_pseudo?: string | null;
  }[];
};

const API_CHANTS = "/api/chants/";

const resolveMediaUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window !== "undefined") {
    return new URL(url, window.location.origin).toString();
  }
  return url;
};

export default function ChantPage({ id }: { id: number }) {
  const [chant, setChant] = useState<Chant | null>(null);
  const [USER_ID, setUSER_ID] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = localStorage.getItem("utilisateur_id");
    if (uid) setUSER_ID(Number(uid));
  }, []);

  useEffect(() => {
    const storedAdminFlag = localStorage.getItem("is_admin");
    if (storedAdminFlag !== null) {
      setIsAdmin(storedAdminFlag === "true");
      return;
    }

    const email = localStorage.getItem("email");
    if (!email) return;

    fetch("/api/me/", {
      headers: { "X-User-Email": email },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || data.error) return;
        const admin = typeof data.role === "string" && data.role.toLowerCase() === "admin";
        localStorage.setItem("role", data.role || "");
        localStorage.setItem("is_admin", String(admin));
        setIsAdmin(admin);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_CHANTS}${id}/`);
      setChant(await res.json());
      setLoading(false);
    };
    load();
  }, [id]);

  const handlePisteStats = useCallback((pisteId: number, stats: { average: number; total: number }) => {
    setChant((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pistes_audio: prev.pistes_audio.map((p) =>
          p.id === pisteId ? { ...p, note_moyenne: stats.average, nb_notes: stats.total } : p
        ),
      };
    });
  }, []);

  if (loading || !chant) return <p className="text-center mt-10">Chargement…</p>;

  const displayCategories =
    chant.categories && chant.categories.length > 0 ? chant.categories : ["Autre"];

  return (
    <div className="px-10 py-10 flex flex-col gap-8 max-w-4xl mx-auto font-sans">

      {/* Titre + favori */}
      <div className="flex justify-between items-start">
        <h1 className="text-4xl font-bold text-mauve">{chant.nom_chant}</h1>

        {USER_ID && (
          <FavoriButton chantId={chant.id} USER_ID={USER_ID} size={40} />
        )}
      </div>

      {/* Catégories */}
      <div>
        <p className="text-sm font-semibold text-mauve mb-1">Catégories</p>
        <div className="flex flex-wrap gap-2">
          {displayCategories.map((cat) => (
            <span key={cat} className="px-3 py-1 bg-mauve/10 text-mauve rounded-full text-sm">
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Paroles */}
      <div>
        <h2 className="text-2xl font-semibold text-mauve mb-3">Paroles</h2>
        <pre className="whitespace-pre-wrap bg-purple-50 p-4 rounded-xl border border-mauve/20 font-sans tracking-wide leading-relaxed">
          {chant.paroles || "Aucune parole disponible."}
        </pre>
      </div>

      {/* Audio */}
      <div>
        <h2 className="text-2xl font-semibold text-mauve mb-3">Audio</h2>

        {chant.pistes_audio.length > 0 ? (
          chant.pistes_audio.map((p) => {
            const audioSrc = resolveMediaUrl(p.fichier_mp3);
            if (!audioSrc) return null;
            return (
              <div key={p.id} className="mb-6">
                <audio controls className="w-full mb-2">
                  <source src={audioSrc} type="audio/mpeg" />
                </audio>

                <div className="flex items-center gap-3 text-gray-700 text-sm mb-1">
                  <span className="font-semibold text-mauve">Note :</span>

                  <span className="text-lg font-bold">
                    {p.note_moyenne?.toFixed(1) || "0.0"}★
                  </span>

                  <span className="text-gray-500">
                    ({p.nb_notes} vote{p.nb_notes > 1 ? "s" : ""})
                  </span>
                </div>

                {/* Notation utilisateur */}
                {USER_ID && (
                  <div>
                    <p className="text-sm text-mauve font-semibold mb-1">
                      Noter cette piste :
                    </p>
                    <RatingStars
                      pisteId={p.id}
                      userId={USER_ID}
                      onStatsChange={(stats) => handlePisteStats(p.id, stats)}
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 italic">Aucun audio disponible.</p>
        )}
      </div>

      {/* Ville */}
      <div>
        <p className="text-sm font-semibold text-mauve mb-1">Auteur</p>
        <p className="text-gray-700">{chant.auteur || "Aucune ville d'origine identifiée"}</p>
      </div>

      {/* Ville */}
      <div>
        <p className="text-sm font-semibold text-mauve mb-1">Ville d'origine</p>
        <p className="text-gray-700">{chant.ville_origine || "Aucune ville d'origine identifiée"}</p>
      </div>


      {/* Description */}
      <div>
        <p className="text-sm font-semibold text-mauve mb-1">Description</p>
        <p className="text-gray-700">{chant.description || "Aucune description"}</p>
      </div>

      {/* Illustration */}
      <div>
        <p className="text-sm font-semibold text-mauve mb-1">Illustration</p>
        {resolveMediaUrl(chant.illustration_chant_url) ? (
          <img
            src={resolveMediaUrl(chant.illustration_chant_url)}
            className="w-full max-h-96 object-cover rounded-xl shadow"
          />
        ) : (
          <p className="text-gray-500 italic">Aucune illustration</p>
        )}
      </div>

      {/* PDF */}
      <div>
        <p className="text-sm font-semibold text-mauve mb-1">PDF des paroles</p>
        {resolveMediaUrl(chant.paroles_pdf_url) ? (
          <a
            href={resolveMediaUrl(chant.paroles_pdf_url)}
            target="_blank"
            rel="noopener"
            className="inline-block bg-mauve text-white px-4 py-2 rounded-lg"
          >
            Télécharger
          </a>
        ) : (
          <p className="text-gray-500 italic">Aucun fichier PDF</p>
        )}
      </div>

      {/* Partition */}
      <div>
        <p className="text-sm font-semibold text-mauve mb-1">Partition</p>
        {resolveMediaUrl(chant.partition_url) ? (
          <a
            href={resolveMediaUrl(chant.partition_url)}
            target="_blank"
            rel="noopener"
            className="inline-block bg-mauve text-white px-4 py-2 rounded-lg"
          >
            Télécharger
          </a>
        ) : (
          <p className="text-gray-500 italic">Aucune partition</p>
        )}
      </div>
      
      {/* Ajouté par */}
      <div>
        <p className="text-sm font-semibold text-mauve mb-1">Chant ajouté par</p>
           <p className="text-gray-700">{chant.utilisateur_pseudo || "Un membre"}
        </p>
      </div>
      
      {/* ZONE COMMENTAIRES */}
      <Comments 
        chantId={chant.id}
        userId={USER_ID}
        isAdmin={isAdmin}
      />

      {/* RETOUR */}
      <button
        onClick={() => history.back()}
        className="mt-6 px-4 py-2 border border-mauve text-mauve rounded-lg hover:bg-mauve hover:text-white transition"
      >
        ← Retour
      </button>

    </div>
  );
}
