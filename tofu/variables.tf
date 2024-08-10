variable "twc_token" {
  description = "The Timeweb Cloud API token"
  type        = string
  sensitive   = true
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

variable "servers" {
  description = "The server names to create"
  type = map(object({
    generation = number
  }))
}

variable "ssh_user" {
  description = "The SSH user to use"
  type        = string
}

variable "ssh_port" {
  description = "The port to allow SSH on"
  type        = number
}

variable "cloudflare_ip_ranges" {
  description = "The list of Cloudflare IP ranges to allow access from"
  type        = list(string)
}
