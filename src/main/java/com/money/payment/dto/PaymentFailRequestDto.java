package com.money.payment.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentFailRequestDto {
    private String orderId;
    private String reason;
}
