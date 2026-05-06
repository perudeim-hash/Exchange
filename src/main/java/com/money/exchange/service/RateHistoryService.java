package com.money.exchange.service;

import com.money.exchange.dto.RateHistoryResponseDto;
import com.money.exchange.entity.Currency;
import com.money.exchange.entity.RateHistory;
import com.money.exchange.repository.RateHistoryRepository;
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

    public List<RateHistoryResponseDto> getHistory(String currencyCode, LocalDate from, LocalDate to, Integer limit) {
        Currency currency = currencyService.getCurrencyByCode(currencyCode);

        List<RateHistory> histories;

        if (from != null && to != null) {
            histories = historyRepository.findByCurrencyAndRateDateBetweenOrderByRateDateAsc(currency, from, to);

        } else {
            histories = historyRepository.findByCurrencyOrderByRateDateAsc(currency);
        }

        histories = applyLimit(histories, limit);

        return histories.stream()
                .map(RateHistoryResponseDto::from)
                .toList();

    }

    private List<RateHistory> applyLimit(List<RateHistory> histories, Integer limit) {
        if (limit == null || limit <= 0 || histories.size() < limit) {
            return histories;
        }
        return histories.subList(histories.size() - limit, histories.size());
    }


}
