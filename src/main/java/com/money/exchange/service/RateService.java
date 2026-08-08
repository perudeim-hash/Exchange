package com.money.exchange.service;


import com.money.exchange.dto.CountryRateResponseDto;
import com.money.exchange.dto.RateJudgementDto;
import com.money.exchange.dto.TodayRateResponseDto;
import com.money.exchange.entity.Country;
import com.money.exchange.entity.Currency;
import com.money.exchange.entity.RateHistory;
import com.money.exchange.repository.RateHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RateService {

    private static final String DEFAULT_RANGE = "12m";

    private final RateJudgementCalculator rateJudgementCalculator;
    private final CurrencyService currencyService;
    private final RateHistoryRepository historyRepository;
    private final CountryService countryService;


    public List<CountryRateResponseDto> getCountryRateSummaries(String range) {
        String normalizedRange = normalizeRange(range);

        List<Country> countries = countryService.getEnabledCountries();

        return countries.stream()
                .map(country -> toCountryRateResponse(country, normalizedRange))
                .toList();
    }

    public List<CountryRateResponseDto> getTodayRatesForEnabledCountries() {
        return getCountryRateSummaries(DEFAULT_RANGE);
    }

    public List<TodayRateResponseDto> getTodayRatesForEnabledCurrencies() {
        List<Currency> currencies = currencyService.getEnabledCurrencies();

        return currencies.stream()
                .map(this::toCurrencyRateResponse)
                .toList();
    }


    private TodayRateResponseDto toCurrencyRateResponse(Currency currency) {
        RateHistory history = findLatestRate(currency);
        return TodayRateResponseDto.from(history);
    }


    private CountryRateResponseDto toCountryRateResponse(Country country, String range) {
        Currency currency = country.getCurrency();
        RateHistory latestHistory = findLatestRate(currency);

        List<RateHistory> histories = findHistoriesByRange(currency, latestHistory.getRateDate(), range);

        BigDecimal averageRate = calculateAverageRate(histories);

        RateJudgementDto judgement = rateJudgementCalculator.createJudgement(latestHistory.getRate(), averageRate);

        return CountryRateResponseDto.from(country, latestHistory, averageRate, judgement);
    }

    private RateHistory findLatestRate(Currency currency) {
        return historyRepository.findTopByCurrencyOrderByRateDateDesc(currency)
                .orElseThrow(() -> new IllegalArgumentException(
                        "저장된 환율 데이터가 없습니다." + currency.getCode()
                ));
    }

    private List<RateHistory> findHistoriesByRange(Currency currency, LocalDate latestDate, String range) {
        if ("all".equals(range)) {
            return historyRepository.findByCurrencyOrderByRateDateAsc(currency);
        }
        LocalDate fromDate = calculateFromDate(latestDate, range);
        return historyRepository.findByCurrencyAndRateDateBetweenOrderByRateDateAsc(currency, fromDate, latestDate);
    }

    private LocalDate calculateFromDate(LocalDate latestDate, String range) {
        return switch (range) {
            case "7d" -> latestDate.minusDays(7);
            case "1m" -> latestDate.minusMonths(1);
            case "3m" -> latestDate.minusMonths(3);
            case "6m" -> latestDate.minusMonths(6);
            case "12m" -> latestDate.minusMonths(12);
            default -> latestDate.minusMonths(12);
        };
    }


    private BigDecimal calculateAverageRate(List<RateHistory> histories) {
        BigDecimal sum = BigDecimal.ZERO;
        int count = 0;

        for (RateHistory history : histories) {
            if (history.getRate() == null) {
                continue;
            }
            sum = sum.add(history.getRate());
            count++;
        }
        if (count == 0) {
            return BigDecimal.ZERO;
        }
        return sum.divide(BigDecimal.valueOf(count), 4, RoundingMode.HALF_UP);
    }


    private String normalizeRange(String range) {
        if (range == null || range.isBlank()) {
            return DEFAULT_RANGE;
        }
        String normalizedRange = range.trim().toLowerCase();
        return switch (normalizedRange) {
            case "7d", "1m", "3m", "6m", "12m", "all" -> normalizedRange;
            default -> DEFAULT_RANGE;
        };
    }

}
