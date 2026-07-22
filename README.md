# Joaquin de Castro — Personal Website

A framework-free static portfolio designed for GitHub Pages. The site includes:

- A broad personal homepage with a rotating research-interest line
- An edge-integrated Ivy photograph in the hero rather than a separate card
- A compact **Now & Previously** résumé chronology
- A real-photo **Ivy & Lady** gallery
- A separate interactive research atlas with visual explanations
- Synthetic, clearly labeled visualizations for supernova classification, quantum variational rewinding, and resilient quantum systems
- Light and dark themes
- Responsive layouts, keyboard-accessible controls, reduced-motion support, print styles, metadata, and a downloadable résumé

## Preview locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Cat photographs

The selected and web-optimized photographs are already included under `assets/cats/`:

- `ivy-and-lady-hero.jpg` — Ivy and Lady sleeping together in the bottom-right homepage hero
- `ivy-and-lady-sleeping.jpg` — featured gallery photograph
- `ivy-bag.jpg` — Ivy gallery photograph
- `lady-perched.jpg` — Lady gallery photograph
- `ivy-and-joaquin.jpg` — personal gallery photograph

The source uploads remain untouched outside this website folder.

## Deploy with GitHub Pages

1. Create a public repository, ideally `joaquindecastro.github.io`.
2. Upload the contents of this folder to the repository root.
3. Open **Settings → Pages** in GitHub.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then save.

For a repository named `joaquindecastro.github.io`, the site will appear at `https://joaquindecastro.github.io/`. For another repository name, it will appear under `https://joaquindecastro.github.io/<repository-name>/`.

## Customize before publishing

Review these items before launch:

- Current experience and role wording in `index.html`
- Research explanations in `research.html`
- Contact, LinkedIn, GitHub, and résumé links
- The canonical site URL in the JSON-LD block inside `index.html`

The research figures use synthetic data and are explicitly labeled as illustrative. Replace them with publication data only when you are comfortable publishing that data.
