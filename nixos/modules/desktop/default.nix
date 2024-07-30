{
  imports = [
    ./gnome
    ./firewall
    ./other
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

  # Integrate home-manager
  home-manager.useGlobalPkgs = true;

  # No tracking variables
  environment.sessionVariables = {
    DO_NOT_TRACK = "1";
    DOTNET_CLI_TELEMETRY_OPTOUT = "1";
  };
}
