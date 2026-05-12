package com.money.flight.service.exporter;

import com.money.flight.entity.FlightOption;
import com.money.flight.entity.FlightRoute;
import com.money.flight.repository.FlightOptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class FlightOptionCsvExporter {
    private static final Path CSV_OUTPUT_DIR = Path.of("data/generated/flight-options");

    private final FlightOptionRepository flightOptionRepository;

    @Transactional(readOnly = true)
    public void exportMonthlyCsv(LocalDate startDate, LocalDate endDate) throws IOException {
        Files.createDirectories(CSV_OUTPUT_DIR);

        List<FlightOption> options = flightOptionRepository.findByDepartureDateBetweenAndEnabledTrueOrderByDepartureDateAsc(startDate, endDate);
        // 이거 어렵다 나중에 공부
        Map<YearMonth, List<FlightOption>> groupedOptions = options.stream()
                .collect(Collectors.groupingBy(option -> YearMonth.from(
                        option.getDepartureDate()), TreeMap::new, Collectors.toList()
                ));

        for (Map.Entry<YearMonth, List<FlightOption>> entry : groupedOptions.entrySet()) {
            YearMonth yearMonth = entry.getKey();
            List<FlightOption> monthlyOptions = entry.getValue();
            Path filePath = CSV_OUTPUT_DIR.resolve("flight_options_" + yearMonth + ".csv");
            writeMonthlyCsv(filePath, monthlyOptions);
        }
    }

    private void writeMonthlyCsv(Path filePath, List<FlightOption> options) throws IOException {
        try (BufferedWriter writer = Files.newBufferedWriter(filePath, StandardCharsets.UTF_8)) {
            writer.write("id,departureDate,originAirportCode,destinationAirportCode," +
                    "airlineCode,airlineName,seatClass,connectionType,layoverAirportCode," +
                    "departureTime,arrivalDate,arrivalTime,flightDurationMinutes,layoverDurationMinutes,totalDurationMinutes,price");
            writer.newLine();
            for (FlightOption option : options) {
                writer.write(toCsvLine(option));
                writer.newLine();
            }
        }
    }

    private String toCsvLine(FlightOption option) {
        FlightRoute route = option.getFlightRoute();

        String layoverAirportCode = option.getLayoverAirport() == null ? "" : option.getLayoverAirport().getCode();

        String layoverDurationMinutes = option.getLayoverDurationMinutes() == null ? "" : String.valueOf(option.getLayoverDurationMinutes());

        return String.join(",", String.valueOf(option.getId()), String.valueOf(option.getDepartureDate())
                , route.getOriginAirport().getCode(), route.getDestinationAirport().getCode(), option.getAirline().getCode(), option.getAirline().getName()
                , option.getSeatClass().name(), option.getConnectionType().name(), layoverAirportCode, String.valueOf(option.getDepartureTime()), String.valueOf(option.getArrivalDate()), String.valueOf(option.getArrivalTime())
                , String.valueOf(option.getFlightDurationMinutes()), layoverDurationMinutes, String.valueOf(option.getTotalDurationMinutes()), String.valueOf(option.getPrice()));
    }


}
