# Déclaration de la ressource RDS existante pour l'import
resource "aws_db_instance" "postgres" {
  identifier             = var.db_identifier

  engine                 = "postgres"
  instance_class         = "db.t4g.micro" 
  allocated_storage      = 20
  
  # On attache le nouveau groupe de sécurité qui autorise l'EC2
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  
  skip_final_snapshot    = true
  lifecycle {
    ignore_changes = [
      engine,
      engine_version,
      instance_class,
      allocated_storage,
      db_name,
      username,
      password,
      availability_zone
    ]
  }
}
