package com.money.flight.dto;

import com.money.flight.enums.TripType;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class RoundTripFlightSearchResponseDto {
    private final String tripType;
    private final String tripTypeDescription;
    private final String originAirportCode;
    private final String originAirportName;
    private final String destinationAirportCode;
    private final String destinationAirportName;
    private final LocalDate departureDate;
    private final LocalDate returnDate;
    private final int optionCount;
    private final List<RoundTripOptionResponseDto> options;

    public RoundTripFlightSearchResponseDto(String tripType, String tripTypeDescription, String originAirportCode, String originAirportName, String destinationAirportCode, String destinationAirportName, LocalDate departureDate, LocalDate returnDate, int optionCount, List<RoundTripOptionResponseDto> options) {
        this.tripType = tripType;
        this.tripTypeDescription = tripTypeDescription;
        this.originAirportCode = originAirportCode;
        this.originAirportName = originAirportName;
        this.destinationAirportCode = destinationAirportCode;
        this.destinationAirportName = destinationAirportName;
        this.departureDate = departureDate;
        this.returnDate = returnDate;
        this.optionCount = optionCount;
        this.options = options;
    }

    public static RoundTripFlightSearchResponseDto of(FlightSearchResponseDto outboundResult, LocalDate returnDate, List<RoundTripOptionResponseDto> options) {
        return new RoundTripFlightSearchResponseDto(TripType.ROUND_TRIP.name(),
                TripType.ROUND_TRIP.getDescription(), outboundResult.getOriginAirportCode(), outboundResult.getOriginAirportName(),
                outboundResult.getDestinationAirportCode(), outboundResult.getDestinationAirportName(), outboundResult.getDepartureDate(),
                returnDate, options.size(), options);
    }
}
