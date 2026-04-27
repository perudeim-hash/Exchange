package com.money.exchange.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.cglib.core.Local;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Getter
@NoArgsConstructor

@Table(
        name = "exchange_rate_history",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"currency_code", "rate_date"})
        }
)
public class ExchangeRateHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "currency_id", nullable = false)
    private Currency currency;


    @Column(name = "rate_date", nullable = false)
    private LocalDate rateDate;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal rate;

    @Column(nullable = false, length = 30)
    private String source;


    public ExchangeRateHistory(Currency currency, LocalDate rateDate, BigDecimal rate, String source) {
        this.currency = currency;
        this.rateDate = rateDate;
        this.rate = rate;
        this.source = source;
    }
}
