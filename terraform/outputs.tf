output "ec2_public_ip" {
  description = "Adresse IP publique de l'instance EC2"
  value       = aws_instance.app_server.public_ip
}

output "rds_endpoint" {
  description = "Endpoint de la base de données RDS (pour la connexion depuis l'EC2)"
  value       = aws_db_instance.postgres.endpoint
}
