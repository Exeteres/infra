{
  buildGoModule,
  fetchFromGitHub,
}:
buildGoModule rec {
  pname = "swgp-go";
  version = "v1.5.0";

  src = fetchFromGitHub {
    owner = "database64128";
    repo = "swgp-go";
    rev = version;
    hash = "sha256-9icKCkgRKB3Y3CsmfjRQ5E+1uRYfS6KX+tms+SRcbcc=";
  };

  doCheck = false; # tests require network
  vendorHash = "sha256-cQf2tvE/QnbXRt3VUJQaeGPufLR32uPMNIstDZ08y0U=";
}
