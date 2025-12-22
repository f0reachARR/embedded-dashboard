import React, { useState } from "react";
import Tooltip from "./Tooltip";
import type { Ticket } from "./App";

interface SeatProps {
  number: number;
  colorClass: string;
  isHighlighted: boolean;
  tickets: Ticket[];
  onClick: (seatNumber: number) => void;
}

export default function Seat({ number, colorClass, isHighlighted, tickets, onClick }: SeatProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`seat ${colorClass} ${isHighlighted ? "highlight" : ""} clickable`}
      data-seat={number}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => onClick(number)}
    >
      {number}
      {tickets.length > 0 && <Tooltip tickets={tickets} visible={showTooltip} />}
    </div>
  );
}
