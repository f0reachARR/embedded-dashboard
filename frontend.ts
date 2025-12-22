// ===== 設定 =====
const UPDATE_INTERVAL = 5000; // 10秒

// ===== グローバル変数 =====
let highlightedSeats = new Set<number>();

// ===== 座席ハイライト処理 =====
function updateSeatHighlights(seatNumbers: number[]) {
  // すべてのハイライトをクリア
  document.querySelectorAll(".seat.highlight").forEach((seat) => {
    seat.classList.remove("highlight");
  });

  // 新しいハイライトを適用
  seatNumbers.forEach((num) => {
    const seat = document.querySelector(`[data-seat="${num}"]`);
    if (seat) {
      seat.classList.add("highlight");
    }
  });

  highlightedSeats = new Set(seatNumbers);
}

// ===== プロジェクト名から座席番号を抽出 =====
function extractSeatNumber(projectName: string): number | null {
  // "組み込みシステム基礎 (N)" の形式から N を抽出
  const match = projectName.match(/組み込みシステム基礎\s*\((\d+)\)/);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 80) {
      return num;
    }
  }
  return null;
}

// ===== APIからデータ取得 =====
async function fetchRedmineData() {
  try {
    updateStatus("接続中...", "active");

    // APIエンドポイントからデータ取得
    const response = await fetch("/api/tickets");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // issues.jsonから直接プロジェクト名を取得して座席番号を抽出
    const seatNumbers = new Set<number>();

    if (data.issues && Array.isArray(data.issues)) {
      data.issues.forEach((issue: any) => {
        if (issue.project && issue.project.name) {
          const seatNum = extractSeatNumber(issue.project.name);
          if (seatNum !== null) {
            seatNumbers.add(seatNum);
          }
        }
      });
    }

    // 座席をハイライト
    updateSeatHighlights(Array.from(seatNumbers));

    // ステータス更新
    updateStatus("正常", "active");
    const ticketCountEl = document.getElementById("ticketCount");
    if (ticketCountEl) {
      ticketCountEl.textContent = data.issues?.length?.toString() || "0";
    }
    updateLastUpdateTime();
  } catch (error) {
    console.error("データ取得エラー:", error);
    updateStatus(`エラー: ${(error as Error).message}`, "error");
  }
}

// ===== ステータス表示更新 =====
function updateStatus(text: string, status: string) {
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");

  if (statusDot) {
    statusDot.className = "status-dot " + status;
  }
  if (statusText) {
    statusText.textContent = text;
  }
}

function updateLastUpdateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString("ja-JP");
  const lastUpdateEl = document.getElementById("lastUpdate");
  if (lastUpdateEl) {
    lastUpdateEl.textContent = timeString;
  }
}

// ===== 初期化と定期実行 =====
function init() {
  // 初回実行
  fetchRedmineData();

  // 定期実行
  setInterval(fetchRedmineData, UPDATE_INTERVAL);
}

// ページ読み込み時に実行
window.addEventListener("DOMContentLoaded", init);
