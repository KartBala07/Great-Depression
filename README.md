# 🛠️ The Inventor's Gamble

*A Great Depression inventor simulator — survive the decade and build something the world can't ignore.*

It's October 1929. The stock market just collapsed. You have a workbench, a head
full of ideas, and the worst economy in living memory. Pick an invention to
dedicate your life to, then steer it through ten brutal years of dust, bank runs,
rivals, and the occasional flicker of hope.

## Play it online

This repo deploys itself to **GitHub Pages**. Once Pages is enabled
(Settings → Pages → Source: **GitHub Actions**), every push publishes the
live site, and the URL appears in the Actions run summary — typically:

```
https://<your-username>.github.io/Great-Depression/
```

## Play it locally

No build step, no dependencies. Just open the game in a browser:

```bash
# from the repo root
open index.html        # macOS
xdg-open index.html    # Linux
# or simply double-click index.html
```

You can also serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## How it works

- **You're an inventor in 1929.** Choose one of five inventions to build — a cheap
  radio, a dust-bowl plow, an electric icebox, a mold-grown medicine, or synthetic
  silk. Each plays differently.
- **Each turn is a season.** You take **one action** per season:
  - 🔬 **Research** — push your design forward (progress up, morale down)
  - 🔨 **Build Prototype** — spend cash for a big leap in progress
  - 📈 **Hustle & Sell** — turn progress + reputation into cash
  - 🪚 **Odd Jobs** — reliable income, no progress
  - ☕ **Rest** — restore morale
- **Four meters matter:** 💵 Cash, ❤️ Morale, 🤝 Reputation, and ⚙️ Progress.
  Rent and food chip away at your cash every season — winters are worst.
- **Real history strikes.** Each year brings an actual event from the Great
  Depression — Black Tuesday, the Smoot-Hawley Tariff, bank runs, the New Deal,
  the Dust Bowl, the Heat Wave of '36, the 1937 recession, and the 1939 World's
  Fair — each with a choice that shapes your story. Random events (a hungry
  drifter, a patron's offer, a 3 a.m. breakthrough) fill the quiet seasons.

## How to win (and lose)

- **Win:** get your invention's Progress to **100%** before 1940.
- **Lose:** let **Cash** or **Morale** hit zero.
- **Survive:** reach 1940 unfinished and you still earn a survivor's ending —
  with a rank based on how far you got.

Built with plain HTML, CSS, and JavaScript. Every playthrough tells a slightly
different story.
