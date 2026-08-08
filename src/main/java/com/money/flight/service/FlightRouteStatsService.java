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
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FlightRouteStatsService {
    private final FlightOptionRepository flightOptionRepository;

    @Transactional
    public void updateRouteStats(LocalDate startDate, LocalDate endDate, List<FlightRoute> routes) {
        LocalDate today = LocalDate.now();
        LocalTime nowTime = LocalTime.now();

        LocalDate statsStartDate = startDate.isBefore(today) ? today : startDate;
        for (FlightRoute route : routes) {

            List<FlightOption> options = flightOptionRepository.findAvailableOptionsForRouteStats(route, statsStartDate, nowTime,endDate);

            List<FlightOption> directOptions = options.stream().filter(option -> option.getConnectionType() == ConnectionType.DIRECT)
                    .toList();

            List<FlightOption> layoverOptions = options.stream().filter(option -> option.getConnectionType() == ConnectionType.ONE_STOP)
                    .toList();

            FlightOption directMinPriceOption = minPriceOption(directOptions);
            FlightOption layoverMinPriceOption = minPriceOption(layoverOptions);

            route.updateStats(getPrice(directMinPriceOption), getDepartureDate(directMinPriceOption), getDepartureTime(directMinPriceOption), avgPrice(directOptions), minDuration(directOptions), avgDuration(directOptions),
                    getPrice(layoverMinPriceOption), getDepartureDate(layoverMinPriceOption), getDepartureTime(layoverMinPriceOption), avgPrice(layoverOptions), minDuration(layoverOptions), avgDuration(layoverOptions),
                    !directOptions.isEmpty(), !layoverOptions.isEmpty());
        }
    }



    private FlightOption minPriceOption(List<FlightOption> options) {
        return options.stream().min((option1, option2) -> {
                    int priceCompare = option1.getPrice().compareTo(option2.getPrice());
                    if (priceCompare != 0) {
                        return priceCompare;
                    }
                    int dateCompare = option1.getDepartureDate().compareTo(option2.getDepartureDate());
                    if (dateCompare != 0) {
                        return dateCompare;
                    }
                    return option1.getDepartureTime().compareTo(option2.getDepartureTime());
                })
                .orElse(null);
    }

    private BigDecimal getPrice(FlightOption option) {
        if (option == null) {
            return null;
        }
        return option.getPrice();
    }

    private LocalDate getDepartureDate(FlightOption option) {
        if (option == null) {
            return null;
        }
        return option.getDepartureDate();
    }
    private LocalTime getDepartureTime(FlightOption option) {
        if (option == null) {
            return null;
        }
        return option.getDepartureTime();
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
