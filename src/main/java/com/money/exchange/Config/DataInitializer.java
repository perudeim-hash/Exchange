package com.money.exchange.Config;

import com.money.exchange.Entity.Currency;
import com.money.exchange.Repository.CurrencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final CurrencyRepository currencyRepository;

    @Override
    @Transactional
    public void run(String... args) {
        initCurrencies();
    }

    private void initCurrencies(){
        if (currencyRepository.findByCode("USD").isPresent()) {
            return;
        }
        Currency usd = new Currency(
                "USD",
                "미국",
                "달러",
                "$",
                1,
                true,
                1
        );
        currencyRepository.save(usd);
    }
}
