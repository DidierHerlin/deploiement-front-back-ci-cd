output "instance_id" {
  value       = aws_instance.main.id
  description = "ID de l'instance EC2"
}

output "public_ip" {
  value       = aws_instance.main.public_ip
  description = "IP publique de l'instance EC2"
}

output "public_dns" {
  value       = aws_instance.main.public_dns
  description = "DNS public de l'instance EC2"
}

output "ssh_connect" {
  value       = "ssh -i <votre-cle>.pem ubuntu@${aws_instance.main.public_ip}"
  description = "Commande de connexion SSH"
}
