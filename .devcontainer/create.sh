#!/bin/bash

sudo chown dev:dev ~/.ssh
sudo chown dev:dev ~/.kube

echo "source ~/workspace/scripts/secret_manager.sh" >> /home/dev/.bashrc
