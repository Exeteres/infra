data "twc_presets" "preset" {
  location  = var.location
  cpu       = var.cpu
  ram       = var.ram
  disk_type = "nvme"
}

data "twc_os" "ubuntu" {
  name    = "ubuntu"
  version = "22.04"
}

resource "twc_server" "server" {
  name = var.name

  os_id     = data.twc_os.ubuntu.id
  preset_id = data.twc_presets.preset.id

  cloud_init = <<-EOT
#cloud-config
users:
  - name: root
    ssh-authorized-keys:
      - ${file("~/.ssh/id_ed25519.pub")}
EOT
}

resource "twc_floating_ip" "server" {
  availability_zone = var.ip_availability_zone

  resource {
    type = "server"
    id   = twc_server.server.id
  }
}
