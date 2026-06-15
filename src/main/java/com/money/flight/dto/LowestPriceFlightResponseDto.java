package com.money.flight.dto;

import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class LowestPriceFlightResponseDto {
    private final String originAirportCode;
    private final String destinationAirportCode;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final int resultCount;
    private final List<FlightOptionResponseDto> options;

    private LowestPriceFlightResponseDto(String originAirportCode, String destinationAirportCode, LocalDate startDate, LocalDate endDate,  List<FlightOptionResponseDto> options) {
        this.originAirportCode = originAirportCode;
        this.destinationAirportCode = destinationAirportCode;
        this.startDate = startDate;
        this.endDate = endDate;
        this.resultCount = options.size();
        this.options = options;
    }

    public static LowestPriceFlightResponseDto of(String originAirportCode, String destinationAirportCode, LocalDate startDate, LocalDate endDate, List<FlightOptionResponseDto> options) {
        return new LowestPriceFlightResponseDto(originAirportCode, destinationAirportCode, startDate, endDate, options);
    }
}
