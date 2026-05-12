package com.money.flight.service.calculator;

import com.money.flight.entity.Airline;
import com.money.flight.entity.FlightRoute;
import com.money.flight.enums.AirlineTier;
import com.money.flight.enums.ConnectionType;
import com.money.flight.enums.SeatClass;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Random;

@Component
public class FlightPriceCalculator {
    public BigDecimal createPrice(FlightRoute route, Airline airline, SeatClass seatClass, ConnectionType connectionType, LocalDate departureDate, LocalTime departureTime, int variant, Random random) {
        BigDecimal basePrice = calculateRouteBasePrice(route, connectionType);
        BigDecimal price = basePrice.multiply(BigDecimal.valueOf(airlineTierMultiplier(airline.getTier())))
                .multiply(BigDecimal.valueOf(seatClassMultiplier(seatClass)))
                .multiply(BigDecimal.valueOf(connectionMultiplier(connectionType)))
                .multiply(BigDecimal.valueOf(dayOfWeekMultiplier(departureDate.getDayOfWeek())))
                .multiply(BigDecimal.valueOf(monthMultiplier(departureDate.getMonthValue())))
                .multiply(BigDecimal.valueOf(timeMultiplier(departureTime)))
                .multiply(BigDecimal.valueOf(fareVariantMultiplier(variant, random)));

        return roundToThousand(price);
    }




    private BigDecimal calculateRouteBasePrice(FlightRoute route, ConnectionType connectionType) {
        Integer referenceDuration;

        if (connectionType == ConnectionType.DIRECT) {
            referenceDuration = route.getDirectBaseDurationMinutes();
        } else if (route.getDirectBaseDurationMinutes() != null) {
            referenceDuration = route.getDirectBaseDurationMinutes();
        } else {
            referenceDuration = (int) (route.getOneStopBaseDurationMinutes() * 0.75);
        }

        if (referenceDuration == null) {
            referenceDuration = route.getOneStopBaseDurationMinutes();
        }
        double perMinute = pricePerMinuteByRegion(route.getDestinationAirport().getCountry().getRegion());
        return BigDecimal.valueOf(referenceDuration * perMinute);
    }

    private double pricePerMinuteByRegion(String region) {
        if ("ASIA".equalsIgnoreCase(region)) {
            return 900;
        }
        if ("EUROPE".equalsIgnoreCase(region)) {
            return 1050;
        }
        if ("AMERICA".equalsIgnoreCase(region) || "NORTH_AMERICA".equalsIgnoreCase(region)) {
            return 1100;
        }
        if ("OCEANIA".equalsIgnoreCase(region)) {
            return 1000;
        }
        if ("MIDDLE_EAST".equalsIgnoreCase(region) || "MIDDLE EAST".equalsIgnoreCase(region)) {
            return 950;
        }
        return 1000;

    }

    private double airlineTierMultiplier(AirlineTier tier) {
        return switch (tier) {
            case PREMIUM -> 1.35;
            case STANDARD -> 1.00;
            case LOW_COST -> 0.75;
        };
    }


    private double seatClassMultiplier(SeatClass seatClass) {
        return switch (seatClass) {
            case ECONOMY -> 1.00;
            case EXTRA_LEGROOM -> 1.15;
            case PREMIUM_ECONOMY -> 1.35;
            case BUSINESS -> 2.30;
            case FIRST -> 3.80;
        };
    }

    private double connectionMultiplier(ConnectionType connectionType) {
        return switch (connectionType) {
            case DIRECT -> 1.00;
            case ONE_STOP -> 0.82;
        };
    }

    private double dayOfWeekMultiplier(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case FRIDAY -> 1.15;
            case SATURDAY -> 1.12;
            case SUNDAY -> 1.08;
            case TUESDAY, WEDNESDAY -> 0.93;
            default -> 1.00;
        };
    }

    private double monthMultiplier(int month) {
        return switch (month) {
            case 7,8,12,1 -> 1.22;
            case 3,11 ->0.92;
            case 4,5,9,10 -> 1.00;
            default -> 1.05;
        };
    }
    private double timeMultiplier(LocalTime departureTime) {
        int hour = departureTime.getHour();
        if (hour >= 6 && hour <= 10) {
            return 1.08;
        }
        if (hour >= 22) {
            return 0.92;
        }
        return 1.00;
    }

    private double fareVariantMultiplier(int variant, Random random) {
        double randomRate = 0.95 + (random.nextDouble() * 0.18);
        return randomRate + (variant * 0.03);
    }
    private BigDecimal roundToThousand(BigDecimal price) {
        long rounded = Math.round(price.doubleValue() / 1000.0) * 1000;
        return BigDecimal.valueOf(rounded);
    }
}
