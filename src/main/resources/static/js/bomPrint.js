// /js/bomPrint.js
//console.log("[Print] bomPrint.js 로드 확인");

/**
 * 선택된 BOM 항목들의 상세 정보를 가져와 새 창에서 인쇄합니다.
 */
async function printSelectedBOMDetails() {
    //console.log("[Print] printSelectedBOMDetails() 호출됨 - 선택된 BOM 상세 정보 인쇄 시도.");

    const checkedCheckboxes = document.querySelectorAll('#bomTbody input[type="checkbox"]:checked');
    if (checkedCheckboxes.length === 0) {
        alert("인쇄할 항목을 먼저 선택해주세요.");
        return;
    }

    const selectedItemIds = Array.from(checkedCheckboxes).map(cb => cb.closest('tr').dataset.id);
    //console.log("[Print] 선택된 BOM ID:", selectedItemIds);

    let printContents = `
        <html>
        <head>
            <title>BOM 상세 정보 인쇄</title>
            <style>
                body { font-family: '맑은 고딕', Malgun Gothic, Dotum, sans-serif; margin: 20px; font-size: 10pt; color: #333; }
                .bom-container { page-break-inside: avoid; border: 1px solid #ccc; padding: 20px; margin-bottom: 25px; border-radius: 5px; background-color: #fff; }
                .bom-container h2 { font-size: 16pt; margin-top: 0; margin-bottom: 15px; color: #1a237e; border-bottom: 2px solid #3949ab; padding-bottom: 8px; }
                .parent-info { margin-bottom: 20px; }
                .parent-info p { margin: 6px 0; font-size: 10.5pt; }
                .parent-info strong { display: inline-block; width: 100px; color: #555; font-weight: bold; }
                .components-title { font-size: 13pt; margin-top: 25px; margin-bottom: 10px; color: #283593; border-bottom: 1px dashed #7986cb; padding-bottom: 5px;}
                .components-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .components-table th, .components-table td { border: 1px solid #bbb; padding: 8px 10px; text-align: left; vertical-align: top; }
                .components-table th { background-color: #e8eaf6; font-weight: bold; text-align: center; font-size: 10pt; }
                .components-table td { font-size: 9.5pt; }
                /* Align specific columns to right or center */
                .components-table td:nth-child(1) { text-align: center; } /* No */
                .components-table td:nth-child(3) { text-align: right; } /* 소요량 */
                .components-table td:nth-child(4) { text-align: center; } /* 단위 - 새로 추가됨 */
                .components-table td:nth-child(5) { text-align: right; } /* 로스율 */
                .components-table td:nth-child(6) { text-align: right; } /* 단가 */

                 .no-components { font-style: italic; color: #777; margin-top:10px; }
                @media print {
                    body { margin: 0; }
                    .bom-container { border: none; box-shadow: none; margin-bottom: 20mm; }
                     h1.print-main-title { display: block !important; font-size: 20pt; text-align: center; margin-bottom: 25px; }
                }
                h1.print-main-title { display: none; }
            </style>
        </head>
        <body>
            <h1 class="print-main-title">선택된 BOM 상세 정보</h1>
    `;

    try {
        const bomDetailsPromises = selectedItemIds.map(id =>
            fetch(`/api/bom/${id}`)
                .then(res => {
                    if (!res.ok) {
                        console.error(`[Print] BOM ID ${id} 상세 정보 조회 실패: ${res.status}`);
                        return { id, error: true, statusText: res.statusText, status: res.status };
                    }
                    return res.json();
                })
                .catch(err => {
                    console.error(`[Print] BOM ID ${id} fetch 중 네트워크 오류 또는 JSON 파싱 오류:`, err);
                    return { id, error: true, statusText: err.message || "네트워크 오류", status: "FetchError" };
                })
        );

        const results = await Promise.all(bomDetailsPromises);
        //console.log("[Print] 모든 BOM 상세 정보 fetch 결과:", results);

        results.forEach(bomData => {
            if (!bomData || bomData.error) {
                printContents += `
                    <div class="bom-container">
                        <h2>BOM ID: ${bomData.id || '알 수 없음'}</h2>
                        <p style="color:red;">이 BOM의 상세 정보를 불러오는 데 실패했습니다. (오류: ${bomData.statusText || '데이터 없음'})</p>
                    </div>`;
                return;
            }

            printContents += `<div class="bom-container">`;
            printContents += `<h2>${bomData.itemNm || 'N/A'} (품목코드: ${bomData.itemCd || 'N/A'})</h2>`;
            printContents += `<div class="parent-info">`;
            printContents += `<p><strong>생산성:</strong> ${bomData.cycleTime != null ? bomData.cycleTime : 'N/A'}</p>`;
            printContents += `<p><strong>비고 (상위):</strong> ${bomData.remark || ''}</p>`;
            printContents += `</div>`;

            if (bomData.components && bomData.components.length > 0) {
                printContents += `<div class="components-title">하위 품목 구성</div>`;
                printContents += `<table class="components-table">`;
                // 테이블 헤더에 "단위" 추가
                printContents += `<thead><tr><th>No</th><th>품목명 (자재코드)</th><th>소요량</th><th>단위</th><th>로스율(%)</th><th>단가(원)</th><th>비고</th></tr></thead>`;
                printContents += `<tbody>`;
                bomData.components.forEach((component, index) => {
                    //console.log(`[Print] Processing component (ID: ${bomData.itemCd}, SubItem: ${component.subItemNm}):`, component);
                    printContents += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${component.subItemNm || 'N/A'} (${component.subItemCd || 'N/A'})</td>
                            <td>${component.useQty != null ? component.useQty : 'N/A'}</td>
                            <td>${component.unitNm || 'N/A'}</td>
                            <td>${component.lossRt != null ? component.lossRt : 'N/A'}</td>
                            <td>${component.itemPrice != null ? Math.round(component.itemPrice).toLocaleString() : 'N/A'}</td>
                            <td>${component.remark || ''}</td>
                        </tr>
                    `;
                });
                printContents += `</tbody></table>`;
            } else {
                printContents += `<p class="no-components">등록된 하위 품목이 없습니다.</p>`;
            }
            printContents += `</div>`;
        });

    } catch (error) {
        console.error("[Print] BOM 상세 정보 처리 중 전체 오류:", error);
        printContents += `<div class="bom-container"><p style="color:red;">선택된 BOM 정보를 처리하는 중 예기치 않은 오류가 발생했습니다: ${error.message}</p></div>`;
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