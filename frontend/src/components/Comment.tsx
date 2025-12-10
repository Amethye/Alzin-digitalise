import React, { useEffect, useState } from "react";

type CommentType = {
  id: number;
  utilisateur: number;
  utilisateur_nom: string;
  texte: string;
  date_comment: string;
  chant: number;
};

type Props = {
  chantId: number;
  userId: number | null;
  isAdmin?: boolean; // <-- optionnel si tu veux afficher différemment pour admin
};

export default function Comments({ chantId, userId, isAdmin = false }: Props) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Load comments -----------------------------------------
  useEffect(() => {
    fetch(`/api/commentaires/?chant_id=${chantId}`)
      .then((res) => res.json())
      .then((data) => setComments(data))
      .catch((err) => console.error(err));
  }, [chantId]);

  // Add comment --------------------------------------------
  const handleAdd = () => {
    if (!userId) {
      alert("Vous devez être connecté pour commenter.");
      return;
    }

    fetch("/api/commentaires/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        utilisateur: userId,
        chant: chantId,
        texte: newComment,
      }),
    })
      .then((res) => res.json())
      .then((newCom) => {
        setComments((prev) => [...prev, newCom]);
        setNewComment("");
      });
  };

  // Start editing ------------------------------------------
  const startEdit = (comment: CommentType) => {
    setEditingId(comment.id);
    setEditText(comment.texte);
  };

  // Save edition -------------------------------------------
  const saveEdit = (id: number) => {
    if (!userId) return;

    fetch("/api/commentaires/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        texte: editText,
        utilisateur: userId, // IMPORTANT POUR LA PERMISSION
      }),
    })
      .then((res) => res.json())
      .then((updated) => {
        setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
        setEditingId(null);
      });
  };

  // Delete comment -----------------------------------------
  const deleteComment = (id: number) => {
    if (!userId) return;

    fetch("/api/commentaires/", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        utilisateur: userId, // PERMISSION NECESSAIRE
      }),
    }).then(() => {
      setComments((prev) => prev.filter((c) => c.id !== id));
    });
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-3">
        Commentaires ({comments.length})
      </h2>

      {/* ADD A COMMENT */}
      {userId && (
        <div className="mb-4">
          <textarea
            className="border p-2 w-full rounded"
            placeholder="Écrire un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={handleAdd}
          >
            Ajouter
          </button>
        </div>
      )}

      {/* LIST OF COMMENTS */}
      <div className="space-y-3">
        {comments.map((comment) => {
          const canEditOrDelete =
            userId === comment.utilisateur || isAdmin === true;

          return (
            <div key={comment.id} className="p-3 border rounded bg-white">
              <div className="flex justify-between">
                <p className="font-semibold">
                  {comment.utilisateur_nom}
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(comment.date_comment).toLocaleDateString("fr-FR")}
                  </span>
                </p>

                {canEditOrDelete && (
                  <div className="space-x-2">
                    <button
                      className="text-blue-500"
                      onClick={() => startEdit(comment)}
                    >
                      Modifier
                    </button>
                    <button
                      className="text-red-500"
                      onClick={() => deleteComment(comment.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </div>

              {/* EDIT MODE */}
              {editingId === comment.id ? (
                <div className="mt-2">
                  <textarea
                    className="border p-2 w-full rounded"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <button
                    className="mt-2 px-4 py-1 bg-green-600 text-white rounded"
                    onClick={() => saveEdit(comment.id)}
                  >
                    Enregistrer
                  </button>
                </div>
              ) : (
                <p className="mt-1">{comment.texte}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}