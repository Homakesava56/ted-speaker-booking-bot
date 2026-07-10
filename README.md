# AI TED Talk Booking Bot

An interactive academic project that helps users:

- Browse TED Talk topics
- View matching speaker details
- Confirm a speaker
- Enter booking information one question at a time
- Generate a booking request summary

## Project Files

- `index.html` — Main webpage
- `style.css` — Website design
- `script.js` — Interactive chatbot logic
- `speakers.json` — Speaker profiles and topics

## Run Locally

Because the project loads `speakers.json`, open it through a local web server instead of double-clicking `index.html`.

### Option 1: Python

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 2: Visual Studio Code

Install the **Live Server** extension, right-click `index.html`, and select **Open with Live Server**.

## Publish with GitHub Pages

1. Create a new public GitHub repository.
2. Upload all four project files to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose the `main` branch and `/ (root)` folder.
6. Click **Save**.
7. Your site will be published at:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY-NAME/
```

## Important

This is an academic prototype. A generated booking request does not confirm speaker availability or final pricing.
