package com.money.exchange.Service;

import com.money.exchange.Entity.Currency;
import com.money.exchange.Entity.RateHistory;
import com.money.exchange.Repository.RateHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateHistoryImportService {

    @Value("${exchange.bok-api-key}")
    private String apiKey;

    private final CurrencyService currencyService;

    private final RateHistoryRepository historyRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    // 1년치 통화 저장
    @Transactional
    public void importHistory(String currencyCode) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusYears(1);

        importHistoryByDateRange(currencyCode, startDate, endDate);
    }

    // 특정 통화 최근 저장
    @Transactional
    public void importRecentHistory(String currencyCode,int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);

        importHistoryByDateRange(currencyCode, startDate, endDate);
    }
    @Transactional
    public void importRecentAllHistory(int days) {
        List<Currency> currencies = currencyService.getEnabledCurrencies();

        for (Currency currency : currencies) {
            if (currency.getBokItemCode() == null || currency.getBokItemCode().isBlank()) {
                log.warn("BOK itemCode 없다. 수집 건너뜀. currencyCode={} ", currency.getCode());

                continue;
            }
            try {
                importRecentHistory(currency.getCode(), days);
                log.info("환율 데이터 수집 완료. currencyCode={}, days={}", currency.getCode(), days);
            } catch (Exception e) {
                log.error("환율 데이터 수집 실패. currencyCode={}, days={}", currency.getCode(), days, e);

            }
        }
        log.info("최근 환율 데이터 수집 종료. days={}", days);

    }

    // 모든 통화 1년치 저장
    @Transactional
    public void importAllHistory() {
        List<Currency> currencies = currencyService.getEnabledCurrencies();

        for (Currency currency : currencies) {
            if (currency.getBokItemCode() == null || currency.getBokItemCode().isBlank()) {
                continue;
            }
            importHistory(currency.getCode());
        }
    }

    public void printBokItemCodes() {
        String url = "https://ecos.bok.or.kr/api/StatisticItemList/"
                + apiKey + "/json/kr/1/1000/731Y001";
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        System.out.println("=====================" + response);
    }

    private void importHistoryByDateRange(String currencyCode, LocalDate startDate, LocalDate endDate) {
        Currency currency = currencyService.getCurrencyByCode(currencyCode);
        String itemCode = currency.getBokItemCode();

        if (itemCode == null || itemCode.isBlank()) {
            throw new IllegalArgumentException("한국은행 과거 환율 조회를 지원하지 않습니다.");
        }

        String start = startDate.toString().replace("-", "");
        String end = endDate.toString().replace("-", "");

        String url = "https://ecos.bok.or.kr/api/StatisticSearch/"
                + apiKey + "/json/kr/1/1000/731Y001/D/"
                + start + "/" + end + "/" + itemCode;

        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null || !response.containsKey("StatisticSearch")) {
            throw new IllegalArgumentException("한국은행 API 응답 오류 - currencyCode=" + currencyCode + ", response=" + response);
        }

        Map<String, Object> body = (Map<String, Object>) response.get("StatisticSearch");

        List<Map<String, String>> rows = (List<Map<String, String>>) body.get("row");

        if (rows == null || rows.isEmpty()) {
            return;
        }


        for (Map<String, String> row : rows) {
            String dateStr = row.get("TIME");
            String rateStr = row.get("DATA_VALUE");

            LocalDate date = LocalDate.parse(
                    dateStr.substring(0, 4) + "-" +
                            dateStr.substring(4, 6) + "-" +
                            dateStr.substring(6, 8)
            );


            BigDecimal rate = new BigDecimal(rateStr);
            boolean exists = historyRepository.existsByCurrencyAndRateDate(
                    currency, date);

            if (!exists) {
                RateHistory history = new RateHistory(
                        currency, date, rate, "BOK"
                );

                historyRepository.save(history);
            }
        }

    }
}