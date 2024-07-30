{
  services.opensnitch = {
    enable = true;

    settings = {
      DefaultAction = "allow";
      ProcMonitorMethod = "ebpf";
    };
  };
}
