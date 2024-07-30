{
  nixpkgs.overlays = [
    (self: super: {
      xt_wgobfs = super.callPackage ./xt_wgobfs.nix {};
      swgp-go = super.callPackage ./swgp-go.nix {};

      iptables_wgobfs = super.iptables.overrideAttrs (finalAttrs: previousAttrs: {
        postInstall = ''
          ${previousAttrs.postInstall or ""}
          ln -s ${self.xt_wgobfs}/libxt_WGOBFS.so $out/lib/xtables/libxt_WGOBFS.so
        '';
      });
    })
  ];
}
