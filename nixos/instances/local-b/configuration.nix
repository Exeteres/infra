{
  imports = [
    ../../modules/server
  ];

  networking.hostName = "local-b";

  exeteres.services.kubernetes = {
    clusterCidr = "10.22.0.0/16";
    serviceCidr = "10.23.0.0/16";
  };
}
