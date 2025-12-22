import React, { useState, useEffect } from "react";
import StatusBar from "./StatusBar";
import Classroom from "./Classroom";
import Legend from "./Legend";
import TicketDetailModal from "./TicketDetailModal";

export interface Ticket {
  id: number;
  subject: string;
  project: {
    id: number;
    name: string;
  };
  tracker: {
    id: number;
    name: string;
  };
  status: {
    id: number;
    name: string;
  };
  priority?: {
    id: number;
    name: string;
  };
  author?: {
    id: number;
    name: string;
  };
  created_on?: string;
  updated_on?: string;
  description?: string;
}

interface RedmineData {
  issues: Ticket[];
}

const UPDATE_INTERVAL = 10000; // 10秒

function extractSeatNumber(projectName: string): number | null {
  const match = projectName.match(/組み込みシステム基礎\s*\((\d+)\)/);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 80) {
      return num;
    }
  }
  return null;
}

export default function App() {
  const [highlightedSeats, setHighlightedSeats] = useState<Set<number>>(new Set());
  const [seatTickets, setSeatTickets] = useState<Map<number, Ticket[]>>(new Map());
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [status, setStatus] = useState({ text: "接続中...", type: "active" });
  const [lastUpdate, setLastUpdate] = useState("--:--:--");
  const [ticketCount, setTicketCount] = useState(0);

  const fetchRedmineData = async () => {
    try {
      setStatus({ text: "接続中...", type: "active" });

      const response = await fetch("/api/tickets");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RedmineData = await response.json();

      const seatNumbers = new Set<number>();
      const ticketsBySeat = new Map<number, Ticket[]>();

      if (data.issues && Array.isArray(data.issues)) {
        data.issues.forEach((issue) => {
          if (issue.project && issue.project.name) {
            const seatNum = extractSeatNumber(issue.project.name);
            if (seatNum !== null) {
              seatNumbers.add(seatNum);

              if (!ticketsBySeat.has(seatNum)) {
                ticketsBySeat.set(seatNum, []);
              }
              ticketsBySeat.get(seatNum)?.push(issue);
            }
          }
        });
      }

      setHighlightedSeats(seatNumbers);
      setSeatTickets(ticketsBySeat);
      setStatus({ text: "正常", type: "active" });
      setTicketCount(data.issues?.length || 0);

      const now = new Date();
      setLastUpdate(now.toLocaleTimeString("ja-JP"));
    } catch (error) {
      console.error("データ取得エラー:", error);
      setStatus({ text: `エラー: ${(error as Error).message}`, type: "error" });
    }
  };

  useEffect(() => {
    fetchRedmineData();
    const interval = setInterval(fetchRedmineData, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleSeatClick = (seatNum: number) => {
    setSelectedSeat(seatNum);
  };

  const handleCloseModal = () => {
    setSelectedSeat(null);
  };

  return (
    <>
      <h1>2025年度 プロジェクト実習（組み込みシステム基礎）座席表</h1>

      <StatusBar status={status} lastUpdate={lastUpdate} ticketCount={ticketCount} />

      <div className="container">
        <Classroom
          title="6-301"
          seatGroups={[
            { seats: [1, 2, 3, 4, 5, 6, 7, 8], colorClass: "blue-1" },
            { seats: [9, 10, 11, 12], colorClass: "blue-1", marginTop: true },
            { seats: [13, 14, 15, 16], colorClass: "pink-1" },
            { seats: [17, 18, 19, 20, 21, 22, 23, 24], colorClass: "pink-1", marginTop: true },
          ]}
          seatGroups2={[
            { seats: [25, 26, 27, 28, 29, 30, 31, 32], colorClass: "green-1" },
            { seats: [33, 34, 35, 36], colorClass: "green-1", marginTop: true },
            { seats: [37, 38, 39, 40], colorClass: "purple-1" },
            { seats: [41, 42, 43, 44, 45, 46, 47, 48], colorClass: "purple-1", marginTop: true },
          ]}
          highlightedSeats={highlightedSeats}
          seatTickets={seatTickets}
          onSeatClick={handleSeatClick}
        />

        <Classroom
          title="8-312"
          seatGroups={[
            { seats: [49, 50, 51, 52], colorClass: "blue-2" },
            { seats: [53, 54, 55, 56], colorClass: "blue-2", marginTop: true },
            { seats: [57, 58, 59, 60], colorClass: "blue-2", marginTop: true },
          ]}
          seatGroups2={[
            { seats: [61, 62, 63, 64], colorClass: "blue-2" },
            { seats: [65, 66, 67, 68], colorClass: "orange-1", marginTop: true },
            { seats: [69, 70, 71, 72], colorClass: "orange-2", marginTop: true },
          ]}
          seatGroups3={[
            { seats: [73, 74, 75, 76], colorClass: "orange-1", marginTop: 84 },
            { seats: [77, 78, 79, 80], colorClass: "orange-1", marginTop: true },
          ]}
          highlightedSeats={highlightedSeats}
          seatTickets={seatTickets}
          onSeatClick={handleSeatClick}
        />
      </div>

      <Legend />

      {selectedSeat !== null && (
        <TicketDetailModal
          seatNumber={selectedSeat}
          tickets={seatTickets.get(selectedSeat) || []}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
