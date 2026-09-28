variable "aws_region" {
  description = "Région AWS"
  type        = string
  default     = "eu-north-1"
}

variable "db_identifier" {
  description = "Identifiant de la base RDS existante"
  type        = string
  default     = "database-gestion-immobilier"
}

variable "db_password" {
  description = "Mot de passe de la base de données RDS"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ec2_instance_type" {
  description = "Type d'instance EC2"
  type        = string
  default     = "t3.micro"
}


variable "ec2_ami_id" {
  description = "ID de l'AMI pour l'instance EC2"
  type        = string
  default     = "ami-0aba19e56f3eaec05"
}


variable "aws_access_key" {
  description = "Clé d'accès de l'utilisateur IAM"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "Clé secrète de l'utilisateur IAM"
  type        = string
  sensitive   = true
}
