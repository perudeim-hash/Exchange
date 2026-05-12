package com.money.flight.service;

import com.money.flight.entity.Airline;
import com.money.flight.entity.FlightOption;
import com.money.flight.entity.FlightRoute;
import com.money.flight.repository.AirlineRepository;
import com.money.flight.repository.FlightOptionRepository;
import com.money.flight.repository.FlightRouteRepository;
import com.money.flight.service.exporter.FlightOptionCsvExporter;
import com.money.flight.service.generator.FlightOptionGenerator;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class FlightOptionSeedService {

    private static final int SAVE_BATCH_SIZE = 1000;

    private final FlightRouteRepository flightRouteRepository;
    private final AirlineRepository airlineRepository;
    private final FlightOptionRepository flightOptionRepository;
    private final FlightOptionGenerator flightOptionGenerator;
    private final FlightRouteStatsService flightRouteStatsService;
    private final FlightOptionCsvExporter flightOptionCsvExporter;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public void generateFlightOptions(LocalDate baseDate) throws IOException {

        LocalDate pastStartDate = baseDate.minusYears(1);
        LocalDate pastEndDate = baseDate.minusDays(1);

        LocalDate futureStartDate = baseDate;
        LocalDate futureEndDate = baseDate.plusMonths(1);

        cleanupOldOptions(pastStartDate);

        List<FlightRoute> routes = flightRouteRepository.findByEnabledTrueOrderByDisplayOrderAsc();
        List<Airline> airlines = airlineRepository.findByEnabledTrueOrderByDisplayOrderAsc();

        generateDateRange(pastStartDate, pastEndDate, routes, airlines);
        generateDateRange(futureStartDate, futureEndDate, routes, airlines);

        flightRouteStatsService.updateRouteStats(baseDate, futureEndDate, routes);
        flightOptionCsvExporter.exportMonthlyCsv(pastStartDate, futureEndDate);
    }


    @Transactional
    public void generateFlightOptionsFromToday() throws IOException {
        generateFlightOptions(LocalDate.now());
    }

    @Transactional
    public void generateFlightOptionsByRange(LocalDate startDate, LocalDate endDate) {
        validateGenerateDateRange(startDate, endDate);

        log.info("항공권 범위 생성 시작 : {} ~ {}", startDate, endDate);

        List<FlightRoute> routes = flightRouteRepository.findByEnabledTrueOrderByDisplayOrderAsc();
        List<Airline> airlines = airlineRepository.findByEnabledTrueOrderByDisplayOrderAsc();

        initializeRoutes(routes);
        Set<RouteDateKey> existingKeys = findExistingRouteDateKeys(startDate, endDate);
        int createdCount = generateDateRangeWithExistingKeys(startDate, endDate, routes, airlines, existingKeys);
        log.info("항공권 범위 생성 완료 : {} ~ {}, 생성 건수: {}", startDate, endDate,createdCount);

    }

    @Transactional
    public void finalizeFlightOptionsByRange(LocalDate startDate, LocalDate endDate) throws IOException {
        validateReadDateRange(startDate, endDate);
        log.info("항공권 후처리 시작 : {} ~ {} ", startDate, endDate);
        List<FlightRoute> routes = flightRouteRepository.findByEnabledTrueOrderByDisplayOrderAsc();
        flightRouteStatsService.updateRouteStats(startDate, endDate, routes);
        flightOptionCsvExporter.exportMonthlyCsv(startDate, endDate);
        log.info("항공권 후처리 완료 : {} ~ {} ", startDate, endDate);
    }

    @Transactional
    public void deleteOldFlightOptions(LocalDate keepStartDate) {
        if (keepStartDate == null) {
            throw new IllegalArgumentException("유지 시작일은 필수입니다.");
        }
        log.info("오래된 항공권 Data 삭제 시작. 유지 시작일 = {}", keepStartDate);
        long deletedCount = flightOptionRepository.deleteByDepartureDateBefore(keepStartDate);
        log.info("오래된 항공권 Data 삭제 완료. 삭제 건수 = {}", deletedCount);

    }

    @Transactional
    public void updateFlightRouteStatsOnlyByRange(LocalDate startDate, LocalDate endDate) {
        validateReadDateRange(startDate, endDate);
        log.info("항공권 노선 통계 갱신 시작 : {} ~ {} ", startDate, endDate);
        List<FlightRoute> routes = flightRouteRepository.findByEnabledTrueOrderByDisplayOrderAsc();
        flightRouteStatsService.updateRouteStats(startDate, endDate, routes);
        log.info("항공권 노선 통계 갱신 완료 : {} ~ {} ", startDate, endDate);
        
    }

    private void validateGenerateDateRange(LocalDate startDate, LocalDate endDate) {
        validateRequiredDateRange(startDate, endDate);
        if (startDate.plusMonths(3).isBefore(endDate)) {
            throw new IllegalArgumentException("한 번에 생성 가능한 기간은 최대 3개월 입니다.");
        }
    }

    private void validateReadDateRange(LocalDate startDate, LocalDate endDate) {
        validateRequiredDateRange(startDate, endDate);
        if (startDate.plusMonths(14).isBefore(endDate)) {
            throw new IllegalArgumentException("조회/통계/export 가능한 기간은 최대 14개월 입니다.");
        }
    }

    private void validateRequiredDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("시작일과 종료일은 필수압니다.");
        }
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("시작일이 종료일보다 늦을 수 없습니다.");
        }
    }

    private Set<RouteDateKey> findExistingRouteDateKeys(LocalDate startDate, LocalDate endDate) {
        List<FlightOptionRepository.RouteDateProjection> existingRouteDates = flightOptionRepository.findExistingRouteDatesBetween(startDate, endDate);

        Set<RouteDateKey> existingKeys = new HashSet<>();
        for (FlightOptionRepository.RouteDateProjection projection : existingRouteDates) {
            existingKeys.add(new RouteDateKey(projection.getRouteId(), projection.getDepartureDate()));
        }
        return existingKeys;
    }

    private int generateDateRangeWithExistingKeys(LocalDate startDate, LocalDate endDate, List<FlightRoute> routes, List<Airline> airlines, Set<RouteDateKey> existingKeys) {
        int createdCount = 0;
        LocalDate currentDate = startDate;

        List<FlightOption> buffer = new ArrayList<>();

        while (!currentDate.isAfter(endDate)) {
            log.info("항공권 생성 중 날짜 : {}", currentDate);
            for (FlightRoute route : routes) {
                RouteDateKey key = new RouteDateKey(route.getId(), currentDate);
                if (existingKeys.contains(key)) {
                    continue;
                }
                List<FlightOption> options = flightOptionGenerator.generate(route, currentDate, airlines);

                buffer.addAll(options);
                existingKeys.add(key);
                createdCount += options.size();
                if (buffer.size() >= SAVE_BATCH_SIZE) {
                    saveAndClear(buffer);
                }
            }
            currentDate = currentDate.plusDays(1);
        }
        if (!buffer.isEmpty()) {
            saveAndClear(buffer);
        }
        return createdCount;
    }

    private void cleanupOldOptions(LocalDate keepStartDate) {
        flightOptionRepository.deleteByDepartureDateBefore(keepStartDate);
    }

    private void generateDateRange(LocalDate startDate, LocalDate endDate, List<FlightRoute> routes, List<Airline> airlines) {
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            for (FlightRoute route : routes) {
                generateRouteDateOptions(route, currentDate, airlines);
            }
            currentDate = currentDate.plusDays(1);
        }
    }

    private void generateRouteDateOptions(FlightRoute route, LocalDate departureDate, List<Airline> airlines) {
        if (flightOptionRepository.existsByFlightRouteAndDepartureDate(route, departureDate)) {
            return;
        }

        List<FlightOption> options = flightOptionGenerator.generate(route, departureDate, airlines);

        flightOptionRepository.saveAll(options);
    }

    private void saveAndClear(List<FlightOption> buffer) {
        flightOptionRepository.saveAll(buffer);

        entityManager.flush();
        entityManager.clear();
        log.info("항공권 batch 저장 완료 : {}건 ", buffer.size());
        buffer.clear();

    }

    private void initializeRoutes(List<FlightRoute> routes) {
        for (FlightRoute route : routes) {
            route.getOriginAirport().getCode();
            route.getDestinationAirport().getCode();
            route.getDestinationAirport().getCountry().getCode();
            route.getDestinationAirport().getCountry().getRegion();
        }
    }

    private record RouteDateKey(Long routeId, LocalDate departureDate) {
    }
}


