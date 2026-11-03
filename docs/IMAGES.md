# Adding photos (guest headshots + studio / BTS)

The site renders graceful fallbacks until real photos exist, so everything below
can be done incrementally. All images are local files under `public/`.

## Guest photos (headshots or Seth-with-guest shots)

1. Export the photo (ideally portrait, ~4:5, min 800px wide, `.jpg`).
2. Save it to `public/people/<guest-slug>.jpg`
   (the slug is the folder name in the URL, e.g. `/guests/jon-gordon` → `jon-gordon`).
3. In `data/guests.json`, add `"imageUrl": "/people/<guest-slug>.jpg"` to that guest.

Until `imageUrl` is set, the guest shows an initials monogram (e.g. "JG").
The photo appears on the guests grid and the guest's detail page automatically.

## Studio / behind-the-scenes strip ("From the studio")

1. Export the frame(s) — landscape works best for a single hero shot; a few
   portrait frames tile into a grid.
2. Save to `public/studio/<name>.jpg`.
3. In `lib/content.ts`, add entries to `STUDIO_PHOTOS`:
   ```ts
   export const STUDIO_PHOTOS = [
     { src: "/studio/seth-recording.jpg", alt: "Seth Pepper recording in the studio" },
   ];
   ```

The "From the studio" homepage band stays hidden while `STUDIO_PHOTOS` is empty
and appears once at least one photo is listed.

## Handoff note

Photos are coming from Seth's Instagram via Google Drive. Pull the chosen files
from the shared Drive folder, drop them into `public/people/` and `public/studio/`
with the names above, then wire them in per the steps here.
