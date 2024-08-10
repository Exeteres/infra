# Dev Container

Here is a set of pre-build dev container images which I use for all my projects.

## Usage

Personally, I like to create all my devcontainers with docker-compose entrypoint, so I can easily extend them with additional services when needed.
Here is an example of how to use this devcontainer in your project:

.devcontainer/devcontainer.json

```json
{
  "dockerComposeFile": "docker-compose.yml",
  "service": "main",
  "workspaceFolder": "/home/dev/workspace",
  "remoteUser": "dev"
}
```

.devcontainer/docker-compose.yml

```yaml
version: "3.9"

services:
  main:
    image: ghcr.io/exeteres/devcontainer/base
    volumes:
      - ..:/home/dev/workspace:cached
    command: sleep infinity

networks:
  default:
    driver: bridge
    driver_opts:
      com.docker.network.driver.mtu: 1200
```

You can also add some credentials mounts like `~/.kube` or `~/.pulumi` to authenticate the tools.

## Images

<table>
  <tr>
    <th>Image</th>
    <th>Description</th>
  </tr>

  <tr>
    <td><code>ghcr.io/exeteres/devcontainer/base</code></td>
    <td>Base image with common tools I use. <br>It is based on <b>Ubuntu 24.04</b> and includes: <ul>
      <li>Docker in Docker</li>
      <li>Python 3</li>
    </ul>
    </td>
  </tr>

  <tr>
    <td><code>ghcr.io/exeteres/devcontainer/go</code></td>
    <td>Image with Go installed. <br>It additionally includes: <ul>
      <li>Go</li>
      <li>protoc</li>
    </ul>
    </td>
  </tr>

  <tr>
    <td><code>ghcr.io/exeteres/devcontainer/node</code></td>
    <td>Image with Node.js installed. <br>It additionally includes: <ul>
      <li>Node.js</li>
      <li>corepack</li>
      <li>protoc</li>
    </ul>
  </td>

  <tr>
    <td><code>ghcr.io/exeteres/devcontainer/dotnet</code></td>
    <td>Image with .NET SDK installed. <br>It additionally includes: <ul>
      <li>.NET SDK</li>
    </ul>
  </td>

  <tr>
    <td><code>ghcr.io/exeteres/devcontainer/devops</code></td>
    <td>Image with all the tools I use for DevOps. <br>It additionally includes: <ul>
      <li>kubectl</li>
      <li>helm</li>
      <li>pulumi</li>
      <li>opentofu</li>
      <li>nix + additional packages</li>
    </ul>
</table>
