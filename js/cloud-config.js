/* ============================================================================
 * 雲端設定（預設值）
 * ----------------------------------------------------------------------------
 * 呢個檔案會直接畀瀏覽器下載，所以只可以放 Supabase 嘅
 *   · Project URL（https://xxxxx.supabase.co）
 *   · anon / public key（設計上就係公開嘅，配合 RLS 先安全）
 * 千祈唔好放 service_role key！
 *
 * 三種做法，揀一種就得：
 *   1. 直接改下面兩個值 → 成個網站所有裝置都用同一個後端（推薦）
 *   2. 完全唔改 → 喺遊戲／題庫頁面嘅「☁ 雲端連線」入面貼 URL 同 key，
 *      會儲喺該裝置嘅 localStorage（方便先用住／測試）
 *   3. 留空 + 開「本機模擬模式」→ 冇 Supabase 都可以試玩題庫同排行榜
 * ==========================================================================*/
window.CIPHER_CLOUD_CONFIG = Object.assign(
  {
    // 例：'https://abcdefghijklmnop.supabase.co'
    url: '',
    // 例：'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....'
    anonKey: '',
    // auto = 有 url + key 就用 Supabase；mock = 強行用本機模擬；off = 關閉雲端
    mode: 'auto',
    // 排行榜每次最多揞幾多行
    boardLimit: 20,
  },
  window.CIPHER_CLOUD_CONFIG || {}
);
