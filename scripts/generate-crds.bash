#!/bin/bash
# This script generates SDK for CRDs using crd2pulumi

set -e
cd "$(dirname "$0")/.." # cd to repo root dir

echo "+ Generating SDK for cert-manager"
crd2pulumi -n --nodejsPath packages/cert-manager-crds --nodejsName cert-manager --force https://github.com/cert-manager/cert-manager/releases/download/v1.14.5/cert-manager.yaml

echo "+ Generating SDK for traefik"
crd2pulumi -n --nodejsPath packages/traefik-crds --nodejsName traefik --force https://raw.githubusercontent.com/traefik/traefik/v3.0/docs/content/reference/dynamic-configuration/kubernetes-crd-definition-v1.yml

echo "Done!"