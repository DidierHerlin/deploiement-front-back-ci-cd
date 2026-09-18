export default function DashboardPage() {
  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">MON ESPACE · VUE D’ENSEMBLE</p>
          <h1>Bienvenue sur <span>votre Dashboard.</span></h1>
          <p className="subtitle">Consultez vos données et gérez vos activités.</p>
        </div>
      </div>
      
      <div className="admin-banner" style={{ marginBottom: '18px' }}>
        <div>
          <strong>Informations</strong>
          <p>Voici votre nouvel espace de bord adapté au style de l'interface administrateur.</p>
        </div>
      </div>
    </>
  )
}
