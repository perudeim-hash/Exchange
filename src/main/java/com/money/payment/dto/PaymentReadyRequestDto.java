package com.money.payment.dto;

import com.money.payment.enums.PaymentProvider;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentReadyRequestDto {
    private Long reservationId;
    private PaymentProvider provider;
}
