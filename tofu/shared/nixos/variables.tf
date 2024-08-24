variable "instance_id" {
  description = "The stable identifier of the instance, used to trigger recreation"
  type        = string
}

variable "ssh_host" {
  description = "The SSH host to use"
  type        = string
}

variable "ssh_port" {
  description = "The SSH port to use"
  type        = number
}

variable "ssh_user" {
  description = "The SSH user to use"
  type        = string
}

variable "configuration_name" {
  description = "The name of the NixOS configuration to use"
  type        = string
}

variable "generation" {
  description = "The sequence number of the server, used to trigger recreation"
  type        = number
}

variable "initial_ssh_port" {
  description = "The SSH port to use for the first instalation"
  type        = number
  default     = 22
}

variable "initial_ssh_user" {
  description = "The SSH user to use for the first instalation"
  type        = string
  default     = "root"
}
