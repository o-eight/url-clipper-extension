document.addEventListener('DOMContentLoaded', function() {
  const copyButton = document.getElementById('copy-button');
  const statusElement = document.getElementById('status');
  const formatSelect = document.getElementById('format-select');
  const previewContainer = document.getElementById('preview-container');
  const previewContent = document.getElementById('preview-content');
  
  // フォーマット選択変更時に選択値を保存
  formatSelect.addEventListener('change', function() {
    // フォーマットが変更されたら、現在のプレビューを更新
    updatePreview();
  });
  
  // ページ情報とハンドラーを保持するオブジェクト
  let currentPageData = {
    url: '',
    title: '',
    pageInfo: null,
    handler: null
  };
  
  // 初期ロード時にページ情報を取得
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    currentPageData.url = currentTab.url;
    currentPageData.title = currentTab.title;
    currentPageData.handler = getHandlerForUrl(currentPageData.url);
    
    // ハンドラを使用して情報を取得
    chrome.scripting.executeScript({
      target: {tabId: currentTab.id},
      function: currentPageData.handler.getInfoFunction
    }, function(results) {
      if (results && results[0] && results[0].result) {
        currentPageData.pageInfo = results[0].result;
      }
      
      // 初期プレビューを表示
      updatePreview();
    });
  });
  
  // プレビューを更新する関数
  function updatePreview() {
    if (!currentPageData.handler) return;
    
    try {
      // ハンドラーのフォーマット関数を使用してプレビューテキストを生成
      const previewText = currentPageData.handler.formatInfo(
        currentPageData.url,
        currentPageData.title,
        currentPageData.pageInfo,
        formatSelect.value
      );
      
      // プレビュー表示
      showPreview(previewText);
    } catch (e) {
      console.error('プレビュー生成エラー:', e);
      hidePreview();
    }
  }
  
  // プレビューを表示する関数
  function showPreview(text) {
    previewContent.textContent = text;
    previewContainer.style.display = 'block';
  }
  
  // プレビューを非表示にする関数
  function hidePreview() {
    previewContainer.style.display = 'none';
  }
  
  // 統合されたコピーボタン - サイトタイプを自動判別して適切な情報を取得
  copyButton.addEventListener('click', function() {
    if (!currentPageData.handler) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        currentPageData.url = currentTab.url;
        currentPageData.title = currentTab.title;
        currentPageData.handler = getHandlerForUrl(currentPageData.url);
        
        // ハンドラを使用して情報を取得
        chrome.scripting.executeScript({
          target: {tabId: currentTab.id},
          function: currentPageData.handler.getInfoFunction
        }, function(results) {
          if (results && results[0] && results[0].result) {
            currentPageData.pageInfo = results[0].result;
            
            // ハンドラのフォーマット関数を使用してクリップボードにコピー
            currentPageData.handler.formatAndCopy(
              currentPageData.url,
              currentPageData.title,
              currentPageData.pageInfo,
              formatSelect.value,
              showStatus,
              showPreview
            );
          } else {
            // 情報取得に失敗した場合はデフォルトハンドラを使用
            defaultHandler.formatAndCopy(
              currentPageData.url,
              currentPageData.title,
              null,
              formatSelect.value,
              showStatus,
              showPreview
            );
          }
        });
      });
    } else {
      // 既にページ情報を持っている場合は直接コピー
      currentPageData.handler.formatAndCopy(
        currentPageData.url,
        currentPageData.title,
        currentPageData.pageInfo,
        formatSelect.value,
        showStatus,
        showPreview
      );
    }
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