package com.money.event.dto;

import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
public class TravelTimingRecommendationResponseDto {
    private final String originAirportCode;
    private final String destinationAirportCode;
    private final String countryCode;
    private final String countryName;
    private final String cityName;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final List<MonthlyTravelTimingRecommendationDto> recommendedMonths;
    private final List<MonthlyTravelTimingRecommendationDto> expensiveMonths;
    private final List<MonthlyTravelTimingRecommendationDto> monthlyAnalyses;


    private TravelTimingRecommendationResponseDto(String originAirportCode, String destinationAirportCode, String countryCode, String countryName, String cityName, LocalDate startDate, LocalDate endDate, List<MonthlyTravelTimingRecommendationDto> recommendedMonths, List<MonthlyTravelTimingRecommendationDto> expensiveMonths, List<MonthlyTravelTimingRecommendationDto> monthlyAnalyses) {
        this.originAirportCode = originAirportCode;
        this.destinationAirportCode = destinationAirportCode;
        this.countryCode = countryCode;
        this.countryName = countryName;
        this.cityName = cityName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.recommendedMonths = recommendedMonths;
        this.expensiveMonths = expensiveMonths;
        this.monthlyAnalyses = monthlyAnalyses;
    }

    public static TravelTimingRecommendationResponseDto of(String originAirportCode, String destinationAirportCode, String countryCode, String countryName, String cityName, LocalDate startDate, LocalDate endDate, List<MonthlyTravelTimingRecommendationDto> recommendedMonths, List<MonthlyTravelTimingRecommendationDto> expensiveMonths, List<MonthlyTravelTimingRecommendationDto> monthlyAnalyses) {
        return new TravelTimingRecommendationResponseDto(originAirportCode, destinationAirportCode, countryCode, countryName, cityName, startDate, endDate, recommendedMonths, expensiveMonths, monthlyAnalyses);
    }
}
