import AdminCommittee from "./AdminCommittee";
import RequireRole from "./RequireRole";

export default function AdminCommitteePage() {
  return (
    <RequireRole
      allowedRoles={["admin"]}
      loader={<div className="text-sm text-gray-500">Vérification des droits…</div>}
    >
      <AdminCommittee />
    </RequireRole>
  );
}
