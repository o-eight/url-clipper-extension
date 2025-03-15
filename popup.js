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
      
      // YouTubeページかどうかをチェック
      if (isYouTubeUrl(url)) {
        // YouTubeページの場合はYouTube専用の情報を取得
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
        // YouTube以外のページではOGP情報を取得
        chrome.scripting.executeScript({
          target: {tabId: currentTab.id},
          function: getOGPInfo
        }, function(results) {
          if (results && results[0] && results[0].result) {
            const ogpInfo = results[0].result;
            copyWithOGPInfo(url, title, ogpInfo, formatSelect.value);
          } else {
            // OGP情報がない場合は通常コピー
            copyToClipboard(url, title, formatSelect.value);
          }
        });
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
  
  // OGP情報を含めてクリップボードにコピーする関数
  function copyWithOGPInfo(url, title, ogpInfo, format) {
    let clipText = '';
    // OGPタイトルとURLがある場合は優先して使用
    const finalTitle = ogpInfo.title || title;
    const finalUrl = ogpInfo.url || url;
    const description = ogpInfo.description || '';
    const imageUrl = ogpInfo.image || '';
    
    switch(format) {
      case 'markdown':
        clipText = `[${finalTitle}](${finalUrl})`;
        if (description) clipText += `\n\n${description}`;
        if (imageUrl) clipText += `\n\n![サムネイル](${imageUrl})`;
        break;
      case 'html':
        clipText = `<a href="${finalUrl}">${finalTitle}</a>`;
        if (description) clipText += `<p>${description}</p>`;
        if (imageUrl) clipText += `<br><img src="${imageUrl}" alt="サムネイル">`;
        break;
      default: // plain
        clipText = `${finalTitle}\n${finalUrl}`;
        if (description) clipText += `\n\n${description}`;
        if (imageUrl) clipText += `\nサムネイル: ${imageUrl}`;
    }
    
    navigator.clipboard.writeText(clipText).then(function() {
      showStatus('情報をコピーしました！');
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
      showStatus('情報をコピーしました！');
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

// OGP情報を取得する関数（ページ内で実行）
function getOGPInfo() {
  try {
    // OGPメタタグからデータを収集
    const ogpData = {
      title: document.querySelector('meta[property="og:title"]')?.content,
      description: document.querySelector('meta[property="og:description"]')?.content,
      image: document.querySelector('meta[property="og:image"]')?.content,
      url: document.querySelector('meta[property="og:url"]')?.content,
      type: document.querySelector('meta[property="og:type"]')?.content
    };
    
    // TwitterカードがOGPの代わりに使われる場合にも対応
    if (!ogpData.title) ogpData.title = document.querySelector('meta[name="twitter:title"]')?.content;
    if (!ogpData.description) ogpData.description = document.querySelector('meta[name="twitter:description"]')?.content;
    if (!ogpData.image) ogpData.image = document.querySelector('meta[name="twitter:image"]')?.content;
    
    // OGP情報が少なくとも1つあるかチェック
    const hasOgpInfo = Object.values(ogpData).some(value => value);
    
    return hasOgpInfo ? ogpData : null;
  } catch (e) {
    console.error('OGPデータ取得エラー:', e);
    return null;
  }
}

// YouTubeページからサムネイル情報を取得する関数（ページ内で実行）
function getYouTubeInfo() {
  try {
    // まずOGP情報を取得
    const ogpInfo = getOGPInfo();
    
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
    
    // OGP情報とYouTube情報を結合
    return {
      videoId: videoId,
      thumbnailUrl: thumbnailUrl,
      title: ogpInfo?.title,
      description: ogpInfo?.description,
      url: ogpInfo?.url
    };
  } catch (e) {
    console.error('YouTubeデータ取得エラー:', e);
    return null;
  }
}