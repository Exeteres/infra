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
