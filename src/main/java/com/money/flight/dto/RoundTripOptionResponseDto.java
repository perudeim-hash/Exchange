package com.money.flight.dto;

import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class RoundTripOptionResponseDto {
    private final Long outboundOptionId;
    private final Long returnOptionId;
    private final FlightOptionResponseDto outboundOption;
    private final FlightOptionResponseDto returnOption;
    private final BigDecimal totalPrice;
    private final Integer totalDurationMinutes;
    private final String totalDurationText;

    public RoundTripOptionResponseDto(Long outboundOptionId, Long returnOptionId, FlightOptionResponseDto outboundOption, FlightOptionResponseDto returnOption, BigDecimal totalPrice, Integer totalDurationMinutes, String totalDurationText) {
        this.outboundOptionId = outboundOptionId;
        this.returnOptionId = returnOptionId;
        this.outboundOption = outboundOption;
        this.returnOption = returnOption;
        this.totalPrice = totalPrice;
        this.totalDurationMinutes = totalDurationMinutes;
        this.totalDurationText = totalDurationText;
    }

    public static RoundTripOptionResponseDto of(FlightOptionResponseDto outboundOption, FlightOptionResponseDto returnOption) {
        BigDecimal totalPrice = outboundOption.getTotalPrice().add(returnOption.getTotalPrice());
        Integer totalDurationMinutes = outboundOption.getTotalDurationMinutes() + returnOption.getTotalDurationMinutes();
        return new RoundTripOptionResponseDto(outboundOption.getFlightOptionId(), returnOption.getFlightOptionId(),
                outboundOption,returnOption,totalPrice,totalDurationMinutes,formatDuration(totalDurationMinutes));

    }

    private static String formatDuration(Integer minutes) {
        if (minutes == null) {
            return null;
        }
        int hours = minutes / 60;
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
