// ハンドラーレジストリ：URLパターンと対応するハンドラーを管理
const handlerRegistry = (function() {
  // ハンドラとURLパターンのマッピング
  const handlers = [];
  
  return {
    // 新しいハンドラーを登録
    register: function(urlPattern, handler) {
      handlers.push({
        pattern: urlPattern,
        handler: handler
      });
    },
    
    // URLに一致するハンドラーを取得
    getHandlerForUrl: function(url) {
      for (const entry of handlers) {
        if (url.match(entry.pattern)) {
          return entry.handler;
        }
      }
      // 一致するハンドラーがない場合はデフォルトハンドラを返す
      return defaultHandler;
    }
  };
})();

// ハンドラーの登録（各サイト固有のハンドラーからの登録を想定）
// 注意: このファイルはdefaultHandlerとyoutubeHandlerの後に読み込む必要がある
