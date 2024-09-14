{
  nix-flatpak,
  config,
  ...
}: {
  imports = [
    ./terminal.nix
  ];

  home-manager.users.exeteres = {
    imports = [
      nix-flatpak.homeManagerModules.nix-flatpak
      ../../modules/home
    ];

    home.username = "exeteres";
    home.homeDirectory = "/home/exeteres";

    home.stateVersion = "24.05";
    home.enableNixpkgsReleaseCheck = false;

    home.file.".ssh/allowed_signers".text = "* ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMNIqtAny6k6r7uB8XIyyycLEUJy/Ecd9RIiZWji2GdI exeteres";

    programs.git = {
      userName = "Fedor Chubukov";
      userEmail = "exeteres@proton.me";
    };
  };

  sops.secrets."ssh/private_key" = {
    sopsFile = ../../secrets/devices.yaml;
    path = "/home/exeteres/.ssh/id_ed25519";
    owner = config.users.users.exeteres.name;
    group = config.users.users.exeteres.group;
    mode = "0600";
  };

  sops.secrets."ssh/public_key" = {
    sopsFile = ../../secrets/devices.yaml;
    path = "/home/exeteres/.ssh/id_ed25519.pub";
    owner = config.users.users.exeteres.name;
    group = config.users.users.exeteres.group;
    mode = "0644";
  };

  sops.secrets."age_key" = {
    path = "/home/exeteres/.config/age/key";
    owner = "exeteres";
    sopsFile = ../../secrets/age_key.enc;
    format = "binary";
  };
}
