# Cyoptmic website

Next.js 16 · React 19 · Tailwind CSS v4 · GSAP (ScrollTrigger) · Lenis · Three.js + React Three Fiber

## Run it

Node is installed at `~/.local/node` (not on your PATH yet). Add this line to `~/.zshrc` once:

    export PATH="$HOME/.local/node/bin:$PATH"

Then:

    npm run dev      # http://localhost:3000
    npm run build    # production build

## Where things are

- `lib/content.ts`: all copy, build steps, values, services, projects and contact details. Edit text here.
- `lib/sky.ts`: the hero sky layout: sun position, planet orbits, planet looks (one planet per service, same order as `services` in `content.ts`), telescope size and position.
- `components/sky/Sky.tsx`: the hero sky: stars, sun, planets, the draggable telescope view, the readout card and the "planets found" counter.
- `components/sky/SkyScene.tsx`: the 3D astronaut, telescope, moon and flag (Three.js, built from simple shapes), loaded once the browser is idle.
- Colours: the dark palette lives at the top of `app/globals.css`. Add `class="light"` to anything that should stay light (used for the app mock-ups).
- `components/Build.tsx`: the pinned "From an idea to a product" section (7 steps, progress counter).
- `components/Hero.tsx`, `Nav.tsx` (X-ray mode + menu), `Rulers.tsx`, `Sections.tsx` (everything below the build).
- X-ray mode: add `data-x="Label"` and `data-note="Why it looks like this"` to any element.

## Using the telescope

Drag the round view across the sky; the astronaut turns the telescope to follow it. From far away the planets look like stars.
Through the telescope each one shows up close with its service name, and a card shows the details. Hold it on a planet
for half a second to log it; once it has a planet in view it keeps tracking it.
Double-click the view to send it back. Arrow keys move it, Enter jumps to the next planet you haven't found.
Click the "planets found" counter to point the telescope at the next one.

## Before going live

- Replace the testimonial placeholder in `lib/content.ts` with a real, approved quote.
- Replace the generated project previews (`Screen` in `Sections.tsx`) with real screenshots.
- Add the real Instagram, LinkedIn and X URLs in `lib/content.ts`.

## iCloud note

This folder lives in iCloud. `node_modules` is a symlink to `node_modules.nosync`, and the build output
goes to `.next.nosync`, so iCloud skips both. `npm install` may replace the symlink with a real
folder. If it does, run:

    rm -rf node_modules.nosync && mv node_modules node_modules.nosync && ln -s node_modules.nosync node_modules
