import index from "./index.html";
import { config, createRedmineHeaders } from "./config";
import { extractSeatNumber, isValidSeatNumber } from "./utils";
import { REDMINE_STATUS } from "./constants";

// ===== Redmine APIからデータ取得 =====
async function fetchRedmineTickets() {
  const response = await fetch(
    `${config.redmine.url}/issues.json?tracker_id=${config.redmine.trackerId}&status_id=${config.redmine.statusId}&limit=100`,
    {
      headers: createRedmineHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// ===== 座席番号ごとの全チケット取得 =====
async function fetchAllTicketsBySeat(seatNumber: number) {
  // 1. プロジェクト一覧を取得
  const projectsResponse = await fetch(
    `${config.redmine.url}/projects.json?limit=100`,
    {
      headers: createRedmineHeaders(),
    },
  );

  if (!projectsResponse.ok) {
    throw new Error(`HTTP error! status: ${projectsResponse.status}`);
  }

  const projectsData: { projects: Array<{ id: number; name: string }> } = await projectsResponse.json();

  // 2. 該当する座席のプロジェクトを見つける（extractSeatNumberを使用）
  const targetProject = projectsData.projects.find((project) => {
    const extractedSeatNumber = extractSeatNumber(project.name);
    return extractedSeatNumber === seatNumber;
  });

  // プロジェクトが見つからない場合は空配列を返す
  if (!targetProject) {
    return { issues: [], total_count: 0 };
  }

  // 3. プロジェクトIDでチケットを検索
  const issuesResponse = await fetch(
    `${config.redmine.url}/issues.json?project_id=${targetProject.id}&tracker_id=${config.redmine.trackerId}&limit=100&status_id=*`,
    {
      headers: createRedmineHeaders(),
    },
  );

  if (!issuesResponse.ok) {
    throw new Error(`HTTP error! status: ${issuesResponse.status}`);
  }

  const issuesData = await issuesResponse.json();

  return { issues: issuesData.issues, total_count: issuesData.total_count };
}

// ===== チケットステータスを更新 =====
async function updateTicketStatus(ticketId: number, statusId: number) {
  const response = await fetch(`${config.redmine.url}/issues/${ticketId}.json`, {
    method: "PUT",
    headers: createRedmineHeaders(),
    body: JSON.stringify({
      issue: {
        status_id: statusId,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`,
    );
  }

  return response.status === 204 ? { success: true } : await response.json();
}

// ===== Bunサーバー起動 =====
Bun.serve({
  port: config.server.port,
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
            },
          );
        }
      },
    },
    "/api/tickets/:id/approve": {
      PUT: async (req) => {
        try {
          const ticketId = parseInt(req.params.id, 10);

          await updateTicketStatus(ticketId, REDMINE_STATUS.APPROVED);

          return new Response(
            JSON.stringify({
              success: true,
              message: "チケットを審査通過に変更しました",
            }),
            {
              headers: { "Content-Type": "application/json" },
            },
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
            },
          );
        }
      },
    },
    "/api/tickets/seat/:seatNumber": {
      GET: async (req) => {
        try {
          const seatNumber = parseInt(req.params.seatNumber, 10);

          if (!isValidSeatNumber(seatNumber)) {
            return new Response(
              JSON.stringify({ error: "Invalid seat number", issues: [] }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const data = await fetchAllTicketsBySeat(seatNumber);
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
            },
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

console.log(`🚀 Server running at http://localhost:${config.server.port}`);
console.log(`📊 Redmine URL: ${config.redmine.url}`);
console.log(`🔑 API Key configured: ✓`);
