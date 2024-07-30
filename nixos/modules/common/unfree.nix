{lib, ...}: let
  allowedPackages = [
    # Closed source
    "jetbrains-toolbox"
    "vscode"
  ];
in {
  nixpkgs.config.allowUnfreePredicate = pkg: builtins.elem (lib.getName pkg) allowedPackages;
}
