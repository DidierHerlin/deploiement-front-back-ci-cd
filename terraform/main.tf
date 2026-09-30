terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}


variable "aws_region" {
  description = "Region AWS (doit correspondre a la region de l'AMI)"
  type        = string
  default     = "eu-north-1"
}

variable "key_pair_name" {
  description = "Nom de la cle SSH existante dans AWS (Key Pair). Laisser vide pour omettre."
  type        = string
  default     = ""
}


resource "aws_security_group" "gestion_immo_sg" {
  name        = "gestion-immo-sg"
  description = "Security group for Gestion Immobilier instance"


  ingress {
    description = "SSH - administration distante"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP - acces web non chiffre"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS - acces web chiffre"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "API Backend Django (Gunicorn)"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Frontend Next.js (dev / prod)"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }


  egress {
    description = "Tout le trafic sortant autorise"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name   = "gestion-immo-sg"
    Projet = "Gestion-immo-devops"
  }
}


resource "aws_instance" "gestion_immo" {
  ami           = "ami-0aba19e56f3eaec05" 
  instance_type = "t3.small"
  key_name = var.key_pair_name != "" ? var.key_pair_name : null

  vpc_security_group_ids = [aws_security_group.gestion_immo_sg.id]

  root_block_device {
    volume_type           = "gp3" 
    volume_size           = 25    
    delete_on_termination = true  

    tags = {
      Name   = "gestion-immo-disk"
      Projet = "Gestion-immo-devops"
    }
  }

  tags = {
    Name        = "Gestion-immo-devops"
    Projet      = "Gestion-immo-devops"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}


output "instance_id" {
  description = "Identifiant unique de l'instance EC2"
  value       = aws_instance.gestion_immo.id
}

output "instance_ip_public" {
  description = "Adresse IP publique de l'instance (change a chaque redemarrage)"
  value       = aws_instance.gestion_immo.public_ip
}

output "instance_dns_public" {
  description = "Nom DNS public de l'instance"
  value       = aws_instance.gestion_immo.public_dns
}

output "ssh_connect" {
  description = "Commande SSH prete a copier-coller"
  value       = "ssh -i <votre-cle>.pem ubuntu@${aws_instance.gestion_immo.public_ip}"
}
