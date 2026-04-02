{
  description = "Network Probe Logic Simulator - React/TypeScript dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            nodejs_22
          ];

          shellHook = ''
            echo "network_probe_sim dev shell ready"
            echo "  bun: $(bun --version)"
            echo "  node: $(node --version)"
          '';
        };
      });
}
