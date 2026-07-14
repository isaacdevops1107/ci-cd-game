provider "aws" {
  region = "ap-south-1"
}
data "aws_vpc" "default" {
  default = true
}

resource "aws_instance" "game_server" {
  ami           = "ami-01a00762f46d584a1" 
  instance_type = "t3.small"
  key_name      = "ubuntu"

  vpc_security_group_ids = [aws_security_group.gamesathev2.id]

  user_data = <<-EOF
              #!/bin/bash
              apt update -y
              apt install nginx -y
              systemctl start nginx
              systemctl enable nginx
              EOF

  tags = {
    Name = "Game-Server"
  }
}

resource "aws_security_group" "gamesathev2" {
  name = "gamesathev2"
 vpc_id = data.aws_vpc.default.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
output "public_ip" {
  value = aws_instance.game_server.public_ip
}
