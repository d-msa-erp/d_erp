// /js/outboundPrint.js
//console.log("[Print] outboundPrint.js 로드 확인");

/**
 * 선택된 출고 항목들의 상세 정보를 가져와 새 창에서 인쇄합니다.
 */
async function printSelectedOutboundDetails() {
    //console.log("[Print] printSelectedOutboundDetails() 호출됨 - 선택된 출고 상세 정보 인쇄 시도.");

    const checkedCheckboxes = document.querySelectorAll('#outboundTable tbody input.trans-checkbox:checked');
    if (checkedCheckboxes.length === 0) {
        alert("인쇄할 출고 항목을 먼저 선택해주세요.");
        return;
    }

    const selectedInvTransIds = Array.from(checkedCheckboxes).map(cb => cb.dataset.invTransIdx);
    //console.log("[Print] 선택된 출고 거래 ID:", selectedInvTransIds);

    let printContents = `
        <html>
        <head>
            <title>출고 상세 정보 인쇄</title>
            <style>
                body { font-family: '맑은 고딕', Malgun Gothic, Dotum, sans-serif; margin: 20px; font-size: 10pt; color: #333; }
                .transaction-container { page-break-inside: avoid; border: 1px solid #ccc; padding: 20px; margin-bottom: 25px; border-radius: 5px; background-color: #fff; }
                .transaction-container h2 { font-size: 16pt; margin-top: 0; margin-bottom: 15px; color: #1a237e; border-bottom: 2px solid #3949ab; padding-bottom: 8px; }
                .detail-info { margin-bottom: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 20px; }
                .detail-info p { margin: 6px 0; font-size: 10.5pt; display: flex; align-items: center; }
                .detail-info strong { display: inline-block; width: 100px; color: #555; font-weight: bold; flex-shrink: 0; }
                
                @media print {
                    body { margin: 0; }
                    .transaction-container { border: none; box-shadow: none; margin-bottom: 20mm; }
                    h1.print-main-title { display: block !important; font-size: 20pt; text-align: center; margin-bottom: 25px; }
                }
                h1.print-main-title { display: none; }
            </style>
        </head>
        <body>
            <h1 class="print-main-title">선택된 출고 상세 정보</h1>
    `;

    try {
        const transactionDetailsPromises = selectedInvTransIds.map(id =>
            fetch(`/api/inv-transactions/${id}`) // 개별 거래 상세 정보를 가져올 API 엔드포인트
                .then(res => {
                    if (!res.ok) {
                        console.error(`[Print] 출고 거래 ID ${id} 상세 정보 조회 실패: ${res.status}`);
                        return { id, error: true, statusText: res.statusText, status: res.status };
                    }
                    return res.json();
                })
                .catch(err => {
                    console.error(`[Print] 출고 거래 ID ${id} fetch 중 네트워크 오류 또는 JSON 파싱 오류:`, err);
                    return { id, error: true, statusText: err.message || "네트워크 오류", status: "FetchError" };
                })
        );

        const results = await Promise.all(transactionDetailsPromises);
        //console.log("[Print] 모든 출고 상세 정보 fetch 결과:", results);

        results.forEach(transactionData => {
            if (!transactionData || transactionData.error) {
                printContents += `
                    <div class="transaction-container">
                        <h2>출고 거래 ID: ${transactionData.id || '알 수 없음'}</h2>
                        <p style="color:red;">이 출고 거래의 상세 정보를 불러오는 데 실패했습니다. (오류: ${transactionData.statusText || '데이터 없음'})</p>
                    </div>`;
                return;
            }

            const totalAmount = (transactionData.transQty && transactionData.unitPrice) ? 
                                (parseFloat(transactionData.transQty) * parseFloat(transactionData.unitPrice)) : 0;

            printContents += `<div class="transaction-container">`;
            printContents += `<h2>출고 코드: ${transactionData.invTransCode || 'N/A'}</h2>`;
            printContents += `<div class="detail-info">`;
            printContents += `<p><strong>출고일:</strong> ${formatDate(transactionData.transDate) || 'N/A'}</p>`;
            printContents += `<p><strong>품목명(품번):</strong> ${transactionData.itemNm || 'N/A'} ${transactionData.itemCd ? '(' + transactionData.itemCd + ')' : ''}</p>`;
            printContents += `<p><strong>거래처:</strong> ${transactionData.custNm || 'N/A'}</p>`;
            printContents += `<p><strong>출고수량:</strong> ${transactionData.transQty !== null ? Number(transactionData.transQty).toLocaleString() : '0'}</p>`;
            printContents += `<p><strong>단가:</strong> ${transactionData.unitPrice !== null ? Number(transactionData.unitPrice).toLocaleString() : '0'}</p>`;
            printContents += `<p><strong>총액:</strong> ${totalAmount.toLocaleString()}</p>`;
            printContents += `<p><strong>출고창고:</strong> ${transactionData.whNm || 'N/A'}</p>`;
            printContents += `<p><strong>출고관리자:</strong> ${transactionData.userNm || '미지정'}</p>`;
            printContents += `<p><strong>상태:</strong> ${getTransStatusText(transactionData.transStatus) || 'N/A'}</p>`;
            printContents += `<p style="grid-column: 1/-1;"><strong>비고:</strong> ${transactionData.remark || transactionData.invTransRemark || ''}</p>`;
            printContents += `</div>`;
            printContents += `</div>`;
        });

    } catch (error) {
        console.error("[Print] 출고 상세 정보 처리 중 전체 오류:", error);
        printContents += `<div class="transaction-container"><p style="color:red;">선택된 출고 정보를 처리하는 중 예기치 않은 오류가 발생했습니다: ${error.message}</p></div>`;
    }

    printContents += `</body></html>`;

    const printWindow = window.open('', '_blank', 'height=700,width=900,scrollbars=yes');
    if (printWindow) {
        printWindow.document.write(printContents);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            try {
                printWindow.print();
            } catch (e) {
                console.error("[Print] 인쇄 중 오류:", e);
                printWindow.alert("인쇄 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
            }
        }, 700);
    } else {
        alert("팝업 차단 기능이 활성화되어 있으면 인쇄 창을 열 수 없습니다. 브라우저의 팝업 차단 설정을 확인해주세요.");
    }
}

// === 날짜 및 상태 형식화 헬퍼 함수 (outbound.js에서 가져옴) ===
function formatDate(dateString) { //
    if (!dateString) return ''; //
    try { //
        const date = new Date(dateString); //
        if (isNaN(date.getTime())) return ''; //
        const year = date.getFullYear(); //
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); //
        const day = date.getDate().toString().padStart(2, '0'); //
        return `${year}.${month}.${day}`; //
    } catch (e) { //
        return ''; //
    } //
} //

function getTransStatusText(statusCode) { //
    const statusMap = { //
        'S1': '출고전', 'S2': '출고완료', //
        'R1': '입고전', 'R2': '가입고', 'R3': '입고완료' //
    }; //
    return statusMap[statusCode] || statusCode || ''; //
} //