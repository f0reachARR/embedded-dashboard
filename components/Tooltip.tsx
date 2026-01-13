import React from "react";
import type { Ticket } from "../types";

interface TooltipProps {
  tickets: Ticket[];
  visible: boolean;
}

export default function Tooltip({ tickets, visible }: TooltipProps) {
  if (!visible || tickets.length === 0) {
    return null;
  }

  return (
    <div className='seat-tooltip'>
      <div className='tooltip-header'>
        審査待ちチケット ({tickets.length}件)
      </div>
      <ul className='tooltip-list'>
        {tickets.map((ticket) => (
          <li key={ticket.id} className='tooltip-item'>
            #{ticket.id}: {ticket.subject}
          </li>
        ))}
      </ul>
    </div>
  );
}
