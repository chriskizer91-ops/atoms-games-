// Start: wait for the font, show the title, then play.
(function () {
  var ready = Promise.all([document.fonts && document.fonts.load ? document.fonts.load('10px Pixelify') : null, CC.loadArt()]);
  CC.start();
  Promise.race([ready, CC.sleep(4)]).then(async function () {
    var choice = await CC.titleScreen();
    if (choice === 'Continue') CC.continueGame();
    else await CC.newGame();
  });
  // a handle for the test scripts
  window.__cc = CC;
})();
