{
  imports = [
    ../../modules/server
  ];

  networking.hostName = "cloud-b";

  exeteres.services.kubernetes = {
    clusterCidr = "10.42.0.0/16";
    serviceCidr = "10.43.0.0/16";
  };
}
