# UrbanGround project page

Static project page for **UrbanGround: From Local Perception to Spatial Agency in a Real-Scale City**.

## Local preview

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/`.

## Content that remains intentionally provisional

- The arXiv/PDF link is marked as coming soon.
- The code and application releases are linked from the project repository.
- No benchmark result or model ranking is published before the final evaluation is complete.

## Updating the publication links

Search `index.html` for `coming soon` and replace the paper button and arXiv status with the final URL. The code link appears in the navigation, hero, and footer.

## Deployment

This repository is designed for the special GitHub Pages account repository
`UrbanArena/UrbanArena.github.io`. GitHub Actions publishes the paper website
and verifies the Unity WebAssembly game assets under `/play/`. Configure
**Settings → Pages → Source** as **GitHub Actions**, then
push the default `main` branch.

The browser game is compiled from the Unity project, not reimplemented in
JavaScript. Its service worker supplies the cross-origin isolation required by
the multithreaded PhysX Player on GitHub Pages. The first visit may reload once
while that worker is installed.
