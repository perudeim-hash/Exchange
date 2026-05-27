package com.money.exchange.service;

import com.money.exchange.dto.MonthlyAverageRateDto;
import com.money.exchange.dto.RateHistoryAnalysisResponseDto;
import com.money.exchange.dto.RateHistoryResponseDto;
import com.money.exchange.dto.RateSummaryDto;
import com.money.exchange.entity.Currency;
import com.money.exchange.entity.RateHistory;
import com.money.exchange.repository.RateHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExchangeRateAnalysisService {
    private final CurrencyService currencyService;
    private final RateHistoryRepository historyRepository;

    public RateHistoryAnalysisResponseDto getAnalysis(String currencyCode, LocalDate from, LocalDate to, Integer limit) {
        Currency currency = currencyService.getCurrencyByCode(currencyCode);

        List<RateHistory> histories = findHistories(currency, from, to);
        histories = applyLimit(histories, limit);

        if (histories.isEmpty()) {
            return RateHistoryAnalysisResponseDto.empty(currencyCode);
        }
        RateHistory latest = histories.get(histories.size() - 1);

        RateHistory max = histories.stream()
                .max(Comparator.comparing(RateHistory::getRate))
                .orElseThrow();

        RateHistory min = histories.stream()
                .min(Comparator.comparing(RateHistory::getRate))
                .orElseThrow();

        List<MonthlyAverageRateDto> monthlyAverages = calculateMonthlyAverages(histories);
        MonthlyAverageRateDto lowestMonth = monthlyAverages.stream()
                .min(Comparator.comparing(MonthlyAverageRateDto::getAverageRate))
                .orElseThrow(null);

        MonthlyAverageRateDto highestMonth = monthlyAverages.stream()
                .max(Comparator.comparing(MonthlyAverageRateDto::getAverageRate))
                .orElseThrow(null);

        List<RateHistoryResponseDto> historyDtos = histories.stream()
                .map(RateHistoryResponseDto::from)
                .toList();

        return RateHistoryAnalysisResponseDto.of(
                currencyCode, histories.get(0).getRateDate(),
                latest.getRateDate(), histories.size(),
                RateSummaryDto.from(latest), RateSummaryDto.from(max), RateSummaryDto.from(min),
                lowestMonth, highestMonth, monthlyAverages, historyDtos
        );
    }


    private List<RateHistory> findHistories(Currency currency, LocalDate from, LocalDate to) {
        if (from != null && to != null) {
            return historyRepository.findByCurrencyAndRateDateBetweenOrderByRateDateAsc(currency, from, to);
        }
        return historyRepository.findByCurrencyOrderByRateDateAsc(currency);
    }

    private List<RateHistory> applyLimit(List<RateHistory> histories, Integer limit) {
        if (limit == null || limit <= 0 || histories.size() < limit) {
            return histories;
        }
        // subList?? 이게 머임
        return histories.subList(histories.size() - limit, histories.size());
    }

    private List<MonthlyAverageRateDto> calculateMonthlyAverages(List<RateHistory> histories) {
        Map<YearMonth, MonthlyRateAccumulator> monthlyMap = new TreeMap<>();

        for (RateHistory history : histories) {
            YearMonth yearMonth = YearMonth.from(history.getRateDate());
//            putIfAbsent??
            monthlyMap.putIfAbsent(yearMonth, new MonthlyRateAccumulator());
            MonthlyRateAccumulator accumulator = monthlyMap.get(yearMonth);
            accumulator.add(history.getRate());
        }

        return monthlyMap.entrySet().stream()
                .map(entry -> MonthlyAverageRateDto.of(entry.getKey().toString(), entry.getValue().getAverageRate(), entry.getValue().getCount()))
        .toList();
    }

    private static class MonthlyRateAccumulator {
        private BigDecimal sum = BigDecimal.ZERO;
        private int count = 0;

        public void add(BigDecimal rate) {
            if (rate == null) {
                return;
            }
            this.sum = this.sum.add(rate);
            this.count++;
        }

        public BigDecimal getAverageRate() {
            if (count == 0){
                return BigDecimal.ZERO;
            }
            return sum.divide(BigDecimal.valueOf(count), 4, RoundingMode.HALF_UP);
        }
        public int getCount(){
            return count;
        }
    }
}
