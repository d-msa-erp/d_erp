function printMrpData() {
    console.log("MRP 데이터 인쇄 버튼 클릭됨 (투입 예상량 계산 포함)");

    if (!selectedMrpOrderDataForCalc) {
        alert("인쇄할 MRP 대상 품목(주문)을 첫 번째 테이블에서 선택해주세요.");
        return;
    }

    const materialTableElement = document.getElementById('materialbody');
    if (!materialTableElement || materialTableElement.rows.length === 0 ||
        (materialTableElement.rows.length === 1 && materialTableElement.rows[0].cells.length > 0 && materialTableElement.rows[0].cells[0].classList.contains('nodata'))) {
        alert("선택된 품목의 자재 목록이 하단 두 번째 테이블에 표시되어야 합니다.\n자재 목록이 없으면 인쇄할 수 없습니다.");
        return;
    }

    const orderInfo = selectedMrpOrderDataForCalc;
    const printTitle = "MRP 상세 정보";

    const printOrderData = {
        orderCode: orderInfo.orderCode || 'N/A',
        userName: 'N/A',
        customerName: orderInfo.customerNm || 'N/A',
        orderDate: orderInfo.orderDate ? new Date(orderInfo.orderDate).toLocaleDateString() : 'N/A',
        deliveryDate: orderInfo.orderDeliveryDate ? new Date(orderInfo.orderDeliveryDate).toLocaleDateString() : 'N/A',
        totalPrice: 'N/A',
        orderStatus: orderInfo.orderStatusOverall || orderInfo.orderType || 'N/A',
        productItemCd: orderInfo.productItemCd || 'N/A',
        productItemNm: orderInfo.productItemNm || 'N/A',
        productUnitNm: orderInfo.productUnitNm || 'N/A',
        orderQty: orderInfo.orderQty ?? 'N/A',
        productCurrentStock: orderInfo.productCurrentStock !== undefined ? orderInfo.productCurrentStock : 'N/A',
        prodCd: orderInfo.prodCd || 'N/A'
    };

    const parentOrderQty = parseFloat(orderInfo.orderQty || 0);
    const parentStock = parseFloat(orderInfo.productCurrentStock || 0);
    let deficitQty = 0;
    if (!isNaN(parentOrderQty) && !isNaN(parentStock)) {
        deficitQty = parentOrderQty - parentStock;
    } else {
        console.warn("완제품 주문수량 또는 현재고가 유효한 숫자가 아닙니다. 투입예상량 계산에 영향을 줄 수 있습니다.");
    }

    // --- 자재 목록 헤더 정보 가져오기 ---
    const materialHeaders = []; // 이 변수에 헤더 텍스트를 저장합니다.
    const materialHeaderRow = materialTableElement.previousElementSibling.rows[0];
    if (materialHeaderRow) {
        for (let i = 0; i < materialHeaderRow.cells.length; i++) {
            materialHeaders.push(materialHeaderRow.cells[i].textContent);
        }
    }

    // --- expectedInputQtyColumnIndex 정의 (materialHeaders 사용) ---
    const expectedInputQtyColumnIndex = materialHeaders.indexOf("투입예상량"); // 오류 발생 지점 수정

    const materialItemsForPrint = [];
    const materialDataRows = materialTableElement.querySelectorAll('tr');
    materialDataRows.forEach(row => {
        if (row.querySelector('.nodata')) return;
        const cells = row.cells;
        const rowDataArray = [];

        for (let i = 0; i < cells.length; i++) {
            rowDataArray.push(cells[i].textContent);
        }

        if (expectedInputQtyColumnIndex !== -1 && expectedInputQtyColumnIndex < cells.length) {
            // '소요량' 컬럼의 인덱스를 헤더를 기준으로 찾거나, dataset.useqty를 우선 사용
            const useQtyHeaderIndex = materialHeaders.indexOf("소요량"); // "소요량" 헤더의 인덱스
            let materialUnitUseQty = 0;
            if (row.dataset.useqty) {
                 materialUnitUseQty = parseFloat(row.dataset.useqty || 0);
            } else if (useQtyHeaderIndex !== -1 && useQtyHeaderIndex < cells.length) {
                 materialUnitUseQty = parseFloat(cells[useQtyHeaderIndex].textContent || 0);
            }


            let calculatedInputQtyStr = "오류";

            if (deficitQty <= 0) {
                calculatedInputQtyStr = "출고 가능";
            } else {
                if (!isNaN(materialUnitUseQty)) {
                    const calculatedInputQty = deficitQty * materialUnitUseQty;
                    calculatedInputQtyStr = calculatedInputQty.toFixed(3);
                } else {
                    calculatedInputQtyStr = "소요량오류";
                }
            }
            rowDataArray[expectedInputQtyColumnIndex] = calculatedInputQtyStr;
        }
        materialItemsForPrint.push(rowDataArray);
    });

    // --- HTML 생성 (이하 로직은 이전과 거의 동일, materialHeaders 변수명 일관성 유지) ---
    let html = `
    <html>
    <head>
      <title>${printTitle}</title>
      <style>
        body { font-family: '맑은 고딕', Malgun Gothic, Dotum, sans-serif; margin: 20px; font-size: 10pt; color: #333; }
        .print-container { page-break-inside: avoid; border: 1px solid #ccc; padding: 20px; margin-bottom: 25px; border-radius: 5px; background-color: #fff; }
        .print-container h2 { font-size: 16pt; margin-top: 0; margin-bottom: 15px; color: #1a237e; border-bottom: 2px solid #3949ab; padding-bottom: 8px; }
        .order-info { margin-bottom: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 20px; }
        .order-info p { margin: 6px 0; font-size: 10.5pt; display: flex; align-items: center; }
        .order-info strong { display: inline-block; width: 120px; color: #555; font-weight: bold; flex-shrink: 0; }
        .material-list-title { font-size: 13pt; margin-top: 25px; margin-bottom: 10px; color: #283593; border-bottom: 1px dashed #7986cb; padding-bottom: 5px;}
        .material-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .material-table th, .material-table td { border: 1px solid #bbb; padding: 8px 10px; text-align: left; vertical-align: top; word-break: break-all; }
        .material-table th { background-color: #e8eaf6; font-weight: bold; text-align: center; font-size: 10pt; }
        .material-table td { font-size: 9.5pt; }
        /* 투입예상량 컬럼도 우측 정렬, CSS는 1-based index */
        .material-table td:nth-child(4), .material-table td:nth-child(5), .material-table td:nth-child(${expectedInputQtyColumnIndex >= 0 ? expectedInputQtyColumnIndex + 1 : 7}) { text-align: right; }
        .no-data-message { font-style: italic; color: #777; margin-top:10px; text-align: center; padding: 20px; }
        @media print {
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-container { border: none; box-shadow: none; margin-bottom: 0; padding:0; border-radius: 0; page-break-after: always;}
          .print-container:last-child { page-break-after: auto; }
          h1.print-main-title { display: block !important; font-size: 20pt; text-align: center; margin: 20px 0 25px 0; }
        }
        h1.print-main-title { display: none; }
      </style>
    </head>
    <body>
      <h1 class="print-main-title">${printTitle}</h1>
    `;

    html += `<div class="print-container">
      <h2>주문번호: ${printOrderData.orderCode}</h2>
      <div class="order-info">
        <p><strong>고객사:</strong> ${printOrderData.customerName}</p>
        <p><strong>주문일자:</strong> ${printOrderData.orderDate}</p>
        <p><strong>납기일자:</strong> ${printOrderData.deliveryDate}</p>
        <p><strong>주문상태:</strong> ${printOrderData.orderStatus}</p>
        <p><strong>완제품 코드:</strong> ${printOrderData.productItemCd}</p>
        <p><strong>완제품 명:</strong> ${printOrderData.productItemNm}</p>
        <p><strong>완제품 단위:</strong> ${printOrderData.productUnitNm}</p>
        <p><strong>주문(생산)수량:</strong> ${printOrderData.orderQty}</p>
        <p><strong>완제품 현재고:</strong> ${printOrderData.productCurrentStock}</p>
        <p><strong>생산 코드(주문):</strong> ${printOrderData.prodCd}</p>
        <p><strong>담당자:</strong> ${printOrderData.userName}</p>
        <p><strong>총액:</strong> ${printOrderData.totalPrice}</p>
      </div>
    `;

    html += `<div class="material-list-title">자재 소요 목록</div>
      <table class="material-table">
        <thead><tr>`;

    materialHeaders.forEach(header => { // materialHeaders 사용
        html += `<th>${header}</th>`;
    });
    html += `</tr></thead><tbody>`;

    if (materialItemsForPrint.length > 0) {
        materialItemsForPrint.forEach(itemCellsArray => {
            html += '<tr>';
            itemCellsArray.forEach(cellContent => {
                html += `<td>${cellContent}</td>`;
            });
            html += '</tr>';
        });
    } else {
        html += `<tr><td colspan="${materialHeaders.length}" class="no-data-message">자재 소요 내역이 없습니다.</td></tr>`; // materialHeaders 사용
    }

    html += `</tbody></table></div>`;
    html += '</body></html>';

    const printWin = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes');
    if (printWin) {
        printWin.document.write(html);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
            try {
                printWin.print();
            } catch (e) {
                console.error("인쇄 실행 중 오류:", e);
                alert("인쇄를 시작할 수 없습니다. 팝업 차단 기능을 확인하거나 브라우저 설정을 점검해 주세요.");
            }
        }, 700);
    } else {
        alert("팝업 창을 열 수 없습니다. 브라우저의 팝업 차단 설정을 확인해주세요.");
    }
}