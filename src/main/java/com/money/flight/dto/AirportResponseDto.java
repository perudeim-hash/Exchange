package com.money.flight.dto;

import com.money.flight.entity.Airport;
import lombok.Getter;

@Getter
public class AirportResponseDto {
    private final String airportCode;
    private final String airportName;
    private final String cityName;
    private final String countryCode;
    private final String countryName;
    private final String region;

    private AirportResponseDto(String airportCode, String airportName, String cityName, String countryCode, String countryName, String region) {
        this.airportCode = airportCode;
        this.airportName = airportName;
        this.cityName = cityName;
        this.countryCode = countryCode;
        this.countryName = countryName;
        this.region = region;
    }

    public static AirportResponseDto from(Airport airport) {
        return new AirportResponseDto(airport.getCode(), airport.getName(), airport.getCityName(), airport.getCountry().getCode(), airport.getCountry().getName(), airport.getCountry().getRegion());
    }
}
