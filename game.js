/* =====================================================================
   THE INVENTOR'S GAMBLE
   A story of the Great Depression (1929–1939).
   Every run generates a new character, the people around them, and the
   way history lands on their doorstep. Vanilla JS, no dependencies.
   ===================================================================== */

(() => {
  "use strict";

  /* ---------- tiny random helpers ---------- */
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const ri = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const chance = (p) => Math.random() < p;
  const shuffle = (a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };

  /* ---------- the cast, generated fresh each game ---------- */
  const FIRST = ["Mabel", "Otis", "Cora", "Wendell", "Ida", "Roy", "Hattie", "Earl", "Vera", "Floyd", "Ada", "Clarence", "Pearl", "Walter", "Lena", "Hollis", "Goldie", "Amos", "Della", "Linus"];
  const LAST = ["Pike", "Calloway", "Dunmore", "Hatch", "Voss", "Renner", "Ashby", "Coyle", "Mercer", "Tipton", "Brisco", "Hale", "Quill", "Foss", "Marsh", "Wadell"];
  const HOMES = [
    "a shuttered mill town in Ohio", "the cracked farmland of Oklahoma",
    "a tenement on Chicago's South Side", "a fishing village gone quiet in Maine",
    "the rail yards of Kansas City", "a coal hollow in West Virginia",
    "a dust-choked county in the Texas panhandle", "a cold-water flat in Brooklyn",
    "a foreclosed orchard in the Carolinas", "a boarded-up Main Street in Nebraska",
  ];
  const REL = ["your daughter", "your son", "your kid brother", "your kid sister", "your wife", "your husband", "your aging mother", "your oldest friend", "your sweetheart", "your father"];
  const PNAME = ["Ruth", "Sam", "Clara", "Eddie", "Nell", "Joe", "Birdie", "Hank", "Alma", "Gus", "Etta", "Will"];
  const RIVALS = ["Harlan Frost", "Cornelius Vane", "Dr. August Pell", "Beatrice Thorne", "Silas Grebe", "Mortimer Cross", "the Voss Brothers"];

  function makeCharacter() {
    const name = `${rnd(FIRST)} ${rnd(LAST)}`;
    const home = rnd(HOMES);
    const companion = { rel: rnd(REL), name: rnd(PNAME) };
    const rival = rnd(RIVALS);
    const whyOpts = [
      `to give ${companion.name} a life better than this gray one`,
      `because ${companion.name} believed in you when no one else would`,
      `to prove the men who laid you off dead wrong`,
      `to drag your family out of the breadline for good`,
      `because you can't stand to watch ${companion.name} go hungry one more winter`,
      `to leave one good thing behind in a decade that's taken everything`,
    ];
    return { name, home, companion, rival, why: rnd(whyOpts) };
  }

  /* ---------- inventions (the gamble you choose) ---------- */
  const INVENTIONS = [
    { id: "radio", icon: "📻", name: "the People's Radio", title: "The People's Radio",
      desc: "A cheap set so families can crowd around a voice in the dark and forget, for an hour, how bad it's gotten.",
      trait: "Your name spreads fast — everyone wants one.",
      mod: { repGain: 1.4, sellGain: 1.0, researchCost: 1.0 } },
    { id: "tractor", icon: "🚜", name: "the Dust-Bowl Plow", title: "The Dust-Bowl Plow",
      desc: "A plow that keeps the topsoil from lifting off the plains and burying whole towns in the wind.",
      trait: "Slow to build, but desperate farmers pay well.",
      mod: { repGain: 1.0, sellGain: 1.5, researchCost: 1.2 } },
    { id: "fridge", icon: "🧊", name: "the Iceless Icebox", title: "The Iceless Icebox",
      desc: "An electric box that ends the daily race against the melting block of ice on the porch.",
      trait: "Costly to build — but a fortune if you finish.",
      mod: { repGain: 1.0, sellGain: 1.3, researchCost: 1.0, protoCost: 1.4 } },
    { id: "penicillin", icon: "💊", name: "the Miracle Mold", title: "The Miracle Mold",
      desc: "A medicine grown from common mold that might beat back infections folks now call death sentences.",
      trait: "Brutal to perfect — but pure legend if it works.",
      mod: { repGain: 1.2, sellGain: 0.8, researchCost: 1.5, progBonus: 1.3 } },
    { id: "nylon", icon: "🧵", name: "the Synthetic Silk", title: "Synthetic Silk",
      desc: "Thread spun from chemistry instead of silkworms — stockings the whole country will line up for.",
      trait: "Steady and dependable. A balanced gamble.",
      mod: { repGain: 1.1, sellGain: 1.1, researchCost: 1.0 } },
  ];

  const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];

  /* =====================================================================
     STATE
     ===================================================================== */
  let g = null;

  function newGame(invention) {
    return {
      char: makeCharacter(),
      invention,
      cash: 200,
      morale: ri(64, 74),
      rep: ri(6, 14),
      progress: 0,
      seasonIdx: 2, // Autumn 1929 — the crash
      year: 1929,
      turn: 0,
      finished: false,
      historyDone: {},     // which scripted beats already fired
      randomQueue: [],     // shuffled random events for this run
      companionBond: 0,    // grows when you care for them
    };
  }

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function change(delta) {
    if (delta.cash) g.cash += Math.round(delta.cash);
    if (delta.morale) g.morale += delta.morale;
    if (delta.rep) g.rep += delta.rep;
    if (delta.progress) {
      const b = g.invention.mod.progBonus || 1;
      g.progress += delta.progress * (delta.progress > 0 ? b : 1);
    }
    g.morale = clamp(g.morale, 0, 100);
    g.rep = clamp(g.rep, 0, 100);
    g.progress = clamp(g.progress, 0, 100);
  }

  /* =====================================================================
     STORY CONTENT
     Each scripted beat is a function of g, so it can speak the player's
     name, their companion, their rival — and pick fresh phrasings and
     outcomes every run.
     ===================================================================== */
  const HISTORY = {
    "1929-Autumn": (c) => ({
      scene: "📉", title: "The Day It All Fell",
      body: rnd([
        `The radio won't stop. Wall Street has come apart like wet paper, and grown men are weeping on the courthouse steps. ${cap(c.companion.rel)} ${c.companion.name} asks if you're frightened. You are. But the workbench is paid for, and the idea in your head doesn't care what the market does.`,
        `Everyone in ${c.home} heard the news at once — fortunes gone in an afternoon, banks white-faced behind their counters. You count the coins in the coffee tin. Not much. But it's yours, and so is the dream.`,
      ]),
      choices: [
        { label: "Pull every dollar out of the bank", hint: "Safe — you lose a little to the panic.",
          apply: () => { change({ cash: -ri(12, 20) }); return `You stand in line before dawn and walk home with your money in a sock. Foolish, maybe. Safe, certainly.`; } },
        { label: "Keep faith — the bank has always held", hint: "A gamble on a world that's ending.",
          apply: () => { if (chance(.5)) { change({ cash: -ri(50, 70), morale: -10 }); return `Weeks later the doors are chained shut. Most of your money is simply… gone. ${cap(c.companion.rel)} ${c.companion.name} doesn't say a word, which is worse.`; } change({ cash: ri(8, 16), morale: 5 }); return `Your bank holds — for now — and even pays a little interest. Luck favors the stubborn this once.`; } },
      ],
    }),

    "1930-Summer": (c) => ({
      scene: "🏛️", title: "Word From Washington",
      body: rnd([
        `New tariffs. The price of copper, wire, timber — everything you need — lurches upward overnight. The fellow at the hardware counter just shrugs: "Government says it'll help. Don't feel like help."`,
        `Prices climb like the heat. Imported parts cost double now. You do the arithmetic on the back of an envelope twice, hoping you're wrong. You aren't.`,
      ]),
      choices: [
        { label: "Stockpile materials before it's worse", hint: "Spend now to save the work later.",
          apply: () => { change({ cash: -ri(22, 30), progress: ri(4, 8) }); return `You fill the shed with everything you can carry. Lean on cash, but the next builds will fly.`; } },
        { label: "Make do with scrap and salvage", hint: "Frugal — every screw is precious.",
          apply: () => { change({ morale: -4 }); return `You learn to make one nail do the work of three. Slower. But you keep your money.`; } },
      ],
    }),

    "1931-Winter": (c) => ({
      scene: "🏦", title: "The Run on the Bank",
      body: rnd([
        `A neighbor pounds on the door at midnight — the whole street is rushing the bank before it goes under. ${cap(c.companion.rel)} ${c.companion.name} is already pulling on a coat, looking to you for the answer.`,
        `It moves through ${c.home} like a fever: get your money out, get it out now. By lamplight you can already see the line forming three blocks down.`,
      ]),
      choices: [
        { label: "Run with the crowd", hint: "Protect your money from the collapse.",
          apply: () => { change({ cash: ri(4, 10) }); return `You reach the teller's window minutes before it slams shut for good. Your knees don't stop shaking till noon.`; } },
        { label: "Press your savings on a ruined neighbor", hint: "Reckless kindness. Your name, your money.",
          apply: () => { change({ cash: -ri(35, 45), rep: ri(10, 14), morale: 8 }); return `You put your cash into his shaking hands. By spring, the whole block knows your name — and that it can be trusted.`; } },
      ],
    }),

    "1933-Spring": (c) => ({
      scene: "🎙️", title: "A Voice on the Radio",
      body: rnd([
        `The new president speaks straight into the parlor: the only thing to fear is fear itself. For the first time in years the air in ${c.home} smells faintly of hope. New programs. Loans. Work.`,
        `They've shut the banks to save them, and a calm voice on the wireless promises the country will claw its way back. ${cap(c.companion.rel)} ${c.companion.name} actually smiles at supper. You'd forgotten the shape of it.`,
      ]),
      choices: [
        { label: "Apply for a federal innovation grant", hint: "Your name had better mean something.",
          apply: () => { if (g.rep >= 24) { change({ cash: ri(60, 80), morale: 12 }); return `An administrator has heard of you. The grant comes through — a windfall that changes everything this year.`; } change({ morale: -3 }); return `Your application vanishes into a drawer marked 'unknowns.' Maybe next year your name will open that drawer.`; } },
        { label: "Take a steady relief-program job", hint: "Sure money — but time away from the bench.",
          apply: () => { change({ cash: ri(40, 50), progress: -ri(2, 5) }); return `A season of pouring concrete for a new bridge. Honest pay in your pocket; dust gathering on the prototype.`; } },
      ],
    }),

    "1934-Summer": (c) => ({
      scene: "🌪️", title: "Black Blizzard",
      body: rnd([
        `It comes at noon and turns day to night — a rolling wall of topsoil a thousand feet high. The dust finds every crack, every lung. ${cap(c.companion.rel)} ${c.companion.name} ties a wet rag over their face and helps you cover the windows.`,
        `The sky goes brown, then black. You can't see the barn from the porch. Grit settles on the workbench, in the food, in your teeth. The plains are simply blowing away.`,
      ]),
      choices: [
        { label: "Seal the shop and wait it out", hint: "Spend money to protect the work.",
          apply: () => { change({ cash: -ri(16, 24), morale: -3 }); return `Wet sheets over every gap. The dust still gets in, but the prototype survives the storm intact.`; } },
        { label: "Keep working through the dark", hint: "Push on — at a cost to your body.",
          apply: () => { change({ morale: -ri(11, 16), progress: ri(4, 7) }); return `You work in a mask of rags, coughing grit, lamp burning at noon. The work moves — but it takes something out of you that doesn't come back easy.`; } },
      ],
    }),

    "1935-Autumn": (c) => ({
      scene: "🎩", title: `${c.rival}`,
      body: rnd([
        `Word reaches you downtown: ${c.rival} has been showing investors something that looks an awful lot like your idea. Better-funded. Better-dressed. The race you didn't know you were in is suddenly very real.`,
        `${c.rival} — flush with other people's money — is demonstrating a near-twin of your invention to men in good suits. ${cap(c.companion.rel)} ${c.companion.name} asks if you're going to just let them.`,
      ]),
      choices: [
        { label: "Throw a public demonstration of your own", hint: "Your name swings hard, win or lose.",
          apply: () => { if (g.progress >= 45) { change({ rep: ri(16, 24), morale: 8, cash: ri(10, 20) }); return `Your demonstration dazzles. ${c.rival} looks rattled. The papers love an underdog, and so does the crowd.`; } change({ rep: -ri(8, 14), morale: -8 }); return `Your half-built device sputters and dies in front of everyone. ${c.rival} smirks. You'll have to earn that trust all over again.`; } },
        { label: "Say nothing. Out-build them quietly.", hint: "Heads down. Let the work answer.",
          apply: () => { change({ progress: ri(8, 12), morale: -4 }); return `You ignore the noise and bury yourself in the work. Let ${c.rival} have the headlines. You'll have the thing itself.`; } },
      ],
    }),

    "1936-Summer": (c) => ({
      scene: "🔥", title: "The Heat That Killed",
      body: rnd([
        `The worst heat in living memory bakes the country flat. People are dying in the cities. Ice is worth its weight in silver, and your shop is an oven by ten in the morning.`,
        `Day after day of furnace heat. The tar streets soften; the dog won't move. ${cap(c.companion.rel)} ${c.companion.name} hasn't slept in three nights for the heat.`,
      ]),
      choices: [
        { label: "Rig a cooler and sell relief by the nickel", hint: "Turn your ingenuity into money.",
          apply: () => { change({ cash: ri(25, 35), rep: 6 }); return `Your jury-rigged cooler draws a line down the block. A nickel a sit, and worth it. Word of your cleverness spreads.`; } },
        { label: "Open your doors to the neighborhood for free", hint: "Goodwill over gold.",
          apply: () => { change({ rep: ri(13, 19), morale: 10, cash: -ri(3, 8) }); return `You let anyone who needs it escape the heat in your shop. ${c.home} doesn't forget a kindness like that.`; } },
      ],
    }),

    "1937-Spring": (c) => ({
      scene: "📊", title: "The Backslide",
      body: rnd([
        `Just as it seemed the worst was over, the bottom drops out a second time. Spending cut, jobs vanishing again, the breadlines lengthening. The cruelty of it is that you'd let yourself hope.`,
        `They're calling it a recession inside the depression. Whatever the name, the fear is back in ${c.home}, and ${c.companion.rel} ${c.companion.name} has stopped talking about next year.`,
      ]),
      choices: [
        { label: "Cut every expense to the bone", hint: "Safe, but it wears on the soul.",
          apply: () => { change({ cash: ri(8, 14), morale: -8 }); return `Beans for supper again. You darn the same socks twice. But the coffee tin grows a little heavier.`; } },
        { label: "Double down — pour money into the work", hint: "Mad faith, while others retreat.",
          apply: () => { change({ cash: -ri(26, 34), progress: ri(11, 17) }); return `While the timid pull back, you push in with everything. If you live through this, you'll be miles ahead.`; } },
      ],
    }),

    "1939-Spring": (c) => ({
      scene: "🎡", title: "The World of Tomorrow",
      body: rnd([
        `The great Fair opens with a promise painted across the sky: the World of Tomorrow. Inventors from everywhere gather under the Trylon and Perisphere. A booth could make your name forever — for a price you can barely meet.`,
        `Everyone's talking about the Fair and its shining promise of tomorrow. ${cap(c.companion.rel)} ${c.companion.name} says you've earned a place among those dreamers. The booth fee says otherwise.`,
      ]),
      choices: [
        { label: "Buy a booth at the Fair", hint: "Costly — but a stage like no other.",
          apply: () => { change({ cash: -ri(30, 40), rep: ri(20, 28), progress: ri(6, 10) }); return `Under the great white sphere, crowds gather at your booth. This is the moment you pictured on every cold night.`; } },
        { label: "Walk the exhibits and learn", hint: "Cheap inspiration, no spotlight.",
          apply: () => { change({ morale: 10, progress: ri(4, 7) }); return `You wander for hours, scribbling notes by every marvel. You leave with a head full of tomorrow.`; } },
      ],
    }),
  };

  /* ---------- random, lived-in events (shuffled per run) ---------- */
  const RANDOM = [
    (c) => ({ scene: "🍞", title: "A Knock at Supper",
      body: `A gaunt drifter knocks, hat in hand, offering a day's labor for a plate of food. He says he was an engineer, once, before all this.`,
      choices: [
        { label: "Feed him and hear his story", hint: "−money, +heart, maybe more",
          apply: () => { change({ cash: -ri(6, 10), morale: 6 }); if (chance(.5)) { change({ progress: ri(5, 9) }); return `Over soup he sketches a fix for the very thing that's stumped you for weeks. Genius keeps strange company in hard times.`; } return `You share what little there is. He moves on at first light, tipping his hat. Some things you do just to stay a person.`; } },
        { label: "Turn him away — you've nothing spare", hint: "Keep what's yours, lose a little of yourself",
          apply: () => { change({ morale: -5 }); return `You shut the door on his hollow eyes. It sits with you the whole night through.`; } },
      ] }),

    (c) => ({ scene: "📰", title: "The Reporter",
      body: `A newspaperman wants a story about "the tinkerer on the edge of ${c.home}." Publicity is a double-edged thing, and ${c.rival} reads the papers too.`,
      choices: [
        { label: "Give the interview", hint: "+name, but rivals learn your hand",
          apply: () => { change({ rep: ri(8, 12), progress: -2 }); return `Your photograph runs in the morning edition. Strangers nod to you on the street now. So, somewhere, does ${c.rival}.`; } },
        { label: "Keep your cards close", hint: "Stay quiet, stay safe",
          apply: () => { change({ morale: 3, progress: 4 }); return `You thank him and decline. Back to the bench, undisturbed and unknown.`; } },
      ] }),

    (c) => ({ scene: "💼", title: "The Man in the Clean Suit",
      body: `A businessman offers a fat sum for a controlling share of your invention. He smells profit on you the way a dog smells fear.`,
      choices: [
        { label: "Take the money", hint: "+money now, −your claim to it",
          apply: () => { change({ cash: ri(45, 60), rep: -ri(6, 10) }); return `You sign. The cash is real and immediate — but it's his name on the contract now, not yours.`; } },
        { label: "Show him the door — it's yours", hint: "+heart, +standing later",
          apply: () => { change({ morale: 8, rep: 4 }); return `This dream is not for sale at any price. You sleep better than you have in months.`; } },
      ] }),

    (c) => ({ scene: "🔧", title: "The Lathe Gives Out",
      body: `Your one good tool seizes mid-cut with an ugly shriek. Repairs cost money; doing without costs time you don't have.`,
      choices: [
        { label: "Pay for a proper repair", hint: "−money, keeps you working clean",
          apply: () => { change({ cash: -ri(14, 22) }); return `Fixed, oiled, true again. It hums like the day you bought it.`; } },
        { label: "Jury-rig it yourself", hint: "free, but rough — and risky",
          apply: () => { if (chance(.6)) { change({ progress: ri(2, 5), morale: 2 }); return `Wire, solder, and stubbornness. It holds — and you learned something doing it.`; } change({ morale: -6, progress: -3 }); return `Your patch fails halfway through a build and ruins a part. Back to the start.`; } },
      ] }),

    (c) => ({ scene: "✉️", title: "A Letter From Home",
      body: `A letter from family. They're struggling worse than you let yourself imagine. Somehow word got round that you're "doing well in the city."`,
      choices: [
        { label: "Wire them what little you can", hint: "−money, +heart",
          apply: () => { change({ cash: -ri(18, 26), morale: 10 }); return `You send most of the coffee tin. Their gratitude is worth more than the money — and you tell yourself that's true.`; } },
        { label: "Write back with only words", hint: "honest, and heavy",
          apply: () => { change({ morale: -4 }); return `You explain you have nothing to send. The truth is a hard thing to set down on paper.`; } },
      ] }),

    (c) => ({ scene: "💡", title: "Three in the Morning",
      body: `You wake with the whole solution blazing behind your eyes. You scramble for a pencil before it can fade back into the dark.`,
      choices: [
        { label: "Work straight through till dawn", hint: "+the work, −heart",
          apply: () => { change({ progress: ri(10, 14), morale: -6 }); return `By sunrise the breakthrough is on paper, real and undeniable. Worth every yawn of the gray day after.`; } },
        { label: "Note it down and sleep", hint: "balanced — rested hands build true",
          apply: () => { change({ progress: ri(5, 8), morale: 2 }); return `You jot it down and go back to bed. Morning-you can build it, clear-eyed.`; } },
      ] }),

    (c) => ({ scene: "🎻", title: "Music Down the Block",
      body: `Somebody's set up a fiddle and a washboard on the corner, and for one warm evening the whole street forgets to be afraid. ${cap(c.companion.rel)} ${c.companion.name} wants you to come dance.`,
      choices: [
        { label: "Go — leave the work for one night", hint: "+heart, +a little of your name",
          apply: () => { change({ morale: ri(10, 14), rep: 3 }); return `You dance badly and laugh hard. ${cap(c.companion.rel)} ${c.companion.name} looks happier than you've seen in a year.`; } },
        { label: "Stay at the bench", hint: "+the work, −heart",
          apply: () => { change({ progress: ri(5, 8), morale: -4 }); return `You work by the open window, the music drifting in. Progress — but you wonder what you traded for it.`; } },
      ] }),

    (c) => ({ scene: "🤒", title: `${cap(c.companion.rel)} Falls Ill`,
      body: `${cap(c.companion.rel)} ${c.companion.name} takes a fever that won't break. The doctor's fee is more than a week of wages, and the worry sits on your chest like a stone.`,
      choices: [
        { label: "Pay the doctor whatever it takes", hint: "−money, +heart, +bond",
          apply: () => { change({ cash: -ri(24, 34), morale: 8 }); g.companionBond++; return `The doctor comes, the fever breaks by week's end. You'd have sold the workbench itself, and you both know it.`; } },
        { label: "Nurse them yourself, day and night", hint: "the work stops cold; a gamble",
          apply: () => { if (chance(.7)) { change({ progress: -ri(3, 6), morale: 4 }); g.companionBond++; return `You don't leave their side. The fever breaks on its own, and something between you grows quietly stronger.`; } change({ morale: -ri(8, 12) }); return `They pull through — barely — but the helpless nights leave a mark on you that the work can't touch.`; } },
      ] }),

    (c) => ({ scene: "🐀", title: "Eviction Notice",
      body: `A pink slip on the door: the landlord wants back rent by Friday or you're out on the curb, workbench and all.`,
      choices: [
        { label: "Scrape together every cent", hint: "−money, keeps your roof",
          apply: () => { change({ cash: -ri(20, 30) }); return `You empty your pockets and the sock under the floorboard. Friday comes; you're still standing. Just.`; } },
        { label: "Plead your case to the landlord", hint: "your name might save you — or not",
          apply: () => { if (g.rep >= 18 || chance(.4)) { change({ morale: 4 }); return `He's heard you're a decent sort. "Pay me when the invention sells," he grunts. Mercy, in a hard year.`; } change({ cash: -ri(22, 30), morale: -6 }); return `He's heard it all before. You pay up to the last dime, humiliated, and keep the roof.`; } },
      ] }),

    (c) => ({ scene: "🤝", title: "An Apprentice Appears",
      body: `A sharp-eyed kid from down the lane keeps hanging around the shop, asking questions, begging to help for nothing but the learning.`,
      choices: [
        { label: "Take the kid on", hint: "+the work over time, costs a little now",
          apply: () => { change({ cash: -ri(2, 6), progress: ri(4, 7), morale: 3 }); return `Extra hands and a quick mind. The kid's worth more than the scraps you feed them.`; } },
        { label: "Send them home — too many mouths", hint: "+a quiet conscience, nothing gained",
          apply: () => { change({ morale: -3 }); return `You tell the kid to scram. They go. You half wish you'd said yes.`; } },
      ] }),

    (c) => ({ scene: "🃏", title: "A Sure Thing",
      body: `A slick fellow at the diner swears he's got a tip that can't lose — double your money by Sunday. All it takes is a stake up front.`,
      choices: [
        { label: "Put down a stake", hint: "gamble: big money, or none",
          apply: () => { const bet = ri(15, 25); if (chance(.45)) { change({ cash: bet * 2, morale: 6 }); return `It actually pays. You walk away with twice your stake, hardly believing your luck.`; } change({ cash: -bet, morale: -5 }); return `The fellow and your stake both vanish by Sunday. A fool and his coffee tin, as they say.`; } },
        { label: "Keep your money in your pocket", hint: "no risk, no story",
          apply: () => { change({ morale: 2 }); return `You've been burned by sure things before. You finish your coffee and leave him talking.`; } },
      ] }),

    (c) => ({ scene: "🌧️", title: "A Quiet Rain",
      body: `For once the weather is gentle — a soft rain on the tin roof, the smell of wet earth. A rare hour where nothing is going wrong.`,
      choices: [
        { label: "Sit with ${who} and just be", hint: "+heart, +bond",
          apply: () => { change({ morale: ri(8, 12) }); g.companionBond++; return `You sit on the step with ${g.char.companion.rel} ${g.char.companion.name} and watch the rain. No work, no worry. Just this.`; } },
        { label: "Use the calm to think the problem through", hint: "+the work",
          apply: () => { change({ progress: ri(6, 9), morale: 2 }); return `In the quiet, the tangled problem finally comes apart in your hands. Sometimes peace is the best tool.`; } },
      ] }),
  ];

  /* =====================================================================
     DOM
     ===================================================================== */
  const $ = (id) => document.getElementById(id);
  const screens = { title: $("title-screen"), how: $("how-screen"), setup: $("setup-screen"), game: $("game-screen"), end: $("end-screen") };
  function show(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
    window.scrollTo(0, 0);
  }

  function setSky() {
    document.body.classList.remove("season-spring", "season-summer", "season-autumn", "season-winter", "era-early", "era-deep", "era-late");
    document.body.classList.add("season-" + SEASONS[g.seasonIdx].toLowerCase());
    const era = g.year <= 1931 ? "era-early" : g.year <= 1937 ? "era-deep" : "era-late";
    document.body.classList.add(era);
  }

  function renderHUD() {
    $("season-label").textContent = SEASONS[g.seasonIdx];
    $("year-label").textContent = g.year;
    $("invention-name").textContent = g.invention.icon + " " + g.invention.title;
    $("who-label").textContent = g.char.name;

    $("cash-fill").style.width = clamp((g.cash / 400) * 100, 0, 100) + "%";
    $("cash-val").textContent = "$" + g.cash;
    $("morale-fill").style.width = g.morale + "%";
    $("morale-val").textContent = Math.round(g.morale);
    $("rep-fill").style.width = g.rep + "%";
    $("rep-val").textContent = Math.round(g.rep);
    $("prog-fill").style.width = g.progress + "%";
    $("prog-val").textContent = Math.round(g.progress) + "%";
    $("cash-val").style.color = g.cash < 40 ? "var(--rust)" : "var(--ink)";
    $("morale-val").style.color = g.morale < 25 ? "var(--rust)" : "var(--ink)";
  }

  /* ---------- typewriter narrative ---------- */
  let typeTimer = null, skipType = null;
  function setScene(art) {
    const s = $("scene");
    s.textContent = art;
    s.style.animation = "none"; void s.offsetWidth; s.style.animation = "";
  }
  function tell(title, scene, body, onDone) {
    setScene(scene);
    $("narrative-title").textContent = title;
    const el = $("narrative-body");
    el.textContent = "";
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.textContent = "▌";
    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
    let i = 0, done = false;
    const finish = () => {
      if (done) return; done = true;
      if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
      el.textContent = body;
      skipType = null;
      if (onDone) onDone();
    };
    skipType = finish;
    typeTimer = setInterval(() => {
      i += 2;
      if (i >= body.length) { finish(); return; }
      el.textContent = body.slice(0, i);
      el.appendChild(cursor);
    }, 16);
  }

  function showActions(v) {
    $("actions").classList.toggle("hidden", !v);
    $("choices").classList.toggle("hidden", v);
  }
  function clearChoices() { $("choices").innerHTML = ""; }
  function addChoice(title, hint, onClick) {
    const b = document.createElement("button");
    b.className = "choice";
    b.innerHTML = `<span class="choice-title"></span><span class="choice-hint"></span>`;
    b.querySelector(".choice-title").textContent = title;
    b.querySelector(".choice-hint").textContent = hint;
    b.addEventListener("click", onClick);
    $("choices").appendChild(b);
  }

  /* ---------- diary + toast ---------- */
  function logLine(text, deltas) {
    const li = document.createElement("li");
    const stamp = document.createElement("span");
    stamp.textContent = `${SEASONS[g.seasonIdx]} ${g.year}: `;
    li.appendChild(stamp);
    li.appendChild(document.createTextNode(text + " "));
    (deltas || []).forEach((d) => {
      const s = document.createElement("span");
      s.className = "delta " + (d[0] === "−" || d[0] === "-" ? "down" : "up");
      s.textContent = d + " ";
      li.appendChild(s);
    });
    const log = $("log");
    log.prepend(li);
    while (log.children.length > 30) log.removeChild(log.lastChild);
  }
  function toast(deltas) {
    if (!deltas.length) return;
    const t = document.createElement("div");
    t.className = "toast";
    deltas.forEach((d) => { const s = document.createElement("span"); s.textContent = d; t.appendChild(s); });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1600);
  }
  function snap() { return { cash: g.cash, morale: g.morale, rep: g.rep, progress: g.progress }; }
  function deltas(b) {
    const out = [];
    const dc = g.cash - b.cash, dm = Math.round(g.morale - b.morale), dr = Math.round(g.rep - b.rep), dp = Math.round(g.progress - b.progress);
    if (dc) out.push((dc > 0 ? "+" : "−") + "$" + Math.abs(dc));
    if (dm) out.push((dm > 0 ? "+" : "−") + Math.abs(dm) + "❤️");
    if (dr) out.push((dr > 0 ? "+" : "−") + Math.abs(dr) + "🤝");
    if (dp) out.push((dp > 0 ? "+" : "−") + Math.abs(dp) + "⚙️");
    return out;
  }

  /* =====================================================================
     TURN FLOW
     ===================================================================== */
  function startTurn() {
    if (g.finished) return;
    setSky();
    renderHUD();
    showActions(false);
    clearChoices();

    const key = g.year + "-" + SEASONS[g.seasonIdx];
    let event = null;
    if (HISTORY[key] && !g.historyDone[key]) {
      g.historyDone[key] = true;
      event = HISTORY[key](g.char);
    } else if (g.turn > 0 && chance(.5)) {
      if (g.randomQueue.length === 0) g.randomQueue = shuffle(RANDOM);
      event = g.randomQueue.pop()(g.char);
    }

    if (event) {
      presentEvent(event);
    } else {
      tell(seasonHeadline(), seasonIcon(), seasonFlavor(), () => showActions(true));
    }
  }

  function presentEvent(ev) {
    tell(ev.title, ev.scene, ev.body, () => {
      showActions(false);
      clearChoices();
      ev.choices.forEach((c) => addChoice(
        interp(c.label), interp(c.hint),
        () => resolveChoice(ev, c)
      ));
    });
  }

  function resolveChoice(ev, c) {
    const before = snap();
    const result = c.apply();
    const ds = deltas(before);
    toast(ds);
    logLine(ev.title + " — " + result, ds);
    renderHUD();
    clearChoices();
    tell(ev.title, ev.scene, result, () => {
      clearChoices();
      addChoice("Continue ▸", "On to the next season.", advanceSeason);
    });
  }

  /* ---------- ordinary season actions ---------- */
  function doAction(action) {
    if (g.finished) return;
    if ($("actions").classList.contains("hidden")) return; // ignore mid-typing
    const before = snap();
    const m = g.invention.mod;
    let msg = "", scene = "";

    switch (action) {
      case "research": {
        change({ progress: ri(7, 11), morale: -Math.round(4 * (m.researchCost || 1)), cash: -2 });
        scene = "🔬"; msg = rnd([
          `You bend over the bench by lamplight, sketching, soldering, swearing softly at the parts that won't behave.`,
          `Hours melt away in calculation and trial. The idea inches closer to something real.`,
        ]); break;
      }
      case "prototype": {
        const cost = Math.round(30 * (m.protoCost || 1));
        if (g.cash < cost) { tell("Not enough money", "🪙", `A proper build needs about $${cost}, and your pockets are too light. Try honest wages or selling first.`, () => showActions(true)); return; }
        change({ cash: -cost, progress: ri(15, 22), morale: -3 });
        scene = "🔨"; msg = rnd([
          `Sparks fly and metal bites. A real, working prototype takes shape under your hands.`,
          `You spend the money and the sweat, and by season's end a true working model sits on the bench.`,
        ]); break;
      }
      case "sell": {
        const base = (g.progress * 0.45 + g.rep * 0.8 + 8) * (m.sellGain || 1);
        const earned = Math.max(10, Math.round(base + ri(0, 10)));
        change({ cash: earned, rep: Math.round(2 * (m.repGain || 1)), morale: 2 });
        scene = "📈"; msg = rnd([
          `You take the work to the market square and door to door. The orders trickle in, dime by dime.`,
          `You talk and demonstrate till your throat's raw. A few believers part with their hard coins.`,
        ]); break;
      }
      case "oddjob": {
        change({ cash: ri(24, 35), morale: -4 });
        scene = "🪚"; msg = rnd([
          `A season of hauling, fixing, and sweeping for whoever's hiring. Honest, tiring, and it keeps the lights on.`,
          `You take any work that pays — back sore, hands raw, but the rent's covered another season.`,
        ]); break;
      }
      case "rest": {
        change({ morale: ri(14, 21), cash: -4 });
        scene = "☕"; msg = rnd([
          `You let yourself breathe — a walk, a hot meal, a full night's sleep for once.`,
          `A season of small mercies: coffee, quiet, and ${g.char.companion.name}'s company. You feel almost human.`,
        ]); break;
      }
    }
    const ds = deltas(before);
    toast(ds);
    logLine(msg, ds);
    renderHUD();
    showActions(false);
    tell(actionTitle(action), scene, msg, () => {
      clearChoices();
      addChoice("Continue ▸", "On to the next season.", advanceSeason);
    });
  }

  /* ---------- time + endings ---------- */
  function advanceSeason() {
    if (g.finished) return;
    clearChoices();
    const isWinter = SEASONS[g.seasonIdx] === "Winter";
    const upkeep = isWinter ? 11 : 7;
    g.cash -= upkeep;
    if (isWinter) g.morale = clamp(g.morale - 3, 0, 100);
    logLine(isWinter ? "Rent, food, and a cruel winter take their toll." : "Rent and food take their toll.", ["−$" + upkeep + (isWinter ? " −3❤️" : "")]);

    g.turn++;
    g.seasonIdx++;
    if (g.seasonIdx >= SEASONS.length) { g.seasonIdx = 0; g.year++; }

    if (g.progress >= 100) return endGame("win");
    if (g.cash <= 0) return endGame("broke");
    if (g.morale <= 0) return endGame("morale");
    if (g.year > 1939) return endGame("timeout");

    startTurn();
  }

  function endGame(reason) {
    g.finished = true;
    const c = g.char, years = g.year - 1929;
    let icon, title, body, rank;
    const bond = g.companionBond >= 2
      ? ` Through all of it, ${c.companion.rel} ${c.companion.name} never once let go of your hand.`
      : "";

    if (reason === "win") {
      icon = g.invention.icon;
      title = `${c.name} Made History`;
      body = `After ${g.turn} hard seasons, ${g.invention.name} works — really works. Word runs from coast to coast. In the darkest decade the country ever knew, you built the one thing it couldn't ignore, ${c.why}.${bond}`;
      rank = rankWin();
    } else if (reason === "broke") {
      icon = "🪙";
      title = "The Last Dime";
      body = `The money ran dry. The landlord changes the locks, and the half-built dream is carted off for scrap. You and ${c.companion.name} join the long gray road of people looking for work. You gambled everything ${c.why} — and the house won. This time.`;
      rank = "How they'll remember you: The Drifter";
    } else if (reason === "morale") {
      icon = "🥀";
      title = "A Spirit Worn Through";
      body = `The years of dust and hunger and disappointment finally broke something in you that wages can't mend. You set the tools down for the last time. ${cap(c.companion.rel)} ${c.companion.name} covers the unfinished work with a bedsheet, gently, like tucking in a child. Some seasons, survival is the only victory left.`;
      rank = "How they'll remember you: The Weary";
    } else {
      icon = "🌇";
      title = "The Decade Closes";
      body = `It's 1940. The Depression is loosening its grip, and storm clouds gather over Europe. Your ${g.invention.name} reached ${Math.round(g.progress)}% — so close you could taste it, but the decade ran out first. Still: you survived the worst years a country ever had, ${c.why}. Not nothing. Not nothing at all.${bond}`;
      rank = g.progress >= 70 ? "How they'll remember you: So Very Close" : "How they'll remember you: The Survivor";
    }

    $("end-icon").textContent = icon;
    $("end-title").textContent = title;
    $("end-body").textContent = body;
    $("end-rank").textContent = rank;
    $("end-stats").innerHTML = "";
    [["Years Endured", years], ["Money Left", "$" + Math.max(0, g.cash)], ["Your Name", Math.round(g.rep)], ["The Work", Math.round(g.progress) + "%"]]
      .forEach(([label, val]) => {
        const d = document.createElement("div");
        const b = document.createElement("b"); b.textContent = val;
        const s = document.createElement("span"); s.textContent = label;
        d.appendChild(b); d.appendChild(s); $("end-stats").appendChild(d);
      });
    show("end");
  }

  function rankWin() {
    const score = g.rep + g.cash / 4 + g.morale + (1939 - g.year) * 6 + g.companionBond * 8;
    if (score > 165) return "How they'll remember you: 🌟 An American Legend";
    if (score > 115) return "How they'll remember you: A Celebrated Inventor";
    if (score > 75) return "How they'll remember you: A Respected Maker";
    return "How they'll remember you: A Quiet Pioneer";
  }

  /* ---------- flavor for quiet seasons ---------- */
  function seasonIcon() { return { Spring: "🌱", Summer: "☀️", Autumn: "🍂", Winter: "❄️" }[SEASONS[g.seasonIdx]]; }
  function seasonHeadline() {
    return rnd({
      Spring: ["A New Season", "Green Shoots", "The Thaw Comes"],
      Summer: ["Long, Hot Days", "The Working Months", "High Summer"],
      Autumn: ["The Leaves Turn", "Cooler Days", "Toward Harvest"],
      Winter: ["The Cold Sets In", "A Hard Winter", "Frozen, Quiet Months"],
    }[SEASONS[g.seasonIdx]]);
  }
  function seasonFlavor() {
    const c = g.char;
    return rnd([
      `Another season at the bench. The wireless murmurs of hard times, but the work is yours to push, ${c.why}. What will you do with these months?`,
      `Breadlines coil around the corner in ${c.home}. You have your tools and a stubborn hope. ${cap(c.companion.rel)} ${c.companion.name} is counting on you. Choose your move.`,
      `Dust on the windowsill, an idea burning in your head. The decade won't wait, and neither will ${c.companion.name}. How do you spend the season?`,
      `Money's thin and heart's a muscle you have to keep working. Spend the season wisely.`,
      `The neighbors are getting by, barely. So are you. Every season counts now — make this one matter.`,
    ]);
  }
  function actionTitle(a) { return { research: "Chasing the Idea", prototype: "At the Forge", sell: "To the Streets", oddjob: "Honest Wages", rest: "A Breath" }[a]; }

  /* ---------- helpers for text with the companion baked in ---------- */
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  const who = "${who}"; // placeholder used inside one choice label
  function interp(s) {
    return s.replace("${who}", g.char.companion.rel + " " + g.char.companion.name);
  }

  /* =====================================================================
     SETUP / WIRING
     ===================================================================== */
  function renderInventions() {
    const grid = $("invention-grid");
    grid.innerHTML = "";
    INVENTIONS.forEach((inv) => {
      const card = document.createElement("button");
      card.className = "inv-card";
      card.innerHTML = `<span class="inv-icon"></span><h3></h3><p></p><span class="inv-trait"></span>`;
      card.querySelector(".inv-icon").textContent = inv.icon;
      card.querySelector("h3").textContent = inv.title;
      card.querySelector("p").textContent = inv.desc;
      card.querySelector(".inv-trait").textContent = inv.trait;
      card.addEventListener("click", () => beginGame(inv));
      grid.appendChild(card);
    });
  }

  // Show a freshly generated character on the setup screen each time.
  let pendingChar = null;
  function freshSetup() {
    pendingChar = makeCharacter();
    const c = pendingChar;
    $("setup-title").textContent = `You are ${c.name}.`;
    $("setup-sub").textContent = `Out of ${c.home}, with ${c.companion.rel} ${c.companion.name} beside you. Now choose the one idea worth all the years to come — ${c.why}.`;
  }

  function beginGame(invention) {
    g = newGame(invention);
    if (pendingChar) g.char = pendingChar; // keep the character the player just read about
    g.randomQueue = shuffle(RANDOM);
    $("log").innerHTML = "";
    show("game");
    setSky();
    renderHUD();
    const c = g.char;
    logLine(`${c.name}, out of ${c.home}, sets out to build ${invention.name}. The whole country is on its knees. Good luck.`, []);
    // Opening beat, then straight into the crash.
    showActions(false);
    tell("Where It Begins", "🌆",
      `It's the autumn of 1929. You are ${c.name}, and you've got calloused hands, a head full of impossible ideas, and ${c.companion.rel} ${c.companion.name} who hasn't given up on you. You mean to build ${invention.name} — ${c.why}. Then the world picks this exact moment to fall apart…`,
      () => { clearChoices(); addChoice("Begin ▸", "Face the autumn of 1929.", startTurn); });
  }

  function init() {
    renderInventions();
    $("start-btn").addEventListener("click", () => { freshSetup(); show("setup"); });
    $("how-btn").addEventListener("click", () => show("how"));
    $("how-back").addEventListener("click", () => show("title"));
    $("restart-btn").addEventListener("click", () => { freshSetup(); show("setup"); });
    $("narrative").addEventListener("click", () => { if (skipType) skipType(); });
    document.querySelectorAll(".action").forEach((b) => b.addEventListener("click", () => doAction(b.dataset.action)));
    // gentle dust motes
    const dust = $("dust");
    for (let i = 0; i < 18; i++) {
      const s = document.createElement("span");
      s.style.left = Math.random() * 100 + "vw";
      s.style.animationDuration = (10 + Math.random() * 16) + "s";
      s.style.animationDelay = (-Math.random() * 16) + "s";
      const sz = 3 + Math.random() * 5;
      s.style.width = s.style.height = sz + "px";
      s.style.opacity = 0.3 + Math.random() * 0.4;
      dust.appendChild(s);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
