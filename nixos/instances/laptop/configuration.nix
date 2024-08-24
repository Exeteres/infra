{
  imports = [
    ./hardware-configuration.nix
    ../../modules/desktop
  ];

  networking.hostName = "laptop";
  sops.defaultSopsFile = ../../secrets/laptop.yaml;

  services.touchegg.enable = true;
}
