package com.money.exchange.repository;

import com.money.exchange.entity.Currency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CurrencyRepository extends JpaRepository<Currency,Long> {

    Optional<Currency> findByCode(String code);

//   enabled 가 True 인것들 중에 화면에 출력할거를 오름차순으로 찾아서 리스트형태로 담음
    List<Currency> findByEnabledTrueOrderByDisplayOrderAsc();

}
