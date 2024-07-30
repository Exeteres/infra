{
  lib,
  pkgs,
  ...
}: let
  mkUint32 = lib.hm.gvariant.mkUint32;
in {
  home.packages = with pkgs.gnomeExtensions; [
    media-controls
    unite
    tailscale-qs
    just-perfection
    clipboard-indicator
    quick-settings-tweaker
  ];

  dconf.settings = {
    "org/gnome/shell" = {
      disable-user-extensions = false;

      enabled-extensions = [
        "unite@hardpixel.eu"
        "gsconnect@andyholmes.github.io"
        "mediacontrols@cliffniff.github.com"
        "just-perfection-desktop@just-perfection"
        "clipboard-indicator@tudmotu.com"
        "tailscale@joaophi.github.com"
        "quick-settings-tweaks@qwreey"
      ];
    };

    # Unite
    "org/gnome/shell/extensions/unite" = {
      extend-left-box = false;
      window-buttons-placement = "first";
      window-buttons-theme = "united";
    };

    # Media Controls
    "org/gnome/shell/extensions/mediacontrols" = {
      colored-player-icon = false;
      element-order = ["controls" "title" "icon" "menu"];
      extension-position = "Left";
      extension-index = mkUint32 4;
      hide-media-notification = true;
      max-widget-width = 300;
      mouse-actions = ["toggle_info" "toggle_menu" "none" "none" "none" "none" "none" "none"];
      seperator-chars = ["|" "|"];
      show-control-icons = true;
      show-next-icon = true;
      show-player-icon = true;
      show-playpause-icon = true;
      show-seek-back = false;
      show-seek-forward = false;
      show-seperators = false;
      show-sources-menu = false;
      show-text = true;
      fixed-label-width = true;
      track-label = ["track" "" "none"];
    };

    # Just Perfection
    "org/gnome/shell/extensions/just-perfection" = {
      world-clock = false;
      notification-banner-position = 2; # top-right
    };

    # Clipboard Indicator
    "org/gnome/shell/extensions/clipboard-indicator" = {
      paste-button = false;
      history-size = 200;
      cache-size = 100;
      cache-only-favorites = false;
      disable-down-arrow = true;
    };

    # Quick Settings Tweaker
    "org/gnome/shell/extensions/quick-settings-tweaks" = {
      notifications-enabled = false;
      user-removed-buttons = ["NightLightToggle" "DarkModeToggle" "NMVpnToggle"];
    };
  };
}
