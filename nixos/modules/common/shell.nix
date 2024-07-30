{pkgs, ...}: {
  environment.systemPackages = with pkgs; [
    vim
    git
    htop
    age
    sops
    step-cli
    openssl
    tcpdump
    iptables
    traceroute
    glib
    dig
    speedtest-go
    bore-cli
    sysstat
    nmap
    dive
    attic-client
  ];

  programs.zsh = {
    enable = true;
    autosuggestions.enable = true;
    syntaxHighlighting.enable = true;

    ohMyZsh = {
      enable = true;
      theme = "gallifrey";
      plugins = ["git" "sudo" "z"];
    };
  };

  users.defaultUserShell = pkgs.zsh;
  programs.vim.defaultEditor = true;
}
