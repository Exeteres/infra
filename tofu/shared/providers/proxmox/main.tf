resource "proxmox_vm_qemu" "server" {
  name        = var.name
  target_node = var.target_node

  vcpus  = var.cpu
  memory = var.ram

  disks {
    ide {
      ide2 {
        cdrom {
          iso = "local:iso/nixos.iso"
        }
      }
    }
  }
}
