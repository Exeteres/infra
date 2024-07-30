{lib, ...}: {
  mkService = configRef: {
    name,
    description,
    options ? {},
    config ? {},
  }: let
    cfg = configRef.exeteres.services.${name};

    resolvedConfig =
      if builtins.isFunction config
      then config cfg
      else config;

    mergedConfig =
      if builtins.isList resolvedConfig
      then lib.mkMerge resolvedConfig
      else resolvedConfig;
  in {
    options.exeteres.services.${name} =
      {enable = lib.mkEnableOption description;}
      // options;

    config = lib.mkIf cfg.enable mergedConfig;
  };

  mkDomainOption = {
    subject,
    subdomain,
  }:
    lib.mkOption {
      type = lib.types.strMatching "^[a-z0-9.-]+$";
      description = "The full qualified domain name where the ${subject} should be reachable.";
      example = "${subdomain}.example.com";
    };

  mkLocalPortOption = {
    subject,
    default,
  }:
    lib.mkOption {
      type = lib.types.port;
      description = "The port where the ${subject} is reachable locally in order to be proxied.";
      default = default;
    };

  mkSecretEnvironmentFileOption = {
    subject,
    secret,
  }:
    lib.mkOption {
      type = lib.types.path;
      description = "The path to the file containing the secret environment variables for the ${subject}.";
      default = "/run/secrets/exeteres/${secret}/environment";
    };
}
