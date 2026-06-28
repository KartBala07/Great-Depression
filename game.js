/* =====================================================================
   THE INVENTOR'S GAMBLE
   A Great Depression inventor simulator (1929–1939).
   Vanilla JS, no dependencies.
   ===================================================================== */

(() => {
  "use strict";

  // ---- Inventions: each is a different "build" with strengths/weaknesses ----
  const INVENTIONS = [
    {
      id: "radio",
      icon: "📻",
      name: "The People's Radio",
      desc: "A cheap radio set so families can hear FDR's fireside chats and forget their troubles for an hour.",
      trait: "Reputation comes easy — everyone wants in.",
      mod: { repGain: 1.4, sellGain: 1.0, researchCost: 1.0 },
    },
    {
      id: "tractor",
      icon: "🚜",
      name: "The Dust-Bowl Plow",
      desc: "A soil-saving plow that could keep the Great Plains from blowing away in the wind.",
      trait: "Slow to build, but sells big to desperate farmers.",
      mod: { repGain: 1.0, sellGain: 1.5, researchCost: 1.2 },
    },
    {
      id: "fridge",
      icon: "🧊",
      name: "The Iceless Icebox",
      desc: "An affordable electric refrigerator to end the daily race against melting ice.",
      trait: "Expensive prototypes, but a fortune if you finish.",
      mod: { repGain: 1.0, sellGain: 1.3, researchCost: 1.0, protoCost: 1.4 },
    },
    {
      id: "penicillin",
      icon: "💊",
      name: "The Miracle Mold",
      desc: "A medicine grown from mold that might cure infections the world thinks are death sentences.",
      trait: "Brutal research, but pure legend if it works.",
      mod: { repGain: 1.2, sellGain: 0.8, researchCost: 1.5, progBonus: 1.3 },
    },
    {
      id: "nylon",
      icon: "🧵",
      name: "Synthetic Silk",
      desc: "A fabric spun from chemistry instead of silkworms — stockings the whole country will crave.",
      trait: "Balanced and dependable. A steady gamble.",
      mod: { repGain: 1.1, sellGain: 1.1, researchCost: 1.0 },
    },
  ];

  const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];

  // ---- Scripted historical events keyed by year, with player choices ----
  // Each: {title, icon, body, choices:[{label, hint, apply(g)->resultText}]}
  const HISTORY = {
    "1929-Autumn": {
      title: "Black Tuesday",
      icon: "📉",
      body: "October 29th. The stock market collapses. Fortunes vanish in an afternoon. The men in fine suits look as scared as everyone else now. Your savings are thin, but your workbench is paid for.",
      choices: [
        {
          label: "Pull your money from the bank now",
          hint: "Safe, but you lose a little to the panic.",
          apply: (g) => { change(g, { cash: -15 }); return "You join the line at dawn and walk home with most of your cash in a coffee tin. Better safe."; },
        },
        {
          label: "Keep your faith in the bank",
          hint: "A gamble on stability.",
          apply: (g) => {
            if (Math.random() < 0.5) { change(g, { cash: -60, morale: -10 }); return "Weeks later the bank's doors are chained shut. Much of your money is simply gone."; }
            change(g, { cash: 10, morale: 5 }); return "Your bank holds — for now. You even earn a little interest. Luck favors the patient.";
          },
        },
      ],
    },
    "1930-Summer": {
      title: "The Smoot-Hawley Tariff",
      icon: "🏛️",
      body: "Congress slaps huge tariffs on imported goods. Prices for parts and materials lurch upward. Some say it will protect American workers; others say it will choke world trade dead.",
      choices: [
        {
          label: "Stockpile materials before prices climb",
          hint: "Spend now to save later.",
          apply: (g) => { change(g, { cash: -25, progress: 6 }); return "You fill your shed with copper, wire, and timber. Costly today, but your next builds will fly."; },
        },
        {
          label: "Make do with what you have",
          hint: "Frugal, but slower going.",
          apply: (g) => { change(g, { morale: -4 }); return "You scrape by with scraps and salvage. Every screw is precious."; },
        },
      ],
    },
    "1931-Winter": {
      title: "The Bank Runs Spread",
      icon: "🏦",
      body: "Thousands of banks have failed. A neighbor pounds on your door — the whole street is rushing to withdraw before the local bank goes under. Do you trust the rumor?",
      choices: [
        {
          label: "Run with the crowd",
          hint: "Protect your cash from collapse.",
          apply: (g) => { change(g, { cash: 5 }); return "You get your money out just before the teller's window slams shut. Relief washes over you."; },
        },
        {
          label: "Lend $40 to the panicked neighbor",
          hint: "Risky kindness — reputation at stake.",
          apply: (g) => { change(g, { cash: -40, rep: 12, morale: 8 }); return "You press your savings into his shaking hands. Word spreads that you're a person to be trusted."; },
        },
      ],
    },
    "1933-Spring": {
      title: "The New Deal Begins",
      icon: "🎙️",
      body: "FDR takes office and declares a Bank Holiday. 'The only thing we have to fear is fear itself.' New federal programs promise work and loans. For the first time in years, the air smells like hope.",
      choices: [
        {
          label: "Apply for a government innovation grant",
          hint: "Reputation pays off — or doesn't.",
          apply: (g) => {
            if (g.rep >= 25) { change(g, { cash: 70, morale: 12 }); return "Your name carries weight. A WPA administrator funds your work. A windfall!"; }
            change(g, { morale: -3 }); return "Your application is filed under 'unknowns.' Maybe next time you'll have a name worth knowing.";
          },
        },
        {
          label: "Take a steady WPA construction job",
          hint: "Guaranteed income, but time away from the bench.",
          apply: (g) => { change(g, { cash: 45, progress: -4 }); return "You spend the season pouring concrete for a new bridge. Honest pay, but your invention gathers dust."; },
        },
      ],
    },
    "1934-Summer": {
      title: "The Dust Bowl",
      icon: "🌪️",
      body: "A black blizzard of topsoil rolls across the plains, blotting out the sun at noon. Dust seeps through every crack in the workshop, fouling your tools and your lungs.",
      choices: [
        {
          label: "Seal the workshop and ride it out",
          hint: "Spend cash to protect your work.",
          apply: (g) => { change(g, { cash: -20, morale: -3 }); return "You tack wet sheets over every window. The dust still finds you, but your prototype survives."; },
        },
        {
          label: "Keep working through the storm",
          hint: "Tough it out — at a cost to your health.",
          apply: (g) => { change(g, { morale: -14, progress: 5 }); return "You work with a rag tied over your face, coughing grit. You make progress, but it costs your body dearly."; },
        },
      ],
    },
    "1935-Autumn": {
      title: "A Rival Appears",
      icon: "🎩",
      body: "A well-funded competitor has been seen demonstrating something suspiciously like your invention to investors downtown. The race is suddenly very real.",
      choices: [
        {
          label: "Rush a public demonstration of your own",
          hint: "Big reputation swing, win or lose.",
          apply: (g) => {
            if (g.progress >= 45) { change(g, { rep: 20, morale: 8, cash: 15 }); return "Your demo dazzles the crowd. The rival looks rattled. The press loves an underdog."; }
            change(g, { rep: -12, morale: -8 }); return "Your half-finished device sputters and dies in front of everyone. Humiliating. You'll have to earn that trust back.";
          },
        },
        {
          label: "Quietly out-engineer them",
          hint: "Heads down — pure progress.",
          apply: (g) => { change(g, { progress: 10, morale: -4 }); return "You ignore the noise and bury yourself in the work. Let the design speak for itself."; },
        },
      ],
    },
    "1936-Summer": {
      title: "The Heat Wave of '36",
      icon: "🔥",
      body: "The worst heat wave in American history bakes the country. Thousands die. Your workshop is an oven, and ice is worth its weight in gold.",
      choices: [
        {
          label: "Sell cold relief to neighbors",
          hint: "Profit from your ingenuity.",
          apply: (g) => { change(g, { cash: 30, rep: 6 }); return "You rig a crude evaporative cooler and charge a nickel a sit. The line stretches down the block."; },
        },
        {
          label: "Give the cooling away for free",
          hint: "Goodwill over gold.",
          apply: (g) => { change(g, { rep: 16, morale: 10, cash: -5 }); return "You open your doors to anyone who needs to escape the heat. The whole neighborhood remembers your kindness."; },
        },
      ],
    },
    "1937-Spring": {
      title: "The Recession Within the Depression",
      icon: "📊",
      body: "Just as things were improving, the economy lurches downward again. Federal spending is cut, jobs vanish a second time, and despair returns to the breadlines.",
      choices: [
        {
          label: "Tighten your belt and conserve",
          hint: "Safe but disheartening.",
          apply: (g) => { change(g, { cash: 10, morale: -8 }); return "You cut every expense to the bone. Beans for supper again. But the coffee tin grows a little heavier."; },
        },
        {
          label: "Double down — invest in your invention",
          hint: "Bold faith in your work.",
          apply: (g) => { change(g, { cash: -30, progress: 14 }); return "While others retreat, you push forward. If you survive this, you'll be far ahead."; },
        },
      ],
    },
    "1939-Spring": {
      title: "The World's Fair",
      icon: "🎡",
      body: "The 1939 New York World's Fair opens with the theme 'The World of Tomorrow.' Inventors from everywhere gather to show the future. A booth could make your name — for a price.",
      choices: [
        {
          label: "Buy a booth at the Fair",
          hint: "Costly, but a stage like no other.",
          apply: (g) => { change(g, { cash: -35, rep: 25, progress: 8 }); return "Under the great Trylon and Perisphere, crowds gather at your booth. This is the moment you dreamed of."; },
        },
        {
          label: "Watch from the crowd and learn",
          hint: "Cheap inspiration.",
          apply: (g) => { change(g, { morale: 10, progress: 5 }); return "You wander the exhibits, scribbling notes by lamplight. Tomorrow suddenly feels possible."; },
        },
      ],
    },
  };

  // ---- Random (non-scripted) flavor events for variety ----
  const RANDOM_EVENTS = [
    {
      title: "A Hungry Knock",
      icon: "🍞",
      body: "A gaunt drifter knocks, offering an honest day's labor for a meal. He says he was an engineer, once.",
      choices: [
        { label: "Feed him and hear his story", hint: "−Cash, +Morale, chance of insight",
          apply: (g) => { change(g, { cash: -8, morale: 6 }); if (Math.random() < 0.5) { change(g, { progress: 7 }); return "Over soup he sketches a clever fix for your design. Genius shares a table with the hungry."; } return "You share what little you have. He moves on at dawn, tipping his cap. Some kindness is its own reward."; } },
        { label: "Turn him away", hint: "Keep your resources, lose a little heart",
          apply: (g) => { change(g, { morale: -5 }); return "You shut the door on his hollow eyes. It stays with you all night."; } },
      ],
    },
    {
      title: "Newspaper Headline",
      icon: "📰",
      body: "A reporter wants to write a story about the 'tinkerer on the edge of town.' Publicity is a double-edged thing.",
      choices: [
        { label: "Give the interview", hint: "+Reputation, reveals you to rivals",
          apply: (g) => { change(g, { rep: 10, progress: -2 }); return "The morning edition runs your photo. Strangers wave at you on the street."; } },
        { label: "Keep your secrets", hint: "Stay quiet, stay safe",
          apply: (g) => { change(g, { morale: 3, progress: 4 }); return "You decline politely and get back to work, undisturbed."; } },
      ],
    },
    {
      title: "A Patron's Offer",
      icon: "💼",
      body: "A businessman in a clean suit offers cash for a controlling share of your invention. He smells profit.",
      choices: [
        { label: "Take the money", hint: "+Cash now, −Reputation as your own",
          apply: (g) => { change(g, { cash: 50, rep: -8 }); return "You sign. The cash is real and immediate — but it's his name on the contract now."; } },
        { label: "Refuse — it's yours alone", hint: "+Morale, +future reputation",
          apply: (g) => { change(g, { morale: 8, rep: 4 }); return "You show him the door. This dream is not for sale. You sleep better for it."; } },
      ],
    },
    {
      title: "Broken Tools",
      icon: "🔧",
      body: "Your lathe seizes up mid-task. Repairs or replacement won't be cheap, and time is money you don't have.",
      choices: [
        { label: "Pay for proper repairs", hint: "−Cash, keeps you efficient",
          apply: (g) => { change(g, { cash: -18 }); return "Fixed and oiled. The lathe hums like new."; } },
        { label: "Jury-rig a fix yourself", hint: "Free, but rough",
          apply: (g) => { if (Math.random() < 0.6) { change(g, { progress: 3, morale: 2 }); return "Wire, solder, and stubbornness. It works — and you learned something."; } change(g, { morale: -6, progress: -3 }); return "Your patch fails halfway through a build, ruining a part. Back to square one."; } },
      ],
    },
    {
      title: "A Letter From Home",
      icon: "✉️",
      body: "A letter arrives from family back on the farm. They're struggling. They've heard you're 'doing well in the city.'",
      choices: [
        { label: "Send what you can spare", hint: "−Cash, +Morale",
          apply: (g) => { change(g, { cash: -22, morale: 10 }); return "You wire them most of your cash. Their gratitude is worth more than the money."; } },
        { label: "Write back with only words", hint: "Honest, but heavy",
          apply: (g) => { change(g, { morale: -4 }); return "You explain you have nothing to send. The truth is hard to set down on paper."; } },
      ],
    },
    {
      title: "Eureka in the Night",
      icon: "💡",
      body: "You wake at 3 a.m. with the whole solution blazing in your mind. You scramble for a pencil before it fades.",
      choices: [
        { label: "Work until dawn", hint: "+Progress, −Morale (no sleep)",
          apply: (g) => { change(g, { progress: 12, morale: -6 }); return "By sunrise the breakthrough is on paper, real and undeniable. Worth every yawn."; } },
        { label: "Note it and sleep", hint: "Balanced",
          apply: (g) => { change(g, { progress: 6, morale: 2 }); return "You jot the idea down and return to bed. Morning-you can build it, rested."; } },
      ],
    },
  ];

  // ---- Game state ----
  let g = null;

  function newGame(invention) {
    return {
      invention,
      cash: 200,
      morale: 70,
      rep: 10,
      progress: 0,
      seasonIdx: 2, // start Autumn 1929 (the crash)
      year: 1929,
      turn: 0,
      finished: false,
      seenRandom: [],
      firstScripted: true,
    };
  }

  // Clamp helpers + apply changes
  function change(state, delta) {
    if (delta.cash) state.cash += Math.round(delta.cash);
    if (delta.morale) state.morale += delta.morale;
    if (delta.rep) state.rep += delta.rep;
    if (delta.progress) {
      const bonus = state.invention.mod.progBonus || 1;
      state.progress += delta.progress * (delta.progress > 0 ? bonus : 1);
    }
    state.morale = clamp(state.morale, 0, 100);
    state.rep = clamp(state.rep, 0, 100);
    state.progress = clamp(state.progress, 0, 100);
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ---- DOM refs ----
  const $ = (id) => document.getElementById(id);
  const screens = {
    title: $("title-screen"), how: $("how-screen"), setup: $("setup-screen"),
    game: $("game-screen"), end: $("end-screen"),
  };
  function show(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
    window.scrollTo(0, 0);
  }

  // ---- HUD rendering ----
  function renderHUD() {
    $("season-label").textContent = SEASONS[g.seasonIdx];
    $("year-label").textContent = g.year;
    $("invention-name").textContent = g.invention.icon + " " + g.invention.name;

    const cashPct = clamp((g.cash / 400) * 100, 0, 100);
    $("cash-fill").style.width = cashPct + "%";
    $("cash-val").textContent = "$" + g.cash;
    $("morale-fill").style.width = g.morale + "%";
    $("morale-val").textContent = Math.round(g.morale);
    $("rep-fill").style.width = g.rep + "%";
    $("rep-val").textContent = Math.round(g.rep);
    $("prog-fill").style.width = g.progress + "%";
    $("prog-val").textContent = Math.round(g.progress) + "%";

    // warning colors when low
    $("cash-val").style.color = g.cash < 40 ? "var(--rust)" : "var(--ink)";
    $("morale-val").style.color = g.morale < 25 ? "var(--rust)" : "var(--ink)";
  }

  // ---- Diary log ----
  function logLine(text, deltas) {
    const li = document.createElement("li");
    let html = `<span>${SEASONS[g.seasonIdx]} ${g.year}:</span> ${text}`;
    if (deltas && deltas.length) {
      html += " " + deltas.map((d) => {
        const cls = d.startsWith("-") || d.startsWith("−") ? "down" : "up";
        return `<span class="delta ${cls}">${d}</span>`;
      }).join(" ");
    }
    li.innerHTML = html;
    const log = $("log");
    log.prepend(li);
    while (log.children.length > 30) log.removeChild(log.lastChild);
  }

  // floating toast of deltas
  function toast(deltas) {
    if (!deltas.length) return;
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = deltas.map((d) => `<span>${d}</span>`).join("");
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1500);
  }

  // Compute readable deltas by snapshotting before/after
  function snapshot() { return { cash: g.cash, morale: g.morale, rep: g.rep, progress: g.progress }; }
  function deltaList(before) {
    const out = [];
    const dc = g.cash - before.cash;
    const dm = Math.round(g.morale - before.morale);
    const dr = Math.round(g.rep - before.rep);
    const dp = Math.round(g.progress - before.progress);
    if (dc) out.push((dc > 0 ? "+" : "−") + "$" + Math.abs(dc));
    if (dm) out.push((dm > 0 ? "+" : "−") + Math.abs(dm) + "❤️");
    if (dr) out.push((dr > 0 ? "+" : "−") + Math.abs(dr) + "🤝");
    if (dp) out.push((dp > 0 ? "+" : "−") + Math.abs(dp) + "⚙️");
    return out;
  }

  // ---- Narrative card ----
  function setNarrative(icon, title, body) {
    const ic = $("narrative-icon");
    ic.textContent = icon;
    ic.style.animation = "none"; void ic.offsetWidth; ic.style.animation = "";
    $("narrative-title").textContent = title;
    $("narrative-body").textContent = body;
  }

  function showActions(visible) {
    $("actions").classList.toggle("hidden", !visible);
    $("choices").classList.toggle("hidden", visible);
  }

  // ---- Turn flow ----
  function startTurn() {
    if (g.finished) return;
    renderHUD();

    const key = g.year + "-" + SEASONS[g.seasonIdx];
    const scripted = HISTORY[key];

    // Decide if an event fires this turn
    let event = null;
    if (scripted) {
      event = scripted;
    } else if (g.turn > 0 && Math.random() < 0.45) {
      const pool = RANDOM_EVENTS.filter((e, i) => !g.seenRandom.includes(i) || g.seenRandom.length >= RANDOM_EVENTS.length);
      const idx = RANDOM_EVENTS.indexOf(pool[Math.floor(Math.random() * pool.length)]);
      g.seenRandom.push(idx);
      event = RANDOM_EVENTS[idx];
    }

    if (event) {
      presentEvent(event);
    } else {
      // Quiet season — normal actions
      setNarrative(seasonIcon(), seasonHeadline(), seasonFlavor());
      showActions(true);
    }
  }

  function presentEvent(event) {
    setNarrative(event.icon, event.title, event.body);
    showActions(false);
    const box = $("choices");
    box.innerHTML = "";
    event.choices.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.innerHTML = `<span class="choice-title">${c.label}</span><span class="choice-hint">${c.hint}</span>`;
      btn.addEventListener("click", () => {
        const before = snapshot();
        const result = c.apply(g);
        const deltas = deltaList(before);
        setNarrative(event.icon, event.title, result);
        toast(deltas);
        logLine(`<b>${event.title}</b> — ${result}`, deltas);
        renderHUD();
        // After resolving an event, advance the season (the event WAS the turn)
        showActions(false);
        box.innerHTML = "";
        const cont = document.createElement("button");
        cont.className = "choice";
        cont.innerHTML = `<span class="choice-title">Continue ▸</span><span class="choice-hint">On to the next season.</span>`;
        cont.addEventListener("click", () => { advanceSeason(); });
        box.appendChild(cont);
      });
      box.appendChild(btn);
    });
  }

  // ---- Standard actions ----
  function doAction(action) {
    if (g.finished) return;
    const before = snapshot();
    let msg = "";
    const m = g.invention.mod;

    switch (action) {
      case "research": {
        const gain = 7 + Math.floor(Math.random() * 5); // 7–11 base
        const moraleCost = Math.round(4 * (m.researchCost || 1));
        change(g, { progress: gain, morale: -moraleCost, cash: -2 });
        msg = "You bend over the workbench, sketching and soldering by lamplight.";
        break;
      }
      case "prototype": {
        const cost = Math.round(30 * (m.protoCost || 1));
        if (g.cash < cost) { flashCantAfford(cost); return; }
        const gain = 15 + Math.floor(Math.random() * 8); // 15–22
        change(g, { cash: -cost, progress: gain, morale: -3 });
        msg = "Sparks fly. A real, working prototype takes shape on the bench.";
        break;
      }
      case "sell": {
        // Cash from progress + reputation, scaled by invention's sell strength
        const base = (g.progress * 0.45 + g.rep * 0.8 + 8) * (m.sellGain || 1);
        const earned = Math.max(10, Math.round(base + Math.random() * 10));
        const repGain = Math.round(2 * (m.repGain || 1));
        change(g, { cash: earned, rep: repGain, morale: 2 });
        msg = `You take your work to market and the streets. The orders trickle in.`;
        break;
      }
      case "oddjob": {
        const earned = 24 + Math.floor(Math.random() * 12); // 24–35
        change(g, { cash: earned, morale: -4 });
        msg = "You spend the season hauling, fixing, and sweeping for whoever's hiring. Honest, tiring work.";
        break;
      }
      case "rest": {
        const gain = 14 + Math.floor(Math.random() * 8);
        change(g, { morale: gain, cash: -4 });
        msg = "You let yourself breathe — a walk, a hot meal, a full night's sleep.";
        break;
      }
    }
    const deltas = deltaList(before);
    toast(deltas);
    logLine(msg, deltas);
    setNarrative(actionIcon(action), actionTitle(action), msg);
    renderHUD();
    advanceSeason();
  }

  function flashCantAfford(cost) {
    setNarrative("🪙", "Not enough cash", `A proper prototype needs about $${cost}. Your pockets are too light — try odd jobs or selling first.`);
  }

  // ---- Advancing time + checking end conditions ----
  function advanceSeason() {
    if (g.finished) return;

    // Seasonal upkeep: rent & food. Winter is harder.
    const isWinter = SEASONS[g.seasonIdx] === "Winter";
    const upkeep = isWinter ? 11 : 7;
    g.cash -= upkeep;
    if (isWinter) g.morale -= 3;
    g.morale = clamp(g.morale, 0, 100);

    logLine(`Living costs take their toll.${isWinter ? " Winter is cruel." : ""}`, ["−$" + upkeep + (isWinter ? " −3❤️" : "")]);

    // Advance the clock
    g.turn++;
    g.seasonIdx++;
    if (g.seasonIdx >= SEASONS.length) { g.seasonIdx = 0; g.year++; }

    // Check end conditions
    if (g.progress >= 100) { return endGame("win"); }
    if (g.cash <= 0) { return endGame("broke"); }
    if (g.morale <= 0) { return endGame("morale"); }
    if (g.year > 1939) { return endGame("timeout"); }

    renderHUD();
    startTurn();
  }

  // ---- Flavor text for quiet seasons ----
  function seasonIcon() {
    return { Spring: "🌱", Summer: "☀️", Autumn: "🍂", Winter: "❄️" }[SEASONS[g.seasonIdx]];
  }
  function seasonHeadline() {
    const opts = {
      Spring: ["A New Season", "Green Shoots", "The Thaw"],
      Summer: ["Long, Hot Days", "Summer in the Workshop", "The Working Months"],
      Autumn: ["The Leaves Turn", "Harvest Time", "Cooler Days"],
      Winter: ["The Cold Sets In", "A Hard Winter", "Quiet, Frozen Months"],
    }[SEASONS[g.seasonIdx]];
    return opts[Math.floor(Math.random() * opts.length)];
  }
  function seasonFlavor() {
    const lines = [
      "Another season at the bench. The radio murmurs of hard times, but the work is yours to push forward. What will you do?",
      "Breadlines stretch around the corner. You have your tools and your stubborn hope. Choose your move.",
      "The neighbors are getting by, barely. So are you. Every season counts now — make it matter.",
      "Dust on the windowsill, ideas in your head. The decade won't wait. How will you spend these months?",
      "Money's tight and morale's a muscle. Spend the season wisely.",
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
  function actionIcon(a){return {research:"🔬",prototype:"🔨",sell:"📈",oddjob:"🪚",rest:"☕"}[a];}
  function actionTitle(a){return {research:"Research",prototype:"Prototype Built",sell:"To Market",oddjob:"Odd Jobs",rest:"A Moment's Rest"}[a];}

  // ---- End game ----
  function endGame(reason) {
    g.finished = true;
    let icon, title, body, rank;
    const years = g.year - 1929;

    if (reason === "win") {
      icon = "🏆";
      title = `You Did It — ${g.invention.name} is Real!`;
      body = `After ${g.turn} hard seasons, your ${g.invention.name.toLowerCase()} works. Word spreads from coast to coast. In the darkest decade America ever knew, you built something that mattered. They'll remember your name.`;
      rank = rankWin(g);
    } else if (reason === "broke") {
      icon = "🪙";
      title = "The Last Dime";
      body = "The cash ran out. The landlord changes the locks, and your half-finished dream is sold for scrap. You join the long road of men looking for work. Not every gamble pays — but you tried, and that's more than most.";
      rank = "Rank: The Drifter";
    } else if (reason === "morale") {
      icon = "🥀";
      title = "A Spirit Worn Thin";
      body = "The years of hunger, dust, and disappointment finally broke something in you. You set down your tools for the last time. The invention sleeps, unfinished, under a sheet. Sometimes survival is the only victory left.";
      rank = "Rank: The Weary";
    } else {
      icon = "🌇";
      title = "The Decade Closes";
      body = `It's 1940. The Depression is loosening its grip and war clouds gather in Europe. Your ${g.invention.name.toLowerCase()} reached ${Math.round(g.progress)}% — close, but the decade ran out before you finished. Still, you survived the worst of it. That counts for something.`;
      rank = g.progress >= 70 ? "Rank: So Very Close" : "Rank: The Survivor";
    }

    $("end-icon").textContent = icon;
    $("end-title").textContent = title;
    $("end-body").textContent = body;
    $("end-rank").textContent = rank;
    $("end-stats").innerHTML = `
      <div><b>${years}</b><span>Years Endured</span></div>
      <div><b>$${Math.max(0, g.cash)}</b><span>Cash Left</span></div>
      <div><b>${Math.round(g.rep)}</b><span>Reputation</span></div>
      <div><b>${Math.round(g.progress)}%</b><span>Invention Done</span></div>`;
    show("end");
  }

  function rankWin(state) {
    const score = state.rep + (state.cash / 4) + state.morale + (1939 - state.year) * 6;
    if (score > 160) return "Rank: 🌟 American Legend";
    if (score > 110) return "Rank: Celebrated Inventor";
    if (score > 70) return "Rank: Respected Maker";
    return "Rank: Quiet Pioneer";
  }

  // ---- Setup screen: render invention cards ----
  function renderInventions() {
    const grid = $("invention-grid");
    grid.innerHTML = "";
    INVENTIONS.forEach((inv) => {
      const card = document.createElement("button");
      card.className = "inv-card";
      card.innerHTML = `
        <span class="inv-icon">${inv.icon}</span>
        <h3>${inv.name}</h3>
        <p>${inv.desc}</p>
        <span class="inv-trait">${inv.trait}</span>`;
      card.addEventListener("click", () => beginGame(inv));
      grid.appendChild(card);
    });
  }

  function beginGame(invention) {
    g = newGame(invention);
    $("log").innerHTML = "";
    show("game");
    renderHUD();
    logLine(`You set out to build the <b>${invention.name}</b>. The whole country is on its knees. Good luck.`, []);
    startTurn();
  }

  // ---- Wire up UI ----
  function init() {
    renderInventions();
    $("start-btn").addEventListener("click", () => show("setup"));
    $("how-btn").addEventListener("click", () => show("how"));
    $("how-back").addEventListener("click", () => show("title"));
    $("restart-btn").addEventListener("click", () => show("setup"));
    document.querySelectorAll(".action").forEach((b) =>
      b.addEventListener("click", () => doAction(b.dataset.action)));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
