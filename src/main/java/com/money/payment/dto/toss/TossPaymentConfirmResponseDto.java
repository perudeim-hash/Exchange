package com.money.payment.dto.toss;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TossPaymentConfirmResponseDto {
    private String paymentKey;
    private String orderId;
    private String orderName;
    private String status;
    private String method;
    private Long totalAmount;
    private String requestedAt;
    private String approvedAt;
    private Receipt receipt;
    private EasyPay easyPay;
    private Failure failure;

    public String getReceiptUrl() {
        if (receipt == null) {
            return null;
        }
        return receipt.getUrl();
    }

    public String getEasyPayProvider() {
        if (easyPay == null) {
            return null;
        }
        return easyPay.getProvider();
    }

    public String getFailureCode() {
        if (failure == null) {
            return null;
        }
        return failure.getCode();
    }

    public String getFailureMessage() {
        if (failure == null) {
            return null;
        }
        return failure.getMessage();
    }


    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Receipt {
        private String url;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EasyPay {
        private String provider;
        private Long amount;
        private Long discountAmount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Failure {
        private String code;
        private String message;

    }


}
