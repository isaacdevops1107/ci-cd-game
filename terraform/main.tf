provider "aws" {
  region = "ap-south-1"
}

data "aws_vpc" "default" {
  default = true
}

resource "aws_security_group" "games" {
  name        = "games-v2"
  description = "Managed by Terraform"
  vpc_id      = data.aws_vpc.default.id

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

  tags = {
    Name = "games-v2"
  }
}

resource "aws_instance" "game_server" {
  ami                    = "ami-01a00762f46d584a1"
  instance_type          = "t3.small"
  key_name               = "ubuntu"

  vpc_security_group_ids = [aws_security_group.games.id]

  user_data = <<-EOF
#!/bin/bash
apt update -y
apt install nginx -y
systemctl enable nginx
systemctl start nginx
EOF

  tags = {
    Name = "Game-Server"
  }
}

output "public_ip" {
  value = aws_instance.game_server.public_ip
}
