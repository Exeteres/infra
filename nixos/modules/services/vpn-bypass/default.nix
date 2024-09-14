{
  lib,
  pkgs,
  config,
  ...
}:
lib.exeteres.mkService config {
  name = "vpn-bypass";
  description = "VPN Bypass service";

  options = {
    domains = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [];
      description = ''
        List of domains to resolve and add routes for.
      '';
    };

    metric = lib.mkOption {
      type = lib.types.int;
      default = 300;
      description = ''
        Metric to use for the added routes.
      '';
    };

    table = lib.mkOption {
      type = lib.types.str;
      default = "main";
      description = ''
        Routing table to use for the added routes.
      '';
    };
  };

  config = cfg: let
    updateRoutesScript = ''
      set -euo pipefail

      DOMAINS=(${lib.strings.concatStringsSep " " cfg.domains})
      GATEWAY_IP=$(ip route show | grep default | awk '{print $3}')

      declare -a IPS
      for DOMAIN in "''${DOMAINS[@]}"; do
        echo "[~] resolving $DOMAIN"
        IPS+=($(dig +short "$DOMAIN" | grep -v '\.$'))
      done

      # Remove duplicates
      IPS=($(echo "''${IPS[@]}" | tr ' ' '\n' | sort -u))

      EXISTING_ROUTES=$(ip route show table ${cfg.table} metric "${toString cfg.metric}")

      for IP in "''${IPS[@]}"; do
        if ! echo $EXISTING_ROUTES | grep -q "$IP"; then
          echo "[+] $DOMAIN -> $IP"
          ip route add "$IP" via "$GATEWAY_IP" table "${cfg.table}" metric "${toString cfg.metric}"
        fi
      done

      while IFS= read -r route; do
        ROUTE_IP=$(echo "$route" | awk '{print $1}')
        if ! echo "''${IPS[@]}" | grep -q "$ROUTE_IP"; then
          echo "[-] $ROUTE_IP"
          ip route del "$ROUTE_IP" table "${cfg.table}" || echo "[!] failed to delete $ROUTE_IP"
        fi
      done <<< "$EXISTING_ROUTES"
    '';
  in {
    systemd.services.vpn-bypass = {
      description = "Update network routes for VPN bypass";
      after = ["network-online.target"];
      wants = ["network-online.target"];
      wantedBy = ["multi-user.target"];

      script = updateRoutesScript;
      path = with pkgs; [bind iproute2 gawk dig];

      serviceConfig = {
        Type = "oneshot";
      };
    };

    systemd.timers.vpn-bypass = {
      description = "Update network routes for VPN bypass";
      wantedBy = ["timers.target"];

      timerConfig = {
        OnCalendar = "*/15 * * * *"; # Every 15 minutes
        Persistent = true;
      };
    };
  };
}
