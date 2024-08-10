variable "name" {
  description = "The name of the server"
  type        = string
}

variable "location" {
  description = "The location of the server"
  type        = string
}

variable "ip_availability_zone" {
  description = "The IP availability zone"
  type        = string
}

variable "cpu" {
  description = "The number of CPUs"
  type        = number
}

variable "ram" {
  description = "The amount of RAM in MB"
  type        = number
}

variable "ssh_key_id" {
  description = "The ID of the SSH key to use"
  type        = string
}

variable "ssh_user" {
  description = "The SSH user to use"
  type        = string
}

variable "ssh_port" {
  description = "The SSH port to use"
  type        = number
}

variable "nixos_configuration_name" {
  description = "The name of the NixOS configuration to use"
  type        = string
}

variable "generation" {
  description = "The sequence number of the server, used to trigger recreation"
  type        = number
}
