document.addEventListener('DOMContentLoaded', function() {
  const copyButton = document.getElementById('copy-button');
  const copyYouTubeButton = document.getElementById('copy-youtube-button');
  const statusElement = document.getElementById('status');
  const formatSelect = document.getElementById('format-select');
  
  // 通常のURLとタイトルをコピーするボタン
  copyButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const url = currentTab.url;
      const title = currentTab.title;
      
      copyToClipboard(url, title, formatSelect.value);
    });
  });
  
  // YouTube専用のコピーボタン
  copyYouTubeButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const url = currentTab.url;
      const title = currentTab.title;
      
      if (isYouTubeUrl(url)) {
        chrome.scripting.executeScript({
          target: {tabId: currentTab.id},
          function: getYouTubeInfo
        }, function(results) {
          if (results && results[0] && results[0].result) {
            const youtubeInfo = results[0].result;
            copyYouTubeInfoToClipboard(url, title, youtubeInfo, formatSelect.value);
          } else {
            // YouTubeページでの情報取得に失敗した場合は通常コピー
            copyToClipboard(url, title, formatSelect.value);
          }
        });
      } else {
        showStatus('YouTubeページではありません', 'red');
      }
    });
  });
  
  // クリップボードにコピーする関数
  function copyToClipboard(url, title, format) {
    let clipText = '';
    
    switch(format) {
      case 'markdown':
        clipText = `[${title}](${url})`;
        break;
      case 'html':
        clipText = `<a href="${url}">${title}</a>`;
        break;
      default: // plain
        clipText = `${title}\n${url}`;
    }
    
    navigator.clipboard.writeText(clipText).then(function() {
      showStatus('コピーしました！');
    }, function(err) {
      showStatus('コピーできませんでした', 'red');
      console.error('クリップボードへのコピーに失敗: ', err);
    });
  }
  
  // YouTube情報をクリップボードにコピーする関数
  function copyYouTubeInfoToClipboard(url, title, youtubeInfo, format) {
    let clipText = '';
    const thumbnailUrl = youtubeInfo.thumbnailUrl;
    
    switch(format) {
      case 'markdown':
        clipText = `[${title}](${url})\n![サムネイル](${thumbnailUrl})`;
        break;
      case 'html':
        clipText = `<a href="${url}">${title}</a><br><img src="${thumbnailUrl}" alt="サムネイル">`;
        break;
      default: // plain
        clipText = `${title}\n${url}\nサムネイル: ${thumbnailUrl}`;
    }
    
    navigator.clipboard.writeText(clipText).then(function() {
      showStatus('YouTube情報をコピーしました！');
    }, function(err) {
      showStatus('コピーできませんでした', 'red');
      console.error('クリップボードへのコピーに失敗: ', err);
    });
  }
  
  // ステータスメッセージを表示
  function showStatus(message, color = '#4CAF50') {
    statusElement.textContent = message;
    statusElement.style.color = color;
    statusElement.style.display = 'block';
    
    setTimeout(function() {
      statusElement.style.display = 'none';
    }, 2000);
  }
  
  // YouTube URLかどうかをチェック
  function isYouTubeUrl(url) {
    return url.includes('youtube.com/watch') || url.includes('youtu.be/');
  }
});

// YouTubeページからサムネイル情報を取得する関数（ページ内で実行）
function getYouTubeInfo() {
  try {
    // ビデオIDを取得
    let videoId = '';
    const url = window.location.href;
    
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(window.location.search);
      videoId = urlParams.get('v');
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    
    // サムネイルURLを生成（高画質のものを選択）
    let thumbnailUrl = '';
    if (videoId) {
      thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    
    return {
      videoId: videoId,
      thumbnailUrl: thumbnailUrl
    };
  } catch (e) {
    console.error('YouTubeデータ取得エラー:', e);
    return null;
  }
}
