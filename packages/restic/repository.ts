import { pulumi, random } from "@infra/core"
import { k8s } from "@infra/k8s"
import { scripting } from "@infra/scripting"

export interface RepositoryOptions extends k8s.CommonOptions {
  /**
   * The password to encrypt the repository with.
   * If not provided, a random password will be generated.
   */
  password?: pulumi.Input<string>

  /**
   * The fully qualified path to the repository (in restic format).
   */
  remotePath: pulumi.Input<string>

  /**
   * The environment to use when running scripts.
   * It will be merged with the default environment.
   */
  environment?: scripting.ScriptEnvironment
}

export interface Repository {
  /**
   * The name of the repository.
   */
  name: string

  /**
   * The secret containing the repository configuration.
   */
  secret: k8s.raw.core.v1.Secret

  /**
   * The merged environment for the scripts.
   */
  environment: scripting.ScriptEnvironment
}

export function createRepository(options: RepositoryOptions): Repository {
  const password =
    options.password ??
    random.createPassword({ name: `${options.name}-password`, parent: options.namespace, length: 16 }).result

  const secret = k8s.createSecret({
    name: k8s.getPrefixedName("restic-repo", options.name),
    namespace: options.namespace,

    data: {
      name: options.name,
      password,
      remotePath: options.remotePath,
    },
  })

  const environment = scripting.mergeEnvironments(
    {
      distro: "alpine",
      packages: ["restic"],

      environment: {
        RESTIC_REPOSITORY: options.remotePath,
        RESTIC_PASSWORD_FILE: "/restic-secrets/password",
      },

      volumes: [
        {
          name: secret.metadata.name,
          secret: {
            secretName: secret.metadata.name,
          },
        },
      ],

      volumeMounts: [
        {
          name: secret.metadata.name,
          mountPath: "/restic-secrets",
        },
      ],
    },
    options.environment,
  )

  return {
    name: options.name,
    secret,
    environment,
  }
}
