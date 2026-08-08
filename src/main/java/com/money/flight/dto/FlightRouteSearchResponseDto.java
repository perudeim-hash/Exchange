package com.money.flight.dto;

import com.money.flight.entity.FlightOption;
import com.money.flight.entity.FlightRoute;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@AllArgsConstructor
public class FlightRouteSearchResponseDto {

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
    private final Integer directMinDurationMinutes;
    private final String directMinDurationText;
    private final BigDecimal layoverMinPrice;
    private final LocalDate layoverMinPriceDepartureDate;
    private final LocalTime layoverMinPriceDepartureTime;
    private final Integer layoverMinDurationMinutes;
    private final String layoverMinDurationText;
    private final BigDecimal minPrice;
    private final LocalDate minPriceDepartureDate;
    private final LocalTime minPriceDepartureTime;
    private final Integer minDurationMinutes;
    private final String minDurationText;

    public static FlightRouteSearchResponseDto of(FlightRoute route, FlightOption directMinPriceOption, FlightOption layoverMinPriceOption) {
        FlightOption minPriceOption = getMinPriceOption(directMinPriceOption, layoverMinPriceOption);

        return new FlightRouteSearchResponseDto(
                route.getId(),route.getOriginAirport().getCode(),route.getOriginAirport().getName(), route.getOriginAirport().getCityName(),
                route.getDestinationAirport().getCode(),route.getDestinationAirport().getName(),route.getDestinationAirport().getCityName(),
                route.getRouteConnectionPolicy().name(),directMinPriceOption !=null, layoverMinPriceOption!=null,
                getPrice(directMinPriceOption), getDepartureDate(directMinPriceOption), getDepartureTime(directMinPriceOption),getDurationMinutes(directMinPriceOption),formatDuration(getDurationMinutes(directMinPriceOption)),
                getPrice(layoverMinPriceOption), getDepartureDate(layoverMinPriceOption), getDepartureTime(layoverMinPriceOption),getDurationMinutes(layoverMinPriceOption),formatDuration(getDurationMinutes(layoverMinPriceOption)),
                getPrice(minPriceOption), getDepartureDate(minPriceOption), getDepartureTime(minPriceOption),getDurationMinutes(minPriceOption),formatDuration(getDurationMinutes(minPriceOption))
        );
    }


    private static FlightOption getMinPriceOption(FlightOption directMinPriceOption, FlightOption layoverMinPriceOption) {
        if (directMinPriceOption == null) {
            return layoverMinPriceOption;
        }
        if (layoverMinPriceOption == null) {
            return directMinPriceOption;
        }
        int priceCompare = directMinPriceOption.getPrice().compareTo(layoverMinPriceOption.getPrice());
        if (priceCompare != 0) {
            return priceCompare <= 0 ? directMinPriceOption : layoverMinPriceOption;
        }
        int dateCompare = directMinPriceOption.getDepartureDate().compareTo(layoverMinPriceOption.getDepartureDate());
        if (dateCompare != 0) {
            return dateCompare <= 0 ? directMinPriceOption : layoverMinPriceOption;
        }
        return directMinPriceOption.getDepartureTime().compareTo(layoverMinPriceOption.getDepartureTime()) <= 0 ? directMinPriceOption : layoverMinPriceOption;
    }


    private static BigDecimal getPrice(FlightOption option) {
        if (option == null) {
            return null;
        }
        return option.getPrice();
    }


    private static LocalDate getDepartureDate(FlightOption option) {
        if (option == null) {
            return null;
        }
        return option.getDepartureDate();
    }

    private static LocalTime getDepartureTime(FlightOption option) {
        if (option == null) {
            return null;
        }
        return option.getDepartureTime();
    }

    private static Integer getDurationMinutes(FlightOption option) {
        if (option == null) {
            return null;
        }
        return option.getTotalDurationMinutes();
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
