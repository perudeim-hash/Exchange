package com.money.recommendation.dto;

import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class FlightPriceAnalysisResponseDto {
    private final String originAirportCode;
    private final String destinationAirportCode;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final int stayDays;
    private final int totalAvailableDateCount;
    private final List<MonthlyFlightPriceAnalysisDto> monthlyAnalyses;

    public FlightPriceAnalysisResponseDto(String originAirportCode, String destinationAirportCode, LocalDate startDate, LocalDate endDate, int stayDays, int totalAvailableDateCount, List<MonthlyFlightPriceAnalysisDto> monthlyAnalyses) {
        this.originAirportCode = originAirportCode;
        this.destinationAirportCode = destinationAirportCode;
        this.startDate = startDate;
        this.endDate = endDate;
        this.stayDays = stayDays;
        this.totalAvailableDateCount = totalAvailableDateCount;
        this.monthlyAnalyses = monthlyAnalyses;
    }

    public static FlightPriceAnalysisResponseDto of(String originAirportCode, String destinationAirportCode, LocalDate startDate, LocalDate endDate, int stayDays, int totalAvailableDateCount, List<MonthlyFlightPriceAnalysisDto> monthlyAnalyses) {
        return new FlightPriceAnalysisResponseDto(originAirportCode, destinationAirportCode, startDate, endDate, stayDays, totalAvailableDateCount, monthlyAnalyses);
    }

}


