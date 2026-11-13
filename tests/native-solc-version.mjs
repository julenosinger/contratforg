// Classifies a `solc --version` string as a native binary or not. The native builds report a platform and a compiler
// (e.g. "0.8.24+commit.e11b9ed9.Linux.g++", "…Darwin.appleclang", "…Windows.msvc"); the Emscripten build reports
// "…Emscripten.clang" and is the same wasm soljson the vendor directory already ships, so it must never be mistaken for
// an independent native oracle.
export function isNativeSolcVersion(version) {
  const v = String(version || '');
  if (/Emscripten/i.test(v)) return false;
  return /\.(Linux|Darwin|Windows|FreeBSD)\.(g\+\+|appleclang|msvc|mingw|musl|clang)/i.test(v);
}
