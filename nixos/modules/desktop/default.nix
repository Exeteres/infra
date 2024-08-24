{pkgs, ...}: {
  imports = [
    ./gnome
    ./firewall
    ./other
    ../../users/exeteres/desktop.nix
  ];

  # Enable networking
  networking.networkmanager.enable = true;

  # Enable Flatpak
  services.flatpak.enable = true;

  # Enable docker virtualization
  virtualisation.docker = {
    enable = true;
    daemon.settings = {
      mtu = 1280;
      registry-mirrors = [
        "https://mirror.gcr.io"
      ];
    };
  };

  boot.kernelPackages = pkgs.linuxPackages_zen;

  services.tailscale = {
    enable = true;
    useRoutingFeatures = "client";
  };

  sops.age.sshKeyPaths = ["/etc/ssh/ssh_host_ed25519_key"];
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;
  boot.loader.efi.efiSysMountPoint = "/boot";
  boot.supportedFilesystems = ["ntfs"];

  # Integrate home-manager
  home-manager.useGlobalPkgs = true;

  # No tracking variables
  environment.sessionVariables = {
    DO_NOT_TRACK = "1";
    DOTNET_CLI_TELEMETRY_OPTOUT = "1";
  };
}
