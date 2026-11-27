variable "aws_region" {
  description = "Région AWS"
  type        = string
  default     = "eu-north-1"
}

variable "environment" {
  description = "Environnement (dev / staging / prod)"
  type        = string
  default     = "dev"
}

variable "ami_id" {
  description = "ID de l'AMI Ubuntu"
  type        = string
  default     = "ami-0aba19e56f3eaec05"
}

variable "instance_type" {
  description = "Type d'instance EC2"
  type        = string
  default     = "t3.small"
}

variable "disk_size_gb" {
  description = "Taille du disque racine (Go)"
  type        = number
  default     = 25
}

variable "key_pair_name" {
  description = "Nom de la clé SSH dans AWS (laisser vide pour ignorer)"
  type        = string
  default     = ""
}
