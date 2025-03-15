// YouTube専用ハンドラ
const youtubeHandler = (function() {
  // YouTubeページからサムネイル情報を取得する関数（ページ内で実行）
  function getYouTubeInfo() {
    try {
      // まずOGP情報を取得（デフォルトハンドラの関数を再利用）
      const ogpInfo = defaultHandler.getInfoFunction();
      
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
        thumbnailUrl: thumbnailUrl || ogpInfo?.image,
        title: ogpInfo?.title,
        description: ogpInfo?.description,
        url: ogpInfo?.url
      };
    } catch (e) {
      console.error('YouTubeデータ取得エラー:', e);
      return null;
    }
  }
  
  // YouTube情報をフォーマットする関数
  function formatYouTubeInfo(url, title, youtubeInfo, format) {
    // YouTubeInfo が null または undefined の場合はデフォルトハンドラにフォールバック
    if (!youtubeInfo) {
      return defaultHandler.formatInfo(url, title, null, format);
    }
    
    let clipText = '';
    const thumbnailUrl = youtubeInfo.thumbnailUrl || '';
    const videoId = youtubeInfo.videoId || '';
    const description = youtubeInfo.description || '';
    const finalTitle = youtubeInfo.title || title;
    const finalUrl = youtubeInfo.url || url;
    
    // タイムスタンプがある場合（t=XXXのパラメータ）、URLに含める
    let timestamp = '';
    if (url.includes('t=')) {
      timestamp = url.split('t=')[1].split('&')[0];
    }
    
    switch(format) {
      case 'markdown':
        clipText = `[${escapeMarkdown(finalTitle)}](${finalUrl})`;
        if (description) clipText += `\n\n${escapeMarkdown(description)}`;
        if (thumbnailUrl) clipText += `\n\n![サムネイル](${thumbnailUrl})`;
        // 動画IDと時間情報を追加
        if (videoId) {
          clipText += `\n\nVideo ID: ${videoId}`;
          if (timestamp) clipText += ` (${timestamp}秒から)`;
        }
        break;
      case 'html':
        clipText = `<a href="${finalUrl}">${escapeHtml(finalTitle)}</a>`;
        if (description) clipText += `<p>${escapeHtml(description)}</p>`;
        if (thumbnailUrl) clipText += `<br><img src="${thumbnailUrl}" alt="サムネイル">`;
        // 動画IDと時間情報を追加
        if (videoId) {
          if (timestamp) {
            clipText += `<p>動画ID: ${videoId} (${timestamp}秒から)</p>`;
          } else {
            clipText += `<p>動画ID: ${videoId}</p>`;
          }
        }
        break;
      default: // plain
        clipText = `${finalTitle}\n${finalUrl}`;
        if (description) clipText += `\n\n${description}`;
        if (thumbnailUrl) clipText += `\nサムネイル: ${thumbnailUrl}`;
        // 動画IDと時間情報を追加
        if (videoId) {
          clipText += `\n動画ID: ${videoId}`;
          if (timestamp) clipText += ` (${timestamp}秒から)`;
        }
    }
    
    return clipText;
  }
  
  // YouTubeのURLパターン
  const YOUTUBE_URL_PATTERN = /youtube\.com\/watch|youtu\.be\//i;
  
  // ハンドラオブジェクト
  const handler = {
    // ページから情報を取得する関数
    getInfoFunction: getYouTubeInfo,
    
    // フォーマットのみを行う関数（プレビュー表示用）
    formatInfo: function(url, title, youtubeInfo, format) {
      return formatYouTubeInfo(url, title, youtubeInfo, format);
    },
    
    // 情報をフォーマットしてクリップボードにコピーする関数
    formatAndCopy: function(url, title, youtubeInfo, format, statusCallback, previewCallback) {
      const clipText = formatYouTubeInfo(url, title, youtubeInfo, format);
      
      // プレビューコールバックがある場合は実行
      if (previewCallback) {
        previewCallback(clipText);
      }
      
      navigator.clipboard.writeText(clipText).then(function() {
        statusCallback('YouTube情報をコピーしました！');
      }, function(err) {
        statusCallback('コピーできませんでした', 'red');
        console.error('クリップボードへのコピーに失敗: ', err);
      });
    }
  };
  
  // ハンドラを登録（handlerRegistryが読み込まれていることを前提）
  if (typeof handlerRegistry !== 'undefined') {
    handlerRegistry.register(YOUTUBE_URL_PATTERN, handler);
  } else {
    console.error('Handler registry not loaded before YouTube handler');
  }
  
  return handler;
})();