package com.money.exchange.Service;


import com.money.exchange.Dto.TodayRateResponseDto;
import com.money.exchange.Entity.Currency;
import com.money.exchange.Entity.RateHistory;
import com.money.exchange.Repository.RateHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RateService {


    private final CurrencyService currencyService;
    private final RateHistoryRepository historyRepository;


    public List<TodayRateResponseDto> getTodayRatesForEnabledCurrencies() {
        List<Currency> enabledCurrencies = currencyService.getEnabledCurrencies();

        return enabledCurrencies.stream()
                .map(this::findLatestRate)
                .map(TodayRateResponseDto::from)
                .toList();
    }

    private RateHistory findLatestRate(Currency currency) {
        return historyRepository.findTopByCurrencyOrderByRateDateDesc(currency)
                .orElseThrow(() -> new IllegalArgumentException(
                        "저장된 환율 데이터가 없습니다." + currency.getCode()
                ));
    }





}
