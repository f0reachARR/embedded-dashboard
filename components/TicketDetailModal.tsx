import React, { useState, useEffect } from "react";
import type { Ticket } from "./App";

interface TicketDetailModalProps {
  seatNumber: number;
  onClose: () => void;
  onTicketApproved: () => void;
}

export default function TicketDetailModal({ seatNumber, onClose, onTicketApproved }: TicketDetailModalProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingTickets, setApprovingTickets] = useState<Set<number>>(new Set());
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // チケット取得の共通処理
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tickets/seat/${seatNumber}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTickets(data.issues || []);
    } catch (error) {
      console.error("Failed to fetch seat tickets:", error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    fetchTickets();
  }, [seatNumber]);

  // ステータスごとにグループ化
  const groupedTickets = tickets.reduce((acc, ticket) => {
    const statusName = ticket.status.name;
    if (!acc[statusName]) {
      acc[statusName] = [];
    }
    acc[statusName].push(ticket);
    return acc;
  }, {} as Record<string, Ticket[]>);
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleApprove = async (ticketId: number) => {
    setApprovingTickets(prev => new Set(prev).add(ticketId));
    setNotification(null);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/approve`, {
        method: "PUT",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "ステータスの更新に失敗しました");
      }

      setNotification({
        type: "success",
        message: `チケット #${ticketId} を審査通過に変更しました`,
      });

      // チケットを再取得（共通処理を使用）
      await fetchTickets();

      // 親コンポーネントに通知（審査待ち一覧の更新用）
      onTicketApproved();

      // 1.5秒後に成功メッセージをクリア
      setTimeout(() => {
        setNotification(null);
      }, 1500);
    } catch (error) {
      console.error("Approval error:", error);
      setNotification({
        type: "error",
        message: `エラー: ${(error as Error).message}`,
      });
    } finally {
      setApprovingTickets(prev => {
        const next = new Set(prev);
        next.delete(ticketId);
        return next;
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>座席 {seatNumber} の審査待ちチケット</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {notification && (
            <div className={`notification ${notification.type}`}>
              {notification.message}
            </div>
          )}

          {loading ? (
            <div className="loading-indicator">
              <p>チケットを読み込み中...</p>
            </div>
          ) : tickets.length === 0 ? (
            <p className="no-tickets">このプロジェクトにチケットはありません</p>
          ) : (
            <div className="ticket-list">
              {Object.entries(groupedTickets).map(([statusName, statusTickets]) => (
                <div key={statusName} className="status-group">
                  <h3 className="status-group-header">
                    {statusName} ({statusTickets.length}件)
                  </h3>
                  {statusTickets.map((ticket) => (
                    <div key={ticket.id} className="ticket-card">
                      <div className="ticket-card-header">
                        <span className="ticket-id">#{ticket.id}</span>
                        <span className="ticket-priority">{ticket.priority?.name || "通常"}</span>
                      </div>
                      <h3 className="ticket-subject">{ticket.subject}</h3>
                      <div className="ticket-meta">
                        <div className="ticket-meta-item">
                          <span className="meta-label">トラッカー:</span>
                          <span className="meta-value">{ticket.tracker.name}</span>
                        </div>
                        <div className="ticket-meta-item">
                          <span className="meta-label">ステータス:</span>
                          <span className="meta-value">{ticket.status.name}</span>
                        </div>
                        <div className="ticket-meta-item">
                          <span className="meta-label">担当者:</span>
                          <span className="meta-value">{ticket.author?.name || "未設定"}</span>
                        </div>
                        <div className="ticket-meta-item">
                          <span className="meta-label">作成日:</span>
                          <span className="meta-value">{formatDate(ticket.created_on)}</span>
                        </div>
                        <div className="ticket-meta-item">
                          <span className="meta-label">更新日:</span>
                          <span className="meta-value">{formatDate(ticket.updated_on)}</span>
                        </div>
                      </div>
                      {ticket.description && (
                        <div className="ticket-description">
                          <span className="meta-label">説明:</span>
                          <p>{ticket.description}</p>
                        </div>
                      )}
                      {ticket.status.id === 4 && (
                        <div className="ticket-actions">
                          <button
                            className="approve-button"
                            onClick={() => handleApprove(ticket.id)}
                            disabled={approvingTickets.has(ticket.id)}
                          >
                            {approvingTickets.has(ticket.id) ? "処理中..." : "審査通過"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
