// Required 
output "id" {
  description = "The stable id of the server"
  value       = twc_server.server.id
}

output "ssh_host" {
  description = "The SSH host of the server"
  value       = twc_floating_ip.server.ip
}

output "ssh_port" {
  description = "The SSH port of the server"
  value       = 22
}

output "ssh_user" {
  description = "The SSH user of the server"
  value       = "root"
}

// Additional
output "public_ip" {
  description = "The public IPv4 address of the server"
  value       = twc_floating_ip.server.ip
}
