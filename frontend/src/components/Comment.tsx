import React, { useEffect, useState } from "react";

type CommentType = {
  id: number;
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
    fetch(`/api/commentaires/?chant_id=${chantId}`)
      .then((res) => res.json())
      .then((data) => setComments(data))
      .catch((err) => console.error(err));
  }, [chantId]);

  const userAlreadyCommented = comments.some(
    (c) => c.utilisateur_id === userId
  );

  // Ajouter un commentaire --------------------------------------------
  const handleAdd = () => {
    if (!userId) {
      alert("Vous devez être connecté pour commenter.");
      return;
    }
    if (!newComment.trim()) {
      alert("Le commentaire ne peut pas être vide.");
      return;
    }

    fetch("/api/commentaires/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        utilisateur_id: userId,
        chant_id: chantId,
        texte: newComment,
      }),
    })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok || payload.error) {
          alert(payload.error || "Impossible d’ajouter le commentaire.");
          return;
        }
        setComments((prev) => [...prev, payload]);
        setNewComment("");
      })
      .catch(() => alert("Impossible d’ajouter le commentaire."));
  };

  // Mode édition -------------------------------------------------------
  const startEdit = (comment: CommentType) => {
    setEditingId(comment.id);
    setEditText(comment.texte);
  };

  const saveEdit = (id: number) => {
    if (!userId) return;

    fetch("/api/commentaires/", {
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

  // Supprimer -----------------------------------------------------------
  const deleteComment = (id: number) => {
    if (!userId) return;

    fetch("/api/commentaires/", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        userId,
      }),
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || payload?.error) {
          alert(payload?.error || "Impossible de supprimer le commentaire.");
          return;
        }
        setComments((prev) => prev.filter((c) => c.id !== id));
      })
      .catch(() => alert("Impossible de supprimer le commentaire."));
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <div className="mt-10 bg-white rounded-2xl shadow p-6 border border-gray-200">
      {/* --- TITRE + compteur de commentaires --- */}
      <h2 className="text-2xl font-bold text-mauve mb-4">
        Commentaires ({comments.length})
      </h2>

      {/* Formulaire d’ajout → seulement si pas encore commenté */}
      {userId && !userAlreadyCommented && (
        <div className="mb-4">
          <textarea
            className="border border-mauve p-3 w-full rounded-lg"
            placeholder="Écrire un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            className="mt-2 px-4 py-2 bg-mauve text-white rounded-lg shadow hover:bg-mauve/80"
            onClick={handleAdd}
          >
            Ajouter un commentaire
          </button>
        </div>
      )}

      {/* Liste des commentaires */}
      <div className="space-y-4">
        {comments.map((comment) => {
          const canEditOrDelete =
            Boolean(userId) && (isAdmin || userId === comment.utilisateur_id);

          return (
            <div
              key={comment.id}
              className="p-4 rounded-xl bg-purple-50 border border-mauve/20 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <p className="font-semibold text-mauve">
                  {comment.utilisateur_pseudo}
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(comment.date_comment).toLocaleDateString("fr-FR")}
                  </span>
                </p>

                {/* Boutons admin / utilisateur */}
                {canEditOrDelete && (
                  <div className="space-x-3">
                    <button
                      className="px-3 py-1 bg-mauve text-white rounded-lg shadow hover:bg-mauve/80 transition"
                      onClick={() => startEdit(comment)}
                    >
                      Modifier
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
                      onClick={() => deleteComment(comment.id)}
                    >
                      Supprimer
                    </button>
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
                    className="mt-2 px-4 py-2 bg-mauve text-white rounded-lg shadow hover:bg-mauve/80 transition"
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