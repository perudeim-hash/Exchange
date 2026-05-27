package com.money.event.dto;

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
    private final int eventScore;
    private final int eventRepresentativeScore;
    private final int eventCountScore;

    private TravelTimingScoreDto(int totalScore, int flightScore, int flightCheapDateScore, int flightMinPriceScore, int flightStabilityScore, int exchangeScore, int exchangeAverageRateScore, int exchangeDataCountScore, int eventScore, int eventRepresentativeScore, int eventCountScore) {
        this.totalScore = totalScore;
        this.flightScore = flightScore;
        this.flightCheapDateScore = flightCheapDateScore;
        this.flightMinPriceScore = flightMinPriceScore;
        this.flightStabilityScore = flightStabilityScore;
        this.exchangeScore = exchangeScore;
        this.exchangeAverageRateScore = exchangeAverageRateScore;
        this.exchangeDataCountScore = exchangeDataCountScore;
        this.eventScore = eventScore;
        this.eventRepresentativeScore = eventRepresentativeScore;
        this.eventCountScore = eventCountScore;
    }

    public static TravelTimingScoreDto of(int flightCheapDateScore, int flightMinPriceScore, int flightStabilityScore, int exchangeAverageRateScore, int exchangeDataCountScore, int eventRepresentativeScore, int eventCountScore) {
        int flightScore = flightCheapDateScore + flightStabilityScore + flightMinPriceScore;
        int eventScore = eventCountScore + eventRepresentativeScore;
        int exchangeScore = exchangeAverageRateScore + eventCountScore;
        int totalScore = flightScore + eventScore + exchangeScore;

        return new TravelTimingScoreDto(totalScore, flightScore, flightCheapDateScore, flightMinPriceScore, flightStabilityScore, exchangeScore, exchangeAverageRateScore, exchangeDataCountScore, eventScore, eventRepresentativeScore, eventCountScore);

    }
}
