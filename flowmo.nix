with import <nixpkgs> {}; {
     flowmoEnv = stdenv.mkDerivation {
       name = "flowmo";
       buildInputs = [ stdenv ];
     };
   }
