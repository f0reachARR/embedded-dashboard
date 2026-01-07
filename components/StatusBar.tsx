interface StatusBarProps {
  status: {
    text: string;
    type: string;
  };
  lastUpdate: string;
  ticketCount: number;
}

export default function StatusBar({ status, lastUpdate, ticketCount }: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-item">
        <span className={`status-dot ${status.type}`}></span>
        <span>{status.text}</span>
      </div>
      <div className="status-item">
        最終更新: <span>{lastUpdate}</span>
      </div>
      <div className="status-item">
        審査待ち件数: <span>{ticketCount}</span>
      </div>
    </div>
  );
}
