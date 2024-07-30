{
  lib,
  pkgs,
  ...
}: {
  mkDockerComposeStack = {
    name,
    description,
    entrypoint,
    environment ? {},
    secretEnvironmentFile ? null,
  }: {
    systemd.services."stack-${name}" = let
      attrsetToEnvFile = attrs: let
        # Helper function to convert a single attribute set entry to .env format
        entryToEnv = name: value: "${name}=${
          if builtins.isPath value
          then value # otherwise path becomes something like "/nix/store/...-source/..." which does not even exist in the /nix/store
          else toString value
        }";

        # Convert the attribute set to a list of .env entries
        envEntries = lib.mapAttrsToList entryToEnv attrs;

        # Join the list of .env entries into a single string
        envFileContent = lib.concatStringsSep "\n" envEntries;
      in
        envFileContent;

      joinedEnvironmentFile =
        if builtins.length (lib.attrsets.attrValues environment) > 0
        then pkgs.writeText "environment" (attrsetToEnvFile environment)
        else null;
    in {
      description = "${description} Stack";

      wants = ["network-online.target"];
      wantedBy = ["multi-user.target"];

      path = [pkgs.docker];

      script =
        if joinedEnvironmentFile != null && secretEnvironmentFile != null
        then "docker compose -f ${entrypoint} -p ${name} --env-file ${joinedEnvironmentFile} --env-file ${secretEnvironmentFile} up"
        else if joinedEnvironmentFile != null
        then "docker compose -f ${entrypoint} -p ${name} --env-file ${joinedEnvironmentFile} up"
        else if secretEnvironmentFile != null
        then "docker compose -f ${entrypoint} -p ${name} --env-file ${secretEnvironmentFile} up"
        else "docker compose -f ${entrypoint} -p ${name} up";

      serviceConfig = {
        User = "root";
        Group = "root";

        Restart = "on-failure";
      };
    };

    exeteres.secrets.secrets."exeteres/${name}/environment" = lib.mkIf (secretEnvironmentFile != null) {
      path = secretEnvironmentFile;
    };
  };
}
