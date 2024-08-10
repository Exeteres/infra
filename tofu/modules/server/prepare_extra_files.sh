# Copy ssh host keys
mkdir -p ./etc/ssh

sops decrypt --extract '["ssh_host_rsa_key"]' ~/workspace/secrets/infra.yaml > ./etc/ssh/ssh_host_rsa_key
sops decrypt --extract '["ssh_host_rsa_key.pub"]' ~/workspace/secrets/infra.yaml > ./etc/ssh/ssh_host_rsa_key.pub
sops decrypt --extract '["ssh_host_ed25519_key"]' ~/workspace/secrets/infra.yaml > ./etc/ssh/ssh_host_ed25519_key
sops decrypt --extract '["ssh_host_ed25519_key.pub"]' ~/workspace/secrets/infra.yaml > ./etc/ssh/ssh_host_ed25519_key.pub

chmod 600 ./etc/ssh/ssh_host_rsa_key
chmod 644 ./etc/ssh/ssh_host_rsa_key.pub
chmod 600 ./etc/ssh/ssh_host_ed25519_key
chmod 644 ./etc/ssh/ssh_host_ed25519_key.pub
