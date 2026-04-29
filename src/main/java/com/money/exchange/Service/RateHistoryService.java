package com.money.exchange.Service;

import com.money.exchange.Dto.RateHistoryResponseDto;
import com.money.exchange.Entity.Currency;
import com.money.exchange.Repository.RateHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RateHistoryService {
    private final CurrencyService currencyService;
    private final RateHistoryRepository historyRepository;

    public List<RateHistoryResponseDto> getHistory(String currencyCode, int years) {
        Currency currency = currencyService.getCurrencyByCode(currencyCode);

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusYears(years);

        return historyRepository.findByCurrencyAndRateDateBetweenOrderByRateDateAsc(
                        currency,
                        startDate,
                        endDate
                )
                .stream()
                .map(RateHistoryResponseDto::from)
                .toList();

    }

}
