import { Hono } from "hono";
import index from "./index.html";
import type { Ticket } from "./types";
import { extractSeatNumber } from "./utils";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

// ===== 設定 =====
const REDMINE_URL =
  process.env.REDMINE_URL || "https://vps2.is.kit.ac.jp/redmine";
const API_KEY = process.env.REDMINE_API_KEY || "";
const TRACKER_ID = parseInt(process.env.TRACKER_ID || "5", 10); // 課題
const STATUS_ID = parseInt(process.env.STATUS_ID || "4", 10); // 審査待ち
const APPROVED_STATUS_ID = parseInt(process.env.APPROVED_STATUS_ID || "3", 10); // 審査通過

interface RedmineProject {
  id: number;
  name: string;
}

// ===== Redmine APIからデータ取得 =====
async function fetchRedmineTickets(): Promise<{ issues: Ticket[] }> {
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
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// ===== 全プロジェクトを取得 =====
async function fetchAllProjects() {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("APIキーが設定されていません");
  }

  const projects: RedmineProject[] = [];
  for (let offset = 0; ; offset += 100) {
    const response = await fetch(
      `${REDMINE_URL}/projects.json?limit=100&offset=${offset}`,
      {
        headers: {
          "X-Redmine-API-Key": API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    projects.push(...data.projects);

    if (data.projects.length === 0) {
      break;
    }
  }

  return { projects };
}

const { projects } = await fetchAllProjects();
console.log(`Fetched ${projects.length} projects from Redmine.`);

// ===== 座席番号ごとの全チケット取得 =====
async function fetchAllTicketsBySeat(seatNumber: number) {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("APIキーが設定されていません");
  }

  // 1. 該当する座席のプロジェクトを見つける（extractSeatNumberを使用）
  const targetProject = projects.find((project: any) => {
    const extractedSeatNumber = extractSeatNumber(project.name);
    return extractedSeatNumber === seatNumber;
  });

  // プロジェクトが見つからない場合は空配列を返す
  if (!targetProject) {
    throw new Error(
      `Seat number ${seatNumber} に対応するプロジェクトが見つかりません`,
    );
  }

  // 2. プロジェクトIDでチケットを検索
  const issuesResponse = await fetch(
    `${REDMINE_URL}/issues.json?project_id=${targetProject.id}&tracker_id=${TRACKER_ID}&limit=100&status_id=*`,
    {
      headers: {
        "X-Redmine-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  if (!issuesResponse.ok) {
    throw new Error(`HTTP error! status: ${issuesResponse.status}`);
  }

  const issuesData: { issues: Ticket[]; total_count: number } =
    await issuesResponse.json();

  return { issues: issuesData.issues, total_count: issuesData.total_count };
}

// ===== チケットステータスを更新 =====
async function updateTicketStatus(ticketId: number, statusId: number) {
  if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("APIキーが設定されていません");
  }

  const response = await fetch(`${REDMINE_URL}/issues/${ticketId}.json`, {
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
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, body: ${errorText}`,
    );
  }

  return response.status === 204 ? { success: true } : await response.json();
}

const app = new Hono();

app.onError((err, c) => {
  console.error("Server Error:", err);
  return c.json({ success: false, error: err.message }, 500);
});

export const routes = app
  .get("/api/tickets", async (c) => {
    const data = await fetchRedmineTickets();
    return c.json(data);
  })
  .get(
    "/api/tickets/:id/approve",
    zValidator(
      "param",
      z.object({
        id: z.coerce.number().min(1),
      }),
    ),
    async (c) => {
      try {
        const ticketId = c.req.valid("param").id;

        await updateTicketStatus(ticketId, APPROVED_STATUS_ID);

        return c.json({
          success: true,
          message: "チケットを審査通過に変更しました",
        });
      } catch (error: unknown) {
        return c.json(
          {
            success: false,
            error: (error as Error).message,
          },
          500,
        );
      }
    },
  )
  .get(
    "/api/tickets/seat/:seatNumber",
    zValidator(
      "param",
      z.object({
        seatNumber: z.coerce.number().min(1).max(80),
      }),
    ),
    async (c) => {
      const seatNumber = c.req.valid("param").seatNumber;

      const data = await fetchAllTicketsBySeat(seatNumber);
      return c.json(data);
    },
  );

export type AppType = typeof routes;

// ===== Bunサーバー起動 =====
Bun.serve({
  port: 3000,
  routes: {
    "/": index,
    "/api/*": app.fetch,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log("🚀 Server running at http://localhost:3000");
console.log(`📊 Redmine URL: ${REDMINE_URL}`);
console.log(`🔑 API Key configured: ${API_KEY ? "✓" : "✗"}`);
