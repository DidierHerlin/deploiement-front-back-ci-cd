# Récupération du VPC par défaut (où se trouve probablement votre RDS)
data "aws_vpc" "default" {
  default = true
}
# Groupe de sécurité pour l'instance EC2
resource "aws_security_group" "ec2_sg" {
  name        = "ec2-app-sg"
  description = "Autorise le trafic HTTP, HTTPS et SSH vers EC2"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # A restreindre idéalement à votre IP
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ec2-app-sg"
  }
}

# Groupe de sécurité pour la base RDS
resource "aws_security_group" "rds_sg" {
  name        = "rds-postgres-sg"
  description = "Autorise acces PostgreSQL depuis EC2"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "PostgreSQL depuis EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "rds-postgres-sg"
  }
}
