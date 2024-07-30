{pkgs, ...}: {
  home.packages = with pkgs; [
    # Utils
    ffmpeg
    home-manager
  ];
}
