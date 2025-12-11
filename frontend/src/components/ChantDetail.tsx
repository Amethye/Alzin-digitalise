import React, { useCallback, useEffect, useRef, useState } from "react";
import FavoriButton from "@components/FavoriButton";
import RatingStars from "@components/RatingStars";
import Comments from "@components/Comment";
import { apiUrl } from "../lib/api";
import { sortCategoriesWithAutreLast } from "../lib/categories";

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
const API_AUDIO_REQUESTS = "/api/demandes-audio/";
const API_MODIFICATION_REQUESTS = "/api/demandes-modification/";
const API_CATEGORIES = "/api/categories/";

const editFileFields = [
  {
    name: "illustration_chant",
    label: "Illustration",
    accept: "image/*",
    emoji: "📷",
  },
  {
    name: "paroles_pdf",
    label: "Paroles PDF",
    accept: "application/pdf",
    emoji: "📄",
  },
  {
    name: "partition",
    label: "Partition",
    accept: ".pdf,.png,.jpg",
    emoji: "🎵",
  },
] as const;

type EditFileFieldName = (typeof editFileFields)[number]["name"];

const resolveMediaUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window !== "undefined") {
    return new URL(url, window.location.origin).toString();
  }
  return url;
};

const resolveAudioMime = (url: string | null | undefined) => {
  if (!url) return "audio/mpeg";
  const lower = url.split("?")[0].toLowerCase();
  if (lower.endsWith(".m4a") || lower.endsWith(".mp4")) return "audio/mp4";
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".wav")) return "audio/wav";
  return "audio/mpeg";
};

export default function ChantPage({ id }: { id: number }) {
  const [chant, setChant] = useState<Chant | null>(null);
  const [USER_ID, setUSER_ID] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showAudioRequestForm, setShowAudioRequestForm] = useState(false);
  const [audioRequestFile, setAudioRequestFile] = useState<File | null>(null);
  const [audioRequestFeedback, setAudioRequestFeedback] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);
  const [audioSubmitting, setAudioSubmitting] = useState(false);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputId = `audio-request-file-${id}`;
  const resetAudioRequestInput = (keepFeedback = false) => {
    setAudioRequestFile(null);
    if (!keepFeedback) {
      setAudioRequestFeedback(null);
    }
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }
  };
  const [categories, setCategories] = useState<string[]>([]);
  const [showEditRequestForm, setShowEditRequestForm] = useState(false);
  const [editForm, setEditForm] = useState({
    nom_chant: "",
    auteur: "",
    ville_origine: "",
    paroles: "",
    description: "",
    illustration_chant: null as File | null,
    paroles_pdf: null as File | null,
    partition: null as File | null,
  });
  const [editSelectedCats, setEditSelectedCats] = useState<string[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFeedback, setEditFeedback] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  const resetEditFormState = useCallback(() => {
    if (!chant) return;
    setEditForm({
      nom_chant: chant.nom_chant || "",
      auteur: chant.auteur || "",
      ville_origine: chant.ville_origine || "",
      paroles: chant.paroles || "",
      description: chant.description || "",
      illustration_chant: null,
      paroles_pdf: null,
      partition: null,
    });
    setEditSelectedCats(
      chant.categories && chant.categories.length ? chant.categories : ["Autre"]
    );
  }, [chant]);

  useEffect(() => {
    const uid = localStorage.getItem("utilisateur_id");
    if (uid) setUSER_ID(Number(uid));
    const mail = localStorage.getItem("email");
    if (mail) setUserEmail(mail);
  }, []);

  useEffect(() => {
    const storedAdminFlag = localStorage.getItem("is_admin");
    if (storedAdminFlag !== null) {
      setIsAdmin(storedAdminFlag === "true");
      return;
    }

    const email = localStorage.getItem("email");
    if (!email) return;
    setUserEmail(email);

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

  useEffect(() => {
    fetch(apiUrl(API_CATEGORIES))
      .then((r) => r.json())
      .then((data) =>
        setCategories(sortCategoriesWithAutreLast(data.map((c: any) => c.nom_categorie)))
      )
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    resetEditFormState();
  }, [resetEditFormState]);

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

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAudioRequestFile(file ?? null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;

    if (files && files[0]) {
      const file = files[0];
      setEditForm((prev) => ({ ...prev, [name]: file }));
      return;
    }

    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const triggerFilePicker = (field: EditFileFieldName) => {
    if (typeof document === "undefined") return;
    const input = document.getElementById(`edit-file-${field}`) as HTMLInputElement | null;
    input?.click();
  };

  const clearFileField = (field: EditFileFieldName) => {
    setEditForm((prev) => ({ ...prev, [field]: null }));
  };

  const handleToggleEditRequestForm = () => {
    if (!USER_ID) return;
    setShowEditRequestForm((prev) => !prev);
    setEditFeedback(null);
  };

  const submitAudioRequest = async () => {
    if (!USER_ID || !userEmail) {
      alert("Connecte-toi pour envoyer une piste audio.");
      return;
    }
    if (!audioRequestFile) {
      setAudioRequestFeedback({ type: "error", message: "Sélectionne un fichier MP3." });
      return;
    }

    setAudioSubmitting(true);
    setAudioRequestFeedback(null);
    try {
      const fd = new FormData();
      fd.append("chant_id", String(id));
      fd.append("fichier_mp3", audioRequestFile);

      const res = await fetch(apiUrl(API_AUDIO_REQUESTS), {
        method: "POST",
        headers: { "X-User-Email": userEmail },
        body: fd,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Impossible d'envoyer ta demande.");
      }

      setAudioRequestFeedback({
        type: "success",
        message: "Ta demande d'ajout de piste a bien été envoyée.",
      });
      resetAudioRequestInput(true);
      setShowAudioRequestForm(false);
    } catch (e: any) {
      setAudioRequestFeedback({
        type: "error",
        message: e?.message ?? "Erreur lors de l'envoi.",
      });
    } finally {
      setAudioSubmitting(false);
    }
  };

  const submitEditRequest = async () => {
    if (!USER_ID || !userEmail) {
      alert("Connecte-toi pour envoyer une demande.");
      return;
    }

    if (!editForm.nom_chant.trim()) {
      setEditFeedback({ type: "error", message: "Le nom du chant est requis." });
      return;
    }

    setEditSubmitting(true);
    setEditFeedback(null);
    try {
      const fd = new FormData();
      fd.append("chant_id", String(id));
      fd.append("nom_chant", editForm.nom_chant);
      fd.append("auteur", editForm.auteur);
      fd.append("ville_origine", editForm.ville_origine);
      fd.append("paroles", editForm.paroles);
      fd.append("description", editForm.description);

      const catsToSend = editSelectedCats.length ? editSelectedCats : ["Autre"];
      catsToSend.forEach((cat) => fd.append("categories", cat));

      if (editForm.illustration_chant)
        fd.append("illustration_chant", editForm.illustration_chant);
      if (editForm.paroles_pdf)
        fd.append("paroles_pdf", editForm.paroles_pdf);
      if (editForm.partition)
        fd.append("partition", editForm.partition);

      const res = await fetch(apiUrl(API_MODIFICATION_REQUESTS), {
        method: "POST",
        headers: { "X-User-Email": userEmail },
        body: fd,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Impossible d'envoyer ta demande.");
      }

      setEditFeedback({ type: "success", message: "Ta demande de modification a bien été envoyée." });
      setShowEditRequestForm(false);
    } catch (e: any) {
      setEditFeedback({
        type: "error",
        message: e?.message ?? "Erreur lors de l'envoi.",
      });
    } finally {
      setEditSubmitting(false);
    }
  };

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
        <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-mauve">Audio</h2>
          {USER_ID ? (
          <button
            onClick={() => {
              setShowAudioRequestForm((prev) => {
                if (prev) resetAudioRequestInput();
                return !prev;
              });
              setAudioRequestFeedback(null);
            }}
            className={`btn ${showAudioRequestForm ? "btn-danger" : ""}`}
          >
            {showAudioRequestForm ? "Annuler" : "Ajouter une piste audio"}
          </button>
          ) : (
            <p className="text-xs text-gray-500">Connecte-toi pour proposer une piste audio.</p>
          )}
        </div>

        {chant.pistes_audio.length > 0 ? (
          chant.pistes_audio.map((p) => {
            const audioSrc = resolveMediaUrl(p.fichier_mp3);
            if (!audioSrc) return null;
            return (
              <div key={p.id} className="mb-6">
        <audio controls className="w-full mb-2">
          <source src={audioSrc} type={resolveAudioMime(audioSrc)} />
        </audio>

                <div className="flex items-center gap-3 text-gray-700 text-sm mb-1">
                  <span className="font-semibold text-mauve text-lg">Note :</span>

                  <span className="text-lg font-bold">
                    {p.note_moyenne?.toFixed(1) || "0.0"}★
                  </span>

                  <span className="text-gray-500">
                    ({p.nb_notes} vote{p.nb_notes > 1 ? "s" : ""})
                  </span>
                </div>

                {/* Notation utilisateur */}
                {!USER_ID && (
                  <p className="text-xs text-gray-500 mt-1">
                    Connecte-toi pour noter la piste audio
                  </p>
                )}

                {USER_ID && (
                  <div>
                    <p className="text-sm text-mauve font-semibold mb-1">
                      Noter cette piste :
                    </p>
                    <RatingStars
                      pisteId={p.id}
                      userId={USER_ID}
                      onStatsChange={(stats) => handlePisteStats(p.id, stats)}
                      initialAverage={p.note_moyenne}
                      initialCount={p.nb_notes}
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 italic">Aucun audio disponible.</p>
        )}

        {showAudioRequestForm && USER_ID && (
          <div className="mt-4 rounded-2xl border border-mauve/30 bg-white p-4 shadow-sm space-y-3">
            <p className="text-sm text-gray-600">
              Ajoute un fichier MP3 pour proposer une nouvelle piste. L'équipe valide chaque demande.
            </p>
            <div className="flex items-center gap-3">
              <input
                id={audioInputId}
                ref={audioInputRef}
                type="file"
                accept=".mp3,.m4a"
                onChange={handleAudioFileChange}
                className="hidden"
              />
              {!audioRequestFile ? (
                <label
                  htmlFor={audioInputId}
                  className="btn btn-ghost text-sm"
                >
                  Ajouter un fichier
                </label>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-700">🎧 {audioRequestFile.name}</span>
                  <label
                    htmlFor={audioInputId}
                    className="btn btn-outline text-xs px-2 py-1"
                  >
                    Changer
                  </label>
                  <button
                    type="button"
                    className="btn btn-danger text-xs px-2 py-1"
                    onClick={() => resetAudioRequestInput()}
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
            {audioRequestFeedback && (
              <p
                className={`text-sm ${
                  audioRequestFeedback.type === "success" ? "text-green-600" : "text-red-600"
                }`}
              >
                {audioRequestFeedback.message}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={submitAudioRequest}
                disabled={audioSubmitting}
                className="btn btn-solid disabled:opacity-50"
              >
                {audioSubmitting ? "Envoi..." : "Envoyer ma demande"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ville */}
      <div>
        <p className="text-sm font-semibold text-mauve mb-1">Auteur</p>
        <p className="text-gray-700">{chant.auteur || "Aucun auteur identifié"}</p>
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
          className="w-full max-h-72 object-cover rounded-xl shadow"
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
            className="btn btn-solid"
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
            className="btn btn-solid"
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
        <p className="text-gray-700">{chant.utilisateur_pseudo || "Un membre"}</p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleToggleEditRequestForm}
          disabled={!USER_ID}
          className={`btn self-start ${
            USER_ID
              ? showEditRequestForm
                ? "btn-danger"
                : "btn-solid"
              : "btn-ghost text-gray-500 cursor-not-allowed"
          }`}
        >
          {showEditRequestForm ? "Annuler ma demande" : "Demander une modification"}
        </button>
        {!USER_ID && (
          <p className="text-xs text-gray-500">
            Connecte-toi pour demander la modification d’un chant
          </p>
        )}
        {editFeedback && (
          <p
            className={`text-sm ${
              editFeedback.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {editFeedback.message}
          </p>
        )}
      </div>

      {showEditRequestForm && USER_ID && (
        <section className="rounded-2xl border border-mauve/30 bg-white p-6 shadow flex flex-col gap-6">
          <h2 className="text-xl font-semibold text-mauve">Formulaire de modification</h2>
          <div className="grid gap-4">
            <input
              name="nom_chant"
              value={editForm.nom_chant}
              onChange={handleEditChange}
              placeholder="Nom du chant"
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve"
            />
            <input
              name="auteur"
              value={editForm.auteur}
              onChange={handleEditChange}
              placeholder="Auteur"
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve"
            />
            <input
              name="ville_origine"
              value={editForm.ville_origine}
              onChange={handleEditChange}
              placeholder="Ville d'origine"
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve"
            />
            <textarea
              name="paroles"
              value={editForm.paroles}
              onChange={handleEditChange}
              placeholder="Paroles"
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve h-28"
            />
            <textarea
              name="description"
              value={editForm.description}
              onChange={handleEditChange}
              placeholder="Description"
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mauve h-24"
            />
          </div>

          <div>
            <p className="font-semibold text-gray-700 mb-2">Catégories</p>
            <div className="flex flex-wrap gap-2">
              {(categories.length ? categories : ["Autre"]).map((cat) => (
                <label
                  key={cat}
                  className={`px-3 py-1 border rounded-full cursor-pointer ${
                    editSelectedCats.includes(cat)
                      ? "bg-mauve text-white border-mauve"
                      : "border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={editSelectedCats.includes(cat)}
                    onChange={() => {
                      if (editSelectedCats.includes(cat)) {
                        setEditSelectedCats(editSelectedCats.filter((c) => c !== cat));
                      } else {
                        setEditSelectedCats([...editSelectedCats, cat]);
                      }
                    }}
                  />
                  {cat}
                </label>
              ))}
            </div>
            {editSelectedCats.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                (Sans sélection, il sera classé dans "Autre")
              </p>
            )}
          </div>

          <div className="grid gap-6 text-sm">
            {editFileFields.map((field) => (
              <div key={field.name}>
                <p className="font-semibold">{field.label}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <input
                    id={`edit-file-${field.name}`}
                    type="file"
                    name={field.name}
                    accept={field.accept}
                    onChange={handleEditChange}
                    className="hidden"
                  />
                  {!editForm[field.name] ? (
                    <button
                      type="button"
                      onClick={() => triggerFilePicker(field.name)}
                      className="btn btn-ghost text-sm"
                    >
                      Ajouter un fichier
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {field.emoji} {editForm[field.name]?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => triggerFilePicker(field.name)}
                        className="btn btn-outline text-xs py-1 px-2"
                      >
                        Changer
                      </button>
                      <button
                        type="button"
                        onClick={() => clearFileField(field.name)}
                        className="btn btn-danger text-xs py-1 px-2"
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              onClick={() => {
                resetEditFormState();
              }}
              className="btn btn-outline"
            >
              Réinitialiser
            </button>
            <button
              onClick={() => {
                setShowEditRequestForm(false);
                setEditFeedback(null);
              }}
              className="btn btn-secondary"
              type="button"
            >
              Annuler
            </button>
            <button
              onClick={submitEditRequest}
              disabled={editSubmitting}
              className="btn btn-solid disabled:opacity-60"
              type="button"
            >
              {editSubmitting ? "Envoi..." : "Envoyer ma demande"}
            </button>
          </div>
        </section>
      )}

      {/* ZONE COMMENTAIRES */}
      <Comments 
        chantId={chant.id}
        userId={USER_ID}
        isAdmin={isAdmin}
      />

      {/* RETOUR */}
      <button
        onClick={() => history.back()}
        className="btn mt-6"
      >
        ← Retour
      </button>

    </div>
  );
}
