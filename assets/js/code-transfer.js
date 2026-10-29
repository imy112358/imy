(function () {
  'use strict';

  var input = document.getElementById('code-input');
  var lineNumbers = document.getElementById('line-numbers');
  var lineCount = document.getElementById('line-count');
  var charCount = document.getElementById('char-count');
  var byteCount = document.getElementById('byte-count');
  var feedback = document.getElementById('code-feedback');
  var copyButton = document.getElementById('copy-code');
  var pasteButton = document.getElementById('paste-code');
  var clearButton = document.getElementById('clear-code');
  var downloadButton = document.getElementById('download-code');
  var shareButton = document.getElementById('share-code');
  var feedbackTimer;

  function getLineTotal(value) {
    return value.length ? value.split('\n').length : 1;
  }

  function renderStats() {
    var value = input.value;
    var lines = getLineTotal(value);
    lineCount.textContent = lines;
    charCount.textContent = Array.from(value).length;
    byteCount.textContent = new TextEncoder().encode(value).length;
    lineNumbers.textContent = Array.from({ length: lines }, function (_, index) {
      return index + 1;
    }).join('\n');
  }

  function setFeedback(message, tone) {
    clearTimeout(feedbackTimer);
    feedback.textContent = message;
    feedback.dataset.tone = tone || 'neutral';
    if (tone === 'success') {
      feedbackTimer = setTimeout(function () {
        feedback.textContent = input.value ? '内容保持原样' : '等待粘贴';
        feedback.dataset.tone = 'neutral';
      }, 1800);
    }
  }

  async function writeClipboard(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }
    var area = document.createElement('textarea');
    area.value = value;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    if (!document.execCommand('copy')) {
      area.remove();
      throw new Error('复制失败');
    }
    area.remove();
  }

  async function copyCode() {
    var value = input.value;
    if (!value) {
      setFeedback('请先粘贴代码', 'error');
      input.focus();
      return;
    }
    try {
      await writeClipboard(value);
      copyButton.textContent = '已复制';
      setFeedback('已按原内容复制', 'success');
      setTimeout(function () { copyButton.textContent = '复制代码'; }, 1800);
    } catch (_) {
      setFeedback('浏览器未允许复制，请手动选择代码', 'error');
    }
  }

  async function pasteCode() {
    if (!navigator.clipboard || !window.isSecureContext) {
      setFeedback('请直接在编辑区按 Command + V 粘贴', 'error');
      input.focus();
      return;
    }
    try {
      input.value = await navigator.clipboard.readText();
      renderStats();
      setFeedback('已原样读取剪贴板文本', 'success');
      input.focus();
    } catch (_) {
      setFeedback('未获得剪贴板权限，请手动粘贴', 'error');
      input.focus();
    }
  }

  function clearCode() {
    if (!input.value) return;
    input.value = '';
    renderStats();
    setFeedback('内容已清空', 'neutral');
    input.focus();
  }

  function downloadCode() {
    var value = input.value;
    if (!value) {
      setFeedback('请先粘贴代码', 'error');
      input.focus();
      return;
    }
    var blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'code-snippet.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setFeedback('已下载原始文本', 'success');
  }

  function bytesToBase64Url(bytes) {
    var binary = '';
    var chunkSize = 32768;
    for (var index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function base64UrlToBytes(value) {
    var normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    normalized += '='.repeat((4 - normalized.length % 4) % 4);
    var binary = atob(normalized);
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  async function compressCode(value) {
    var bytes = new TextEncoder().encode(value);
    if (!('CompressionStream' in window)) {
      return 'plain.' + bytesToBase64Url(bytes);
    }
    var stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
    var compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return 'gzip.' + bytesToBase64Url(compressed);
  }

  async function restoreCode(payload) {
    var separator = payload.indexOf('.');
    if (separator < 0) throw new Error('链接格式不正确');
    var mode = payload.slice(0, separator);
    var bytes = base64UrlToBytes(payload.slice(separator + 1));
    if (mode === 'gzip') {
      if (!('DecompressionStream' in window)) throw new Error('当前浏览器不支持解压分享链接');
      var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    } else if (mode !== 'plain') {
      throw new Error('未知的链接格式');
    }
    return new TextDecoder().decode(bytes);
  }

  async function shareCode() {
    var value = input.value;
    if (!value) {
      setFeedback('请先粘贴代码', 'error');
      input.focus();
      return;
    }
    shareButton.disabled = true;
    shareButton.textContent = '正在生成';
    try {
      var payload = await compressCode(value);
      var shareUrl = window.location.href.split('#')[0] + '#code=' + payload;
      await writeClipboard(shareUrl);
      shareButton.textContent = '链接已复制';
      setFeedback('在另一台设备打开链接即可还原代码', 'success');
      setTimeout(function () { shareButton.textContent = '复制跨设备链接'; }, 1800);
    } catch (_) {
      shareButton.textContent = '复制跨设备链接';
      setFeedback('跨设备链接生成失败，请稍后重试', 'error');
    } finally {
      shareButton.disabled = false;
    }
  }

  async function loadSharedCode() {
    if (!window.location.hash.startsWith('#code=')) return;
    try {
      input.value = await restoreCode(window.location.hash.slice(6));
      renderStats();
      setFeedback('已从跨设备链接还原代码', 'success');
    } catch (_) {
      setFeedback('跨设备链接无效或已损坏', 'error');
    }
  }

  input.addEventListener('input', renderStats);
  input.addEventListener('scroll', function () {
    lineNumbers.scrollTop = input.scrollTop;
  });
  input.addEventListener('keydown', function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      copyCode();
    }
  });
  copyButton.addEventListener('click', copyCode);
  pasteButton.addEventListener('click', pasteCode);
  clearButton.addEventListener('click', clearCode);
  downloadButton.addEventListener('click', downloadCode);
  shareButton.addEventListener('click', shareCode);

  renderStats();
  loadSharedCode();
})();
