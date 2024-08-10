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

  os_id        = data.twc_os.ubuntu.id
  preset_id    = data.twc_presets.preset.id
  ssh_keys_ids = [var.ssh_key_id]
}

resource "twc_floating_ip" "server" {
  availability_zone = var.ip_availability_zone

  resource {
    type = "server"
    id   = twc_server.server.id
  }
}

locals {
  attr_prefix           = "../nixos#nixosConfigurations.${var.nixos_configuration_name}.config.system.build"
  host_ssh_secrets_path = "/run/ssh_host_secrets/${var.name}"
}

module "system-build" {
  source    = "github.com/nix-community/nixos-anywhere//terraform/nix-build"
  attribute = "${local.attr_prefix}.toplevel"
}

module "disko" {
  source    = "github.com/nix-community/nixos-anywhere//terraform/nix-build"
  attribute = "${local.attr_prefix}.diskoScript"
}

module "install" {
  source = "github.com/nix-community/nixos-anywhere//terraform/install"

  nixos_system      = module.system-build.result.out
  nixos_partitioner = module.disko.result.out
  instance_id       = "${twc_server.server.id}-${var.generation}"
  target_host       = twc_floating_ip.server.ip
  target_port       = var.generation == 1 ? 22 : var.ssh_port
  target_user       = var.generation == 1 ? "root" : var.ssh_user

  extra_files_script = "${path.module}/prepare_extra_files.sh"
}
