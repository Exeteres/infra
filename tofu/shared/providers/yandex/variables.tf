variable "name" {
  description = "The name of the server"
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

variable "subnet_id" {
  description = "The ID of the subnet to attach the server to"
  type        = string
}
