package com.money.flight.dto;

import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class RoundTripLowestPriceResponseDto {

    private final String tripType;
    private final String tripTypeDescription;
    private final String originAirportCode;
    private final String destinationAirportCode;
    private final LocalDate outboundStartDate;
    private final LocalDate outboundEndDate;
    private final LocalDate returnStartDate;
    private final LocalDate returnEndDate;
    private final int resultCount;
    private final List<RoundTripOptionResponseDto> options;

    private RoundTripLowestPriceResponseDto(String originAirportCode, String destinationAirportCode, LocalDate outboundStartDate, LocalDate outboundEndDate, LocalDate returnStartDate, LocalDate returnEndDate, List<RoundTripOptionResponseDto> options) {
        this.tripType = "ROUND_TRIP";
        this.tripTypeDescription = "왕복 최저가";
        this.originAirportCode = originAirportCode;
        this.destinationAirportCode = destinationAirportCode;
        this.outboundStartDate = outboundStartDate;
        this.outboundEndDate = outboundEndDate;
        this.returnStartDate = returnStartDate;
        this.returnEndDate = returnEndDate;
        this.resultCount = options.size();
        this.options = options;
    }

    public static RoundTripLowestPriceResponseDto of (String originAirportCode,String destinationAirportCode,LocalDate outboundStartDate,LocalDate  outboundEndDate,LocalDate returnStartDate,LocalDate returnEndDate,List<RoundTripOptionResponseDto> options) {
        return new RoundTripLowestPriceResponseDto(originAirportCode, destinationAirportCode, outboundStartDate, outboundEndDate, returnStartDate, returnEndDate, options);
    }
}
