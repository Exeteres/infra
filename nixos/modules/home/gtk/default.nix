{pkgs, ...}: {
  dconf.settings = {
    "org/gnome/desktop/interface" = {
      cursor-theme = "Adwaita";
      color-scheme = "prefer-dark";
      icon-theme = "Papirus-Dark";
      gtk-theme = "Adwaita-dark";
    };
  };

  home.packages = with pkgs; [
    gnome.gnome-themes-extra
    papirus-icon-theme
  ];
}
