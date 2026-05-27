package com.money.recommendation.dto;

import lombok.Getter;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;

@Getter
public class RoundTripDatePriceDto {

    private final LocalDate departureDate;
    private final LocalDate returnDate;
    private final DayOfWeek dayOfWeek;
    private final String dayOfWeekName;
    private final BigDecimal outboundPrice;
    private final BigDecimal returnPrice;
    private final BigDecimal totalPrice;

    public RoundTripDatePriceDto(LocalDate departureDate, LocalDate returnDate, DayOfWeek dayOfWeek, String dayOfWeekName, BigDecimal outboundPrice, BigDecimal returnPrice, BigDecimal totalPrice) {
        this.departureDate = departureDate;
        this.returnDate = returnDate;
        this.dayOfWeek = dayOfWeek;
        this.dayOfWeekName = dayOfWeekName;
        this.outboundPrice = outboundPrice;
        this.returnPrice = returnPrice;
        this.totalPrice = totalPrice;
    }

    public static RoundTripDatePriceDto of(LocalDate departureDate, LocalDate returnDate, BigDecimal outboundPrice, BigDecimal returnPrice) {
        return new RoundTripDatePriceDto(departureDate, returnDate, departureDate.getDayOfWeek(), toKoreanDayOfWeek(departureDate.getDayOfWeek()), outboundPrice, returnPrice, outboundPrice.add(returnPrice));
    }

    private static String toKoreanDayOfWeek(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> "월요일";
            case TUESDAY -> "화요일";
            case WEDNESDAY -> "수요일";
            case THURSDAY -> "목요일";
            case FRIDAY -> "금요일";
            case SATURDAY -> "토요일";
            case SUNDAY -> "일요일";
        };
    }


}

