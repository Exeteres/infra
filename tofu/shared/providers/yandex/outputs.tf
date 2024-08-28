// Required 
output "id" {
  description = "The stable id of the server"
  value       = yandex_compute_instance.primary.id
}

output "ssh_host" {
  description = "The SSH host of the server"
  value       = yandex_compute_instance.primary.network_interface.0.nat_ip_address
}

output "ssh_port" {
  description = "The SSH port of the server"
  value       = 22
}

output "ssh_user" {
  description = "The SSH user of the server"
  value       = "root"
}

output "internal_ip" {
  description = "The internal IPv4 address of the server"
  value       = yandex_compute_instance.primary.network_interface.0.ip_address
}

// Additional
output "public_ip" {
  description = "The public IPv4 address of the server"
  value       = yandex_compute_instance.primary.network_interface.0.nat_ip_address
}
