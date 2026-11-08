/* =====================================================================
 * Scout System UI i18n
 * ---------------------------------------------------------------------
 * Traditional Chinese (zh-Hant) is the source language / default.
 * English (en) is applied at runtime by translating text nodes and a
 * small set of attributes, so dynamically generated UI (test-paper
 * cards, print sheets, projection overlays, status messages) is covered
 * without rewriting every renderer.
 *
 * Usage:
 *   window.SKW_I18N.t('列印試卷')          -> 'Print Exam'
 *   window.SKW_I18N.setLang('en')
 *   window.SKW_I18N.getLang()             -> 'zh-Hant' | 'en'
 *   window.SKW_I18N.applyTranslations(el)  // force a sub-tree refresh
 *   window.SKW_I18N.locale()              -> date locale for toLocaleDateString
 *
 * Add `data-i18n-skip` to any element holding user-authored content
 * (set names, answers, message drafts) so it is never rewritten.
 * ===================================================================== */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'skw_ui_lang';
  var LANGS = ['zh-Hant', 'en'];
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'content', 'value'];
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1 };
  var CJK = /[\u3400-\u9fff]/;

  /* ------------------------------------------------------------------
   * Exact translations. Keys are the original zh-Hant strings exactly
   * as they appear in the DOM (trimmed). Long phrases are also used as
   * a fallback for mixed strings such as "5 題 · 題組版本 2".
   * ------------------------------------------------------------------ */
  var EN = {
    /* Titles / metadata */
    '密碼旗號助手｜Scout System': 'Cipher & Semaphore Toolkit | Scout System',
    'Scout System 密碼旗號助手：密碼轉換、考核試卷、互動搶答及遊戲化訓練。': 'Scout System cipher toolkit: encode messages, build exam papers, run buzz quizzes and play training games.',
    '密碼防衛戰｜Scout System 訓練模式': 'Cipher Defense | Scout System Training',
    'Scout System 密碼防衛戰：用摩斯、旗號、朱高、點字、座標及電話密碼進行遊戲化訓練。': 'Scout System Cipher Defense: game-based training for Morse, semaphore, pigpen, braille, grid and phone ciphers.',
    '電子試卷｜Scout System': 'Digital Papers | Scout System',

    /* Main app — navigation and shell */
    '跳到主要內容': 'Skip to main content',
    '密碼旗號助手': 'Cipher & Semaphore Toolkit',
    '編碼工具': 'Cipher Tools',
    '試卷生成': 'Exam Paper',
    '互動搶答': 'Buzz Quiz',
    '電子試卷': 'Digital Papers',
    '訓練遊戲': 'Training Game',
    '常用功能': 'Quick Access',
    '轉換工具': 'Conversion Tools',
    '摩斯密碼': 'Morse Code',
    '旗號 (Semaphore)': 'Semaphore',
    '朱高密碼 (Pigpen)': 'Pigpen',
    '點字 (Braille)': 'Braille',
    '座標密碼 (Grid)': 'Grid Cipher',
    '電話密碼 (Phone)': 'Phone Cipher',
    '電話密碼 (Phone T9)': 'Phone T9 Cipher',
    '凱撒位移': 'Caesar Shift',
    '反射密碼': 'Atbash',
    '倒序密碼': 'Reverse',
    'NATO 音標': 'NATO Alphabet',
    '列印答案': 'Print Answers',
    '列印試卷': 'Print Exam',
    '主要導覽': 'Main navigation',
    '功能模式': 'Modes',
    '關閉導覽選單': 'Close navigation menu',
    '開啟密碼導覽': 'Open cipher navigation',
    '關閉密碼導覽': 'Close cipher navigation',
    '手機模式導覽': 'Mobile mode navigation',
    '編碼': 'Ciphers',
    '試卷': 'Exam',
    '搶答': 'Buzz',
    '電子卷': 'e-Paper',
    '訓練': 'Training',

    /* Main app — composer and results */
    '把訊息轉成密碼': 'Turn a message into ciphers',
    '輸入文字後，下方 10 種編碼會即時更新。': 'Type a message and all 10 ciphers below update instantly.',
    '要轉換的中英文訊息': 'Message to encode',
    '最多輸入 200 個字元，訊息草稿會保存在此瀏覽器。': 'Up to 200 characters; the draft is saved in this browser.',
    '例如：BE PREPARED': 'e.g. BE PREPARED',
    '快速試玩': 'Try a sample',
    '快速試玩範例訊息': 'Sample messages',
    '清除': 'Clear',
    '＋ 加入試卷題目': '+ Add to exam',
    '轉換結果': 'Cipher Results',
    '每種密碼都會依照同一則訊息同步顯示；按右上角按鈕即可複製文字結果。': 'Every cipher shows the same message; use the button in the top-right of each card to copy the text result.',
    '▶ 播放音訊': '▶ Play audio',
    '座標密碼關鍵字': 'Grid cipher keyword',
    '凱撒位移格數': 'Caesar shift amount',
    '複製': 'Copy',
    '複製這項密碼結果': 'Copy this cipher result',
    '已複製': 'Copied',
    '已複製密碼': 'Cipher copied',
    '無法自動複製': 'Could not copy automatically',
    '請先輸入訊息': 'Enter a message first',
    '已加入試卷': 'Added to the exam paper',
    '請先加入題目': 'Add some questions to the exam paper first',
    '試卷目前沒有題目': 'The exam paper has no questions',
    '已清空試卷題目': 'Exam paper cleared',
    '題目已刪除': 'Question deleted',
    '確定要清空試卷上的所有題目嗎？': 'Delete every question in this exam paper?',

    /* Main app — exam paper toolbar */
    '考核題目管理': 'Exam Questions',
    '旗號列印樣式：': 'Semaphore print style:',
    '貝登堡公仔': 'Baden-Powell figures',
    '環保火柴人 (Stick Figures)': 'Stick figures',
    '火柴人': 'Stick figures',
    '輪播速度：': 'Carousel speed:',
    '投影難度': 'Projection difficulty',
    '投影難度：': 'Projection difficulty:',
    '簡單版（顯示密碼提示）': 'Easy (show the plain text hint)',
    '困難版（不顯示密碼提示）': 'Hard (hide the plain text hint)',
    '揭示答案：': 'Reveal answers:',
    '不揭示（領袖口頭）': 'Do not reveal (leader announces)',
    '不揭示': 'Do not reveal',
    '每題揭示': 'Reveal per question',
    '總揭示（最後一題後）': 'Reveal all at the end',
    '總揭示': 'Reveal all',
    '🎲 隨機生成 5 題試卷': '🎲 Generate 5 random questions',
    '🗑️ 清空題目': '🗑️ Clear questions',
    '📽️ 進入投影模式': '📽️ Start projection',
    '試卷還未有題目': 'No questions yet',
    '點擊下方按鈕隨機生成 5 題範例試卷，或返回「編碼工具」輸入自訂訊息加入試卷。': 'Generate 5 sample questions below, or go back to Cipher Tools to add your own message.',
    '🎲 一鍵生成範例試卷 (5題)': '🎲 Generate a 5-question sample exam',
    '返回編碼工具出題': 'Back to Cipher Tools',
    '已生成 5 題考核試卷': 'Generated a 5-question exam paper',
    '密碼': 'Cipher',
    '整條顯示': 'Show whole message',
    '逐字輪播': 'Letter by letter',
    '聲音播放': 'Audio playback',
    '翻譯': 'Decode',
    '倒轉': 'Reverse',
    '刪除': 'Delete',
    '出密碼符號，要成員翻譯': 'Show the cipher symbols; members decode them',
    '出英文，要成員寫出密碼符號': 'Show the plain English; members write the cipher symbols',
    '附解碼紙／投影表（同類同步）': 'Attach decoder sheet / projection table (applies to all of this cipher)',
    '旗號': 'Semaphore',
    '第': 'Question',
    '題': 'questions',

    /* Main app — projection */
    '開始輪播': 'Start carousel',
    '▶ 開始輪播': '▶ Start carousel',
    '💡 揭示答案': '💡 Reveal answer',
    '↩ 回到題目': '↩ Back to question',
    '⏱ 速度': '⏱ Speed',
    '已是最後一題': 'This is the last question',
    '點擊下方開始輪播': 'Press Start carousel below',
    '聽力考核項目': 'Audio assessment item',
    '（聽力考核項目）': '(Audio assessment item)',
    '（聲音播放）': '(Audio playback)',
    '🔊 聲音播放（請按下方「開始輪播」）': '🔊 Audio item (press Start carousel below)',
    '🔊 播放音訊': '🔊 Play audio',
    '密碼提示：': 'Cipher hint: ',
    '解碼表 · ': 'Decoder · ',
    '倒序：將整段文字由最後一個字元開始，逐個向前閱讀。': 'Reverse: read the whole message backwards, one character at a time.',
    '將兩列左右移動以找出位移後的字母。': 'Slide the two alphabet rows to find the shifted letter.',
    '上、下兩列的相對字母互相對應。': 'Letters in the top and bottom rows mirror each other.',
    '🏆 試卷參考答案': '🏆 Exam Answer Key',
    '✓ 參考答案': '✓ Answer key',
    '題目:': 'Question:',
    '總共': 'Total:',
    '題 · 領袖專用 · 投影結束後可關閉': 'questions · Leaders only · close after projection',
    '字母': 'Letter',

    /* Main app — buzzer */
    '搶答大廳': 'Buzz Quiz Lobby',
    '載入中...': 'Loading…',
    '🟢 開放搶答': '🟢 Open buzzing',
    '🟢 開放搶答 (RESET)': '🟢 Open buzzing (RESET)',
    '🔴 關閉搶答': '🔴 Close buzzing',
    '📱 隊員由此輸入 ID 加入搶答': '📱 Members: enter the game ID here to join',
    '排名榜': 'Leaderboard',
    '0 人連線': '0 players connected',
    '人連線': 'players connected',
    'SKW 搶答助手': 'SKW Buzz Quiz',
    '遊戲 ID (由領袖提供)': 'Game ID (from your leader)',
    '例如: 9f8e-...': 'e.g. 9f8e-…',
    '遊戲 ID:': 'Game ID:',
    '你的姓名 / 隊伍名稱': 'Your name / patrol name',
    '輸入姓名': 'Enter your name',
    '請輸入姓名': 'Please enter your name',
    '加入遊戲': 'Join game',
    '← 返回主頁面': '← Back to main page',
    '等待領袖開放...': 'Waiting for the leader to open…',
    '開啟搖一搖搶答': 'Enable shake-to-buzz',
    '搖一搖已開啟': 'Shake-to-buzz enabled',
    '離開搶答房間': 'Leave the buzz room',
    '已搶答！': 'Buzzed!',
    '你是第 1 名！': 'You are #1!',
    '領袖已開放搶答！快按 BUZZ!': 'Buzzing is open — hit BUZZ!',
    '等待結果...': 'Waiting for results…',
    '搶答系統初始化失敗': 'Could not start the buzz quiz',
    '搶答服務未能載入': 'Buzz service unavailable',
    '搶答服務未能載入，請檢查網絡': 'Buzz service unavailable — check your connection',
    '請檢查網絡或重新整理頁面': 'Check your connection or refresh the page',
    '搶答連線失敗:': 'Buzz connection failed:',
    '搶答連線異常': 'Buzz connection error',
    '搶答連線錯誤': 'Buzz connection error',
    '請檢查網絡連線': 'Check your network connection',
    'PeerJS 未載入，請檢查網絡': 'PeerJS did not load — check your connection',
    '連接搶答房間失敗，請確認遊戲 ID 是否正確。': 'Could not join the room. Check the game ID.',
    '請輸入遊戲 ID': 'Please enter a game ID',
    '連線失敗': 'Connection failed',
    '無法連接伺服器': 'Cannot reach the server',
    'QR Code 未能直接繪製': 'QR code could not be drawn',
    '請複製下方加入連結或輸入遊戲 ID': 'Copy the join link below or type the game ID',
    'QR Code 已生成': 'QR code generated',
    '複製連結': 'Copy link',
    '已複製連結。': 'Link copied.',
    '請手動複製已選取的連結。': 'Please copy the selected link manually.',
    '💡 提示：手機掃描 localhost 無法跨裝置連線。請確保手機與電腦在同一 Wi-Fi，並改以電腦區網 IP（如 http://192.168.x.x:5173）開啟，或直接讓隊員輸入遊戲 ID。': '💡 Tip: a localhost QR code cannot be used from another device. Put both devices on the same Wi-Fi and open the computer\'s LAN IP (e.g. http://192.168.x.x:5173), or let members type the game ID.',
    '⚠️ 提示：目前為本機檔案 (file://) 開啟，手機無法跨裝置連線。請改以本地伺服器或部署網址開啟。': '⚠️ Tip: this page was opened as a local file (file://), so other devices cannot connect. Use a local server or the deployed URL.',

    /* Print sheets */
    '童軍密碼考核試卷': 'Scout Cipher Examination',
    'Scout System Cipher Examination 2026': 'Scout System Cipher Examination 2026',
    '姓名: __________________': 'Name: __________________',
    '日期: __________________': 'Date: __________________',
    '試卷參考答案': 'Exam Answer Key',
    'Scout System Cipher Answer Key · 領袖專用': 'Scout System Cipher Answer Key · Leaders Only',
    '列印日期:': 'Print date:',
    '共': 'Total',
    '密碼解碼參考紙': 'Cipher decoder sheets',
    '解碼紙：': 'Decoder Sheet: ',
    '密碼解碼參考。': 'Cipher decoding reference.',
    '英文字母移位列': 'Alphabet shift strips',
    '旗號對照表': 'Semaphore Reference',
    '摩斯密碼及英文字母': 'Morse Code and Alphabet',
    '點字對照表': 'Braille Reference',
    '朱高密碼對照表': 'Pigpen Reference',
    '電話 T9 對照表': 'Phone T9 Reference',
    '座標密碼對照表': 'Grid Cipher Reference',
    '凱撒位移英文字母表': 'Caesar Shift Alphabet',
    '反射密碼英文字母表': 'Atbash Alphabet',
    '倒序密碼提示': 'Reverse Cipher Hints',
    'NATO 音標對照表': 'NATO Alphabet Reference',
    '每個旗號圖案對應一個英文字母。': 'Each flag position represents one letter.',
    '摩斯密碼對照表；下方英文字母列可用作凱撒／移位解題。': 'Morse reference; the alphabet strips below also help with Caesar / shift questions.',
    '點字由左欄 1、2、3 點及右欄 4、5、6 點組成。': 'Braille uses dots 1, 2, 3 in the left column and 4, 5, 6 in the right.',
    '每個朱高圖案對應一個英文字母。': 'Each pigpen symbol represents one letter.',
    '按鍵數字加上按壓次數，例如 A 是 21。': 'Key number plus press count, e.g. A is 21.',
    '本表按目前設定的 KEY 編排。': 'This table uses the KEY currently set in the tool.',
    '可將兩行字母左右移動，找出位移後的字母。': 'Slide the two alphabet rows to find the shifted letter.',
    '上、下兩行由頭尾相對，A 對 Z、B 對 Y，如此類推。': 'Top and bottom rows mirror each other: A ↔ Z, B ↔ Y, and so on.',
    '將整段文字由後向前閱讀。': 'Read the whole message backwards.',
    '每個 NATO 音標詞對應一個英文字母。': 'Each NATO word represents one letter.',
    '原文字': 'Plain text',
    '參考答案': 'Answer',
    '參考答案：': 'Answer: ',
    '倒轉題': 'Reverse question',
    '翻譯以下密碼': 'Decode the following cipher',
    '將以下文字寫成': 'Write the following text in',
    '請用': 'Write in',
    '表示 ↑': '↑',

    /* Digital papers — static page */
    '← 返回密碼工具': '← Back to Cipher Tools',
    'SCOUT SYSTEM · 電子試卷': 'SCOUT SYSTEM · DIGITAL PAPERS',
    '不用列印，手機作答': 'No printing — answer on your phone',
    '領袖建立試卷，成員掃碼或匯入題目，完成後自行核對或交回領袖。': 'Leaders build papers; members scan a QR code or import questions, then check their answers or hand the file back.',
    '電子試卷角色': 'Digital paper role',
    '貼上領袖提供的連結': 'Paste the link from your leader',
    '例如：獅子巡邏隊': 'e.g. Lion Patrol',
    '成員作答': 'Member',
    '領袖工作區': 'Leader Workspace',
    '收取試卷': 'Get a paper',
    '掃描領袖的 QR Code、貼上連結，或匯入題目／答案 JSON。連網活動不會自動更新。': 'Scan the leader\'s QR code, paste a link, or import a question / answer JSON file. Online activities never update automatically.',
    '掃描 QR': 'Scan QR',
    '選擇 QR 圖片或 JSON': 'Choose a QR image or JSON',
    '關閉相機': 'Close camera',
    '使用相機需要 HTTPS 及權限；如不可用，請改選 QR 圖片或貼上連結。': 'Camera access needs HTTPS and permission; otherwise pick a QR image or paste the link.',
    '活動或固定試卷連結': 'Activity or fixed-paper link',
    '讀取': 'Open',
    '活動 ID：': 'Activity ID: ',
    '更新題目及答案': 'Refresh questions & answers',
    '只有按此按鈕才連網讀取；本機保留上次成功讀取的副本。': 'Only this button contacts the network; the last successful copy stays on this device.',
    '姓名／隊名（選填，會包含在交卷檔）': 'Name / patrol (optional, included in the submission file)',
    '下載作答檔交領袖': 'Download submission for leader',
    '移除此試卷': 'Remove this paper',
    '答案儲存在此瀏覽器。交卷檔由你自行傳送，系統不會自動上傳。': 'Answers stay in this browser. You send the submission file yourself — nothing is uploaded automatically.',
    '領袖登入': 'Leader sign in',
    '連網驗證，登入最多 24 小時；重新整理或關頁後需重新登入。題庫只保存在此瀏覽器。': 'Online sign-in lasts up to 24 hours; reload or close the tab and you must sign in again. Papers are stored only in this browser.',
    '領袖密碼': 'Leader password',
    '登入': 'Sign in',
    '此登入是教學工作區，不是防作弊或保護機密資料的系統。': 'This is a teaching workspace, not an anti-cheating or confidential-data system.',
    '我的題組': 'My question sets',
    '先建立題組，再產生固定題目或連網活動。': 'Create a question set first, then share fixed questions or start an online activity.',
    '返回成員模式': 'Back to member mode',
    '＋ 建立題組': '+ New question set',
    '從現有試卷匯入': 'Import from exam paper',
    '還原私人備份': 'Restore private backup',
    '查看成員作答檔': 'View a submission',
    '編輯題組': 'Edit question set',
    '訊息只接受英文、數字和空格；預設座標密碼 SCOUT、凱撒位移 3。每套最多 30 題。': 'Messages accept A–Z, 0–9 and spaces only. Grid uses SCOUT and Caesar uses a shift of 3. Up to 30 questions per set.',
    '題組名稱': 'Question set name',
    '＋ 新增一題': '+ Add question',
    '儲存題組': 'Save question set',
    '取消': 'Cancel',
    '下載私人備份': 'Download private backup',
    '刪除本機題組': 'Delete local question set',
    '固定分享': 'Fixed sharing',
    '題目不含答案欄位。答案包及私人備份不可提前交給成員；題目修改後要重新分享。': 'Question packages contain no answers. Never give the answer package or private backup to members early; re-share after any edit.',
    '題目 QR／檔案': 'Questions QR / file',
    '答案 QR／檔案': 'Answers QR / file',
    '連網活動': 'Online activity',
    '活動 QR 不變；修改後需手動同步。成員只在按「更新」時讀取。完成後可結束活動。': 'The activity QR stays the same; sync manually after edits. Members only read when they press Refresh. End the activity when finished.',
    '分享連結': 'Share link',
    '下載 JSON': 'Download JSON',
    '題目與答案可被持有人複製，請勿放入敏感資料。清除瀏覽器資料會移除本機紀錄。': 'Anyone holding a paper or answer file can copy it — do not include sensitive data. Clearing browser data removes local records.',

    /* Digital papers — generated UI and messages */
    '英文訊息': 'English message',
    '例如 SOS': 'e.g. SOS',
    '密碼種類': 'Cipher type',
    '題目方向': 'Question direction',
    '顯示密碼，翻譯英文': 'Show cipher, decode to English',
    '顯示英文，寫成密碼': 'Show English, write the cipher',
    '刪除本題': 'Delete question',
    '開啟題組': 'Open set',
    '版本': 'version',
    '已連結活動': 'linked to an online activity',
    '尚未建立題組。': 'No question sets yet.',
    '題組版本': 'set version',
    '連網活動，版本': 'online activity, version',
    '固定試卷': 'fixed paper',
    '你的答案': 'Your answer',
    '輸入你的答案；符號題可描述或另附圖像': 'Type your answer; for symbol questions describe it or attach an image',
    '尚未提供參考答案': 'No answer provided yet',
    '作答檔：': 'Submission: ',
    '未填姓名': 'no name given',
    '已找到相同版本題組，可供人工批閱。': 'A matching question set was found; you can mark it manually.',
    '本機沒有相同版本題組，僅顯示作答，不顯示答案。': 'No matching question set on this device — responses only, no answers.',
    '成員：': 'Member: ',
    '（未作答）': '(no answer)',
    '已開啟作答檔；不會自動評分或上傳。': 'Submission opened; nothing is graded or uploaded automatically.',
    '每套最多 30 題。': 'Up to 30 questions per set.',
    '最多保存 50 套題組。': 'Up to 50 question sets can be saved.',
    '檔案太大（上限 200 KB）。': 'File too large (200 KB limit).',
    '圖片或檔案過大。': 'Image or file is too large.',
    '無法讀取圖片。': 'Could not read the image.',
    '無法讀取圖片或圖片尺寸過大。': 'Could not read the image, or it is too large.',
    '未能讀取 QR 圖片，請嘗試更清晰的圖片。': 'Could not read that QR image — try a sharper one.',
    '此瀏覽器無法使用相機；請匯入 QR 圖片或貼上連結。': 'This browser cannot use the camera; import a QR image or paste a link.',
    '現有試卷沒有題目。': 'The current exam paper has no questions.',
    '現有試卷超過 30 題，請先減少題目。': 'The current exam paper has more than 30 questions — remove some first.',
    '已匯入現有試卷；請檢查每題再儲存。電子試卷使用固定 SCOUT／位移 3，不使用輪播或音訊設定。': 'Imported the existing exam paper — review each question before saving. Digital papers always use SCOUT / shift 3 and ignore carousel and audio settings.',
    '匯入的試卷': 'Imported exam paper',
    '已下載作答檔，請自行傳送給領袖。': 'Submission downloaded — send it to your leader yourself.',
    '已移除本機試卷。': 'Local paper removed.',
    '已還原私人備份。': 'Private backup restored.',
    '已收取固定試卷。': 'Fixed paper received.',
    '已載入參考答案。': 'Answer key loaded.',
    '已手動更新題目及已公布答案。': 'Questions and published answers refreshed.',
    '活動操作成功。成員需自行按更新。': 'Activity updated. Members must press Refresh themselves.',
    '活動已建立。請立即下載私人備份以保存管理鑰匙。': 'Activity created. Download a private backup now to keep the management key.',
    '已解除本機活動連結；雲端活動仍存在直至結束或到期。': 'This device is unlinked; the cloud activity still exists until it ends or expires.',
    '領袖模式已解鎖。': 'Leader mode unlocked.',
    '領袖登入已到期，請重新登入。': 'Leader session expired — sign in again.',
    '領袖登入失效，請重新登入。': 'Leader session is no longer valid — sign in again.',
    '請輸入領袖密碼。': 'Enter the leader password.',
    '密碼不正確。': 'Incorrect password.',
    '嘗試次數過多，請稍後再試。': 'Too many attempts — try again later.',
    '登入失敗，請檢查伺服器設定。': 'Sign-in failed; check the server configuration.',
    '伺服器尚未設定領袖密碼。': 'The leader password is not configured on the server.',
    '伺服器尚未設定獨立簽署密鑰。': 'A separate signing key is not configured on the server.',
    '領袖驗證服務未完成設定。': 'Leader verification is not configured.',
    '無法儲存作答；請檢查瀏覽器儲存空間，並先下載作答檔。': 'Could not save answers; check browser storage and download a submission first.',
    '另一個分頁已修改題庫；請先備份並重新整理，避免覆蓋。': 'Another tab changed the question bank — back it up and reload to avoid overwriting it.',
    '另一個分頁已修改題庫，請先備份並重新整理。': 'Another tab changed the question bank — back it up and reload.',
    '找不到題組，請重新整理。': 'Question set not found — reload the page.',
    '題組格式不正確。': 'Invalid question set format.',
    '題目格式不正確。': 'Invalid question format.',
    '活動管理資料無效。': 'Invalid activity management data.',
    '題組超出支援範圍。': 'Question set is outside the supported range.',
    '試卷格式無效。': 'Invalid paper format.',
    '答案格式無效。': 'Invalid answer format.',
    '作答檔格式無效。': 'Invalid submission file.',
    '不是私人備份檔。': 'Not a private backup file.',
    '不是支援的試卷或答案檔。': 'Not a supported paper or answer file.',
    '分享碼不正確或太長。': 'Share code is invalid or too long.',
    '連結不含試卷資料。': 'The link contains no paper data.',
    '請貼上連結。': 'Paste a link first.',
    '只接受本站電子試卷連結；請勿貼上其他網站的連結。': 'Only links from this site\'s digital papers are accepted.',
    '請按「更新題目及答案」才會連網讀取。': 'Press "Refresh questions & answers" to read from the network.',
    '已載入活動 ID；請按「更新題目及答案」才會連網讀取。': 'Activity ID loaded — press "Refresh questions & answers" to read from the network.',
    '活動 ID 格式不正確。': 'Invalid activity ID format.',
    '活動 ID 格式無效。': 'Invalid activity ID format.',
    '活動 ID 無效。': 'Invalid activity ID.',
    '活動回應格式無效。': 'Invalid activity response.',
    '收到較舊的活動版本，已拒絕取代。': 'An older activity version was received and rejected.',
    '這是較舊版本的題目，未有取代本機內容。': 'These questions are an older version; local content was kept.',
    '相同版本的題目內容不同，已拒絕取代。': 'Same version but different content — the replacement was rejected.',
    '答案不屬於目前試卷版本；請先讀取相同版本的題目。': 'Those answers belong to a different paper version; load the matching questions first.',
    '請在適當時間才分享答案，需先匯入同一版本試卷。': 'Only share answers at the right time; import the same paper version first.',
    '確定刪除此本機題組？': 'Delete this local question set?',
    '此題組仍連結活動。刪除本機資料不會結束雲端活動，亦會失去管理鑰匙。確定刪除？': 'This set is linked to an activity. Deleting local data will not end the cloud activity and the management key will be lost. Delete anyway?',
    '私人備份包含未公布答案及活動管理鑰匙。確定匯入？': 'A private backup contains unpublished answers and the management key. Import it?',
    '此題組已存在。還原將取代本機版本，包括其活動管理資料；請先備份原版本並核對。確定還原？': 'This set already exists. Restoring will replace the local copy, including activity management data. Back up and check the original first. Restore anyway?',
    '載入其他題組或新版本會清除目前作答。請先下載作答檔，確定繼續？': 'Loading another set or version clears your current answers. Download a submission first. Continue?',
    '載入答案後會顯示參考答案，確定繼續？': 'Loading answers will show the answer key. Continue?',
    '移除此裝置的題目及作答？請先下載作答檔。': 'Remove the questions and answers from this device? Download a submission first.',
    '同步後，之前已公布的答案會清除。確定？': 'Syncing clears previously published answers. Continue?',
    '公布全部答案？已下載的答案無法收回。': 'Publish every answer? Already-downloaded answers cannot be recalled.',
    '確定結束連網活動？舊 QR 將失效，已下載的內容不能收回。': 'End the online activity? The old QR stops working, but downloaded content cannot be recalled.',
    '只解除此裝置的活動連結，不會結束雲端活動。若沒有私人備份，可能無法再管理活動。確定？': 'Only unlink this device; the cloud activity stays. Without a private backup you may lose the ability to manage it. Continue?',
    '建立連網活動會把題目及答案儲存在 Cloudflare。確定繼續？': 'Creating an online activity stores questions and answers on Cloudflare. Continue?',
    '延長後距離現在的有效期（日，必須比現有到期時間長，最多 365 日）': 'New validity in days from now (must be later than the current expiry, max 365)',
    '有效期需為 1 至 365 日。': 'Validity must be between 1 and 365 days.',
    '活動有效期（日，1–365）': 'Activity validity (days, 1–365)',
    '建立連網活動': 'Create online activity',
    '分享活動 QR': 'Share activity QR',
    '同步題目': 'Sync questions',
    '公布全部答案': 'Publish all answers',
    '延長期限': 'Extend expiry',
    '重新取得活動版本': 'Re-fetch activity version',
    '結束活動': 'End activity',
    '解除本機活動連結': 'Unlink this device',
    '本機題組已同步': 'local set is synced',
    '本機有未同步修改': 'local edits not yet synced',
    '到期：': 'expires: ',
    '本機題組沒有新修改。': 'No unsynced local changes.',
    '請先同步本機修改，再公布答案。': 'Sync local changes before publishing answers.',
    '活動版本衝突，請勿覆蓋；請先核對另一個領袖裝置。': 'Activity version conflict — do not overwrite; check the other leader device.',
    '題組與雲端不同，請核對後處理。': 'The set differs from the cloud copy — review before continuing.',
    '雲端題組與本機記錄不同，不能自動覆蓋；請使用最後同步的領袖裝置處理。': 'The cloud set differs from local records and cannot be overwritten automatically; use the leader device that synced last.',
    '活動不存在、已結束或已過期。': 'The activity does not exist, has ended or has expired.',
    '活動管理鑰匙不正確。': 'Incorrect activity management key.',
    '連網服務暫時不可用。': 'The online service is temporarily unavailable.',
    '活動操作進行中，請稍候。': 'Activity operation in progress — please wait.',
    '活動操作失敗（': 'Activity operation failed (',
    '未知錯誤': 'unknown error',
    '連網活動未設定；請先完成 Cloudflare 和 Vercel 設定。': 'Online activities are not configured; finish the Cloudflare and Vercel setup first.',
    '連網失敗，請檢查網絡、Cloudflare 設定或稍後重試。': 'Network request failed — check your connection, the Cloudflare setup, or try again later.',
    '連網資料超過 32 KB，請縮短題目或拆成多套。': 'Online data exceeds 32 KB — shorten the questions or split into more sets.',
    '雲端操作已成功，但本機保存失敗或另一分頁已修改。已嘗試下載私人恢復檔，請立即保管並核對，不要再次建立活動。': 'The cloud operation succeeded but the local save failed or another tab made changes. A private recovery file was downloaded — keep it safe, verify it, and do not create the activity again.',
    '成員開啟後須按「更新題目及答案」；活動連結只含讀取 ID。': 'Members must press "Refresh questions & answers" after opening; the activity link only carries a read ID.',
    '私人備份含答案及活動管理鑰匙，請妥善保管，切勿發給成員。': 'Private backups contain answers and the management key — keep them safe and never send them to members.',
    '不包含答案欄位。請實際測試 QR，過密時使用 JSON。': 'Contains no answer fields. Test the QR code in practice; use JSON if it is too dense.',
    '無法產生可掃描 QR，請使用連結或 JSON。': 'Could not produce a scannable QR — use the link or JSON instead.',
    '連結過長，不產生 QR；請下載 JSON。': 'Link too long for a QR code — download the JSON instead.',
    '答案分享': 'Answer sharing',
    '題目分享': 'Question sharing',
    '活動分享': 'Activity sharing',
    '操作失敗，請稍後再試。': 'Operation failed — please try again later.',
    '題目與答案': 'Questions and answers',
    '連網活動版本': 'online activity version',

    /* Digital papers — cipher names from paper-codec.js */
    '點字': 'Braille',
    '朱高密碼': 'Pigpen',
    '座標密碼（SCOUT）': 'Grid Cipher (SCOUT)',
    '座標密碼': 'Grid Cipher',
    '電話密碼': 'Phone Cipher',
    '凱撒位移（3）': 'Caesar Shift (3)',
    '用': 'Write in ',
    '表示': '',
    '訊息只可使用英文字母、數字及空格。': 'Messages may only use A–Z, 0–9 and spaces.',
    '旗號、點字及朱高密碼只支援英文字母和空格。': 'Semaphore, braille and pigpen support letters and spaces only.',
    '座標密碼表沒有 J 和 Z，請使用其他字母。': 'The grid cipher has no J or Z — use other letters.',
    '不支援的密碼種類': 'Unsupported cipher type',
    '旗號位置（數字 0–7 由上方開始順時針，每格 45°）：': 'Flag positions (0–7 clockwise from the top, 45° each): ',
    '朱高符號編號（A=0，B=1，如此類推）：': 'Pigpen symbol index (A=0, B=1, …): ',
    '一個旗號符號': 'A semaphore symbol',
    '一個朱高密碼符號': 'A pigpen symbol',
    '空格': 'space',

    /* Training game — static page */
    '← 返回工具箱': '← Back to toolkit',
    '返回密碼工具箱': 'Back to the cipher toolkit',
    '🔊 音效': '🔊 Sound',
    '🔇 靜音': '🔇 Muted',
    '開啟音效': 'Sound on',
    '關閉音效': 'Sound off',
    '輸入答案：': 'Your answer:',
    '輸入密碼代表的英文字母': 'Enter the letter this cipher stands for',
    '英文字母遊戲鍵盤': 'On-screen A–Z keyboard',
    '四選一答案': 'Multiple choice',
    '個人訓練紀錄': 'Personal training record',
    '個人里程碑': 'Personal milestones',
    '完美主義徽章': 'Perfectionist badges',
    '摩斯': 'Morse',
    '· 選出代表的字母': '· pick the letter',
    '💡 提示': '💡 Hint',
    '答對了！': 'Correct!',
    '密碼防衛戰': 'CIPHER DEFENSE',
    '// CIPHER DEFENSE 訓練終端 //': '// CIPHER DEFENSE TRAINING TERMINAL //',
    '病毒正向童軍基地逼近。': 'Viruses are closing in on the Scout base.',
    '看懂敵人身上的': 'Read the',
    '密碼符號': 'cipher symbols',
    '，在它碰到防火牆前輸入答案。': ' on each enemy and type the answer before it reaches the firewall.',
    '答錯過的字母會更常出現，愈玩愈熟！': 'Letters you get wrong appear more often — practice makes perfect!',
    '最高分': 'Best score',
    '上次準確率': 'Last accuracy',
    '完成訓練': 'Sessions',
    '開始任務': 'Start mission',
    '建議先玩': 'Recommended first',
    '新手學習': 'Rookie Lesson',
    '，認得符號後再挑戰 A–Z 實戰': ', then move on to the full A–Z challenge',
    '選擇訓練密碼': 'Choose ciphers',
    '// 可單選專攻或混合挑戰 //': '// PICK ONE OR MIX THEM //',
    '先選學習方式，再選一種或多種密碼。新手可由四選一開始，熟習後再升級至鍵盤實戰。': 'Pick a learning path, then one or more ciphers. Beginners can start with multiple choice and move up to the full keyboard.',
    '01 · 選擇學習方式': '01 · CHOOSE A PATH',
    '12 題 · 四選一 · 答錯即時教學': '12 questions · multiple choice · instant feedback',
    '真正認識符號': 'Really learn the symbols',
    '守城任務': 'Defend the Base',
    '20 題 · A–Z 鍵盤 · 有限血量': '20 questions · A–Z keyboard · limited shields',
    '由認得到記得': 'From recognition to recall',
    '無限挑戰': 'Endless Challenge',
    '速度逐步提升 · 挑戰最高分': 'Speed ramps up · chase your high score',
    '熟練後衝榜': 'For confident players',
    '02 · 選擇密碼': '02 · CHOOSE CIPHERS',
    '★ 摩斯入門': '★ Morse Starter',
    '★ 反應三項': '★ Reflex Trio',
    '★ 全能挑戰': '★ All-round Challenge',
    '⚙ 進階設定（速度／血量／限時）▾': '⚙ Advanced settings (speed / shields / timer) ▾',
    '⚡ 速度': '⚡ Speed',
    '🛡 血量': '🛡 Shields',
    '⏱ 限時': '⏱ Timer',
    '▶ 開始 12 題學習任務': '▶ Start 12-question lesson',
    '開始 12 題學習任務': 'Start 12-question lesson',
    '開始 20 題守城任務': 'Start 20-question defence',
    '開始無限挑戰': 'Start endless challenge',
    '每次只出一題；答錯會顯示答案，必須再答對才過關。': 'One question at a time. A wrong answer shows the solution, and you must get it right before moving on.',
    '⚙ 設定': '⚙ Settings',
    '速度及限時會即時生效；血量下局生效': 'Speed and timer apply immediately; shields apply next session',
    '結束本局／更換密碼': 'End session / change ciphers',
    /* Game feel + mobile game shell */
    '動感效果（粒子／震動／閃光）': 'Game feel (particles / shake / flashes)',
    '⛶ 全螢幕＋螢幕常亮': '⛶ Fullscreen + keep screen awake',
    '⛶ 離開全螢幕': '⛶ Exit fullscreen',
    '已暫停': 'PAUSED',
    '切換分頁或應用程式時已自動暫停，返回後按下面的掣繼續。': 'Switching tabs or apps paused the game automatically. Tap below to continue.',
    '▶ 繼續遊戲': '▶ Resume game',
    '↻ 請把手機轉回直向': '↻ Rotate back to portrait',
    /* Astra-Lab-inspired daily mission + coach marks */
    '📅 今日任務 / DAILY': '📅 DAILY MISSION',
    '今日任務': 'Daily mission',
    '今日任務完成': 'DAILY MISSION CLEAR',
    '每日 3 關 · 每關淨係 1 種密碼 · 每關 3 題 · 完成 +20 ★': '3 stages a day · ONE cipher per stage · 3 questions each · +20 ★ on completion',
    '連續日': 'day streak',
    '練習模式：唔扣血、唔限時、可撳「對照表」。本機紀錄 · 題目按日期固定': 'Practice mode: no lives lost, no timer, tap the reference sheet anytime. Local records · questions fixed by date',
    '📖 對照表': '📖 Reference',
    '練習模式 · 唔扣血、唔限時，可隨時對照': 'Practice mode · no lives lost, no timer, look up anytime',
    '▶ 開始今日任務': '▶ Play today\'s mission',
    '✓ 今日已完成 · 再玩一次': '✓ Cleared today · play again',
    '？玩法': '? How to play',
    '？玩法（3 步）': '? How to play (3 steps)',
    '睇清楚符號': 'Read the symbol',
    '每個敵人身上都有一個密碼符號：摩斯、旗號、朱高、點字、座標或電話 T9。先認出佢代表邊個英文字母。': 'Each enemy carries a cipher: Morse, semaphore, pigpen, braille, grid or phone T9. Work out which letter it means.',
    '即刻輸入答案': 'Type it fast',
    '用手機 A–Z 鍵或鍵盤輸入字母，喺敵人掂到防火牆之前破解佢。答中會即刻見到解碼過程。': 'Use the on-screen A–Z keys or a keyboard to answer before the enemy reaches the firewall. A correct answer plays the decoding reveal.',
    '連擊同弱項': 'Combos and weak spots',
    '連續答中倍分會一路升；答錯過嘅字母會更常出現，幫你針對弱項練習。今日任務完成再攞 ★。': 'Consecutive hits raise the multiplier; letters you miss come back more often. Clear the daily mission to earn ★.',
    '略過': 'Skip',
    '下一步 ▶': 'Next ▶',
    '開始 ▶': 'Play ▶',
    '防火牆失守': 'FIREWALL BREACHED',
    '// 任務完成 · 檢視弱項 //': '// MISSION COMPLETE · REVIEW WEAK SPOTS //',
    '// 別放棄，再試一次 //': '// DON\'T GIVE UP, TRY AGAIN //',
    '// 威脅已全部解除 //': '// ALL THREATS NEUTRALISED //',
    '// 限時任務完成 //': '// TIMED MISSION COMPLETE //',
    '再挑戰一次': 'Try again',
    '再玩一次': 'Play again',
    '更換密碼': 'Change ciphers',
    '基地安全': 'BASE SECURE',
    '∞ 無限': '∞ Unlimited',
    '∞ 不限': '∞ No limit',
    '只接受 A–Z / 0–9': 'Only A–Z / 0–9',
    '請用英文/數字': 'Use letters or numbers',
    '請至少選一個密碼!': 'Pick at least one cipher!',
    '本局訓練仍在進行，確定返回工具箱？': 'A session is still running — leave for the toolkit?',
    '瀏覽器不支援語音': 'This browser does not support speech synthesis',
    '點與劃': 'dots and dashes',
    '幾何符號': 'Geometric symbols',
    '六點組合': 'Six-dot patterns',
    '雙旗方位': 'Two-flag positions',
    '無限防護': 'Unlimited shields',
    '電話 T9': 'Phone T9',
    '按鍵': 'keys',
    '2-1、9-4 按鍵': '2-1, 9-4 keys',
    '點在前、劃在後的次序很重要': 'dot-then-dash order matters',
    '前面是按鍵，後面是次數': 'key number first, press count second',
    '數字 0–7 由上方開始順時針，每格 45°': '0–7 clockwise from the top, 45° each',
    'A=0，B=1，如此類推': 'A=0, B=1, …',
    '顯示方式': 'display mode',
    '旗號樣式': 'semaphore style',
    '密碼類型': 'cipher type',
    '方向': 'direction',
    'SCOUT 座標': 'SCOUT Grid',

    /* Training game — generated UI */
    '選擇答案': 'Choose an answer',
    '時間到！': 'TIME UP!',
    '任務評級': 'Mission rating',
    '本局得分': 'Session score',
    '階段得分': 'Stage score',
    '總分': 'Total score',
    '成功破解': 'Neutralised',
    '本局準確率': 'Session accuracy',
    '最高連擊': 'Best combo',
    '剩餘時間': 'Time left',
    '完成進度': 'Progress',
    '各密碼準確率': 'Accuracy by cipher',
    '準確率': 'Accuracy',
    '均準確率': 'Avg accuracy',
    '均分': 'Avg score',
    '最高': 'Best',
    '局': 'sessions',
    '分': 'pts',
    '本週': 'This week',
    '本月': 'This month',
    '本段暫無紀錄': 'No records for this period',
    '新開始': 'New start',
    '📅 跟上一段時間比拼': '📅 Compare with the previous period',
    '📈 最近': '📈 Last',
    '週月排行': 'Weekly & monthly ranking',
    '近 10 局準確率': 'Accuracy over the last 10 sessions',
    '本局': 'This session',
    '平均': 'Average',
    '最佳': 'Best',
    '弱項：': 'Weak: ',
    '下一步：再練': 'Next: practise',
    '，集中': ', focus on',
    '表現穩定，可以加入另一種密碼作混合訓練。': 'Nicely consistent — try adding another cipher for mixed practice.',
    '敵人會愈來愈快；運用所學挑戰最高分及最長連擊。': 'Enemies get faster and faster — use what you have learnt to chase the best score and longest combo.',
    '使用完整 A–Z 鍵盤，在五格防護失效前完成 20 題。': 'Use the full A–Z keyboard and finish 20 questions before all five shields fail.',
    '提示：答案是': 'Hint: the answer is',
    '未正確，答案是': 'was not right — the answer is',
    '。看清楚後，再按一次正確答案。': '. Look carefully, then press the right answer again.',
    '🎖 全新徽章解鎖！': '🎖 New badge unlocked!',
    '🏅 完美主義徽章': '🏅 Perfectionist badges',
    '（每個密碼 + 每個路徑都通關一次）': '(clear every cipher on every path once)',
    '最近解鎖：': 'Latest unlock: ',
    '未通關': 'not cleared',
    '🎉 解鎖新里程碑：': '🎉 New milestone unlocked: ',
    '題！': ' questions!',
    '速度': 'speed',
    '得分': 'Score',
    '未完成': 'Not finished',
    '就是': 'is',
    '（點在前、劃在後的次序很重要）': '(dot-then-dash order matters)',
    '（前面是按鍵，後面是次數）': '(key number first, press count second)',
    '；留意外框方向': '; watch the outline direction',
    '，而且中間有一點': ', and it has a centre dot',
    '，這個符號沒有點': ', and it has no dot',
    '點字凸點': 'Braille dots',
    '電話鍵': 'Phone key',
    '朱高符號是': 'Pigpen symbol',
    '朱高': 'Pigpen',
    '座標': 'Grid',
    '電話': 'Phone',
    '凱撒': 'Caesar',
    '反射': 'Atbash',
    '倒序': 'Reverse',
    '右上': 'Upper right',
    '右下': 'Lower right',
    '左下': 'Lower left',
    '左上': 'Upper left',
    '上': 'Up',
    '右': 'Right',
    '下': 'Down',
    '左': 'Left',
    '答案': 'Answer',
    '名': 'players',

    /* Generic short labels used in mixed strings */
    '尚未建立活動': 'no activity yet',
    '已儲存在此瀏覽器。連網活動如有修改，需手動同步。': 'Stored in this browser. Sync manually after online activity changes.',
    '活動 QR 不變；修改後需手動同步。': 'The activity QR does not change; sync manually after edits.',
    '題目修改後要重新分享': 're-share after editing questions',
    '輸入你的答案': 'Type your answer',
  };

  /* ------------------------------------------------------------------
   * Patterns for strings whose word order changes in English. Applied
   * before phrase-level replacement. Replacement may be a string or a
   * function receiving the regex match array.
   * ------------------------------------------------------------------ */
  var PATTERNS = [
    /* Exam / answer sheets */
    [/^Q(\d+)\. 翻譯以下密碼 \((.+)\)：$/, function (m) { return 'Q' + m[1] + '. Decode the following ' + trInner(m[2]) + ' cipher:'; }],
    [/^Q(\d+)\. 將以下文字寫成 (.+)：$/, function (m) { return 'Q' + m[1] + '. Write the following text in ' + trInner(m[2]) + ':'; }],
    [/^↑ 請用 (.+) 表示 ↑$/, function (m) { return '↑ Write the above in ' + trInner(m[1]) + ' ↑'; }],
    [/^解碼紙：(.+)$/, function (m) { return 'Decoder Sheet: ' + trInner(m[1]); }],
    [/^解碼表 · (.+)$/, 'Decoder · $1'],
    [/^共 (\d+) 題$/, 'Total: $1 questions'],
    [/^(\d+) 題 · 領袖專用 · 投影結束後可關閉$/, '$1 questions · Leaders only · close after projection'],

    /* Question counts, set metadata, sessions */
    [/^第 (\d+) 題 · (.+)$/, function (m) { return 'Question ' + m[1] + ' · ' + trInner(m[2]); }],
    [/^第 (\d+) 題$/, 'Question $1'],
    [/^第 (\d+) 題密碼類型$/, 'Question $1 cipher type'],
    [/^第 (\d+) 題顯示方式$/, 'Question $1 display mode'],
    [/^第 (\d+) 題方向$/, 'Question $1 direction'],
    [/^第 (\d+) 題旗號樣式$/, 'Question $1 semaphore style'],
    [/^(\d+) 題 · 題組版本 (\d+)( · .+)?$/, function (m) { return m[1] + ' questions · set version ' + m[2] + (m[3] ? trInner(m[3]) : ''); }],
    [/^(\d+) 題 · 版本 (\d+)( · .+)?$/, function (m) { return m[1] + ' questions · version ' + m[2] + (m[3] ? trInner(m[3]) : ''); }],
    [/^(\d+) 題 · (\d+)% · (\d+)分$/, '$1 questions · $2% · $3 pts'],
    [/^(\d+) 題( · .+)?$/, function (m) { return m[1] + ' questions' + (m[2] ? trInner(m[2]) : ''); }],
    [/^(\d+) 人連線$/, '$1 players connected'],
    [/^(\d+) 局$/, '$1 sessions'],
    [/^(\d+) 名$/, '$1 players'],
    [/^(\d+) 分$/, '$1 pts'],
    [/^你是第 (\d+) 名！$/, 'You are #$1!'],
    [/^📈 最近 (\d+) 局$/, '📈 Last $1 sessions'],
    [/^STAGE (\d+) · 無限挑戰$/, 'STAGE $1 · Endless Challenge'],
    [/^搶答 #(\d+)$/, 'Buzz #$1'],

    /* Projection / decoder helpers */
    [/^字母 (\d+) \/ (\d+)$/, 'Letter $1 / $2'],
    [/^密碼提示：(.+)$/, 'Cipher hint: $1'],
    [/^任務 (\d+)\/(\d+) · 準確率 (\d+)%$/, 'Mission $1/$2 · accuracy $3%'],
    [/^用(.+)表示$/, function (m) { return 'Write in ' + trInner(m[1]); }],
    [/^翻譯(.+)$/, function (m) { return 'Decode ' + trInner(m[1]); }],

    /* Training explanations built from cipher data */
    [/^旗號位置（(.+)）：(.+)$/, function (m) { return 'Flag positions (' + trInner(m[1]) + '): ' + m[2]; }],
    [/^朱高符號編號（(.+)）：(.+)$/, function (m) { return 'Pigpen symbol index (' + trInner(m[1]) + '): ' + m[2]; }],
    [/^旗號 (.+) 就是 (.+)$/, 'Semaphore $1 = $2'],
    [/^摩斯 (.+) 就是 (.+)（(.+)）$/, function (m) { return 'Morse ' + m[1] + ' = ' + m[2] + ' (' + trInner(m[3]) + ')'; }],
    [/^電話鍵 (.+) 就是 (.+)（(.+)）$/, function (m) { return 'Phone key ' + m[1] + ' = ' + m[2] + ' (' + trInner(m[3]) + ')'; }],
    [/^點字凸點 (.+) 就是 (.+)$/, 'Braille dots $1 = $2'],
    [/^SCOUT 座標 (.+) 就是 (.+)$/, 'SCOUT Grid $1 = $2'],
    [/^提示：答案是 (.+)$/, 'Hint: the answer is $1'],
    [/^答對了！(.+)$/, 'Correct! $1'],
    [/^(.+) 未正確，答案是 (.+)$/, '$1 was not right — the answer is $2'],
    [/^下一步：再練 (.+)。$/, function (m) { return 'Next: practise ' + trInner(m[1]) + '.'; }],
    [/^🎉 解鎖新里程碑：(.+)題！$/, '🎉 New milestone unlocked: $1 questions!'],
    [/^準確率 (\d+)% · 得分 (\d+) · (.+)$/, 'Accuracy $1% · score $2 · $3'],
    [/^活動操作失敗（(.+)，(.+)）。$/, 'Activity operation failed ($1, $2).'],
    [/^🎉 解鎖新里程碑：(.+) 題！$/, '🎉 New milestone unlocked: $1 questions!']
  ];

  /* Phrase-level fallback, longest first, derived from the exact map.
     Single characters are deliberately excluded to avoid mangling text. */
  var PHRASES = Object.keys(EN)
    .filter(function (k) { return k.length > 1 && CJK.test(k); })
    .sort(function (a, b) { return b.length - a.length; })
    .map(function (k) { return [k, EN[k]]; });

  var lang = detectLang();
  var TEXT_STATE = new WeakMap();
  var ATTR_STATE = new WeakMap();
  var applying = false;
  var observer = null;

  function detectLang() {
    var stored = null;
    try { stored = global.localStorage && global.localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
    if (LANGS.indexOf(stored) >= 0) return stored;
    try {
      var q = new URLSearchParams(global.location.search).get('lang');
      if (q && /^en/i.test(q)) return 'en';
      if (q && /^zh/i.test(q)) return 'zh-Hant';
    } catch (e) { /* no location */ }
    return 'zh-Hant';
  }

  var trDepth = 0;
  function phraseOnly(value) {
    var out = value;
    for (var i = 0; i < PHRASES.length; i++) {
      if (out.indexOf(PHRASES[i][0]) >= 0) out = out.split(PHRASES[i][0]).join(PHRASES[i][1]);
    }
    return out;
  }
  function trInner(value) {
    // Captured fragments are short labels (e.g. a cipher name). Run the
    // full translator on them too, with a depth guard against recursion.
    if (lang !== 'en') return value;
    if (trDepth >= 3) return phraseOnly(value);
    trDepth++;
    try { return t(value); } finally { trDepth--; }
  }

  function t(value) {
    if (lang !== 'en' || typeof value !== 'string' || !value) return value;
    if (!CJK.test(value)) return value;
    if (Object.prototype.hasOwnProperty.call(EN, value)) return EN[value];
    for (var i = 0; i < PATTERNS.length; i++) {
      var rule = PATTERNS[i], match = value.match(rule[0]);
      if (match) return typeof rule[1] === 'function' ? rule[1](match) : value.replace(rule[0], rule[1]);
    }
    var out = value;
    for (var j = 0; j < PHRASES.length; j++) {
      if (out.indexOf(PHRASES[j][0]) >= 0) out = out.split(PHRASES[j][0]).join(PHRASES[j][1]);
    }
    if (out !== value && out.indexOf('（') >= 0) { out = out.replace(/（/g, ' (').replace(/）/g, ')'); }
    return out;
  }

  function isSkipped(node) {
    var el = node && (node.nodeType === 1 ? node : node.parentElement);
    return !!(el && el.closest && el.closest('[data-i18n-skip]'));
  }

  function translateText(node) {
    if (!node || node.nodeType !== 3 || isSkipped(node)) return;
    var parent = node.parentElement;
    if (parent && SKIP_TAGS[parent.tagName]) return;
    var raw = node.nodeValue;
    var state = TEXT_STATE.get(node);
    if (!state || state.last !== raw) {
      state = { original: raw, last: raw };
      TEXT_STATE.set(node, state);
    }
    var core = state.original.trim();
    var next = core ? state.original.replace(core, t(core)) : state.original;
    if (raw !== next) node.nodeValue = next;
    state.last = next;
  }

  function translateAttrs(el) {
    if (!el || el.nodeType !== 1 || isSkipped(el)) return;
    var state = ATTR_STATE.get(el);
    if (!state) { state = { original: Object.create(null), last: Object.create(null) }; ATTR_STATE.set(el, state); }
    for (var i = 0; i < ATTRS.length; i++) {
      var name = ATTRS[i];
      if (name === 'value' && !(el.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(el.type || ''))) continue;
      if (!el.hasAttribute(name)) continue;
      var raw = el.getAttribute(name);
      if (state.original[name] === undefined || state.last[name] !== raw) state.original[name] = raw;
      var core = state.original[name].trim();
      var next = core ? state.original[name].replace(core, t(core)) : state.original[name];
      if (raw !== next) el.setAttribute(name, next);
      state.last[name] = next;
    }
  }

  function translateSubtree(node) {
    if (!node) return;
    if (node.nodeType === 3) { translateText(node); return; }
    if (node.nodeType !== 1) return;
    var doc = node.ownerDocument || global.document;
    var NF = global.NodeFilter || { SHOW_ELEMENT: 1, SHOW_TEXT: 4 };
    var elWalker = doc.createTreeWalker(node, NF.SHOW_ELEMENT, null);
    var el = node;
    while (el) { translateAttrs(el); el = elWalker.nextNode(); }
    var textWalker = doc.createTreeWalker(node, NF.SHOW_TEXT, null);
    var tn = textWalker.nextNode();
    while (tn) { translateText(tn); tn = textWalker.nextNode(); }
    if (node.nodeType === 3) translateText(node);
  }

  function applyTranslations(root) {
    var doc = global.document;
    if (!doc) return;
    var base = !root || root === doc || root.nodeType === 9 ? doc.documentElement : root;
    if (!base) return;
    applying = true;
    try { translateSubtree(base); } finally { applying = false; }
  }

  function updateSwitchers() {
    var doc = global.document;
    if (!doc) return;
    var list = doc.querySelectorAll('[data-lang-switch]');
    var aria = lang === 'en' ? 'Switch to Traditional Chinese' : 'Switch to English';
    var labelText = lang === 'en' ? '繁' : 'EN';
    var pressed = lang === 'en' ? 'true' : 'false';
    for (var i = 0; i < list.length; i++) {
      var btn = list[i];
      var label = btn.querySelector('[data-lang-label]');
      // Only mutate when something actually changed: the MutationObserver
      // watches these attributes, and redundant writes would loop forever.
      if (label && label.textContent !== labelText) label.textContent = labelText;
      if (btn.getAttribute('aria-label') !== aria) btn.setAttribute('aria-label', aria);
      if (btn.getAttribute('title') !== aria) btn.setAttribute('title', aria);
      if (btn.getAttribute('aria-pressed') !== pressed) btn.setAttribute('aria-pressed', pressed);
    }
  }

  function setLang(next) {
    next = LANGS.indexOf(next) >= 0 ? next : 'zh-Hant';
    lang = next;
    try { global.localStorage && global.localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* private mode */ }
    var doc = global.document;
    if (doc && doc.documentElement) {
      doc.documentElement.lang = next === 'en' ? 'en' : 'zh-Hant';
      doc.documentElement.setAttribute('data-lang', next);
      applyTranslations(doc);
      updateSwitchers();
    }
    try { global.dispatchEvent(new CustomEvent('skw:langchange', { detail: { lang: next } })); } catch (e) { /* older browsers */ }
    return next;
  }

  function toggleLang() { return setLang(lang === 'en' ? 'zh-Hant' : 'en'); }

  var initialized = false;

  function startObserver() {
    var doc = global.document;
    if (observer || !doc || !doc.documentElement || !global.MutationObserver) return;
    observer = new global.MutationObserver(function (records) {
      if (applying) return;
      applying = true;
      try {
        var addedSwitcher = false;
        for (var i = 0; i < records.length; i++) {
          var r = records[i];
          if (r.type === 'childList') {
            for (var j = 0; j < r.addedNodes.length; j++) {
              var node = r.addedNodes[j];
              translateSubtree(node);
              if (node.nodeType === 1 && (node.hasAttribute('data-lang-switch') || node.querySelector('[data-lang-switch]'))) addedSwitcher = true;
            }
          } else if (r.type === 'characterData') {
            translateText(r.target);
          } else if (r.type === 'attributes') {
            translateAttrs(r.target);
          }
        }
        // A switch button may have just been parsed in.
        if (addedSwitcher) updateSwitchers();
      } finally { applying = false; }
    });
    observer.observe(doc.documentElement, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ATTRS.slice()
    });
  }

  function applyLanguageAttributes() {
    var doc = global.document;
    if (!doc || !doc.documentElement) return;
    doc.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant';
    doc.documentElement.setAttribute('data-lang', lang);
  }

  function init() {
    if (initialized) return;
    initialized = true;
    var doc = global.document;
    if (!doc || !doc.documentElement) return;
    applyLanguageAttributes();
    applyTranslations(doc);
    updateSwitchers();
    startObserver();
  }

  var api = {
    t: t,
    getLang: function () { return lang; },
    setLang: setLang,
    toggleLang: toggleLang,
    applyTranslations: applyTranslations,
    locale: function () { return lang === 'en' ? 'en-GB' : 'zh-Hant'; },
    LANGS: LANGS.slice(),
    // Exposed for tests / debugging.
    _dictionary: EN,
    _patterns: PATTERNS
  };
  global.SKW_I18N = api;

  if (global.document) {
    // The script sits in <head>: set the language and start watching nodes
    // immediately so English text is in place while the rest of the page is
    // still being parsed (no flash of Traditional Chinese).
    applyLanguageAttributes();
    startObserver();
    global.document.addEventListener('click', function (event) {
      var target = event.target && event.target.closest ? event.target.closest('[data-lang-switch]') : null;
      if (target) { event.preventDefault(); toggleLang(); }
    });
    if (global.document.readyState === 'loading') global.document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
