package com.money.flight.dto;

import com.money.flight.entity.FlightRoute;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
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
    private final BigDecimal directAvgPrice;
    private final Integer directMinDurationMinutes;
    private final String directMinDurationText;

    private final BigDecimal layoverMinPrice;
    private final BigDecimal layoverAvgPrice;
    private final Integer layoverMinDurationMinutes;
    private final String layoverMinDurationText;


    private final BigDecimal minPrice;
    private final Integer minDurationMinutes;
    private final String minDurationText;
    private final LocalDateTime statsUpdateAt;


    private FlightRouteSummaryResponseDto(Long routeId, String originAirportCode, String originAirportName, String originCityName, String destinationAirportCode, String destinationAirportName, String destinationCityName, String routeConnectionPolicy, Boolean hasDirect, Boolean hasLayover, BigDecimal directMinPrice, BigDecimal directAvgPrice, Integer directMinDurationMinutes, String directMinDurationText, BigDecimal layoverMinPrice, BigDecimal layoverAvgPrice, Integer layoverMinDurationMinutes, String layoverMinDurationText, BigDecimal minPrice, Integer minDurationMinutes, String minDurationText, LocalDateTime statsUpdateAt) {
        this.routeId = routeId;
        this.originAirportCode = originAirportCode;
        this.originAirportName = originAirportName;
        this.originCityName = originCityName;
        this.destinationAirportCode = destinationAirportCode;
        this.destinationAirportName = destinationAirportName;
        this.destinationCityName = destinationCityName;
        this.routeConnectionPolicy = routeConnectionPolicy;
        this.hasDirect = hasDirect;
        this.hasLayover = hasLayover;
        this.directMinPrice = directMinPrice;
        this.directAvgPrice = directAvgPrice;
        this.directMinDurationMinutes = directMinDurationMinutes;
        this.directMinDurationText = directMinDurationText;
        this.layoverMinPrice = layoverMinPrice;
        this.layoverAvgPrice = layoverAvgPrice;
        this.layoverMinDurationMinutes = layoverMinDurationMinutes;
        this.layoverMinDurationText = layoverMinDurationText;
        this.minPrice = minPrice;
        this.minDurationMinutes = minDurationMinutes;
        this.minDurationText = minDurationText;
        this.statsUpdateAt = statsUpdateAt;
    }

    public static FlightRouteSummaryResponseDto from(FlightRoute route) {
        BigDecimal minPrice = getMinPrice(route.getDirectMinPrice(), route.getLayoverMinPrice());
        Integer minDurationMinutes = getMinDuration(route.getDirectMinDurationMinutes(), route.getLayoverMinDurationMinutes());

        return new FlightRouteSummaryResponseDto(
                route.getId(), route.getOriginAirport().getCode(), route.getOriginAirport().getName(),
                route.getOriginAirport().getCityName(), route.getDestinationAirport().getCode(), route.getDestinationAirport().getName(),
                route.getDestinationAirport().getCityName(), route.getRouteConnectionPolicy().name(), route.getHasDirect(), route.getHasLayover(), route.getDirectMinPrice(),
                route.getDirectAvgPrice(), route.getDirectMinDurationMinutes(), formatDuration(route.getDirectMinDurationMinutes()), route.getLayoverMinPrice(),
                route.getLayoverAvgPrice(), route.getLayoverMinDurationMinutes(), formatDuration(route.getLayoverMinDurationMinutes()), minPrice,
                minDurationMinutes, formatDuration(minDurationMinutes), route.getStatsUpdatedAt()
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
