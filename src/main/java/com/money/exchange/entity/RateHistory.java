package com.money.exchange.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Getter
@NoArgsConstructor

@Table(
        name = "exchange_rate_history",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"currency_id", "rate_date"})
        }
)
public class RateHistory {

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


    public RateHistory(Currency currency, LocalDate rateDate, BigDecimal rate, String source) {
        this.currency = currency;
        this.rateDate = rateDate;
        this.rate = rate;
        this.source = source;
    }
}
