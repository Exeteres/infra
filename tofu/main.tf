resource "twc_ssh_key" "bootstrap" {
  name = "bootstrap"
  body = file("~/.ssh/id_ed25519.pub")
}

module "server" {
  source   = "./modules/server"
  for_each = var.servers

  name = each.key

  ssh_key_id = twc_ssh_key.bootstrap.id
  ssh_user   = var.ssh_user
  ssh_port   = var.ssh_port

  ip_availability_zone = var.ip_availability_zone
  location             = var.location
  cpu                  = var.cpu
  ram                  = var.ram

  nixos_configuration_name = each.key
  generation               = each.value.generation
}

module "firewall" {
  source = "./modules/firewall"

  cloudflare_ip_ranges = var.cloudflare_ip_ranges
  server_ids           = [for server in module.server : server.id]
  ssh_port             = var.ssh_port
}

output "public_ips" {
  description = "Public IP addresses of the servers"
  value       = { for server in module.server : server.name => server.public_ip }
}

output "ssh_port" {
  description = "SSH port of the servers"
  value       = var.ssh_port
}

output "ssh_user" {
  description = "SSH user of the servers"
  value       = var.ssh_user
}
