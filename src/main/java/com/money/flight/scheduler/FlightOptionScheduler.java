package com.money.flight.scheduler;

import com.money.flight.service.FlightOptionSeedService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class FlightOptionScheduler {

    private final FlightOptionSeedService flightOptionSeedService;

    @Scheduled(cron = "0 30 12 * * *", zone = "Asia/Seoul")
    public void generateDailyFutureFlightOptions() {
        LocalDate today = LocalDate.now();

        LocalDate keepStartDate = today.minusMonths(18);
        LocalDate targetDate = today.plusMonths(1);

        log.info("항공권 자동 생성 스케줄러 시작. today={}, keepStartDate={}, targetDate={}", today, keepStartDate, targetDate);

        flightOptionSeedService.deleteOldFlightOptions(keepStartDate);
        flightOptionSeedService.generateFlightOptionsByRange(targetDate, targetDate);
        flightOptionSeedService.updateFlightRouteStatsOnlyByRange(keepStartDate, targetDate);

        log.info("항공권 자동 생성 스케줄러 완료. targetDate={}", targetDate);
    }

}
