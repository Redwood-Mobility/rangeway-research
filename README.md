# Rangeway Research

AI-powered research engine for EV charging and hospitality insights.

## Deploy to GitHub Pages

1. Create a new repository on GitHub named `rangeway-research`
2. Push this code to the repository
3. Go to Settings → Pages
4. Set Source to "Deploy from a branch"
5. Select `main` branch and `/ (root)` folder
6. Click Save

Your site will be available at: `https://yourusername.github.io/rangeway-research`

## Local Development

```bash
# Install dependencies
bundle install

# Run locally
bundle exec jekyll serve
```

Then open http://localhost:4000/rangeway-research

## Architecture

```
User → Jekyll Site (GitHub Pages) → n8n Webhook → Perplexity AI
```
