# UrbanGround Unity Web deployment

This staging directory is generated from `Builds/Web` and is intended to be
copied into the `play/` directory of the UrbanGround GitHub Pages repository.

The Unity build uses WebAssembly, WebGL 2, multithreading (`SharedArrayBuffer`),
and the same Unity scene, PhysX collision, Cesium tiles, tasks, and controls as
the desktop application. Unity's browser-side Brotli decompression fallback
makes the compressed files compatible with static hosting. The vendored
`coi-serviceworker.js` supplies cross-origin isolation on GitHub Pages.

The optimized `Web.data.unityweb` archive is small enough for normal Git. The
Pages workflow verifies its SHA-256 before publication.

`coi-serviceworker.js` is version 0.1.7 by Guido Zuidhof and contributors and
is redistributed under the MIT License. See the attribution header in that
file and <https://github.com/gzuidhof/coi-serviceworker>.
