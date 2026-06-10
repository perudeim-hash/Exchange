package com.money.payment.service;

import com.money.payment.config.TossPaymentProperties;
import com.money.payment.dto.toss.TossPaymentConfirmRequestDto;
import com.money.payment.dto.toss.TossPaymentConfirmResponseDto;
import com.money.payment.dto.toss.TossPaymentErrorResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.ObjectMapper;


@Component
@RequiredArgsConstructor
public class TossPaymentGateway {

    private final TossPaymentProperties tossPaymentProperties;
    private final ObjectMapper objectMapper;
    String TOSS_CONFIRM_URL = tossPaymentProperties.getBaseUrl() +"/confirm";

    public TossPaymentConfirmResponseDto confirmPayment(String paymentKey, String orderId, Long amount) {
        validateConfirmRequest(paymentKey, orderId, amount);
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = createHeaders();
        TossPaymentConfirmRequestDto requestBody = TossPaymentConfirmRequestDto.of(paymentKey, orderId, amount);

        HttpEntity<TossPaymentConfirmRequestDto> requestEntity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<TossPaymentConfirmResponseDto> response = restTemplate.exchange(
                    TOSS_CONFIRM_URL, HttpMethod.POST, requestEntity, TossPaymentConfirmResponseDto.class
            );
            TossPaymentConfirmResponseDto responseBody = response.getBody();
            if (responseBody == null) {
                throw new IllegalArgumentException("토스 결제 승인 응답이 비어 있습니다.");
            }
            return responseBody;
        } catch (HttpStatusCodeException e) {
            TossPaymentErrorResponseDto errorResponse = parseErrorResponse(e.getResponseBodyAsString());

            String errorCode = errorResponse.getCode() == null ? "TOSS_CONFIRM_FAILED" : errorResponse.getCode();
            String errorMessage = errorResponse.getMessage() == null ? "TOSS_CONFIRM_FAILED" : errorResponse.getMessage();

            throw new IllegalArgumentException(errorCode + " - " + errorMessage);
        }
    }


    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBasicAuth(getSecretKey(),"");
        return headers;
    }

    private String getSecretKey() {
        String secretKey = tossPaymentProperties.getSecretKey();
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalArgumentException("토스 키가 설정되지 않았습니다 다시 확인해주세요.");
        }
        return secretKey;
    }

    private TossPaymentErrorResponseDto parseErrorResponse(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return new TossPaymentErrorResponseDto();
        }
        try {
            return objectMapper.readValue(responseBody, TossPaymentErrorResponseDto.class);
        } catch (Exception e) {
            TossPaymentErrorResponseDto fallback = new TossPaymentErrorResponseDto();
            fallback.setCode("TOSS_ERROR_PARSE_FAILED");
            fallback.setMessage("토스 오류 응답을 해석하지 못했습니다.");
            return fallback;
        }

    }

    private void validateConfirmRequest(String paymentKey, String orderId, Long amount) {
        if (paymentKey == null || paymentKey.isBlank()) {
            throw new IllegalArgumentException("결제 키는 필수입니다.");
        }
        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("주문 ID는 필수입니다.");
        }
        if (amount  == null || amount <=0) {
            throw new IllegalArgumentException("결제 승인 금액은 0원보다 커야 합니다.");
        }
    }
}
