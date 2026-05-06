import { useEffect, useState } from 'react';
import { getUtilisateurs, createUtilisateur, updateUtilisateur, deleteUtilisateur } from '../api/client';
import { useAuthStore } from '../store/auth';
import { Spinner } from '../components/ui/Spinner';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { User, Role } from '../types';
import toast from 'react-hot-toast';

const ROLES: { value: Role; label: string }[] = [
  { value: 'moniteur',    label: 'Moniteur' },
  { value: 'responsable', label: 'Responsable' },
  { value: 'admin',       label: 'Administrateur' },
];

const ROLE_LABELS: Record<Role, string> = {
  moniteur:    'Moniteur',
  responsable: 'Responsable',
  admin:       'Administrateur',
};

const ROLE_COLORS: Record<Role, string> = {
  moniteur:    '#6B7280',
  responsable: '#2B4C7E',
  admin:       '#C9952A',
};

export default function AdminPage() {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', mot_de_passe: '', role: 'moniteur' as Role });
  const [creating, setCreating] = useState(false);
  const [userASupprimer, setUserASupprimer] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [roleConfirm, setRoleConfirm] = useState<{ user: User; newRole: Role } | null>(null);
  const [changingRole, setChangingRole] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getUtilisateurs();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createUtilisateur(form);
      toast.success(`${form.nom} a été ajouté.`);
      setForm({ nom: '', email: '', mot_de_passe: '', role: 'moniteur' });
      setShowForm(false);
      load();
    } catch {} finally {
      setCreating(false);
    }
  };

  const confirmRoleChange = async () => {
    if (!roleConfirm) return;
    setChangingRole(true);
    try {
      await updateUtilisateur(roleConfirm.user.id, { role: roleConfirm.newRole });
      toast.success(`Rôle de ${roleConfirm.user.nom} mis à jour.`);
      setRoleConfirm(null);
      load();
    } catch {} finally {
      setChangingRole(false);
    }
  };

  const handleDelete = async () => {
    if (!userASupprimer) return;
    setDeleting(true);
    try {
      await deleteUtilisateur(userASupprimer.id);
      toast.success(`${userASupprimer.nom} a été supprimé.`);
      setUserASupprimer(null);
      load();
    } catch {} finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 600, color: 'var(--fg-primary)', margin: 0 }}>
            Administration
          </h1>
          <p style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 4 }}>
            Gestion des moniteurs et des rôles
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Annuler' : '+ Ajouter un moniteur'}
        </button>
      </div>

      {/* Formulaire ajout — colonnes flexibles (1 col sur mobile, 2 sur desktop) */}
      {showForm && (
        <div className="card card-left-gold" style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 16 }}>
            Nouveau moniteur
          </h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)', display: 'block', marginBottom: 4 }}>Nom</label>
                <input
                  className="field"
                  type="text"
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  required
                  placeholder="Prénom Nom"
                />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)', display: 'block', marginBottom: 4 }}>Email</label>
                <input
                  className="field"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)', display: 'block', marginBottom: 4 }}>Mot de passe</label>
                <input
                  className="field"
                  type="password"
                  value={form.mot_de_passe}
                  onChange={e => setForm(f => ({ ...f, mot_de_passe: e.target.value }))}
                  required
                  placeholder="6 caractères minimum"
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)', display: 'block', marginBottom: 4 }}>Rôle</label>
                <select
                  className="field"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" type="submit" disabled={creating}>
                {creating ? <Spinner size={14} /> : 'Créer le compte'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spinner size={32} />
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--fg-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Nom</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--fg-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--fg-secondary)', fontSize: 11, textTransform: 'uppercase' }}>Rôle</th>
                  <th style={{ width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-page)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--fg-primary)' }}>
                      {u.nom}
                      {u.id === me?.id && (
                        <span style={{ fontSize: 10, marginLeft: 6, color: 'var(--fg-muted)' }}>(vous)</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--fg-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {u.id === me?.id ? (
                        <span style={{ fontSize: 12, color: ROLE_COLORS[u.role], fontWeight: 600 }}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      ) : (
                        <select
                          className="field"
                          style={{ padding: '3px 8px', fontSize: 12, width: 'auto' }}
                          value={u.role}
                          onChange={e => setRoleConfirm({ user: u, newRole: e.target.value as Role })}
                        >
                          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      )}
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      {u.id !== me?.id && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#DC2626', fontSize: 11 }}
                          onClick={() => setUserASupprimer(u)}
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation changement de rôle */}
      {roleConfirm && (
        <ConfirmModal
          title="Modifier le rôle"
          message={
            <>
              Changer le rôle de <strong>{roleConfirm.user.nom}</strong> vers{' '}
              <strong style={{ color: ROLE_COLORS[roleConfirm.newRole] }}>
                {ROLE_LABELS[roleConfirm.newRole]}
              </strong> ?
            </>
          }
          confirmLabel="Confirmer le changement"
          variant="primary"
          loading={changingRole}
          onConfirm={confirmRoleChange}
          onCancel={() => setRoleConfirm(null)}
        />
      )}

      {/* Confirmation suppression */}
      {userASupprimer && (
        <ConfirmModal
          title="Supprimer ce compte"
          message={<>Le compte de <strong>{userASupprimer.nom}</strong> sera définitivement supprimé. Cette action est irréversible.</>}
          confirmLabel="Supprimer le compte"
          variant="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setUserASupprimer(null)}
        />
      )}
    </div>
  );
}
