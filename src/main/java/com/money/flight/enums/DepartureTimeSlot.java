package com.money.flight.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalTime;
@Getter
@AllArgsConstructor
public enum DepartureTimeSlot {
    ALL("전체", null, null),
    DAWN("새벽", LocalTime.of(0, 0), LocalTime.of(5, 59, 59)),
    MORNING("오전",LocalTime.of(6, 0), LocalTime.of(11, 59, 59)),
    AFTERNOON("오후", LocalTime.of(12, 0), LocalTime.of(17, 59, 59)),
    EVENING("저녁", LocalTime.of(18, 0), LocalTime.of(23, 59, 59));

    private final String description;
    private final LocalTime startTime;
    private final LocalTime endTime;

    public boolean isAll(){
        return this == ALL;
    }

    public boolean contains(LocalTime departureTime) {
        if (departureTime == null) {
            return false;
        }
        if (isAll()) {
            return true;
        }
        return !departureTime.isBefore(startTime)
                && !departureTime.isAfter(endTime
        );
    }

}
