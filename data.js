/* Aminas: Light & Shadow — content data (pure data, no DOM). */
(function (root) {
  'use strict';
  const A = (root.A = root.A || {});
  const D = (A.Data = {});

  D.VERSION = '0.1.0';
  D.SAVE_KEY = 'aminas-light-shadow-save-v1';
  D.MAX_LEVEL = 30;
  D.MAX_INSTANCES = 60;

  /* ---------- Elements ---------- */
  D.ELEMENTS = {
    light:     { name: 'Light',     color: '#ffd86b', dark: '#c9951f' },
    dark:      { name: 'Dark',      color: '#9a78e6', dark: '#4b3590' },
    nature:    { name: 'Nature',    color: '#6fd36f', dark: '#2f8a3c' },
    fire:      { name: 'Fire',      color: '#ff8050', dark: '#c4401c' },
    water:     { name: 'Water',     color: '#52b8ff', dark: '#1f72b8' },
    earth:     { name: 'Earth',     color: '#c49a68', dark: '#7a5632' },
    wind:      { name: 'Wind',      color: '#8fe6d6', dark: '#3d9c8c' },
    resonance: { name: 'Resonance', color: '#ff86d6', dark: '#a8338a' },
  };
  // attacker -> defenders it is strong against (x1.5). Reverse is x0.67.
  D.STRONG = {
    light: ['dark'], dark: ['light'],
    fire: ['nature', 'wind'], water: ['fire', 'earth'], nature: ['water', 'earth'],
    earth: ['wind'], wind: ['nature'], resonance: [],
  };

  /* ---------- Abilities ---------- */
  // type: dmg | drain (dmg + heal half) | weaken (dmg + -atk) | guard | heal
  D.ABILITIES = {
    glowpulse:   { name: 'Glow Pulse',     el: 'light',  type: 'dmg',    power: 40, cd: 0, desc: 'A warm pulse of light.' },
    sunsprout:   { name: 'Sun Sprout',     el: 'light',  type: 'drain',  power: 45, cd: 2, desc: 'Damages the foe and heals you for half the damage.' },
    radiantburst:{ name: 'Radiant Burst',  el: 'light',  type: 'dmg',    power: 70, cd: 2, desc: 'A blooming flash of sunlight.' },
    shadenip:    { name: 'Shade Nip',      el: 'dark',   type: 'dmg',    power: 40, cd: 0, desc: 'A quick bite from the shadows.' },
    gloomveil:   { name: 'Gloom Veil',     el: 'dark',   type: 'weaken', power: 35, cd: 2, desc: 'Damages the foe and lowers its attack.' },
    duskrend:    { name: 'Dusk Rend',      el: 'dark',   type: 'dmg',    power: 70, cd: 2, desc: 'Claws of folded twilight.' },
    vinewhip:    { name: 'Vine Whip',      el: 'nature', type: 'dmg',    power: 40, cd: 0, desc: 'A lashing vine.' },
    leafguard:   { name: 'Leaf Guard',     el: 'nature', type: 'guard',  power: 0,  cd: 2, desc: 'Halves the next hit you take.' },
    mend:        { name: 'Mend',           el: 'nature', type: 'heal',   power: 0,  cd: 3, desc: 'Restores 25% of your health.' },
    emberflick:  { name: 'Ember Flick',    el: 'fire',   type: 'dmg',    power: 40, cd: 0, desc: 'A spit of warm sparks.' },
    flarebite:   { name: 'Flare Bite',     el: 'fire',   type: 'dmg',    power: 60, cd: 2, desc: 'A blazing chomp.' },
    bubblepop:   { name: 'Bubble Pop',     el: 'water',  type: 'dmg',    power: 40, cd: 0, desc: 'A cheerful burst of bubbles.' },
    tidalsurge:  { name: 'Tidal Surge',    el: 'water',  type: 'dmg',    power: 60, cd: 2, desc: 'A rolling wave.' },
    pebbletoss:  { name: 'Pebble Toss',    el: 'earth',  type: 'dmg',    power: 40, cd: 0, desc: 'Thrown with enthusiasm.' },
    boulderroll: { name: 'Boulder Roll',   el: 'earth',  type: 'dmg',    power: 60, cd: 2, desc: 'Curls up and rolls over the foe.' },
    gust:        { name: 'Gust',           el: 'wind',   type: 'dmg',    power: 40, cd: 0, desc: 'A snapping gust.' },
    cyclonespin: { name: 'Cyclone Spin',   el: 'wind',   type: 'weaken', power: 40, cd: 2, desc: 'Damages the foe and lowers its attack.' },
    echowave:    { name: 'Echo Wave',      el: 'resonance', type: 'dmg', power: 50, cd: 1, desc: 'Strikes true; never resisted, never amplified.', neutral: true },
    hum:         { name: 'Hum',            el: 'resonance', type: 'heal', power: 0, cd: 3, desc: 'A low note that mends you for 25%.' },
  };

  /* ---------- Roster (28) ---------- */
  // stats: base hp/atk/def/spd at level 1 (grow ~11% per level)
  // src: machine-readable acquisition (verified in tests); find: text shown to the player
  const art = (o) => o; // readability helper
  D.ROSTER = [
    // --- Starters & their evolutions ---
    { id: 'lumifern', name: 'Lumifern', el: 'light', stage: 1, evo: { to: 'solarbloom', lv: 12 },
      stats: { hp: 46, atk: 11, def: 9, spd: 10 }, abil: ['glowpulse', 'sunsprout'],
      pers: 'Gentle, curious, stubborn about naps.',
      lore: 'A sprout-eared Amina whose leaves hold a little stored sunlight. It hums when the ruins are repaired, as if relieved.',
      ent: 'That one? A fine Kind Soul. Stubborn, mind you. But then, most of the good ones are.',
      find: 'Choose it as your starter. Also hatches from Light + Nature parents.',
      src: [{ t: 'starter' }, { t: 'breed' }],
      art: art({ body: 'round', c1: '#bff58a', c2: '#fff7c8', c3: '#ffd86b', ears: 'leaf', tail: 'leaf', mark: 'star', eyes: 'big', glow: '#ffe9a0' }) },
    { id: 'umbrit', name: 'Umbrit', el: 'dark', stage: 1, evo: { to: 'duskmantle', lv: 12 },
      stats: { hp: 44, atk: 12, def: 8, spd: 11 }, abil: ['shadenip', 'gloomveil'],
      pers: 'Shy, watchful, fiercely loyal once trusted.',
      lore: 'A velvet-dark baby with a moon-pale crest. Shadows pool under it like a puddle it refuses to leave.',
      ent: 'Umbrit. Small, dark, suspicious of everyone. We get along perfectly.',
      find: 'Choose it as your starter. Also hatches from Dark + Fire parents.',
      src: [{ t: 'starter' }, { t: 'breed' }],
      art: art({ body: 'round', c1: '#5a4a9a', c2: '#a89be0', c3: '#f4e9ff', ears: 'pointy', tail: 'wisp', mark: 'rune', eyes: 'big', glow: '#b9a2ff' }) },
    { id: 'solarbloom', name: 'Solarbloom', el: 'light', stage: 2,
      stats: { hp: 66, atk: 17, def: 14, spd: 13 }, abil: ['glowpulse', 'radiantburst'],
      pers: 'Warm, patient, quietly proud.',
      lore: 'Lumifern fully bloomed. A crown of petals turns to follow whoever it trusts most.',
      ent: 'Solarbloom. Don’t stare directly. Or do. I’m not your optician.',
      find: 'Lumifern evolves at level 12.',
      src: [{ t: 'evolve', from: 'lumifern' }],
      art: art({ body: 'round', c1: '#9fe36a', c2: '#fff3b0', c3: '#ffcf4a', ears: 'crown', tail: 'leaf', mark: 'star', eyes: 'big', glow: '#fff0a8', big: true }) },
    { id: 'duskmantle', name: 'Duskmantle', el: 'dark', stage: 2,
      stats: { hp: 62, atk: 19, def: 12, spd: 15 }, abil: ['shadenip', 'duskrend'],
      pers: 'Composed, protective, dry-humoured.',
      lore: 'Umbrit grown into a cloak of living twilight. It stands between you and the dark, and keeps the dark company.',
      ent: 'Duskmantle. Reminds me of someone. No, I won’t say who.',
      find: 'Umbrit evolves at level 12.',
      src: [{ t: 'evolve', from: 'umbrit' }],
      art: art({ body: 'tall', c1: '#4a3a88', c2: '#9a8ad8', c3: '#f0e4ff', ears: 'horn', tail: 'wisp', mark: 'rune', eyes: 'sharp', glow: '#b9a2ff', big: true }) },

    // --- Meadow / common ---
    { id: 'mossbun', name: 'Mossbun', el: 'nature', stage: 1,
      stats: { hp: 48, atk: 10, def: 11, spd: 8 }, abil: ['vinewhip', 'leafguard'],
      pers: 'Sleepy and soft. Believes every problem is solved by lying down.',
      lore: 'A round little rabbit-shaped Amina with a coat of living moss. Wildflowers sprout where it naps.',
      ent: 'Mossbun. Has never hurried in its life. I envy it terribly.',
      find: 'Explore the Sunlit Meadow. Or hatch from Earth + Nature parents.',
      src: [{ t: 'area', area: 'meadow' }, { t: 'breed' }],
      art: art({ body: 'round', c1: '#7fcf79', c2: '#e8f7c8', c3: '#ff9ec7', ears: 'long', tail: 'fluff', mark: 'spots', eyes: 'sleepy' }) },
    { id: 'pebblop', name: 'Pebblop', el: 'earth', stage: 1,
      stats: { hp: 50, atk: 10, def: 13, spd: 6 }, abil: ['pebbletoss', 'boulderroll'],
      pers: 'Earnest. Collects small stones and gives them as gifts.',
      lore: 'A lopsided pebble-hided Amina. It insists every rock it hands you is the best rock.',
      ent: 'Pebblop. If it hands you a rock, say thank you. It matters more than you’d think.',
      find: 'Explore the Sunlit Meadow. Or hatch from Earth + Light parents.',
      src: [{ t: 'area', area: 'meadow' }, { t: 'breed' }],
      art: art({ body: 'rock', c1: '#b99b78', c2: '#e8d7bd', c3: '#8a6a48', ears: 'none', tail: 'none', mark: 'spots', eyes: 'big' }) },
    { id: 'thornpup', name: 'Thornpup', el: 'nature', stage: 1,
      stats: { hp: 44, atk: 13, def: 9, spd: 11 }, abil: ['vinewhip', 'mend'],
      pers: 'Bristly, bouncy, bad at being gentle. Trying.',
      lore: 'A burr-backed puppy of the old gardens. Its thorns soften whenever it is praised.',
      ent: 'Thornpup. Leave your fingers out of its mouth. Learn from my mistakes.',
      find: 'Explore the Sunlit Meadow. Or hatch from two Nature parents.',
      src: [{ t: 'area', area: 'meadow' }, { t: 'breed' }],
      art: art({ body: 'long', c1: '#86c76a', c2: '#e6f2b8', c3: '#5a8a3a', ears: 'pointy', tail: 'leaf', mark: 'stripes', eyes: 'big', spikes: true }) },

    // --- Tide pools ---
    { id: 'ripplet', name: 'Ripplet', el: 'water', stage: 1,
      stats: { hp: 45, atk: 11, def: 9, spd: 12 }, abil: ['bubblepop', 'tidalsurge'],
      pers: 'Playful. Splashes first, apologises later.',
      lore: 'A droplet-shaped Amina that leaves tiny ripples in the air as it bounces.',
      ent: 'Ripplet. Wet. Cheerful. Somehow always in the way.',
      find: 'Explore the Tide Pools. Or hatch from Earth + Water parents.',
      src: [{ t: 'area', area: 'tidepools' }, { t: 'breed' }],
      art: art({ body: 'drop', c1: '#6cc6ff', c2: '#d8f3ff', c3: '#2f86d6', ears: 'fin', tail: 'fin', mark: 'spots', eyes: 'big', glow: '#b6e6ff' }) },
    { id: 'brinefin', name: 'Brinefin', el: 'water', stage: 1,
      stats: { hp: 52, atk: 11, def: 11, spd: 9 }, abil: ['bubblepop', 'tidalsurge'],
      pers: 'Grumbly, salty, secretly sentimental.',
      lore: 'A stout little fish that swims through the air near water. It keeps a collection of lost buttons.',
      ent: 'Brinefin. Complains constantly. Excellent company.',
      find: 'Explore the Tide Pools. Or hatch from two Water parents.',
      src: [{ t: 'area', area: 'tidepools' }, { t: 'breed' }],
      art: art({ body: 'fish', c1: '#4aa8e8', c2: '#cfeeff', c3: '#ffd27a', ears: 'fin', tail: 'fin', mark: 'stripes', eyes: 'sleepy' }) },

    // --- Ember Ridge ---
    { id: 'emberkit', name: 'Emberkit', el: 'fire', stage: 1,
      stats: { hp: 42, atk: 14, def: 8, spd: 12 }, abil: ['emberflick', 'flarebite'],
      pers: 'Brave beyond reason. Easily offended by cold weather.',
      lore: 'A kit with a flickering tail-flame. It warms cold stones just to be useful.',
      ent: 'Emberkit. Strong against anything leafy. Weak against anything damp. Like all of us.',
      find: 'Explore Ember Ridge. Or hatch from Fire + Light parents.',
      src: [{ t: 'area', area: 'emberridge' }, { t: 'breed' }],
      art: art({ body: 'long', c1: '#ff9a62', c2: '#ffe2b8', c3: '#ffd23a', ears: 'pointy', tail: 'flame', mark: 'stripes', eyes: 'big', glow: '#ffc07a' }) },
    { id: 'cindersnail', name: 'Cindersnail', el: 'fire', stage: 1,
      stats: { hp: 56, atk: 11, def: 13, spd: 4 }, abil: ['emberflick', 'flarebite'],
      pers: 'Slow, steady, radiates quiet warmth.',
      lore: 'Its shell is a small kiln. Travellers rest beside it and forget they were ever cold.',
      ent: 'Cindersnail. Takes an hour to cross a room. Arrives with excellent timing.',
      find: 'Explore Ember Ridge. Or hatch from two Fire parents.',
      src: [{ t: 'area', area: 'emberridge' }, { t: 'breed' }],
      art: art({ body: 'snail', c1: '#ffb07a', c2: '#fff0d0', c3: '#d4482a', ears: 'antenna', tail: 'none', mark: 'spots', eyes: 'sleepy', glow: '#ffb070' }) },
    { id: 'graniteling', name: 'Graniteling', el: 'earth', stage: 1,
      stats: { hp: 58, atk: 12, def: 15, spd: 4 }, abil: ['pebbletoss', 'boulderroll'],
      pers: 'Stoic. Speaks three words a year. Chooses them well.',
      lore: 'A small slab of living granite with a bright, unexpected face.',
      ent: 'Graniteling. Wall with feelings. Pleasant enough.',
      find: 'Explore Ember Ridge. Or hatch from two Earth parents.',
      src: [{ t: 'area', area: 'emberridge' }, { t: 'breed' }],
      art: art({ body: 'rock', c1: '#9a9aa6', c2: '#d8d8e2', c3: '#6a6a78', ears: 'horn', tail: 'none', mark: 'rune', eyes: 'sharp' }) },

    // --- Dusk Grove ---
    { id: 'gloomole', name: 'Gloomole', el: 'dark', stage: 1,
      stats: { hp: 50, atk: 12, def: 10, spd: 7 }, abil: ['shadenip', 'gloomveil'],
      pers: 'Gentle burrower. Terrified of surprises, enchanted by lanterns.',
      lore: 'A velvet mole of the quiet places. It digs by moonlight and always fills in its holes.',
      ent: 'Gloomole. Dark does not mean unkind. Remember that. I’ll deny saying it.',
      find: 'Explore the Dusk Grove (restore the Moon Shrine). Or hatch from two Dark parents.',
      src: [{ t: 'area', area: 'duskgrove' }, { t: 'breed' }],
      art: art({ body: 'round', c1: '#6a5aa8', c2: '#c8bff0', c3: '#ffd0f0', ears: 'round', tail: 'none', mark: 'spots', eyes: 'sleepy', snout: true }) },

    // --- Wind Bluff (opens after the Dormant Spire awakens) ---
    { id: 'zephyrow', name: 'Zephyrow', el: 'wind', stage: 1,
      stats: { hp: 40, atk: 12, def: 8, spd: 16 }, abil: ['gust', 'cyclonespin'],
      pers: 'Restless, breezy, forever on its way somewhere else.',
      lore: 'A swallow-shaped Amina trailing ribbons of air. It carries news between islands, mostly inaccurate.',
      ent: 'Zephyrow. Fast. Gossipy. Do not tell it anything you want kept private.',
      find: 'Explore the Wind Bluff (after the Dormant Spire awakens). Or hatch from Fire + Wind parents.',
      src: [{ t: 'area', area: 'windbluff' }, { t: 'breed' }],
      art: art({ body: 'bird', c1: '#8fe6d6', c2: '#e6fff8', c3: '#3d9c8c', ears: 'crest', tail: 'ribbon', mark: 'stripes', eyes: 'big', wings: true }) },
    { id: 'stormfinch', name: 'Stormfinch', el: 'wind', stage: 1,
      stats: { hp: 42, atk: 14, def: 8, spd: 15 }, abil: ['gust', 'cyclonespin'],
      pers: 'Loud, proud, wonderfully dramatic.',
      lore: 'A thundercloud-feathered finch. It sings before storms to warn everyone, and is offended if no one thanks it.',
      ent: 'Stormfinch. Opera, in a very small body. Cover your ears.',
      find: 'Explore the Wind Bluff. Or hatch from two Wind parents.',
      src: [{ t: 'area', area: 'windbluff' }, { t: 'breed' }],
      art: art({ body: 'bird', c1: '#7a8fd8', c2: '#dfe6ff', c3: '#ffe36a', ears: 'crest', tail: 'ribbon', mark: 'star', eyes: 'sharp', wings: true }) },
    { id: 'glimmoth', name: 'Glimmoth', el: 'light', stage: 1,
      stats: { hp: 40, atk: 12, def: 8, spd: 14 }, abil: ['glowpulse', 'sunsprout'],
      pers: 'Dreamy and easily distracted by anything shiny.',
      lore: 'A moth whose wings shed soft dust like lamplight. Old lanterns are said to have been built to match it.',
      ent: 'Glimmoth. Attracted to light. Which is, honestly, a perfectly sound life plan.',
      find: 'Explore the Wind Bluff. Or hatch from two Light parents.',
      src: [{ t: 'area', area: 'windbluff' }, { t: 'breed' }],
      art: art({ body: 'moth', c1: '#fff0b0', c2: '#fffbe6', c3: '#ffc84a', ears: 'antenna', tail: 'none', mark: 'star', eyes: 'big', wings: true, glow: '#fff4b8' }) },

    // --- Hybrids (breeding) ---
    { id: 'magmoss', name: 'Magmoss', el: 'fire', stage: 1,
      stats: { hp: 54, atk: 14, def: 11, spd: 7 }, abil: ['emberflick', 'flarebite'],
      pers: 'Smouldering optimist. Grows moss on warm stones and calls it gardening.',
      lore: 'Born where fire and growth agree to take turns. Its back is a tiny volcano blooming with ferns.',
      ent: 'Magmoss. A hybrid. Do not ask how. Or do. I have notes.',
      find: 'Hatch from Fire + Nature parents (Hatchery).',
      src: [{ t: 'breed' }],
      art: art({ body: 'long', c1: '#d4683a', c2: '#ffd9a8', c3: '#7ccf5a', ears: 'leaf', tail: 'flame', mark: 'spots', eyes: 'big', glow: '#ffa060' }) },
    { id: 'puffcap', name: 'Puffcap', el: 'nature', stage: 1,
      stats: { hp: 56, atk: 10, def: 12, spd: 6 }, abil: ['vinewhip', 'mend'],
      pers: 'Soft-spoken. Drifts through rainstorms, delighted.',
      lore: 'A mushroom-capped Amina that drinks rain through its cap and releases glowing spores when pleased.',
      ent: 'Puffcap. Nature and water. Mildly damp, endlessly pleasant.',
      find: 'Hatch from Nature + Water parents. Seen in the Overgrown Reliquary.',
      src: [{ t: 'breed' }],
      art: art({ body: 'cap', c1: '#f4d4a8', c2: '#fff4e0', c3: '#ff7a8a', ears: 'none', tail: 'none', mark: 'spots', eyes: 'sleepy' }) },
    { id: 'tidewisp', name: 'Tidewisp', el: 'water', stage: 1,
      stats: { hp: 46, atk: 13, def: 10, spd: 13 }, abil: ['bubblepop', 'tidalsurge'],
      pers: 'Serene, glowing, speaks in tides and half-sentences.',
      lore: 'A lantern-jelly of moonlit shallows. Where it passes, the water holds a little light for a while.',
      ent: 'Tidewisp. Light on water. The pairing I always liked best. Not that I had a favourite.',
      find: 'Hatch from Light + Water parents (Hatchery).',
      src: [{ t: 'breed' }],
      art: art({ body: 'jelly', c1: '#9ad4ff', c2: '#f0faff', c3: '#fff0a8', ears: 'none', tail: 'wisp', mark: 'star', eyes: 'big', glow: '#c8ecff' }) },
    { id: 'haloray', name: 'Haloray', el: 'light', stage: 1,
      stats: { hp: 46, atk: 14, def: 10, spd: 14 }, abil: ['glowpulse', 'sunsprout'],
      pers: 'Graceful, formal, extremely courteous.',
      lore: 'A manta-winged Amina circled by a thin ring of dawn-light. It bows to everyone, including walls.',
      ent: 'Haloray. Has better manners than the entire island combined.',
      find: 'Hatch from Light + Wind parents (Hatchery).',
      src: [{ t: 'breed' }],
      art: art({ body: 'moth', c1: '#ffe9a0', c2: '#fffaf0', c3: '#7fe0ff', ears: 'halo', tail: 'ribbon', mark: 'star', eyes: 'big', wings: true, glow: '#fff4c0' }) },
    { id: 'veilfox', name: 'Veilfox', el: 'dark', stage: 1,
      stats: { hp: 44, atk: 15, def: 9, spd: 15 }, abil: ['shadenip', 'gloomveil'],
      pers: 'Sly, elegant, finishes your sentences incorrectly on purpose.',
      lore: 'A fox with a tail like a drifting curtain. It slips between shadows and returns with trinkets nobody lost.',
      ent: 'Veilfox. Gets into things. Returns things. Somehow always with interest.',
      find: 'Hatch from Dark + Wind parents (Hatchery).',
      src: [{ t: 'breed' }],
      art: art({ body: 'long', c1: '#7a5ac8', c2: '#d9cdf7', c3: '#ff9ad6', ears: 'pointy', tail: 'wisp', mark: 'rune', eyes: 'sharp', glow: '#c4a8ff' }) },
    { id: 'whisperhusk', name: 'Whisperhusk', el: 'dark', stage: 1,
      stats: { hp: 58, atk: 13, def: 14, spd: 6 }, abil: ['shadenip', 'gloomveil'],
      pers: 'Reserved. Says very little. Remembers everything.',
      lore: 'A hollow, seed-husk Amina with a lantern glow inside. Old stone seems to murmur when it passes.',
      ent: 'Whisperhusk. Listens to walls. Walls have more to say than people think.',
      find: 'Hatch from Dark + Earth parents (Hatchery).',
      src: [{ t: 'breed' }],
      art: art({ body: 'tall', c1: '#6c5a78', c2: '#d4c4dc', c3: '#ffe08a', ears: 'none', tail: 'none', mark: 'rune', eyes: 'lantern', glow: '#ffe08a' }) },

    // --- Rare dungeon ---
    { id: 'relicwarden', name: 'Relicwarden', el: 'earth', stage: 2,
      stats: { hp: 72, atk: 16, def: 18, spd: 6 }, abil: ['pebbletoss', 'boulderroll'],
      pers: 'Ancient, courteous, patient as a staircase.',
      lore: 'A mossy guardian who kept the Reliquary through long, quiet centuries. It forgives the vines that bound it.',
      ent: 'Relicwarden. Old as the stones and twice as polite. Do not insult its staircase.',
      find: 'Clear the Overgrown Reliquary for the first time.',
      src: [{ t: 'dungeon', d: 'reliquary', n: 1 }],
      art: art({ body: 'tall', c1: '#8aa078', c2: '#d8e4c8', c3: '#6a5a40', ears: 'horn', tail: 'none', mark: 'rune', eyes: 'lantern', glow: '#b8e69a', big: true, moss: true }) },
    { id: 'briarstag', name: 'Briarstag', el: 'nature', stage: 2,
      stats: { hp: 64, atk: 17, def: 13, spd: 13 }, abil: ['vinewhip', 'mend'],
      pers: 'Noble, wary, appears only for those who return.',
      lore: 'A stag crowned with blossoming antlers. It shows itself to those who come back to a place after leaving it.',
      ent: 'Briarstag. It only appears for those who return. Think about that. Or don’t. Up to you.',
      find: 'Clear the Overgrown Reliquary a second time.',
      src: [{ t: 'dungeon', d: 'reliquary', n: 2 }],
      art: art({ body: 'long', c1: '#a0c878', c2: '#f4f0cc', c3: '#ff9ec7', ears: 'antler', tail: 'fluff', mark: 'spots', eyes: 'sharp', glow: '#d0f0a0', big: true }) },

    // --- Resonance ---
    { id: 'resonyx', name: 'Resonyx', el: 'resonance', stage: 1,
      stats: { hp: 48, atk: 13, def: 10, spd: 12 }, abil: ['echowave', 'hum'],
      pers: 'Curious about everything. Hums when it is happy, and when it is not.',
      lore: 'A crystal-eared creature that appeared at the first disturbance. Its colours do not quite match any element.',
      ent: 'Resonyx. Came from the Singing Stones. Hums in a key I haven’t heard in a long, long time.',
      find: 'Investigate the Resonance disturbance on the island.',
      src: [{ t: 'event', ev: 'r1' }],
      art: art({ body: 'round', c1: '#ff9ede', c2: '#ffe6f6', c3: '#8ee6ff', ears: 'crystal', tail: 'wisp', mark: 'star', eyes: 'big', glow: '#ffb0ea' }) },
    { id: 'driftcub', name: 'Driftcub', el: 'resonance', stage: 1,
      stats: { hp: 54, atk: 13, def: 11, spd: 11 }, abil: ['echowave', 'hum'],
      pers: 'Cheerfully lost. Treats every place like home.',
      lore: 'A cub that floats an inch above the ground, trailing small clouds. It arrived with a drifting island that should not exist.',
      ent: 'Driftcub. From an island that was in the wrong place. As usual. Don’t pet it too long. It sticks.',
      find: 'Explore the Drift Isle (after the Dormant Spire awakens).',
      src: [{ t: 'area', area: 'driftisle' }],
      art: art({ body: 'round', c1: '#ffc6ee', c2: '#fff0fa', c3: '#9ad4ff', ears: 'round', tail: 'cloud', mark: 'spots', eyes: 'big', glow: '#ffd0f0' }) },
    { id: 'echolyn', name: 'Echolyn', el: 'resonance', stage: 1,
      stats: { hp: 50, atk: 14, def: 11, spd: 13 }, abil: ['echowave', 'hum'],
      pers: 'Repeats the last thing you said, then improves it.',
      lore: 'Born when Light and Dark are placed side by side and neither is asked to yield. It sings both halves of every song.',
      ent: 'Echolyn. Light and Dark in one. Neither one lost. I remember when that was considered impossible.',
      find: 'Hatch from Light + Dark parents (after the Dormant Spire awakens).',
      src: [{ t: 'breed' }],
      art: art({ body: 'tall', c1: '#d8a8ff', c2: '#fff2c8', c3: '#9a78e6', ears: 'crystal', tail: 'wisp', mark: 'rune', eyes: 'star', glow: '#f0c8ff', split: true }) },
    { id: 'chimerrow', name: 'Chimerrow', el: 'resonance', stage: 1,
      stats: { hp: 56, atk: 15, def: 12, spd: 12 }, abil: ['echowave', 'hum'],
      pers: 'Never the same two days running. Insists this is consistency.',
      lore: 'A patchwork Amina stitched together by Resonance. Its horns, tail and feathers belong to no single species.',
      ent: 'Chimerrow. Resonance leftovers, assembled by hope. Wonderful. Don’t tell the paperwork.',
      find: 'Hatch from a Resonance Amina plus any other element (after the Dormant Spire awakens).',
      src: [{ t: 'breed' }],
      art: art({ body: 'long', c1: '#ffa6d8', c2: '#fff0f8', c3: '#8ee6ff', ears: 'antler', tail: 'flame', mark: 'stripes', eyes: 'star', glow: '#ffc0ec', wings: true }) },
  ];
  D.SPECIES = {};
  D.ROSTER.forEach((s) => (D.SPECIES[s.id] = s));

  /* ---------- Breeding recipes ---------- */
  // key = two elements sorted alphabetically joined by '+'. locked: needs flag r2 (Dormant Spire awake)
  D.BREED = {
    'dark+dark': { sp: 'gloomole' }, 'earth+earth': { sp: 'graniteling' }, 'fire+fire': { sp: 'cindersnail' },
    'light+light': { sp: 'glimmoth' }, 'nature+nature': { sp: 'thornpup' }, 'water+water': { sp: 'brinefin' },
    'wind+wind': { sp: 'stormfinch' },
    'fire+nature': { sp: 'magmoss' }, 'nature+water': { sp: 'puffcap' }, 'light+water': { sp: 'tidewisp' },
    'light+wind': { sp: 'haloray' }, 'dark+wind': { sp: 'veilfox' }, 'dark+earth': { sp: 'whisperhusk' },
    'earth+nature': { sp: 'mossbun' }, 'earth+light': { sp: 'pebblop' }, 'earth+water': { sp: 'ripplet' },
    'fire+light': { sp: 'emberkit' }, 'fire+wind': { sp: 'zephyrow' },
    'light+nature': { sp: 'lumifern' }, 'dark+fire': { sp: 'umbrit' },
    'dark+light': { sp: 'echolyn', locked: true },
    'resonance+resonance': { sp: 'driftcub', locked: true },
  };
  // any resonance + non-resonance (locked) -> chimerrow  (handled in rules)
  D.BREED_COST = { gold: 40, food: 25 };
  D.BREED_MIN_LEVEL = 5;
  D.EGG_SECONDS = { fast: 20, normal: 300 };

  /* ---------- Structures (restoration) ---------- */
  // pos is in island-scene units (1000 x 500)
  D.STRUCTURES = {
    hollow:      { name: 'Sunlit Hollow',   kind: 'habitat', cost: 40,  x: 450, y: 300, produces: 'food', rate: 4,
                   affinity: ['nature', 'light'], desc: 'A cracked stone alcove with a patch of sun. A perfect first home.' },
    tidegate:    { name: 'Tide Gate',       kind: 'habitat', cost: 90,  x: 190, y: 335, produces: 'gold', rate: 3, req: { struct: 'hollow' },
                   affinity: ['water'], desc: 'A drowned archway where the tide still tries to come in. Opens the Tide Pools.' },
    moonshrine:  { name: 'Moon Shrine',     kind: 'habitat', cost: 130, x: 735, y: 195, produces: 'gems', rate: 0.25, req: { struct: 'tidegate' },
                   affinity: ['dark', 'light'], desc: 'A hilltop shrine, half swallowed by ivy. Opens the Dusk Grove.' },
    hatchery:    { name: 'Old Hatchery',    kind: 'ruin',    cost: 110, x: 640, y: 345, req: { struct: 'tidegate' },
                   desc: 'A dome of cracked shell-stone. Restores breeding and the Egg Chamber.' },
    reliquarygate: { name: 'Reliquary Gate', kind: 'ruin',   cost: 140, x: 285, y: 190, req: { flag: 'r1' },
                   desc: 'A great door in the hillside, sealed by vines. Opens the Overgrown Reliquary.' },
  };
  D.STRUCT_ORDER = ['hollow', 'tidegate', 'reliquarygate', 'hatchery', 'moonshrine'];
  // Future habitat plots (decorative faint markers so the layout visibly supports 10 placements)
  D.FUTURE_PLOTS = [[130, 250], [350, 420], [540, 420], [760, 420], [860, 280]];

  /* ---------- Exploration areas ---------- */
  // steps: sequence for explore #1, #2, ...; after the list: small generic rewards.
  D.AREAS = {
    meadow:    { name: 'Sunlit Meadow', blurb: 'Warm grass, dandelion drift, and the occasional suspicious rustle.', unlock: null,
                 steps: [['res', 10, 4], ['find', 'mossbun'], ['res', 12, 4], ['find', 'pebblop'], ['res', 14, 5], ['find', 'thornpup']] },
    tidepools: { name: 'Tide Pools', blurb: 'Shallow, glittering pools threaded with old stonework.', unlock: { struct: 'tidegate' },
                 steps: [['res', 14, 4], ['find', 'ripplet'], ['res', 16, 5], ['find', 'brinefin']] },
    emberridge:{ name: 'Ember Ridge', blurb: 'Warm stone ridges that were not warm before the humming began.', unlock: { flag: 'r1' },
                 steps: [['res', 16, 5], ['find', 'emberkit'], ['res', 18, 5], ['find', 'cindersnail'], ['res', 20, 5], ['find', 'graniteling']] },
    duskgrove: { name: 'Dusk Grove', blurb: 'A stand of lantern-trees that never quite gets dark, and never quite gets light.', unlock: { struct: 'moonshrine' },
                 steps: [['res', 18, 5], ['find', 'gloomole']] },
    windbluff: { name: 'Wind Bluff', blurb: 'Cliffs that used to be a hill. The wind is very new and very interested.', unlock: { flag: 'r2' },
                 steps: [['res', 20, 6], ['find', 'zephyrow'], ['res', 22, 6], ['find', 'stormfinch'], ['res', 24, 6], ['find', 'glimmoth']] },
    driftisle: { name: 'Drift Isle', blurb: 'A small island hanging in the sky where no island should be.', unlock: { flag: 'r2' },
                 steps: [['res', 24, 6], ['find', 'driftcub']] },
  };
  D.AREA_ORDER = ['meadow', 'tidepools', 'emberridge', 'duskgrove', 'windbluff', 'driftisle'];
  D.BEFRIEND_COST = 8; // food

  /* ---------- Dungeons ---------- */
  D.DUNGEONS = {
    reliquary: {
      name: 'The Overgrown Reliquary', playable: true, el: 'nature',
      theme: 'Nature reclaiming a sanctuary vault. Mossy stairs, humming roots, and a staircase that remembers you.',
      unlock: { struct: 'reliquarygate' }, unlockText: 'Restore the Reliquary Gate.',
      recommended: 5,
      floors: [
        { name: 'Mossy Threshold', battles: [{ sp: 'mossbun', lv: 3 }, { sp: 'thornpup', lv: 3 }] },
        { name: 'The Whispering Stacks', battles: [{ sp: 'pebblop', lv: 4 }, { sp: 'puffcap', lv: 5 }] },
        { name: 'Heart of the Reliquary', battles: [{ sp: 'relicwarden', lv: 6, boss: true, title: 'Rootbound Sentinel', hpMult: 1.1 }] },
      ],
      rewardText: '150 gold, 40 food, 5 gems, Relicwarden (first clear), Briarstag (second clear).',
      clearReward: { gold: 150, food: 40, gems: 5 },
    },
    hollowveil: {
      name: 'The Hollow Veil', playable: false, el: 'dark',
      theme: 'A Dark-themed ruin full of forgotten history: corridors that rearrange behind you and traces nobody wrote down.',
      unlock: { rank: 6 }, unlockText: 'Reach Caretaker Rank 6 and restore the Moon Shrine.',
      recommended: 12, species: ['gloomole', 'veilfox', 'whisperhusk'],
      floors: [{ name: 'The Unwritten Hall' }, { name: 'Margins' }, { name: 'The Hollow Warden' }],
      rewardText: 'Veil relics, Dark-leaning Aminas, and the first real clue about the old war.',
    },
    resonancescar: {
      name: 'The Resonance Scar', playable: false, el: 'resonance',
      theme: 'A wound in the island where gravity, weather and time argue. Encounters change as you walk.',
      unlock: { rank: 9 }, unlockText: 'Clear the Hollow Veil.',
      recommended: 18, species: ['resonyx', 'driftcub', 'chimerrow', 'echolyn'],
      floors: [{ name: 'Where the Sky Is Floor' }, { name: 'The Long Moment' }, { name: 'The Quiet Centre' }],
      rewardText: 'Resonance-touched Aminas and answers that The Entity would rather not give.',
    },
  };
  D.DUNGEON_ORDER = ['reliquary', 'hollowveil', 'resonancescar'];

  /* ---------- Missions ---------- */
  // cond: {k, ...}; reward: {gold, food, gems}
  D.MISSIONS = [
    { id: 'm_hollow', title: 'Make Room for Kind Souls', desc: 'Restore the Sunlit Hollow so your companion has a proper home.',
      hint: 'Tap the glowing ruin in the middle of the island.', after: [], cond: { k: 'struct', id: 'hollow' }, reward: { gold: 30, food: 10 } },
    { id: 'm_feed', title: 'First Meal', desc: 'Feed your companion. Yes, with food. Revolutionary.',
      hint: 'Tap Feed at the bottom-left, then choose a snack.', after: ['m_hollow'], cond: { k: 'fed', n: 1 }, reward: { gold: 10, food: 20 } },
    { id: 'm_lv3', title: 'Growing Pains', desc: 'Raise any Amina to level 3.',
      hint: 'Keep feeding your companion. Snacks add up.', after: ['m_feed'], cond: { k: 'level', n: 3 }, reward: { gold: 40, food: 15 } },
    { id: 'm_find', title: 'A Friend of the Meadow', desc: 'Befriend a second Amina on the island.',
      hint: 'Open Explore and wander the Sunlit Meadow. Offer food when something appears.', after: ['m_feed'], cond: { k: 'owned', n: 2 }, reward: { gold: 40, food: 10 } },
    { id: 'm_tide', title: 'The Tide Gate', desc: 'Restore the Tide Gate so the water can find its way back.',
      hint: 'Tap the drowned archway on the west shore.', after: ['m_lv3'], cond: { k: 'struct', id: 'tidegate' }, reward: { gold: 40, food: 20, gems: 2 } },
    { id: 'm_r1', title: 'Something Is Humming', desc: 'Investigate the Resonance disturbance by the east shore.',
      hint: 'Tap the glowing ring of stones on the east shore.', after: ['m_tide'], cond: { k: 'flag', id: 'r1' }, reward: { gold: 60, food: 20 } },
    { id: 'm_lv5', title: 'Almost Ready', desc: 'Raise any Amina to level 5. The Reliquary is not kind to level threes.',
      hint: 'Feed your companion. A Feast gives much more experience.', after: ['m_find'], cond: { k: 'level', n: 5 }, reward: { gold: 60, food: 25 } },
    { id: 'm_party', title: 'Strength in Numbers', desc: 'Have three Aminas in your sanctuary.',
      hint: 'Explore the Meadow and Tide Pools for more Kind Souls.', after: ['m_find'], cond: { k: 'owned', n: 3 }, reward: { food: 25, gold: 30 } },
    { id: 'm_gate', title: 'The Reliquary Gate', desc: 'Restore the great door in the hillside.',
      hint: 'Tap the vine-sealed door at the back of the island.', after: ['m_r1', 'm_lv5'], cond: { k: 'struct', id: 'reliquarygate' }, reward: { gold: 40, gems: 2 } },
    { id: 'm_dungeon', title: 'The Overgrown Reliquary', desc: 'Enter the Reliquary and put the disturbance to rest.',
      hint: 'Open Dungeon, choose up to three Aminas, and go in.', after: ['m_gate', 'm_party'], cond: { k: 'dungeon', id: 'reliquary', n: 1 }, reward: { gold: 150, food: 40, gems: 5 } },
    { id: 'm_stone', title: 'The Stone That Isn’t on the Map', desc: 'Something new stands near the heart of the island. Go and look at it.',
      hint: 'Tap the pale standing stone in the centre of the island.', after: ['m_dungeon'], cond: { k: 'flag', id: 'stone' }, reward: { gold: 100, gems: 3 }, finale: true },

    // Sanctuary tasks (side)
    { id: 's_collect8', title: 'Naturalist I', side: true, desc: 'Befriend eight different Aminas.', after: ['m_hollow'], cond: { k: 'species', n: 8 }, reward: { gold: 80, food: 30 } },
    { id: 's_collect15', title: 'Naturalist II', side: true, desc: 'Befriend fifteen different Aminas.', after: ['s_collect8'], cond: { k: 'species', n: 15 }, reward: { gold: 150, gems: 4 } },
    { id: 's_collect24', title: 'Naturalist III', side: true, desc: 'Befriend twenty-four different Aminas.', after: ['s_collect15'], cond: { k: 'species', n: 24 }, reward: { gold: 300, gems: 10 } },
    { id: 's_lv10', title: 'Elder Kind Soul', side: true, desc: 'Raise any Amina to level 10.', after: ['m_lv5'], cond: { k: 'level', n: 10 }, reward: { gold: 100, food: 40 } },
    { id: 's_evolve', title: 'A Change of Shape', side: true, desc: 'Evolve an Amina (starters evolve at level 12).', after: ['s_lv10'], cond: { k: 'evolved', n: 1 }, reward: { gold: 150, gems: 3 } },
    { id: 's_hatch', title: 'Something Warm in the Shell', side: true, desc: 'Hatch an egg in the Old Hatchery.', after: ['m_hollow'], cond: { k: 'hatched', n: 1 }, reward: { gold: 60, food: 30 } },
    { id: 's_restore', title: 'Proper Housekeeping', side: true, desc: 'Restore every structure on the island.', after: ['m_tide'], cond: { k: 'allstruct' }, reward: { gold: 200, gems: 5 } },
    { id: 's_wins', title: 'Practice Makes Slightly Better', side: true, desc: 'Win ten battles.', after: ['m_dungeon'], cond: { k: 'wins', n: 10 }, reward: { gold: 100, food: 30 } },
  ];

  D.START = { gold: 100, food: 40, gems: 0 };
  D.SNACKS = {
    snack: { name: 'Berry Snack', food: 3, xp: 18, desc: 'A small, cheerful snack.' },
    feast: { name: 'Honey Feast', food: 10, xp: 70, desc: 'Proper dinner. Very proper.' },
  };
  D.RANK_NEED = (r) => 50 + r * 25;
})(typeof window !== 'undefined' ? window : globalThis);
