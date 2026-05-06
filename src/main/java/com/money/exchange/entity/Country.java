package com.money.exchange.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class Country {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 국가 Code
    @Column(nullable = false, unique = true, length = 10)
    private String code;

    // 나라 이름
    @Column(nullable = false, length = 50)
    private String name;

    // ASIA , EUROPE 같은 지역
    @Column(nullable = false, length = 50)
    private String region;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "currency_id", nullable = false)
    private Currency currency;

    @Column(nullable = false)
    private Boolean enabled;

    @Column(nullable = false)
    private Integer displayOrder;

    public Country(String code, String name, String region, Currency currency, Boolean enabled, Integer displayOrder) {
        this.code = code;
        this.name = name;
        this.region = region;
        this.currency = currency;
        this.enabled = enabled;
        this.displayOrder = displayOrder;
    }
}
