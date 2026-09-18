import { ShieldCheck, CheckCircle2, LockKeyhole, ArrowUpRight } from 'lucide-react'

export function SecurityRules() {
  return (
    <aside className="panel security-panel">
      <div className="panel-header">
        <div>
          <h2>Règles d’accès</h2>
          <p>Contrôles RG-01 à RG-04</p>
        </div>
        <ShieldCheck size={21} className="security-check" />
      </div>
      <div className="rule-list">
        <div className="rule">
          <CheckCircle2 size={17} />
          <div>
            <strong>Un seul rôle actif</strong>
            <p>Chaque utilisateur possède un rôle unique parmi Admin, Agent, Propriétaire ou Locataire.</p>
          </div>
        </div>
        <div className="rule">
          <CheckCircle2 size={17} />
          <div>
            <strong>Mot de passe conforme</strong>
            <p>8 caractères minimum, une majuscule et un chiffre obligatoires.</p>
          </div>
        </div>
        <div className="rule">
          <LockKeyhole size={17} />
          <div>
            <strong>Données sécurisées</strong>
            <p>Les mots de passe sont hachés et jamais conservés en clair.</p>
          </div>
        </div>
        <div className="rule">
          <CheckCircle2 size={17} />
          <div>
            <strong>Historique préservé</strong>
            <p>La désactivation bloque la connexion sans supprimer les données associées.</p>
          </div>
        </div>
      </div>
      <button className="link-button">Configurer la sécurité <ArrowUpRight size={14} /></button>
    </aside>
  )
}
