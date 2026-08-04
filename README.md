# TGC1HUB NOS — Catalog Site

A static, no-build product catalog for TGC1HUB NOS: plain HTML/CSS/JS, live data from Supabase, images from Cloudflare R2, and Messenger/WhatsApp/Viber contact built in.

## Open it

No build step needed. Just open `index.html` in a browser, or in VS Code use the **Live Server** extension (right-click `index.html` → "Open with Live Server") so `fetch()` works the same way it will once deployed.

## Project structure

```
tgc1hub-nos-catalog/
├── index.html        ← page structure only
├── css/styles.css     ← all colors, layout, and styling
├── js/config.js       ← EVERYTHING you'll want to edit (keys, contact info, copy)
├── js/app.js           ← logic — shouldn't need to touch this for normal edits
└── README.md
```

## First thing to check: your Supabase table

The site expects a table (default name `products`) that anyone (not logged in) can `SELECT` from. In the Supabase dashboard:

1. **Table Editor → products → RLS** — make sure Row Level Security has a policy like:
   ```sql
   create policy "Public read access"
   on products for select
   using (true);
   ```
   Without this, the site will load and show a "Couldn't load the catalog" message even if the table has data.

2. **Column names** — the site looks for these columns (with common fallback names it'll try automatically):

   | Purpose | Default column | Also accepts |
   |---|---|---|
   | Part number / SKU | `part_number` | `sku`, `code`, `chassis_code`, `model_code` |
   | Product name | `name` | `title`, `product_name` |
   | Category | `category` | `type`, `part_type` |
   | Compatible chassis/models | `compatibility` | `compatible_models`, `fitment_codes`, `chassis`, `tags` |
   | Fitment description | `fitment` | `fitment_description`, `notes`, `description` |
   | Status | `status` | `availability`, `stock`, `in_stock` |
   | Image | `image_path` | `image_url`, `image`, `photo`, `photo_url` |
   | Location tag | `location` | `location_tag`, `branch`, `bodega` |

   `compatibility` can be a comma-separated string (`"NCP10, NCP13, Echo 2002"`) or a Postgres array column — both work.

   `status` can be `"available"` / `"sold_out"` (text), or a boolean/number — the site figures out sold-out vs. available either way.

   If your real column names are different, just edit the arrays in `js/config.js` under `fieldAliases` — no need to touch `app.js`.

3. **Images** — store either a full URL, or a path relative to your R2 bucket (e.g. `parts/db1378.jpg`), which gets combined with `r2BaseUrl` automatically. Make sure the R2 bucket/objects are set to public (which yours already is, since you gave a `pub-...r2.dev` URL).

### Example row

```json
{
  "part_number": "DB1378",
  "name": "Bendix Brake Pad Toyota Echo / Vitz",
  "category": "Brake Pad",
  "compatibility": "NCP10, NCP13, Echo 2002",
  "fitment": "Toyota Echo 1999-2005 / Vitz NCP13",
  "status": "sold_out",
  "image_path": "parts/db1378.jpg",
  "location": "Talipapa QC"
}
```

## Everything else you can edit — `js/config.js`

- **`business`** — address, phone, hours, tagline
- **`contact`** — Messenger URL, FB page, WhatsApp/Viber numbers (local PH format is fine, converted automatically)
- **`proof`** — the "proof of legit" showcase in the hero banner. Set `useLatestSoldOut: true` to auto-pull your most recent sold-out item, or `false` to always show the fixed fallback text
- **`why.cards`** — the 4 trust cards (video call, receipt, delivery, rating)
- **`orderSteps`** — the numbered "Paano Mag-Order" list in the footer

## Colors & styling

All colors live as CSS variables at the top of `css/styles.css`:

```css
--navy: #0B1220;   /* dark sections: top bar, hero, why-section, footer accents */
--red:  #E0293B;   /* primary accent — buttons, badges, highlights */
--green:#17A673;   /* "Available" status */
```

Change these and the whole site follows.

## Deploying

This is a static site — no server/backend to run. Drop the folder onto any static host:
- **Netlify / Vercel**: drag-and-drop the folder, or connect the repo
- **GitHub Pages**: push to a repo, enable Pages on the `main` branch
- **Cloudflare Pages**: since you're already on Cloudflare for R2, this pairs naturally

## Notes

- The floating Messenger/WhatsApp/Viber button (bottom-right) is site-wide and independent of the database.
- The quick-filter chips are generated automatically from whatever part numbers and compatibility codes exist in your table — no need to hand-maintain a chip list.
- If the table is empty or unreachable, shoppers see a friendly message; a collapsible "Technical details" note (for you) explains the likely cause.
