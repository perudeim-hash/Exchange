package com.money.flight.service;

import com.money.flight.entity.FlightOption;
import com.money.flight.entity.FlightRoute;
import com.money.flight.enums.ConnectionType;
import com.money.flight.repository.FlightOptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FlightRouteStatsService {
    private final FlightOptionRepository flightOptionRepository;

    @Transactional
    public void updateRouteStats(LocalDate startDate, LocalDate endDate, List<FlightRoute> routes) {
        for (FlightRoute route : routes) {
            List<FlightOption> options = flightOptionRepository.findByFlightRouteAndDepartureDateBetweenAndEnabledTrue(route, startDate, endDate);

            List<FlightOption> directOptions = options.stream().filter(option -> option.getConnectionType() == ConnectionType.DIRECT)
                    .toList();

            List<FlightOption> layoverOptions = options.stream().filter(option -> option.getConnectionType() == ConnectionType.ONE_STOP)
                    .toList();

            route.updateStats(minPrice(directOptions), avgPrice(directOptions), minDuration(directOptions), avgDuration(directOptions), minPrice(layoverOptions), avgPrice(layoverOptions), minDuration(layoverOptions), avgDuration(layoverOptions), !directOptions.isEmpty(), !layoverOptions.isEmpty());
        }
    }

    private BigDecimal minPrice(List<FlightOption> options) {
        return options.stream().map(FlightOption::getPrice).min(BigDecimal::compareTo).orElse(null);
    }
    private BigDecimal avgPrice(List<FlightOption> options) {
        if (options.isEmpty()) {
            return null;
        }
        BigDecimal sum = options.stream().map(FlightOption::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);

        return sum.divide(BigDecimal.valueOf(options.size()), 0, RoundingMode.HALF_UP);
    }

    private Integer minDuration(List<FlightOption> options) {
        return options.stream().map(FlightOption::getTotalDurationMinutes).min(Integer::compareTo).orElse(null);
    }

    private Integer avgDuration(List<FlightOption> options) {
        if (options.isEmpty()) {
            return null;
        }
        int sum = options.stream().mapToInt(FlightOption::getTotalDurationMinutes).sum();

        return Math.round((float) sum / options.size());
    }


}
