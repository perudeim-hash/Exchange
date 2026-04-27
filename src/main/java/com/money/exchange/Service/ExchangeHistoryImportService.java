package com.money.exchange.Service;

import com.money.exchange.Entity.Currency;
import com.money.exchange.Entity.ExchangeRateHistory;
import com.money.exchange.Repository.ExchangeRateHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExchangeHistoryImportService {

    @Value("${exchange.bok-api-key}")
    private String apiKey;

    private final CurrencyService currencyService;

    private final ExchangeRateHistoryRepository historyRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional
    public void importUsdHistory() {
        Currency currency = currencyService.getCurrencyByCode("USD");

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusYears(1);

        String start = startDate.toString().replace("-", "");
        String end = endDate.toString().replace("-", "");

        String url = "https://ecos.bok.or.kr/api/StatisticSearch/"
                + apiKey + "/json/kr/1/1000/731Y001/D/"
                + start + "/" + end + "/0000001";

        Map<String, Object> response = restTemplate.getForObject(url, Map.class);

        Map<String, Object> body = (Map<String, Object>) response.get("StatisticSearch");

        List<Map<String, String>> rows = (List<Map<String, String>>) body.get("row");

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
                ExchangeRateHistory history = new ExchangeRateHistory(
                        currency, date, rate, "BOK"
                );

                historyRepository.save(history);
            }
        }
    }
}