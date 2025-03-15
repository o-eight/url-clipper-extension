document.addEventListener('DOMContentLoaded', function() {
  const copyButton = document.getElementById('copy-button');
  const statusElement = document.getElementById('status');
  const formatSelect = document.getElementById('format-select');
  
  // 統合されたコピーボタン - サイトタイプを自動判別して適切な情報を取得
  copyButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const url = currentTab.url;
      const title = currentTab.title;
      
      // handlerRegistryからURLに一致するハンドラを取得
      const handler = getHandlerForUrl(url);
      
      // ハンドラを使用して情報を取得
      chrome.scripting.executeScript({
        target: {tabId: currentTab.id},
        function: handler.getInfoFunction
      }, function(results) {
        if (results && results[0] && results[0].result) {
          const pageInfo = results[0].result;
          
          // ハンドラのフォーマット関数を使用してクリップボードにコピー
          handler.formatAndCopy(url, title, pageInfo, formatSelect.value, showStatus);
        } else {
          // 情報取得に失敗した場合はデフォルトハンドラを使用
          defaultHandler.formatAndCopy(url, title, null, formatSelect.value, showStatus);
        }
      });
    });
  });
  
  // ステータスメッセージを表示
  function showStatus(message, color = '#4CAF50') {
    statusElement.textContent = message;
    statusElement.style.color = color;
    statusElement.style.display = 'block';
    
    setTimeout(function() {
      statusElement.style.display = 'none';
    }, 2000);
  }
});

// ハンドラーレジストリからURLに適したハンドラを取得
function getHandlerForUrl(url) {
  return handlerRegistry.getHandlerForUrl(url);
}