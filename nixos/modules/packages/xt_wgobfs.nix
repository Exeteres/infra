{
  stdenv,
  lib,
  fetchFromGitHub,
  linux,
  autoconf,
  automake,
  libtool,
  iptables,
  bash,
  pkg-config,
}:
stdenv.mkDerivation rec {
  name = "xt_wgobfs-${version}-${linux.version}";
  version = "0.5.0";

  src = fetchFromGitHub {
    owner = "infinet";
    repo = "xt_wgobfs";
    rev = "v${version}";
    sha256 = "sha256-+SRlGIVYhp/gsbcunZAX8AD4BVsDO232Ky9DePXCa7w=";
  };

  buildInputs = [
    autoconf
    automake
    libtool
    iptables
  ];

  nativeBuildInputs = [pkg-config] ++ linux.moduleBuildDependencies;

  preBuild = ''
    ${bash}/bin/bash autogen.sh
    ${bash}/bin/sh configure --with-kbuild=${linux.dev}/lib/modules/${linux.modDirVersion}/build --with-xtlibdir=$(out)
  '';

  makeFlags = [
    "KERNELRELEASE=${linux.modDirVersion}"
    "KERNEL_DIR=${linux.dev}/lib/modules/${linux.modDirVersion}/build"
    "DESTDIR=$(out)"
  ];

  meta = with lib; {
    description = "Iptables WireGuard obfuscation extension";
    homepage = "https://github.com/infinet/xt_wgobfs";
    license = licenses.gpl2;
    platforms = platforms.linux;
  };
}
