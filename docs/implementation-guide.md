# URL Clipper - リファクタリング実装ガイド

## 概要

このリファクタリングの目的は、URL Clipperの保守性と拡張性を向上させることです。具体的には、サイト固有のロジックを分離し、プラグイン形式のアーキテクチャを採用します。

## 主な変更点

1. **モジュール分割**
   - 共通処理と特定サイト向け処理を分離
   - 関連する機能ごとにファイルを分割

2. **プラグイン形式のアーキテクチャ**
   - サイトハンドラーのレジストリを導入
   - 各サイト専用のハンドラーを独立したファイルとして実装

3. **拡張性の向上**
   - 新しいサイト対応を追加する場合は、新しいハンドラーファイルを作成して登録するだけで可能に

## ディレクトリ構造

```
├── manifest.json (変更なし)
├── popup.html (スクリプトの読み込み順序のみ変更)
├── popup.js (シンプル化)
├── utils.js (新規: 共通ユーティリティ関数)
└── site-handlers/
    ├── default-handler.js (新規: OGP情報を取得する共通処理)
    ├── youtube-handler.js (新規: YouTube専用の処理)
    └── handler-registry.js (新規: サイトハンドラーを管理)
```

## 実装の手順

1. 必要なディレクトリ構造を作成
```bash
mkdir -p site-handlers
```

2. 各ファイルの作成
   - `utils.js`
   - `site-handlers/default-handler.js`
   - `site-handlers/handler-registry.js`
   - `site-handlers/youtube-handler.js`

3. `popup.html` を更新して新しいスクリプトファイルを正しい順序で読み込む

4. `popup.js` を更新して新しいアーキテクチャで動作するように変更

## 新しいサイトハンドラーの追加方法

新しいサイト（例: Twitter）に対応するハンドラーを追加する場合：

1. `site-handlers/twitter-handler.js` などのファイルを作成

2. 以下の構造でハンドラーを実装：
```javascript
// Twitter専用ハンドラ
const twitterHandler = (function() {
  // Twitterページから情報を取得する関数
  function getTwitterInfo() {
    // Twitterページ固有の情報取得ロジック
    // ...
    return twitterInfo;
  }
  
  // Twitter情報をフォーマットする関数
  function formatTwitterInfo(url, title, twitterInfo, format) {
    // Twitterページ固有のフォーマットロジック
    // ...
    return clipText;
  }
  
  // Twitterの判定パターン
  const TWITTER_URL_PATTERN = /twitter\.com|x\.com/i;
  
  // ハンドラオブジェクト
  const handler = {
    getInfoFunction: getTwitterInfo,
    formatAndCopy: function(url, title, twitterInfo, format, statusCallback) {
      // ...
    }
  };
  
  // レジストリに登録
  if (typeof handlerRegistry !== 'undefined') {
    handlerRegistry.register(TWITTER_URL_PATTERN, handler);
  }
  
  return handler;
})();
```

3. `popup.html` に新しいハンドラーファイルを追加
```html
<script src="site-handlers/twitter-handler.js"></script>
```

## テスト方法

1. 通常のWebサイト（OGP情報あり）で動作確認
2. YouTubeページで動作確認
3. 新しく追加したサイト専用ハンドラーで動作確認
