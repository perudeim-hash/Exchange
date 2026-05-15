package com.money.flight.service.calculator;

import com.money.flight.dto.PassengerFareDto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class FlightFareCalculator {
    private static final int MIN_ADULT_COUNT = 1;
    private static final int MIN_CHILD_COUNT = 0;
    private static final int MIN_INFANT_COUNT = 0;
    private static final int MAX_TOTAL_PASSENGER_COUNT = 9;

    private static final BigDecimal ADULT_RATE = BigDecimal.valueOf(1.00);
    private static final BigDecimal CHILD_RATE = BigDecimal.valueOf(0.80);
    private static final BigDecimal INFANT_RATE = BigDecimal.valueOf(0.10);


    public PassengerFareDto calculate(BigDecimal adultBasePrice, int adultCount, int childCount, int infantCount) {
        validatePassengerCounts(adultCount, childCount, infantCount);

        BigDecimal adultUnitPrice = calculateUnitPrice(adultBasePrice, ADULT_RATE);
        BigDecimal childUnitPrice = calculateUnitPrice(adultBasePrice, CHILD_RATE);
        BigDecimal infantUnitPrice = calculateUnitPrice(adultBasePrice, INFANT_RATE);

        BigDecimal adultTotalPrice = adultUnitPrice.multiply(BigDecimal.valueOf(adultCount));
        BigDecimal childTotalPrice = childUnitPrice.multiply(BigDecimal.valueOf(childCount));
        BigDecimal infantTotalPrice = infantUnitPrice.multiply(BigDecimal.valueOf(infantCount));


        BigDecimal totalPrice = adultTotalPrice.add(childTotalPrice).add(infantTotalPrice);
        return new PassengerFareDto(adultCount, childCount, infantCount,
                adultUnitPrice, childUnitPrice, infantUnitPrice, adultTotalPrice,
                childTotalPrice, infantTotalPrice, totalPrice, createPassengerSummary(adultCount, childCount, infantCount));
    }


    private BigDecimal calculateUnitPrice(BigDecimal adultBasePrice, BigDecimal rate) {
        if (adultBasePrice == null) {
            throw new IllegalArgumentException("성인 기준 항공권 가격은 null일 수 없습니다.");
        }
        return adultBasePrice.multiply(rate).setScale(0, RoundingMode.HALF_UP);
    }

    public void validatePassengerCounts(int adultCount, int childCount, int infantCount) {
        if (adultCount < 1) {
            throw new IllegalArgumentException("성인은 최소 1명 이상이어야 합니다.");
        }
        if (childCount < 0) {
            throw new IllegalArgumentException("소아 수는 0명 이상이어야 합니다.");
        }
        if (infantCount < 0) {
            throw new IllegalArgumentException("유아 수는 0명 이상이어야 합니다.");
        }
        int totalPassengerCount = adultCount + childCount + infantCount;
        if (totalPassengerCount > 9) {
            throw new IllegalArgumentException("전체 탑승객 수는 최대 9명까지 가능합니다.");
        }
        if (infantCount > adultCount) {
            throw new IllegalArgumentException("유아 수는 성인 수보다 많을 수 없습니다.");
        }
    }

    private String createPassengerSummary(int adultCount, int childCount, int infantCount) {
        StringBuilder summary = new StringBuilder();
        summary.append("성인 ").append(adultCount).append("명");
        if (childCount > 0) {
            summary.append(" · 소아 ").append(childCount).append("명");
        }
        if (infantCount > 0) {
            summary.append(" · 유아 ").append(infantCount).append("명");
        }
        return summary.toString();
    }
}
