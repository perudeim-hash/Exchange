package com.money.flight.service;

import com.money.flight.dto.AirportResponseDto;
import com.money.flight.repository.AirportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FlightAirportService {
    private final AirportRepository airportRepository;

    @Transactional(readOnly = true)
    public List<AirportResponseDto> getEnabledAirports(){
        return airportRepository.findEnabledAirportsWithCountry().stream()
                .map(airport -> AirportResponseDto.from(airport))
                .toList();
    }

}
