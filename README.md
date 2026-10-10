# InstPrint

InstPrint is a static front-end marketplace prototype for connecting customers with home-based printer owners in Singapore.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Browser localStorage for demo persistence
- No build step required

## Files in this project

- `index.html` — app shell and sections
- `styles.css` — responsive design and market styling
- `app.js` — demo logic for browsing, checkout, dashboards, and localStorage
- `data.js` — default sample data and configuration
- `README.md` — setup and GitHub Pages instructions

## Prototype limitations

This is a front-end prototype only. It does not include:

- Real payments
- Real user authentication
- A real backend or shared database
- Secure storage of sensitive files
- Real-time collaboration between browsers

All listings and orders are stored in the current browser's localStorage. The app is intended for demonstration and learning, not production deployment.

## Local usage

1. Download or clone the repository.
2. Open `index.html` directly in a browser.
3. The app should work without any installation or dependency install step.

## GitHub Pages deployment

1. Create a GitHub repository named `printnear`.
2. Upload the five project files to the repository root.
3. In GitHub, open the repository and go to `Settings`.
4. Select `Pages` from the left sidebar.
5. Under `Build and deployment`, choose `Deploy from a branch`.
6. Select the `main` branch and the `/` root folder.
7. Save the settings.
8. GitHub will publish the site and provide a URL in the format:

   `https://YOUR-USERNAME.github.io/printnear/`

9. Update the files and push changes to redeploy.

## Optional GitHub Actions workflow

You can also add a GitHub Actions workflow to publish the static site automatically from the repository root.

```yaml
name: Deploy static site to Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Notes

- Use descriptive, temporary customer-upload names only.
- Uploaded PDFs are kept only in browser memory for this prototype session.
- Do not store real payment details or sensitive personal records in localStorage.

## Brand

- Brand slogan: `Print nearby. Earn from your printer.`
- Target market: Singapore
- Currency: SGD

## Demo support

This prototype includes:

- Printer search and demo filters
- LocalOwner registration
- Price and commission calculation
- Demo checkout simulation
- Demo order tracking and status advancement
- Admin and owner dashboards

Everything is browser-based and intentionally simple for easy understanding and extension.
