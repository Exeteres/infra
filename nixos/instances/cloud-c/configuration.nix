{
  imports = [
    ../../modules/server
  ];

  networking.hostName = "cloud-c";

  exeteres.services.kubernetes = {
    clusterCidr = "10.52.0.0/16";
    serviceCidr = "10.53.0.0/16";
  };
}
