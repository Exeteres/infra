inputs:
inputs.nixpkgs.lib.extend (self: super: {
  exeteres = let
    args = {
      lib = self;
      pkgs = inputs.nixpkgs.legacyPackages.x86_64-linux;
      inputs = inputs;
    };
  in
    {}
    // (import ./docker.nix args)
    // (import ./system.nix args)
    // (import ./caddy.nix args)
    // (import ./service.nix args);
})
