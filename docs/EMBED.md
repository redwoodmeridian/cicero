# Put Cicero on your website (any platform)

Once `kit/web` is deployed, it serves a **universal embed** at `/embed.js`. Add one line and the
floating "Talk to us" bubble appears on your site. The mic works on any HTTPS page. Your API key
never touches the browser (the widget mints short-lived tokens server-side).

```html
<script src="https://YOUR-DEPLOY.up.railway.app/embed.js" defer></script>
```
Customize on the tag: `data-label="Talk to us"` · `data-color="#c8102e"` · `data-position="left"`.

## Per-platform install

**WordPress** — easiest: install the free **WPCode** or **Insert Headers and Footers** plugin →
paste the script in the **Footer**. Or add a **Custom HTML** block in your footer widget, or drop it
before `</body>` in your theme's `footer.php` (child theme recommended).

**Squarespace** — Settings → Advanced → **Code Injection** → Footer → paste → Save.

**Wix** — Settings → **Custom Code** → + Add Code → paste → Place in **Body – end**, apply to **All
pages** → Apply.

**Webflow** — Project Settings → **Custom Code** → Footer Code → paste → Save → Publish.

**Shopify** — Online Store → Themes → Edit code → `theme.liquid` → paste before `</body>` → Save.

**GoDaddy / Weebly / other builders** — look for "Add HTML/embed" or "Custom code / Footer" and paste.

**Google Tag Manager** — new **Custom HTML** tag → paste → trigger **All Pages** → publish.

**Raw HTML site** — paste before `</body>` on every page (or in a shared include/footer partial).

**Next.js / React site** — either use the script tag above, or import the component directly:
copy `components/voice-widget.tsx` into your app and point its `fetch("/api/voice-token")` and
`fetch("/api/book")` at your deployed `kit/web` origin. Enable CORS on those two routes for your
domain if cross-origin.

## Test
Open your live site (must be HTTPS). Click the bubble → the widget opens, greets you, and one tap on
the mic starts the conversation. Run a booking and confirm it hits your calendar.

## Tips
- The popup **hook** is what makes people click — set a strong one in `firm.config.json` (`"hook"`).
- Prefer a subdomain instead? Host `kit/web` at `talk.yourfirm.com` and link your "Contact" button there.
