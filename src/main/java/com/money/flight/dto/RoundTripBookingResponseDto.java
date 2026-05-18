package com.money.flight.dto;

import com.money.flight.enums.TripType;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class RoundTripBookingResponseDto {
    private final String tripType;
    private final String tripTypeDescription;
    private final Long outboundOptionId;
    private final Long returnOptionId;
    private final FlightOptionResponseDto outboundOption;
    private final FlightOptionResponseDto returnOption;
    private final int adultCount;
    private final int childCount;
    private final int infantCount;
    private final String passengerSummary;
    private final BigDecimal outboundTotalPrice;
    private final BigDecimal returnTotalPrice;
    private final BigDecimal totalPrice;

    private final Integer totalDurationMinutes;
    private final String totalDurationText;

    public RoundTripBookingResponseDto(String tripType, String tripTypeDescription, Long outboundOptionId, Long returnOptionId, FlightOptionResponseDto outboundOption, FlightOptionResponseDto returnOption, int adultCount, int childCount, int infantCount, String passengerSummary, BigDecimal outboundTotalPrice, BigDecimal returnTotalPrice, BigDecimal totalPrice, Integer totalDurationMinutes, String totalDurationText) {
        this.tripType = tripType;
        this.tripTypeDescription = tripTypeDescription;
        this.outboundOptionId = outboundOptionId;
        this.returnOptionId = returnOptionId;
        this.outboundOption = outboundOption;
        this.returnOption = returnOption;
        this.adultCount = adultCount;
        this.childCount = childCount;
        this.infantCount = infantCount;
        this.passengerSummary = passengerSummary;
        this.outboundTotalPrice = outboundTotalPrice;
        this.returnTotalPrice = returnTotalPrice;
        this.totalPrice = totalPrice;
        this.totalDurationMinutes = totalDurationMinutes;
        this.totalDurationText = totalDurationText;
    }

    public static RoundTripBookingResponseDto of(FlightOptionResponseDto outboundOption, FlightOptionResponseDto returnOption,
                                                 int adultCount, int childCount, int infantCount) {
        BigDecimal outboundTotalPrice = outboundOption.getTotalPrice();
        BigDecimal returnTotalPrice = returnOption.getTotalPrice();
        BigDecimal totalPrice = outboundTotalPrice.add(returnTotalPrice);

        Integer totalDurationMinutes = outboundOption.getTotalDurationMinutes() + returnOption.getTotalDurationMinutes();

        return new RoundTripBookingResponseDto(
                TripType.ROUND_TRIP.name(), TripType.ROUND_TRIP.getDescription(),
                outboundOption.getFlightOptionId(), returnOption.getFlightOptionId(),
                outboundOption, returnOption, adultCount, childCount, infantCount, createPassengerSummary(adultCount, childCount, infantCount),
                outboundTotalPrice, returnTotalPrice, totalPrice, totalDurationMinutes, formatDuration(totalDurationMinutes)
        );
    }

    private static String createPassengerSummary(int adultCount, int childCount, int infantCount) {
        StringBuilder summary = new StringBuilder();
        summary.append("성인 ").append(adultCount).append("명");

        if (childCount > 0) {
            summary.append(", 소아 ").append(childCount).append("명");
        }
        if (infantCount > 0) {
            summary.append(", 유아 ").append(infantCount).append("명");
        }
        return summary.toString();
    }

    private static String formatDuration(Integer minutes) {
        if (minutes == null) {
            return null;
        }
        int hours = minutes / 60;
        int remainingMinutes = minutes % 60;
        if (hours == 0) {
            return remainingMinutes + "분";
        } else if (remainingMinutes == 0) {
            return hours + "시간";
        }
        return hours + "시간 " + remainingMinutes + "분";

    }

}
