{pkgs, ...}: {
  home.packages = with pkgs; [
    # Jetbrains IDEs
    jetbrains-toolbox

    # Language support tools
    alejandra
    nil

    # Other tools
    wireshark
    nmap
    go-task
  ];

  programs.vscode = {
    enable = true;
  };

  programs.git = {
    enable = true;

    extraConfig = {
      pull.rebase = true;
      gpg.format = "ssh";
      gpg.ssh.allowedSignersFile = "~/.ssh/allowed_signers";
      user.signingkey = "~/.ssh/id_ed25519.pub";
      commit.gpgsign = true;
    };
  };

  programs.vim = {
    enable = true;
    defaultEditor = true;
  };
}
