// YouTube専用ハンドラ
const youtubeHandler = (function() {
  // YouTubeページから情報とサムネイルを取得する関数（ページ内で実行）
  async function getYouTubeInfo() {
    try {
      // URL取得
      const url = window.location.href;
      let videoId = '';
      
      // ビデオIDを取得
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(window.location.search);
        videoId = urlParams.get('v');
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      }
      
      // OGP情報をまず取得（バックアップとして）
      const ogpInfo = {
        title: document.querySelector('meta[property="og:title"]')?.content,
        description: document.querySelector('meta[property="og:description"]')?.content,
        image: document.querySelector('meta[property="og:image"]')?.content,
        url: document.querySelector('meta[property="og:url"]')?.content,
      };
      
      // oEmbed APIからデータを取得
      let oEmbedData = null;
      if (videoId) {
        try {
          // oEmbed APIのエンドポイント
          const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
          const response = await fetch(oEmbedUrl);
          
          if (response.ok) {
            oEmbedData = await response.json();
          }
        } catch (fetchError) {
          console.error('oEmbed APIの呼び出しに失敗:', fetchError);
          // フェッチに失敗した場合は続行（OGPデータを使用）
        }
      }
      
      // oEmbedデータとOGP情報を結合
      return {
        videoId: videoId,
        thumbnailUrl: oEmbedData?.thumbnail_url || ogpInfo?.image,
        title: oEmbedData?.title || ogpInfo?.title,
        description: ogpInfo?.description, // oEmbedには説明がないためOGPから取得
        url: ogpInfo?.url,
        authorName: oEmbedData?.author_name,
        authorUrl: oEmbedData?.author_url,
        embedHtml: oEmbedData?.html
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
    const authorName = youtubeInfo.authorName || '';
    const authorUrl = youtubeInfo.authorUrl || '';
    
    // タイムスタンプがある場合（t=XXXのパラメータ）、URLに含める
    let timestamp = '';
    let seconds = '';
    if (url.includes('t=')) {
      timestamp = url.split('t=')[1].split('&')[0];
      // 時間形式に変換 (秒 -> mm:ss または hh:mm:ss)
      if (timestamp.match(/^\d+$/)) {
        seconds = parseInt(timestamp);
        if (seconds < 60) {
          timestamp = `0:${seconds.toString().padStart(2, '0')}`;
        } else if (seconds < 3600) {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          timestamp = `${mins}:${secs.toString().padStart(2, '0')}`;
        } else {
          const hours = Math.floor(seconds / 3600);
          const mins = Math.floor((seconds % 3600) / 60);
          const secs = seconds % 60;
          timestamp = `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
      }
    }
    
    switch(format) {
      case 'markdown':
        clipText = `[${escapeMarkdown(finalTitle)}](${finalUrl})`;
        if (authorName) clipText += `\nチャンネル: [${escapeMarkdown(authorName)}](${authorUrl})`;
        if (description) clipText += `\n\n${escapeMarkdown(description)}`;
        if (thumbnailUrl) clipText += `\n\n![サムネイル](${thumbnailUrl})`;
        // 動画IDと時間情報を追加
        if (videoId) {
          clipText += `\n\nVideo ID: ${videoId}`;
          if (seconds) clipText += ` (${timestamp} から)`;
        }
        break;
      case 'html':
        clipText = `<a href="${finalUrl}">${escapeHtml(finalTitle)}</a>`;
        if (authorName) clipText += `<br>チャンネル: <a href="${authorUrl}">${escapeHtml(authorName)}</a>`;
        if (description) clipText += `<p>${escapeHtml(description)}</p>`;
        // 埋め込みHTMLコードがある場合はそれを優先
        if (youtubeInfo.embedHtml) {
          clipText += `<br>${youtubeInfo.embedHtml}`;
        } else if (thumbnailUrl) {
          clipText += `<br><img src="${thumbnailUrl}" alt="サムネイル">`;
        }
        // 動画IDと時間情報を追加
        if (videoId && seconds) {
          clipText += `<p>タイムスタンプ: ${timestamp}</p>`;
        }
        break;
      default: // plain
        clipText = `${finalTitle}\n${finalUrl}`;
        if (authorName) clipText += `\nチャンネル: ${authorName} (${authorUrl})`;
        if (description) clipText += `\n\n${description}`;
        if (thumbnailUrl) clipText += `\nサムネイル: ${thumbnailUrl}`;
        // 動画IDと時間情報を追加
        if (videoId) {
          clipText += `\n動画ID: ${videoId}`;
          if (seconds) clipText += ` (${timestamp} から)`;
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