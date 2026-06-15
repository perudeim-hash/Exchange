package com.money.flight.service;

import com.money.flight.dto.FlightRouteSummaryResponseDto;
import com.money.flight.entity.Airport;
import com.money.flight.entity.FlightRoute;
import com.money.flight.repository.AirportRepository;
import com.money.flight.repository.FlightRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FlightRouteViewService {
    private final FlightRouteRepository flightRouteRepository;
    private final AirportRepository airportRepository;

    @Transactional(readOnly = true)
    public List<FlightRouteSummaryResponseDto> getRoutes() {
        return flightRouteRepository.findByEnabledTrueOrderByDisplayOrderAsc().stream()
                .map(FlightRouteSummaryResponseDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public FlightRouteSummaryResponseDto getRouteDetail(String originCode, String destinationCode) {
        String normalizedOriginCode = normalizeAirportCode(originCode, "출발 공항 코드는 필수입니다.");
        String normalizedDestinationCode = normalizeAirportCode(destinationCode, "도착 공항 코드는 필수입니다.");

        if (normalizedOriginCode.equals(normalizedDestinationCode)) {
            throw new IllegalArgumentException("출발 공항과 도착 공항은 같을 수 없습니다.");
        }

        Airport originAirport = airportRepository.findByCode(normalizedOriginCode)
                .orElseThrow(() -> new IllegalArgumentException("출발 공항 정보를 찾을 수 없습니다."));
        Airport destinationAirport = airportRepository.findByCode(normalizedDestinationCode)
                .orElseThrow(() -> new IllegalArgumentException("도착 공항 정보를 찾을 수 없습니다."));
        FlightRoute route = flightRouteRepository.findByOriginAirportAndDestinationAirport(originAirport, destinationAirport)
                .orElseThrow(()-> new IllegalArgumentException("해당 노선이 존재하지 않습니다. originCode = " + normalizedOriginCode + ", destination = " + normalizedDestinationCode));

        if (!Boolean.TRUE.equals(route.getEnabled())) {
            throw new IllegalArgumentException("현재 비활성화된 노선입니다.");
        }
        return FlightRouteSummaryResponseDto.from(route);

    }

    private String normalizeAirportCode(String airportCode, String message) {
        if (airportCode == null || airportCode.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return airportCode.trim().toUpperCase();
    }
}
