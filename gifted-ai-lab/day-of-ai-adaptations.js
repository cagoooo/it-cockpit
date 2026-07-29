window.DAY_OF_AI_ADAPTATIONS = {
  3: {
    title: 'AI 小偵探：它真的會看線索嗎？',
    question: '會自己動的東西，都是 AI 嗎？',
    intro: '先不要急著貼答案。看看工具收到什麼資料、怎麼做、結果會不會跟著改變。',
    scenarios: [
      ['自動門', '它看到有人靠近就開門，通常只是照固定規則工作，不一定是 AI。'],
      ['影片推薦', '它會參考你看過的影片，換一個人可能出現不同推薦，這是 AI 的重要線索。'],
      ['拼字小幫手', '有些只查字典，有些會用 AI 猜句子意思。要先查它怎麼做，可以暫時放在「還不確定」。']
    ],
    steps: ['先說工具做了什麼。', '找出它收到的資料。', '換一種資料，看看結果會不會改變。', '用一句話說出判斷和線索。'],
    prompts: ['我覺得它＿＿AI。', '因為它會＿＿。', '我看到的線索是＿＿。'],
    teacherQuestions: ['如果換一個人使用，結果會一樣嗎？', '它是在理解，還是只碰到感應器就動？', '現在還不能確定時，我們還要查什麼？'],
    words: [['感知', '用鏡頭、麥克風或感應器收到外面的訊息'], ['證據', '能幫我們判斷的觀察或測試結果']],
    links: [['原教材第 1 課簡報', 'https://docs.google.com/presentation/d/1IfDOhjUK8C8PSEbPl1j5CS1rW4LB64NR/edit'], ['AI 判斷學習單', 'https://docs.google.com/document/d/1xxQJHgoGWgPVR3GCFUa9915doWqcLfIM/edit'], ['觀察 Google 地圖', 'https://www.google.com/maps'], ['課後練習', 'https://docs.google.com/document/d/1Nt_YPXvkjvAU8iBoIXDpvvytV1PgId6G/edit']]
  },
  6: {
    title: '畫圖猜猜看：AI 怎麼學會？',
    question: 'AI 猜錯時，是它不聰明，還是看過的例子不一樣？',
    intro: '玩三回合畫圖猜題。每次都記下 AI 猜了什麼，再找出它可能看到了哪些線索。',
    scenarios: [
      ['畫一間房子', '有人畫三角形屋頂，有人住大樓。畫法不同，AI 可能認不出來。'],
      ['畫一支雨傘', '看看傘面、握把和角度，哪個線索最常讓 AI 猜中？'],
      ['畫一條魚', '試試側面、正面或 Q 版魚。新的畫法可以測出 AI 沒看過什麼。']
    ],
    steps: ['先猜 AI 會不會答對。', '完成一張圖並記下答案。', '圈出 AI 可能看到的線索。', '換一種畫法，再比較兩次結果。'],
    prompts: ['我畫的是＿＿。', 'AI 猜成＿＿。', '我覺得它看到的線索是＿＿。'],
    teacherQuestions: ['哪一筆新資料讓你改變想法？', '圖很多就一定學得好嗎？', '如果只有同一個人畫的圖，可能少了什麼？'],
    words: [['一大組例子', '放在一起、讓 AI 找規律的許多資料'], ['預測', '看過線索後，猜一個新答案']],
    links: [['開啟 Quick, Draw!', 'https://quickdraw.withgoogle.com/'], ['觀察麵包資料', 'https://quickdraw.withgoogle.com/data/bread'], ['觀察房子資料', 'https://quickdraw.withgoogle.com/data/house'], ['原教材第 2 課簡報', 'https://docs.google.com/presentation/d/156YPbIWksakWnn8wHLczW6BBLaz0BJCZ/edit'], ['學習紀錄單', 'https://docs.google.com/document/d/1urFppSfwQz1621Uf935l54mD0ROeyn7n/edit'], ['課後練習', 'https://docs.google.com/document/d/12n3Uh2AQfTTnPd_GkE4ZnB_oSaPXQ3U5/edit']]
  },
  9: {
    title: '資料照妖鏡：誰沒有被看見？',
    question: '資料看起來很多，為什麼還是可能不公平？',
    intro: '同一樣東西，每個人的畫法和生活經驗都可能不同。先找差異，再看看資料少了哪些情況。',
    scenarios: [
      ['麵包', '吐司、饅頭、法國麵包都可能是人心中的麵包。只收一種，AI 就可能認不出其他種類。'],
      ['電話', '轉盤電話、按鍵電話和手機長得很不一樣。不同年齡的人可能畫出不同答案。'],
      ['房子', '平房、大樓、山屋和有三角屋頂的房子，都代表不同生活經驗。']
    ],
    steps: ['只說看到的不同，不批評誰畫錯。', '找出資料裡很多和很少的樣子。', '問「還有誰或哪種情況沒出現？」', '補兩個不同例子，再檢查一次。'],
    prompts: ['資料裡常看到＿＿。', '資料裡很少看到＿＿。', '我想補進＿＿，因為＿＿。'],
    teacherQuestions: ['誰的生活經驗可能沒有出現？', '數量一樣就一定公平嗎？', '不用姓名和照片，還能怎麼完成觀察？'],
    words: [['偏見', '例子不完整，讓某些情況比較容易被猜錯'], ['公平', '不同的人和情況，都有被好好考慮']],
    links: [['原教材第 3 課簡報', 'https://docs.google.com/presentation/d/1wXRlTv__Fv3fYm8X_Fb5bRciD15sccvA/edit'], ['麵包資料：找不同', 'https://quickdraw.withgoogle.com/data/bread'], ['房子資料：找缺少', 'https://quickdraw.withgoogle.com/data/house'], ['偏見探究學習單', 'https://docs.google.com/document/d/1urFppSfwQz1621Uf935l54mD0ROeyn7n/edit'], ['課後練習', 'https://docs.google.com/document/d/1SvkdqD-GHNUrHWW4U7T_aKTKrj5Axxtn/edit']]
  },
  12: {
    title: '步驟料理店：說清楚才能做得到',
    question: '同一件事，怎麼寫才不會讓人猜錯？',
    intro: '把生活任務拆成「放進什麼、怎麼做、得到什麼」，再請別人完全照字面試一次。',
    scenarios: [
      ['準備早餐', '放進食材，照順序加熱和組合，最後得到可以吃的早餐。'],
      ['到圖書館借書', '放進書和借書證，檢查能不能借，最後得到借閱成功或提醒。'],
      ['魚缸水溫提醒', '放進水溫數字，和安全範圍比較，最後顯示正常或注意高溫。']
    ],
    steps: ['先說一開始有什麼資料。', '把動作排成清楚順序。', '說明最後會得到什麼。', '請老師照字面試，圈出需要猜的地方。'],
    prompts: ['放進去的是＿＿。', '接著要照順序＿＿。', '最後會得到＿＿。'],
    teacherQuestions: ['「整理一下」到底要做什麼？', '如果資料空白，這套步驟要怎麼辦？', '做到哪裡才算結束？'],
    words: [['解題步驟', '照順序完成任務的方法，也叫演算法'], ['輸入和輸出', '一開始放進去的資料，和最後得到的結果']],
    links: [['原教材第 4 課簡報', 'https://docs.google.com/presentation/d/135UXEEMbW793bGWO7VZlpdS9EZvlPmd7/edit'], ['演算法學習單', 'https://docs.google.com/document/d/1N3DzaycaBzt2PRpkJtbXBYncehO8cIJM/edit'], ['課後練習', 'https://docs.google.com/document/d/13yBPzg8Hs86pt2YUby7CtBu4xZ52Nvap/edit']]
  },
  15: {
    title: '老師機器人：找錯、修改、再試',
    question: '指令出錯時，怎麼知道要改哪一步？',
    intro: '請老師變成只照字面做事的機器人。學生負責寫指令、先猜結果、找出第一個錯誤，再修改一次。',
    scenarios: [
      ['讓老師走出教室', '「往前走」不夠清楚。要說幾步、何時轉彎、看到什麼要停下來。'],
      ['教老師洗手', '「把手洗乾淨」少了很多步驟。試著說出開水、搓洗、沖水和擦乾。'],
      ['教老師種種子', '要說明土、洞的深度、種子位置、水量和完成的樣子。']
    ],
    steps: ['先寫第一版，不急著做到完美。', '先猜老師最後會停在哪裡。', '老師完全照字面做，學生找第一個錯誤。', '一次只改一個地方，再從原點重試。'],
    prompts: ['我原本猜會＿＿。', '第一個不一樣的地方是＿＿。', '我只修改＿＿，結果變成＿＿。'],
    teacherQuestions: ['哪一個字讓老師需要猜？', '這次成功，是剛好還是真的說清楚？', '換一個起點，指令還能用嗎？'],
    words: [['除錯', '找出錯誤、修改，再試一次'], ['版本', '每次修改都留下一份，方便比較前後差別']],
    links: [['原教材第 5 課簡報', 'https://docs.google.com/presentation/d/1UR67gAlFiD0ZWWkN-ZvY0dUGOeaCxi8X/edit'], ['演算法學習單', 'https://docs.google.com/document/d/1N3DzaycaBzt2PRpkJtbXBYncehO8cIJM/edit'], ['課後練習', 'https://docs.google.com/document/d/1O1kPEIGUWaIdR7O8D6bObOo7UNJqjxUk/edit']]
  }
};
