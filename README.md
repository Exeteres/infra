# Personal Infrastructure

Here you can find almost all the configuration files I use to setup my personal infrastructure.

## Stack

- [NixOS](https://nixos.org/) as the base operating system;
- [Pulumi](https://www.pulumi.com/) to manage the Kubernetes cluster and the applications running on it, as well as DNS records;
- [Knative](https://knative.dev/) to run the cloud functions which automate some tasks in the infrastructure;

## Repository Structure

- **nixos/**: The NixOS configuration files excluding the secrets and the host-specific configuration;
- **packages/infra/core**: The handy utility wrappers around the Pulumi SDK and some common infrastructure components;
- **packages/infra/\<package\>**: The ready-to-use application and their infrastructure components;
- **packages/infra/\<package\>-crds**: The generated SDK for SRDs of the application if needed;
- **stacks/common/**: Some utilities consuming outputs of the Pulumi stacks;
- **stacks/**: The final Pulumi stacks, may contain some environment-specific configuration;
- **packages/scripting/**: Some auxiliary packages to be used in functions;
- **functions/**: The Knative functions to automate some tasks in the infrastructure;
- **registry/**: The Dockerfiles and other resources to build some images used in the infrastructure;

## License

This repository is licensed under the MIT License.
