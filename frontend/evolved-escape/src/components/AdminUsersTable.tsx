// src/components/AdminUsersTable.tsx
import { useEffect, useState } from "react";

type User = {
  id: string;
  nom: string;
  prenom: string;
  identifiant?: string; // member_id ou email
  role: string;
};

const ROLE_OPTIONS = ["member","admin"];

export default function AdminUsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ nom: string; prenom: string; identifiant: string }>({ nom: "", prenom: "", identifiant: "" });

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users", { credentials: "include" });
    if (!res.ok) throw new Error("Impossible de charger les utilisateurs");
    const data: User[] = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, []);

  const changeRole = async (userId: string, role: string) => {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role }),
    });
    if (!res.ok) { alert("Erreur lors du changement de rôle"); return; }
    await fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) { alert("Erreur lors de la suppression de l'utilisateur"); return; }
    await fetchUsers();
  };

  const saveUser = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(editValues),
    });
    if (!res.ok) { alert("Erreur lors de la modification"); return; }
    setEditingUserId(null);
    await fetchUsers();
  };

  if (loading)
    return <p className="text-center text-sm text-gray-600 sm:text-base">Chargement…</p>;

  const totalUsers = users.length;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-end">
        <p className="rounded-full bg-bleu/10 px-3 py-1 text-sm text-bleu sm:text-base">
          Total utilisateurs : <span className="font-semibold">{totalUsers}</span>
        </p>
      </div>
      <div className="w-full overflow-x-auto rounded-lg border border-bleu/30 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm sm:text-base">
          <thead>
            <tr className="bg-bleu/10 text-left text-xs font-semibold uppercase tracking-wide text-gray-700 sm:text-sm">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Prénom</th>
              <th className="px-4 py-3">Identifiant</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="bg-white hover:bg-blue-50/40">
                <td className="px-4 py-3">
                  {editingUserId === u.id ? (
                    <input
                      value={editValues.nom}
                      onChange={e => setEditValues(prev => ({ ...prev, nom: e.target.value }))}
                      className="w-full rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  ) : u.nom}
                </td>
                <td className="px-4 py-3">
                  {editingUserId === u.id ? (
                    <input
                      value={editValues.prenom}
                      onChange={e => setEditValues(prev => ({ ...prev, prenom: e.target.value }))}
                      className="w-full rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  ) : u.prenom}
                </td>
                <td className="px-4 py-3">
                  {editingUserId === u.id ? (
                    <input
                      value={editValues.identifiant}
                      onChange={e => setEditValues(prev => ({ ...prev, identifiant: e.target.value }))}
                      className="w-full rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  ) : u.identifiant ?? ""}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={e=>changeRole(u.id,e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {ROLE_OPTIONS.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                  {editingUserId === u.id ? (
                    <>
                      <button onClick={()=>saveUser(u.id)} className="rounded bg-green-600 px-3 py-1 text-white transition hover:bg-green-700">💾</button>
                      <button onClick={()=>setEditingUserId(null)} className="rounded bg-gray-400 px-3 py-1 text-white transition hover:bg-gray-500">✖</button>
                    </>
                  ) : (
                    <>
                      <button onClick={()=>{setEditingUserId(u.id); setEditValues({nom:u.nom, prenom:u.prenom, identifiant:u.identifiant ?? ""})}} className="rounded bg-yellow-500 px-3 py-1 text-white transition hover:bg-yellow-600">✏️</button>
                      <button onClick={()=>deleteUser(u.id)} className="rounded bg-red-600 px-3 py-1 text-white transition hover:bg-red-700">🗑</button>
                    </>
                  )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
