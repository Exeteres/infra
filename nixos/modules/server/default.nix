{
  imports = [
    ./private.nix
    ./hardware-configuration.nix
    ./disk-configuration.nix
    ../../users/exeteres/terminal.nix
  ];

  system.stateVersion = "24.05";

  boot.loader.grub.enable = true;
  nix.settings.trusted-users = ["@wheel"];

  networking.firewall.enable = false;

  exeteres.services.kubernetes = {
    enable = true;
    tailnetName = "ocicat-in.ts.net";
    secretFile = ../../secrets/server.yaml;
  };

  services.openssh = {
    enable = true;

    settings = {
      PermitRootLogin = "no";
      PasswordAuthentication = false;
    };
  };
}
