// Creature lore: a short entry for every creature, plus a field note (where, when, or how to find it).
// Used by the companion field guide (tools/build-companion.mjs) and ready for an in-game Creature Log.
var CC = window.CC || (window.CC = {});

CC.LORE = {
  // ---- starters ----
  drizzlon: { lore: 'A baby water dragon that hatches from eggs left in spring rain puddles. The droplet on its tail never dries out, and it flicks it at friends to say hello.', note: 'One of Elder Willow\'s three starters.' },
  rapidrake: { lore: 'Its fin-wings grow long enough to skim across lakes like a skipped stone. It practices racing the river current every morning and usually wins.', note: 'Drizzlon evolves into it at Lv 14.' },
  tsunadrake: { lore: 'When it beats its wave-shaped wings, storms gather out of a clear sky. The yellow marks on its body crackle with the lightning it swallows from those storms.', note: 'Rapidrake evolves into it at Lv 30. Water and Bolt.' },
  mossback: { lore: 'A sleepy turtle whose shell grows a little bush, and it is very proud of its single pink flower. It naps in sunny spots so the bush can grow.', note: 'One of Elder Willow\'s three starters.' },
  thornshell: { lore: 'Its bush has thickened into a thorny thicket that keeps hungry creatures away. Birds still nest in it, and Thornshell lets them.', note: 'Mossback evolves into it at Lv 14.' },
  elderoak: { lore: 'An oak tree has rooted in its rocky shell. Old stories say whole villages once grew up in the shade of a sleeping Elderoak without ever knowing it was alive.', note: 'Thornshell evolves into it at Lv 30. Plant and Earth.' },
  embroak: { lore: 'A cheeky fire frog that keeps a tiny ember on the tip of its tongue. It loves to sneak up and pop that ember near people\'s ears.', note: 'One of Elder Willow\'s three starters.' },
  cinderfrog: { lore: 'Flames now run all down its back, and it hops between hot rocks to stay toasty. Its croak sounds like a crackling campfire.', note: 'Embroak evolves into it at Lv 14.' },
  infernotoad: { lore: 'Its skin has cooled into charcoal rock, cracked with glowing lava veins. When it slams down, the ground around it bakes hard as brick.', note: 'Cinderfrog evolves into it at Lv 30. Fire and Earth.' },

  // ---- Meadow Path ----
  clovermouse: { lore: 'It wears a four-leaf clover like a hat and is said to bring good luck to anyone who sees it first. It is shy and scurries off at the first footstep.', note: 'Common on the Meadow Path, and in Copperbell\'s park.' },
  hopsprout: { lore: 'The two-leaf sprout on its head turns to follow the sun all day. It can leap ten times its own height to snatch a falling seed.', note: 'Common on the Meadow Path. A Normal type.' },

  // ---- Grassland ----
  tuftail: { lore: 'This fox\'s tail is a bundle of living grass. It hides in tall grass with only the tip showing, and you only spot it when the tail blinks.', note: 'Common in the Grassland, near the tree lines.' },
  verdantail: { lore: 'Flowers bloom in its huge grassy tail, and they change with the seasons. A field it naps in grows greener overnight.', note: 'Tuftail evolves into it at Lv 18.' },
  bumblop: { lore: 'Half bee, half bunny, all fluff. It buzzes clumsily from flower to flower and gives off tiny sparks of static when it is excited.', note: 'Uncommon in the Grassland.' },
  bumblazer: { lore: 'Its wings crackle with electricity and it zips about too fast to follow. A swarm of Bumblazer over a field means a thunderstorm is coming.', note: 'Bumblop evolves into it at Lv 20.' },
  dandylion: { lore: 'A lion cub with a mane of dandelion puffs. When it roars, the puffs scatter on the wind, and new dandelions sprout wherever they land.', note: 'Rare in the Grassland. The farm kid has only seen one once.' },
  sunmane: { lore: 'Touched by a Sun Shard, its mane blazes like the summer sun. It is said to appear on the longest day of the year to warm the fields.', note: 'Dandylion evolves into it with a Sun Shard. Fire and Lumen.' },
  pebblepup: { lore: 'A playful puppy with rocky patches in its fur and a pebble stuck to its nose that it refuses to let go of. It fetches anything, especially rocks.', note: 'Common in the Grassland and Copperbell. Farmer Bramble has one.' },
  boulderhound: { lore: 'Boulder armor covers its shoulders and back, and it stands guard over farms through the night. One bark can be heard across the whole valley.', note: 'Pebblepup evolves into it at Lv 18.' },

  // ---- Forest ----
  owlcorn: { lore: 'It wears a giant acorn cap as a hat and never takes it off, even to sleep. It hoards acorns in hollow trees and forgets most of them, which is how new oaks grow.', note: 'Uncommon in the Forest and the Whispering Grove.' },
  timberowl: { lore: 'Its feathers have hardened like bark and its acorn crown sprouts fresh oak leaves. Strong enough to carry a person, it is the bird that answers the Wooden Whistle.', note: 'Owlcorn evolves into it at Lv 22. It carries you when you Fly.' },
  barkbeetle: { lore: 'Its shell is so much like tree bark that woodcutters have tried to chop it. It munches fallen logs and leaves the forest floor tidy.', note: 'Common in the Forest.' },
  mothlight: { lore: 'A pale moth whose wings glow softly in the dark. Lost travelers follow its light, and it always leads them to a path.', note: 'Uncommon in the Forest, and at night in the Whispering Grove.' },
  radimoth: { lore: 'Bathed in moonlight from a Moon Shard, its wings now shine with sunburst patterns. Its glow keeps shadows away from anyone it decides to protect.', note: 'Mothlight evolves into it with a Moon Shard.' },
  budstag: { lore: 'A young deer whose branch-like antlers bud with pink blossoms each spring. Where it walks, flowers open a little earlier.', note: 'Rare in the Forest. Solo.' },
  mushling: { lore: 'A mushroom creature that peeks out from under its spotted cap and darts back if you look at it. Its spores can make you sleepy, so don\'t sniff too close.', note: 'Forest and Whispering Grove. A Shadow type despite its looks.' },

  // ---- Water ----
  bubblefin: { lore: 'A tiny round fish that blows bubbles when it\'s happy, which is nearly always. Children chase its bubbles along the shore.', note: 'Common on the Lakeshore.' },
  surgefin: { lore: 'It has grown sleek and fast, with a spiky fin and a toothy grin. It rides the strongest currents just for fun.', note: 'Bubblefin evolves into it at Lv 16.' },
  crabbit: { lore: 'A crab with long rabbit ears that it uses to listen for danger under the sand. It hops sideways faster than you\'d expect.', note: 'Common on the Lakeshore.' },
  rampacrab: { lore: 'Its ears and shell are armored with stone, and it builds little sea walls out of rocks. Fisher Gus calls it the harbor\'s doorman.', note: 'Crabbit evolves into it at Lv 20. Water and Earth.' },
  tidepuff: { lore: 'When startled it puffs up into a spiky ball and bobs to the surface, looking very offended. It deflates slowly, one sigh at a time.', note: 'Uncommon on the Lakeshore. Solo.' },
  koiling: { lore: 'An elegant koi with long ribbon fins and golden whiskers. Legend says a Koiling that swims up a waterfall becomes a dragon.', note: 'Rare on the Lakeshore.' },
  koidrake: { lore: 'The legend was true. Its scales shimmer gold and its fins glow like lanterns underwater. It is a sign of good fortune.', note: 'Koiling evolves into it at Lv 24. Water and Lumen.' },
  sealamp: { lore: 'A baby seal with a glowing bulb on its forehead that lights up the deep water. Sailors once used Sealamp light to find their way home.', note: 'Uncommon on the Lakeshore. Solo.' },

  // ---- Cave ----
  glimmole: { lore: 'Its claws are crystal, and it digs through stone like soft soil. The tunnels it leaves glitter with crystal dust.', note: 'Common in the Crystal Cave.' },
  prismole: { lore: 'Crystals cover its back, and they hum with stored electricity. Miners follow Prismole to find the richest veins.', note: 'Glimmole evolves into it at Lv 22. Bolt and Earth.' },
  stalagbat: { lore: 'It hangs so still from cave ceilings that it looks like a stalactite. Only its glowing yellow eyes give it away.', note: 'Common in the Crystal Cave. Solo.' },
  magmite: { lore: 'A beetle with a charcoal shell split by glowing lava cracks. It keeps the deepest caves warm.', note: 'Rare in the Crystal Cave, near the hot vents.' },
  volcaneetle: { lore: 'Its shell has become a little volcano that rumbles when it\'s angry. Smoke from its crater tells you to keep your distance.', note: 'Magmite evolves into it at Lv 26.' },
  gemlin: { lore: 'A cheeky lizard with gems along its back. It grows a new gem each time it eats a shiny stone, so keep your rings in your pocket.', note: 'Uncommon in the Crystal Cave. Solo.' },
  rumblepede: { lore: 'An armored centipede that coils into a wheel and rolls through tunnels. You hear it coming as a deep rumble long before you see it.', note: 'Uncommon in the Crystal Cave. Solo.' },

  // ---- Desert ----
  dunefox: { lore: 'Its huge ears hear beetles walking under the sand from far away. It stays cool by napping in the shade of cacti.', note: 'Uncommon in the Sunscorch Desert. Solo.' },
  cactoad: { lore: 'A toad covered in cactus spines, with a little pink flower on its head that blooms after rain. It can go a whole year without a drink.', note: 'Common in the Sunscorch Desert. Solo.' },
  scarabolt: { lore: 'A blue and gold scarab whose shell stores sunlight as electricity. Desert nomads say it rolls the sun across the sky.', note: 'Rare in the Sunscorch Desert.' },
  thundarab: { lore: 'A ring of crackling energy orbits its body, and lightning bolts glow on its shell. One charge can light a camp for a night.', note: 'Scarabolt evolves into it at Lv 26. Bolt and Fire. Wild ones live in the Dawn Temple.' },
  sandwyrm: { lore: 'A baby sand worm that pops out of little mounds to look around. If you hear the sand hiss, one is right below you.', note: 'Common in the Sunscorch Desert.' },
  duneserpent: { lore: 'An armored serpent that swims through dunes like water. Safi the Nomad reads its trails to find hidden oases.', note: 'Sandwyrm evolves into it at Lv 24.' },

  // ---- Snow ----
  frostoat: { lore: 'A white stoat with an icicle for a tail. It vanishes against fresh snow, so most people only ever see its tail.', note: 'Uncommon in Frostpeak Pass.' },
  glacistoat: { lore: 'Ice-blue crystal armor runs down its back, and its tail is a blade of ice. It hunts across frozen lakes without a sound.', note: 'Frostoat evolves into it at Lv 24.' },
  pengloo: { lore: 'A round penguin in a red scarf that someone once knitted for it. It never takes the scarf off, and now every Pengloo wears one.', note: 'Common in Frostpeak Pass.' },
  pengarch: { lore: 'A tall, noble penguin that leads its colony across the ice, with a crown of ice shards and a gold-edged scarf. It is very serious about being in charge.', note: 'Pengloo evolves into it at Lv 22. Frost and Water.' },
  yetiny: { lore: 'A small shaggy yeti that loves snowball fights and always throws first. Its big footprints are how the old yeti stories started.', note: 'Rare in Frostpeak Pass. Solo.' },
  sleetle: { lore: 'A snail whose shell is made of ice crystals that never melt. It moves slowly but leaves a sparkling trail of frost.', note: 'Common in Frostpeak Pass. Solo.' },

  // ---- Swamp ----
  lilypadle: { lore: 'A fluffy duckling that rides its own lily pad around the swamp. It refuses to leave the pad, even to eat.', note: 'Common in Murkmire Swamp, uncommon in Firefly Bayou. Solo.' },
  wispeel: { lore: 'Its tail ends in a glowing orb of swamp gas. Travelers mistake it for a lantern and wander off the boardwalk.', note: 'Uncommon in Murkmire Swamp. Solo.' },
  mudgator: { lore: 'A baby gator caked in mud that loves wallowing in the warmest puddles. Its tiny teeth don\'t stop it from acting tough.', note: 'Common in Murkmire Swamp.' },
  mudgatron: { lore: 'A huge gator armored in hardened mud plates. It lies still for days looking like a mossy log, until something steps on it.', note: 'Mudgator evolves into it at Lv 28.' },
  mireling: { lore: 'A gentle ghost covered in moss and hanging vines. It drifts over the swamp at night, humming songs nobody remembers.', note: 'Rare in Murkmire Swamp. Solo.' },

  // ---- Night Ruins ----
  wispkin: { lore: 'A little ghost shaped like an old lantern, with a blue flame inside. It is curious about people and follows them around the ruins.', note: 'Common in the Night Ruins, uncommon in the Ancients\' Archive.' },
  beaconwraith: { lore: 'Its lantern body now burns with a bright white-blue flame, and a ring of light circles it. It guides lost souls home through the ruins.', note: 'Wispkin evolves into it with a Moon Shard. Lumen and Shadow.' },
  pebbleton: { lore: 'A small stone golem with a glowing rune on its chest, built long ago to guard the ruins. It still follows its last order: keep the gates.', note: 'Uncommon in the Night Ruins. Solo.' },
  bonecat: { lore: 'A playful skeleton kitten that rattles when it pounces. Its glowing purple eyes are the only warm thing about it.', note: 'Uncommon in the Night Ruins.' },
  bonepanther: { lore: 'A large skeleton panther wrapped in purple smoke. It stalks the ruins in silence, its bones never making a sound.', note: 'Bonecat evolves into it at Lv 30.' },
  fangling: { lore: 'A round baby vampire bat that wraps its wings around itself like a cape. It sips nectar from night roses, and the rosebud on its head is its first flower.', note: 'Uncommon in the Night Ruins.' },
  duskfang: { lore: 'A lean, cheeky vampire bat whose rose is half open. It loves to swoop at travelers\' lanterns and vanish into the dusk.', note: 'Fangling evolves into it at Lv 33.' },
  rosferatu: { lore: 'An elegant vampire lord with crimson-lined wings and a fully bloomed rose on its chest. It tends a secret night garden deep in the ruins and drains the energy of anyone who tramples its roses.', note: 'Duskfang evolves into it at Lv 42. Shadow and Plant.' },
  lunariond: { lore: 'Lunarion, worn out from keeping the moon alight for a thousand years. A shadow has crept into its tired heart, cracking its crest and dimming its starry wings. It is not cruel, only frightened and hurting.', note: 'The final battle at the Moon Altar. It can\'t be caught. Calm it by winning.' },
  lunarion: { lore: 'The guardian of the moon: a silver wolf whose wings hold the night sky. Each night it flies up from the Moon Altar, and its crest is the light the moon shines with. Once calmed, it watches over whoever helped it.', note: 'Calm it, then catch it. If it gets away, it waits at the top of the Moonlit Spire.' },
  moonlynx: { lore: 'A silver lynx with a glowing crescent moon on its forehead. It only appears on clear nights, and catching one is said to be the mark of a true creature catcher.', note: 'The rarest wild creature: Night Ruins, very hard to catch.' },
};
