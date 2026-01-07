import { useState, useEffect, useCallback } from "react";
import type { Ticket } from "./App";
import { formatDate } from "../utils";
import { REDMINE_STATUS, API_ENDPOINTS } from "../constants";

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
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.TICKET_BY_SEAT(seatNumber));
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
  }, [seatNumber]);

  // 初回読み込み
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ステータスごとにグループ化
  const groupedTickets = tickets.reduce((acc, ticket) => {
    const statusName = ticket.status.name;
    const statusId = ticket.status.id;
    if (!acc[statusName]) {
      acc[statusName] = { tickets: [], statusId };
    }
    acc[statusName].tickets.push(ticket);
    return acc;
  }, {} as Record<string, { tickets: Ticket[]; statusId: number }>);

  // ステータスグループを配列に変換して並べ替え（審査待ちを最優先）
  const sortedStatusGroups = Object.entries(groupedTickets).sort(([_nameA, dataA], [_nameB, dataB]) => {
    // 審査待ちを最優先
    if (dataA.statusId === REDMINE_STATUS.PENDING_REVIEW) return -1;
    if (dataB.statusId === REDMINE_STATUS.PENDING_REVIEW) return 1;
    // それ以外はステータスIDの昇順
    return dataA.statusId - dataB.statusId;
  });
  
  const handleApprove = async (ticketId: number) => {
    setApprovingTickets(prev => new Set(prev).add(ticketId));
    setNotification(null);

    try {
      const response = await fetch(API_ENDPOINTS.APPROVE_TICKET(ticketId), {
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
          <h2>座席 {seatNumber} のチケット</h2>
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
            <>
              <div className="ticket-summary">
                <h3 className="summary-title">ステータス別件数</h3>
                <div className="summary-items">
                  {sortedStatusGroups.map(([statusName, { tickets: statusTickets, statusId }]) => (
                    <div key={statusName} className={`summary-item ${statusId === REDMINE_STATUS.PENDING_REVIEW ? 'summary-pending' : ''}`}>
                      <span className="summary-status">{statusName}:</span>
                      <span className="summary-count">{statusTickets.length}件</span>
                    </div>
                  ))}
                  <div className="summary-item summary-total">
                    <span className="summary-status">合計:</span>
                    <span className="summary-count">{tickets.length}件</span>
                  </div>
                </div>
              </div>
              <div className="ticket-list">
              {sortedStatusGroups.map(([statusName, { tickets: statusTickets, statusId }]) => (
                <div key={statusName} className="status-group">
                  <h3 className={`status-group-header ${statusId === REDMINE_STATUS.PENDING_REVIEW ? 'status-pending-review' : ''}`}>
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
                      {ticket.status.id === REDMINE_STATUS.PENDING_REVIEW && (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
