output "name" {
  description = "The name of the server"
  value       = twc_server.server.name
}

output "id" {
  description = "The ID of the server"
  value       = twc_server.server.id
}

output "public_ip" {
  description = "The public IPv4 address of the server"
  value       = twc_floating_ip.server.ip
}
