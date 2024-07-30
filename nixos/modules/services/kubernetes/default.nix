{
  lib,
  config,
  ...
}:
lib.exeteres.mkService config {
  name = "kubernetes";
  description = "Single-Node Kubernetes Cluster";

  options = {
    apiDomain = lib.mkOption {
      type = lib.types.nullOr lib.types.str;
      default = null;
      description = "The host of the API server to generate certificates for";
    };
  };

  config = cfg: {
    # Disable the firewall since it breaks the k8s networking
    # The cloud firewall should be used instead
    networking.firewall.enable = false;

    systemd.tmpfiles.rules = [
      "L+ /usr/local/bin - - - - /run/current-system/sw/bin/"
    ];

    # https://github.com/NixOS/nixpkgs/issues/103158
    systemd.services.k3s.serviceConfig.KillMode = lib.mkForce "control-group";

    services.k3s = {
      enable = true;

      role = "server";
      clusterInit = true;

      extraFlags = lib.strings.concatStringsSep " " [
        "--secrets-encryption=true"
        "--tls-san=${cfg.apiDomain}"
        "--kubelet-arg=allowed-unsafe-sysctls=net.ipv4.conf.all.src_valid_mark,net.ipv4.ip_forward,net.ipv6.conf.all.forwarding"
        "--disable=traefik"
      ];
    };

    # Это же так поможет победить Путина
    environment.etc."rancher/k3s/registries.yaml".text = ''
      mirrors:
        "docker.io":
          endpoint:
            - "https://mirror.gcr.io"
    '';
  };
}
