/* ============================ the new rooms ============================ */
function effText(o) {
  const p = [];
  if (o.hunger) p.push('hunger +' + o.hunger); if (o.thirst) p.push('thirst +' + o.thirst); if (o.energy) p.push('energy +' + o.energy); if (o.mood) p.push('mood +' + o.mood);
  const s = p.join(', ');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) + '.' : '';
}
/* an item you buy and enjoy on the spot */
function shopItem(name, cost, o) {
  let off = '';
  if (o.hunger > 0 && eatBlock(o.hunger)) off = eatBlock(o.hunger);
  else if (o.thirst > 0 && !o.hunger && !o.energy && !o.mood && drinkBlock(o.thirst)) off = drinkBlock(o.thirst);
  if (!off && o.off) off = o.off() || '';
  if (!off && cost > 0 && !canSpend(cost)) off = 'You cannot afford that.';
  return {
    t: name, d: (o.d ? o.d + ' ' : '') + effText(o), tag: (cost > 0 ? fmt(cost) : 'free') + (o.mins ? ' · ' + o.mins + ' min' : ''), off,
    go() {
      if (cost > 0) spend(cost);
      applyIntake({ hunger: o.hunger, thirst: o.thirst, energy: o.energy, mins: o.mins || 0 });
      if (o.mood) addMood(o.mood);
      if (o.after) o.after();
      if (o.mood && S.scene === 'int' && (S.intId === 'bakery' || S.intId === 'cafe')) lifeEv('treat');
      SFX.chime(o.snd || (o.hunger ? 'eat' : o.thirst || o.energy ? 'drink' : 'pay'));
      toast(o.msg || (name + '. ' + effText(o)), 'good');
    }
  };
}
/* a hot meal tied to the time of day, with a little mood on top */
function placeMeal(key, name, cost, o) {
  const it = mealItem(key, name, cost, { hunger: o.hunger, thirst: o.thirst || 0, mins: o.mins, d: (o.d ? o.d + ' ' : '') + effText(o) });
  const go = it.go;
  it.go = function () { go(); if (o.mood) addMood(o.mood); if (o.after) o.after(); if (S.scene === 'int' && (S.intId === 'bakery' || S.intId === 'cafe')) lifeEv('treat'); };
  return it;
}
const spec = (id, title, o) => Object.assign({ band: PLACES[id].col, title, sub: PLACES[id].name, stock: [fmt(S.money)], sections: [] }, o);
const once = (k, why) => () => doneToday(k) ? why : '';

/* ---------- the people who work in them ---------- */
const LOOK = (shirt, pants, hair, skin, style) => ({ shirt, pants, hair, skin, style });
const STAFF = (id, name, role, look, o) => addFolk(Object.assign({ id, name, role, look }, o));
STAFF('okafor', 'Mr. Okafor', 'Pharmacist', LOOK('#f4f7f9', '#2f3a4f', '#1a1a1a', '#7a4a2c', 0), {
  greet: ['Feeling all right today? Good. Prevention is my favorite medicine.', 'Vitamins are in aisle one, and so am I, apparently.', 'Back again! Did the sleep aid help?', 'Hello, hello. Let me guess: a long week.'],
  replies: [['"Just looking around."', 'Take your time. Everything in here is boring until you need it.'], ['"What do people buy most?"', 'Electrolyte drinks after long shifts. Pain relievers after the dentist.'], ['"Do you like your job?"', 'I like helping people feel a little better. That is the whole job.']],
  topics: [['What do vitamins actually do?', 'One a day keeps your energy from draining quite so fast. They will not replace sleep, sadly.'], ['I have a toothache. Help?', 'A pain reliever buys you twelve hours. The dentist next to the pizza place fixes the real problem.']],
  perk: { text: 'Mr. Okafor hands you a sample of electrolyte powder. Thirst +8.', go() { addT(8); } } });
STAFF('greta', 'Greta', 'Bank teller', LOOK('#2a6f97', '#2b2f3e', '#d8c27a', '#f0c7a4', 2), {
  greet: ['Welcome to First Bank. Deposits, withdrawals, or just a lollipop?', 'Every dollar you save today is a dollar that works for you tomorrow.', 'Good to see you! Your account is looking healthier.', 'Next in line! Oh, it is you. Hello.'],
  replies: [['"Is my money safe here?"', 'Safer than in your pocket. Nobody ever lost savings by fainting on a sidewalk.'], ['"How much interest do I get?"', 'A quarter percent a day, paid at midnight. Small, but it adds up.'], ['"Nice vault."', 'Thank you. It weighs eleven tons. I dust it on Fridays.']],
  topics: [['Should I keep cash or savings?', 'Keep enough cash for food and fares. Put the rest here. If you black out, the clinic only bills your pocket.'], ['What is autopay?', 'Talk to Mr. Hale. We can pay your rent from savings on the due day, so you never miss it.']],
  perk: { text: 'Greta slides you a lollipop. Mood +2.', go() { addMood(2); } } });
STAFF('hale', 'Mr. Hale', 'Financial advisor', LOOK('#3a3340', '#2b2f3e', '#6a6a6a', '#e0ac86', 0), {
  greet: ['Sit, sit. Let us look at your numbers.', 'A budget is just a plan for your money. Nothing scary.', 'You are doing better than most people your age. Truly.', 'Questions are free. Advice too, today.'],
  replies: [['"I am bad with money."', 'Nobody is born good with money. You just need a system.'], ['"How much should I save?"', 'Start with ten percent of every paycheck. Then raise it.'], ['"Is rent really that much?"', 'Four fifty a week. It is the biggest number in your life right now.']],
  topics: [['What is the smartest first step?', 'Put a week of rent in savings. Then nothing can surprise you.'], ['How do raises work for me?', 'Your employer gives five percent every so many shifts. Books from Dog-Ear add a little more on top.']],
  perk: { text: 'Mr. Hale gives you a pocket budget card. You feel organized. Mood +3.', go() { addMood(3); } } });
STAFF('agnes', 'Agnes', 'Owner of Dog-Ear Books', LOOK('#9b7bb0', '#3a3340', '#c9c9cf', '#f2c9a5', 2), {
  greet: ['Welcome! Mind the cat. There is no cat. There used to be a cat.', 'Every book here has been loved at least once.', 'Back for another? I set something aside for you. I am kidding. Mostly.', 'Shh. Kidding. Talk all you like.'],
  replies: [['"What should I read?"', 'Something for work, something for you. Alternate. That is the secret.'], ['"Do career books really help?"', 'Ask Mr. Hale. Three good books and you will be asking for a raise.'], ['"I love this place."', 'Then come sit in the nook. That is what it is for.']],
  topics: [['Where is the best place to read?', 'The nook here, the window tables at Cafe Luna, or a good chair at home. Hank sells good chairs.'], ['How long does a book take?', 'An hour a chapter, give or take. Novels go faster, they want to be finished.']],
  perk: { text: 'Agnes gives you a bookmark she made. Mood +2.', go() { addMood(2); } } });
STAFF('milo', 'Milo', 'Reading in the nook', LOOK('#4f9d7a', '#34495e', '#3b2a20', '#b87b55', 4), {
  greet: ['Oh! Sorry. I was in the book. Hello.', 'Do you know how this one ends? Do not tell me.', 'Best chair in town. I will share. Not this one, though.', 'I have been here since lunch. Possibly since Tuesday.'],
  replies: [['"What are you reading?"', 'A mystery about a pie. I suspect the pie.'], ['"Do you come here often?"', 'Every day after my shift. It is cheaper than therapy.'], ['"Good book?"', 'The best. Until the next one.']],
  topics: [['Any good novels?', 'Midnight at the Diner. It is set somewhere a lot like Dot\'s.'], ['Does reading help you?', 'It is the only time my brain is quiet. My mood is better on days I read.']],
  perk: { text: 'Milo tells you the best line from his book. Mood +2.', go() { addMood(2); } } });
STAFF('luc', 'Luc', 'Baker', LOOK('#f6f1e7', '#5a4a3a', '#7a4a2a', '#f3d0b0', 3), {
  greet: ['Bonjour! The croissants came out ten minutes ago.', 'I started at four this morning. I am fine. I am bread.', 'Smell that? That is cinnamon. And happiness.', 'Welcome back, my favorite customer.'],
  replies: [['"It smells amazing in here."', 'That is the secret. People come for the smell and leave with a loaf.'], ['"When do you sleep?"', 'From seven at night. Bakers live backwards.'], ['"What is your favorite?"', 'The plain loaf. Flour, water, salt and time.']],
  topics: [['When is the bread freshest?', 'First thing. We open at six. By three the day-old bin is half price.'], ['Is a loaf a good deal?', 'Three breakfasts of toast for six dollars. Cheaper than the grocery pack.']],
  perk: { text: 'Luc hands you a warm end of a baguette. Hunger +6.', go() { addH(6); } } });
STAFF('hank', 'Hank', 'Owner of the hardware store', LOOK('#c0392b', '#3a3a3a', '#8a8a8a', '#d99d77', 3), {
  greet: ['What are we fixing today?', 'If it is broken, I have a thing for it. If it is not, I have a thing for that too.', 'New apartment? I can make it feel like home.', 'Back again! The mattress is still on sale. It is always on sale.'],
  replies: [['"Just browsing."', 'Browse away. Touch the mattress. Everyone touches the mattress.'], ['"What is your best seller?"', 'Coffee makers. Every new grad buys one within a month.'], ['"How long have you run this place?"', 'Thirty years. My dad before me.']],
  topics: [['What would make my place better?', 'A real mattress, first. Sleep is everything. Then curtains, then a good chair.'], ['Do I need an umbrella?', 'It rains about one day in five here. Walk in the rain without one and you will feel it.']],
  perk: { text: 'Hank fixes the squeaky zipper on your bag. Mood +2.', go() { addMood(2); } } });
STAFF('zoe', 'Zoe', 'Concessions', LOOK('#7a1f33', '#2b2f3e', '#111', '#74492f', 1), {
  greet: ['Popcorn? Popcorn. Everyone says yes eventually.', 'Today\'s lineup is good. Trust me, I have seen everything twice.', 'Welcome to the Starlight! Phones on silent, please.', 'Back for another movie? My kind of person.'],
  replies: [['"What should I see?"', 'Anything animated. Grown-ups cry the hardest at the cartoons.'], ['"Do you get free movies?"', 'Free movies, free popcorn, sticky floors. Perfect job.'], ['"Is the claw machine rigged?"', 'Rigged? No. Shy. It is shy.']],
  topics: [['When are the showtimes?', 'Noon, three, six and nine, every day. Tickets are cheaper before five, and Tuesdays are six bucks all day.'], ['Is popcorn worth it?', 'A movie with popcorn is a better movie. That is science.']],
  perk: { text: 'Zoe tops up your soda for free. Thirst +8.', go() { addT(8); } } });
STAFF('ike', 'Ike', 'Ticket booth', LOOK('#e9c46a', '#2b2f3e', '#3b2a20', '#8f5d3d', 0), {
  greet: ['One ticket? Excellent choice. Whichever one.', 'Doors open half an hour before the show.', 'The nine o\'clock is my favorite. Everyone is a little sleepy and laughs at everything.', 'You again! Season pass material, you are.'],
  replies: [['"Which theater is best?"', 'Theater two. The seats recline. Shh.'], ['"Do people talk during movies?"', 'Only on Tuesdays, when it is cheap.'], ['"How do you pick the films?"', 'I do not. I just tear the tickets. Very important tearing.']],
  topics: [['Can I come in late?', 'Up to ten minutes after the start. You will miss the trailers, which is a tragedy.'], ['Any deals?', 'Matinees before five are eight dollars. Tuesday is six all day.']],
  perk: { text: 'Ike gives you a free popcorn coupon. Your next popcorn is on the house.', go() { S.fx.freecorn = 1; } } });
STAFF('bianca', 'Bianca', 'Stylist', LOOK('#c05d8a', '#2f2f45', '#2a9d8f', '#efc3a0', 1), {
  greet: ['Sit, sit! Let me look at you. Hmm. I have ideas.', 'Your hair is telling me it wants a change.', 'Welcome to the salon! Coffee? Magazine? Bold new color?', 'Back already? It looks great. Let us make it greater.'],
  replies: [['"Just a trim, please."', 'A trim is never just a trim. It is a fresh start with less hair.'], ['"Something different?"', 'My favorite words. Pick a style and trust me.'], ['"How long have you cut hair?"', 'Since I was twelve. My brother still has not forgiven me.']],
  topics: [['Does a haircut really matter?', 'Look sharp, feel sharp. For three days you will walk taller, and your boss will notice.'], ['When are you closed?', 'Mondays. Even scissors need a day off.']],
  perk: { text: 'Bianca fixes your collar and tells you to stand up straight. Mood +3.', go() { addMood(3); } } });
STAFF('kim', 'Mrs. Kim', 'Laundromat attendant', LOOK('#2a9d8f', '#3a3340', '#1a1a1a', '#e6b995', 2), {
  greet: ['Washer six is the good one. Do not tell anyone.', 'You look like someone with a full hamper.', 'Fold while it is warm! Wrinkles are a choice.', 'Back again! Good. Clean clothes, clean mind.'],
  replies: [['"Which machine is fastest?"', 'They are all the same. But six has a lucky feeling.'], ['"Do people leave stuff behind?"', 'Socks. Only ever socks. Check the lost and found.'], ['"Is the thrift rack yours?"', 'Donations. Good shirts, cheap. I wash them first, of course.']],
  topics: [['How often should I do laundry?', 'Every five days or you run out of clean clothes. Wrinkled shirts look bad at work, and people notice.'], ['What is drop-off?', 'You leave it, I wash and fold, you pick it up. Costs more, takes no time from you.']],
  perk: { text: 'Mrs. Kim lends you her lucky quarter. Mood +2.', go() { addMood(2); } } });
STAFF('rafa', 'Rafa', 'Bike mechanic', LOOK('#e76f51', '#3b4a3f', '#3b2a20', '#a8714f', 3), {
  greet: ['Two wheels, zero traffic. Want to join the club?', 'Give me five minutes, I am truing a wheel.', 'How is the bike riding? Smooth? Good.', 'Hey, you! Ready to stop walking everywhere?'],
  replies: [['"Is biking really faster?"', 'In this town? You will cross it in half the time.'], ['"What bike should I get?"', 'The commuter. Simple, sturdy, pick a color you love.'], ['"Do you ride every day?"', 'Rain or shine. Mostly shine. Rain is for the bus.']],
  topics: [['Can I try one first?', 'Rent one for the day. Seven bucks. You will be back to buy it, everyone is.'], ['Do I need a cap?', 'You do not need one. You want one. Cycling caps are very cool.']],
  perk: { text: 'Rafa pumps up your enthusiasm. Energy +4.', go() { addE(4); } } });
STAFF('luna', 'Luna', 'Owner of Cafe Luna', LOOK('#3d5a80', '#2f3a4f', '#5a3825', '#c68a62', 1), {
  greet: ['Welcome in! The window seats are free.', 'Oat milk, whole milk, no milk. We judge nobody.', 'You look like a latte person today.', 'There you are! Your usual?'],
  replies: [['"This place is so cozy."', 'That is the plan. Stay as long as you like.'], ['"Why Luna?"', 'My grandmother said I was born at moonrise. It stuck.'], ['"Is the open mic fun?"', 'Fridays and Saturdays at seven. Some nights it is magic, some nights it is a kazoo.']],
  topics: [['Can I read here?', 'Please do. Bring a book from Dog-Ear and take a window table. It is good for the soul.'], ['What is the best drink?', 'Hot chocolate after dark. Do not tell the coffee.']],
  perk: { text: 'Luna draws a little moon in your foam. Mood +3.', go() { addMood(3); } } });
STAFF('sal', 'Sal', 'Pizza maker', LOOK('#f6f1e7', '#2c3e57', '#1c1410', '#d99d77', 0), {
  greet: ['Hey! You want a slice? You want a slice.', 'Oven is at nine hundred degrees. So am I.', 'My grandfather built that oven with his own hands.', 'My favorite customer! Do not tell the others.'],
  replies: [['"Best pizza in town?"', 'Only pizza in town. Also the best.'], ['"How late are you open?"', 'Until one in the morning. The night owls need me.'], ['"Can I watch you toss the dough?"', 'For you? I will even spin it twice.']],
  topics: [['What is the deal on Fridays?', 'Pizza Friday! Whole pies are four dollars off.'], ['Is a whole pie worth it?', 'You eat now and you take two slices home for later. Dinner twice.']],
  perk: { text: 'Sal gives you a garlic knot. Hunger +6.', go() { addH(6); } } });
STAFF('ruby', 'Ruby', 'Dental receptionist', LOOK('#8ecae6', '#2f3a4f', '#8b3a1e', '#f0c7a4', 2), {
  greet: ['Welcome to Bright Smile! Do you have an appointment? You do now.', 'Floss, then brush. Or brush, then floss. Just do one of them.', 'Hi! The fish are named after presidents.', 'Back so soon? Your smile looks great.'],
  replies: [['"I am a little nervous."', 'Everyone is. Dr. Patel is gentle, I promise.'], ['"What do the fish eat?"', 'Flakes. And the occasional complaint.'], ['"How often should I come in?"', 'About every two weeks keeps toothaches away.']],
  topics: [['What does a checkup do?', 'A cleaning and a look. Your smile stays bright for a week and your mood holds up better.'], ['What if it already hurts?', 'Then we fix it. A filling is quick, and you will feel better right away.']],
  perk: { text: 'Ruby gives you a new toothbrush. Mood +2.', go() { addMood(2); } } });
STAFF('patel', 'Dr. Patel', 'Dentist', LOOK('#e8f4f8', '#2f3a4f', '#2b2118', '#c68a62', 0), {
  greet: ['Open wide! Just kidding. Hello.', 'Teeth are the only bones you can see. Take care of them.', 'Good to see you smiling.', 'Any sensitivity? No? Wonderful.'],
  replies: [['"Does it hurt?"', 'Not with me. I am the gentlest dentist in three towns.'], ['"Why did you become a dentist?"', 'I like fixing small things that make a big difference.'], ['"Any tips?"', 'Water, not soda. And see me before it hurts.']],
  topics: [['Why do toothaches happen?', 'Time, mostly. Skip checkups long enough and something will start to ache.'], ['Do painkillers fix it?', 'They hide it for a while. Only a filling fixes it.']],
  perk: { text: 'Dr. Patel compliments your flossing. Mood +2.', go() { addMood(2); } } });

STAFF('nadia', 'Nadia', 'Folding laundry', LOOK('#e9c46a', '#3d4a5a', '#1a1a1a', '#8f5d3d', 1), {
  greet: ['Do you fold, or do you just stuff it in a drawer? No judgment.', 'Laundry day is my meditation.', 'Washer six is lucky. Mrs. Kim told me.', 'Oh hey! Same laundry schedule as me, huh?'],
  replies: [['"I just stuff it in a drawer."', 'Honestly, same, most weeks. Today I am trying.'], ['"Is laundry relaxing?"', 'The dryer hum is the best white noise in town.'], ['"Any tips?"', 'Hang shirts straight out of the dryer. No wrinkles, no ironing.']],
  topics: [['How often do you come?', 'Every five days. Any longer and I am wearing my gym shirt to work.'], ['Do people notice wrinkles?', 'Bosses do. Trust me. Clean clothes make a better impression.']],
  perk: { text: 'Nadia shows you how to fold a fitted sheet. Life-changing. Mood +3.', go() { addMood(3); } } });
STAFF('otis', 'Otis', 'Working on a laptop', LOOK('#6f7bd4', '#2b2f3e', '#d8c27a', '#f0c7a4', 4), {
  greet: ['Shh, I am writing a novel. Kidding, I am answering emails.', 'This is my office. Luna charges rent in lattes.', 'Do you know the wifi password? It is "moonlight". Do not tell.', 'Back again! We are basically coworkers now.'],
  replies: [['"What are you working on?"', 'A screenplay about a pizza detective. Starlight will show it someday.'], ['"Do you work here every day?"', 'Every day I can. The coffee keeps me honest.'], ['"Need a break?"', 'Always. Want to people-watch with me?']],
  topics: [['Is the open mic good?', 'Friday and Saturday nights at seven. Sign up. Go on. Your mood will thank you.'], ['Where do you live?', 'Above the bike shop. I hear Rafa\'s radio every morning.']],
  perk: { text: 'Otis lets you read the first scene of his screenplay. It is weirdly good. Mood +3.', go() { addMood(3); } } });
STAFF('tess', 'Tess', 'Waiting for her order', LOOK('#ff7a59', '#394a64', '#8a5a2b', '#d99d77', 2), {
  greet: ['The cinnamon rolls are worth the line. Every time.', 'I come in for bread and leave with cake. Every time.', 'Smell that? I could live here.', 'You too? Do not eat the last croissant, it is mine.'],
  replies: [['"What is good here?"', 'Everything, but the cake slice is pure joy.'], ['"Do you come here a lot?"', 'Before work, every day. Luc knows my order.'], ['"The day-old bin is a great deal."', 'Half price after three! My secret is out.']],
  topics: [['Bread or the grocery packs?', 'The loaf is cheaper for breakfast. Three mornings of toast for six bucks.'], ['Any treat you recommend?', 'Cake when you are sad, cinnamon roll when you are tired.']],
  perk: { text: 'Tess splits her cinnamon roll with you. Hunger +6.', go() { addH(6); } } });
STAFF('gwen', 'Gwen', 'Getting highlights', LOOK('#e5c7e8', '#2f2f45', '#d9b46a', '#efc3a0', 1), {
  greet: ['Do not look at me, I am half foil right now.', 'Bianca is a genius. You will see.', 'I come every month. Best part of my month, honestly.', 'Ooh, are you getting something new?'],
  replies: [['"You look great."', 'Says you! Wait until it is done.'], ['"Is a new cut worth it?"', 'Every time. I walk out feeling like a new person for days.'], ['"How long does it take?"', 'About forty minutes. Bianca talks the whole time. It is great.']],
  topics: [['What style should I get?', 'Something you would never pick. That is how you find your favorite.'], ['Does a haircut help at work?', 'You stand up straighter. People notice. It is science, probably.']],
  perk: { text: 'Gwen compliments your style. Mood +3.', go() { addMood(3); } } });

/* ---------- Main Street Pharmacy ---------- */
defInt('pharmacy', {
  name: 'Main Street Pharmacy', w: 960, h: 600, exit: { x: 480 }, wallCol: '#e3efe6', trim: '#5c9c74',
  floors: [[34, TW, 892, 474, 'lino', '#eef4ef']],
  deco(c) {
    winTop(c, 110, 90); winTop(c, 260, 70);
    sign(c, 'MAIN STREET PHARMACY', 500, 36, 230, '#2f7d55');
    signText(c, 'PRESCRIPTIONS', 730, 64, 9, '#2f7d55');
  },
  furn: [
    { t: 'shelf', x: 560, y: 92, w: 340, h: 26, cols: ['#f4f7f9', '#e9c46a', '#8ecae6', '#f4a261'] },
    { t: 'counter', x: 560, y: 128, w: 340, h: 46, c: '#2f7d55', top: '#f0f6f2' },
    { t: 'machine', x: 60, y: 96, w: 54, h: 64, c: '#2a9d8f', label: 'BP', fs: 9, screen: '#9be7a8' },
    { t: 'cooler', x: 380, y: 96, w: 130, h: 56 },
    { t: 'shelf', x: 90, y: 250, w: 140, h: 46, label: 'VITAMINS', cols: ['#e9c46a', '#f4a261', '#ffffff', '#8ac926'] }, { t: 'shelf', x: 240, y: 250, w: 140, h: 46, label: 'FIRST AID', cols: ['#e63946', '#ffffff', '#f1faee'] },
    { t: 'shelf', x: 90, y: 390, w: 140, h: 46, label: 'COLD & FLU', cols: ['#4cc9f0', '#c77dff', '#ffffff'] }, { t: 'shelf', x: 240, y: 390, w: 140, h: 46, label: 'SNACKS', s: 2 },
    { t: 'register', x: 640, y: 400, w: 170, h: 46 },
    { t: 'bench', x: 600, y: 300, w: 120, h: 28, c: '#2f7d55' }, { t: 'shelf', x: 760, y: 280, w: 140, h: 40, label: 'SKIN CARE', cols: ['#ffcad4', '#ffffff', '#e5c7e8', '#8ecae6'] },
    { t: 'rug', x: 420, y: 230, w: 120, h: 230, c: '#7fbf9a' },
    { t: 'crate', x: 440, y: 470, w: 80, h: 30, c: '#2f7d55', label: 'SALE', fs: 8, fill: ['#e9c46a', '#ffffff', '#e76f51'] },
    { t: 'plant', x: 880, y: 520, w: 30, h: 32 }, { t: 'plant', x: 46, y: 520, w: 30, h: 32 }, { t: 'plant', x: 530, y: 96, w: 26, h: 30 }, { t: 'mat', x: 430, y: 540, w: 100, h: 20, c: '#2f7d55' }
  ],
  spots: [
    { id: 'rx', x: 730, y: 222, r: 70, prompt: () => 'Talk to the pharmacist', panel: () => spec('pharmacy', 'Pharmacy counter', {
      note: 'Over-the-counter help for long weeks.' + (S.fx.tooth ? ' Your tooth still aches. A pain reliever covers it for 12 hours.' : ''),
      sections: [{ h: 'Behind the counter', items: [
        shopItem('Daily vitamins', 5, { d: 'Energy drains 15% slower for 24 hours.', off: () => fxOn('vit') ? 'You already took one today.' : '', after() { giveFx('vit', 1440); }, msg: 'Vitamins taken. Your energy will last longer today.', snd: 'drink' }),
        shopItem('Pain reliever', 6, { d: S.fx.tooth ? 'Hides the toothache for 12 hours.' : 'For aches and pains. Mood +3.', mood: S.fx.tooth ? 0 : 3, off: () => fxOn('pain') ? 'Still working. Wait a while.' : '', after() { giveFx('pain', 720); }, msg: S.fx.tooth ? 'The ache fades for now. See the dentist to fix it.' : 'A headache you did not know you had is gone.' }),
        shopItem('Sleep aid', 7, { d: 'Your next night in bed restores 20% more energy and keeps nightmares away.', off: () => S.fx.sleepaid ? 'You already have one ready for tonight.' : '', after() { S.fx.sleepaid = 1; S.calm = true; }, msg: 'Sleep aid in your pocket for tonight.' })
      ] }]
    }) },
    { id: 'aisle', x: 235, y: 330, r: 64, prompt: () => 'Browse the aisles', panel: () => spec('pharmacy', 'Health aisles', {
      note: 'Quick fixes for a busy day.',
      sections: [{ h: 'Grab and go', items: [
        shopItem('Protein bar', 3, { hunger: 18, mins: 5 }),
        shopItem('Electrolyte drink', 3, { thirst: 40, energy: 4, mins: 5 }),
        shopItem('Cough drops', 2, { mood: 1, mins: 0, d: 'Honey lemon. Mostly a candy.' })
      ] }]
    }) },
    { id: 'cooler', x: 445, y: 190, r: 60, prompt: () => 'Open the drinks cooler', panel: () => spec('pharmacy', 'Drinks cooler', {
      sections: [{ h: 'Cold drinks', items: [buyDrink('Bottled water', 1.5, { thirst: 35, d: 'Thirst +35.', msg: 'Thirst +35.' }), shopItem('Electrolyte drink', 3, { thirst: 40, energy: 4, mins: 5 })] }]
    }) },
    { id: 'bp', x: 87, y: 196, r: 50, prompt: () => 'Use the blood pressure machine', panel: () => {
      const low = [['hunger', S.hunger], ['thirst', S.thirst], ['energy', S.energy], ['mood', S.mood]].sort((a, b) => a[1] - b[1])[0];
      const tip = low[1] > 60 ? 'Everything looks good. Keep it up.' : low[0] === 'mood' ? 'Your mood is the lowest. Do something fun: a movie, a book, a chat.' : low[0] === 'hunger' ? 'Eat a proper meal soon.' : low[0] === 'thirst' ? 'Drink some water.' : 'Get some real sleep tonight.';
      return spec('pharmacy', 'Blood pressure machine', { stock: null, note: 'Beep. 118 over 76. Hunger ' + Math.round(S.hunger) + ', thirst ' + Math.round(S.thirst) + ', energy ' + Math.round(S.energy) + ', mood ' + Math.round(S.mood) + '. ' + tip + (S.fx.tooth ? ' Also: that tooth needs a dentist.' : '') });
    } }
  ],
  folks: [folkAt('okafor', 730, 126)]
});

/* ---------- First Bank ---------- */
function bankSections(full) {
  const dep = [50, 100, 250].filter(n => n < S.money).map(n => ({ t: 'Deposit ' + fmt(n), d: 'Move cash into savings.', tag: fmt(n), go() { bankDeposit(n); } }));
  if (S.money >= 1) dep.push({ t: 'Deposit all your cash', d: 'Keep nothing in your pocket. Bold.', tag: fmt(S.money), go() { bankDeposit(S.money); } });
  const wd = [20, 50, 100].filter(n => n <= S.bank.bal).map(n => ({ t: 'Withdraw ' + fmt(n), d: 'Cash for food, fares and fun.', tag: fmt(n), go() { bankWithdraw(n); } }));
  if (S.bank.bal >= 1) wd.push({ t: 'Withdraw everything', d: 'Empty your savings into your pocket.', tag: fmt(S.bank.bal), go() { bankWithdraw(S.bank.bal); } });
  const out = [];
  if (dep.length) out.push({ h: 'Deposit', items: dep });
  if (wd.length) out.push({ h: 'Withdraw', items: wd });
  if (full) {
    const R = S.rent, owed = RENT + (R.late > 0 ? LATE_FEE : 0);
    out.push({ h: 'Rent', items: [
      { t: S.bank.auto ? 'Turn off rent autopay' : 'Turn on rent autopay', d: S.bank.auto ? 'Rent will no longer pay itself.' : 'Pays rent from savings (then cash) at midnight on the due day.', tag: S.bank.auto ? 'on' : 'off', go() { S.bank.auto = !S.bank.auto; toast(S.bank.auto ? 'Autopay is on. Rent pays itself on Sunday.' : 'Autopay is off.', 'good'); } },
      { t: 'Pay rent from savings now', d: R.paid ? 'Already paid this week.' : 'Sends ' + fmt(owed) + ' to Mrs. Reyes.', tag: fmt(owed), off: R.paid ? 'Rent is paid.' : S.day < R.due - 4 ? 'Too early. Rent opens ' + DOW_LONG[weekdayOf(R.due - 4)] + '.' : S.bank.bal < owed ? 'Not enough in savings.' : '',
        go() { S.bank.bal = Math.round((S.bank.bal - owed) * 100) / 100; S.stats.spent += owed; R.paid = true; R.late = 0; addMood(3); SFX.chime('pay'); toast('Rent paid from savings. ' + fmt(owed) + '.', 'good'); } }
    ] });
  }
  return out;
}
defInt('bank', {
  name: 'First Bank', w: 960, h: 600, exit: { x: 480 }, wallCol: '#ece5d6', trim: '#8a7a55',
  floors: [[34, TW, 892, 474, 'tile', '#efe9dc', 'rgba(120,100,60,.08)']],
  deco(c) {
    winTop(c, 80, 80); winTop(c, 200, 80);
    sign(c, 'FIRST BANK', 480, 36, 150, '#2a6f97');
    vaultDoor(c, 820);
  },
  furn: [
    { t: 'runner', x: 440, y: 250, w: 80, h: 300 },
    { t: 'teller', x: 270, y: 132, w: 420, h: 48, c: '#6b5a3a', top: '#efe3c8', n: 3 },
    { t: 'posts', x: 380, y: 262, w: 200, h: 12 },
    { t: 'desk', x: 80, y: 300, w: 130, h: 50, c: '#6b5a3a', screen: '#9be7a8' }, { t: 'chair', x: 130, y: 360, w: 28, h: 24, c: '#2a6f97' },
    { t: 'sofa', x: 730, y: 300, w: 150, h: 54, c: '#2a6f97' }, { t: 'table', x: 765, y: 370, w: 80, h: 36, c: '#8a7a55' },
    { t: 'atm', x: 846, y: 450, w: 54, h: 66 },
    { t: 'table', x: 580, y: 250, w: 100, h: 40, c: '#6b5a3a', label: 'SLIPS', fs: 8 }, { t: 'rug', x: 70, y: 410, w: 160, h: 90, c: '#2a6f97' },
    { t: 'plant', x: 46, y: 130, w: 30, h: 32 }, { t: 'plant', x: 900, y: 140, w: 30, h: 32 }, { t: 'plant', x: 46, y: 520, w: 30, h: 32 }, { t: 'mat', x: 430, y: 540, w: 100, h: 20, c: '#2a6f97' }
  ],
  spots: [
    { id: 'teller', x: 480, y: 220, r: 70, prompt: () => 'Visit a teller', panel: () => spec('bank', 'Teller window', {
      note: 'Savings earn 0.25% a day, paid at midnight, and a blackout bill never touches them. You have ' + fmt(S.bank.bal) + ' saved' + (S.bank.earned >= 0.01 ? ', including ' + fmt(S.bank.earned) + ' in interest.' : '.'),
      stock: ['Cash ' + fmt(S.money), 'Savings ' + fmt(S.bank.bal)], sections: bankSections(false)
    }) },
    { id: 'advisor', x: 145, y: 420, r: 60, prompt: () => 'Sit with the financial advisor', panel: () => {
      const wk = Math.round(curRate() * 40 * payMult());
      return spec('bank', 'Financial advisor', {
        note: 'A full week of shifts pays about ' + fmt(wk) + '. Rent is ' + fmt(RENT) + ', and food runs about $100 if you cook. ' + (S.bank.bal >= RENT ? 'You have a full week of rent saved. Well done.' : 'Try to save one week of rent, ' + fmt(RENT) + ', as a cushion.'),
        stock: ['Cash ' + fmt(S.money), 'Savings ' + fmt(S.bank.bal), 'Autopay ' + (S.bank.auto ? 'on' : 'off')], sections: bankSections(true).filter(s => s.h === 'Rent')
      });
    } },
    { id: 'atm', x: 873, y: 540, r: 50, prompt: () => 'Use the ATM', panel: () => spec('bank', 'ATM', { note: 'Quick cash, no line.', stock: ['Cash ' + fmt(S.money), 'Savings ' + fmt(S.bank.bal)], sections: bankSections(false) }) },
    { id: 'sofa', x: 805, y: 440, r: 54, prompt: () => 'Wait on the sofa', panel: () => spec('bank', 'Lobby sofa', { stock: null, note: 'Soft jazz and a bowl of mints.', sections: [{ h: 'Rest', items: [shopItem('Sit and have a mint', 0, { mood: 2, energy: 2, mins: 15, off: once('bankmint', 'One mint a day. Bank rules.'), after() { markToday('bankmint'); } })] }] }) }
  ],
  folks: [folkAt('greta', 480, 130), folkAt('hale', 145, 296)]
});

/* ---------- Dog-Ear Books ---------- */
function bookBuyItems(kind) {
  return shopBooks().filter(b => b.kind === kind).map(b => ({
    t: b.title, d: b.blurb + (b.kind === 'career' ? ' ' + b.ch + ' chapters. Finish it for +3% pay for good.' : ' Mood boost every chapter.'),
    tag: bookOwned(b.id) ? (bookDone(b.id) ? 'read' : 'owned') : fmt(b.price),
    off: bookOwned(b.id) ? (bookDone(b.id) ? 'You finished this one.' : 'You own it. Read it anywhere comfy.') : !canSpend(b.price) ? 'You cannot afford that.' : '',
    go() { spend(b.price); S.books[b.id] = 0; SFX.chime('pay'); toast('You bought ' + b.title + '. Read it here, at home, at Cafe Luna or in the park.', 'good'); }
  }));
}
defInt('books', {
  name: 'Dog-Ear Books', w: 960, h: 600, exit: { x: 480 }, wallCol: '#e9dcc8', trim: '#7a5a3a',
  floors: [[34, TW, 892, 474, 'wood', '#b98a5a']],
  deco(c) {
    winTop(c, 140, 70); winTop(c, 760, 70);
    sign(c, 'DOG-EAR BOOKS', 480, 36, 170, '#8a5a3c');
  },
  furn: [
    { t: 'bookshelf', x: 44, y: 90, w: 320, h: 40 }, { t: 'bookshelf', x: 590, y: 90, w: 326, h: 40 },
    { t: 'bookshelf', x: 90, y: 240, w: 170, h: 46 }, { t: 'bookshelf', x: 280, y: 240, w: 170, h: 46 },
    { t: 'bookshelf', x: 520, y: 240, w: 170, h: 46 },
    { t: 'booktable', x: 400, y: 380, w: 150, h: 60, c: '#8a5a3c', label: 'STAFF PICKS' },
    { t: 'rug', x: 710, y: 360, w: 200, h: 150, c: '#6b4a7a' },
    { t: 'armchair', x: 724, y: 380, w: 56, h: 52, c: '#8a4a38' }, { t: 'armchair', x: 840, y: 380, w: 56, h: 52, c: '#3d5a80' },
    { t: 'lamp', x: 794, y: 372, w: 26, h: 52 },
    { t: 'register', x: 80, y: 440, w: 160, h: 46 },
    { t: 'plant', x: 900, y: 150, w: 30, h: 32 }, { t: 'plant', x: 46, y: 520, w: 30, h: 32 }, { t: 'mat', x: 430, y: 540, w: 100, h: 20 }
  ],
  spots: [
    { id: 'career', x: 270, y: 320, r: 66, prompt: () => 'Browse career books', panel: () => spec('books', 'Career shelf', { note: 'Books for your field, ' + job().short.toLowerCase() + ' and general. Every career book you finish adds 3% to your hourly rate, for good.', stock: [fmt(S.money), 'Skill +' + S.skill * 3 + '%'], sections: [{ h: 'For your career', items: bookBuyItems('career') }] }) },
    { id: 'fiction', x: 605, y: 320, r: 62, prompt: () => 'Browse fiction', panel: () => spec('books', 'Fiction shelf', { note: 'Stories that make the week feel shorter. Every chapter lifts your mood.', sections: [{ h: 'Novels', items: bookBuyItems('novel') }] }) },
    { id: 'picks', x: 475, y: 470, r: 54, prompt: () => 'Flip through the staff picks', panel: () => spec('books', 'Staff picks', { stock: null, note: 'Agnes writes a little card for every book on this table.', sections: [{ h: 'Browse', items: [shopItem('Read a few pages for free', 0, { mood: 3, mins: 20, off: once('browse', 'Agnes gives you a look. Buy something next time.'), after() { markToday('browse'); }, msg: 'You read the first chapter standing up. Mood +3.' })] }] }) },
    { id: 'nook', x: 810, y: 470, r: 60, prompt: () => 'Sit in the reading nook', panel: () => { const r = readSection('books'); return spec('books', 'Reading nook', { stock: null, note: r ? 'A lamp, two armchairs and nobody in a hurry.' : 'A lamp, two armchairs and nobody in a hurry. Buy a book to read it here.', sections: r ? [r] : [] }); } }
  ],
  folks: [folkAt('agnes', 160, 436), folkAt('milo', 868, 438)]
});

/* ---------- Rise & Shine Bakery ---------- */
defInt('bakery', {
  name: 'Rise & Shine Bakery', w: 900, h: 580, exit: { x: 450 }, wallCol: '#f3e3cf', trim: '#c47a3a',
  floors: [[34, TW, 832, 454, 'tile', '#f6efe3', 'rgba(196,122,58,.12)']],
  deco(c) {
    winTop(c, 640, 90);
    sign(c, 'RISE & SHINE BAKERY', 430, 36, 220, '#a8642a');
    chalkboard(c, 110, 120, 'TODAY', ['Croissant  $3', 'Loaf  $6', 'Cinnamon roll  $4', 'Cake slice  $5']);
  },
  furn: [
    { t: 'machine', x: 290, y: 92, w: 110, h: 36, c: '#7d8a94', label: 'OVEN', fs: 9, screen: '#ff9f43' }, { t: 'machine', x: 410, y: 92, w: 110, h: 36, c: '#7d8a94', label: 'OVEN', fs: 9, screen: '#ff9f43' },
    { t: 'shelf', x: 540, y: 92, w: 80, h: 36, cols: ['#d9a05b', '#c47a3a', '#e9c46a'] },
    { t: 'pcase', x: 200, y: 168, w: 430, h: 50, c: '#a8642a' },
    { t: 'round', x: 130, y: 330, w: 80, h: 58, c: '#c2a37a' }, { t: 'chair', x: 104, y: 394, w: 26, h: 24, c: '#8b6240' }, { t: 'chair', x: 196, y: 394, w: 26, h: 24, c: '#8b6240' },
    { t: 'round', x: 400, y: 360, w: 80, h: 58, c: '#c2a37a' }, { t: 'chair', x: 374, y: 424, w: 26, h: 24, c: '#8b6240' }, { t: 'chair', x: 466, y: 424, w: 26, h: 24, c: '#8b6240' },
    { t: 'round', x: 660, y: 320, w: 80, h: 58, c: '#c2a37a' }, { t: 'chair', x: 634, y: 384, w: 26, h: 24, c: '#8b6240' }, { t: 'chair', x: 726, y: 384, w: 26, h: 24, c: '#8b6240' },
    { t: 'crate', x: 730, y: 440, w: 100, h: 40, c: '#b98a55', label: 'DAY-OLD', fs: 8, fill: ['#d9a05b', '#c47a3a'] },
    { t: 'crate', x: 50, y: 190, w: 90, h: 36, c: '#a8642a', label: 'BAGUETTES', fs: 7, fill: ['#e0b070', '#d9a05b'] }, { t: 'crate', x: 50, y: 236, w: 90, h: 36, c: '#a8642a', label: 'ROLLS', fs: 7, fill: ['#e9c46a', '#d08a3a'] },
    { t: 'counter', x: 680, y: 180, w: 150, h: 40, c: '#a8642a', top: '#f6efe3', label: 'COFFEE' }, { t: 'gadget', x: 690, y: 176, w: 30, h: 46, dh: 26, ghost: true },
    { t: 'rug', x: 300, y: 330, w: 280, h: 140, c: '#e0b070' },
    { t: 'plant', x: 46, y: 130, w: 30, h: 32 }, { t: 'plant', x: 830, y: 140, w: 30, h: 32 }, { t: 'mat', x: 400, y: 520, w: 100, h: 20 }
  ],
  spots: [
    { id: 'case', x: 415, y: 268, r: 80, prompt: () => 'Order from the display case', panel: () => {
      const half = S.t >= 15 * 60 ? 0.5 : 1;
      return spec('bakery', 'Display case', {
        note: 'Everything baked this morning.' + (half < 1 ? ' After 3 PM the day-old bin is half price.' : ''),
        sections: [
          { h: 'Breakfast', items: [placeMeal('b', 'Croissant and coffee', 7, { hunger: 42, energy: 8, mood: 3, mins: 20, d: 'Flaky, buttery, hot.' })] },
          { h: 'Treats', items: [
            shopItem('Cinnamon roll', 4, { hunger: 16, mood: 4, mins: 10 }),
            shopItem('Slice of cake', 5, { hunger: 14, mood: 7, mins: 10, d: 'Lemon, with too much icing. Perfect.' }),
            shopItem('Croissant', 3, { hunger: 14, mood: 2, mins: 5 })
          ] },
          { h: 'Take home', items: [{ t: 'Fresh loaf', d: 'Three breakfasts of toast for your pantry. You have ' + S.pantry.b + '.', tag: fmt(6), off: canSpend(6) ? '' : 'You cannot afford that.', go() { spend(6); S.pantry.b += 3 + (hasPerk('coupon') ? 1 : 0); SFX.chime('pay'); toast('A warm loaf for your pantry. Breakfast +' + (3 + (hasPerk('coupon') ? 1 : 0)) + '.', 'good'); } }] }
        ]
      });
    } },
    { id: 'dayold', x: 780, y: 520, r: 52, prompt: () => 'Dig through the day-old bin', panel: () => spec('bakery', 'Day-old bin', {
      note: S.t >= 15 * 60 ? 'Half price after 3 PM. Still delicious.' : 'Not much in here until the afternoon. Half price after 3 PM.',
      sections: [{ h: 'Bargains', items: [
        shopItem('Day-old pastry bag', 2, { hunger: 18, mood: 2, mins: 5, off: () => S.t < 15 * 60 ? 'Come back after 3 PM.' : '' }),
        { t: 'Day-old loaf', d: 'Three breakfasts for your pantry, half price. You have ' + S.pantry.b + '.', tag: fmt(3), off: S.t < 15 * 60 ? 'Come back after 3 PM.' : canSpend(3) ? '' : 'You cannot afford that.', go() { spend(3); S.pantry.b += 3; SFX.chime('pay'); toast('Day-old loaf for your pantry. Breakfast +3.', 'good'); } }
      ] }]
    }) },
    { id: 'table', x: 170, y: 440, r: 50, prompt: () => 'Sit at a table', panel: () => spec('bakery', 'Corner table', { stock: null, note: 'Warm air from the ovens and the smell of bread.', sections: [{ h: 'Linger', items: [shopItem('Sit and breathe in the bread smell', 0, { mood: 3, mins: 15, off: once('bread', 'You have already had your fill of the smell today.'), after() { markToday('bread'); } })] }] }) }
  ],
  folks: [folkAt('luc', 415, 164), folkAt('tess', 560, 300)]
});

/* ---------- Hank's Hardware ---------- */
const HOME_GOODS = [
  { k: 'coffee', t: 'Coffee maker', price: 35, d: 'Free coffee at home, every morning. Energy +12 a cup.' },
  { k: 'mattress', t: 'Memory-foam mattress', price: 140, d: 'Sleep restores 30% more energy.' },
  { k: 'curtains', t: 'Blackout curtains', price: 45, d: 'Naps restore 25% more energy.' },
  { k: 'chair', t: 'Reading chair and lamp', price: 55, d: 'A cozy corner. Reading at home lifts your mood more.' },
  { k: 'records', t: 'Record player', price: 60, d: 'Spin a record at home. Mood +8 a side.' },
  { k: 'plants', t: 'A few houseplants', price: 20, d: 'A little green. Mood +2 every morning.' }
];
const RUGS = [['#8a4a38', 'Brick red'], ['#3d5a80', 'Navy'], ['#2a9d8f', 'Teal'], ['#c9a06a', 'Sand'], ['#7b6fd0', 'Violet']];
defInt('hardware', {
  name: "Hank's Hardware", w: 1000, h: 620, exit: { x: 500 }, wallCol: '#ddd5c6', trim: '#c0392b',
  floors: [[34, TW, 932, 494, 'plain', '#cfcac0'], [600, 250, 340, 300, 'wood', '#c9a06a']],
  deco(c) {
    winTop(c, 160, 70); winTop(c, 800, 70);
    sign(c, "HANK'S HARDWARE", 500, 36, 180, '#c0392b');
  },
  furn: [
    { t: 'pegboard', x: 44, y: 88, w: 360, h: 34 }, { t: 'pegboard', x: 600, y: 88, w: 350, h: 34 },
    { t: 'shelf', x: 80, y: 240, w: 160, h: 46, label: 'TOOLS', cols: ['#c0392b', '#2b2f36', '#e9c46a', '#5a6672'] },
    { t: 'shelf', x: 260, y: 240, w: 160, h: 46, label: 'PAINT', cols: ['#e76f51', '#2a9d8f', '#e9c46a', '#8ecae6', '#c77dff', '#ffffff'] },
    { t: 'shelf', x: 80, y: 360, w: 160, h: 46, label: 'GARDEN', cols: ['#2f9d6a', '#8ac926', '#9a5b3a'] },
    // the home goods showroom
    { t: 'bed', x: 820, y: 270, w: 100, h: 130, c: '#7a5cc4' }, { t: 'armchair', x: 650, y: 290, w: 56, h: 52, c: '#8a4a38' }, { t: 'lamp', x: 716, y: 280, w: 26, h: 52 },
    { t: 'table', x: 640, y: 420, w: 110, h: 44, c: '#9c7a4f' }, { t: 'gadget', kind: 'turntable', x: 650, y: 416, w: 44, h: 50, dh: 30, ghost: true }, { t: 'gadget', x: 704, y: 416, w: 26, h: 50, dh: 28, ghost: true },
    { t: 'plant', x: 780, y: 440, w: 30, h: 32 }, { t: 'plant', x: 900, y: 440, w: 30, h: 32 },
    { t: 'crate', x: 320, y: 380, w: 90, h: 34, c: '#5a6672', label: 'UMBRELLAS', fs: 7, fill: ['#2a6f97', '#e76f51', '#2b2f36'] },
    { t: 'shelf', x: 440, y: 240, w: 130, h: 46, label: 'PLUMBING', cols: ['#9aa7ad', '#c9cdd2', '#2a6f97'] },
    { t: 'crate', x: 450, y: 330, w: 110, h: 36, c: '#8a95a0', label: 'PAINT CANS', fs: 7, fill: ['#e76f51', '#2a9d8f', '#e9c46a', '#ffffff'] },
    { t: 'register', x: 90, y: 470, w: 150, h: 46 },
    { t: 'mat', x: 450, y: 560, w: 100, h: 20, c: '#c0392b' }
  ],
  spots: [
    { id: 'home', x: 760, y: 360, r: 80, prompt: () => 'Browse the home goods', panel: () => spec('hardware', 'Home goods', {
      note: 'Everything here gets delivered to Apt 12 the same day.',
      sections: [
        { h: 'For your apartment', items: HOME_GOODS.map(g => ({ t: g.t, d: g.d, tag: S.own[g.k] ? 'owned' : fmt(g.price), off: S.own[g.k] ? 'Already in your apartment.' : canSpend(g.price) ? '' : 'You cannot afford that.',
          go() { spend(g.price); S.own[g.k] = true; applyHome(); addMood(4); SFX.chime('pay'); toast(g.t + ' delivered to Apt 12. Mood +4.', 'good'); } })) },
        { h: 'A new rug', items: RUGS.filter(r => r[0] !== S.own.rug).map(r => ({ t: r[1] + ' rug', d: 'Swap the living room rug.', tag: fmt(25), off: canSpend(25) ? '' : 'You cannot afford that.', go() { spend(25); S.own.rug = r[0]; applyHome(); addMood(3); SFX.chime('pay'); toast('A ' + r[1].toLowerCase() + ' rug for your living room. Mood +3.', 'good'); } })) }
      ]
    }) },
    { id: 'umbrella', x: 365, y: 460, r: 54, prompt: () => 'Browse the outdoor gear', panel: () => spec('hardware', 'Outdoor gear', {
      note: 'It rains about one day in five. Walking in the rain without one drags your mood down. The pond in Central Park is full of fish, and it freezes over in winter.',
      sections: [{ h: 'Gear', items: [{ t: 'Fishing rod', d: 'Fish at the park pond, any season. Ice fishing in winter.', tag: S.own.rod ? 'owned' : fmt(25), off: S.own.rod ? 'You already have one.' : canSpend(25) ? '' : 'You cannot afford that.', go() { spend(25); S.own.rod = true; SFX.chime('pay'); toast('A fishing rod! Head to the pond in Central Park.', 'good'); } },{ t: 'Sturdy umbrella', d: 'Keeps the rain off and your mood up.', tag: S.own.umbrella ? 'owned' : fmt(12), off: S.own.umbrella ? 'You already have one.' : canSpend(12) ? '' : 'You cannot afford that.', go() { spend(12); S.own.umbrella = true; SFX.chime('pay'); toast('You bought an umbrella. Let it rain.', 'good'); } }] }]
    }) }
  ],
  folks: [folkAt('hank', 165, 466)]
});

/* ---------- Starlight Cinema ---------- */
function ticketPrice() { return weekdayOf(S.day) === 2 ? 6 : S.t < 17 * 60 ? 8 : 12; }
function showItems() {
  const price = ticketPrice();
  return SHOWS.map((st, k) => {
    const f = filmAt(k), wait = st - S.t;
    let off = '';
    if (wait < -10) off = 'Already started.';
    else if (wait > 90) off = 'Doors open 90 minutes before the show.';
    else if (!canSpend(price)) off = 'You cannot afford a ticket.';
    return {
      t: clockStr(st).replace(':00', '') + ' · ' + f.t, d: f.g + '. ' + (f.calm ? 'Calm and moving; good dreams tonight. ' : f.scary ? 'Scary; you may have a nightmare. ' : '') + 'Mood +' + f.mood + (f.energy ? ', energy +' + f.energy : '') + (wait > 0 && wait <= 90 ? '. Starts in ' + wait + ' min.' : '.'),
      tag: fmt(price) + ' · 2h', off,
      go() {
        spend(price);
        if (wait > 0) advance(wait, 'idle');
        if (G.collapse || S.over) return;
        const pop = !!S.fx.popcorn; S.fx.popcorn = 0;
        startSkip({ mins: 120, secs: 13, act: 'idle', kind: 'film', title: f.t, sub: f.g + ' · Theater ' + (1 + k % 2), scene: 'cinema', film: f.t, pal: f.pal, popcorn: pop, lines: f.lines,
          onEnd() {
            const m = f.mood + (pop ? 4 : 0);
            addMood(m); if (f.energy) S.energy = clamp(S.energy + f.energy, 0, 100);
            if (f.calm) S.calm = true; if (f.scary) S.fx.scary = 1;
            S.stats.films = (S.stats.films || 0) + 1; lifeEv('fun'); gainXP(10);
            toast('The credits roll on ' + f.t + '. Mood +' + m + (pop ? ' (popcorn helped)' : '') + '.', 'good');
          } });
      }
    };
  });
}
defInt('cinema', {
  name: 'Starlight Cinema', w: 1000, h: 620, exit: { x: 500 }, wallCol: '#4a2433', trim: '#d4a017',
  floors: [[34, TW, 932, 494, 'carpet', '#5a1f2e', 'rgba(255,200,80,.06)']],
  deco(c) {
    const fl = S ? filmsToday() : FILMS.slice(0, 3);
    wallPoster(c, 70, 46, fl[0].pal, fl[0].t); wallPoster(c, 134, 46, fl[1].pal, fl[1].t); wallPoster(c, 198, 46, fl[2].pal, fl[2].t);
    sign(c, 'NOW SHOWING', 500, 30, 150, '#d4a017');
    c.fillStyle = '#ffe9a8'; for (let i = 0; i < 18; i++) { c.beginPath(); c.arc(420 + i * 9.4, 48, 1.8, 0, 7); c.fill(); }
    // doors to the theaters: an arch, velvet curtains, brass pulls and a warm line of light from inside
    [[760, '1'], [880, '2']].forEach(p => {
      IM.shadow(c, p[0] - 38, 16, 76, 70, 6, 6, 0.45, 2, 3);
      c.fillStyle = IM.grad(c, p[0] - 38, 0, p[0] + 38, 0, [[0, '#f1dc9a'], [0.5, '#d4a017'], [1, '#8a6a2e']]); rr(c, p[0] - 38, 16, 76, 70, 6); c.fill();
      c.fillStyle = '#1a0610'; rr(c, p[0] - 33, 21, 66, 65, 4); c.fill();
      c.fillStyle = IM.grad(c, p[0] - 33, 0, p[0] + 33, 0, [[0, '#a0293f'], [0.5, '#7a1f33'], [1, '#541424']]);
      c.fillRect(p[0] - 32, 22, 31, 64); c.fillRect(p[0] + 1, 22, 31, 64);
      c.fillStyle = 'rgba(255,255,255,.14)'; for (let k = 0; k < 5; k++) { c.fillRect(p[0] - 30 + k * 6, 22, 1.6, 64); c.fillRect(p[0] + 3 + k * 6, 22, 1.6, 64); }
      c.fillStyle = 'rgba(0,0,0,.22)'; for (let k = 0; k < 5; k++) { c.fillRect(p[0] - 27 + k * 6, 22, 1.4, 64); c.fillRect(p[0] + 6 + k * 6, 22, 1.4, 64); }
      c.fillStyle = 'rgba(255,214,150,.5)'; c.fillRect(p[0] - 0.8, 22, 1.6, 64);
      c.fillStyle = '#e9c46a'; c.beginPath(); c.arc(p[0] - 10, 56, 3, 0, 7); c.arc(p[0] + 10, 56, 3, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(p[0] - 10.8, 55, 1, 0, 7); c.arc(p[0] + 9.2, 55, 1, 0, 7); c.fill();
      sign(c, 'THEATER ' + p[1], p[0], 12, 70, '#2a0a14');
    });
  },
  furn: [
    { t: 'counter', x: 330, y: 132, w: 340, h: 48, c: '#7a1f33', top: '#f6e7cb' },
    { t: 'popcorn', x: 350, y: 92, w: 70, h: 36 }, { t: 'machine', x: 590, y: 92, w: 60, h: 36, c: '#4361ee', label: 'SODA', fs: 8, screen: '#ffd166' },
    { t: 'counter', x: 70, y: 300, w: 160, h: 50, c: '#d4a017', top: '#f6e7cb', label: 'TICKETS' },
    { t: 'posts', x: 90, y: 400, w: 150, h: 12 },
    { t: 'claw', x: 850, y: 280, w: 66, h: 76 },
    { t: 'sofa', x: 410, y: 400, w: 180, h: 54, c: '#7a1f33' },
    { t: 'runner', x: 465, y: 470, w: 70, h: 90, c: '#d4a017' },
    { t: 'machine', x: 720, y: 300, w: 46, h: 70, c: '#4361ee', label: 'ARCADE', fs: 6.5, screen: '#f72585' },
    { t: 'armchair', x: 300, y: 420, w: 54, h: 48, c: '#7a1f33' }, { t: 'armchair', x: 650, y: 420, w: 54, h: 48, c: '#7a1f33' },
    { t: 'plant', x: 46, y: 130, w: 30, h: 32 }, { t: 'plant', x: 920, y: 520, w: 30, h: 32 }, { t: 'mat', x: 450, y: 560, w: 100, h: 20, c: '#d4a017' }
  ],
  spots: [
    { id: 'tickets', x: 150, y: 384, r: 64, prompt: () => 'Buy a movie ticket', panel: () => spec('cinema', 'Ticket booth', {
      note: 'Shows at noon, 3, 6 and 9 PM. Matinees before 5 PM are $8, evening shows $12, and every show on Tuesday is $6.' + (S.fx.popcorn ? ' You have popcorn ready.' : ' Grab popcorn first for a better movie.'),
      stock: [fmt(S.money), 'Mood ' + Math.round(S.mood)], sections: [{ h: 'Today\'s shows', items: showItems() }]
    }) },
    { id: 'snacks', x: 500, y: 236, r: 76, prompt: () => 'Visit the concession stand', panel: () => spec('cinema', 'Concession stand', {
      note: 'Popcorn you buy here comes into the next movie with you. Movies with popcorn are better movies.',
      sections: [{ h: 'Snacks', items: [
        { t: 'Popcorn for the movie', d: 'Hunger +16 now, and +4 mood during your next film.', tag: S.fx.freecorn ? 'free' : fmt(6), off: S.fx.popcorn ? 'You already have a bucket.' : (!S.fx.freecorn && !canSpend(6)) ? 'You cannot afford that.' : '', go() { if (S.fx.freecorn) S.fx.freecorn = 0; else spend(6); S.fx.popcorn = 1; applyIntake({ hunger: 16, mins: 0 }); SFX.chime('eat'); toast('A big bucket of buttery popcorn.', 'good'); } },
        buyDrink('Fountain soda', 4, { thirst: 26, energy: 3, d: 'Thirst +26, energy +3.', msg: 'Thirst +26.' }),
        shopItem('Candy', 3, { hunger: 6, mood: 3 })
      ] }]
    }) },
    { id: 'claw', x: 883, y: 400, r: 54, prompt: () => 'Try the claw machine', panel: () => spec('cinema', 'Claw machine', {
      note: 'Plush animals, a shy claw and pure hope.' + (S.stats.plush ? ' You have won ' + S.stats.plush + ' so far.' : ''),
      sections: [{ h: 'One try', items: [{ t: 'Drop the claw', d: 'About a one in four chance.', tag: fmt(1), off: canSpend(1) ? '' : 'You cannot afford that.', go() {
        spend(1); applyIntake({ mins: 2 });
        if (Math.random() < 0.27 * luck()) { const a = ['otter', 'penguin', 'frog', 'red panda', 'whale', 'dinosaur'][Math.floor(Math.random() * 6)]; S.stats.plush = (S.stats.plush || 0) + 1; addMood(6); SFX.chime('pay'); toast('You won a plush ' + a + '! Mood +6.', 'good'); }
        else { addMood(1); toast('So close. The claw lets go at the last second.', ''); }
      } }] }]
    }) },
    { id: 'sofa', x: 500, y: 490, r: 56, prompt: () => 'Wait in the lobby', panel: () => spec('cinema', 'Lobby sofa', { stock: null, note: 'Trailers play on loop on the lobby screen.', sections: [{ h: 'Pass the time', items: [shopItem('Watch the trailers', 0, { mood: 2, mins: 15, off: once('trailers', 'You have seen every trailer twice today.'), after() { markToday('trailers'); } })] }] }) }
  ],
  folks: [folkAt('zoe', 500, 128), folkAt('ike', 150, 296)]
});

/* ---------- Bianca's Salon ---------- */
const HAIR_STYLES = [[0, 'Short and neat'], [1, 'Long and loose'], [2, 'Top knot'], [4, 'Curly crop']];
const HAIR_COLS = [['#1d1a18', 'Black'], ['#5a3825', 'Chestnut'], ['#8b3a1e', 'Auburn'], ['#d9b46a', 'Honey blonde'], ['#c9c9cf', 'Silver'], ['#2a9d8f', 'Teal'], ['#c05d8a', 'Rose']];
function haircut(price, change, label) {
  const before = Object.assign({}, S.look);
  spend(price); change();
  const after = Object.assign({}, S.look);
  applyLook();
  startSkip({ mins: 40, secs: 7, act: 'idle', kind: 'salon', title: label, sub: "Bianca's Salon", scene: 'salon', before, after,
    lines: ['Bianca studies you in the mirror.', 'Snip, snip, snip.', 'A spin of the chair...', 'Ta-da!'],
    onEnd() { giveFx('sharp', 3 * 1440); addMood(10); S.stats.cuts = (S.stats.cuts || 0) + 1; SFX.chime('pay'); toast('Looking sharp. +3% pay for 3 days, mood +10.', 'good'); } });
}
defInt('salon', {
  name: "Bianca's Salon", w: 900, h: 580, exit: { x: 450 }, wallCol: '#f3e1ea', trim: '#c05d8a',
  floors: [[34, TW, 832, 454, 'tile', '#f7f1f4', 'rgba(192,93,138,.1)']],
  deco(c) {
    wallMirror(c, 130, 70); wallMirror(c, 300, 70); wallMirror(c, 470, 70);
    sign(c, "BIANCA'S SALON", 720, 36, 170, '#c05d8a');
  },
  furn: [
    { t: 'counter', x: 110, y: 90, w: 110, h: 22, c: '#f6f1e7', top: '#ffffff' }, { t: 'counter', x: 280, y: 90, w: 110, h: 22, c: '#f6f1e7', top: '#ffffff' }, { t: 'counter', x: 450, y: 90, w: 110, h: 22, c: '#f6f1e7', top: '#ffffff' },
    { t: 'salonchair', x: 140, y: 130, w: 50, h: 54 }, { t: 'salonchair', x: 310, y: 130, w: 50, h: 54, c: '#c05d8a' }, { t: 'salonchair', x: 480, y: 130, w: 50, h: 54 },
    { t: 'sink', x: 650, y: 96, w: 70, h: 46, c: '#3a3340' }, { t: 'sink', x: 740, y: 96, w: 70, h: 46, c: '#3a3340' },
    { t: 'rug', x: 60, y: 380, w: 260, h: 110, c: '#e5c7e8' },
    { t: 'sofa', x: 80, y: 400, w: 150, h: 52, c: '#c05d8a' }, { t: 'table', x: 250, y: 410, w: 50, h: 36, c: '#f6f1e7' },
    { t: 'counter', x: 400, y: 380, w: 150, h: 40, c: '#c05d8a', top: '#ffffff', label: 'RECEPTION' },
    { t: 'salonchair', x: 660, y: 200, w: 46, h: 50, c: '#e5c7e8' }, { t: 'salonchair', x: 750, y: 200, w: 46, h: 50, c: '#e5c7e8' },
    { t: 'shelf', x: 640, y: 420, w: 160, h: 40, label: 'PRODUCTS', cols: ['#c05d8a', '#e5c7e8', '#ffffff', '#2a9d8f'] },
    { t: 'plant', x: 46, y: 140, w: 30, h: 32 }, { t: 'plant', x: 830, y: 520, w: 30, h: 32 }, { t: 'mat', x: 400, y: 520, w: 100, h: 20, c: '#c05d8a' }
  ],
  spots: [
    { id: 'chair', x: 335, y: 236, r: 76, prompt: () => "Sit in Bianca's chair", panel: () => spec('salon', 'The stylist\'s chair', {
      note: 'A fresh cut means +3% pay and a lift in mood for three days. You can change your look as often as you like.',
      stock: [fmt(S.money), fxOn('sharp') ? 'Looking sharp' : 'Due for a trim'],
      sections: [
        { h: 'Quick', items: [{ t: 'Trim and tidy', d: 'Same style, sharper edges.', tag: fmt(14) + ' · 40 min', off: canSpend(14) ? '' : 'You cannot afford that.', go() { haircut(14, () => {}, 'Trim and tidy'); } }] },
        { h: 'New style', items: HAIR_STYLES.filter(s => s[0] !== S.look.style).map(s => ({ t: s[1], d: 'A whole new cut.', tag: fmt(24) + ' · 40 min', off: canSpend(24) ? '' : 'You cannot afford that.', go() { haircut(24, () => { S.look.style = s[0]; }, s[1]); } })) },
        { h: 'New color', items: HAIR_COLS.filter(h => h[0] !== S.look.hair).map(h => ({ t: h[1], d: 'Color and a trim.', tag: fmt(30) + ' · 40 min', off: canSpend(30) ? '' : 'You cannot afford that.', go() { haircut(30, () => { S.look.hair = h[0]; }, h[1] + ' color'); } })) }
      ]
    }) },
    { id: 'wait', x: 155, y: 490, r: 56, prompt: () => 'Flip through a magazine', panel: () => spec('salon', 'Waiting sofa', { stock: null, note: 'Glossy magazines about people you have never heard of.', sections: [{ h: 'Relax', items: [shopItem('Read a magazine', 0, { mood: 2, mins: 15, off: once('mag', 'You have read every magazine twice.'), after() { markToday('mag'); } })] }] }) },
    { id: 'products', x: 720, y: 500, r: 56, prompt: () => 'Browse hair products', panel: () => spec('salon', 'Product shelf', { sections: [{ h: 'Treat yourself', items: [shopItem('Fancy shampoo', 9, { mood: 4, d: 'Smells like a vacation.' })] }] }) }
  ],
  folks: [folkAt('bianca', 380, 170), folkAt('gwen', 505, 168)]
});

/* ---------- Suds Laundromat ---------- */
const SHIRTS = [['#ff7a59', 'Coral tee'], ['#2a9d8f', 'Teal tee'], ['#3d5a80', 'Navy button-down'], ['#e9c46a', 'Mustard sweater'], ['#f6f1e7', 'Crisp white shirt'], ['#7b6fd0', 'Violet polo'], ['#c0392b', 'Red flannel'], ['#2b2f36', 'Black tee']];
const PANTS = [['#2c3e57', 'Dark jeans'], ['#5a4a3a', 'Brown chinos'], ['#3a3a3a', 'Charcoal slacks'], ['#8a95a0', 'Grey trousers'], ['#c9a06a', 'Khakis']];
defInt('laundry', {
  name: 'Suds Laundromat', w: 1000, h: 600, exit: { x: 500 }, wallCol: '#d9e9f0', trim: '#2a9d8f',
  floors: [[34, TW, 932, 474, 'tile', '#e9eef0', 'rgba(42,157,143,.08)']],
  deco(c) {
    sign(c, 'SUDS LAUNDROMAT', 500, 30, 180, '#2a9d8f');
    winTop(c, 840, 80);
    c.fillStyle = '#f6f1e7'; rr(c, 60, 16, 80, 50, 4); c.fill(); signText(c, 'WASH $5', 100, 32, 9, '#2a9d8f'); signText(c, 'FOLD $14', 100, 50, 9, '#c05d8a');
  },
  furn: [
    ...[0, 1, 2, 3, 4, 5].map(i => ({ t: 'washer', x: 170 + i * 72, y: 92, w: 64, h: 56, on: i % 3 !== 1 })),
    ...[0, 1, 2].map(i => ({ t: 'washer', dry: true, x: 620 + i * 66, y: 92, w: 60, h: 56, on: i !== 2 })),
    { t: 'table', x: 330, y: 300, w: 300, h: 50, c: '#e1e8ec', label: 'FOLDING', fs: 9 },
    { t: 'crate', x: 60, y: 300, w: 90, h: 40, c: '#2a9d8f', label: 'LOST & FOUND', fs: 6.5 },
    { t: 'bench', x: 80, y: 450, w: 140, h: 28 },
    ...[0, 1, 2, 3].map(i => ({ t: 'chair', x: 380 + i * 40, y: 450, w: 28, h: 26, c: '#e9c46a' })),
    { t: 'crate', x: 660, y: 300, w: 70, h: 36, c: '#8ecae6', label: 'CART', fs: 7, fill: ['#ffffff', '#e76f51', '#8ecae6'] },
    { t: 'machine', x: 870, y: 290, w: 60, h: 70, c: '#c0392b', label: 'SNACKS', fs: 8, screen: '#ffd166' },
    { t: 'rack', x: 690, y: 420, w: 160, h: 34 },
    { t: 'plant', x: 46, y: 130, w: 30, h: 32 }, { t: 'plant', x: 920, y: 520, w: 30, h: 32 }, { t: 'mat', x: 450, y: 540, w: 100, h: 20, c: '#2a9d8f' }
  ],
  spots: [
    { id: 'wash', x: 400, y: 214, r: 80, prompt: () => 'Do a load of laundry', panel: () => spec('laundry', 'Washers and dryers', {
      note: S.clean >= 5 ? 'You are out of clean clothes. Wrinkled shirts cost you 5% at work and slowly sour your mood.' : 'You have ' + (5 - S.clean) + ' day' + (5 - S.clean === 1 ? '' : 's') + ' of clean clothes left.',
      stock: [fmt(S.money), S.clean >= 5 ? 'Out of clean clothes' : 'Clean for ' + (5 - S.clean) + 'd'],
      sections: [{ h: 'Laundry', items: [
        { t: 'Wash and dry a load', d: 'An hour of spinning. Sit and watch, it is oddly calming. Mood +3.', tag: fmt(5) + ' · 1h', off: S.clean === 0 ? 'Everything you own is already clean.' : canSpend(5) ? '' : 'You cannot afford that.',
          go() { spend(5); startSkip({ mins: 60, secs: 8, act: 'idle', kind: 'laundry', title: 'Wash and dry', sub: 'Suds Laundromat', scene: 'laundry', lines: ['Quarters in. Soap in. Door shut.', 'Round and round it goes.', 'The dryer hums a little song.', 'Warm, clean, folded.'], onEnd() { S.clean = 0; addMood(3); toast('Fresh clothes for five days. Mood +3.', 'good'); } }); } },
        { t: 'Drop-off wash and fold', d: 'Mrs. Kim does it all while you get on with your day.', tag: fmt(14) + ' · 5 min', off: S.clean === 0 ? 'Everything you own is already clean.' : canSpend(14) ? '' : 'You cannot afford that.',
          go() { spend(14); applyIntake({ mins: 5 }); S.clean = 0; addMood(2); SFX.chime('pay'); toast('Mrs. Kim hands you a warm, folded stack. Clean for five days.', 'good'); } }
      ] }]
    }) },
    { id: 'rack', x: 770, y: 506, r: 60, prompt: () => 'Browse the thrift rack', panel: () => spec('laundry', 'Thrift rack', {
      note: 'Donated, washed and pressed by Mrs. Kim. Change your look for a few dollars.',
      sections: [
        { h: 'Shirts', items: SHIRTS.filter(s => s[0] !== S.look.shirt).map(s => ({ t: s[1], d: 'Wear it out of the store.', tag: fmt(12), off: canSpend(12) ? '' : 'You cannot afford that.', go() { spend(12); S.look.shirt = s[0]; applyLook(); addMood(3); SFX.chime('pay'); toast('New ' + s[1].toLowerCase() + '. Mood +3.', 'good'); } })) },
        { h: 'Pants', items: PANTS.filter(s => s[0] !== S.look.pants).map(s => ({ t: s[1], d: 'They even fit.', tag: fmt(15), off: canSpend(15) ? '' : 'You cannot afford that.', go() { spend(15); S.look.pants = s[0]; applyLook(); addMood(2); SFX.chime('pay'); toast('New ' + s[1].toLowerCase() + '. Mood +2.', 'good'); } })) }
      ]
    }) },
    { id: 'lost', x: 105, y: 394, r: 52, prompt: () => 'Check the lost and found', panel: () => spec('laundry', 'Lost and found', { stock: null, note: 'Mostly socks. Mrs. Kim says finders keepers on anything under five dollars.', sections: [{ h: 'Dig', items: [{ t: 'Rummage through the box', d: 'Who knows?', tag: '5 min', off: doneToday('lost') ? 'You already checked today.' : '', go() {
      markToday('lost'); applyIntake({ mins: 5 });
      const r = Math.random();
      if (r < 0.3 * luck()) { const m = 1 + Math.floor(Math.random() * 4); addM(m); SFX.chime('pay'); toast('You find ' + fmt(m) + ' in a coat pocket.', 'good'); }
      else if (r < 0.55) { addMood(3); toast('A single sock with a cartoon whale on it. It makes you smile. Mood +3.', 'good'); }
      else toast('Socks. Only socks.', '');
    } }] }] }) },
    { id: 'vend', x: 900, y: 404, r: 50, prompt: () => 'Use the vending machine', panel: () => spec('laundry', 'Vending machine', { sections: [{ h: 'Snacks', items: [shopItem('Chips', 2, { hunger: 10 }), buyDrink('Soda', 2, { thirst: 22, energy: 4, d: 'Thirst +22, energy +4.', msg: 'Thirst +22.' }), buyDrink('Bottled water', 1.5, { thirst: 35, d: 'Thirst +35.', msg: 'Thirst +35.' })] }] }) },
    { id: 'bench', x: 150, y: 520, r: 50, prompt: () => 'Sit on the bench', panel: () => { const r = readSection('home'); return spec('laundry', 'Bench', { stock: null, note: 'The washers hum. It is weirdly relaxing.', sections: [{ h: 'Sit', items: [shopItem('Watch the dryers spin', 0, { mood: 2, mins: 15, off: once('spin', 'You have watched enough spinning for one day.'), after() { markToday('spin'); } })] }].concat(r ? [r] : []) }); } }
  ],
  folks: [folkAt('kim', 480, 296), folkAt('nadia', 380, 296)]
});

/* ---------- Spoke & Sprocket Bikes ---------- */
const BIKE_COLS = [['#e76f51', 'Tomato red'], ['#2a9d8f', 'Teal'], ['#e9c46a', 'Sunflower'], ['#4361ee', 'Electric blue'], ['#2b2f36', 'Matte black']];
defInt('bikes', {
  name: 'Spoke & Sprocket Bikes', w: 960, h: 600, exit: { x: 480 }, wallCol: '#e1e6ea', trim: '#e76f51',
  floors: [[34, TW, 892, 474, 'plain', '#cdd1d5']],
  deco(c) {
    wheelWall(c, 60, 260);
    sign(c, 'SPOKE & SPROCKET', 480, 36, 190, '#e76f51');
    winTop(c, 640, 70); winTop(c, 760, 70);
  },
  furn: [
    { t: 'counter', x: 600, y: 112, w: 280, h: 40, c: '#5a6672', top: '#c9cdd2', label: 'REPAIRS' },
    { t: 'bikedisp', x: 90, y: 220, w: 420, h: 50, cols: BIKE_COLS.map(b => b[0]) },
    { t: 'bikedisp', x: 90, y: 340, w: 320, h: 50, cols: ['#c05d8a', '#8ac926', '#6f7bd4'] },
    { t: 'shelf', x: 560, y: 380, w: 150, h: 40, label: 'CAPS & GEAR', cols: ['#e76f51', '#2a9d8f', '#2b2f36', '#e9c46a'] },
    { t: 'bikedisp', x: 620, y: 230, w: 60, h: 50, cols: ['#2b2f36'] }, { t: 'crate', x: 760, y: 250, w: 120, h: 36, c: '#5a6672', label: 'TIRES', fs: 8, fill: ['#1d2129', '#2b2f36'] },
    { t: 'rug', x: 440, y: 450, w: 120, h: 80, c: '#e76f51' },
    { t: 'register', x: 760, y: 440, w: 140, h: 46 },
    { t: 'plant', x: 46, y: 520, w: 30, h: 32 }, { t: 'mat', x: 430, y: 540, w: 100, h: 20, c: '#e76f51' }
  ],
  spots: [
    { id: 'bikes', x: 300, y: 300, r: 80, prompt: () => 'Look at the bikes', panel: () => {
      const items = [];
      if (!S.own.bike) {
        BIKE_COLS.forEach(b => items.push({ t: b[1] + ' commuter bike', d: 'Ride around town 60% faster than walking. Yours to keep.', tag: fmt(160), off: canSpend(160) ? '' : 'You cannot afford that yet.', go() { spend(160); S.own.bike = true; S.own.bikeCol = b[0]; addMood(10); SFX.chime('pay'); toast('Your new ' + b[1].toLowerCase() + ' bike is waiting outside. Mood +10.', 'good'); } }));
      } else {
        BIKE_COLS.filter(b => b[0] !== S.own.bikeCol).forEach(b => items.push({ t: 'Repaint it ' + b[1].toLowerCase(), d: 'A fresh coat for your bike.', tag: fmt(20), off: canSpend(20) ? '' : 'You cannot afford that.', go() { spend(20); S.own.bikeCol = b[0]; addMood(2); SFX.chime('pay'); toast('Your bike is now ' + b[1].toLowerCase() + '.', 'good'); } }));
      }
      const sec = [{ h: S.own.bike ? 'Your bike' : 'Buy a bike', items }];
      if (!S.own.bike) sec.push({ h: 'Try before you buy', items: [{ t: 'Rent a bike for today', d: 'Until midnight. Bikes are 60% faster than walking.', tag: fmt(7), off: S.fx.rent === S.day ? 'You already have one today.' : canSpend(7) ? '' : 'You cannot afford that.', go() { spend(7); S.fx.rent = S.day; SFX.chime('pay'); toast('Your rental is parked outside until midnight.', 'good'); } }] });
      return spec('bikes', 'Bike floor', { note: S.own.bike ? 'Your bike rides with you everywhere in town.' : 'A bike gets you across town in half the time. Rent one for a day if you are not sure.', sections: sec });
    } },
    { id: 'gear', x: 635, y: 460, r: 56, prompt: () => 'Browse caps and gear', panel: () => spec('bikes', 'Caps and gear', {
      sections: [{ h: 'Gear', items: [
        { t: S.look.style === 3 ? 'Take off the cycling cap' : 'Cycling cap', d: S.look.style === 3 ? 'Back to your usual hair.' : 'Very cool. Very aerodynamic.', tag: S.own.cap ? 'owned' : fmt(14), off: !S.own.cap && !canSpend(14) ? 'You cannot afford that.' : '',
          go() { if (!S.own.cap) { spend(14); S.own.cap = true; S.own.hairStyle = S.look.style; } if (S.look.style === 3) S.look.style = S.own.hairStyle || 0; else { S.own.hairStyle = S.look.style; S.look.style = 3; } applyLook(); SFX.chime('pay'); toast(S.look.style === 3 ? 'Cap on.' : 'Cap off.', 'good'); } },
        shopItem('Water bottle refill', 0, { thirst: 25, mins: 2 })
      ] }]
    }) },
    { id: 'repair', x: 740, y: 210, r: 60, prompt: () => 'Talk shop at the repair bench', panel: () => spec('bikes', 'Repair bench', { stock: null, note: S.own.bike ? 'Rafa gives your bike a once-over for free. Squeak-free.' : 'Wheels, chains and a radio playing old songs.', sections: [{ h: 'Hang out', items: [shopItem('Watch Rafa true a wheel', 0, { mood: 2, mins: 15, off: once('rafa', 'Rafa is busy. Come back tomorrow.'), after() { markToday('rafa'); } })] }] }) }
  ],
  folks: [folkAt('rafa', 740, 108)]
});

/* ---------- Cafe Luna ---------- */
function micOn() { const w = weekdayOf(S.day); return (w === 5 || w === 6) && S.t >= 19 * 60 && S.t < 21 * 60; }
defInt('cafe', {
  name: 'Cafe Luna', w: 960, h: 600, exit: { x: 480 }, wallCol: '#e8dccb', trim: '#3d5a80',
  floors: [[34, TW, 892, 474, 'wood', '#a8774a']],
  deco(c) {
    winTop(c, 80, 90); winTop(c, 200, 90);
    sign(c, 'CAFE LUNA', 480, 30, 140, '#3d5a80');
    c.fillStyle = '#f3e6a1'; c.beginPath(); c.arc(414, 30, 7, 0.6, 5.7); c.arc(417, 28, 6, 5.4, 0.9, true); c.fill();
    chalkboard(c, 640, 120, 'MENU', ['Latte  $4.50', 'Iced tea  $3', 'Hot chocolate  $4', 'Panini  $10']);
    W.stringLights(c, 772, 936, 8, 6, 7);
  },
  furn: [
    { t: 'counter', x: 300, y: 128, w: 300, h: 46, c: '#3d5a80', top: '#efe3c8' },
    { t: 'gadget', kind: 'espresso', x: 330, y: 92, w: 60, h: 32 }, { t: 'pcase', x: 470, y: 92, w: 110, h: 32, c: '#3d5a80' },
    { t: 'round', x: 90, y: 300, w: 70, h: 52, c: '#c2a37a' }, { t: 'chair', x: 64, y: 358, w: 26, h: 24, c: '#3d5a80' }, { t: 'chair', x: 150, y: 358, w: 26, h: 24, c: '#3d5a80' },
    { t: 'round', x: 260, y: 400, w: 70, h: 52, c: '#c2a37a' }, { t: 'chair', x: 234, y: 458, w: 26, h: 24, c: '#3d5a80' }, { t: 'chair', x: 320, y: 458, w: 26, h: 24, c: '#3d5a80' },
    { t: 'round', x: 460, y: 300, w: 70, h: 52, c: '#c2a37a' }, { t: 'chair', x: 434, y: 358, w: 26, h: 24, c: '#3d5a80' }, { t: 'chair', x: 520, y: 358, w: 26, h: 24, c: '#3d5a80' },
    { t: 'rug', x: 50, y: 270, w: 520, h: 240, c: '#8a5a3c' },
    { t: 'stage', x: 690, y: 330, w: 220, h: 120, c: '#9a6a45' }, { t: 'mic', x: 790, y: 360, w: 20, h: 40 }, { t: 'machine', x: 870, y: 336, w: 30, h: 40, c: '#2b2f36', screen: '#3a414a' },
    { t: 'bookshelf', x: 46, y: 470, w: 120, h: 50 }, { t: 'lamp', x: 784, y: 470, w: 26, h: 50 },
    { t: 'armchair', x: 720, y: 470, w: 52, h: 46, c: '#8a4a38' }, { t: 'armchair', x: 830, y: 470, w: 52, h: 46, c: '#6b4a7a' },
    { t: 'plant', x: 46, y: 130, w: 30, h: 32 }, { t: 'plant', x: 900, y: 140, w: 30, h: 32 }, { t: 'mat', x: 430, y: 540, w: 100, h: 20, c: '#3d5a80' }
  ],
  spots: [
    { id: 'counter', x: 450, y: 226, r: 70, prompt: () => 'Order at the counter', panel: () => spec('cafe', 'The counter', {
      note: 'Everything is made by hand, slowly, with love.',
      sections: [
        { h: 'Drinks', items: [
          buyDrinkMood('Latte', 4.5, { thirst: 6, energy: 14, mood: 3 }),
          buyDrinkMood('Iced tea', 3, { thirst: 28, mood: 2 }),
          buyDrinkMood('Hot chocolate', 4, { thirst: 10, mood: 6 })
        ] },
        { h: 'Food', items: [placeMeal('l', 'Grilled panini', 10, { hunger: 50, mood: 2, mins: 30, d: 'Mozzarella, tomato, basil.' }), shopItem('Blueberry muffin', 3.5, { hunger: 16, mood: 2, mins: 5 })] }
      ]
    }) },
    { id: 'window', x: 125, y: 410, r: 60, prompt: () => 'Sit at a window table', panel: () => { const r = readSection('cafe'); return spec('cafe', 'Window table', { stock: null, note: r ? 'The best seat in the house for reading.' : 'The best seat in the house for reading. Buy a book at Dog-Ear Books.', sections: (r ? [r] : []).concat([{ h: 'People-watch', items: [shopItem('Watch the street go by', 0, { mood: 2, mins: 20, off: once('window', 'You have seen everybody in town walk past already.'), after() { markToday('window'); } })] }]) }); } },
    { id: 'stage', x: 800, y: 430, r: 66, prompt: () => micOn() ? 'Open mic night!' : 'Look at the little stage', panel: () => spec('cafe', 'Open mic stage', {
      stock: null, note: micOn() ? 'Open mic is on. Someone is tuning a guitar.' : 'Open mic happens Fridays and Saturdays from 7 to 9 PM.',
      sections: [{ h: 'Open mic', items: [
        { t: 'Listen to the open mic', d: 'Poems, songs and one very brave kazoo. Mood +14.', tag: '1h', off: !micOn() ? 'Fridays and Saturdays, 7 to 9 PM.' : doneToday('micl') ? 'You already caught the show tonight.' : '',
          go() { markToday('micl'); startSkip({ mins: 60, secs: 8, act: 'idle', kind: 'mic', title: 'Open mic night', sub: 'Cafe Luna', scene: 'music', singer: NPC_LOOK[5], lines: ['A shy poet goes first.', 'A duet. One of them is off-key.', 'The kazoo. Everyone loves the kazoo.', 'A standing ovation for nobody in particular.'], onEnd() { addMood(14); lifeEv('fun'); toast('What a night. Mood +14.', 'good'); } }); } },
        { t: 'Take the stage yourself', d: 'Sing something. Tips go in the jar. The better your mood, the better it goes.', tag: '30 min', off: !micOn() ? 'Fridays and Saturdays, 7 to 9 PM.' : doneToday('mics') ? 'One performance a night.' : '',
          go() {
            markToday('mics');
            const good = Math.random() < 0.35 + S.mood / 160, tips = Math.round((good ? 8 + Math.floor(Math.random() * 13) : 2) * (hasPerk('charm') ? 1.5 : 1));
            startSkip({ mins: 30, secs: 7, act: 'idle', kind: 'mic', title: 'Your song', sub: 'Cafe Luna open mic', scene: 'music', singer: Object.assign({}, PLAYER_LOOK, { skin: PLAYER_LOOK.skin }), lines: ['You step up to the mic.', good ? 'Your voice fills the room.' : 'You forget the second verse.', good ? 'People are singing along!' : 'Everyone claps anyway.'],
              onEnd() { addM(tips); addMood(good ? 12 : 3); lifeEv('fun'); gainXP(20); S.stats.gigs = (S.stats.gigs || 0) + 1; SFX.chime('pay'); toast(good ? 'A hit! ' + fmt(tips) + ' in the tip jar and mood +12.' : 'Wobbly, but brave. ' + fmt(tips) + ' in tips and mood +3.', good ? 'good' : ''); } });
          } }
      ] }]
    }) }
  ],
  folks: [folkAt('luna', 450, 124), folkAt('otis', 495, 296)]
});
function buyDrinkMood(name, cost, o) {
  return shopItem(name, cost, Object.assign({ mins: 10, snd: 'drink' }, o));
}

/* ---------- Sal's Pizza Place ---------- */
const pizzaFriday = () => weekdayOf(S.day) === 5;
defInt('pizza', {
  name: "Sal's Pizza Place", w: 900, h: 580, exit: { x: 450 }, wallCol: '#f1e3cf', trim: '#2f7d4f',
  floors: [[34, TW, 832, 454, 'tile', '#f4efe4', 'rgba(47,125,79,.12)']],
  deco(c) {
    sign(c, "SAL'S PIZZA", 470, 30, 140, '#2f7d4f');
    c.fillStyle = '#c0392b'; c.fillRect(400, 44, 140, 4); c.fillStyle = '#f6f1e7'; c.fillRect(400, 48, 140, 4); c.fillStyle = '#2f7d4f'; c.fillRect(400, 52, 140, 4);
    chalkboard(c, 640, 120, 'PIZZA', ['Slice  $3.50', 'Whole pie  $15', 'Garlic knots  $4', pizzaFriday && S && pizzaFriday() ? 'FRIDAY: pies $11' : 'Fri: pies $11']);
    winTop(c, 790, 60);
  },
  furn: [
    { t: 'oven', x: 110, y: 96, w: 130, h: 60 },
    { t: 'counter', x: 300, y: 130, w: 300, h: 46, c: '#2f7d4f', top: '#f6f1e7' },
    { t: 'pcase', kind: 'pizza', x: 320, y: 100, w: 200, h: 26, c: '#2f7d4f', items: ['#f4c26b', '#e9b04f', '#f4d58d'] },
    ...[[120, 300], [340, 360], [560, 300]].flatMap(p => [{ t: 'cloth', x: p[0], y: p[1], w: 90, h: 56, c: '#c0392b' }, { t: 'chair', x: p[0] + 6, y: p[1] + 62, w: 26, h: 24 }, { t: 'chair', x: p[0] + 58, y: p[1] + 62, w: 26, h: 24 }]),
    { t: 'cooler', x: 640, y: 92, w: 80, h: 50 },
    { t: 'booth', x: 730, y: 250, w: 120, h: 92, c: '#2f7d4f' }, { t: 'booth', x: 730, y: 380, w: 120, h: 92, c: '#2f7d4f' },
    { t: 'plant', x: 46, y: 520, w: 30, h: 32 }, { t: 'mat', x: 400, y: 520, w: 100, h: 20, c: '#2f7d4f' }
  ],
  spots: [
    { id: 'counter', x: 450, y: 226, r: 72, prompt: () => 'Order at the counter', panel: () => {
      const pie = pizzaFriday() ? 11 : 15, p = period(S.t);
      return spec('pizza', 'The counter', {
        note: 'Open until 1 AM, the only kitchen in town that is.' + (pizzaFriday() ? ' It is Pizza Friday: whole pies are $11.' : ''),
        stock: stockChips(),
        sections: [
          { h: 'By the slice', items: [shopItem('Cheese slice', 3.5, { hunger: 22, mood: 2, mins: 10 }), shopItem('Garlic knots', 4, { hunger: 14, mood: 2, mins: 10 })] },
          { h: 'Whole pies', items: [
            { t: 'Whole pie, eat in', d: 'Eat half now (hunger +45, mood +5) and take two slices home for dinner.', tag: fmt(pie) + ' · 40 min', off: eatBlock(1) || (canSpend(pie) ? '' : 'You cannot afford that.'),
              go() { spend(pie); applyIntake({ hunger: 45, thirst: 2, mins: 40, meal: !!p }); addMood(5); S.pantry.d += 2; SFX.chime('eat'); toast('So good. Hunger +45, and two slices for later.', 'good'); } },
            { t: 'Whole pie to go', d: 'Three dinners for your pantry. You have ' + S.pantry.d + '.', tag: fmt(pie), off: canSpend(pie) ? '' : 'You cannot afford that.', go() { spend(pie); S.pantry.d += 3; SFX.chime('pay'); toast('A pie in a box. Dinner +3 in your pantry.', 'good'); } }
          ] },
          { h: 'Drinks', items: [buyDrink('Fountain soda', 2, { thirst: 22, energy: 4, d: 'Thirst +22, energy +4.', msg: 'Thirst +22.' }), { t: 'Ice water', d: 'Free. Thirst +30.', tag: '5 min', off: drinkBlock(30), go() { applyIntake({ thirst: 30, mins: 5 }); SFX.chime('drink'); toast('Ice water. Thirst +30.', 'good'); } }] }
        ]
      });
    } },
    { id: 'oven', x: 175, y: 210, r: 56, prompt: () => 'Watch the pizza oven', panel: () => spec('pizza', 'The oven', { stock: null, note: 'Sal\'s grandfather built it from old bricks. It never fully cools down.', sections: [{ h: 'Watch', items: [shopItem('Watch Sal toss the dough', 0, { mood: 3, mins: 10, off: once('dough', 'Sal is busy with the dinner rush.'), after() { markToday('dough'); }, msg: 'Sal spins the dough twice, just for you. Mood +3.' })] }] }) },
    { id: 'booth', x: 700, y: 360, r: 56, prompt: () => 'Grab a booth', panel: () => spec('pizza', 'Booth', { stock: null, note: 'Red pepper flakes, parmesan and a little tabletop jukebox.', sections: [{ h: 'Sit', items: [shopItem('Put a song on the tabletop jukebox', 1, { mood: 4, mins: 5 })] }] }) }
  ],
  folks: [folkAt('sal', 450, 126)]
});

/* ---------- Bright Smile Dental ---------- */
defInt('dentist', {
  name: 'Bright Smile Dental', w: 960, h: 600, exit: { x: 300 }, wallCol: '#e6f3f5', trim: '#3aa6b9',
  floors: [[34, TW, 560, 474, 'carpet', '#cfe3e8'], [594, TW, 332, 474, 'lino', '#eef6f8']],
  walls: [[594, TW, 24, 230], [594, 400, 24, 158]],
  deco(c) {
    winTop(c, 56, 70); winTop(c, 140, 70);
    sign(c, 'BRIGHT SMILE DENTAL', 340, 36, 210, '#3aa6b9');
    placeIcon(c, 'tooth', 470, 36, 1.2, '#3aa6b9');
    sign(c, 'EXAM', 780, 44, 70, '#3aa6b9');
    W.frame(c, 862, 16, 46, 44, 'sea', '#3aa6b9', 4);
  },
  furn: [
    { t: 'counter', x: 90, y: 132, w: 260, h: 46, c: '#3aa6b9', top: '#f0fbfd', label: 'RECEPTION' },
    { t: 'bench', x: 80, y: 330, w: 130, h: 28, c: '#3aa6b9' }, { t: 'bench', x: 80, y: 450, w: 130, h: 28, c: '#3aa6b9' },
    { t: 'tank', x: 380, y: 300, w: 130, h: 56 },
    { t: 'table', x: 260, y: 440, w: 60, h: 36, c: '#f6f1e7' }, { t: 'rug', x: 60, y: 300, w: 180, h: 200, c: '#8ecae6' },
    { t: 'chair', x: 860, y: 240, w: 28, h: 26, c: '#3aa6b9' },
    { t: 'dentchair', x: 720, y: 140, w: 74, h: 150 }, { t: 'cabinet', x: 860, y: 100, w: 60, h: 60, c: '#cfd8dc' }, { t: 'sink', x: 640, y: 96, w: 60, h: 44, c: '#cfd8dc' },
    { t: 'plant', x: 540, y: 140, w: 30, h: 32 }, { t: 'plant', x: 880, y: 520, w: 30, h: 32 }, { t: 'mat', x: 250, y: 540, w: 100, h: 20, c: '#3aa6b9' }
  ],
  spots: [
    { id: 'desk', x: 220, y: 226, r: 70, prompt: () => 'Check in at reception', panel: () => dentistSpec() },
    { id: 'chair', x: 680, y: 330, r: 64, prompt: () => 'Sit in the dentist\'s chair', panel: () => dentistSpec() },
    { id: 'tank', x: 445, y: 400, r: 56, prompt: () => 'Watch the fish tank', panel: () => spec('dentist', 'Fish tank', { stock: null, note: 'Three fish, named Lincoln, Grant and Bubbles.', sections: [{ h: 'Watch', items: [shopItem('Watch the fish for a while', 0, { mood: 3, mins: 15, off: once('fish', 'The fish are napping.'), after() { markToday('fish'); }, msg: 'Bubbles does a little loop. Mood +3.' })] }] }) }
  ],
  folks: [folkAt('ruby', 220, 128), folkAt('patel', 820, 200)]
});
function dentistSpec() {
  const since = S.day - S.dental, items = [];
  if (S.fx.tooth) items.push({ t: 'Fix the toothache', d: 'A quick filling. The ache is gone for good, and a cleaning comes with it.', tag: fmt(65) + ' · 1h', off: canSpend(65) ? '' : 'You cannot afford that. Painkillers from the pharmacy can hold you over.', go() { dentalVisit(65, 60, true); } });
  items.push({ t: 'Checkup and cleaning', d: 'Keeps toothaches away for about ten days and your mood steadier for a week.', tag: fmt(40) + ' · 45 min', off: S.fx.tooth ? 'Fix the toothache first.' : since < 3 ? 'You were just here. Come back in a few days.' : canSpend(40) ? '' : 'You cannot afford that.', go() { dentalVisit(40, 45, false); } });
  return spec('dentist', 'Bright Smile Dental', {
    note: S.fx.tooth ? 'Dr. Patel takes one look: that tooth needs a filling.' : 'Last checkup: ' + (since <= 0 ? 'today' : since === 1 ? 'yesterday' : since + ' days ago') + '. Toothaches start to show up after about ten days.',
    stock: [fmt(S.money), S.fx.tooth ? 'Toothache' : 'Teeth OK'], sections: [{ h: 'Appointments', items }]
  });
}
function dentalVisit(cost, mins, fix) {
  spend(cost);
  startSkip({ mins, secs: 7, act: 'idle', kind: 'dental', title: fix ? 'A quick filling' : 'Checkup and cleaning', sub: 'Dr. Patel', scene: 'dentist',
    lines: fix ? ['Open wide.', 'A tiny pinch. That is all.', 'Buzz, buzz. Nearly there.', 'All done. Rinse.'] : ['Open wide.', 'Scrape, scrape, polish.', 'Dr. Patel hums an old song.', 'Sparkling. Rinse.'],
    onEnd() { S.dental = S.day; S.fx.tooth = 0; giveFx('smile', 7 * 1440); addMood(fix ? 12 : 5); S.stats.dental = (S.stats.dental || 0) + 1; SFX.chime('pay'); toast(fix ? 'The ache is gone. Mood +12. Bright smile for a week.' : 'Squeaky clean. Mood +5, and your mood holds steadier for a week.', 'good'); } });
}

/* ---------- upgrades that show up in your apartment ---------- */
(function upgradeApartment() {
  const d = INT.apartment;
  const own = k => () => S && S.own[k];
  d.furn.push(
    { t: 'gadget', x: 596, y: 100, w: 28, h: 50, dh: 26, when: own('coffee'), ghost: true },
    { t: 'plant', x: 900, y: 290, w: 30, h: 32, when: own('plants') }, { t: 'plant', x: 640, y: 524, w: 30, h: 32, when: own('plants') },
    { t: 'table', x: 540, y: 470, w: 90, h: 40, c: '#6b4a30', when: own('records') }, { t: 'gadget', kind: 'turntable', x: 550, y: 468, w: 50, h: 46, dh: 32, when: own('records'), ghost: true },
    { t: 'rug', x: 770, y: 400, w: 160, h: 120, c: '#c9a06a', when: own('chair') }, { t: 'armchair', x: 800, y: 420, w: 58, h: 54, c: '#3d5a80', when: own('chair') }, { t: 'lamp', x: 870, y: 410, w: 26, h: 54, when: own('chair') }
  );
  d.dyn = d.dyn || [];
  d.furn.forEach(f => { if (f.when && !f.ghost && !FURN_FLAT[f.t]) d.dyn.push(f); });
  const deco = d.deco;
  d.deco = function (c, dd) {
    deco(c, dd);
    if (S && S.own.curtains) [[560, 80], [760, 70]].forEach(p => {
      c.fillStyle = '#3d2a4a'; c.fillRect(p[0] - 12, 10, 16, 64); c.fillRect(p[0] + p[1] - 4, 10, 16, 64);
      c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(p[0] - 8, 10, 3, 64); c.fillRect(p[0] + p[1], 10, 3, 64);
      c.fillStyle = '#6b4a30'; c.fillRect(p[0] - 16, 8, p[1] + 32, 4);
    });
    if (S && S.stats.plush) { const cols = ['#ffd166', '#4cc9f0', '#8ac926', '#ff9f43']; for (let i = 0; i < Math.min(4, S.stats.plush); i++) { c.fillStyle = cols[i]; c.beginPath(); c.arc(880 + i * 14, 66, 6, 0, 7); c.fill(); c.beginPath(); c.arc(876 + i * 14, 60, 2.5, 0, 7); c.arc(884 + i * 14, 60, 2.5, 0, 7); c.fill(); } c.fillStyle = '#6b4a30'; c.fillRect(870, 72, 64, 4); }
  };
  d.spots.push(
    { id: 'coffee', x: 612, y: 180, r: 40, when: own('coffee'), prompt: () => 'Brew a cup of coffee', panel: () => ({ band: '#8a4a38', title: 'Your coffee maker', sub: 'Apt 12', note: 'A good machine. It gurgles happily.', sections: [{ h: 'Brew', items: [{ t: 'Make a cup', d: 'Free. Energy +12, thirst +4.', tag: '10 min', off: doneToday('coffee2') ? 'Two cups is plenty for one day.' : '', go() { if (doneToday('coffee1')) markToday('coffee2'); else markToday('coffee1'); applyIntake({ energy: 12, thirst: 4, mins: 10 }); addMood(1); SFX.chime('drink'); toast('Fresh coffee. Energy +12.', 'good'); } }] }] }) },
    { id: 'records', x: 585, y: 546, r: 44, when: own('records'), prompt: () => 'Put on a record', panel: () => ({ band: '#8a4a38', title: 'Record player', sub: 'Apt 12', note: 'A small stack of records from the thrift bin.', sections: [{ h: 'Listen', items: [{ t: 'Play a record', d: 'One side, front to back. Mood +8.', tag: '30 min', off: doneToday('rec2') ? 'You have played every record twice today.' : '', go() { if (doneToday('rec1')) markToday('rec2'); else markToday('rec1'); startSkip({ mins: 30, secs: 6, act: 'idle', kind: 'records', title: 'Side A', sub: 'Your record player', scene: 'music', records: true, label: ['#e76f51', '#2a9d8f', '#e9c46a'][S.day % 3], lines: ['The needle drops. A little crackle.', 'You close your eyes for the best part.', 'The last song fades out.'], onEnd() { addMood(8); lifeEv('fun'); toast('A whole side, start to finish. Mood +8.', 'good'); } }); } }] }] }) },
    { id: 'readchair', x: 830, y: 500, r: 46, when: own('chair'), prompt: () => 'Sit in your reading chair', panel: () => { const r = readSection('chair'); return { band: '#8a4a38', title: 'Reading chair', sub: 'Apt 12', note: r ? 'Your favorite spot. Reading here lifts your mood more.' : 'Your favorite spot. Buy a book at Dog-Ear Books to read here.', sections: r ? [r] : [] }; } }
  );
  d.spots.forEach((s, i) => { d.spots[i] = Object.assign({ r: 46 }, s); });
  // the couch can be for reading too
  const couch = d.spots.find(s => s.id === 'couch');
  const cp = couch.panel;
  couch.panel = () => { const sp = cp(); const r = readSection('home'); if (r) sp.sections.push(r); return sp; };
})();
function applyHome() {
  const d = INT.apartment; if (!d || !S) return;
  const bed = d.furn.find(f => f.t === 'bed'); if (bed) bed.c = S.own.mattress ? '#7a5cc4' : '#4a78b5';
  const rug = d.furn.find(f => f.t === 'rug' && f.x === 660); if (rug) rug.c = S.own.rug || '#8a4a38';
  if (typeof PF !== 'undefined') delete PF.g['int:apartment'];
}

/* ---------- a little more at Dot's ---------- */
(function upgradeDiner() {
  const sp = INT.diner.spots.find(s => s.id === 'counter'), p0 = sp.panel;
  sp.panel = () => { const s = p0(); s.sections.forEach(sec => { if (sec.h === 'Anytime') sec.items.splice(1, 0, shopItem("Slice of Dot's pie", 4, { hunger: 12, mood: 5, mins: 10, d: 'Baked at five this morning.' })); }); return s; };
})();
