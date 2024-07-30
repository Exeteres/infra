{
  imports = [
    ./firefox
    ./flatpak.nix

    ./other/devtools.nix
    ./other/essentials.nix
    ./other/privacy.nix
  ];

  programs.home-manager.enable = true;
}
