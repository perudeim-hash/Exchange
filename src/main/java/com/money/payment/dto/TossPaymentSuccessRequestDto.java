package com.money.payment.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TossPaymentSuccessRequestDto {

    private String orderId;
    private String paymentKey;
    private Long amount;
    private String paymentMethod;

}
