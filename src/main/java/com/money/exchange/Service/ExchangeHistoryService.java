package com.money.exchange.Service;

import com.money.exchange.Dto.ExchangeHistoryResponseDto;
import com.money.exchange.Entity.Currency;
import com.money.exchange.Entity.ExchangeRateHistory;
import com.money.exchange.Repository.ExchangeRateHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExchangeHistoryService {
    private final CurrencyService currencyService;
    private final ExchangeRateHistoryRepository historyRepository;

    public List<ExchangeHistoryResponseDto> getHistory(String currencyCode, int years) {
        Currency currency = currencyService.getCurrencyByCode(currencyCode);

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusYears(years);

        return historyRepository.findByCurrencyAndRateDateBetweenOrderByRateDateAsc(
                        currency,
                        startDate,
                        endDate
                )
                .stream()
                .map(ExchangeHistoryResponseDto::from)
                .toList();

    }

}
