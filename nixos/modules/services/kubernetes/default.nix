{
  pkgs,
  lib,
  config,
  ...
}:
lib.exeteres.mkService config {
  name = "kubernetes";
  description = "Single-Node Kubernetes Cluster";

  config = cfg: {
    # Disable the firewall since it breaks the k8s networking
    # The cloud firewall should be used instead
    networking.firewall.enable = false;

    # https://github.com/NixOS/nixpkgs/issues/103158
    systemd.services.k3s.serviceConfig.KillMode = lib.mkForce "control-group";
    environment.systemPackages = with pkgs; [cilium-cli];

    services.k3s = {
      enable = true;
      role = "server";

      extraFlags = lib.strings.concatStringsSep " " [
        "--secrets-encryption=true"
        "--kubelet-arg=allowed-unsafe-sysctls=net.ipv4.conf.all.src_valid_mark,net.ipv4.ip_forward,net.ipv6.conf.all.forwarding"
        "--disable=traefik"
        "--flannel-backend=none"
        "--disable-network-policy"
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
