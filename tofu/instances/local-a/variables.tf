variable "cpu" {
  description = "The number of CPUs"
  type        = number
}

variable "ram" {
  description = "The amount of RAM in MB"
  type        = number
}

variable "ssh_port" {
  description = "The port to allow SSH on"
  type        = number
}

variable "ssh_user" {
  description = "The SSH user to use"
  type        = string
}

variable "generation" {
  description = "The sequence number of the server, used to trigger recreation"
  type        = number
}

variable "target_node" {
  description = "The Proxmox node to deploy the server on"
  type        = string
  sensitive   = true
}

variable "pm_api_url" {
  description = "The Proxmox API URL to use"
  type        = string
}

variable "pm_user" {
  description = "The Proxmox user to use"
  type        = string
}

variable "pm_password" {
  description = "The Proxmox password to use"
  type        = string
  sensitive   = true
}
