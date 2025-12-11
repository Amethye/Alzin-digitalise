import React, { useEffect, useState } from "react";
import { apiUrl } from "../../lib/api";

type ChantRequest = {
  id: number;
  nom_chant: string;
  auteur: string;
  ville_origine: string;
  description: string;
  categories: string[];
  statut: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE";
  justification_refus?: string | null;
  date_creation: string;
  date_decision?: string | null;
  utilisateur: { id: number; pseudo: string; email: string };
  illustration_chant_url?: string | null;
  paroles_pdf_url?: string | null;
  partition_url?: string | null;
  pistes_audio: { id: number; fichier_mp3: string | null }[];
};

const API_ADMIN_REQUESTS = "/api/admin/demandes-chants/";
type AudioRequest = {
  id: number;
  statut: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE";
  justification_refus?: string | null;
  date_creation: string;
  date_decision?: string | null;
  chant: { id: number; nom_chant: string };
  utilisateur: { id: number; pseudo: string; email: string };
  fichier_mp3_url?: string | null;
};

const API_ADMIN_AUDIO_REQUESTS = "/api/admin/demandes-audio/";
type ModificationRequest = {
  id: number;
  nom_chant: string;
  auteur: string;
  ville_origine: string;
  description: string;
  categories: string[];
  statut: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE";
  justification_refus?: string | null;
  date_creation: string;
  date_decision?: string | null;
  chant_id: number;
  chant_nom: string;
  utilisateur: { id: number; pseudo: string; email: string };
  illustration_chant_url?: string | null;
  paroles_pdf_url?: string | null;
  partition_url?: string | null;
};

type ComparisonRow = {
  label: string;
  original: string;
  proposed: string;
  multiline?: boolean;
};

type AttachmentComparison = {
  label: string;
  originalUrl?: string | null;
  proposedUrl?: string | null;
};

type ChantDetail = {
  id: number;
  nom_chant: string;
  auteur: string;
  ville_origine: string;
  description: string;
  paroles: string;
  categories: string[];
  illustration_chant_url?: string | null;
  paroles_pdf_url?: string | null;
  partition_url?: string | null;
};

const API_ADMIN_MOD_REQUESTS = "/api/admin/demandes-modification/";

export default function AdminChantRequests() {
  const [requests, setRequests] = useState<ChantRequest[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<ChantRequest | null>(null);
  const [filter, setFilter] = useState<"ALL" | "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE">("EN_ATTENTE");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [actionJustification, setActionJustification] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [audioRequests, setAudioRequests] = useState<AudioRequest[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<number | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<AudioRequest | null>(null);
  const [audioFilter, setAudioFilter] = useState<"ALL" | "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE">("EN_ATTENTE");
  const [audioLoadingList, setAudioLoadingList] = useState(true);
  const [audioLoadingDetail, setAudioLoadingDetail] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioDetailError, setAudioDetailError] = useState<string | null>(null);
  const [audioActionJustification, setAudioActionJustification] = useState("");
  const [audioActionLoading, setAudioActionLoading] = useState(false);
  const [audioActionFeedback, setAudioActionFeedback] = useState<string | null>(null);
  const [modRequests, setModRequests] = useState<ModificationRequest[]>([]);
  const [selectedModId, setSelectedModId] = useState<number | null>(null);
  const [selectedMod, setSelectedMod] = useState<ModificationRequest | null>(null);
  const [modFilter, setModFilter] = useState<"ALL" | "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE">("EN_ATTENTE");
  const [modLoadingList, setModLoadingList] = useState(true);
  const [modLoadingDetail, setModLoadingDetail] = useState(false);
  const [modError, setModError] = useState<string | null>(null);
  const [modDetailError, setModDetailError] = useState<string | null>(null);
  const [modActionJustification, setModActionJustification] = useState("");
  const [modActionLoading, setModActionLoading] = useState(false);
  const [modActionFeedback, setModActionFeedback] = useState<string | null>(null);
  const [modOriginalChant, setModOriginalChant] = useState<ChantDetail | null>(null);
  const [modOriginalLoading, setModOriginalLoading] = useState(false);
  const [modOriginalError, setModOriginalError] = useState<string | null>(null);

  const statusLabel: Record<ChantRequest["statut"], string> = {
    EN_ATTENTE: "En attente",
    ACCEPTEE: "Acceptée",
    REFUSEE: "Refusée",
  };

  const statusColor: Record<ChantRequest["statut"], string> = {
    EN_ATTENTE: "text-yellow-600 bg-yellow-50 border-yellow-200",
    ACCEPTEE: "text-green-600 bg-green-50 border-green-200",
    REFUSEE: "text-red-600 bg-red-50 border-red-200",
  };

  const loadList = async (email: string, currentFilter = filter) => {
    try {
      setLoadingList(true);
      setError(null);
      const url =
        currentFilter === "ALL"
          ? apiUrl(API_ADMIN_REQUESTS)
          : apiUrl(`${API_ADMIN_REQUESTS}?statut=${currentFilter}`);
      const res = await fetch(url, {
        headers: { "X-User-Email": email },
      });
      if (!res.ok) throw new Error("Impossible de charger les demandes.");
      const data = await res.json();
      setRequests(data);
    } catch (e: any) {
      setError(e?.message ?? "Erreur inattendue.");
    } finally {
      setLoadingList(false);
    }
  };

  const loadDetail = async (id: number, email: string) => {
    try {
      setLoadingDetail(true);
      setDetailError(null);
      const res = await fetch(apiUrl(`${API_ADMIN_REQUESTS}${id}/`), {
        headers: { "X-User-Email": email },
      });
      if (!res.ok) throw new Error("Impossible de charger la demande.");
      const data = await res.json();
      setSelected(data);
      setSelectedId(id);
      setActionJustification("");
    } catch (e: any) {
      setDetailError(e?.message ?? "Erreur inattendue.");
      setSelected(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadAudioList = async (email: string, currentFilter = audioFilter) => {
    try {
      setAudioLoadingList(true);
      setAudioError(null);
      const url =
        currentFilter === "ALL"
          ? apiUrl(API_ADMIN_AUDIO_REQUESTS)
          : apiUrl(`${API_ADMIN_AUDIO_REQUESTS}?statut=${currentFilter}`);
      const res = await fetch(url, {
        headers: { "X-User-Email": email },
      });
      if (!res.ok) throw new Error("Impossible de charger les demandes audio.");
      const data = await res.json();
      setAudioRequests(data);
      setSelectedAudio(null);
      setSelectedAudioId(null);
    } catch (e: any) {
      setAudioError(e?.message ?? "Erreur inattendue.");
    } finally {
      setAudioLoadingList(false);
    }
  };

  const loadAudioDetail = async (id: number, email: string) => {
    try {
      setAudioLoadingDetail(true);
      setAudioDetailError(null);
      const res = await fetch(apiUrl(`${API_ADMIN_AUDIO_REQUESTS}${id}/`), {
        headers: { "X-User-Email": email },
      });
      if (!res.ok) throw new Error("Impossible de charger la demande audio.");
      const data = await res.json();
      setSelectedAudio(data);
      setSelectedAudioId(id);
      setAudioActionJustification("");
    } catch (e: any) {
      setAudioDetailError(e?.message ?? "Erreur inattendue.");
      setSelectedAudio(null);
    } finally {
      setAudioLoadingDetail(false);
    }
  };

  const loadModList = async (email: string, currentFilter = modFilter) => {
    try {
      setModLoadingList(true);
      setModError(null);
      const url =
        currentFilter === "ALL"
          ? apiUrl(API_ADMIN_MOD_REQUESTS)
          : apiUrl(`${API_ADMIN_MOD_REQUESTS}?statut=${currentFilter}`);
      const res = await fetch(url, { headers: { "X-User-Email": email } });
      if (!res.ok) throw new Error("Impossible de charger les demandes de modification.");
      const data = await res.json();
      setModRequests(data);
      setSelectedMod(null);
      setSelectedModId(null);
      setModOriginalChant(null);
      setModOriginalError(null);
      setModOriginalLoading(false);
    } catch (e: any) {
      setModError(e?.message ?? "Erreur inattendue.");
    } finally {
      setModLoadingList(false);
    }
  };

  const loadModDetail = async (id: number, email: string) => {
    try {
      setModLoadingDetail(true);
      setModDetailError(null);
      const res = await fetch(apiUrl(`${API_ADMIN_MOD_REQUESTS}${id}/`), {
        headers: { "X-User-Email": email },
      });
      if (!res.ok) throw new Error("Impossible de charger la demande de modification.");
      const data = await res.json();
      setSelectedMod(data);
      setSelectedModId(id);
      setModActionJustification("");
      setModOriginalChant(null);
      if (data?.chant_id) {
        loadModOriginalChant(data.chant_id);
      }
    } catch (e: any) {
      setModDetailError(e?.message ?? "Erreur inattendue.");
      setSelectedMod(null);
      setModOriginalChant(null);
    } finally {
      setModLoadingDetail(false);
    }
  };

  const loadModOriginalChant = async (chantId: number) => {
    try {
      setModOriginalLoading(true);
      setModOriginalError(null);
      const res = await fetch(apiUrl(`/api/chants/${chantId}/`));
      if (!res.ok) throw new Error("Impossible de charger le chant original.");
      const data = await res.json();
      setModOriginalChant(data);
    } catch (e: any) {
      setModOriginalError(e?.message ?? "Erreur inattendue.");
      setModOriginalChant(null);
    } finally {
      setModOriginalLoading(false);
    }
  };

  useEffect(() => {
    const email = localStorage.getItem("email");
    setAdminEmail(email);
    if (email) {
      loadList(email, filter);
      loadAudioList(email, audioFilter);
      loadModList(email, modFilter);
    } else {
      setLoadingList(false);
      setAudioLoadingList(false);
      setModLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (adminEmail) {
      loadList(adminEmail, filter);
      setSelected(null);
      setSelectedId(null);
    }
  }, [filter]);

  useEffect(() => {
    if (adminEmail) {
      loadAudioList(adminEmail, audioFilter);
    }
  }, [adminEmail, audioFilter]);

  useEffect(() => {
    if (adminEmail) {
      loadModList(adminEmail, modFilter);
    }
  }, [adminEmail, modFilter]);

  const handleSelect = (id: number) => {
    if (!adminEmail) return;
    const preview = requests.find((req) => req.id === id) ?? null;
    setSelected(preview);
    setSelectedId(id);
    setActionFeedback(null);
    loadDetail(id, adminEmail);
  };

  const performAction = async (action: "ACCEPTER" | "REFUSER") => {
    if (!adminEmail || !selectedId) return;
    if (action === "REFUSER" && !actionJustification.trim()) {
      setActionFeedback("Merci de préciser une justification.");
      return;
    }

    try {
      setActionLoading(true);
      setActionFeedback(null);
      const res = await fetch(apiUrl(`${API_ADMIN_REQUESTS}${selectedId}/`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": adminEmail,
        },
        body: JSON.stringify({
          action,
          justification: action === "REFUSER" ? actionJustification : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Action impossible.");
      }

      setActionFeedback(
        action === "ACCEPTER"
          ? "Demande acceptée et chant publié."
          : "Demande refusée."
      );
      setActionJustification("");
      await loadList(adminEmail, filter);
      await loadDetail(selectedId, adminEmail);
    } catch (e: any) {
      setActionFeedback(e?.message ?? "Erreur inattendue.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectAudio = (id: number) => {
    if (!adminEmail) return;
    const preview = audioRequests.find((req) => req.id === id) ?? null;
    setSelectedAudio(preview);
    setSelectedAudioId(id);
    setAudioActionFeedback(null);
    loadAudioDetail(id, adminEmail);
  };

  const performAudioAction = async (action: "ACCEPTER" | "REFUSER") => {
    if (!adminEmail || !selectedAudioId) return;
    if (action === "REFUSER" && !audioActionJustification.trim()) {
      setAudioActionFeedback("Merci de préciser une justification.");
      return;
    }

    try {
      setAudioActionLoading(true);
      setAudioActionFeedback(null);
      const res = await fetch(apiUrl(`${API_ADMIN_AUDIO_REQUESTS}${selectedAudioId}/`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": adminEmail,
        },
        body: JSON.stringify({
          action,
          justification: action === "REFUSER" ? audioActionJustification : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Action impossible.");
      }

      setAudioActionFeedback(
        action === "ACCEPTER"
          ? "Demande audio acceptée."
          : "Demande audio refusée."
      );
      setAudioActionJustification("");
      await loadAudioList(adminEmail, audioFilter);
      await loadAudioDetail(selectedAudioId, adminEmail);
    } catch (e: any) {
      setAudioActionFeedback(e?.message ?? "Erreur inattendue.");
    } finally {
      setAudioActionLoading(false);
    }
  };

  const handleSelectMod = (id: number) => {
    if (!adminEmail) return;
    setModOriginalChant(null);
    setModOriginalError(null);
    setModOriginalLoading(false);
    const preview = modRequests.find((req) => req.id === id) ?? null;
    setSelectedMod(preview);
    setSelectedModId(id);
    setModActionFeedback(null);
    loadModDetail(id, adminEmail);
  };

  const performModAction = async (action: "ACCEPTER" | "REFUSER") => {
    if (!adminEmail || !selectedModId) return;
    if (action === "REFUSER" && !modActionJustification.trim()) {
      setModActionFeedback("Merci de préciser une justification.");
      return;
    }

    try {
      setModActionLoading(true);
      setModActionFeedback(null);
      const res = await fetch(apiUrl(`${API_ADMIN_MOD_REQUESTS}${selectedModId}/`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": adminEmail,
        },
        body: JSON.stringify({
          action,
          justification: action === "REFUSER" ? modActionJustification : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Action impossible.");
      }

      setModActionFeedback(
        action === "ACCEPTER"
          ? "Demande de modification acceptée."
          : "Demande de modification refusée."
      );
      setModActionJustification("");
      await loadModList(adminEmail, modFilter);
      await loadModDetail(selectedModId, adminEmail);
    } catch (e: any) {
      setModActionFeedback(e?.message ?? "Erreur inattendue.");
    } finally {
      setModActionLoading(false);
    }
  };

  if (!adminEmail) {
    return (
      <div className="px-6 py-10">
        <p className="text-gray-600">Connecte-toi avec un compte admin pour voir les demandes.</p>
      </div>
    );
  }

  const formatFieldValue = (value?: string, fallback = "—") =>
    value && value.trim() ? value : fallback;

  const formatCategoriesLabel = (list?: string[]) =>
    list && list.length ? list.join(", ") : "Aucune catégorie";

  const modComparisonRows: ComparisonRow[] =
    selectedMod && modOriginalChant
      ? [
          {
            label: "Nom du chant",
            original: formatFieldValue(modOriginalChant.nom_chant),
            proposed: formatFieldValue(selectedMod.nom_chant),
          },
          {
            label: "Auteur",
            original: formatFieldValue(modOriginalChant.auteur, "Non renseigné"),
            proposed: formatFieldValue(selectedMod.auteur, "Non renseigné"),
          },
          {
            label: "Ville d'origine",
            original: formatFieldValue(modOriginalChant.ville_origine, "Non renseignée"),
            proposed: formatFieldValue(selectedMod.ville_origine, "Non renseignée"),
          },
          {
            label: "Catégories",
            original: formatCategoriesLabel(modOriginalChant.categories),
            proposed: formatCategoriesLabel(selectedMod.categories),
          },
          {
            label: "Paroles",
            original: formatFieldValue(modOriginalChant.paroles, "Aucun texte"),
            proposed: formatFieldValue(selectedMod.paroles, "Aucun texte"),
            multiline: true,
          },
          {
            label: "Description",
            original: formatFieldValue(modOriginalChant.description, "Aucune description"),
            proposed: formatFieldValue(selectedMod.description, "Aucune description"),
            multiline: true,
          },
        ]
      : [];

  const modAttachmentComparisons: AttachmentComparison[] =
    selectedMod && modOriginalChant
      ? [
          {
            label: "Illustration",
            originalUrl: modOriginalChant.illustration_chant_url,
            proposedUrl: selectedMod.illustration_chant_url,
          },
          {
            label: "Paroles (PDF)",
            originalUrl: modOriginalChant.paroles_pdf_url,
            proposedUrl: selectedMod.paroles_pdf_url,
          },
          {
            label: "Partition",
            originalUrl: modOriginalChant.partition_url,
            proposedUrl: selectedMod.partition_url,
          },
        ]
      : [];

  return (
    <section className="w-full max-w-6xl mx-auto flex flex-col gap-12">
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-bordeau">Demandes de chants</h1>
            <p className="text-sm text-gray-500">Valide ou refuse les propositions envoyées par les utilisateurs.</p>
          </div>
          <div className="flex items-center gap-2">
            {["EN_ATTENTE", "ACCEPTEE", "REFUSEE", "ALL"].map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value as any)}
                className={`btn text-sm ${
                  filter === value
                    ? "btn-solid"
                    : "btn-ghost text-gray-600"
                }`}
              >
                {value === "ALL" ? "Toutes" : statusLabel[value as ChantRequest["statut"]]}
              </button>
            ))}
          </div>
        </header>

        {error && <p className="text-red-600">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          <div className="rounded-2xl border border-bordeau/30 bg-white shadow-sm">
            <div className="border-b border-bordeau/20 px-4 py-3 text-sm font-semibold text-bordeau">
              Demandes ({requests.length})
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100">
              {loadingList && <p className="p-4 text-sm text-gray-500">Chargement…</p>}
              {!loadingList && requests.length === 0 && (
                <p className="p-4 text-sm text-gray-500">Aucune demande pour ce filtre.</p>
              )}
              {requests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => handleSelect(req.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-bordeau/5 transition ${
                    selectedId === req.id ? "bg-bordeau/10" : ""
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <p className="font-semibold text-bordeau truncate">{req.nom_chant}</p>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 border ${statusColor[req.statut]}`}
                    >
                      {statusLabel[req.statut]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {req.utilisateur?.pseudo ?? "Utilisateur"} ·{" "}
                    {new Date(req.date_creation).toLocaleDateString("fr-BE")}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-bordeau/30 bg-white shadow-sm p-5 min-h-[400px]">
            {loadingDetail && <p className="text-sm text-gray-500">Chargement du détail…</p>}
            {detailError && <p className="text-sm text-red-600">{detailError}</p>}
            {!selected && !loadingDetail && !detailError && (
              <p className="text-sm text-gray-500">Sélectionne une demande pour afficher les détails.</p>
            )}
            {selected && !loadingDetail && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold text-bordeau">{selected.nom_chant}</h2>
                  <p className="text-sm text-gray-500">
                    Proposé par {selected.utilisateur?.pseudo ?? "inconnu"} ·{" "}
                    {new Date(selected.date_creation).toLocaleString("fr-BE")}
                  </p>
                </div>

                {selected.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selected.categories.map((cat) => (
                      <span key={cat} className="px-3 py-1 rounded-full bg-bordeau/10 text-bordeau text-xs">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Auteur</p>
                    <p className="text-sm text-gray-700">
                      {selected.auteur || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Ville d'origine</p>
                    <p className="text-sm text-gray-700">
                      {selected.ville_origine || "Non renseignée"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700">Paroles</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                    {selected.paroles?.trim() ? selected.paroles : "Aucun texte fourni."}
                  </p>
                </div>

                {selected.description && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Description</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selected.description}</p>
                  </div>
                )}

                <div className="grid gap-2 text-sm">
                  {selected.illustration_chant_url && (
                    <a
                      href={selected.illustration_chant_url}
                      target="_blank"
                      className="text-blue-600 underline"
                      rel="noreferrer"
                    >
                      Voir l'illustration
                    </a>
                  )}
                  {selected.paroles_pdf_url && (
                    <a
                      href={selected.paroles_pdf_url}
                      target="_blank"
                      className="text-blue-600 underline"
                      rel="noreferrer"
                    >
                      Télécharger les paroles (PDF)
                    </a>
                  )}
                  {selected.partition_url && (
                    <a
                      href={selected.partition_url}
                      target="_blank"
                      className="text-blue-600 underline"
                      rel="noreferrer"
                    >
                      Télécharger la partition
                    </a>
                  )}
                  {selected.pistes_audio.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-gray-700">Pistes audio</p>
                      {selected.pistes_audio.map((audio) =>
                        audio.fichier_mp3 ? (
                          <a
                            key={audio.id}
                            href={audio.fichier_mp3}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            {audio.fichier_mp3.split("/").pop()}
                          </a>
                        ) : null
                      )}
                    </div>
                  )}
                </div>

                {selected.statut === "REFUSEE" && selected.justification_refus && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    Refusé : {selected.justification_refus}
                  </div>
                )}

                {selected.statut === "EN_ATTENTE" && (
                  <div className="flex flex-col gap-3 border-t border-bordeau/20 pt-4">
                    <textarea
                      value={actionJustification}
                      onChange={(e) => setActionJustification(e.target.value)}
                      placeholder="Justification (obligatoire si refus)"
                      className="border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-bordeau/40 min-h-[90px]"
                    />
                    {actionFeedback && <p className="text-sm text-red-600">{actionFeedback}</p>}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => performAction("REFUSER")}
                        disabled={actionLoading}
                        className="btn btn-danger flex-1 justify-center disabled:opacity-60"
                      >
                        Refuser
                      </button>
                      <button
                        onClick={() => performAction("ACCEPTER")}
                        disabled={actionLoading}
                        className="btn btn-solid flex-1 justify-center disabled:opacity-60"
                      >
                        Accepter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 border-t border-gray-200 pt-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-bordeau">Demandes de pistes audio</h2>
            <p className="text-sm text-gray-500">Valide les propositions de fichiers MP3 pour les chants existants.</p>
          </div>
          <div className="flex items-center gap-2">
            {["EN_ATTENTE", "ACCEPTEE", "REFUSEE", "ALL"].map((value) => (
              <button
                key={`audio-${value}`}
                onClick={() => setAudioFilter(value as any)}
                className={`btn text-sm ${
                  audioFilter === value
                    ? "btn-solid"
                    : "btn-ghost text-gray-600"
                }`}
              >
                {value === "ALL" ? "Toutes" : statusLabel[value as ChantRequest["statut"]]}
              </button>
            ))}
          </div>
        </header>

        {audioError && <p className="text-red-600">{audioError}</p>}

        <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          <div className="rounded-2xl border border-bordeau/30 bg-white shadow-sm">
            <div className="border-b border-bordeau/20 px-4 py-3 text-sm font-semibold text-bordeau">
              Demandes ({audioRequests.length})
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100">
              {audioLoadingList && <p className="p-4 text-sm text-gray-500">Chargement…</p>}
              {!audioLoadingList && audioRequests.length === 0 && (
                <p className="p-4 text-sm text-gray-500">Aucune demande pour ce filtre.</p>
              )}
              {audioRequests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => handleSelectAudio(req.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-bordeau/5 transition ${
                    selectedAudioId === req.id ? "bg-bordeau/10" : ""
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <p className="font-semibold text-bordeau truncate">{req.chant.nom_chant}</p>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 border ${statusColor[req.statut]}`}
                    >
                      {statusLabel[req.statut]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {req.utilisateur?.pseudo ?? "Utilisateur"} ·{" "}
                    {new Date(req.date_creation).toLocaleDateString("fr-BE")}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-bordeau/30 bg-white shadow-sm p-5 min-h-[360px]">
            {audioLoadingDetail && <p className="text-sm text-gray-500">Chargement du détail…</p>}
            {audioDetailError && <p className="text-sm text-red-600">{audioDetailError}</p>}
            {!selectedAudio && !audioLoadingDetail && !audioDetailError && (
              <p className="text-sm text-gray-500">Sélectionne une demande audio pour afficher les détails.</p>
            )}
            {selectedAudio && !audioLoadingDetail && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-semibold text-bordeau">
                    {selectedAudio.chant.nom_chant}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Proposé par {selectedAudio.utilisateur?.pseudo ?? "inconnu"} ·{" "}
                    {new Date(selectedAudio.date_creation).toLocaleString("fr-BE")}
                  </p>
                </div>

                <div className="text-sm">
                  {selectedAudio.fichier_mp3_url ? (
                    <a
                      href={selectedAudio.fichier_mp3_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      Télécharger le fichier MP3
                    </a>
                  ) : (
                    <p className="text-gray-500">Aucun fichier disponible.</p>
                  )}
                </div>

                {selectedAudio.statut === "REFUSEE" && selectedAudio.justification_refus && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    Refusé : {selectedAudio.justification_refus}
                  </div>
                )}

                {selectedAudio.statut === "EN_ATTENTE" && (
                  <div className="flex flex-col gap-3 border-t border-bordeau/20 pt-4">
                    <textarea
                      value={audioActionJustification}
                      onChange={(e) => setAudioActionJustification(e.target.value)}
                      placeholder="Justification (obligatoire si refus)"
                      className="border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-bordeau/40 min-h-[90px]"
                    />
                    {audioActionFeedback && (
                      <p className="text-sm text-red-600">{audioActionFeedback}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => performAudioAction("REFUSER")}
                        disabled={audioActionLoading}
                        className="btn btn-danger flex-1 justify-center disabled:opacity-60"
                      >
                        Refuser
                      </button>
                      <button
                        onClick={() => performAudioAction("ACCEPTER")}
                        disabled={audioActionLoading}
                        className="btn btn-solid flex-1 justify-center disabled:opacity-60"
                      >
                        Accepter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 border-t border-gray-200 pt-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-bordeau">Demandes de modification</h2>
            <p className="text-sm text-gray-500">
              Valide les propositions de mise à jour des informations du chant.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {["EN_ATTENTE", "ACCEPTEE", "REFUSEE", "ALL"].map((value) => (
              <button
                key={`mod-${value}`}
                onClick={() => setModFilter(value as any)}
                className={`btn text-sm ${
                  modFilter === value
                    ? "btn-solid"
                    : "btn-ghost text-gray-600"
                }`}
              >
                {value === "ALL" ? "Toutes" : statusLabel[value as ChantRequest["statut"]]}
              </button>
            ))}
          </div>
        </header>

        {modError && <p className="text-red-600">{modError}</p>}

        <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          <div className="rounded-2xl border border-bordeau/30 bg-white shadow-sm">
            <div className="border-b border-bordeau/20 px-4 py-3 text-sm font-semibold text-bordeau">
              Demandes ({modRequests.length})
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100">
              {modLoadingList && <p className="p-4 text-sm text-gray-500">Chargement…</p>}
              {!modLoadingList && modRequests.length === 0 && (
                <p className="p-4 text-sm text-gray-500">Aucune demande pour ce filtre.</p>
              )}
              {modRequests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => handleSelectMod(req.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-bordeau/5 transition ${
                    selectedModId === req.id ? "bg-bordeau/10" : ""
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <p className="font-semibold text-bordeau truncate">{req.chant_nom}</p>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 border ${statusColor[req.statut]}`}
                    >
                      {statusLabel[req.statut]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {req.utilisateur?.pseudo ?? "Utilisateur"} ·{" "}
                    {new Date(req.date_creation).toLocaleDateString("fr-BE")}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-bordeau/30 bg-white shadow-sm p-5 min-h-[360px]">
            {modLoadingDetail && <p className="text-sm text-gray-500">Chargement du détail…</p>}
            {modDetailError && <p className="text-sm text-red-600">{modDetailError}</p>}
            {!selectedMod && !modLoadingDetail && !modDetailError && (
              <p className="text-sm text-gray-500">Sélectionne une demande de modification pour afficher les détails.</p>
            )}
            {selectedMod && !modLoadingDetail && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-semibold text-bordeau">{selectedMod.nom_chant}</h3>
                  <p className="text-sm text-gray-500">
                    Chant d'origine : {selectedMod.chant_nom} ·{" "}
                    {new Date(selectedMod.date_creation).toLocaleString("fr-BE")}
                  </p>
                </div>

                {selectedMod.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedMod.categories.map((cat) => (
                      <span key={cat} className="px-3 py-1 rounded-full bg-bordeau/10 text-bordeau text-xs">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Auteur</p>
                    <p className="text-sm text-gray-700">
                      {selectedMod.auteur || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Ville d'origine</p>
                    <p className="text-sm text-gray-700">
                      {selectedMod.ville_origine || "Non renseignée"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700">Paroles</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                    {selectedMod.paroles?.trim() ? selectedMod.paroles : "Aucun texte fourni."}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700">Description</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedMod.description?.trim() ? selectedMod.description : "Aucune description fournie."}
                  </p>
                </div>

                <div className="grid gap-2 text-sm">
                  {selectedMod.illustration_chant_url ? (
                    <a
                      href={selectedMod.illustration_chant_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      Voir l'illustration
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune illustration fournie.</p>
                  )}
                  {selectedMod.paroles_pdf_url ? (
                    <a
                      href={selectedMod.paroles_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      Télécharger les paroles (PDF)
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">Pas de fichier PDF fourni.</p>
                  )}
                  {selectedMod.partition_url ? (
                    <a
                      href={selectedMod.partition_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      Télécharger la partition
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">Pas de partition fournie.</p>
                  )}
                </div>

                <div className="border-t border-bordeau/20 pt-4 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-gray-700">Comparaison avec le chant existant</p>
                    <p className="text-xs text-gray-500">
                      Les champs modifiés sont encadrés.
                    </p>
                  </div>
                  {modOriginalLoading && (
                    <p className="text-sm text-gray-500">Chargement du chant original…</p>
                  )}
                  {modOriginalError && <p className="text-sm text-red-600">{modOriginalError}</p>}
                  {modOriginalChant && (
                    <div className="space-y-3">
                      {modComparisonRows.map((row) => {
                        const changed = row.original !== row.proposed;
                        return (
                          <div
                            key={row.label}
                            className={`grid gap-2 md:grid-cols-2 rounded-xl border p-3 ${
                              changed
                                ? "border-bordeau/30 bg-bordeau/10"
                                : "border-gray-200 bg-gray-50"
                            }`}
                          >
                            <div>
                              <p className="text-xs uppercase text-gray-500">Actuel</p>
                              <p className={`text-sm ${row.multiline ? "whitespace-pre-wrap" : ""}`}>
                                {row.original}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-gray-500">Proposé</p>
                              <p className={`text-sm ${row.multiline ? "whitespace-pre-wrap" : ""}`}>
                                {row.proposed}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div className="space-y-3">
                        {modAttachmentComparisons.map((attach) => {
                          const changed = attach.originalUrl !== attach.proposedUrl;
                          return (
                            <div
                              key={attach.label}
                              className={`grid gap-2 md:grid-cols-2 rounded-xl border p-3 ${
                                changed
                                  ? "border-bordeau/30 bg-bordeau/5"
                                  : "border-gray-200 bg-gray-50"
                              }`}
                            >
                              <div>
                                <p className="text-xs uppercase text-gray-500">Actuel · {attach.label}</p>
                                {attach.originalUrl ? (
                                  <a
                                    href={attach.originalUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    Ouvrir le fichier
                                  </a>
                                ) : (
                                  <p className="text-sm text-gray-500">Aucun fichier</p>
                                )}
                              </div>
                              <div>
                                <p className="text-xs uppercase text-gray-500">Proposé · {attach.label}</p>
                                {attach.proposedUrl ? (
                                  <a
                                    href={attach.proposedUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    Ouvrir le fichier
                                  </a>
                                ) : (
                                  <p className="text-sm text-gray-500">Aucun fichier</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {!modOriginalChant && !modOriginalLoading && !modOriginalError && (
                    <p className="text-sm text-gray-500">
                      Impossible d'afficher les informations originales pour comparer.
                    </p>
                  )}
                </div>

                {selectedMod.statut === "REFUSEE" && selectedMod.justification_refus && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    Refusé : {selectedMod.justification_refus}
                  </div>
                )}

                {selectedMod.statut === "EN_ATTENTE" && (
                  <div className="flex flex-col gap-3 border-t border-bordeau/20 pt-4">
                    <textarea
                      value={modActionJustification}
                      onChange={(e) => setModActionJustification(e.target.value)}
                      placeholder="Justification (obligatoire si refus)"
                      className="border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-bordeau/40 min-h-[90px]"
                    />
                    {modActionFeedback && <p className="text-sm text-red-600">{modActionFeedback}</p>}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => performModAction("REFUSER")}
                        disabled={modActionLoading}
                        className="btn btn-danger flex-1 justify-center disabled:opacity-60"
                      >
                        Refuser
                      </button>
                      <button
                        onClick={() => performModAction("ACCEPTER")}
                        disabled={modActionLoading}
                        className="btn btn-solid flex-1 justify-center disabled:opacity-60"
                      >
                        Accepter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
