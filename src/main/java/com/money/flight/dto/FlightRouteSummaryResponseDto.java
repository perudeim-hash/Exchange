package com.money.flight.dto;

import com.money.flight.entity.FlightRoute;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@AllArgsConstructor
public class FlightRouteSummaryResponseDto {
    private final Long routeId;
    private final String originAirportCode;
    private final String originAirportName;
    private final String originCityName;
    private final String destinationAirportCode;
    private final String destinationAirportName;
    private final String destinationCityName;
    private final String routeConnectionPolicy;
    private final Boolean hasDirect;
    private final Boolean hasLayover;
    private final BigDecimal directMinPrice;

    private final LocalDate directMinPriceDepartureDate;
    private final LocalTime directMinPriceDepartureTime;

    private final BigDecimal directAvgPrice;
    private final Integer directMinDurationMinutes;
    private final String directMinDurationText;

    private final BigDecimal layoverMinPrice;

    private final LocalDate layoverMinPriceDepartureDate;
    private final LocalTime layoverMinPriceDepartureTime;

    private final BigDecimal layoverAvgPrice;
    private final Integer layoverMinDurationMinutes;
    private final String layoverMinDurationText;


    private final BigDecimal minPrice;

    private final LocalDate minPriceDepartureDate;
    private final LocalTime minPriceDepartureTime;

    private final Integer minDurationMinutes;
    private final String minDurationText;
    private final LocalDateTime statsUpdateAt;



    public static FlightRouteSummaryResponseDto from(FlightRoute route) {
        BigDecimal minPrice = getMinPrice(route.getDirectMinPrice(), route.getLayoverMinPrice());

        LocalDate minPriceDepartureDate = getMinPriceDepartureDate(route);
        LocalTime minPriceDepartureTime = getMinPriceDepartureTime(route);

        Integer minDurationMinutes = getMinDuration(route.getDirectMinDurationMinutes(), route.getLayoverMinDurationMinutes());

        return new FlightRouteSummaryResponseDto(
                route.getId(),

                route.getOriginAirport().getCode(),
                route.getOriginAirport().getName(),
                route.getOriginAirport().getCityName(),

                route.getDestinationAirport().getCode(),
                route.getDestinationAirport().getName(),
                route.getDestinationAirport().getCityName(),

                route.getRouteConnectionPolicy().name(),

                route.getHasDirect(),
                route.getHasLayover(),

                route.getDirectMinPrice(),
                route.getDirectMinPriceDepartureDate(),
                route.getDirectMinPriceDepartureTime(),
                route.getDirectAvgPrice(),
                route.getDirectMinDurationMinutes(),
                formatDuration(route.getDirectMinDurationMinutes()),

                route.getLayoverMinPrice(),
                route.getLayoverMinPriceDepartureDate(),
                route.getLayoverMinPriceDepartureTime(),
                route.getLayoverAvgPrice(),
                route.getLayoverMinDurationMinutes(),
                formatDuration(route.getLayoverMinDurationMinutes()),

                minPrice,
                minPriceDepartureDate,
                minPriceDepartureTime,
                minDurationMinutes,
                formatDuration(minDurationMinutes),

                route.getStatsUpdatedAt()
        );
    }


    private static BigDecimal getMinPrice(BigDecimal directMinPrice, BigDecimal layoverMinPrice) {
        if (directMinPrice == null) {
            return layoverMinPrice;
        }
        if (layoverMinPrice == null) {
            return directMinPrice;
        }
        return directMinPrice.compareTo(layoverMinPrice) <= 0 ? directMinPrice : layoverMinPrice;
    }

    private static LocalDate getMinPriceDepartureDate(FlightRoute route) {
        if (route.getDirectMinPrice() == null) {
            return route.getLayoverMinPriceDepartureDate();
        }
        if (route.getLayoverMinPrice() == null) {
            return route.getDirectMinPriceDepartureDate();
        }
        return route.getDirectMinPrice().compareTo(route.getLayoverMinPrice()) <= 0 ? route.getDirectMinPriceDepartureDate() : route.getLayoverMinPriceDepartureDate();
    }

    private static LocalTime getMinPriceDepartureTime(FlightRoute route) {
        if (route.getDirectMinPrice() == null) {
            return route.getLayoverMinPriceDepartureTime();
        }
        if (route.getLayoverMinPrice() == null) {
            return route.getDirectMinPriceDepartureTime();
        }
        return route.getDirectMinPrice().compareTo(route.getLayoverMinPrice()) <= 0 ? route.getDirectMinPriceDepartureTime() : route.getLayoverMinPriceDepartureTime();
    }

    private static Integer getMinDuration(Integer directDuration, Integer layoverDuration) {

        if (directDuration == null) {
            return layoverDuration;
        }
        if (layoverDuration == null) {
            return directDuration;
        }
        return Math.min(directDuration, layoverDuration);
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
