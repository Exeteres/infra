data "yandex_compute_image" "ubuntu" {
  family = "ubuntu-2204-lts"
}

resource "yandex_compute_disk" "primary" {
  name     = var.name
  type     = "network-ssd-nonreplicated"
  size     = "93"
  image_id = data.yandex_compute_image.ubuntu.id
}

resource "yandex_compute_instance" "primary" {
  name = var.name

  resources {
    cores  = var.cpu
    memory = var.ram
  }

  boot_disk {
    disk_id = yandex_compute_disk.primary.id
  }

  network_interface {
    subnet_id = var.subnet_id
    nat       = true
  }

  metadata = {
    user-data = <<-EOT
#cloud-config
users:
  - name: root
    ssh-authorized-keys:
      - ${file("~/.ssh/id_ed25519.pub")}
EOT
  }
}
