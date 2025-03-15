# URL Clipper - サイト固有ハンドラーの追加ガイド

## 概要

URL Clipperは、プラグイン形式のアーキテクチャを採用しており、新しいサイト向けの特別な処理を簡単に追加できます。このドキュメントでは、新しいサイト向けのハンドラーを作成・登録する方法について説明します。

## ハンドラーの基本構造

各サイト向けハンドラーは以下の基本構造に従います：

1. **情報取得関数** - ページから必要な情報を抽出する関数
2. **フォーマット関数** - 取得した情報を適切な形式でフォーマットする関数
3. **URLパターン** - そのハンドラーを適用すべきURLを判定するための正規表現
4. **ハンドラーオブジェクト** - 上記の機能をまとめたオブジェクト
5. **レジストリ登録** - ハンドラーをレジストリに登録する処理

## 新しいハンドラーの作成手順

### 1. ハンドラーファイルの作成

`site-handlers/` ディレクトリに新しいJavaScriptファイルを作成します。
ファイル名は、対象サイトの名前に `-handler.js` を付けたものにします（例: `twitter-handler.js`）。

### 2. テンプレートコードの記述

以下のテンプレートを使用して、新しいハンドラーを作成します：

```javascript
// サイト名専用ハンドラ
const siteNameHandler = (function() {
  // ページから情報を取得する関数（ページコンテキスト内で実行される）
  function getSiteInfo() {
    try {
      // 1. 基本のOGP情報を取得（共通処理として活用可能）
      const ogpInfo = defaultHandler.getInfoFunction();
      
      // 2. サイト固有の情報を取得
      // ... サイト固有のDOM要素から情報を抽出 ...
      
      // 3. OGP情報とサイト固有情報を結合して返す
      return {
        // OGP情報を継承
        title: ogpInfo?.title,
        description: ogpInfo?.description,
        image: ogpInfo?.image,
        url: ogpInfo?.url,
        
        // サイト固有の情報を追加
        customField1: "サイト固有の値1",
        customField2: "サイト固有の値2"
      };
    } catch (e) {
      console.error('サイト情報取得エラー:', e);
      return null;
    }
  }
  
  // 情報をフォーマットする関数
  function formatSiteInfo(url, title, siteInfo, format) {
    // siteInfo が null の場合はデフォルトハンドラにフォールバック
    if (!siteInfo) {
      return defaultHandler.formatInfo(url, title, null, format);
    }
    
    let clipText = '';
    const finalTitle = siteInfo.title || title;
    const finalUrl = siteInfo.url || url;
    const description = siteInfo.description || '';
    const imageUrl = siteInfo.image || '';
    
    // サイト固有のカスタムフィールドを利用
    const customField1 = siteInfo.customField1 || '';
    const customField2 = siteInfo.customField2 || '';
    
    // 選択されたフォーマットに基づいて出力を生成
    switch(format) {
      case 'markdown':
        clipText = `[${escapeMarkdown(finalTitle)}](${finalUrl})`;
        
        // 基本情報
        if (description) clipText += `\n\n${escapeMarkdown(description)}`;
        
        // サイト固有情報
        if (customField1) clipText += `\n\nカスタム情報1: ${escapeMarkdown(customField1)}`;
        if (customField2) clipText += `\n\nカスタム情報2: ${escapeMarkdown(customField2)}`;
        
        // 画像情報
        if (imageUrl) clipText += `\n\n![サムネイル](${imageUrl})`;
        break;
        
      case 'html':
        clipText = `<a href="${finalUrl}">${escapeHtml(finalTitle)}</a>`;
        
        // 基本情報
        if (description) clipText += `<p>${escapeHtml(description)}</p>`;
        
        // サイト固有情報
        if (customField1) clipText += `<p>カスタム情報1: ${escapeHtml(customField1)}</p>`;
        if (customField2) clipText += `<p>カスタム情報2: ${escapeHtml(customField2)}</p>`;
        
        // 画像情報
        if (imageUrl) clipText += `<br><img src="${imageUrl}" alt="サムネイル">`;
        break;
        
      default: // plain
        clipText = `${finalTitle}\n${finalUrl}`;
        
        // 基本情報
        if (description) clipText += `\n\n${description}`;
        
        // サイト固有情報
        if (customField1) clipText += `\nカスタム情報1: ${customField1}`;
        if (customField2) clipText += `\nカスタム情報2: ${customField2}`;
        
        // 画像情報
        if (imageUrl) clipText += `\nサムネイル: ${imageUrl}`;
    }
    
    return clipText;
  }
  
  // サイトのURLパターン（正規表現）
  const SITE_URL_PATTERN = /example\.com|example\.org/i;
  
  // ハンドラオブジェクト
  const handler = {
    // ページから情報を取得する関数
    getInfoFunction: getSiteInfo,
    
    // フォーマットのみを行う関数（プレビュー表示用）
    formatInfo: function(url, title, siteInfo, format) {
      return formatSiteInfo(url, title, siteInfo, format);
    },
    
    // 情報をフォーマットしてクリップボードにコピーする関数
    formatAndCopy: function(url, title, siteInfo, format, statusCallback, previewCallback) {
      const clipText = formatSiteInfo(url, title, siteInfo, format);
      
      // プレビューコールバックがある場合は実行
      if (previewCallback) {
        previewCallback(clipText);
      }
      
      navigator.clipboard.writeText(clipText).then(function() {
        statusCallback('サイト情報をコピーしました！');
      }, function(err) {
        statusCallback('コピーできませんでした', 'red');
        console.error('クリップボードへのコピーに失敗: ', err);
      });
    }
  };
  
  // ハンドラをレジストリに登録
  if (typeof handlerRegistry !== 'undefined') {
    handlerRegistry.register(SITE_URL_PATTERN, handler);
  } else {
    console.error('Handler registry not loaded before site handler');
  }
  
  return handler;
})();
```

### 3. ハンドラーの実装

テンプレートを基に、実際のサイト向けに実装を行います：

#### a. URLパターンの設定

対象サイトのURLパターンを正規表現で定義します：

```javascript
const SITE_URL_PATTERN = /twitter\.com|x\.com/i; // Twitterの例
```

#### b. 情報取得関数の実装

サイト固有のDOM要素やAPIから情報を取得する処理を実装します：

```javascript
function getSiteInfo() {
  try {
    // 基本のOGP情報を取得
    const ogpInfo = defaultHandler.getInfoFunction();
    
    // サイト固有の情報を取得する例
    const authorElement = document.querySelector('.author-name');
    const dateElement = document.querySelector('.post-date');
    const likeCountElement = document.querySelector('.like-count');
    
    // 取得した情報をオブジェクトにまとめる
    return {
      // OGP基本情報
      title: ogpInfo?.title,
      description: ogpInfo?.description,
      image: ogpInfo?.image,
      url: ogpInfo?.url,
      
      // サイト固有情報
      author: authorElement ? authorElement.textContent.trim() : '',
      date: dateElement ? dateElement.textContent.trim() : '',
      likeCount: likeCountElement ? likeCountElement.textContent.trim() : ''
    };
  } catch (e) {
    console.error('サイト情報取得エラー:', e);
    return null;
  }
}
```

#### c. フォーマット関数の実装

取得した情報を適切な形式でフォーマットする処理を実装します：

```javascript
function formatSiteInfo(url, title, siteInfo, format) {
  // siteInfo が null の場合はデフォルトハンドラにフォールバック
  if (!siteInfo) {
    return defaultHandler.formatInfo(url, title, null, format);
  }
  
  let clipText = '';
  const finalTitle = siteInfo.title || title;
  const finalUrl = siteInfo.url || url;
  const description = siteInfo.description || '';
  const imageUrl = siteInfo.image || '';
  
  // サイト固有情報
  const author = siteInfo.author || '';
  const date = siteInfo.date || '';
  const likeCount = siteInfo.likeCount || '';
  
  switch(format) {
    case 'markdown':
      clipText = `[${escapeMarkdown(finalTitle)}](${finalUrl})`;
      
      // サイト固有情報を追加
      if (author) clipText += `\n\n作成者: ${escapeMarkdown(author)}`;
      if (date) clipText += `\n投稿日: ${escapeMarkdown(date)}`;
      if (likeCount) clipText += `\nいいね数: ${escapeMarkdown(likeCount)}`;
      
      // 基本情報
      if (description) clipText += `\n\n${escapeMarkdown(description)}`;
      if (imageUrl) clipText += `\n\n![サムネイル](${imageUrl})`;
      break;
      
    // 他のフォーマットも同様に実装...
  }
  
  return clipText;
}
```

### 4. popup.htmlへの追加

`popup.html` ファイルに新しいハンドラーファイルを読み込むスクリプトタグを追加します：

```html
<!-- 既存のスクリプトタグの後に追加 -->
<script src="utils.js"></script>
<script src="site-handlers/default-handler.js"></script>
<script src="site-handlers/handler-registry.js"></script>
<script src="site-handlers/youtube-handler.js"></script>
<script src="site-handlers/twitter-handler.js"></script> <!-- 新しいハンドラー -->
<script src="popup.js"></script>
```

**重要**: スクリプトの読み込み順序に注意してください。新しいハンドラーは、`default-handler.js` と `handler-registry.js` の後、`popup.js` の前に配置する必要があります。

## 実装例: Twitter（X）ハンドラー

以下は、Twitter向けハンドラーの実装例です：

```javascript
// Twitter専用ハンドラ
const twitterHandler = (function() {
  // Twitterページから情報を取得する関数
  function getTwitterInfo() {
    try {
      // 基本のOGP情報を取得
      const ogpInfo = defaultHandler.getInfoFunction();
      
      // Twitter固有の情報を取得
      const tweetText = document.querySelector('article[data-testid="tweet"] div[data-testid="tweetText"]')?.textContent;
      const tweetAuthor = document.querySelector('div[data-testid="User-Name"] a')?.textContent;
      const tweetDate = document.querySelector('time')?.dateTime;
      
      // 日付をフォーマット
      let formattedDate = '';
      if (tweetDate) {
        const date = new Date(tweetDate);
        formattedDate = date.toLocaleString();
      }
      
      return {
        // OGP基本情報
        title: ogpInfo?.title || document.title,
        description: ogpInfo?.description,
        image: ogpInfo?.image,
        url: ogpInfo?.url || window.location.href,
        
        // Twitter固有情報
        tweetText: tweetText || '',
        author: tweetAuthor || '',
        date: formattedDate
      };
    } catch (e) {
      console.error('Twitter情報取得エラー:', e);
      return null;
    }
  }
  
  // Twitter情報をフォーマットする関数
  function formatTwitterInfo(url, title, twitterInfo, format) {
    // twitterInfo が null の場合はデフォルトハンドラにフォールバック
    if (!twitterInfo) {
      return defaultHandler.formatInfo(url, title, null, format);
    }
    
    let clipText = '';
    const finalTitle = twitterInfo.title || title;
    const finalUrl = twitterInfo.url || url;
    const tweetText = twitterInfo.tweetText || '';
    const author = twitterInfo.author || '';
    const date = twitterInfo.date || '';
    
    switch(format) {
      case 'markdown':
        clipText = `[${escapeMarkdown(finalTitle)}](${finalUrl})`;
        
        if (author) clipText += `\n\n作成者: ${escapeMarkdown(author)}`;
        if (date) clipText += `\n投稿日時: ${escapeMarkdown(date)}`;
        if (tweetText) clipText += `\n\n> ${escapeMarkdown(tweetText)}`;
        break;
        
      case 'html':
        clipText = `<a href="${finalUrl}">${escapeHtml(finalTitle)}</a>`;
        
        if (author) clipText += `<p>作成者: ${escapeHtml(author)}</p>`;
        if (date) clipText += `<p>投稿日時: ${escapeHtml(date)}</p>`;
        if (tweetText) clipText += `<blockquote>${escapeHtml(tweetText)}</blockquote>`;
        break;
        
      default: // plain
        clipText = `${finalTitle}\n${finalUrl}`;
        
        if (author) clipText += `\n\n作成者: ${author}`;
        if (date) clipText += `\n投稿日時: ${date}`;
        if (tweetText) clipText += `\n\n「${tweetText}」`;
    }
    
    return clipText;
  }
  
  // TwitterのURLパターン
  const TWITTER_URL_PATTERN = /twitter\.com|x\.com/i;
  
  // ハンドラオブジェクト
  const handler = {
    getInfoFunction: getTwitterInfo,
    
    formatInfo: function(url, title, twitterInfo, format) {
      return formatTwitterInfo(url, title, twitterInfo, format);
    },
    
    formatAndCopy: function(url, title, twitterInfo, format, statusCallback, previewCallback) {
      const clipText = formatTwitterInfo(url, title, twitterInfo, format);
      
      if (previewCallback) {
        previewCallback(clipText);
      }
      
      navigator.clipboard.writeText(clipText).then(function() {
        statusCallback('Tweet情報をコピーしました！');
      }, function(err) {
        statusCallback('コピーできませんでした', 'red');
        console.error('クリップボードへのコピーに失敗: ', err);
      });
    }
  };
  
  // レジストリに登録
  if (typeof handlerRegistry !== 'undefined') {
    handlerRegistry.register(TWITTER_URL_PATTERN, handler);
  } else {
    console.error('Handler registry not loaded before Twitter handler');
  }
  
  return handler;
})();
```

## 高度なハンドラー実装のヒント

### 1. 非同期処理の活用

外部APIやリソースを利用する場合は、async/await構文を使用できます：

```javascript
async function getSiteInfo() {
  try {
    // 基本のOGP情報を取得
    const ogpInfo = defaultHandler.getInfoFunction();
    
    // 外部APIから追加情報を取得
    const apiUrl = `https://api.example.com/info?url=${encodeURIComponent(window.location.href)}`;
    const response = await fetch(apiUrl);
    const apiData = await response.json();
    
    return {
      // 情報を結合
      ...ogpInfo,
      ...apiData
    };
  } catch (e) {
    console.error('情報取得エラー:', e);
    return null;
  }
}
```

### 2. 複雑なDOM操作

複雑なDOMから情報を抽出する例：

```javascript
function extractDataFromComplex() {
  // データを格納する配列
  const items = [];
  
  // 要素の繰り返し処理
  document.querySelectorAll('.item-container').forEach(item => {
    const title = item.querySelector('.item-title')?.textContent.trim() || '';
    const price = item.querySelector('.item-price')?.textContent.trim() || '';
    const rating = item.querySelector('.item-rating')?.getAttribute('data-rating') || '';
    
    items.push({ title, price, rating });
  });
  
  return items;
}
```

### 3. 条件付きフォーマット

URLパラメータなど、条件によって出力を変更する例：

```javascript
function formatWithConditions(url, title, siteInfo, format) {
  let clipText = '';
  
  // URLパラメータを解析
  const urlObj = new URL(url);
  const params = urlObj.searchParams;
  const hasSpecialParam = params.has('special');
  
  // 条件によって出力を変更
  if (hasSpecialParam) {
    // 特別なパラメータがある場合の処理
    clipText = `特別な情報: ${params.get('special')}\n${url}`;
  } else {
    // 通常の処理
    clipText = `${title}\n${url}`;
  }
  
  return clipText;
}
```

## ハンドラーのテスト方法

新しいハンドラーを実装したら、以下の手順でテストします：

1. Chrome拡張機能を開発者モードで読み込み直す
2. 対象サイトを開く
3. 拡張機能のポップアップを表示し、「URLと情報をコピー」ボタンをクリック
4. クリップボードにコピーされた内容を確認

問題がある場合は、Chromeのデベロッパーツールを使用してデバッグします：

1. 拡張機能のポップアップで右クリック→「検証」を選択
2. コンソールタブでエラーメッセージを確認
3. 必要に応じて `console.log()` を追加してデバッグ
