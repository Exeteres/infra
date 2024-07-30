{
  lib,
  inputs,
  ...
}: {
  mkSystemFactory = {
    extraModules ? [],
    system ? "x86_64-linux",
  }: configuration:
    lib.nixosSystem {
      system = system;
      specialArgs = inputs;

      modules =
        [
          ../modules

          configuration
        ]
        ++ extraModules;
    };
}
