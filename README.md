# Personal Infrastructure

Here you can find some of configuration files I use to setup my personal infrastructure.
It uses [Pulumi](https://www.pulumi.com/) to manage the Kubernetes cluster and the applications running on it.

## Repository Structure

- **packages/core**: The handy utility wrappers around the Pulumi SDK and some common infrastructure components;
- **packages/\<package\>**: The ready-to-use application and their infrastructure components;
- **packages/\<package\>-crds**: The generated SDK for SRDs of the application;
- **stacks/**: The final Pulumi stacks, may contain some environment-specific configuration.

## Usage

Feel free to use this repository as a reference or a starting point for your own infrastructure.

You can also add it as a submodule and use some parts of it in your own repository:

```bash
git submodule add git@github.com:Exeteres/infra.git lib
```

If you are using Yarn, you can add it as a workspace:

```json
// package.json
{
  "workspaces": ["lib/packages/*"]
}
```

Then you can reference the packages in your stacks:

```json
// stacks/<my-stack>/package.json
{
  "dependencies": {
    "@infra/core": "workspace:*",
    "@infra/<package>": "workspace:*"
  }
}
```

Run `yarn` to install and link the packages.

To see the example of how to use the packages, check the `stacks/` folder.

## Ready-to-Use Applications

- [**Zitadel**](https://zitadel.com): The Identity and Access Management solution;
- [**Mailu**](https://mailu.io): The Mailu mail server;
- [**Factorio**](https://www.factorio.com): The Factorio game server.

## License

This repository is licensed under the MIT License.
