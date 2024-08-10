variable "ssh_port" {
  description = "The port to allow SSH on"
  type        = number
}

variable "server_ids" {
  description = "The list of server identifiers to attach the firewall to"
  type        = list(string)
}

variable "cloudflare_ip_ranges" {
  description = "The list of Cloudflare IP ranges to allow access from"
  type        = list(string)
}
