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

variable "yc_sa_key" {
  description = "The Yandex Cloud service account key"
  type        = string
  sensitive   = true
}

variable "zone" {
  description = "The zone to deploy the instance in"
  type        = string
}

variable "folder_id" {
  description = "The Yandex Cloud folder ID"
  type        = string
}

variable "subnet_id" {
  description = "The ID of the subnet to attach the server to"
  type        = string
}
