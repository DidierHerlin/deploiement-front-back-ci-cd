terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.0"
    }
  }
}

provider "docker" {}

resource "docker_network" "immobilier_net" {
  name = "immobilier-network"
}

resource "docker_container" "postgres" {
  name  = "immobilier-db"
  image = "postgres:16-alpine"
  restart = "unless-stopped"
  networks_advanced {
    name = docker_network.immobilier_net.name
  }
  env = [
    "POSTGRES_DB=gesion_immobilier_back_end",
    "POSTGRES_USER=postgres",
    "POSTGRES_HOST_AUTH_METHOD=trust"
  ]
  ports {
    internal = 5432
    external = 5432
  }
}
