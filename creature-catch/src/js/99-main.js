// Start: wait for the font, show the title, then play.
(function () {
  var ready = Promise.all([document.fonts && document.fonts.load ? document.fonts.load('10px Pixelify') : null, CC.loadArt()]);
  CC.start();
  Promise.race([ready, CC.sleep(4)]).then(async function () {
    // the title, then a save file; B in the file picker goes back to the title
    while (true) {
      var choice = await CC.titleScreen();
      var n = await CC.filePicker(choice === 'Continue' ? 'continue' : 'new');
      if (!n) continue;
      CC.slot = n;
      if (choice === 'Continue') { CC.continueGame(); break; }
      await CC.newGame();
      break;
    }
  });
  // a handle for the test scripts
  window.__cc = CC;
})();
