/* Flappy Dragon native embed helper. Usage: mountFlappyDragon(document.querySelector('#flappy-game')) */
(function () {
  window.mountFlappyDragon = function mountFlappyDragon(target, options) {
    if (!target) throw new Error('Flappy Dragon needs a target element.');
    var frame = document.createElement('iframe');
    frame.src = (options && options.src) || './index.html';
    frame.title = 'Flappy Dragon Sky Arcade';
    frame.allow = 'autoplay';
    frame.style.width = '100%';
    frame.style.height = (options && options.height) || '640px';
    frame.style.minHeight = '560px';
    frame.style.border = '0';
    frame.style.display = 'block';
    frame.style.borderRadius = (options && options.radius) || '18px';
    target.replaceChildren(frame);
    return frame;
  };
})();
