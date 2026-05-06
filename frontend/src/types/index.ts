export type Role = 'moniteur' | 'responsable' | 'admin';

export type StatutBrouillon = 'cree' | 'en_revision' | 'candidat_final' | 'officiel' | 'archive';

export type Etape =
  | 'salutation'
  | 'adoration'
  | 'priere_repentance'
  | 'parole_de_grace'
  | 'loi'
  | 'lecon'
  | 'confession_de_foi'
  | 'offrande_1'
  | 'offrande_2'
  | 'sortie';

export type CibleType =
  | 'brouillon_chant'
  | 'brouillon_bloc_chants'
  | 'brouillon_bloc_liturgie'
  | 'brouillon_bloc_lecon'
  | 'brouillon_bloc_divers';

export type StatutPresence = 'present' | 'absent' | 'excuse';

export interface User {
  id: number;
  nom: string;
  email: string;
  role: Role;
  cree_le: string;
}

export interface Chant {
  id: number;
  brouillon_id: number;
  ordre: number;
  titre: string;
  etape: Etape;
}

export interface BrouillonSummary {
  id: number;
  date_dimanche: string;
  auteur: User;
  modifie_le: string;
  statut: StatutBrouillon;
  visible: boolean;
  nb_chants: number;
  nb_commentaires: number;
  apercu_lecon: string;
}

export interface Brouillon extends BrouillonSummary {
  cree_le: string;
  liturgie: string;
  lecon: string;
  divers: string;
  validateur: User | null;
  valide_le: string | null;
  motif_revision: string | null;
  chants: Chant[];
  nb_commentaires: number;
}

export interface PresenceStat {
  user: User;
  nb_present: number;
  nb_absent: number;
  nb_excuse: number;
  nb_total: number;
  taux: number;
}

export interface Commentaire {
  id: number;
  auteur: User;
  cree_le: string;
  contenu: string;
  cible_type: CibleType;
  cible_id: number;
  brouillon_id: number;
  parent_id: number | null;
  resolu: boolean;
  reponses: Commentaire[];
}

export interface Presence {
  id: number;
  date_samedi: string;
  user: User;
  statut: StatutPresence;
  saisi_par_user: User;
  saisi_le: string;
}

export const ETAPES_LABELS: Record<Etape, string> = {
  salutation: 'Salutation',
  adoration: 'Adoration',
  priere_repentance: 'Prière de repentance',
  parole_de_grace: 'Parole de grâce',
  loi: 'Loi',
  lecon: 'Leçon',
  confession_de_foi: 'Confession de foi',
  offrande_1: 'Offrande 1',
  offrande_2: 'Offrande 2',
  sortie: 'Sortie',
};

export const STATUT_LABELS: Record<StatutBrouillon, string> = {
  cree: 'Brouillon',
  en_revision: 'En révision',
  candidat_final: 'En attente',
  officiel: 'Validé',
  archive: 'Archivé',
};
