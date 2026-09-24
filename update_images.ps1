Write-Host "Recherche et téléchargement des nouvelles images depuis Docker Hub..." -ForegroundColor Cyan

# Remplacez ces noms par les noms exacts de vos images sur Docker Hub
$IMAGES = @(
    "didierherlin18/immobilier-drf:latest",
    "didierherlin18/login-page-immobilier:latest"
)

foreach ($img in $IMAGES) {
    Write-Host "Mise à jour de l'image: $img"
    docker pull $img
}

Write-Host "Mise à jour terminée. Vous pouvez redémarrer vos conteneurs pour appliquer les changements." -ForegroundColor Green
