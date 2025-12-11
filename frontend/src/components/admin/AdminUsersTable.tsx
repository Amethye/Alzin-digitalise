// src/components/AdminUsersTable.tsx
import { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";
import DeleteButton from "../DeleteButton";

type User = {
  id: number;
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  ville: string;
  role: string;
};

const ROLE_OPTIONS = ["user", "admin"];

export default function AdminUsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const [editValues, setEditValues] = useState({
    nom: "",
    prenom: "",
    pseudo: "",
    email: "",
    ville: "",
  });

  /** Charger les utilisateurs */
  const fetchUsers = async () => {
    const res = await fetch(apiUrl("/api/admin/users/"), {
      credentials: "include",
    });

    if (!res.ok) throw new Error("Impossible de charger les utilisateurs");

    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, []);

  /** Modifier rôle */
  const changeRole = async (userId: number, role: string) => {
    const res = await fetch(apiUrl(`/api/admin/users/${userId}/role/`), {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (!res.ok) return alert("Erreur lors du changement de rôle");
    await fetchUsers();
  };

  /** Sauvegarder modification */
  const saveUser = async (userId: number) => {
    const res = await fetch(apiUrl(`/api/admin/users/${userId}/`), {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editValues),
    });

    if (!res.ok) return alert("Erreur lors de la modification");

    setEditingUserId(null);
    await fetchUsers();
  };

  if (loading) return <p>Chargement…</p>;

  const totalUsers = users.length;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-end">
        <p className="rounded-full bg-bordeau/10 px-3 py-1 text-sm text-bordeau sm:text-base">
          Total utilisateurs :{" "}
          <span className="font-semibold">{totalUsers}</span>
        </p>
      </div>
      <div className="w-full overflow-x-auto rounded-lg border border-bordeau/30 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm sm:text-base">
          <thead>
            <tr className="bg-bordeau/10 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 sm:text-sm">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Prénom</th>
              <th className="px-4 py-3">Pseudo</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="bg-white hover:bg-bordeau-50/40">

                {/* NOM */}
                <td className="px-4 py-3">
                  {editingUserId === u.id ? (
                    <input
                      value={editValues.nom}
                      onChange={(e) => setEditValues((v) => ({ ...v, nom: e.target.value }))
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-bordeau-300"
                    />
                  ) : u.nom}
                </td>

                {/* PRENOM */}
                <td className="px-4 py-3">
                  {editingUserId === u.id ? (
                    <input
                      value={editValues.prenom}
                      onChange={(e) => setEditValues((v) => ({ ...v, prenom: e.target.value }))
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-bordeau-300"
                    />
                  ) : u.prenom}
                </td>

                {/* PSEUDO */}
                <td className="px-4 py-3">
                  {editingUserId === u.id ? (
                    <input
                      value={editValues.pseudo}
                      onChange={(e) => setEditValues((v) => ({ ...v, pseudo: e.target.value }))
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-bordeau-300"
                    />
                  ) : u.pseudo}
                </td>

                {/* EMAIL */}
                <td className="px-4 py-3">{u.email}</td>

                {/* VILLE */}
                <td className="px-4 py-3">
                  {editingUserId === u.id ? (
                    <input
                      value={editValues.ville}
                      onChange={(e) => setEditValues((v) => ({ ...v, ville: e.target.value }))
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-bordeau-300"
                    />
                  ) : u.ville}
                </td>

                {/* ROLE */}
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-bordeau-300"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value ={r}>{r}</option>
                    ))}
                  </select>
                </td>

                {/* ACTIONS */}
                <td className="px-4 py-3 flex gap-2">
                  {editingUserId === u.id ? (
                    <>
                      <button className="btn btn-solid" onClick={() => saveUser(u.id)}>💾</button>
                      <button className="btn btn-secondary" onClick={() => setEditingUserId(null)}>✖</button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-warning"
                        onClick={() => {
                          setEditingUserId(u.id);
                          setEditValues({
                            nom: u.nom,
                            prenom: u.prenom,
                            pseudo: u.pseudo,
                            email: u.email,
                            ville: u.ville,
                          });
                        }}
                      >
                        ✏️
                      </button>

                      <DeleteButton
                        endpoint={`/api/admin/users/${u.id}/`}
                        label="🗑"
                        confirmMessage="Supprimer cet utilisateur ?"
                        requestInit={{ credentials: "include" }}
                        onSuccess={fetchUsers}
                        onError={(message) => alert(message || "Erreur lors de la suppression")}
                      />
                    </>
                  )}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
