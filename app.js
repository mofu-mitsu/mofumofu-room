// ------------------------------------------
// ☁️ GAS連携用の設定
// ------------------------------------------
// ★デプロイして取得したGASの「ウェブアプリのURL」をここに貼り付けてね！
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwkhgd_GJ8sYTpmaeWZrz8RD7i74GCb_eYaALj_EaCEVK84QEKVdix1BZRLBf2wiCg/exec"; 

// 現在お部屋にログインしている情報（退出したら消えます）
let currentRoomId = null;
let currentRoomPass = null;
let isAdminMode = false; // 管理者として入室しているかフラグ

// --- 🔔 トースト通知関数 ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '<i class="fa-solid fa-circle-info"></i>';
  if (type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
  if (type === 'error') icon = '<i class="fa-solid fa-circle-exclamation"></i>';
  
  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3000);
}

// --- 🌐 GAS通信用の共通関数 ---
async function callGAS(data) {
  if (!GAS_API_URL || GAS_API_URL.startsWith("ここに")) {
    showToast("GASのウェブアプリURLが設定されていないよ！", "error");
    return { status: "error", message: "URL未設定" };
  }
  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "text/plain" }
    });
    return await response.json();
  } catch (err) {
    showToast("GASとの接続に失敗しました…", "error");
    return { status: "error", message: err.toString() };
  }
}

// --- 💬 自作確認モーダル ---
let confirmCallback = null;

function showConfirmModal(message, callback) {
  const modal = document.getElementById('confirm-modal');
  document.getElementById('confirm-modal-message').textContent = message;
  modal.classList.add('active');
  confirmCallback = callback;
}

document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
  document.getElementById('confirm-modal').classList.remove('active');
  confirmCallback = null;
});

document.getElementById('confirm-ok-btn').addEventListener('click', () => {
  if (confirmCallback) confirmCallback();
  document.getElementById('confirm-modal').classList.remove('active');
  confirmCallback = null;
});


// --- 📱 タブ切り替え制御 ---
function switchTab(sectionId) {
  document.querySelectorAll('.card').forEach(card => card.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(sectionId).classList.add('active');
  
  if (sectionId === 'form-section' || sectionId === 'success-site-section' || sectionId === 'success-normal-section') {
    document.getElementById('tab-form').classList.add('active');
  } else if (sectionId === 'board-section') {
    document.getElementById('tab-board').classList.add('active');
    loadBoardPosts();
  } else if (sectionId === 'survey-section') {
    document.getElementById('tab-survey').classList.add('active');
    loadSurveys(); 
  } else if (sectionId === 'login-section' || sectionId === 'room-section' || sectionId === 'admin-section') {
    document.getElementById('tab-room').classList.add('active');
  }
}

document.getElementById('tab-form').onclick = () => switchTab('form-section');
document.getElementById('tab-board').onclick = () => switchTab('board-section');
document.getElementById('tab-survey').onclick = () => switchTab('survey-section');
document.getElementById('tab-room').onclick = () => switchTab('login-section');


// --- 📥 ステップ遷移と分岐処理 ---
function nextStep(step) {
  const nextBtn = document.getElementById('btn-step3-next');
  nextBtn.innerHTML = '次へ <i class="fa-solid fa-chevron-right"></i>';
  nextBtn.onclick = () => nextStep(4);

  if (step === 2) {
    const origin = document.querySelector('input[name="origin"]:checked');
    if (!origin) { showToast("どこから来たか教えてね！", "error"); return; }
  }
  
  if (step === 3) {
    const category = document.querySelector('input[name="category"]:checked');
    if (!category) { showToast("用途を選んでね！", "error"); return; }
    
    const msgBox = document.getElementById('message-box');
    
    if (category.value === 'public-board') {
      nextBtn.innerHTML = '掲示板に投稿する <i class="fa-solid fa-paper-plane"></i>';
      nextBtn.onclick = submitToBoard;
      msgBox.placeholder = "議論したいテーマや意見を自由に書いてね！（自動で掲示板に掲載されます）";
    } else {
      if (category.value === 'typing-lost') {
        msgBox.placeholder = "【類型迷子 相談用テンプレート】\n◆ 自認の候補（迷っているタイプ）：\n◆ 他の人によく言われるタイプ：\n◆ 自分のここが〇〇っぽいと思うポイント：\n◆ 逆に、ここが〇〇と違って違和感があるポイント：\n\nここに自由に書いて送ってね！";
      } else if (category.value === 'note-request') {
        msgBox.placeholder = "例：『INTPの〇〇について詳しく解説して欲しいです！』『ソシオの相性論について記事を書いて欲しい！』など、リクエストを自由に書いてね！";
      } else {
        msgBox.placeholder = "ここになんでも書いてね！";
      }
    }
  }
  
  if (step === 4) {
    const msg = document.getElementById('message-box').value;
    if (msg.trim() === "") { showToast("メッセージを入力してね！", "error"); return; }
  }

  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  document.getElementById('step-' + step).classList.add('active');
}

function prevStep(step) {
  const nextBtn = document.getElementById('btn-step3-next');
  nextBtn.innerHTML = '次へ <i class="fa-solid fa-chevron-right"></i>';
  nextBtn.onclick = () => nextStep(4);

  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  document.getElementById('step-' + step).classList.add('active');
}

document.getElementById('btn-step1-next').onclick = () => nextStep(2);
document.getElementById('btn-step2-back').onclick = () => prevStep(1);
document.getElementById('btn-step2-next').onclick = () => nextStep(3);
document.getElementById('btn-step3-back').onclick = () => prevStep(2);
document.getElementById('btn-step4-back').onclick = () => prevStep(3);

function updateStep2() {
  const origin = document.querySelector('input[name="origin"]:checked').value;
  const noteOpts = document.querySelectorAll('.note-opt');
  const boardTab = document.getElementById('tab-board');
  
  const checkedCat = document.querySelector('input[name="category"]:checked');
  if (checkedCat) checkedCat.checked = false;

  if (origin === 'note') {
    noteOpts.forEach(el => el.classList.remove('hidden-option'));
    boardTab.style.display = 'flex'; 
    showToast("類型note専用の公開掲示板が解放されたよ！📢", "info");
  } else {
    noteOpts.forEach(el => el.classList.add('hidden-option'));
    boardTab.style.display = 'none'; 
  }
}
document.querySelectorAll('input[name="origin"]').forEach(radio => {
  radio.addEventListener('change', updateStep2);
});

function updateReplyOptions() {
  const replyType = document.querySelector('input[name="reply-type"]:checked').value;
  const siteOpts = document.getElementById('site-options');
  const emailOpts = document.getElementById('email-options');
  const passInput = document.querySelector('input[name="password"]');
  const contactInput = document.querySelector('input[name="contact"]');

  siteOpts.style.display = 'none';
  emailOpts.style.display = 'none';
  passInput.removeAttribute('required');
  contactInput.removeAttribute('required');

  if (replyType === 'site') {
    siteOpts.style.display = 'block';
    passInput.setAttribute('required', 'true');
  } else if (replyType === 'email') {
    emailOpts.style.display = 'block';
    contactInput.setAttribute('required', 'true');
  }
}
document.querySelectorAll('input[name="reply-type"]').forEach(radio => {
  radio.addEventListener('change', updateReplyOptions);
});


// --- 🔒 削除機能用：自分が投稿したIDリスト ---
function getMyPostIds() {
  const ids = localStorage.getItem('mofu_my_post_ids');
  return ids ? JSON.parse(ids) : [];
}
function addMyPostId(id) {
  const ids = getMyPostIds();
  ids.push(id);
  localStorage.setItem('mofu_my_post_ids', JSON.stringify(ids));
}


// --- 📢 公開掲示板機能（GAS連動） ---
async function loadBoardPosts() {
  const container = document.getElementById('board-posts-list');
  container.innerHTML = "<p style='text-align:center;'>ロード中...☁️</p>";
  
  const res = await callGAS({ action: "getBoardPosts" });
  if (res.status !== "success") {
    container.innerHTML = "<p style='text-align:center;'>掲示板の読み込みに失敗しました。</p>";
    return;
  }

  const posts = res.posts;
  const myPostIds = getMyPostIds();
  container.innerHTML = "";
  
  if (posts.length === 0) {
    container.innerHTML = "<p style='text-align:center; color:#887a7e;'>まだスレッドはありません。</p>";
    return;
  }
  
  posts.slice().reverse().forEach(post => {
    const el = document.createElement('div');
    el.className = 'board-post';
    
    const deleteBtnHtml = myPostIds.includes(post.id) 
      ? `<button class="btn-delete" onclick="deleteBoardPost(${post.id})" title="このスレッドを削除"><i class="fa-solid fa-trash-can"></i></button>`
      : '';

    let repliesHtml = "";
    if (post.replies && post.replies.length > 0) {
      repliesHtml += `<div class="replies-container">`;
      post.replies.forEach(reply => {
        const replyDeleteBtn = myPostIds.includes(reply.id)
          ? `<button class="btn-delete" onclick="deleteReply(${post.id}, ${reply.id})" style="font-size:0.8rem;" title="この返信を削除"><i class="fa-solid fa-trash-can"></i></button>`
          : '';
          
        repliesHtml += `
          <div class="reply-item">
            <div class="reply-header">
              <span>匿名返信 💭</span>
              <div>
                <span>${reply.date}</span>
                ${replyDeleteBtn}
              </div>
            </div>
            <div class="reply-body">${escapeHTML(reply.text)}</div>
          </div>
        `;
      });
      repliesHtml += `</div>`;
    }

    el.innerHTML = `
      <div class="board-post-header">
        <span>匿名スレッド 📢</span>
        <div>
          <span style="margin-right:8px;">${post.date}</span>
          ${deleteBtnHtml}
        </div>
      </div>
      <div class="board-post-body">${escapeHTML(post.text)}</div>
      ${repliesHtml}
      <form class="reply-form" onsubmit="submitReply(event, ${post.id})">
        <textarea id="reply-input-${post.id}" placeholder="このスレに匿名返信する" required></textarea>
        <button type="submit" class="btn-reply-send">返信する</button>
      </form>
    `;
    container.appendChild(el);
  });
}

async function submitToBoard() {
  const msg = document.getElementById('message-box').value;
  if (msg.trim() === "") { showToast("投稿内容を入力してね！", "error"); return; }
  
  const newId = Date.now();
  showToast("投稿中...☁️", "info");
  
  const res = await callGAS({ action: "submitToBoard", id: newId, text: msg });

  if (res.status === "success") {
    addMyPostId(newId);
    showToast("掲示板に新スレッドを立ち上げたよ！📢", "success");
    document.getElementById('contact-form').reset();
    prevStep(1); 
    switchTab('board-section');
  } else {
    showToast("投稿に失敗しました。", "error");
  }
}

async function submitReply(event, postId) {
  event.preventDefault();
  const input = document.getElementById(`reply-input-${postId}`);
  const text = input.value.trim();
  if (!text) return;

  const replyId = Date.now();
  showToast("返信中...☁️", "info");

  const res = await callGAS({ action: "submitReply", postId: postId, replyId: replyId, text: text });

  if (res.status === "success") {
    addMyPostId(replyId);
    showToast("匿名返信を送信しました！💬", "success");
    input.value = "";
    loadBoardPosts();
  } else {
    showToast("返信に失敗しました。", "error");
  }
}

window.deleteBoardPost = function(postId) {
  showConfirmModal("このスレッドを削除すると、スレッド内の返信もすべて消えちゃうよ。本当に削除する？", async function() {
    showToast("削除中...🧹", "info");
    const res = await callGAS({ action: "deleteBoardPost", postId: postId });
    if (res.status === "success") {
      showToast("スレッドを削除しました🧹", "info");
      loadBoardPosts();
    } else {
      showToast("削除に失敗しました。", "error");
    }
  });
};

window.deleteReply = function(postId, replyId) {
  showConfirmModal("この返信メッセージを本当に消しちゃう？", async function() {
    showToast("削除中...🧹", "info");
    const res = await callGAS({ action: "deleteReply", postId: postId, replyId: replyId });
    if (res.status === "success") {
      showToast("返信を削除しました🧹", "info");
      loadBoardPosts();
    } else {
      showToast("削除に失敗しました。", "error");
    }
  });
};


// --- 📊 アンケート機能（GAS連動） ---
function switchSurveySubTab(subId) {
  document.querySelectorAll('.survey-sub-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.survey-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`survey-${subId}-container`).classList.add('active');
  document.getElementById(`subtab-${subId}`).classList.add('active');
}
document.getElementById('subtab-list').onclick = () => switchSurveySubTab('list');
document.getElementById('subtab-create').onclick = () => switchSurveySubTab('create');

function addSurveyOptionInput() {
  const container = document.getElementById('survey-options-inputs');
  const count = container.querySelectorAll('input').length + 1;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'survey-opt-input';
  input.placeholder = `選択肢${count}`;
  input.style.marginTop = '8px';
  container.appendChild(input);
}
document.getElementById('btn-add-survey-opt').onclick = addSurveyOptionInput;

// ★ URLパラメータを解析して、特定のアンケートだけを表示する機能を強化！
async function loadSurveys() {
  const list = document.getElementById('survey-list');
  list.innerHTML = "<p style='text-align:center;'>ロード中...☁️</p>";
  
  const res = await callGAS({ action: "getSurveys" });
  if (res.status !== "success") {
    list.innerHTML = "<p style='text-align:center;'>アンケートの読み込みに失敗しました。</p>";
    return;
  }

  const surveys = res.surveys;
  const votedList = getVotedSurveys();
  list.innerHTML = "";
  
  if (surveys.length === 0) {
    list.innerHTML = "<p style='text-align:center; color:#887a7e;'>アンケートはありません。</p>";
    return;
  }

  // 🔍 URLから ?id=sv-XXXX を探す
  const urlParams = new URLSearchParams(window.location.search);
  const targetId = urlParams.get('id');

  // 【A】もし特定のアンケートURLからアクセスされた場合（単体表示モード）
  if (targetId && targetId.startsWith("sv-")) {
    const targetSurvey = surveys.find(s => s.id === targetId);
    
    if (targetSurvey) {
      // 非公開でも、IDを知っていれば表示する！
      renderSurveyCard(targetSurvey, votedList, list, true);
      
      // 一覧に戻るボタンを追加
      const backBtn = document.createElement('button');
      backBtn.className = "btn btn-back";
      backBtn.style.width = "100%";
      backBtn.style.marginTop = "15px";
      backBtn.innerHTML = "<i class='fa-solid fa-list'></i> 他のアンケート一覧を見る";
      backBtn.onclick = () => {
        // URLの ?id=... を消して、一覧を再読み込み
        window.history.pushState({}, document.title, window.location.pathname);
        loadSurveys();
      };
      list.appendChild(backBtn);
      return; // ここで処理を終了して、他のアンケートは出さない
    } else {
      showToast("指定されたアンケートが見つからなかったよ💦", "error");
      // 見つからなかったらURLを綺麗にして普通の一覧へ
      window.history.pushState({}, document.title, window.location.pathname);
    }
  }
  
  // 【B】通常の一覧表示モード（非公開は出さない）
  surveys.forEach((survey) => {
    if (survey.isPublic === false) return; 
    renderSurveyCard(survey, votedList, list, false);
  });
}

// アンケートのカードを作る処理（共通化してスッキリさせたよ！）
function renderSurveyCard(survey, votedList, container, isSingleView) {
  const totalVotes = survey.options.reduce((sum, opt) => sum + opt.votes, 0);
  const hasVoted = votedList.includes(survey.id);
  
  const card = document.createElement('div');
  card.className = "survey-card";
  
  // 秘密のアンケートを単体表示している場合はバッジをつける
  const secretBadge = (!survey.isPublic && isSingleView) 
    ? `<span style="background:#ff9db0; color:white; font-size:0.7rem; padding:2px 6px; border-radius:5px; margin-bottom:5px; display:inline-block;">🤫 秘密のアンケート</span><br>` 
    : "";
  
  let contentHtml = "";
  
  if (hasVoted) {
    survey.options.forEach((opt) => {
      const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
      contentHtml += `
        <div class="survey-bar-bg">
          <div class="survey-bar-fill" style="width: ${percentage}%"></div>
          <div class="survey-opt-text">
            <span>${opt.text}</span>
            <span>${opt.votes}票 (${percentage}%)</span>
          </div>
        </div>
      `;
    });
    contentHtml += `<div style="font-size: 0.8rem; color: #887a7e; margin-top: 5px;">投票ありがとうございます！ (合計: ${totalVotes}票)</div>`;
  } else {
    let radioButtons = "";
    survey.options.forEach((opt, idx) => {
      radioButtons += `
        <label class="survey-vote-option-label">
          <input type="radio" name="vote-choice-${survey.id}" value="${idx}">
          <span>${opt.text}</span>
        </label>
      `;
    });
    
    contentHtml += `
      <form onsubmit="submitVote(event, '${survey.id}')">
        <div class="choice-grid" style="gap:5px; margin-bottom:12px;">
          ${radioButtons}
        </div>
        <button type="submit" class="btn btn-next" style="padding: 10px; font-size:0.9rem;"><i class="fa-solid fa-vote-yea"></i> 投票を送信する</button>
      </form>
    `;
  }
  
  card.innerHTML = `
    ${secretBadge}
    <h4>${survey.title}</h4>
    ${contentHtml}
    <button class="survey-share-btn" onclick="shareSurvey('${survey.id}')">
      <i class="fa-solid fa-share-nodes"></i> SNSに共有する
    </button>
    <div style="clear:both;"></div>
  `;
  container.appendChild(card);
}

window.submitVote = async function(event, surveyId) {
  event.preventDefault();
  const choice = document.querySelector(`input[name="vote-choice-${surveyId}"]:checked`);
  
  if (!choice) { showToast("投票する選択肢を選んでね！", "error"); return; }
  
  const optIdx = parseInt(choice.value);
  showToast("投票送信中...📊", "info");
  
  const res = await callGAS({ action: "submitVote", surveyId: surveyId, optIdx: optIdx });

  if (res.status === "success") {
    addVotedSurvey(surveyId);
    showToast("投票が完了しました！結果をご覧ください📊", "success");
    loadSurveys();
  } else {
    showToast("投票に失敗しました。", "error");
  }
};

async function createNewSurvey() {
  const title = document.getElementById('new-survey-title').value;
  const optionInputs = document.querySelectorAll('.survey-opt-input');
  const isPublic = document.getElementById('new-survey-public').checked;
  
  if (!title.trim()) { showToast("タイトルを入力してね！", "error"); return; }
  
  const options = [];
  optionInputs.forEach(input => {
    if (input.value.trim()) {
      options.push({ text: input.value.trim(), votes: 0 });
    }
  });
  
  if (options.length < 2) { showToast("選択肢は最低2つ作ってね！", "error"); return; }
  
  showToast("作成中...📊", "info");
  const newId = "sv-" + Math.floor(1000 + Math.random() * 9000);

  const res = await callGAS({
    action: "createNewSurvey",
    id: newId,
    title: title,
    options: options,
    isPublic: isPublic
  });

  if (res.status === "success") {
    // フォームをリセット
    document.getElementById('new-survey-title').value = "";
    document.getElementById('survey-options-inputs').innerHTML = `
      <input type="text" class="survey-opt-input" placeholder="選択肢1" required>
      <input type="text" class="survey-opt-input" placeholder="選択肢2" required>
    `;
    document.getElementById('new-survey-public').checked = true;
    
    // 一覧を再読み込みしてタブを切り替え
    switchSurveySubTab('list');
    loadSurveys();
    
    // 【★追加】URL共有モーダルを表示する
    showShareModal(newId, isPublic);

  } else {
    showToast("作成に失敗しました。", "error");
  }
}

// ボタンにイベントを再登録
document.getElementById('btn-submit-new-survey').onclick = createNewSurvey;

// --- 🔗 共有モーダルの制御（新規追加） ---
function showShareModal(surveyId, isPublic) {
  const modal = document.getElementById('share-modal');
  const urlInput = document.getElementById('share-url-input');
  const msg = document.getElementById('share-modal-message');
  
  // 共有用のURL（※自分のGitHub PagesのURLに合わせてね）
  const shareUrl = `https://mofu-mitsu.github.io/mofumofu-room/?id=${surveyId}`;
  urlInput.value = shareUrl;
  
  if (isPublic) {
    msg.innerHTML = "アンケートを<b>全体公開</b>で作成したよ！<br>以下のリンクからSNSなどにも共有できます📊";
  } else {
    msg.innerHTML = "<b>非公開（秘密）</b>で作成したよ！<br>このリンクを知っている人だけが投票できます🤫<br><span style='color:#ff9494; font-weight:bold; font-size:0.8rem;'>※一覧には表示されないので、必ず今コピーしてね！</span>";
  }
  
  modal.classList.add('active');
  
  // コピーボタンの処理
  document.getElementById('share-copy-btn').onclick = function() {
    // スマホでも確実にコピーできるようにinputを選択
    urlInput.select();
    urlInput.setSelectionRange(0, 99999); 
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast("リンクをコピーしました！🔗", "success");
    }).catch(() => {
      // クリップボードAPIが失敗した時のバックアップ
      document.execCommand("copy");
      showToast("リンクをコピーしました！🔗", "success");
    });
  };
  
  // 閉じるボタンの処理
  document.getElementById('share-close-btn').onclick = function() {
    modal.classList.remove('active');
  };
}
window.shareSurvey = function(surveyId) {
  const dummyLink = `https://mofu-mitsu.github.io/mofumofu-room/?id=${surveyId}`;
  navigator.clipboard.writeText(dummyLink).then(() => {
    showToast("アンケートの共有リンクをコピーしました！🔗", "success");
  }).catch(() => {
    showToast("コピーに失敗しちゃいました💦", "error");
  });
};


// --- 🚪 ログイン & チャット処理（GAS連動） ---
document.getElementById('login-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const roomId = document.getElementById('login-id').value.trim();
  const roomPass = document.getElementById('login-pass').value.trim();
  
  showToast("入室しています...🔑", "info");
  
  const res = await callGAS({
    action: "loginRoom",
    id: roomId,
    password: roomPass
  });

  if (res.status === "admin_success") {
    // 【★管理者ダッシュボードログイン成功】
    isAdminMode = true;
    currentRoomPass = roomPass; // 管理者パスワードを保持
    switchTab('admin-section');
    renderAdminDashboard(res.inquiries);
    showToast("管理者ダッシュボードを開きました🧸⚙️", "success");
  } else if (res.status === "success") {
    // 【通常ユーザーログイン成功】
    isAdminMode = false;
    currentRoomId = roomId;
    currentRoomPass = roomPass;
    document.getElementById('room-title-id').textContent = roomId.toUpperCase();
    switchTab('room-section');
    renderChatMessages(res.replies);
    showToast("お部屋に入室しました🧸", "success");
  } else {
    showToast(res.message, "error");
  }
  this.reset();
});

// 管理者ダッシュボードの表示
function renderAdminDashboard(inquiries) {
  const list = document.getElementById('admin-inquiries-list');
  list.innerHTML = "";
  
  if (inquiries.length === 0) {
    list.innerHTML = "<p style='text-align:center; color:#887a7e;'>お問い合わせはありません。</p>";
    return;
  }
  
  // 新しいお問い合わせ順（逆順）に並べる
  inquiries.slice().reverse().forEach(item => {
    const isSiteRoom = item.replyType === "site";
    const badgeHtml = isSiteRoom ? `<span class="admin-badge">🚪 お部屋</span>` : `<span class="admin-badge" style="background:#887a7e;">👻 完了</span>`;
    
    const card = document.createElement('div');
    card.className = "admin-item";
    card.onclick = () => enterRoomAsAdmin(item.id, item.replies);
    
    card.innerHTML = `
      <div class="admin-item-header">
        <span>番号: ${item.id} (${item.date})</span>
        ${badgeHtml}
      </div>
      <div class="admin-item-title">
        ${item.origin.toUpperCase()} ＞ ${item.category}
      </div>
      <div class="admin-item-preview">
        内容: ${escapeHTML(item.message)}
      </div>
    `;
    list.appendChild(card);
  });
}

// 管理人としてお部屋に入る
function enterRoomAsAdmin(roomId, replies) {
  isAdminMode = true;
  currentRoomId = roomId;
  document.getElementById('room-title-id').textContent = `⚙️ ${roomId.toUpperCase()} (管理者)`;
  switchTab('room-section');
  renderChatMessages(replies);
}

function renderChatMessages(replies) {
  const box = document.getElementById('chat-window-box');
  box.innerHTML = `<div class="chat-bubble them">初めまして！お部屋が読み込まれました。メッセージをここからやり取りできます。🧸</div>`;
  
  replies.forEach(msg => {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${msg.sender === 'user' ? 'me' : 'them'}`;
    
    // 管理人ログインしている場合は、自分がthemで相手（user）がme。ユーザーログインしている場合はその逆
    const isMe = (isAdminMode && msg.sender === 'admin') || (!isAdminMode && msg.sender === 'user');
    bubble.className = `chat-bubble ${isMe ? 'me' : 'them'}`;
    
    bubble.innerHTML = `${escapeHTML(msg.text)}<div style="font-size:0.65rem; color:#ccc; text-align:right; margin-top:4px;">${msg.date}</div>`;
    box.appendChild(bubble);
  });
  box.scrollTop = box.scrollHeight;
}

// チャットメッセージ送信（管理者対応）
async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || !currentRoomId) return;
  
  showToast("送信中...☁️", "info");

  const res = await callGAS({
    action: "sendChatMessage",
    id: currentRoomId,
    password: currentRoomPass, // 通常はルームの合言葉、管理者時は管理者パスワード
    sender: isAdminMode ? "admin" : "user",
    text: text
  });

  if (res.status === "success") {
    renderChatMessages(res.replies);
    input.value = "";
    showToast("メッセージを送信したよ！🔔", "success");
  } else {
    showToast("送信に失敗しました。", "error");
  }
}
document.getElementById('btn-send-chat').onclick = sendChatMessage;

// 退出処理
document.getElementById('btn-leave-room').onclick = function() {
  if (isAdminMode) {
    // 管理者の場合はチャットからダッシュボードに戻る
    currentRoomId = null;
    showToast("管理者メニューに戻ります。", "info");
    switchTab('admin-section');
    // 最新情報を再読み込み
    reloadAdminDashboard();
  } else {
    // ユーザーの場合はチャットから退出してログインへ
    currentRoomId = null;
    currentRoomPass = null;
    switchTab('login-section');
    showToast("お部屋から退出しました。", "info");
  }
};

// 管理者ログアウト
document.getElementById('btn-admin-logout').onclick = function() {
  currentRoomId = null;
  currentRoomPass = null;
  isAdminMode = false;
  switchTab('login-section');
  showToast("管理者メニューからログアウトしました。", "info");
};

// 管理者ダッシュボード再読み込み用
async function reloadAdminDashboard() {
  const res = await callGAS({
    action: "loginRoom",
    id: "ADMIN",
    password: currentRoomPass
  });
  if (res.status === "admin_success") {
    renderAdminDashboard(res.inquiries);
  }
}


// --- 📩 問い合わせ送信処理（完了画面切り替え） ---
document.getElementById('contact-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const replyType = document.querySelector('input[name="reply-type"]:checked').value;
  const origin = document.querySelector('input[name="origin"]:checked').value;
  const category = document.querySelector('input[name="category"]:checked').value;
  const message = document.getElementById('message-box').value;
  const password = document.querySelector('input[name="password"]').value;
  const notifyEmail = document.querySelector('input[name="notify_email"]').value;
  const contact = document.querySelector('input[name="contact"]').value;

  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const generatedId = `MFM-${randomNum}`;

  showToast("送信中...☁️", "info");

  const res = await callGAS({
    action: "sendInquiry",
    id: generatedId,
    origin: origin,
    category: category,
    message: message,
    replyType: replyType,
    password: password,
    notify_email: notifyEmail,
    contact: contact
  });

  if (res.status === "success") {
    document.getElementById('contact-form').reset();
    prevStep(1); // フォームをStep1に初期化
    
    if (replyType === 'site') {
      // サイト内やり取り（ミニDM）の場合：番号付き完了画面へ
      document.getElementById('generated-id').textContent = generatedId;
      showToast("送信が成功してお部屋ができたよ！🔑", "success");
      document.getElementById('form-section').classList.remove('active');
      document.getElementById('success-site-section').classList.add('active');
    } else {
      // 返信不要 / メール希望の場合：通常の完了画面へ
      showToast("送信が完了しました！🌸", "success");
      document.getElementById('form-section').classList.remove('active');
      document.getElementById('success-normal-section').classList.add('active');
    }
  } else {
    showToast("送信に失敗しました。", "error");
  }
});


// --- 📋 コピー機能 ---
document.getElementById('btn-copy-id').onclick = function() {
  const idText = document.getElementById('generated-id').textContent;
  navigator.clipboard.writeText(idText).then(() => {
    showToast(`お問い合わせ番号「${idText}」をコピーしたよ！📋`, "success");
  }).catch(() => {
    showToast("コピーに失敗しちゃった…💦", "error");
  });
};


// ヘルパー関数
function getVotedSurveys() {
  const voted = localStorage.getItem('mofu_voted_surveys');
  return voted ? JSON.parse(voted) : [];
}
function addVotedSurvey(id) {
  const voted = getVotedSurveys();
  voted.push(id);
  localStorage.setItem('mofu_voted_surveys', JSON.stringify(voted));
}
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

window.onload = function() {
  // URLにアンケートIDが含まれているかチェック！
  const urlParams = new URLSearchParams(window.location.search);
  const targetId = urlParams.get('id');
  
  // もし共有リンクから飛んできた場合は、自動で「アンケート」タブを開く！
  if (targetId && targetId.startsWith("sv-")) {
    switchTab('survey-section');
  }
  
  if (GAS_API_URL && !GAS_API_URL.startsWith("ここに")) {
    loadBoardPosts();
    loadSurveys();
  } else {
    showToast("「app.js」の一行目にGASのウェブアプリURLを貼り付けてね！☁️", "info");
  }
};

window.resetToTop = function() {
  document.getElementById('contact-form').reset(); // フォームの中身を空にする
  
  // 強制的にStep 1に戻す
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  document.getElementById('step-1').classList.add('active');
  
  // 「新しく送る」タブに切り替える
  switchTab('form-section'); 
  
  // 画面の一番上にスクロールする
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

document.getElementById('chat-input').addEventListener('keydown', function(e) {
  // 日本語入力中の変換のEnterは無視する
  if (e.isComposing || e.keyCode === 229) {
    return;
  }
  
  // Enter単体押しの場合、改行せずに送信する
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault(); // テキストエリア内の改行を防ぐ
    sendChatMessage();  // 送信処理を呼び出す
  }
});
