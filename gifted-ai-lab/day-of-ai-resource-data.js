window.DAY_OF_AI_RESOURCE_META = { lastChecked: '2026-07-30', total: 20 };
window.DAY_OF_AI_RESOURCES = [
  { id: 'course-folder', title: 'Day of AI 中文課程資料夾', url: 'https://drive.google.com/drive/folders/19NRJ3Os-KcpdoOBgB1V5lNL_h60Gj6Jz', type: '教師備課', weeks: [3, 6, 9, 12, 15], audience: 'teacher', note: '原始簡報、學習單與教師資料的總入口。' },
  { id: 'teacher-guide', title: '什麼是 AI？教師指南', url: 'https://docs.google.com/document/d/13DJBhM2WEG8dpwJjnvUHitU0ze922eyg/edit', type: '教師指南', weeks: [3, 6, 9, 12, 15], audience: 'teacher', note: '本次本土化課程的主要參考來源。' },
  { id: 'quiz', title: '什麼是人工智慧？課前課後挑戰', url: 'https://docs.google.com/document/d/17qbdM5_Om_eDrIxTZ_tFHX8EEBwCzD_H/edit', type: '評量', weeks: [3, 6, 9, 12, 15], audience: 'both', note: '教師可挑選適合中年級的題目，不必一次全部完成。' },
  { id: 'vocabulary', title: 'AI 關鍵詞圖卡', url: 'https://drive.google.com/file/d/1eIjjY55VqnvwJhTLcJhh8RinnzXqpziz/view', type: '圖卡', weeks: [3, 6, 9, 12, 15], audience: 'both', note: '上課前先挑本週需要的詞，搭配生活例子使用。' },
  { id: 'lesson-1-slides', title: '第 1 課：什麼是 AI？', url: 'https://docs.google.com/presentation/d/1IfDOhjUK8C8PSEbPl1j5CS1rW4LB64NR/edit', type: '簡報', weeks: [3], audience: 'teacher', note: 'AI／不是 AI 判斷與生活案例。' },
  { id: 'lesson-1-sheet', title: '第 1 課學習單', url: 'https://docs.google.com/document/d/1xxQJHgoGWgPVR3GCFUa9915doWqcLfIM/edit', type: '學習單', weeks: [3], audience: 'both', note: '配合 AI 小偵探活動記錄判斷與理由。' },
  { id: 'aibo-video', title: 'Aibo 機器寵物生活影片', url: 'https://youtu.be/CdQnfga65W0', type: '影片', weeks: [3], audience: 'both', note: '英文影片，以畫面觀察機器如何感知與互動。', language: '英文' },
  { id: 'waymo-video', title: 'Waymo 自動駕駛介紹', url: 'https://youtu.be/uHbMt6WDhQ8', type: '影片', weeks: [3], audience: 'both', note: '英文影片，建議教師選看片段並用中文提問。', language: '英文' },
  { id: 'quickdraw-intro', title: 'Quick, Draw! 原理短片', url: 'https://www.youtube.com/watch?v=X8v1GWzZYJ4', type: '影片', weeks: [6], audience: 'both', note: '先看機器怎麼從很多畫圖例子找線索。', language: '英文' },
  { id: 'quickdraw-play', title: 'Quick, Draw! 畫圖猜題', url: 'https://quickdraw.withgoogle.com/', type: '互動網站', weeks: [6], audience: 'student', note: '第 6 週三回合畫圖實驗的主要工具。' },
  { id: 'quickdraw-data', title: 'Quick, Draw! 圖畫資料庫', url: 'https://quickdraw.withgoogle.com/data', type: '資料庫', weeks: [6, 9], audience: 'both', note: '比較不同人的畫法，尋找資料裡常見與缺少的樣子。' },
  { id: 'drawing-template', title: 'Google 畫圖練習範本', url: 'https://docs.google.com/drawings/d/1sfM8rauoi5n2dXMpGZweLogqTxx6WlvazXHvUH4pvTw/edit', type: '操作範本', weeks: [6], audience: 'both', note: '沒有紙卡時，可使用線上畫圖完成預測活動。' },
  { id: 'lesson-2-slides', title: '第 2 課：機器怎麼學？', url: 'https://docs.google.com/presentation/d/156YPbIWksakWnn8wHLczW6BBLaz0BJCZ/edit', type: '簡報', weeks: [6], audience: 'teacher', note: '看例子、找規律、猜新答案的入門版本。' },
  { id: 'lesson-3-slides', title: '第 3 課：資料會不會漏掉誰？', url: 'https://docs.google.com/presentation/d/1wXRlTv__Fv3fYm8X_Fb5bRciD15sccvA/edit', type: '簡報', weeks: [9], audience: 'teacher', note: '資料差異、缺口與不公平的進階探究。' },
  { id: 'lesson-23-sheet', title: '第 2、3 課學習單', url: 'https://docs.google.com/document/d/1urFppSfwQz1621Uf935l54mD0ROeyn7n/edit', type: '學習單', weeks: [6, 9], audience: 'both', note: '記錄畫圖預測、資料差異與修改想法。' },
  { id: 'lesson-4-slides', title: '第 4 課：生活中的解題步驟', url: 'https://docs.google.com/presentation/d/135UXEEMbW793bGWO7VZlpdS9EZvlPmd7/edit', type: '簡報', weeks: [12], audience: 'teacher', note: '從食譜與生活任務認識清楚步驟。' },
  { id: 'lesson-5-slides', title: '第 5 課：找錯、修改、再試', url: 'https://docs.google.com/presentation/d/1UR67gAlFiD0ZWWkN-ZvY0dUGOeaCxi8X/edit', type: '簡報', weeks: [15], audience: 'teacher', note: '老師機器人、指令測試與除錯活動。' },
  { id: 'lesson-45-sheet', title: '第 4、5 課學習單', url: 'https://docs.google.com/document/d/1N3DzaycaBzt2PRpkJtbXBYncehO8cIJM/edit', type: '學習單', weeks: [12, 15], audience: 'both', note: '整理生活步驟、預測結果與修改前後版本。' },
  { id: 'algorithm-extension', title: '演算法最佳化延伸簡報', url: 'https://docs.google.com/presentation/d/1Pz5V-iMudU_ckZuBWIpP2CE3xLoHCJNWwVrq4HQMOJw/edit', type: '教師進階', weeks: [15], audience: 'teacher', note: '英文中學程度，僅供資優延伸或教師挑選改寫。', language: '英文' },
  { id: 'terms', title: 'Day of AI 使用條款', url: 'https://dayofai.org/about-us/about-us-2', type: '授權', weeks: [3, 6, 9, 12, 15], audience: 'teacher', note: '公開、改編或分享教材前確認來源與授權方式。' }
];
