package com.money.exchange.Repository;

import com.money.exchange.Entity.Currency;
import com.money.exchange.Entity.ExchangeRateHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ExchangeRateHistoryRepository extends JpaRepository<ExchangeRateHistory, Long> {
//    상세 페이지 차트(환율 기록을 오름 차순으로 조회)
    List<ExchangeRateHistory> findByCurrencyAndRateDateBetweenOrderByRateDateAsc(
            Currency currency,
            LocalDate startDate,
            LocalDate endDate
    );
// 저장 할때 중복 체크용
    boolean existsByCurrencyAndRateDate(
            Currency currency,
            LocalDate rateDate
    );
}
