{
  imports = [
    ./hardware-configuration.nix
    ../../modules/desktop
  ];

  networking.hostName = "laptop";
  sops.defaultSopsFile = ../../secrets/laptop.yaml;

  services.touchegg.enable = true;

  services.pcscd = {
    enable = true;
    extraArgs = ["--disable-polkit"];
  };
}
