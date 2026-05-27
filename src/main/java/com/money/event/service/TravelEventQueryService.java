package com.money.event.service;

import com.money.event.dto.MonthlyTravelEventResponseDto;
import com.money.event.dto.TravelEventCalendarResponseDto;
import com.money.event.dto.TravelEventCsvRowDto;
import com.money.event.dto.TravelEventResponseDto;
import com.money.event.entity.TravelEvent;
import com.money.event.repository.TravelEventRepository;
import com.money.flight.entity.Airport;
import com.money.flight.repository.AirportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TravelEventQueryService {
    private final TravelEventRepository travelEventRepository;
    private final AirportRepository airportRepository;

    public TravelEventCalendarResponseDto getMonthlyEventsByAirportCode(String airPortCode) {
        Airport airport = getAirportByCode(airPortCode);

        String countryCode = airport.getCountry().getCode();
        String countryName = airport.getCountry().getName();
        String cityName = airport.getCityName();

        List<TravelEvent> events = travelEventRepository.findByCountryCodeAndCityNameAndEnabledTrueOrderByMonthAscDisplayOrderAsc(countryCode, cityName);
        List<MonthlyTravelEventResponseDto> monthlyEvents = toMonthlyResponses(events);

        return TravelEventCalendarResponseDto.of(airport.getCode(), countryCode, countryName, cityName, monthlyEvents);
    }

    public TravelEventCalendarResponseDto getMonthlyEventsByAirportCodeAndMonth(String airportCode, Integer month) {
        validateMonth(month);
        Airport airport = getAirportByCode(airportCode);

        String countryCode = airport.getCountry().getCode();
        String countryName = airport.getCountry().getName();

        String cityName = airport.getCityName();
        List<TravelEvent> events = travelEventRepository.findByCountryCodeAndCityNameAndMonthAndEnabledTrueOrderByDisplayOrderAsc(countryCode, cityName, month);
        List<MonthlyTravelEventResponseDto> monthlyEvents = List.of(MonthlyTravelEventResponseDto.of(month, toEventResponseDtos(events)));
        return TravelEventCalendarResponseDto.of(airport.getCode(), countryCode, countryName, cityName, monthlyEvents);
    }


    public TravelEventCalendarResponseDto getMonthlyEventsByCountryAndCity(String countryCode, String cityName) {
        String normalizedCountryCode = normalizeCountryCode(countryCode);
        String normalizedCityName = normalizeCityName(cityName);

        List<TravelEvent> events = travelEventRepository.findByCountryCodeAndCityNameAndEnabledTrueOrderByMonthAscDisplayOrderAsc(normalizedCountryCode, normalizedCityName);
        String countryName = events.isEmpty() ? "" : events.get(0).getCountryName();
        List<MonthlyTravelEventResponseDto> monthlyEvents = toMonthlyResponses(events);
        return TravelEventCalendarResponseDto.of(null, countryCode, countryName, cityName, monthlyEvents);
    }


    public TravelEventCalendarResponseDto getMonthlyEventsByCountryAndCityAndMonth(String countryCode, String cityName, Integer month) {
        validateMonth(month);

        String normalizedCountryCode = normalizeCountryCode(countryCode);
        String normalizedCityName = normalizeCityName(cityName);

        List<TravelEvent> events = travelEventRepository.findByCountryCodeAndCityNameAndMonthAndEnabledTrueOrderByDisplayOrderAsc(normalizedCountryCode, normalizedCityName, month);
        String countryName = events.isEmpty() ? "" : events.get(0).getCountryName();
        List<MonthlyTravelEventResponseDto> monthlyEvents = List.of(MonthlyTravelEventResponseDto.of(month, toEventResponseDtos(events)));
        return TravelEventCalendarResponseDto.of(null, normalizedCountryCode, countryName, normalizedCityName, monthlyEvents);
    }

    private Airport getAirportByCode(String airPortCode) {
        String normalizedAirportCode = normalizedAirportCode(airPortCode);

        return airportRepository.findByCode(normalizedAirportCode)
                .orElseThrow(() -> new IllegalArgumentException("해당 공항을 찾을 수 없습니다. airportCode = " + normalizedAirportCode));
    }

    private List<MonthlyTravelEventResponseDto> toMonthlyResponses(List<TravelEvent> events) {
        Map<Integer, List<TravelEventResponseDto>> eventsByMonth = new LinkedHashMap<>();

        for (int month = 1; month <= 12; month++) {
            eventsByMonth.put(month, new ArrayList<>());
        }

        for (TravelEvent event : events) {
            Integer month = event.getMonth();
            if (month == null || month < 1 || month > 12) {
                continue;
            }
            eventsByMonth.get(month).add(TravelEventResponseDto.from(event));
        }
        List<MonthlyTravelEventResponseDto> result = new ArrayList<>();

        for (int month = 1; month <= 12; month++) {
            result.add(MonthlyTravelEventResponseDto.of(month, eventsByMonth.get(month)));
        }
        return result;
    }

    private List<TravelEventResponseDto> toEventResponseDtos(List<TravelEvent> events) {
        return events.stream()
                .map(TravelEventResponseDto::from)
                .toList();
    }

    private String normalizedAirportCode(String airPortCode) {
        if (airPortCode == null || airPortCode.isBlank()) {
            throw new IllegalArgumentException("공항 코드는 필수입니다.");
        }
        return airPortCode.trim().toUpperCase();
    }

    private String normalizeCityName(String cityName) {
        if (cityName == null || cityName.isBlank()) {
            throw new IllegalArgumentException("도시 이름은 필수입니다.");
        }
        return cityName.trim();
    }


    private String normalizeCountryCode(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            throw new IllegalArgumentException("국가 코드는 필수입니다.");
        }
        return countryCode.trim().toUpperCase();
    }

    private void validateMonth(Integer month) {
        if (month == null || month < 1 || month > 12) {
            throw new IllegalArgumentException("1월부터 12월까지만 가능합니다.");
        }

    }

}
