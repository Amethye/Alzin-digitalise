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
};

export default function ChantDetail({ id }: { id?: string }) {
  const [chant, setChant] = useState<Chant | null>(null);
  const [loading, setLoading] = useState(true);

  if (!id) {
    return (
      <p className="text-center mt-10 text-red-500">
        Erreur : identifiant du chant manquant.
      </p>
    );
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/chants/${id}/`);
        const data = await res.json();
        setChant(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return <p className="text-center mt-10 text-gray-600">Chargement…</p>;
  }

  if (!chant) {
    return <p className="text-center mt-10 text-red-500">Chant introuvable.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6 bg-white shadow rounded-xl border border-mauve/30 mt-6">

      <h1 className="text-3xl font-bold text-mauve mb-4">
        {chant.nom_chant}
      </h1>

      {chant.auteur && (
        <p className="text-md text-gray-700 mb-1">
          <strong>Auteur :</strong> {chant.auteur}
        </p>
      )}

      {chant.ville_origine && (
        <p className="text-md text-gray-700 mb-4">
          <strong>Ville d’origine :</strong> {chant.ville_origine}
        </p>
      )}

      {chant.illustration_chant_url && (
        <img
          src={chant.illustration_chant_url}
          alt="Illustration"
          className="rounded-lg w-full h-auto my-4 shadow"
        />
      )}

      {chant.description && (
        <p className="mt-4 text-gray-800 leading-relaxed whitespace-pre-line">
          {chant.description}
        </p>
      )}

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2 text-mauve">Paroles</h2>
        <pre className="whitespace-pre-line bg-gray-100 rounded-lg p-4 border border-gray-300 text-sm leading-relaxed">
{chant.paroles}
        </pre>
      </section>

      {chant.paroles_pdf_url && (
        <a
          className="inline-block mt-4 text-mauve font-semibold underline hover:text-purple-600"
          href={chant.paroles_pdf_url}
          target="_blank"
        >
          Télécharger le PDF des paroles
        </a>
      )}

      {chant.partition_url && (
        <a
          className="block mt-2 text-mauve font-semibold underline hover:text-purple-600"
          href={chant.partition_url}
          target="_blank"
        >
          Télécharger la partition
        </a>
      )}

      <a href="/chants" className="block mt-6 text-gray-700 underline hover:text-mauve">
        ← Retour à la liste des chants
      </a>
    </div>
  );
}