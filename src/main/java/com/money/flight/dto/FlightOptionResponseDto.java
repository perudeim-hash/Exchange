package com.money.flight.dto;

import com.money.flight.entity.FlightOption;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
public class FlightOptionResponseDto {
    private final Long flightOptionId;
    private final String airlineCode;
    private final String airlineName;
    private final String airlineTier;
    private final String airlineTierDescription;
    private final String seatClass;
    private final String seatClassDescription;
    private final String connectionType;
    private final String connectionTypeDescription;
    private final String layoverAirportCode;
    private final String layoverAirportName;
    private final LocalTime departureTime;
    private final LocalDate arrivalDate;
    private final LocalTime arrivalTime;
    private final Integer flightDurationMinutes;
    private final Integer layoverDurationMinutes;
    private final Integer totalDurationMinutes;
    private final String totalDurationText;
    private final BigDecimal price;


    public FlightOptionResponseDto(Long flightOptionId, String airlineCode, String airlineName, String airlineTier, String airlineTierDescription, String seatClass, String seatClassDescription, String connectionType, String connectionTypeDescription, String layoverAirportCode, String layoverAirportName, LocalTime departureTime, LocalDate arrivalDate, LocalTime arrivalTime, Integer flightDurationMinutes, Integer layoverDurationMinutes, Integer totalDurationMinutes, String totalDurationText, BigDecimal price) {
        this.flightOptionId = flightOptionId;
        this.airlineCode = airlineCode;
        this.airlineName = airlineName;
        this.airlineTier = airlineTier;
        this.airlineTierDescription = airlineTierDescription;
        this.seatClass = seatClass;
        this.seatClassDescription = seatClassDescription;
        this.connectionType = connectionType;
        this.connectionTypeDescription = connectionTypeDescription;
        this.layoverAirportCode = layoverAirportCode;
        this.layoverAirportName = layoverAirportName;
        this.departureTime = departureTime;
        this.arrivalDate = arrivalDate;
        this.arrivalTime = arrivalTime;
        this.flightDurationMinutes = flightDurationMinutes;
        this.layoverDurationMinutes = layoverDurationMinutes;
        this.totalDurationMinutes = totalDurationMinutes;
        this.totalDurationText = totalDurationText;
        this.price = price;
    }

    public static FlightOptionResponseDto from(FlightOption option) {
        return new FlightOptionResponseDto(option.getId(),
                option.getAirline().getCode(),
                option.getAirline().getName(),
                option.getAirline().getTier().name(),
                option.getAirline().getTier().getDescription(),
                option.getSeatClass().name(),
                option.getSeatClass().getDescription(),
                option.getConnectionType().name(),
                option.getConnectionType().getDescription(),
                option.getLayoverAirport() == null ? null : option.getLayoverAirport().getCode(),
                option.getLayoverAirport() == null ? null : option.getLayoverAirport().getName(),
                option.getDepartureTime(),
                option.getArrivalDate(),
                option.getArrivalTime(),
                option.getFlightDurationMinutes(),
                option.getLayoverDurationMinutes(),
                option.getTotalDurationMinutes(),
                formatDuration(option.getTotalDurationMinutes()),
                option.getPrice());

    }

    private static String formatDuration(Integer minutes){
        if (minutes == null) {
            return null;
        }
        int hours = minutes/60;
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
