<p align="center">
  <img src="public/sauce.svg" width="120" alt="Sauce logo" />
</p>

<h1 align="center">Sauce</h1>

<p align="center">
  Search GitHub repositories by keywords & • Summarize open issues instantly • Find the perfect place to contribute
</p>

<p align="center">
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/built_with-Next.js-000?logo=next.js" alt="Next.js" />
  </a>
  <a href="https://mui.com/">
    <img src="https://img.shields.io/badge/ui-MUI-007FFF?logo=mui" alt="MUI" />
  </a>
  <a href="https://openai.com/">
    <img src="https://img.shields.io/badge/powered_by-OpenAI-412991?logo=openai&logoColor=white" alt="OpenAI" />
  </a>
</p>

---

## ✨ Features

• **Repository Search** – enter free-text keywords (rendered as chips) to find popular repos whose README matches the terms.

• **Issue Summarization** – paste any GitHub repo URL and get an AI-generated overview of top issues to start contributing.

• **Copy-to-Clipboard** – one-click copy for repo URL.

• **Pagination** – results show 10 repos per page for a smooth UX.

• **Glassmorphic UI** – sleek cards & buttons with subtle gradients and shadows.

• **Rate-Limited API** – basic IP rate-limit & same-origin checks to protect the backend.

## 🚀 Getting Started

```bash
# 1. Install deps
npm install

# 2. Create environment vars
cp .env.example .env.local
# then add:
# GITHUB_TOKEN=<your-personal-access-token>
# OPENAI_API_KEY=<your-openai-key>
# WEB_ORIGIN=http://localhost:3000

# 3. Run dev server
npm run dev
```

Open `http://localhost:3000` and start exploring!

## 📂 Project Structure

```
├─ components/       # Reusable UI pieces
├─ pages/            # Next.js routes & API
│  ├─ api/           # Serverless API (GitHub, OpenAI)
│  └─ index.tsx      # Home page
├─ public/           # Static assets (logo, favicons, …)
└─ utils/            # Rate-limiter, helpers
```

## 🛠️ Tech Stack

* **Next.js** – React framework for hybrid static & server-side rendering.
* **TypeScript** – typed JavaScript.
* **Material-UI (MUI)** – component library.
* **GitHub REST API** – repo & issue data.
* **OpenAI API** – GPT-powered summaries.

## 🤝 Contributing

Found a bug or have an idea? Feel free to open an issue or PR – contributions of all kinds are welcome!

1. Fork the repo and create your branch (`git checkout -b feature/awesome-feature`).
2. Commit your changes (`git commit -m 'Add awesome feature'`).
3. Push to the branch (`git push origin feature/awesome-feature`).
4. Open a Pull Request.

## 📄 License

[MIT](LICENSE) © 2025 Harris Beg


This is the starter project for the fullstack tutorial with Next.js and Prisma. You can find the final version of this project in the [`final`](https://github.com/prisma/blogr-nextjs-prisma/tree/final) branch of this repo.
