/* ============================ talking to the people outside ============================ */
const TOWN_FOLK = [
  { id: 'maya', name: 'Maya', role: 'Jogger',
    greet: ['Morning! Do you run? You look like you could run.', 'Back again! I did the loop twice today.', 'You are getting to be a regular. I like it.', 'Look at us, running buddies. Well, you are standing, but still.'],
    replies: [['"I should start running."', 'Start with a lap of the fountain. Seriously, that is all it takes.'], ['"How do you have this much energy?"', 'Sleep, water, and not skipping breakfast. Boring, but true.'], ['"I just moved here."', 'Welcome! The park is the best part of town. Do not tell anyone.']],
    topics: [['Where is a good place to walk?', 'Circle the park fountain. The path is flat, the benches are free and the water is cold.'], ['Any tips for being less tired?', 'Naps are underrated. A short one at home gets you through the afternoon, but a real night in bed beats everything.']],
    perk: { text: 'Maya gives you a pep talk. Energy +6.', go() { S.energy = clamp(S.energy + 6, 0, 100); } } },
  { id: 'rosa', name: 'Rosa', role: 'Dog walker',
    greet: ['Oh hello! Biscuit says hi. He is the one pulling me down the street.', 'You again! Biscuit remembers you, I think.', 'Nice to see a friendly face. Most people just look at their phones.', 'We were just talking about you. Well, I was. Biscuit was sniffing a bush.'],
    replies: [['"Cute dog. Where is he?"', 'Ha, he is a very small, very invisible dog. Best behaved in town.'], ['"Do you know the neighbors?"', 'Everyone. Walk a dog for a year and you know everyone.'], ['"Do you walk dogs full time?"', 'Pretty much. Tips are small but the company is great.']],
    topics: [['Where should I eat?', 'Dot\'s Diner is cozy and the grocery is cheaper if you cook. Do both, depending on your week.'], ['What is the neighborhood like?', 'Quiet. The apartment building is solid and the landlord only cares about Sunday. Pay on time and you will get along.']],
    perk: { text: 'Rosa lets you take a swig from her water bottle. Thirst +12.', go() { S.thirst = clamp(S.thirst + 12, 0, 100); } } },
  { id: 'bell', name: 'Mr. Bell', role: 'Mail carrier',
    greet: ['Twenty years on this route. I know every doorstep.', 'Nothing for you today. Which is good, because it is usually bills.', 'Ah, my favorite resident. Do not tell the others.', 'You have the walk of a person who is almost late. Relax.'],
    replies: [['"Twenty years? That is dedication."', 'Rain, snow, dogs. Not Biscuit though. Biscuit is a gentleman.'], ['"Any mail for me?"', 'Only a flyer for window cleaning. Want it? No? Smart.'], ['"Do you like the job?"', 'I like the walking. A good job is one where you do not mind the walk home.']],
    topics: [['Any advice for a new graduate?', 'Do not be afraid of the early shift. Mornings are quiet and the day feels longer.'], ['How does rent work around here?', 'Rent is $' + RENT + ' a week, due on Sunday. A day late costs you $' + LATE_FEE + ', and wait past three days and you will be looking for a new home.']],
    perk: { text: 'Mr. Bell shares half a granola bar. Hunger +6.', go() { S.hunger = clamp(S.hunger + 6, 0, 100); } } },
  { id: 'theo', name: 'Theo', role: 'College student',
    greet: ['Please tell me you know where the diner is. I have a paper due.', 'Hey! You are the one with the real degree. How is the real world?', 'I have been up since yesterday. Do not copy me.', 'Oh good, you. I need to ask a very important question about coffee.'],
    replies: [['"Real world is... a lot."', 'Great. Fantastic. I will stay in school forever then.'], ['"Do not stay up all night."', 'I know! I know. But the paper is not going to write itself. I tried.'], ['"What are you studying?"', 'Undecided, mostly. It is a wide field, undecided.']],
    topics: [['Should I stay up late?', 'Honestly? No. I do it all the time and I am a wreck by noon. You lose energy the next morning.'], ['Is the job worth it?', 'Everyone says your first job teaches you more than your degree did. I am still waiting to find out.']],
    perk: { text: 'Theo presses $5 into your hand for telling him about the diner.', go() { S.money += 5; S.stats.earned += 5; } } },
  { id: 'priya', name: 'Priya', role: 'Barista on break',
    greet: ['Five minutes of quiet. Please let it be five minutes of quiet.', 'I smell like espresso, sorry. Hello.', 'I made too many iced coffees today. Want to hear about it?', 'My break is ten minutes. Make it fun.'],
    replies: [['"Long shift?"', 'Never ends. But the regulars make it worth it. Hello, regular.'], ['"What is your favorite drink?"', 'Plain cold brew. I make fancy ones all day, but I go home to plain.'], ['"I could use a coffee myself."', 'Everyone could. Here, have a sip of mine.']],
    topics: [['How do I stay awake?', 'Water first, caffeine second. Most people who are sleepy are just thirsty.'], ['Anything to do at night?', 'The park is peaceful after dark. Bring a jacket, skip the fountain, and go to bed before midnight.']],
    perk: { text: 'Priya hands you the end of her iced coffee. Energy +5, thirst +6.', go() { S.energy = clamp(S.energy + 5, 0, 100); S.thirst = clamp(S.thirst + 6, 0, 100); } } },
  { id: 'walt', name: 'Walt', role: 'Retired, bench regular',
    greet: ['Sit down, sit down. The bench has room.', 'Seen it all in this town, and I still like watching it.', 'Oh good, someone to talk to. The pigeons are terrible listeners.', 'You look better than last week. Sleeping well?'],
    replies: [['"I will stand, thanks."', 'Suit yourself. The bench is not going anywhere. Neither am I.'], ['"Tell me about the town."', 'This used to be all fields. Then the park, then the diner, then you.'], ['"How do you stay so calm?"', 'I stopped rushing in 1998. Best decision I ever made.']],
    topics: [['What is the secret to good sleep?', 'Eat, drink some water, pay your rent, and go to bed. Worries make nightmares. A calm head makes good dreams.'], ['What would you do in my shoes?', 'Save a little every week. Eat real meals. Talk to your neighbors. In that order.']],
    perk: { text: 'Walt shares his old trick for sleeping: warm milk and a quiet room. Nightmares are less likely tonight.', go() { S.calm = true; } } },
  { id: 'june', name: 'June', role: 'Sketch artist',
    greet: ['Hold still. No, keep walking, I like the motion.', 'I draw everyone who walks by. You are in my book three times.', 'Have you looked at the sky today? Really looked?', 'Hello again, muse.'],
    replies: [['"Can I see your sketchbook?"', 'Only if you are kind. Ha, you are, so yes. Page twelve is you, kind of.'], ['"What are you drawing?"', 'The fountain, mostly. It never sits still, which keeps me honest.'], ['"You are really talented."', 'Thank you. That is the nicest thing anyone said to me all week.']],
    topics: [['Where is the prettiest spot?', 'The park at sunset. The light turns the whole fountain orange and everyone goes quiet.'], ['Any advice for a stressful week?', 'Look up from your work now and then. The world is still there, and so is the weather.']],
    perk: { text: 'June sketches you. You feel oddly seen. Energy +4.', go() { S.energy = clamp(S.energy + 4, 0, 100); } } }
];
function folkById(id) { return TOWN_FOLK.find(f => f.id === id); }
const addFolk = f => { TOWN_FOLK.push(f); return f; };
function npcById(id) { return NPCS.find(n => n.id === id); }
function friendLabel(v) { return v >= 7 ? 'Close friend' : v >= 4 ? 'Friend' : v >= 1 ? 'Acquaintance' : 'Stranger'; }

/* a line that reacts to how you are doing right now, or '' if nothing stands out */
function folkContext() {
  if (!S.rent.paid && S.rent.late > 0) return 'Rough week? You look worried. Whatever it is, sort the rent first.';
  if (S.t >= 22 * 60 || S.t < 5 * 60) return 'It is awfully late to be out. Get some sleep, will you?';
  if (S.hunger < 25) return 'You look starving. Go eat something before you fall over.';
  if (S.thirst < 25) return 'You look parched. Get a drink, there is water at the park fountain.';
  if (S.energy < 22) return 'You look wiped out. Do yourself a favor and rest.';
  return '';
}

function talkNear() {
  let best = null, bd = 1e9;
  for (const n of NPCS) {
    if (!n.id) continue;
    const d = Math.hypot(n.x - S.px, (n.y - S.py) * 1.1);
    if (d < 64 && d < bd) { bd = d; best = n; }
  }
  return best;
}

function townTalkSpec(id) {
  const f = folkById(id), n = npcById(id);
  if (!f) return { band: '#3a5a7a', title: 'Townsperson', sub: '', note: '', sections: [] };
  const friend = S.friends[id] || 0;
  if (!G.talk || G.talk.id !== id) {
    const ctx = folkContext();
    G.talk = { id, stage: 0, reply: ctx ? ctx : f.greet[friend % f.greet.length], perk: '', asked: [], first: S.townTalk[id] !== S.day };
  }
  const T = G.talk, BAND = '#3a5a7a';
  const stock = [friendLabel(friend), T.first ? 'First chat today' : 'Already chatted today'];
  const sub = f.role;
  if (T.stage === 0) {
    return { band: BAND, title: f.name, sub, stock, note: '"' + T.reply + '"',
      sections: [{ h: 'Your reply', items: f.replies.map(r => ({ t: r[0], tag: '5 min', go() {
        T.stage = 1; T.reply = r[1]; S.friends[id] = friend + 1; addMood((T.first ? 3 : 1) * (hasPerk('social') ? 2 : 1)); lifeEv('chat');
        if (T.first && (!f.perk.needs || f.perk.needs())) { S.townTalk[id] = S.day; f.perk.go(); T.perk = f.perk.text; SFX.chime('pay'); }
        S.stats.chats = (S.stats.chats || 0) + 1;
        applyIntake({ mins: 5 });
      } })) }] };
  }
  const items = f.topics.map((t, i) => ({ t: t[0], tag: '5 min', go() { T.asked.push(i); T.reply = t[1]; T.perk = ''; applyIntake({ mins: 5 }); } }));
  const left = items.filter((it, i) => !T.asked.includes(i));
  return { band: BAND, title: f.name, sub, stock, note: '"' + T.reply + '"' + (T.perk ? '  ' + T.perk : ''),
    sections: left.length ? [{ h: 'Ask about', items: left }] : [], cta: 'Say goodbye' };
}

/* little speech bubble and name tag over townspeople */
function drawNpcTag(c, n) {
  if (!n.id) return;
  const pd = Math.hypot(n.x - S.px, n.y - S.py);
  const fresh = S.townTalk[n.id] !== S.day;
  if (pd >= 340 || (pd >= 90 && !fresh)) return;
  FX.over.push(() => {
  if (pd < 90) {
    // a glass name plate: soft shadow, navy gradient, a lit top edge, a marigold hairline and a little tail toward the head
    c.font = '700 11.5px "DM Sans", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const w = c.measureText(n.name).width + 16, y = n.y - 60, x0 = n.x - w / 2, y0 = y - 9.5;
    c.fillStyle = 'rgba(0,0,0,.1)'; rr(c, x0 - 2, y0 + 0.5, w + 4, 22, 11); c.fill();
    c.fillStyle = 'rgba(0,0,0,.2)'; rr(c, x0 - 0.5, y0 + 2, w + 1, 19, 9.5); c.fill();
    const g = c.createLinearGradient(0, y0, 0, y0 + 18); g.addColorStop(0, 'rgba(31,46,64,.96)'); g.addColorStop(1, 'rgba(13,23,33,.96)');
    c.fillStyle = g; rr(c, x0, y0, w, 18, 9); c.fill();
    c.beginPath(); c.moveTo(n.x - 3.4, y0 + 17.6); c.lineTo(n.x + 3.4, y0 + 17.6); c.lineTo(n.x, y0 + 22); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,194,71,.72)'; c.lineWidth = 1; rr(c, x0, y0, w, 18, 9); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0 + 7, y0 + 1.4); c.lineTo(x0 + w - 7, y0 + 1.4); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillText(n.name, n.x, y + 0.7);
    c.fillStyle = '#ffe9b0'; c.fillText(n.name, n.x, y - 0.2);
  } else if (fresh && pd < 340) {
    // a speech bubble with a gentle bob, a curved tail and three breathing dots
    const bob = REDUCED ? 0 : Math.sin(FX.time * 3 + n.phase) * 2, y = n.y - 58 + bob;
    c.fillStyle = 'rgba(0,0,0,.1)'; rr(c, n.x - 12.5, y - 8, 25, 20, 9); c.fill();
    c.fillStyle = 'rgba(0,0,0,.18)'; rr(c, n.x - 10.5, y - 6, 22, 16, 7); c.fill();
    const g = c.createLinearGradient(0, y - 9, 0, y + 7); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e9eef5');
    c.fillStyle = g; rr(c, n.x - 11, y - 9, 22, 16, 7); c.fill();
    c.beginPath(); c.moveTo(n.x - 3.4, y + 6.4); c.quadraticCurveTo(n.x - 0.6, y + 7.4, n.x - 0.4, y + 11.6); c.quadraticCurveTo(n.x + 1.4, y + 8, n.x + 3.4, y + 6.4); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(n.x - 6, y - 8.4); c.lineTo(n.x + 6, y - 8.4); c.stroke();
    c.fillStyle = '#3a4a62';
    for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(n.x + i * 4.6, y - 1 + (REDUCED ? 0 : Math.sin(FX.time * 5 + i) * 0.9), 1.6, 0, 6.2832); c.fill(); }
  }
  });
}

/* ============================ more people: street life, shops, clinic and coworkers ============================ */
const LK = i => NPC_LOOK[i % NPC_LOOK.length];
const addE = (n) => { S.energy = clamp(S.energy + n, 0, 100); };
const addH = (n) => { S.hunger = clamp(S.hunger + n, 0, 100); };
const addT = (n) => { S.thirst = clamp(S.thirst + n, 0, 100); };
const addM = (n) => { S.money = Math.round((S.money + n) * 100) / 100; S.stats.earned += n; };

/* five more talkers on the streets (they bind to the first walking figures) */
addFolk({ id: 'cole', name: 'Officer Cole', role: 'Traffic officer',
  greet: ['Cross on the light, please. The cars here do not slow down for anybody.', 'Quiet day. I like quiet days.', 'You are getting to know the neighborhood. That is good.', 'Seen the new bus stop on Clinic Row? Handy.'],
  replies: [['"Thanks for keeping us safe."', 'Just doing the job. A thank you makes it easier.'], ['"Any tips for crossing?"', 'Wait for the walk sign, look both ways, and never trust a red car.'], ['"What is a busy day like?"', 'Lots of horns, lots of coffee, and one lost tourist every hour.']],
  topics: [['Is there a faster way across town?', 'Take the bus. There are stops by Maple Court, Downtown, Market Street, Clinic Row and the park. A ride costs two bucks.'], ['What are the lights like?', 'They run on a loop. Cars from one direction go, then the other. Cross when your side is clear.']],
  perk: { text: 'Officer Cole shares tea from his thermos. Energy +4.', go() { addE(4); } } });
addFolk({ id: 'ines', name: 'Ines', role: 'Florist on a delivery',
  greet: ['Hello! Sorry, I smell like roses. Occupational hazard.', 'I am delivering lilies to the dentist. Do not ask.', 'Everybody walks faster when they hold flowers.', 'Another day, another bouquet. How are you?'],
  replies: [['"They smell wonderful."', 'Here, take one. A little color helps everything.'], ['"Do you like your job?"', 'I get to make people smile for a living. Yes.'], ['"Who gets the lilies?"', 'The dentist. Apparently waiting rooms need to be less scary.']],
  topics: [['What flowers are good for a first apartment?', 'A small plant you cannot kill. A snake plant, or anything that forgives you for forgetting it.'], ['Where can I find some quiet?', 'The far side of the park, past the pond. Hardly anyone goes there on weekdays.']],
  perk: { text: 'Ines hands you a flower. It smells wonderful. Energy +4.', go() { addE(4); } } });
addFolk({ id: 'lena', name: 'Lena', role: 'Tourist with a map',
  greet: ['Excuse me, is this the way to the fountain? Everyone says it is lovely.', 'I think I am lost, but I am enjoying it.', 'This city is bigger than it looks on the map!', 'Hello again! I found the fountain. It was lovely.'],
  replies: [['"Just follow the path south."', 'Wonderful, thank you! Here, for your trouble.'], ['"I can walk with you."', 'You are kind! Only a little way, I promise.'], ['"What do you like so far?"', 'The diner. A woman called me "hon" and gave me free pie.']],
  topics: [['Where are you from?', 'Far away, where the buildings are twice this tall. But I like how friendly this one feels.'], ['What should I tell friends about the town?', 'That the bus is cheap, the park is huge and the diner is open late.']],
  perk: { text: 'Lena tips you $6 for the directions.', go() { addM(6); } } });
addFolk({ id: 'sam', name: 'Sam', role: 'Street musician',
  greet: ['Request line is open. Mostly I play three songs.', 'The sidewalk has great acoustics here.', 'You stopped to listen. That makes you my favorite person today.', 'This one is new. Tell me what you think.'],
  replies: [['"Play something upbeat."', 'You got it. Hum along if you know it.'], ['"How long have you been playing?"', 'Since I was nine. I got a guitar for my birthday and never put it down.'], ['"Do people tip?"', 'Sometimes. Mostly they smile, which is nice too.']],
  topics: [['Any good places to hear music?', 'The park on weekends, and the diner jukebox if you have a dollar.'], ['How do you stay motivated?', 'Practice a little every day. Same as anything else, really.']],
  perk: { text: 'Sam plays your song. You feel lighter. Energy +5.', go() { addE(5); } } });
addFolk({ id: 'kofi', name: 'Kofi', role: 'Bike courier',
  greet: ['Rush job! Sorry, quick chat only.', 'Fourteen deliveries before lunch. New record.', 'Hydrate or die-drate, that is my motto.', 'You live around here? Best neighborhood for shortcuts.'],
  replies: [['"You look exhausted."', 'I am. It is fine, I have water. Want some?'], ['"Where are you headed?"', 'Downtown, then the clinic, then who knows. The app decides.'], ['"Do you like biking?"', 'Best job there is. The city is a puzzle and I solve it all day.']],
  topics: [['What is the fastest route?', 'The cross streets are quicker than the avenues. Less traffic, no lights until the bottom.'], ['Where do couriers eat?', 'Dot\'s Diner. Counter seat, open early, fast service.']],
  perk: { text: 'Kofi gives you a swig from his spare bottle. Thirst +10.', go() { addT(10); } } });
(function bindFolk() {
  NPCS.forEach((n, i) => { const f = TOWN_FOLK[i]; if (f && i < TALKER_COUNT) { n.id = f.id; n.name = f.name; n.role = f.role; } });
})();

/* people inside buildings */
const IN = (id, name, role, look, o) => addFolk(Object.assign({ id, name, role, look: LK(look) }, o));
IN('reyes', 'Mrs. Reyes', 'Landlord', 3, {
  greet: ['Rent is due Sunday. I am not worried about you, but I mention it to everyone.', 'Good tenant, quiet tenant. I appreciate both.', 'The elevator is broken again. It is always the elevator.', 'Come by anytime, dear. My door is open.'],
  replies: [['"I will pay on time."', 'That is all I ask. Honest, I do not like late fees any more than you do.'], ['"The apartment is nice."', 'I painted that unit myself. The couch was my nephew\'s.'], ['"Any advice for a first apartment?"', 'Learn which pipe knocks and which one does not. Both are normal.']],
  topics: [['How do late fees work?', 'A day late and it is $' + LATE_FEE + '. After three days, I have to ask you to leave. I hate that part, truly.'], ['When can I pay?', 'Any time in the four days before Sunday. Do not wait for the last minute.']],
  perk: { text: 'Mrs. Reyes hands you a slice of pie. Hunger +8.', go() { addH(8); } } });
IN('dev', 'Dev', 'Neighbor, night owl', 9, {
  greet: ['Oh, hi. I live in 14. I think we share a wall.', 'Sorry about the noise last night. I was learning the drums.', 'You work? I am between things.', 'Hey neighbor. Did you get a package? Mine went missing.'],
  replies: [['"The wall is thin, yes."', 'I will use headphones. Probably.'], ['"What do you do?"', 'A little of everything. Mostly I sleep until three.'], ['"Nice to meet you."', 'Likewise. Let me know if you ever need to borrow sugar.']],
  topics: [['Is the building safe at night?', 'Quiet and lit. Mrs. Reyes locks the front door at eleven.'], ['Where do you get groceries?', 'The Corner Grocery, one street over. Packs are cheaper than eating out.']],
  perk: { text: 'Dev gives you a bottle of water. Thirst +8.', go() { addT(8); } } });
IN('tanaka', 'Mr. Tanaka', 'Grocery cashier', 2, {
  greet: ['Paper or plastic? Just kidding, we are paper now.', 'Good timing. The bread just came in.', 'We have a deal on lunch packs this week. Not really, but I wish.', 'Welcome back. Need help finding anything?'],
  replies: [['"Packs are a good deal."', 'Three meals for the price of one at the diner. Cook at home and save.'], ['"What is your favorite item?"', 'The oats. Boring, but they never let me down.'], ['"Busy day?"', 'Steady. People get hungry at the same times every day. It is predictable.']],
  topics: [['What should I stock up on?', 'A pack of each kind, if you can. Then you always have something to cook.'], ['When are you open?', 'Seven in the morning until ten at night. After that, the vending machine at the clinic.']],
  perk: { text: 'Mr. Tanaka tosses you a free snack. Hunger +5.', go() { addH(5); } } });
IN('odell', 'Ms. Odell', 'Shopper', 1, {
  greet: ['I never know what to cook. Do you?', 'Is the produce good today? It looks good.', 'I come here every day for fifteen minutes of peace.', 'Good to see you again. Anything on your list?'],
  replies: [['"Pasta is easy."', 'Pasta, sauce, a vegetable. You are a genius.'], ['"The bakery is great."', 'Do not tell my doctor how often I visit.'], ['"Do you cook much?"', 'Not enough. I keep meaning to.']],
  topics: [['What do you buy every week?', 'Eggs, bread, a bag of apples, and one treat. The treat keeps me going.'], ['Any money-saving tips?', 'Buy the packs, cook at home, and never shop hungry.']],
  perk: { text: 'Ms. Odell gives you a coupon. +$2.', go() { addM(2); } } });
IN('dot', 'Dot', 'Owner of the diner', 8, {
  greet: ['What can I get you, hon?', 'Pie is fresh. I bake it at five every morning.', 'Sit anywhere, hon. Coffee is on.', 'I knew you would be back. Everybody comes back.'],
  replies: [['"The place is wonderful."', 'Thirty years and I still love opening the door every morning.'], ['"What is good today?"', 'Everything, but the meatloaf is a hug on a plate.'], ['"Do you ever close?"', 'Six to eleven, every day. The lights are always on.']],
  topics: [['When is breakfast served?', 'Breakfast till eleven, lunch till four, dinner after. I do not make exceptions. Okay, I make a few.'], ['How did you start the diner?', 'My mother left me a recipe book and a lease. The rest I figured out.']],
  perk: { text: 'Dot slides you a plate of fries. Hunger +6.', go() { addH(6); } } });
IN('gus', 'Gus', 'Regular at the counter', 6, {
  greet: ['Same seat every day. Do not take it.', 'Coffee, black. Always black.', 'You are new. Welcome to the club.', 'Back for another cup? Good man.'],
  replies: [['"Mind if I sit here?"', 'Not at all. Just not that stool. That one wobbles.'], ['"How long have you come here?"', 'Since before the jukebox needed repairs. Twenty years.'], ['"What is the best thing on the menu?"', 'Whatever Dot is having. She is never wrong.']],
  topics: [['What is the neighborhood like?', 'Changing, but slow. The diner stays the same, thank goodness.'], ['Any life advice?', 'Eat a real breakfast, tip well, and call your mother.']],
  perk: { text: 'Gus buys you a coffee. Energy +4.', go() { addE(4); } } });
IN('imani', 'Nurse Imani', 'Front desk nurse', 11, {
  greet: ['Clinic is for emergencies, but I do not mind a friendly visit.', 'Drink water. That is my entire medical advice.', 'Slow day. Do not tell the doctor I said that.', 'Back again? I hope you are only here to say hello.'],
  replies: [['"Just visiting."', 'Well, sit and rest a minute. The benches are comfy.'], ['"Do people really faint here?"', 'More than you would think. Usually people who skipped lunch and slept badly.'], ['"What is the best advice you give?"', 'Eat three meals, drink water, and sleep through the night. Anything else is a bonus.']],
  topics: [['What happens if I pass out?', 'Someone brings you here, the doctor checks you, and we bill forty-five dollars. It is a long day for everyone.'], ['How do I avoid that?', 'Keep an eye on your hunger, thirst and energy. If any hits zero for long, you are in trouble.']],
  perk: { text: 'Nurse Imani hands you a cup of cold water. Thirst +10.', go() { addT(10); } } });
IN('chen', 'Dr. Chen', 'Physician', 5, {
  greet: ['Just finishing my notes. Everything okay?', 'You look healthy. Keep doing what you are doing.', 'Sleep is the best medicine and it is free.', 'Come in. I have two minutes before the next patient.'],
  replies: [['"I just wanted to say hello."', 'Appreciated. Most people only come in when it hurts.'], ['"How do I stay healthy?"', 'Regular meals, water, a full night of sleep. Boring and it works.'], ['"Do you like your work?"', 'Most days. The ones where nobody faints are my favorite.']],
  topics: [['Is staying up late bad?', 'Now and then, fine. But you pay for it in the morning, with interest.'], ['What about naps?', 'A short afternoon nap is great. Two hours on the couch resets a lot.']],
  perk: { text: 'Dr. Chen shows you a quick stretch. Energy +5.', go() { addE(5); } } });

/* coworkers, by job */
const BOSS_PERK = (name) => ({ text: name + ' slips you a $10 bonus for steady work.', needs: () => S.shifts >= 1, go() { addM(10); } });
IN('noor', 'Noor', 'Senior developer', 4, {
  greet: ['Tabs or spaces? Kidding. Do not answer.', 'The build is red again. I am calm. I am very calm.', 'Welcome to the team. We have snacks and strong opinions.', 'You solved that bug faster than I did. Annoying.'],
  replies: [['"Any tips for code review?"', 'Be kind, be specific, and always say one good thing first.'], ['"How is the codebase?"', 'Old, tangled and mostly working. Like all codebases.'], ['"Coffee?"', 'Always. Free in the kitchen. Take two.']],
  topics: [['How do I get promoted?', 'Ship things, help others, and write it down. Raises come with steady work.'], ['Is the job stressful?', 'Deadlines, mostly. But the desk work does not wear you out like some jobs do.']],
  perk: { text: 'Noor shares her energy drink. Energy +5.', go() { addE(5); } } });
IN('felix', 'Felix', 'QA tester', 7, {
  greet: ['I broke it again. It is my job, honestly.', 'Found a bug in the break room fridge. It was a sandwich.', 'Do you ever click every button just to see what happens?', 'You again! Fresh bugs for me?'],
  replies: [['"Break anything good lately?"', 'The login page. Twice. Developers hate me and I love it.'], ['"Do you like testing?"', 'It is detective work. With more coffee.'], ['"Any advice?"', 'Test the weird thing first. The weird thing always breaks.']],
  topics: [['What is the team like?', 'Friendly. We eat lunch together on Fridays, sometimes.'], ['Best part of the job?', 'Making things better before anyone else sees them.']],
  perk: { text: 'Felix shares his bottled water. Thirst +8.', go() { addT(8); } } });
IN('dana', 'Dana Whitlock', 'Engineering manager', 10, {
  greet: ['Quick meeting? Kidding. Only if it matters.', 'Your work has been steady. I notice.', 'Remember to take your breaks. I mean it.', 'Door is open if you need anything.'],
  replies: [['"Thanks for the support."', 'You make it easy. Keep going.'], ['"Any feedback?"', 'Communicate early and often. That is the whole secret.'], ['"Can I take on more?"', 'Soon. Let me see the next sprint.']],
  topics: [['How are raises decided?', 'Every ten full shifts you get a five percent raise. Come to work, stay on schedule.'], ['What matters most here?', 'Showing up rested. Tired developers make expensive mistakes.']],
  perk: BOSS_PERK('Dana') });
IN('olga', 'Olga', 'Machinist', 6, {
  greet: ['Safety glasses on. Always.', 'This mill and I have an understanding.', 'Measure twice, cut once, complain forever.', 'You have good hands. Not everyone does.'],
  replies: [['"What are you building?"', 'A bracket. A very important bracket.'], ['"How long have you been here?"', 'Eleven years. I know every rattle in this building.'], ['"Any tips for a newcomer?"', 'Ask questions. Nobody here knows everything.']],
  topics: [['Is it loud in here?', 'Always. You get used to it. Earplugs help.'], ['What tires you out?', 'The long days. This job is demanding, so rest well at night.']],
  perk: { text: 'Olga gives you a mug of tea. Energy +4, thirst +4.', go() { addE(4); addT(4); } } });
IN('pavel', 'Pavel', 'Junior engineer', 9, {
  greet: ['Do you know how to read tolerances? I think I do not.', 'This drawing is wrong and I can prove it.', 'My first year here. Everything is a lesson.', 'Hey! I figured out the tolerance thing.'],
  replies: [['"I can look at it with you."', 'Really? That would save my afternoon.'], ['"Everyone starts somewhere."', 'That is what Olga says. She also says to stop apologizing.'], ['"What do you want to build?"', 'Something that moves. Maybe a bridge. Or a robot.']],
  topics: [['What was your first project?', 'A tiny hinge. It took three weeks and it still squeaks.'], ['Is it a good place to work?', 'Great pay, tough hours. Sleep enough and you will be fine.']],
  perk: { text: 'Pavel gives you half his sandwich. Hunger +6.', go() { addH(6); } } });
IN('keller', 'Mr. Keller', 'Founder', 0, {
  greet: ['I started this company in a garage. Look at us now.', 'Quality over speed. Always.', 'Good to see someone who shows up.', 'I do not say this often. Good work.'],
  replies: [['"Thank you for the opportunity."', 'You earned it. Keep earning it.'], ['"How did you start?"', 'One lathe, one loan, one very patient spouse.'], ['"What do you look for?"', 'People who finish what they start.']],
  topics: [['Why is the pay so good?', 'Hard work deserves it. Engineers here carry real responsibility.'], ['What is the toughest part?', 'The long, demanding days. Eat well and sleep properly or you will burn out.']],
  perk: BOSS_PERK('Mr. Keller') });
IN('amari', 'Dr. Amari', 'Attending physician', 5, {
  greet: ['Rounds in ten. How are you holding up?', 'Remember to eat. Nurses forget, always.', 'Good catch on that last chart.', 'We are lucky to have you on this floor.'],
  replies: [['"Busy shift."', 'It always is. Pace yourself, there is no medal for skipping lunch.'], ['"Any advice for a new nurse?"', 'Trust your training, ask when unsure, and listen to your patients.'], ['"How do you stay calm?"', 'Deep breaths. And a good cup of tea.']],
  topics: [['What makes this job hard?', 'You are on your feet all day. Hunger, thirst and tiredness hit faster here than anywhere.'], ['Is the cafeteria any good?', 'It is cheap and it keeps you going. Four dollars for a proper lunch.']],
  perk: { text: 'Dr. Amari presses a granola bar into your hand. Hunger +6.', go() { addH(6); } } });
IN('tomas', 'Tomas', 'Orderly', 7, {
  greet: ['Wheelchair, gurney, sandwich. In that order.', 'Another quiet night shift, you wish.', 'You look tired. Drink some water.', 'Need a hand with anything?'],
  replies: [['"You walk a lot."', 'Nine miles a shift, easy. My feet are very strong.'], ['"Thanks for the help."', 'Anytime. We keep this place moving.'], ['"How do you stay on your feet?"', 'Good shoes. Seriously. Spend money on shoes.']],
  topics: [['Any shortcuts?', 'The back stairwell is faster than the elevator. Do not tell the admin.'], ['Where is the best break spot?', 'The break room. The coffee is hot and the chairs are soft.']],
  perk: { text: 'Tomas hands you a water bottle. Thirst +8.', go() { addT(8); } } });
IN('rosalind', 'Head Nurse Rosalind', 'Head nurse', 3, {
  greet: ['I keep this floor running. Mostly with coffee.', 'Your charting is tidy. I appreciate that.', 'Keep an eye on the time. Patients do not wait.', 'You are doing well. Do not let it go to your head.'],
  replies: [['"Thank you for the guidance."', 'You pay attention. That is rare and valuable.'], ['"Any feedback?"', 'Hydrate. You are no good to anyone if you are dehydrated.'], ['"How long have you been a nurse?"', 'Twenty-two years. I still learn something every shift.']],
  topics: [['How do raises work?', 'A five percent raise every ten full shifts. Show up, stay for the whole shift.'], ['What is the secret to this job?', 'Take care of yourself first. The rest follows.']],
  perk: BOSS_PERK('Rosalind') });
IN('carter', 'Carter', 'Account analyst', 10, {
  greet: ['The Henderson account is a nightmare. A profitable nightmare.', 'I live in spreadsheets. Come visit.', 'Quarterly numbers are due. Please do not ask.', 'Morning! Or whatever time it is.'],
  replies: [['"Sounds exciting."', 'It is, if you like numbers. I like numbers.'], ['"How is the team?"', 'Great, aside from the printer.'], ['"Do you like the job?"', 'The pay is fair, the people are good, and nobody asks me to lift anything.']],
  topics: [['How do raises work here?', 'Faster than most places. A five percent raise every six shifts.'], ['Any tips for clients?', 'Be honest, be early, and write everything down.']],
  perk: { text: 'Carter shares his coffee. Energy +4.', go() { addE(4); } } });
IN('imogen', 'Imogen', 'Receptionist', 1, {
  greet: ['Harlan and Pike, how may I direct your call?', 'I know everyone who walks through that door. Everyone.', 'Do you want to hear the office gossip? I will whisper.', 'Good to see you! Meetings are in the big room.'],
  replies: [['"You know everything."', 'It is the chair. The chair is magic.'], ['"Who is in today?"', 'Everybody, sadly. Even Ms. Pike.'], ['"Nice sofa."', 'It is for clients. And occasional naps. Shh.']],
  topics: [['What are the hours?', 'Seven to six, weekdays. The doors lock after that.'], ['Anything I should know?', 'Say hello to Ms. Pike. She remembers who does.']],
  perk: { text: 'Imogen offers you a glass of water. Thirst +8.', go() { addT(8); } } });
IN('pike', 'Ms. Pike', 'Partner', 8, {
  greet: ['Numbers do not lie. People do. Be a number.', 'Your accounts look good. Keep it up.', 'I do not hand out praise. Consider this a compliment.', 'Come in, sit. What is on your mind?'],
  replies: [['"Thank you for the chance."', 'You are earning it. Do not slow down.'], ['"Any advice?"', 'Show up, follow through, and be honest with clients.'], ['"What do you like about the firm?"', 'We reward effort. That is rare.']],
  topics: [['What makes someone successful here?', 'Consistency. Rest well and show up ready.'], ['How do raises work?', 'Every six full shifts, five percent. We are quick to reward good work.']],
  perk: BOSS_PERK('Ms. Pike') });
IN('dmitri', 'Dmitri', 'Sous chef', 4, {
  greet: ['Behind! Hot pan, hot pan!', 'The soup tonight is a secret. A good secret.', 'Taste this. No, taste it properly.', 'Fast hands today. I noticed.'],
  replies: [['"I will watch my step."', 'Good. Burned fingers are a rite of passage, but not a fun one.'], ['"What is the secret to good food?"', 'Salt. And patience. And more salt.'], ['"Can I try that?"', 'Of course. Just do not tell Chef.']],
  topics: [['Why is it so hot in here?', 'Ovens, burners and no windows. Drink a lot of water.'], ['What do cooks eat?', 'Whatever is left, and it is always great. Staff lunch is free.']],
  perk: { text: 'Dmitri hands you a taste of the soup. Hunger +6.', go() { addH(6); } } });
IN('beto', 'Beto', 'Dishwasher and prep cook', 2, {
  greet: ['Plates, plates, plates. It never ends.', 'I do the dishes, I do the prep, I do the jokes.', 'You work hard. Chef notices.', 'Careful, floor is wet.'],
  replies: [['"You never stop."', 'The day goes faster when I am moving.'], ['"Do you like it here?"', 'Free food, good people. What more do you need?'], ['"Need a hand?"', 'No, but thanks! First one who asks in a month.']],
  topics: [['Where do I take my break?', 'The break room, back past the pass. Cold water, hot coffee.'], ['How does the staff lunch work?', 'Show up, sit down, eat. Free every shift.']],
  perk: { text: 'Beto passes you a cold glass of water. Thirst +10.', go() { addT(10); } } });
IN('marisol', 'Chef Marisol', 'Head chef', 11, {
  greet: ['Taste everything. That is the whole job.', 'Mise en place. Everything in its place.', 'I trained in three countries. This kitchen is my favorite.', 'You are quick. Good. Quick keeps the line moving.'],
  replies: [['"Thank you, Chef."', 'Save it. Plate faster.'], ['"What makes a great kitchen?"', 'Respect. For the food, the people and the clock.'], ['"I want to learn."', 'Then you will. Watch Dmitri.']],
  topics: [['Why is the pay low?', 'Kitchens run on thin margins. But we feed you well and the work is honest.'], ['How do I handle the heat?', 'Drink water all shift. A hot kitchen will dry you out before you notice.']],
  perk: BOSS_PERK('Chef Marisol') });

/* place the people who stand inside buildings */
function initIntFolk() {
  Object.values(INT).forEach(d => {
    d.folkObjs = (d.folks || []).map(p => {
      const f = folkById(p.id);
      return Object.assign({ x: p.x, y: p.y, phase: 0, face: 1, moving: false, id: f.id, name: f.name, role: f.role }, f.look);
    });
  });
}
