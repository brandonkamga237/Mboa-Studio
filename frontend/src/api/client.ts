import axios from 'axios';
import toast from 'react-hot-toast';
import type {
  Brouillon,
  BrouillonSummary,
  Chant,
  Commentaire,
  Etape,
  Presence,
  PresenceStat,
  StatutPresence,
  User,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const detail = err.response?.data?.detail;
    let msg: string;

    if (typeof detail === 'string') {
      msg = detail;
    } else if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      const raw = typeof first === 'string' ? first : (first?.msg ?? 'Données invalides.');
      msg = String(raw).replace(/^Value error,\s*/i, '');
    } else if (status === 401) {
      msg = 'Session expirée, veuillez vous reconnecter.';
      localStorage.removeItem('mc_token');
      setTimeout(() => { window.location.replace('/connexion'); }, 1200);
    } else if (!err.response) {
      msg = 'Impossible de joindre le serveur. Vérifiez votre connexion.';
    } else {
      msg = 'Une erreur est survenue.';
    }

    toast.error(msg);
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const login = (email: string, mot_de_passe: string) =>
  api.post<{ access_token: string }>('/auth/connexion', { email, mot_de_passe }).then((r) => r.data);

export const setup = (nom: string, email: string, mot_de_passe: string) =>
  api.post<{ access_token: string }>('/auth/initialisation', { nom, email, mot_de_passe }).then((r) => r.data);

export const getMe = () =>
  api.get<User>('/auth/moi').then((r) => r.data);

// ── Utilisateurs ─────────────────────────────────────────────
export const getUtilisateurs = () =>
  api.get<User[]>('/utilisateurs/').then((r) => r.data);

export const createUtilisateur = (data: { nom: string; email: string; mot_de_passe: string; role: string }) =>
  api.post<User>('/utilisateurs/', data).then((r) => r.data);

export const updateUtilisateur = (id: number, data: { nom?: string; role?: string; mot_de_passe?: string }) =>
  api.put<User>(`/utilisateurs/${id}`, data).then((r) => r.data);

export const deleteUtilisateur = (id: number) =>
  api.delete(`/utilisateurs/${id}`);

// ── Brouillons ───────────────────────────────────────────────
export const getBrouillons = (params?: { date_dimanche?: string; statut?: string; auteur_id?: number }) =>
  api.get<BrouillonSummary[]>('/brouillons/', { params }).then((r) => r.data);

export const getBrouillon = (id: number) =>
  api.get<Brouillon>(`/brouillons/${id}`).then((r) => r.data);

export const createBrouillon = (data: { date_dimanche: string; liturgie?: string; lecon?: string; divers?: string }) =>
  api.post<Brouillon>('/brouillons/', data).then((r) => r.data);

export const updateBrouillon = (id: number, data: { liturgie?: string; lecon?: string; divers?: string }) =>
  api.put<Brouillon>(`/brouillons/${id}`, data).then((r) => r.data);

export const deleteBrouillon = (id: number) =>
  api.delete(`/brouillons/${id}`);

export const soumettreCandidat = (id: number) =>
  api.post<Brouillon>(`/brouillons/${id}/soumettre`).then((r) => r.data);

export const validerOfficiel = (id: number) =>
  api.post<Brouillon>(`/brouillons/${id}/valider`).then((r) => r.data);

export const renvoyerRevision = (id: number, motif: string) =>
  api.post<Brouillon>(`/brouillons/${id}/renvoyer`, { motif }).then((r) => r.data);

export const dupliquerBrouillon = (source_id: number, date_dimanche: string) =>
  api.post<Brouillon>('/brouillons/dupliquer', { source_id, date_dimanche }).then((r) => r.data);

export const getHistorique = (q?: string) =>
  api.get<BrouillonSummary[]>('/brouillons/historique/officiel', { params: { q } }).then((r) => r.data);

export const setVisibilite = (id: number, visible: boolean) =>
  api.post<Brouillon>(`/brouillons/${id}/visibilite`, { visible }).then((r) => r.data);

// ── Chants ───────────────────────────────────────────────────
export const getChants = (brouillonId: number) =>
  api.get<Chant[]>(`/brouillons/${brouillonId}/chants/`).then((r) => r.data);

export const addChant = (brouillonId: number, data: { titre: string; etape: Etape; ordre?: number }) =>
  api.post<Chant>(`/brouillons/${brouillonId}/chants/`, data).then((r) => r.data);

export const updateChant = (brouillonId: number, chantId: number, data: { titre?: string; etape?: Etape; ordre?: number }) =>
  api.put<Chant>(`/brouillons/${brouillonId}/chants/${chantId}`, data).then((r) => r.data);

export const deleteChant = (brouillonId: number, chantId: number) =>
  api.delete(`/brouillons/${brouillonId}/chants/${chantId}`);

export const reorderChants = (brouillonId: number, ids: number[]) =>
  api.put<Chant[]>(`/brouillons/${brouillonId}/chants/reorder`, { ids }).then((r) => r.data);

// ── Commentaires ─────────────────────────────────────────────
export const getCommentaires = (brouillonId: number) =>
  api.get<Commentaire[]>(`/brouillons/${brouillonId}/commentaires/`).then((r) => r.data);

export const addCommentaire = (brouillonId: number, data: {
  contenu: string;
  cible_type: string;
  cible_id: number;
  parent_id?: number;
}) =>
  api.post<Commentaire>(`/brouillons/${brouillonId}/commentaires/`, data).then((r) => r.data);

// ── Présence ─────────────────────────────────────────────────
export const getPresence = (date_samedi: string) =>
  api.get<Presence[]>(`/presence/${date_samedi}`).then((r) => r.data);

export const savePresence = (date_samedi: string, presences: { user_id: number; statut: StatutPresence }[]) =>
  api.put<Presence[]>('/presence/', { date_samedi, presences }).then((r) => r.data);

export const getPresenceDates = () =>
  api.get<string[]>('/presence/historique/dates').then((r) => r.data);

export const getStatsParticipation = (params?: { mois?: number; annee?: number }) =>
  api.get<PresenceStat[]>('/presence/stats/participation', { params }).then((r) => r.data);

// ── PDF ──────────────────────────────────────────────────────
export const getPdfUrl = (brouillonId: number) =>
  `/api/brouillons/${brouillonId}/pdf`;
