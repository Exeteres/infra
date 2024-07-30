{pkgs, ...}: {
  home.packages = with pkgs; [
    # VPN
    wireguard-tools

    # Browsers
    tor-browser-bundle-bin
  ];
}
