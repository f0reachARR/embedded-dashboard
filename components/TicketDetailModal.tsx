import React from "react";
import type { Ticket } from "./App";

interface TicketDetailModalProps {
  seatNumber: number;
  tickets: Ticket[];
  onClose: () => void;
}

export default function TicketDetailModal({ seatNumber, tickets, onClose }: TicketDetailModalProps) {
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
          {tickets.length === 0 ? (
            <p className="no-tickets">審査待ちのチケットはありません</p>
          ) : (
            <div className="ticket-list">
              {tickets.map((ticket) => (
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
