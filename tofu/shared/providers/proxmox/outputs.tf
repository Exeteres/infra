// Required 
output "id" {
  description = "The stable id of the server"
  value       = proxmox_vm_qemu.server.id
}

output "ssh_host" {
  description = "The SSH host of the server"
  value       = 22
}

output "ssh_port" {
  description = "The SSH port of the server"
  value       = 22
}

output "ssh_user" {
  description = "The SSH user of the server"
  value       = "root"
}

output "ssh_password" {
  description = "The SSH password of the server"
  value       = "nixos"
}
