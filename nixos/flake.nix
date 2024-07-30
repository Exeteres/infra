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

    mkHostSystem = lib.exeteres.mkSystemFactory {
      extraModules = with inputs; [
        sops-nix.nixosModules.sops
        home-manager.nixosModules.home-manager
        disko.nixosModules.disko
      ];
    };
  in {
    nixosConfigurations = {
      desktop = mkHostSystem ./hosts/desktop/configuration.nix;
      laptop = mkHostSystem ./hosts/laptop/configuration.nix;
      public-ams = mkHostSystem ./hosts/public-ams/configuration.nix;
    };
  };
}
