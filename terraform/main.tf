terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Projet      = "Gestion-immo-devops"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  ingress_rules = [
    { port = 22,   description = "SSH" },
    { port = 80,   description = "HTTP" },
    { port = 443,  description = "HTTPS" },
    { port = 3000, description = "Frontend Next.js" },
    { port = 3001, description = "Grafana" },
    { port = 8000, description = "Backend Django" },
  ]
}

resource "aws_security_group" "main" {
  name        = "gestion-immo-sg"
  description = "Security group Gestion Immo"

  dynamic "ingress" {
    for_each = local.ingress_rules
    content {
      description = ingress.value.description
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "gestion-immo-sg" }

  lifecycle { create_before_destroy = true }
}

resource "aws_instance" "main" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_pair_name != "" ? var.key_pair_name : null

  vpc_security_group_ids = [aws_security_group.main.id]

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.disk_size_gb
    delete_on_termination = true
    tags                  = { Name = "gestion-immo-disk" }
  }

  tags = { Name = "Gestion-immo-devops" }
}
