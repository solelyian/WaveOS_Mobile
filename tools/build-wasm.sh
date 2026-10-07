#!/bin/sh
# build-wasm.sh — compile wavecore (C) + wavegfx (C++) en un seul waveos.wasm
# Toolchain : zig (clang+lld intégrés, backend wasm32-freestanding).
# Usage : sh tools/build-wasm.sh [chemin/zig]
set -e
cd "$(dirname "$0")/.."

ZIG="${1:-${ZIG:-$HOME/tools/zig/zig}}"
OUT=public/waveos.wasm
mkdir -p public build

FLAGS="-target wasm32-freestanding -O3 -fno-exceptions -Inative"

echo "[wasm] cc native/wavecore.c"
"$ZIG" cc $FLAGS -c native/wavecore.c -o build/wavecore.o

echo "[wasm] c++ native/wavegfx.cpp"
"$ZIG" c++ $FLAGS -fno-rtti -c native/wavegfx.cpp -o build/wavegfx.o

echo "[wasm] ld -> $OUT"
"$ZIG" wasm-ld --no-entry --export-all -o "$OUT" build/wavecore.o build/wavegfx.o

ls -la "$OUT"
