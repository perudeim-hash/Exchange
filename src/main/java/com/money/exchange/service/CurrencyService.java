package com.money.exchange.service;

import com.money.exchange.entity.Currency;
import com.money.exchange.repository.CurrencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service

@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CurrencyService {

    private final CurrencyRepository currencyRepository;

    public List<Currency> getEnabledCurrencies(){
        return currencyRepository.findByEnabledTrueOrderByDisplayOrderAsc();
    }

    public Currency getCurrencyByCode(String code) {
        return currencyRepository.findByCode(code)
                .orElseThrow(()
                        -> new IllegalArgumentException("지원하지 않는 통화입니다."));
    }

}
