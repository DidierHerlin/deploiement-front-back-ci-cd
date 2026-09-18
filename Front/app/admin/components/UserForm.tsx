import { UserRound, LockKeyhole, X } from 'lucide-react'
import { UserProfil } from '@/lib/api'

type UserFormProps = {
  editingUser: UserProfil | null
  newUser: any
  setNewUser: (user: any) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function UserForm({ editingUser, newUser, setNewUser, onClose, onSubmit }: UserFormProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal-close" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        <div className="modal-icon"><UserRound size={20} /></div>
        <h2 id="modal-title">{editingUser ? 'Modifier l’utilisateur' : 'Créer un utilisateur'}</h2>
        <p>{editingUser ? 'Mettez à jour les informations du compte.' : 'Un seul rôle actif pourra être attribué à ce compte.'}</p>
        
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ flex: 1 }}>Nom
              <input required value={newUser.nom} onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })} placeholder="Ex. Dupont" />
            </label>
            <label style={{ flex: 1 }}>Prénoms
              <input required value={newUser.prenoms} onChange={(e) => setNewUser({ ...newUser, prenoms: e.target.value })} placeholder="Ex. Jeanne" />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ flex: 1 }}>Adresse email
              <input required type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="jeanne@email.fr" />
            </label>
            <label style={{ flex: 1 }}>Téléphone
              <input type="text" value={newUser.telephone} onChange={(e) => setNewUser({ ...newUser, telephone: e.target.value })} placeholder="034 00 000 00" />
            </label>
          </div>
          <label>Rôle
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
              <option>Admin</option>
              <option>Agent</option>
              <option>Propriétaire</option>
              <option>Locataire</option>
            </select>
          </label>
          <label>Mot de passe {editingUser && <span style={{fontWeight:'normal', fontSize:'10px'}}>(Laisser vide pour ne pas modifier)</span>}
            <input type={editingUser ? "password" : "text"} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder={editingUser ? "********" : "Créer un mot de passe"} />
          </label>
          
          {!editingUser && (
            <div className="password-note">
              <LockKeyhole size={15} />
              <span>Le mot de passe sera haché. Il doit contenir au moins 8 caractères, une majuscule et un chiffre.</span>
            </div>
          )}
          
          <div className="modal-actions">
            <button type="button" className="outline-button" onClick={onClose}>Annuler</button>
            <button className="primary-button" type="submit">{editingUser ? 'Enregistrer' : 'Créer le compte'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
