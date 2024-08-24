load_secrets() {
    if [ -z "$SOPS_AGE_KEY" ]; then
        export SOPS_AGE_KEY=$(age -d ~/.config/age/key)
        echo "Age key unlocked"
    fi

    export PULUMI_CONFIG_PASSPHRASE=$(sops decrypt --extract '["'pulumi_passphrase'"]' ~/workspace/secrets/infra.yaml)
    export RESTIC_PASSWORD=$(sops decrypt --extract '["'restic_password'"]' ~/workspace/secrets/infra.yaml)
    export TF_VAR_ssh_port=$(sops decrypt --extract '["'ssh_port'"]' ~/workspace/secrets/infra.yaml)
    export TF_VAR_ssh_user=$(sops decrypt --extract '["'ssh_user'"]' ~/workspace/secrets/infra.yaml)
    export TF_VAR_twc_token=$(sops decrypt --extract '["'twc_token'"]' ~/workspace/secrets/infra.yaml)
    export TF_VAR_yc_sa_key=$(sops decrypt --extract '["'yc_sa_key'"]' ~/workspace/secrets/infra.yaml)

    echo "Secrets loaded"
}
