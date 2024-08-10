{
  lib,
  config,
  ...
}:
lib.exeteres.mkService config {
  name = "kubernetes";
  description = "Single-Node Kubernetes Cluster";

  options = {
    secretFile = lib.mkOption {
      type = lib.types.path;
      description = "Path to the secret file";
    };

    serviceCidr = lib.mkOption {
      type = lib.types.string;
      default = "10.43.0.0/16";
      description = "CIDR for services";
    };

    domain = lib.mkOption {
      type = lib.types.str;
      description = "Domain for the API server";
    };
  };

  config = cfg: {
    # Disable the firewall since it breaks the k8s networking
    # The cloud firewall should be used instead
    networking.firewall.enable = false;

    # https://github.com/NixOS/nixpkgs/issues/103158
    systemd.services.k3s.serviceConfig.KillMode = lib.mkForce "control-group";

    services.k3s = {
      enable = true;
      role = "server";

      extraFlags = lib.strings.concatStringsSep " " [
        "--secrets-encryption=true"
        "--kubelet-arg=allowed-unsafe-sysctls=net.ipv4.conf.all.src_valid_mark,net.ipv4.ip_forward,net.ipv6.conf.all.forwarding"
        "--disable=traefik"
        "--flannel-backend=none"
        "--disable-network-policy"
        "--service-cidr=${cfg.serviceCidr}"
        "--tls-san=${cfg.domain}"
        # "--disable-kube-proxy"
      ];
    };

    # Это же так поможет победить Путина
    environment.etc."rancher/k3s/registries.yaml".text = ''
      mirrors:
        "docker.io":
          endpoint:
            - "https://mirror.gcr.io"
    '';

    sops.secrets = let
      fileNames = [
        "server-ca.crt"
        "server-ca.key"
        "client-ca.crt"
        "client-ca.key"
        "request-header-ca.crt"
        "request-header-ca.key"
        "etcd/peer-ca.crt"
        "etcd/peer-ca.key"
        "etcd/server-ca.crt"
        "etcd/server-ca.key"
        "service.key"
      ];

      createSecret = fileName: {
        name = "k3s/${fileName}";
        value = {
          path = "/var/lib/rancher/k3s/server/tls/${fileName}";
          sopsFile = cfg.secretFile;
        };
      };
    in
      builtins.listToAttrs (map createSecret fileNames);
  };
}
