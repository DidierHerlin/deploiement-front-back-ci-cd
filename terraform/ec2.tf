# Instance EC2 pour l'application utilisant l'AMI spécifiée par l'utilisateur
resource "aws_instance" "app_server" {
  ami                    = var.ec2_ami_id
  instance_type          = var.ec2_instance_type
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  tags = {
    Name = "GestionImmobilierApp"
  }
}
