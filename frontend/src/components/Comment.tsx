import React, { useEffect, useState } from "react";
import DeleteButton from "./DeleteButton";
import { apiUrl } from "../lib/api";

type CommentType = {
  id: number | string;
  utilisateur_id: number;
  utilisateur_pseudo: string;
  texte: string;
  date_comment: string;
  chant: number;
};

type Props = {
  chantId: number;
  userId: number | null;
  isAdmin?: boolean;
};

export default function Comments({ chantId, userId, isAdmin = false }: Props) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Charger les commentaires -----------------------------------------
  useEffect(() => {
    fetch(apiUrl(`/api/commentaires/?chant_id=${chantId}`))
      .then((res) => res.json())
      .then((data) => setComments(data))
      .catch((err) => console.error(err));
  }, [chantId]);

  const userAlreadyCommented = comments.some(
    (c) => c.utilisateur_id === userId
  );

  // Ajouter un commentaire --------------------------------------------
  const handleAdd = async () => {
    if (!userId) {
      alert("Vous devez être connecté pour commenter.");
      return;
    }
    if (!newComment.trim()) {
      alert("Le commentaire ne peut pas être vide.");
      return;
    }

    const trimmedComment = newComment.trim();
    const placeholderId = `temp-${Date.now()}`;
    const pseudo = localStorage.getItem("pseudo") || "Moi";
    const placeholder: CommentType = {
      id: placeholderId,
      utilisateur_id: userId,
      utilisateur_pseudo: pseudo,
      texte: trimmedComment,
      date_comment: new Date().toISOString(),
      chant: chantId,
    };

    setComments((prev) => [...prev, placeholder]);
    setNewComment("");

    try {
      const res = await fetch(apiUrl("/api/commentaires/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utilisateur_id: userId,
          chant_id: chantId,
          texte: trimmedComment,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.error) {
        throw new Error(payload.error || "Impossible d’ajouter le commentaire.");
      }
      setComments((prev) =>
        prev.map((c) => (c.id === placeholderId ? payload : c))
      );
    } catch (err: any) {
      setComments((prev) => prev.filter((c) => c.id !== placeholderId));
      alert(err?.message || "Impossible d’ajouter le commentaire.");
    }
  };

  // Mode édition -------------------------------------------------------
  const startEdit = (comment: CommentType) => {
    setEditingId(comment.id);
    setEditText(comment.texte);
  };

  const saveEdit = (id: number) => {
    if (!userId) return;

    fetch(apiUrl("/api/commentaires/"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        texte: editText,
        userId,
      }),
    })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok || payload.error) {
          alert(payload.error || "Impossible de modifier le commentaire.");
          return;
        }
        setComments((prev) => prev.map((c) => (c.id === id ? payload : c)));
        setEditingId(null);
      })
      .catch(() => alert("Impossible de modifier le commentaire."));
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <div className="mt-10 bg-gray-50 rounded-2xl shadow p-6 border border-bordeau/20">
      {/* --- TITRE + compteur de commentaires --- */}
      <h2 className="text-2xl font-bold text-bordeau mb-4">
        Commentaires ({comments.length})
      </h2>

      {/* Formulaire d’ajout → seulement si pas encore commenté */}
      {userId && !userAlreadyCommented && (
        <div className="mb-4">
          <textarea
            className="border border-bordeau p-3 w-full rounded-lg"
            placeholder="Écrire un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            className="btn btn-solid mt-2"
            onClick={handleAdd}
          >
            Ajouter un commentaire
          </button>
        </div>
      )}

      {/* Liste des commentaires */}
      <div className="space-y-4">
        {comments.map((comment, index) => {
          const canEditOrDelete =
            Boolean(userId) && (isAdmin || userId === comment.utilisateur_id);

          return (
            <div
              key={comment.id}
              className="p-4 rounded-xl bg-bordeau/10 border border-bordeau/30 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <p className="font-semibold text-bordeau">
                  {comment.utilisateur_pseudo}
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(comment.date_comment).toLocaleDateString("fr-FR")}
                  </span>
                </p>

                {/* Boutons admin / utilisateur */}
                {canEditOrDelete && (
                  <div className="space-x-3">
                    <button
                      className="btn"
                      onClick={() => startEdit(comment)}
                    >
                      Modifier
                    </button>
                    <DeleteButton
                      endpoint={apiUrl("/api/commentaires/")}
                      confirmMessage="Supprimer ce commentaire ?"
                      disabled={!userId}
                      requestInit={{
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: comment.id,
                          userId,
                        }),
                      }}
                      onOptimistic={() =>
                        setComments((prev) =>
                          prev.filter((c) => c.id !== comment.id)
                        )
                      }
                      onError={(message) => {
                        setComments((prev) => {
                          const next = [...prev];
                          next.splice(index, 0, comment);
                          return next;
                        });
                        alert(message || "Impossible de supprimer le commentaire.");
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Mode édition */}
              {editingId === comment.id ? (
                <div className="mt-2">
                  <textarea
                    className="border p-2 w-full rounded-lg"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <button
                    className="btn btn-solid mt-2"
                    onClick={() => saveEdit(comment.id)}
                  >
                    Enregistrer
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-gray-800">{comment.texte}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
