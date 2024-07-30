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

    userName = "Exeteres";
    userEmail = "exeteres@pm.me";

    extraConfig = {
      pull.rebase = true;
    };
  };

  programs.vim = {
    enable = true;
    defaultEditor = true;
  };
}
