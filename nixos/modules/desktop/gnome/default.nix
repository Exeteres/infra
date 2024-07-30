{pkgs, ...}: {
  imports = [
    ./gsconnect.nix
  ];

  # Enable GDM (GNOME Display Manager)
  services.xserver.displayManager.gdm = {
    enable = true;
    wayland = false;
  };

  # Enable the GNOME Desktop Environment.
  services.xserver.enable = true;
  services.xserver.desktopManager.gnome.enable = true;

  environment.systemPackages = with pkgs; [
    papirus-icon-theme
  ];

  environment.gnome.excludePackages = with pkgs; [
    gnome-tour
    gnome.cheese
    gnome.yelp
    gnome.epiphany
    gnome.simple-scan
    gnome.gnome-software
  ];
}
