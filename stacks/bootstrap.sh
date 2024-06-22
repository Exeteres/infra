#!/bin/bash
set -e

bootstrap_stack() {
  pulumi up -C ./$1 -s main -y --refresh
}

bootstrap_stack shared
bootstrap_stack tailscale
bootstrap_stack kubernetes-dashboard
bootstrap_stack vpn
bootstrap_stack mariadb
bootstrap_stack vaultwarden
bootstrap_stack syncthing
bootstrap_stack standardnotes