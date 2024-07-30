{...}: {
  mkCaddyProxy = {
    domain,
    port,
  }: {
    services.caddy.virtualHosts."${domain}".extraConfig = ''
      reverse_proxy http://localhost:${toString port}
    '';
  };
}
