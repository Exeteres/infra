output "public_ip" {
  description = "The public IPv4 address of the server"
  value       = module.server.public_ip
}

output "internal_ip" {
  description = "The internal IPv4 address of the server"
  value       = module.server.internal_ip
}

output "ssh_port" {
  description = "The SSH port of the server"
  value       = var.ssh_port
}

output "ssh_user" {
  description = "The SSH user of the server"
  value       = var.ssh_user
}
