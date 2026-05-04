package com.money.exchange.Scheduler;

import com.money.exchange.Service.RateHistoryImportService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateHistoryScheduler {

    private final RateHistoryImportService rateHistoryImportService;

    @Scheduled(cron = "0 30 12 * * MON-FRI", zone = "Asia/Seoul")
    public void importRecentExchangeRates() {
        log.info("최근 환율 데이터 저장 시작");
        rateHistoryImportService.importRecentAllHistory(7);
        log.info("최근 환율 데이터 저장 완료");

    }


    @PostConstruct
    public void importOnStartUp() {
        log.info("서버 시작 시 최근 환율 데이터 저장 시작");
        rateHistoryImportService.importRecentAllHistory(7);
        log.info("서버 시작 시 최근 환율 데이터 저장 완료");

    }


}
