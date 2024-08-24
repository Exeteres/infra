locals {
  attr_prefix = "${path.module}/../../../nixos#nixosConfigurations.${var.configuration_name}.config.system.build"
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
  instance_id       = "${var.instance_id}-${var.generation}"
  target_host       = var.ssh_host
  target_port       = var.generation == 1 ? var.initial_ssh_port : var.ssh_port
  target_user       = var.generation == 1 ? var.initial_ssh_user : var.ssh_user

  extra_files_script = "${path.module}/prepare_extra_files.sh"
}
