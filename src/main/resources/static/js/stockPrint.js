// stockprint.js

async function printStockData() {
    //console.log("재고 현황 (선택 항목 상세) 인쇄 버튼 클릭됨 (stockprint.js)");

    const stockTableBodyElement = document.getElementById('itembody'); // 재고 목록 테이블의 tbody ID
    if (!stockTableBodyElement) {
        console.error("ID가 'itembody'인 재고 목록 테이블 본문(tbody) 요소를 찾을 수 없습니다.");
        alert("인쇄할 재고 목록 테이블을 찾을 수 없습니다.");
        return;
    }

    // 1. 체크박스로 선택된 항목들 가져오기
    const selectedRows = Array.from(stockTableBodyElement.querySelectorAll('tr'))
        .filter(row => {
            const checkbox = row.querySelector('input.item-checkbox');
            return checkbox && checkbox.checked;
        });

    if (selectedRows.length === 0) {
        alert("인쇄할 재고 항목을 하나 이상 선택해주세요.");
        return;
    }

    // 품목 마스터 정보 로드 (단가, 적정재고 등을 위해)
    // allItemBasicInfos 변수가 메인 스크립트에서 로드되고 전역적으로 접근 가능하다고 가정합니다.
    // 만약 그렇지 않다면, 여기서 loadAllItemMasterData()를 호출하거나 다른 방식으로 데이터를 가져와야 합니다.
    if (typeof allItemBasicInfos === 'undefined' || allItemBasicInfos.length === 0) {
        // 메인 스크립트의 loadAllItemMasterData 함수를 호출하거나,
        // 직접 API를 호출하여 품목 마스터 정보를 가져옵니다.
        // 여기서는 메인 스크립트의 함수를 호출한다고 가정합니다. (호출 가능해야 함)
        if (typeof loadAllItemMasterData === 'function') {
            //console.log("품목 마스터 정보 로드 시도...");
            await loadAllItemMasterData();
        }
        if (typeof allItemBasicInfos === 'undefined' || allItemBasicInfos.length === 0) {
            alert("품목 마스터 정보를 불러올 수 없어 일부 정보(단가, 적정재고)가 누락될 수 있습니다.");
            // allItemBasicInfos가 여전히 비어있다면, 빈 배열로 초기화하여 오류 방지
            if (typeof allItemBasicInfos === 'undefined') window.allItemBasicInfos = [];
        }
    }


    const searchItemTextElement = document.getElementById('searchItemText');
    const currentSearchKeyword = searchItemTextElement ? searchItemTextElement.value.trim() : '전체';
    const printTitle = "재고 상세 정보";

    // --- HTML 생성 ---
    let html = `
    <html>
    <head>
      <title>${printTitle}</title>
      <style>
        body { font-family: '맑은 고딕', Malgun Gothic, Dotum, sans-serif; margin: 20px; font-size: 10pt; color: #333; }
        .print-main-title { display: none; } /* 기본적으로 숨김 */
        .item-container { 
            page-break-inside: avoid; 
            border: 1px solid #ccc; 
            padding: 15px; 
            margin-bottom: 20px; 
            border-radius: 5px; 
            background-color: #fff; 
        }
        .item-container h2 { 
            font-size: 14pt; 
            margin-top: 0; 
            margin-bottom: 12px; 
            color: #1a237e; 
            border-bottom: 2px solid #3949ab; 
            padding-bottom: 6px; 
        }
        .item-detail-info { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); /* 반응형 그리드 */
            gap: 8px 15px; /* 행간격, 열간격 */
            font-size: 10pt;
        }
        .item-detail-info p { 
            margin: 5px 0; 
            display: flex;
            align-items: flex-start; /* 여러 줄일 경우 상단 정렬 */
        }
        .item-detail-info strong { 
            display: inline-block; 
            width: 90px; /* 라벨 너비 */
            color: #444; 
            font-weight: bold; 
            flex-shrink: 0; 
            margin-right: 8px;
        }
        .print-page-header { display: none; text-align: center; margin-bottom: 20px;}

        @media print {
          body { margin: 15mm; }
          .item-container { 
            border: none; 
            box-shadow: none; 
            margin-bottom: 10mm; /* 각 항목 간 여백 */
            padding: 10px 0;
            page-break-after: always; /* 각 항목 후 페이지 넘김 (필요에 따라 auto로 변경) */
          }
          .item-container:last-child {
             page-break-after: auto; /* 마지막 항목 뒤에는 페이지 넘김 없음 */
          }
          h1.print-main-title { 
            display: block !important; 
            font-size: 20pt; 
            text-align: center; 
            margin-bottom: 25px; 
          }
          .print-page-header { display: block; }
        }
      </style>
    </head>
    <body>
      <h1 class="print-main-title">${printTitle} (선택 항목)</h1>
      <div class="print-page-header">
        <p>인쇄일: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} / 검색어: ${currentSearchKeyword}</p>
      </div>
    `;

    selectedRows.forEach((row, index) => {
        const itemDataString = row.dataset.item;
        if (!itemDataString) {
            //console.warn("선택된 행에 'data-item' 속성이 없거나 비어있습니다.", row);
            return; // 이 행 건너뛰기
        }
        try {
            const item = JSON.parse(itemDataString); // row.dataset.item 에서 StockDto 객체 파싱
            const masterInfo = typeof allItemBasicInfos !== 'undefined' ? allItemBasicInfos.find(info => info.itemIdx === item.itemIdx) : {};

            html += `<div class="item-container">
              <h2>${item.itemNm || 'N/A'} (${item.itemCd || 'N/A'})</h2>
              <div class="item-detail-info">
                <p><strong>품목 코드:</strong> ${item.itemCd || 'N/A'}</p>
                <p><strong>품 목 명:</strong> ${item.itemNm || 'N/A'}</p>
                <p><strong>현재 수량:</strong> ${item.qty !== null && item.qty !== undefined ? item.qty : '0'}</p>
                <p><strong>단 위:</strong> ${item.unitNm || (masterInfo && masterInfo.unitNm) || 'N/A'}</p>
                <p><strong>창 고 명:</strong> ${item.whNm || 'N/A'}</p>
                <p><strong>단 가:</strong> ${masterInfo && masterInfo.itemCost !== undefined ? formatCurrencyKR(masterInfo.itemCost) : 'N/A'}</p>
                <p><strong>적정 재고:</strong> ${masterInfo && masterInfo.optimalInv !== undefined ? masterInfo.optimalInv : (item.inv !== null && item.inv !== undefined ? item.inv : 'N/A')}</p>
                <p><strong>비 고:</strong> ${item.remark || ''}</p>
                </div>
            </div>`;
        } catch (e) {
            console.error("선택된 행의 'data-item' JSON 파싱 중 오류:", itemDataString, e);
        }
    });


    html += '</body></html>';

    // --- 인쇄 실행 ---
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

// formatCurrencyKR 함수 (메인 스크립트에도 동일한 함수가 있다면, 중복 정의 피하거나 한 곳에서 관리)
// 이 함수가 stockprint.js 내에 없다면 여기에 추가하거나, 메인 스크립트에서 전역으로 접근 가능해야 합니다.
if (typeof formatCurrencyKR === 'undefined') {
    function formatCurrencyKR(value) {
        if (value === null || value === undefined || isNaN(parseFloat(value))) return "";
        return parseFloat(value).toLocaleString('ko-KR') + "원";
    }
}