import React from "react";
import Seat from "./Seat";
import type { Ticket } from "./App";

interface SeatGroup {
  seats: number[];
  colorClass: string;
  marginTop?: boolean | number;
}

interface ClassroomProps {
  title: string;
  seatGroups: SeatGroup[];
  seatGroups2: SeatGroup[];
  seatGroups3?: SeatGroup[];
  highlightedSeats: Set<number>;
  seatTickets: Map<number, Ticket[]>;
  onSeatClick: (seatNumber: number) => void;
}

export default function Classroom({
  title,
  seatGroups,
  seatGroups2,
  seatGroups3,
  highlightedSeats,
  seatTickets,
  onSeatClick,
}: ClassroomProps) {
  const renderSeatGroup = (group: SeatGroup, index: number) => {
    const marginStyle =
      typeof group.marginTop === "number"
        ? { marginTop: `${group.marginTop}px` }
        : group.marginTop
          ? { marginTop: "20px" }
          : {};

    return (
      <div key={index} className="seat-group" style={marginStyle}>
        {group.seats.map((seatNum) => (
          <Seat
            key={seatNum}
            number={seatNum}
            colorClass={group.colorClass}
            isHighlighted={highlightedSeats.has(seatNum)}
            tickets={seatTickets.get(seatNum) || []}
            onClick={onSeatClick}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="classroom">
      <div className="classroom-title">{title}</div>
      <div className="seats-container">
        <div>{seatGroups.map(renderSeatGroup)}</div>
        <div>{seatGroups2.map(renderSeatGroup)}</div>
        {seatGroups3 && <div>{seatGroups3.map(renderSeatGroup)}</div>}
      </div>
    </div>
  );
}
