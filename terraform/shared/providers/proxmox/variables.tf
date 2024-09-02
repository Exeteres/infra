variable "name" {
  description = "The name of the server"
  type        = string
}

variable "target_node" {
  description = "The target node for the VM"
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
