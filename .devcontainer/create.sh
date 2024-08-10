#!/bin/bash

sudo chown dev:dev ~/.ssh
sudo chown dev:dev ~/.kube

cat <<EOF >> /home/dev/.bashrc
load_secrets() {
    if [ -z "\$SOPS_AGE_KEY" ]; then
        export SOPS_AGE_KEY=\$(age -d ~/.config/age/key)
        echo "Age key unlocked"
    fi

    export PULUMI_CONFIG_PASSPHRASE=\$(sops decrypt --extract '["pulumi_passphrase"]' ~/workspace/secrets/infra.yaml)
    export TF_VAR_twc_token=\$(sops decrypt --extract '["twc_token"]' ~/workspace/secrets/infra.yaml)

    echo "Secrets loaded"
}
EOF
