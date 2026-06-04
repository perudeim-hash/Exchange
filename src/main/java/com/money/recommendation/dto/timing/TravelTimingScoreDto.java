package com.money.recommendation.dto.timing;

import lombok.Getter;

@Getter
public class TravelTimingScoreDto {
    private final int totalScore;
    private final int flightScore;
    private final int flightCheapDateScore;
    private final int flightMinPriceScore;
    private final int flightStabilityScore;
    private final int exchangeScore;
    private final int exchangeAverageRateScore;
    private final int exchangeDataCountScore;


    private TravelTimingScoreDto(int totalScore, int flightScore, int flightCheapDateScore, int flightMinPriceScore, int flightStabilityScore, int exchangeScore, int exchangeAverageRateScore, int exchangeDataCountScore) {
        this.totalScore = totalScore;
        this.flightScore = flightScore;
        this.flightCheapDateScore = flightCheapDateScore;
        this.flightMinPriceScore = flightMinPriceScore;
        this.flightStabilityScore = flightStabilityScore;
        this.exchangeScore = exchangeScore;
        this.exchangeAverageRateScore = exchangeAverageRateScore;
        this.exchangeDataCountScore = exchangeDataCountScore;

    }

    public static TravelTimingScoreDto of(int flightCheapDateScore, int flightMinPriceScore, int flightStabilityScore, int exchangeAverageRateScore, int exchangeDataCountScore) {
        int flightScore = flightCheapDateScore + flightStabilityScore + flightMinPriceScore;
        int exchangeScore = exchangeAverageRateScore + exchangeDataCountScore;
        int totalScore = flightScore+ exchangeScore;

        return new TravelTimingScoreDto(totalScore, flightScore, flightCheapDateScore, flightMinPriceScore, flightStabilityScore, exchangeScore, exchangeAverageRateScore, exchangeDataCountScore);

    }
}
