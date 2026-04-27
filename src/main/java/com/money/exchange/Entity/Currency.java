package com.money.exchange.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class Currency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String code;

    @Column(nullable = false, length = 50)
    private String countryName;

    @Column(nullable = false, length = 50)
    private String currencyName;

    @Column(length = 10)
    private String symbol;

    @Column(nullable = false)
    private Integer unit;

    @Column(nullable = false)
    private Boolean enabled;

    @Column(nullable = false)
    private Integer displayOrder;

    public Currency(String code, String countryName, String currencyName, String symbol, Integer unit, Boolean enabled, Integer displayOrder) {
        this.code = code;
        this.countryName = countryName;
        this.currencyName = currencyName;
        this.symbol = symbol;
        this.unit = unit;
        this.enabled = enabled;
        this.displayOrder = displayOrder;
    }
}
