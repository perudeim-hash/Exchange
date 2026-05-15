package com.money.flight.dto;

import com.money.flight.entity.FlightOption;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class FlightSearchResponseDto {
    private final String originAirportCode;
    private final String originAirportName;
    private final String destinationAirportCode;
    private final String destinationAirportName;
    private final LocalDate departureDate;
    private final int optionCount;
    private final List<FlightOptionResponseDto> options;

    public FlightSearchResponseDto(String originAirportCode, String originAirportName, String destinationAirportCode, String destinationAirportName, LocalDate departureDate, int optionCount, List<FlightOptionResponseDto> options) {
        this.originAirportCode = originAirportCode;
        this.originAirportName = originAirportName;
        this.destinationAirportCode = destinationAirportCode;
        this.destinationAirportName = destinationAirportName;
        this.departureDate = departureDate;
        this.optionCount = optionCount;
        this.options = options;
    }

    public static FlightSearchResponseDto of(String originAirportCode, String originAirportName, String destinationAirportCode, String destinationAirportName, LocalDate departureDate, List<FlightOptionResponseDto> options) {
        return new FlightSearchResponseDto(originAirportCode, originAirportName, destinationAirportCode, destinationAirportName, departureDate, options.size(), options);
    }

}

