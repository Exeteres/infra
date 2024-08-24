{
  imports = [
    ../../modules/server
  ];

  networking.hostName = "cloud-a";

  exeteres.services.kubernetes = {
    clusterCidr = "10.32.0.0/16";
    serviceCidr = "10.33.0.0/16";
  };
}
