/* Keep older browsers and cached deployments usable when a WebP asset is unavailable. */
(function () {
  var fallbackExtensions = ['.jpg', '.jpeg', '.png'];

  function candidatesFor(image) {
    var explicit = image.getAttribute('data-fallback-src');
    if (explicit) return [explicit];

    var current = image.getAttribute('src') || '';
    var match = current.match(/^(.*)\.webp([?#].*)?$/i);
    if (!match) return [];
    return fallbackExtensions.map(function (extension) {
      return match[1] + extension + (match[2] || '');
    });
  }

  function useNextCandidate(image) {
    var candidates = candidatesFor(image);
    if (!candidates.length) return;

    var index = Number(image.getAttribute('data-webp-fallback-index') || 0);
    if (index >= candidates.length) return;

    image.setAttribute('data-webp-fallback-index', String(index + 1));
    image.src = candidates[index];
  }

  window.addEventListener('error', function (event) {
    var image = event.target;
    if (!image || image.tagName !== 'IMG') return;
    useNextCandidate(image);
  }, true);

  function scanFailedImages() {
    Array.prototype.forEach.call(document.images, function (image) {
      if (image.complete && image.naturalWidth === 0) useNextCandidate(image);
    });
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', scanFailedImages);
  } else {
    scanFailedImages();
  }
  window.addEventListener('load', scanFailedImages);
}());
