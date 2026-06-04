package com.money.event.dto;

import com.money.exchange.entity.Country;
import lombok.Getter;

import java.util.List;

@Getter
public class TravelEventLocationResponseDto {

    private final String region;
    private final String regionName;
    private final List<CountryLocationDto> countries;

    private TravelEventLocationResponseDto(String region, String regionName, List<CountryLocationDto> countries) {
        this.region = region;
        this.regionName = regionName;
        this.countries = countries;
    }

    public static TravelEventLocationResponseDto of(String region, String regionName, List<CountryLocationDto> countries) {
        return new TravelEventLocationResponseDto(region, regionName, countries);
    }
    @Getter
    public static class CountryLocationDto{
        private final String countryCode;
        private final String countryName;
        private final List<String> cities;

        private CountryLocationDto(String countryCode, String countryName, List<String> cities) {
            this.countryCode = countryCode;
            this.countryName = countryName;
            this.cities = cities;
        }

        public static CountryLocationDto of(String countryCode, String countryName, List<String> cities) {
            return new CountryLocationDto(countryCode, countryName, cities);
        }
    }
}

