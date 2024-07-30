{
  imports = [
    ./gtk
    ./gnome
    ./programs
  ];

  services.opensnitch-ui.enable = true;
  services.syncthing.enable = true;
}
