// デフォルトのOGPベースハンドラ
const defaultHandler = (function() {
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
  
  // OGP情報を含めてフォーマットする関数
  function formatWithOGPInfo(url, title, ogpInfo, format) {
    let clipText = '';
    // OGPタイトルとURLがある場合は優先して使用
    const finalTitle = ogpInfo?.title || title;
    const finalUrl = ogpInfo?.url || url;
    const description = ogpInfo?.description || '';
    const imageUrl = ogpInfo?.image || '';
    
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
    
    return clipText;
  }
  
  return {
    // ページから情報を取得する関数
    getInfoFunction: getOGPInfo,
    
    // 情報をフォーマットしてクリップボードにコピーする関数
    formatAndCopy: function(url, title, ogpInfo, format, statusCallback) {
      const clipText = formatWithOGPInfo(url, title, ogpInfo, format);
      
      navigator.clipboard.writeText(clipText).then(function() {
        statusCallback('情報をコピーしました！');
      }, function(err) {
        statusCallback('コピーできませんでした', 'red');
        console.error('クリップボードへのコピーに失敗: ', err);
      });
    }
  };
})();
