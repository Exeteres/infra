{
  imports = [
    ./private.nix
  ];

  users.users.exeteres = {
    isNormalUser = true;
    uid = 1000;
    description = "Exeteres";

    extraGroups = [
      "networkmanager"
      "wheel"
      "docker"
      "wireshark"
      "fuse"
    ];
  };
}
