{
  imports = [
    ./hardware-configuration.nix
    ../../modules/desktop
  ];

  networking.hostName = "desktop";
  sops.defaultSopsFile = ../../secrets/desktop.yaml;

  services.touchegg.enable = true;
}
