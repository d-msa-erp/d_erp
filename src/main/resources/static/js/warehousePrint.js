// /js/warehousePrint.js
//console.log("[Print] warehousePrint.js 로드 확인");

/**
 * 선택된 창고 항목들의 상세 정보를 가져와 새 창에서 인쇄합니다.
 */
async function printSelectedWarehouseDetails() {
    //console.log("[Print] printSelectedWarehouseDetails() 호출됨 - 선택된 창고 상세 정보 인쇄 시도.");

    // #warehouseTableBody 내의 체크된 개별 창고 체크박스 선택
    const checkedCheckboxes = document.querySelectorAll('#warehouseTableBody input.warehouse-checkbox:checked');
    if (checkedCheckboxes.length === 0) {
        alert("인쇄할 창고를 먼저 선택해주세요.");
        return;
    }

    // 각 체크박스의 data-wh-idx 속성에서 창고 ID를 추출
    const selectedWarehouseIds = Array.from(checkedCheckboxes).map(cb => cb.dataset.whIdx);
    //console.log("[Print] 선택된 창고 ID:", selectedWarehouseIds);

    let printContents = `
        <html>
        <head>
            <title>창고 상세 정보 인쇄</title>
            <style>
                body { font-family: '맑은 고딕', Malgun Gothic, Dotum, sans-serif; margin: 20px; font-size: 10pt; color: #333; }
                .warehouse-container { page-break-inside: avoid; border: 1px solid #ccc; padding: 20px; margin-bottom: 25px; border-radius: 5px; background-color: #fff; }
                .warehouse-container h2 { font-size: 16pt; margin-top: 0; margin-bottom: 15px; color: #1a237e; border-bottom: 2px solid #3949ab; padding-bottom: 8px; }
                .warehouse-info { margin-bottom: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 20px; }
                .warehouse-info p { margin: 6px 0; font-size: 10.5pt; display: flex; align-items: center; }
                .warehouse-info strong { display: inline-block; width: 80px; color: #555; font-weight: bold; flex-shrink: 0; }
                .stock-title { font-size: 13pt; margin-top: 25px; margin-bottom: 10px; color: #283593; border-bottom: 1px dashed #7986cb; padding-bottom: 5px;}
                .stock-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .stock-table th, .stock-table td { border: 1px solid #bbb; padding: 8px 10px; text-align: left; vertical-align: top; }
                .stock-table th { background-color: #e8eaf6; font-weight: bold; text-align: center; font-size: 10pt; }
                .stock-table td { font-size: 9.5pt; }
                /* Align specific columns to right or center */
                .stock-table td:nth-child(5) { text-align: right; } /* 재고 수량 */
                .stock-table td:nth-child(6) { text-align: center; } /* 단위 */

                 .no-stock { font-style: italic; color: #777; margin-top:10px; }
                @media print {
                    body { margin: 0; }
                    .warehouse-container { border: none; box-shadow: none; margin-bottom: 20mm; }
                    h1.print-main-title { display: block !important; font-size: 20pt; text-align: center; margin-bottom: 25px; }
                }
                h1.print-main-title { display: none; }
            </style>
        </head>
        <body>
            <h1 class="print-main-title">선택된 창고 상세 정보</h1>
    `;

    try {
        const warehouseDetailsPromises = selectedWarehouseIds.map(async id => {
            try {
                // 창고 기본 정보 API 호출
                const warehouseResponse = await fetch(`/api/warehouses/${id}`);
                if (!warehouseResponse.ok) {
                    console.error(`[Print] 창고 ID ${id} 기본 정보 조회 실패: ${warehouseResponse.status}`);
                    return { id, error: true, statusText: warehouseResponse.statusText, status: warehouseResponse.status };
                }
                const warehouseData = await warehouseResponse.json();

                // 창고 재고 상세 정보 API 호출 (warehouse.js의 loadWarehouseStockDetails 함수와 유사하게)
                const stockResponse = await fetch(`/api/warehouses/${id}/inventory-details`);
                if (!stockResponse.ok && stockResponse.status !== 204) { // 204 No Content는 정상으로 간주
                    console.error(`[Print] 창고 ID ${id} 재고 상세 정보 조회 실패: ${stockResponse.status}`);
                    // 재고 정보만 실패한 경우를 위해 warehouseData는 유지하고 stockItems만 빈 배열로
                    warehouseData.stockItems = []; 
                } else if (stockResponse.status === 204) {
                    warehouseData.stockItems = []; // 재고 없음
                }
                else {
                    warehouseData.stockItems = await stockResponse.json();
                }
                
                return warehouseData;

            } catch (err) {
                console.error(`[Print] 창고 ID ${id} fetch 중 네트워크 오류 또는 JSON 파싱 오류:`, err);
                return { id, error: true, statusText: err.message || "네트워크 오류", status: "FetchError" };
            }
        });

        const results = await Promise.all(warehouseDetailsPromises);
        //console.log("[Print] 모든 창고 상세 정보 fetch 결과:", results);

        results.forEach(warehouseData => {
            if (!warehouseData || warehouseData.error) {
                printContents += `
                    <div class="warehouse-container">
                        <h2>창고 ID: ${warehouseData.id || '알 수 없음'}</h2>
                        <p style="color:red;">이 창고의 상세 정보를 불러오는 데 실패했습니다. (오류: ${warehouseData.statusText || '데이터 없음'})</p>
                    </div>`;
                return;
            }

            // 창고 타입 표기 결정 (예: "자재 창고, 제품 창고")
            let whType = [];
            if (warehouseData.whType1 === 'Y') whType.push('자재 창고');
            if (warehouseData.whType2 === 'Y') whType.push('제품 창고');
            if (warehouseData.whType3 === 'Y') whType.push('반품 창고');
            const whTypeDisplay = whType.length > 0 ? whType.join(', ') : 'N/A';

            printContents += `<div class="warehouse-container">`;
            printContents += `<h2>${warehouseData.whNm || 'N/A'} (코드: ${warehouseData.whCd || 'N/A'})</h2>`;
            printContents += `<div class="warehouse-info">`;
            printContents += `<p><strong>창고 타입:</strong> ${whTypeDisplay}</p>`;
            printContents += `<p><strong>사용 여부:</strong> ${warehouseData.useFlag === 'Y' ? '사용' : '미사용'}</p>`;
            printContents += `<p><strong>주소:</strong> ${warehouseData.whLocation || ''}</p>`;
            printContents += `<p><strong>담당자:</strong> ${warehouseData.whUserNm || ''}</p>`;
            printContents += `<p style="grid-column: 1/-1;"><strong>비고:</strong> ${warehouseData.remark || ''}</p>`;
            printContents += `</div>`;

            // 재고 품목이 있는 경우 테이블 생성
            if (warehouseData.stockItems && warehouseData.stockItems.length > 0) { 
                printContents += `<div class="stock-title">창고 재고 현황</div>`;
                printContents += `<table class="stock-table">`;
                printContents += `<thead><tr><th>No</th><th>품명</th><th>품번</th><th>규격</th><th>재고 수량</th><th>단위</th><th>거래처명</th><th>비고</th></tr></thead>`;
                printContents += `<tbody>`;
                warehouseData.stockItems.forEach((stock, index) => {
                    printContents += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${stock.itemNm || 'N/A'}</td>
                            <td>${stock.itemCd || 'N/A'}</td>
                            <td>${stock.itemSpec || 'N/A'}</td>
                            <td>${stock.stockQty !== null ? stock.stockQty.toLocaleString() : '0'}</td>
                            <td>${stock.itemUnitNm || 'N/A'}</td>
                            <td>${stock.itemCustNm || 'N/A'}</td>
                            <td>${stock.itemRemark || 'N/A'}</td>
                        </tr>
                    `;
                });
                printContents += `</tbody></table>`;
            } else {
                printContents += `<p class="no-stock">등록된 재고 품목이 없습니다.</p>`;
            }
            printContents += `</div>`;
        });

    } catch (error) {
        console.error("[Print] 창고 상세 정보 처리 중 전체 오류:", error);
        printContents += `<div class="warehouse-container"><p style="color:red;">선택된 창고 정보를 처리하는 중 예기치 않은 오류가 발생했습니다: ${error.message}</p></div>`;
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