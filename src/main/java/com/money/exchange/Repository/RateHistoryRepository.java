package com.money.exchange.Repository;

import com.money.exchange.Entity.Currency;
import com.money.exchange.Entity.RateHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RateHistoryRepository extends JpaRepository<RateHistory, Long> {
//    상세 페이지 차트(환율 기록을 오름 차순으로 조회)
    List<RateHistory> findByCurrencyAndRateDateBetweenOrderByRateDateAsc(
            Currency currency,
            LocalDate startDate,
            LocalDate endDate
    );

    List<RateHistory> findByCurrencyOrderByRateDateAsc(Currency currency);

// 저장 할때 중복 체크용
    boolean existsByCurrencyAndRateDate(
            Currency currency,
            LocalDate rateDate
    );

    Optional<RateHistory> findTopByCurrencyOrderByRateDateDesc(Currency currency);
}
