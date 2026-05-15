package com.money.flight.dto;

import com.money.flight.entity.FlightSegment;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
public class FlightSegmentResponseDto {
    private final Long segmentId;
    private final int segmentOrder;
    private final String originAirportCode;
    private final String originAirportName;
    private final String destinationAirportCode;
    private final String destinationAirportName;
    private final LocalDate departureDate;
    private final LocalTime departureTime;
    private final LocalDate arrivalDate;
    private final LocalTime arrivalTime;
    private final int durationMinutes;
    private final String durationText;
    private final Integer layoverAfterMinutes;
    private final String layoverAfterText;

    public FlightSegmentResponseDto(Long segmentId, int segmentOrder, String originAirportCode, String originAirportName, String destinationAirportCode, String destinationAirportName, LocalDate departureDate, LocalTime departureTime, LocalDate arrivalDate, LocalTime arrivalTime, int durationMinutes, String durationText, Integer layoverAfterMinutes, String layoverAfterText) {
        this.segmentId = segmentId;
        this.segmentOrder = segmentOrder;
        this.originAirportCode = originAirportCode;
        this.originAirportName = originAirportName;
        this.destinationAirportCode = destinationAirportCode;
        this.destinationAirportName = destinationAirportName;
        this.departureDate = departureDate;
        this.departureTime = departureTime;
        this.arrivalDate = arrivalDate;
        this.arrivalTime = arrivalTime;
        this.durationMinutes = durationMinutes;
        this.durationText = durationText;
        this.layoverAfterMinutes = layoverAfterMinutes;
        this.layoverAfterText = layoverAfterText;
    }

    public static FlightSegmentResponseDto from(FlightSegment segment) {
        return new FlightSegmentResponseDto(
                segment.getId(), segment.getSegmentOrder(), segment.getOriginAirport().getCode(), segment.getOriginAirport().getName(),
                segment.getDestinationAirport().getCode(), segment.getDestinationAirport().getName(), segment.getDepartureDate(), segment.getDepartureTime(),
                segment.getArrivalDate(), segment.getArrivalTime(), segment.getDurationMinutes(), formatDuration(segment.getDurationMinutes()),
                segment.getLayoverAfterMinutes(), segment.getLayoverAfterMinutes() == null ? null : formatDuration(segment.getLayoverAfterMinutes())
        );
    }

    private static String formatDuration(Integer minutes) {
        if (minutes == null) {
            return null;
        }
        int hours = minutes / 60;
        int remainingMinutes = minutes % 60;
        if (hours == 0) {
            return remainingMinutes + "분";
        }
        if (remainingMinutes == 0) {
            return hours + "시간";
        }
        return hours + "시간 " + remainingMinutes + "분";
    }
}
