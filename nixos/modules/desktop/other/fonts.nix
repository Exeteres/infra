{pkgs, ...}: {
  fonts.packages = with pkgs; [
    (nerdfonts.override {fonts = ["FiraCode"];})
  ];

  fonts.fontconfig.defaultFonts = {
    monospace = ["FiraCode Nerd Font"];
  };
}
