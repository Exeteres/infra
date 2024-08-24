{
  imports = [
    ./flatpak.nix
    ./devtools.nix
    ./essentials.nix
    ./privacy.nix
  ];

  programs.home-manager.enable = true;
}
