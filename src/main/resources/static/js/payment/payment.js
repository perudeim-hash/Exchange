document.addEventListener("DOMContentLoaded", () => {
    const paymentCard = document.querySelector(".payment-card");
    const paymentButton = document.getElementById("tossPaymentButton");
    const statusMessage = document.getElementById("paymentStatusMessage");

    if (!paymentCard || !paymentButton) {
        return;
    }

    paymentButton.addEventListener("click", async () => {
        try {
            clearStatus();
            disablePaymentButton();

            const paymentData = readPaymentData(paymentCard);
            validatePaymentData(paymentData);

            const tossPayments = TossPayments(paymentData.clientKey);
            const payment = tossPayments.payment({
                customerKey: "ANONYMOUS"
            });

            await payment.requestPayment({
                method: "CARD",
                amount: {
                    currency: "KRW",
                    value: paymentData.amount
                },
                orderId: paymentData.orderId,
                orderName: paymentData.orderName,
                successUrl: paymentData.successUrl,
                failUrl: paymentData.failUrl,
                customerEmail: paymentData.customerEmail,
                customerName: paymentData.customerName
            });
        } catch (error) {
            console.error(error);
            enablePaymentButton();
            showStatus("결제창을 여는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        }
    });

    function readPaymentData(paymentCard) {
        return {
            clientKey: paymentCard.dataset.clientKey,
            orderId: paymentCard.dataset.orderId,
            orderName: paymentCard.dataset.orderName,
            amount: Number(paymentCard.dataset.amount),
            customerName: paymentCard.dataset.customerName,
            customerEmail: paymentCard.dataset.customerEmail,
            successUrl: paymentCard.dataset.successUrl,
            failUrl: paymentCard.dataset.failUrl
        };
    }

    function validatePaymentData(paymentData) {
        if (!paymentData.clientKey) {
            throw new Error("Toss clientKey가 없습니다.");
        }

        if (!paymentData.orderId) {
            throw new Error("orderId가 없습니다.");
        }

        if (!paymentData.orderName) {
            throw new Error("orderName이 없습니다.");
        }

        if (!paymentData.amount || paymentData.amount <= 0) {
            throw new Error("결제 금액이 올바르지 않습니다.");
        }

        if (!paymentData.successUrl) {
            throw new Error("successUrl이 없습니다.");
        }

        if (!paymentData.failUrl) {
            throw new Error("failUrl이 없습니다.");
        }
    }

    function disablePaymentButton() {
        paymentButton.disabled = true;
        paymentButton.textContent = "결제창을 여는 중...";
    }

    function enablePaymentButton() {
        paymentButton.disabled = false;
        paymentButton.textContent = "Toss 테스트 결제하기";
    }

    function showStatus(message) {
        if (!statusMessage) {
            return;
        }

        statusMessage.textContent = message;
        statusMessage.classList.remove("hidden");
    }

    function clearStatus() {
        if (!statusMessage) {
            return;
        }

        statusMessage.textContent = "";
        statusMessage.classList.add("hidden");
    }
});