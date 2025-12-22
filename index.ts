import index from "./index.html";

// ===== 設定 =====
const REDMINE_URL = process.env.REDMINE_URL || "https://vps2.is.kit.ac.jp/redmine";
const API_KEY = process.env.REDMINE_API_KEY || "";
const TRACKER_ID = parseInt(process.env.TRACKER_ID || "5", 10); // 課題
const STATUS_ID = parseInt(process.env.STATUS_ID || "4", 10); // 審査待ち

// ===== Redmine APIからデータ取得 =====
async function fetchRedmineTickets() {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("APIキーが設定されていません");
  }

  const response = await fetch(
    `${REDMINE_URL}/issues.json?tracker_id=${TRACKER_ID}&status_id=${STATUS_ID}&limit=100`,
    {
      headers: {
        "X-Redmine-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// ===== チケットステータスを更新 =====
async function updateTicketStatus(ticketId: number, statusId: number) {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("APIキーが設定されていません");
  }

  const response = await fetch(
    `${REDMINE_URL}/issues/${ticketId}.json`,
    {
      method: "PUT",
      headers: {
        "X-Redmine-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        issue: {
          status_id: statusId,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
  }

  return response.status === 204 ? { success: true } : await response.json();
}

// ===== Bunサーバー起動 =====
Bun.serve({
  port: 3000,
  routes: {
    "/": index,
    "/api/tickets": {
      GET: async () => {
        try {
          const data = await fetchRedmineTickets();
          return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("API Error:", error);
          return new Response(
            JSON.stringify({
              error: (error as Error).message,
              issues: [],
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
    "/api/tickets/:id/approve": {
      PUT: async (req) => {
        try {
          const ticketId = parseInt(req.params.id, 10);
          const APPROVED_STATUS_ID = 3; // 審査通過

          await updateTicketStatus(ticketId, APPROVED_STATUS_ID);

          return new Response(
            JSON.stringify({ success: true, message: "チケットを審査通過に変更しました" }),
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (error) {
          console.error("Update Error:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error: (error as Error).message,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log("🚀 Server running at http://localhost:3000");
console.log(`📊 Redmine URL: ${REDMINE_URL}`);
console.log(`🔑 API Key configured: ${API_KEY ? "✓" : "✗"}`);
