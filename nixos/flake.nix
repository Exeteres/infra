{
  inputs = {
    nixpkgs.url = "nixpkgs/nixos-24.05";

    sops-nix = {
      url = "github:Mic92/sops-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    disko = {
      url = "github:nix-community/disko";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    nix-flatpak = {
      url = "github:gmodena/nix-flatpak";
    };
  };

  outputs = {self, ...} @ inputs: let
    lib = (import ./lib) inputs;

    mkSystem = lib.exeteres.mkSystemFactory {
      extraModules = with inputs; [
        sops-nix.nixosModules.sops
        home-manager.nixosModules.home-manager
        disko.nixosModules.disko
      ];
    };
  in {
    nixosConfigurations = {
      desktop = mkSystem ./instances/desktop/configuration.nix;
      laptop = mkSystem ./instances/laptop/configuration.nix;

      local-a = mkSystem ./instances/local-a/configuration.nix;
      local-b = mkSystem ./instances/local-b/configuration.nix;

      cloud-a = mkSystem ./instances/cloud-a/configuration.nix;
      cloud-b = mkSystem ./instances/cloud-b/configuration.nix;
      cloud-c = mkSystem ./instances/cloud-c/configuration.nix;
    };
  };
}
