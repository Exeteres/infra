{
  imports = [
    ../../modules/server
  ];

  networking.hostName = "local-a";

  exeteres.services.kubernetes = {
    clusterCidr = "10.12.0.0/16";
    serviceCidr = "10.13.0.0/16";
  };
}
