{pkgs, ...}: {
  environment.systemPackages = with pkgs; [
    gnomeExtensions.gsconnect
  ];

  # KDE Connect Ports
  networking.firewall.allowedTCPPortRanges = [
    {
      from = 1714;
      to = 1764;
    }
  ];
  networking.firewall.allowedUDPPortRanges = [
    {
      from = 1714;
      to = 1764;
    }
  ];
}
