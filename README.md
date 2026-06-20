# 🛍️ Mega AI Bazaar

> The front door to all the bazaars — browse, search, and submit AI building blocks in one place.

**Live site:** https://drvivek34.github.io/Mega-AI-Bazaar/

This is the landing site (GitHub Pages) that ties together every bazaar:

| Bazaar | What's inside | Repo |
|---|---|---|
| 🛒 Skill Bazaar | AI Agent Skills (SKILL.md) | [Skill-Bazaar](https://github.com/Drvivek34/Skill-Bazaar) |
| 🔌 MCP Bazaar | Model Context Protocol servers | [MCP-Bazaar](https://github.com/Drvivek34/MCP-Bazaar) |
| 📝 Custom Instruction Bazaar | System prompts / custom instructions | [Custom-Instruction-Bazaar](https://github.com/Drvivek34/Custom-Instruction-Bazaar) |
| ⚡ Slash Command Bazaar | Slash commands for AI CLIs | [Slash-Command-Bazaar](https://github.com/Drvivek34/Slash-Command-Bazaar) |
| 🆓 Free API Bazaar | Free LLM & AI APIs | [Free-API-Bazaar](https://github.com/Drvivek34/Free-API-Bazaar) |
| 🛡️ Jailbreak Bazaar | LLM red-team research + defenses | [Jailbreak-Bazaar](https://github.com/Drvivek34/Jailbreak-Bazaar) |
| ∞ Loop Bazaar | 5,000+ repeatable AI agent loops | [Loop-Bazaar](https://github.com/Drvivek34/Loop-Bazaar) |
| ⚙️ Automation Bazaar | n8n / Make / Zapier / cron automations | [Automation-Bazaar](https://github.com/Drvivek34/Automation-Bazaar) |

## What's here
- `index.html`, `style.css`, `app.js` — the static site (cards + client-side search).
- `bazaars.json` — the source of truth the site renders. **To add/rename a bazaar, edit this file.**
- `CNAME.example` — rename to `CNAME` to attach a custom subdomain (e.g. `mega.medh.ai.cloud`).

_(Automation schedules + agent goals are kept in a separate **private** ops repo, not here.)_

## Enabling the site
GitHub Pages → Deploy from branch → `main` / root. (`.nojekyll` is included so all files are served as-is.)

## Custom domain (later)
This site has **no custom domain yet**. To attach one:
1. `cp CNAME.example CNAME`, set it to your subdomain (e.g. `mega.medh.ai.cloud`).
2. Add a DNS `CNAME` record pointing that subdomain to `drvivek34.github.io`.
3. Set the custom domain in repo Settings → Pages.

---
Part of the Mega AI Bazaar family. Contributions welcome via each bazaar's submission form.
