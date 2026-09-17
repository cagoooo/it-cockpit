/*
 * 簡報縮圖列加速：縮圖列原本會一次下載所有全尺寸簡報圖（每頁 1~4MB），
 * 這支程式讓「縮圖」自動改載 assets/thumbs/ 裡的 320px 小圖，
 * 主畫面、全螢幕等有 id 的大圖維持原圖不變。
 * 必須在頁面建立縮圖列之前載入（放在 <head>，不要 defer）。
 */
(function () {
  var SLIDE_RE = /(^|[\/"'(])((?:\.\/)?(?:\.\.\/)?assets\/)(slide_\d+)\.(webp|jpg|jpeg|png)(?=$|[?#"')\s])/;
  var SLIDE_RE_G = new RegExp(SLIDE_RE.source, 'g');
  var THUMB_HINT = /strip|thumb/i;

  function toThumb(url) {
    return url.replace(SLIDE_RE, function (_, lead, dir, name) {
      return lead + dir + 'thumbs/' + name + '.webp';
    });
  }

  function hinted(el) {
    for (var node = el, depth = 0; node && node.nodeType === 1 && depth < 6; node = node.parentNode, depth++) {
      if (THUMB_HINT.test((node.id || '') + ' ' + (typeof node.className === 'string' ? node.className : ''))) return true;
    }
    return false;
  }

  // 有 id 的是主畫面／全螢幕大圖；沒有 id、且在縮圖列裡（或尚未放進頁面）的才換小圖
  function isThumbImage(img) {
    if (img.id || img.hasAttribute('data-slide-nothumb')) return false;
    if (THUMB_HINT.test(typeof img.className === 'string' ? img.className : '')) return true;
    if (!img.isConnected) return true;
    return hinted(img);
  }

  function rememberOriginal(img, original) {
    if (!img.getAttribute('data-slide-full')) img.setAttribute('data-slide-full', original);
  }

  var srcDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  if (srcDesc && srcDesc.set) {
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      configurable: true,
      enumerable: srcDesc.enumerable,
      get: srcDesc.get,
      set: function (value) {
        var v = String(value);
        if (SLIDE_RE.test(v) && v.indexOf('/thumbs/') < 0 && isThumbImage(this)) {
          rememberOriginal(this, v);
          v = toThumb(v);
        }
        srcDesc.set.call(this, v);
      }
    });
  }

  var setAttr = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    if (this.tagName === 'IMG' && String(name).toLowerCase() === 'src') {
      var v = String(value);
      if (SLIDE_RE.test(v) && v.indexOf('/thumbs/') < 0 && isThumbImage(this)) {
        rememberOriginal(this, v);
        value = toThumb(v);
      }
    }
    return setAttr.call(this, name, value);
  };

  // innerHTML 產生的縮圖：只改沒有 id 的 <img>
  function rewriteHtml(html) {
    return String(html).replace(/<img\b[^>]*>/gi, function (tag) {
      if (/\sid\s*=/i.test(tag) || tag.indexOf('/thumbs/') >= 0 || !SLIDE_RE.test(tag)) return tag;
      return tag.replace(/(\ssrc\s*=\s*["']?)([^"'\s>]+)/i, function (_, pre, url) {
        if (!SLIDE_RE.test(url)) return pre + url;
        return pre + toThumb(url) + '" data-slide-full="' + url.replace(/"/g, '&quot;');
      });
    });
  }
  var htmlDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  if (htmlDesc && htmlDesc.set) {
    Object.defineProperty(Element.prototype, 'innerHTML', {
      configurable: true,
      enumerable: htmlDesc.enumerable,
      get: htmlDesc.get,
      set: function (value) {
        var v = String(value);
        if (v.indexOf('<img') >= 0 && SLIDE_RE_G.test(v)) v = rewriteHtml(v);
        SLIDE_RE_G.lastIndex = 0;
        htmlDesc.set.call(this, v);
      }
    });
  }

  // 小圖讀不到時退回原圖
  window.addEventListener('error', function (event) {
    var img = event.target;
    if (!img || img.tagName !== 'IMG') return;
    var full = img.getAttribute('data-slide-full');
    if (full && (img.getAttribute('src') || '').indexOf('/thumbs/') >= 0) {
      img.removeAttribute('data-slide-full');
      img.setAttribute('data-slide-nothumb', '1');
      srcDesc.set.call(img, full);
    }
  }, true);
}());
