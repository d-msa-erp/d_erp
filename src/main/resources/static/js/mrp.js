// --- 전역 변수 ---
const mrpPageSize = 10;
let selectedMrpOrderDataForCalc = null; // "계산" 버튼 및 현재 선택된 항목 데이터 저장용

// --- DOM 요소 참조 변수 (DOMContentLoaded에서 할당) ---
let mrpSearchText, mrpSearchBtn, itembody, materialbody;

// --- Helper Functions (스크립트 최상단) ---
function setInputValueById(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        if (element.type === 'date' && value) {
            try {
                let dateStr = value.toString();
                if (dateStr.includes('T')) {
                   dateStr = dateStr.substring(0, 10);
                } else if (dateStr.length > 10 && /^\d{4}-\d{2}-\d{2}/.test(dateStr.substring(0,10))) {
                   dateStr = dateStr.substring(0, 10);
                }
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                   element.value = dateStr;
                } else {
                   const d = new Date(value);
                   element.value = `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
                }
            } catch (e) {
                
                element.value = '';
            }
        } else {
            element.value = (value === null || value === undefined) ? '' : value;
        }
    }
}

async function fetchCurrentStock(itemIdx, targetInputIdOrCell) {
    const message = 'N/A(API없음)';
    if (typeof targetInputIdOrCell === 'string') {
        setInputValueById(targetInputIdOrCell, message);
    } else if (targetInputIdOrCell && targetInputIdOrCell.textContent !== undefined) {
        targetInputIdOrCell.textContent = message;
    }
    return null;
}

function clearMaterialDetailFields() {
    setInputValueById('modalSelectedMaterialCode', '');
    setInputValueById('modalSelectedMaterialName', '');
    setInputValueById('modalSelectedMaterialUnit', '');
    setInputValueById('modalSelectedMaterialStock', '');
    setInputValueById('modalCalculatedMaterialQty', '');
    setInputValueById('modalCalculatedMaterialCost', '');
}

async function displayMaterialDetailsInForm(materialData, productProductionQty) {
    if (!materialData) {
        clearMaterialDetailFields();
        return;
    }
    const bomUnitQty = parseFloat(materialData.useQty || 0);
    const materialUnitCost = parseFloat(materialData.subItemMasterCost || 0);
    const prodQty = parseFloat(productProductionQty || 0);
    const totalRequiredMaterialQty = bomUnitQty * prodQty;
    let calculatedCostByUserFormula = 0;
    if (bomUnitQty !== 0) {
        calculatedCostByUserFormula = (totalRequiredMaterialQty / bomUnitQty) * materialUnitCost;
    } else if (prodQty > 0 && bomUnitQty === 0) {
        calculatedCostByUserFormula = 0;
    } else {
        calculatedCostByUserFormula = totalRequiredMaterialQty * materialUnitCost;
    }
    setInputValueById('modalSelectedMaterialCode', materialData.subItemCd);
    setInputValueById('modalSelectedMaterialName', materialData.subItemNm);
    setInputValueById('modalSelectedMaterialUnit', materialData.unitNm);
    setInputValueById('modalCalculatedMaterialQty', totalRequiredMaterialQty.toFixed(3));
    setInputValueById('modalCalculatedMaterialCost', calculatedCostByUserFormula.toFixed(2));
	setInputValueById('modalSelectedMaterialStock', materialData.subQty !== undefined ? materialData.subQty : 'N/A');
}

async function fetchAndDisplayBomForModal(parentProductItemId, productProductionQty) {
    const bomListBody = document.getElementById('bomMaterialListBody');
    if (!bomListBody) {
        
        clearMaterialDetailFields();
        return;
    }
    bomListBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">BOM 정보 로딩 중...</td></tr>`;
    clearMaterialDetailFields();
    try {
        const response = await fetch(`/api/bom/${parentProductItemId}`);
        if (!response.ok) {
            if (response.status === 404) throw new Error(`BOM 정보를 찾을 수 없습니다 (제품 ID: ${parentProductItemId}).`);
            throw new Error(`BOM API 오류! Status: ${response.status}`);
        }
        const bomDetailDto = await response.json();
        bomListBody.innerHTML = '';
        if (bomDetailDto && bomDetailDto.components && bomDetailDto.components.length > 0) {
            const parentProductName = bomDetailDto.itemNm || document.getElementById('modalProductItemNm')?.value || '완제품';
            bomDetailDto.components.forEach((component, index) => {
                const row = bomListBody.insertRow();
                row.style.cursor = 'pointer';
                row.insertCell().textContent = index + 1;
                row.insertCell().textContent = parentProductName;
                row.insertCell().textContent = component.subItemNm || '';
                row.insertCell().textContent = component.seqNo || '';
                row.insertCell().textContent = component.useQty || 0;
                row.insertCell().textContent = component.lossRt || 0;
                row.insertCell().textContent = component.subItemMasterCost || 0;
                row.insertCell().textContent = component.remark || '';
                row.addEventListener('click', async () => {
                    bomListBody.querySelectorAll('tr.selected-material-row').forEach(tr => tr.classList.remove('selected-material-row'));
                    row.classList.add('selected-material-row');
                    await displayMaterialDetailsInForm(component, productProductionQty);
                });
            });
            if (bomDetailDto.components.length > 0) {
                const firstRowInBom = bomListBody.rows[0];
                if (firstRowInBom) firstRowInBom.classList.add('selected-material-row');
                await displayMaterialDetailsInForm(bomDetailDto.components[0], productProductionQty);
            }
        } else {
            bomListBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">해당 제품의 BOM 구성 자재가 없습니다.</td></tr>`;
        }
    } catch (error) {
        
        bomListBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">BOM 정보 로드 실패: ${error.message}</td></tr>`;
    }
}

function mrpexceldownload() {
	   if (!selectedMrpOrderDataForCalc) {
	       alert("먼저 첫 번째 테이블에서 MRP 대상 품목(주문)을 선택해주세요.");
	       return;
	   }

	   if (!materialbody || materialbody.rows.length === 0 ||
	       (materialbody.rows.length === 1 && materialbody.rows[0].cells.length > 0 && materialbody.rows[0].cells[0].classList.contains('nodata'))) {
	       alert("선택된 품목의 자재 목록이 하단 두 번째 테이블에 표시되어야 합니다.\n자재 목록이 없으면 엑셀로 내보낼 수 없습니다.");
	       return;
	   }

	   try {
	       // --- 1. 첫 번째 테이블 (주문 정보) 데이터 준비 ---
	       const orderInfo = selectedMrpOrderDataForCalc;
	       const orderDataForExcel = [
	           ["■ 주문 정보"], // 섹션 제목 행
	           // 헤더: MrpSecondDto 또는 화면 표시 기준
	           ["주문번호", "고객사", "주문일자", "납기일자", "주문상태", "완제품코드", "완제품명", "완제품단위", "주문수량(생산예정)", "완제품현재고", "생산코드(주문연결)"],
	           // 데이터: selectedMrpOrderDataForCalc 객체에서 가져오기
	           [
	               orderInfo.orderCode || '',
	               orderInfo.customerNm || '',
	               orderInfo.orderDate ? new Date(orderInfo.orderDate).toLocaleDateString() : '', // 날짜 형식 변환
	               orderInfo.orderDeliveryDate ? new Date(orderInfo.orderDeliveryDate).toLocaleDateString() : '', // 날짜 형식 변환
	               orderInfo.orderStatusOverall || '',
	               orderInfo.productItemCd || '',
	               orderInfo.productItemNm || '',
	               orderInfo.productUnitNm || '',
	               orderInfo.orderQty ?? '', // MrpSecondDto의 orderQty (완제품 생산 예정 수량)
	               orderInfo.productCurrentStock !== undefined ? orderInfo.productCurrentStock : '',
	               orderInfo.prodCd || ''
	           ]
	       ];

	       // --- 2. 두 번째 테이블 (자재 목록) 데이터 준비 ---
	       const materialDataForExcel = [];
	       materialDataForExcel.push([""]); // 주문 정보와 자재 목록 사이에 빈 행 추가
	       materialDataForExcel.push(["■ 자재 소요 목록"]); // 섹션 제목 행

	       const materialTableHeaders = [];
	       const headerCells = materialbody.previousElementSibling.rows[0].cells; // thead의 첫 번째 행에서 헤더 가져오기
	       for (let i = 0; i < headerCells.length; i++) {
	           materialTableHeaders.push(headerCells[i].textContent);
	       }
	       materialDataForExcel.push(materialTableHeaders);

	       const materialRows = materialbody.querySelectorAll('tr');
	       materialRows.forEach(row => {
	           if (row.querySelector('.nodata')) return; // '데이터 없음' 행 건너뛰기

	           const rowData = [];
	           const cells = row.cells;
	           for (let i = 0; i < cells.length; i++) {
	               rowData.push(cells[i].textContent);
	           }
	           materialDataForExcel.push(rowData);
	       });

	       // --- 3. 워크시트 생성 (SheetJS 라이브러리 사용) ---
	       // 주문 정보와 자재 목록 데이터를 하나의 시트에 함께 넣기
	       const combinedData = [...orderDataForExcel, ...materialDataForExcel];
	       const ws = XLSX.utils.aoa_to_sheet(combinedData);

	       // (선택적) 컬럼 너비 자동 조절 시도 (완벽하지 않을 수 있음)
	       const colsWidth = [];
	       combinedData.forEach(row => {
	           row.forEach((cell, colIndex) => {
	               const cellLength = cell ? String(cell).length + 2 : 10; // 글자 수 기반 너비 (약간의 여유 추가)
	               if (!colsWidth[colIndex] || colsWidth[colIndex].wch < cellLength) {
	                   colsWidth[colIndex] = { wch: cellLength };
	               }
	           });
	       });
	       // 주문 정보 섹션의 타이틀 셀 병합 처리 (예시)
	       if (ws['A1']) { // "■ 주문 정보" 셀
	       }
	       ws['!cols'] = colsWidth;


	       // --- 4. 워크북 생성 및 다운로드 ---
	       const wb = XLSX.utils.book_new();
	       XLSX.utils.book_append_sheet(wb, ws, "MRP 데이터"); // 시트 이름 설정

	       const fileName = `MRP_DATA_${orderInfo.orderCode || '데이터'}.xlsx`;
	       XLSX.writeFile(wb, fileName);

	       

	   } catch (error) {
	       
	       alert("엑셀 파일을 생성하는 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
	   }
}

// --- 페이지 로드 시 실행되는 메인 로직 및 이벤트 핸들러 ---
document.addEventListener('DOMContentLoaded', () => {
    mrpSearchText = document.getElementById('mrpSearchText');
    mrpSearchBtn = document.getElementById('mrpSearchBtn');
    itembody = document.getElementById('itembody');
    materialbody = document.getElementById('materialbody');



    if (itembody) {
            itembody.innerHTML = `<tr><td class="nodata initial-loading" style="text-align: center; justify-content: center; padding:10px;" colspan="10"> 로딩중...</td></tr>`;
        }
        
    if (materialbody) { // materialbody 요소가 실제로 존재하는지 확인 후
        materialbody.innerHTML ='<tr><td class="nodata" colspan="8">대상 품목을 선택해 주세요.</td></tr>';  
    }
        fetchMrpTargetOrders('');
    
    if (mrpSearchBtn) {
        mrpSearchBtn.addEventListener('click', (event) => {
            event.preventDefault();
            const searchTerm = mrpSearchText.value.trim();
				
            // JAVASCRIPT 수정: 검색 시 선택된 행 스타일 및 데이터 초기화
            if (itembody) {
				const previouslySelectedRow = itembody.querySelector('tr.selected-row');
	                if (previouslySelectedRow) {
	                    previouslySelectedRow.classList.remove('selected-row');
	                }
            }
            selectedMrpOrderDataForCalc = null;
            fetchMrpTargetOrders(searchTerm);

        });
    }
    if (mrpSearchText) {
        mrpSearchText.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                if (mrpSearchBtn) mrpSearchBtn.click();
            }
        });
    }

    const calculateButton = document.getElementById('calculateMrpBtn');
    if (calculateButton) {
        calculateButton.addEventListener('click', handleCalculateButtonClick);
    }
});

async function fetchMrpTargetOrders(searchKeyword) {
    let url = `/api/mrp/orders?page=0&size=${mrpPageSize}`;
    if (searchKeyword) {
        url += `&searchKeyword=${encodeURIComponent(searchKeyword)}`;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        const pageData = await response.json();
        if (!itembody) return;
        itembody.innerHTML = '';

        if (pageData && pageData.content && pageData.content.length > 0) {
            pageData.content.forEach((order) => {
                const row = itembody.insertRow();

                const cellRadio = row.insertCell();
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'selectedMrpOrder';
                radio.value = order.orderIdx || '';
                
                // JAVASCRIPT 수정: 라디오 버튼 'change' 이벤트가 주된 선택 처리 및 하단 테이블 업데이트 담당
                radio.addEventListener('change', async function() { // async 추가
                    if (this.checked) {
                        selectedMrpOrderDataForCalc = order; // 선택된 데이터 업데이트
                        

                        // 선택된 행 스타일 업데이트
                        if (itembody) {
                            itembody.querySelectorAll('tr.selected-row').forEach(tr => tr.classList.remove('selected-row'));
                        }
                        row.classList.add('selected-row');
                        
                        // 하단 두 번째 테이블(materialbody) 업데이트
                        if (order.productPrimaryItemIdx !== undefined && order.orderQty !== undefined) {
                            const productProductionQty = parseFloat(order.orderQty || 0);
                            await populateMaterialTable(order.productPrimaryItemIdx, productProductionQty);
                        } else {
                            if (materialbody) clearMaterialTable("BOM 표시를 위한 제품 정보가 부족합니다.", materialbody, 7);
                        }
                        // 이 이벤트 리스너에서는 모달을 직접 열지 않음
                    }
                });
                cellRadio.appendChild(radio);

                // 데이터 셀 생성
                const dataCells = [
                    order.orderCode || '',
					order.prodCd || '생산 전',

                    order.productItemCd || '',
                    order.productItemNm || '',
                    order.customerNm || '',
                    (order.productCurrentStock ?? '0'),
                    order.productUnitNm || '',
                    order.orderQty ?? '',
                    order.productivity || ''
                ];

                dataCells.forEach(cellData => {
                    const cell = row.insertCell();
                    cell.textContent = cellData;
                    // JAVASCRIPT 수정: 데이터 셀 클릭 시 모달 열고, 해당 행 라디오 선택
                    cell.style.cursor = 'pointer'; // 클릭 가능함을 표시
                    cell.addEventListener('click', () => {
                        if (!radio.checked) {
                            radio.click(); // 라디오를 클릭하여 change 이벤트 및 관련 로직(선택, 하단 테이블) 실행
                        } else {
                            // 이미 라디오가 선택된 상태에서 데이터 셀을 다시 클릭하면
                            // 라디오 change 이벤트는 발생 안하므로, 여기서 직접 선택된 행에 대한 처리를 다시 할 수 있음.
                            // (예: 하단 테이블 재 로드 또는 모달만 다시 열기)
                            // 현재는 라디오 change에서 모든 주요 처리를 하므로, 여기서는 모달만 연다.
                            // 또한, handleOrderRowClick의 다른 기능들(스타일링 등)도 여기서 직접 해줘야 할 수 있음.
                            // 또는, handleRowSelectionChange와 opendetail을 명확히 분리.
                            // 여기서는 모달만 여는 것으로 단순화.
                        }
                        // 위의 radio.click()이 'change' 이벤트를 발생시켜 handleOrderRowClick을 간접 호출함.
                        // 모달은 데이터 셀 클릭 시에는 항상 열리도록 한다.
                        opendetail(order); // 데이터 셀 클릭 시 모달 호출
                    });
                });
            });
        } else {
         itembody.innerHTML = `<tr><td class="nodata" colspan="10">조회된 데이터가 없습니다.</td></tr>`;
        }
    } catch (error) {
        
        if (itembody) itembody.innerHTML = `<tr><td class="nodata" colspan="10" style="text-align: center;">데이터를 불러오는 중 오류가 발생했습니다. (API: ${url.split('?')[0]})</td></tr>`;
    }
}

// 이 함수는 이제 라디오 버튼의 change 이벤트에서 주로 사용되거나, 데이터 셀 클릭 시 간접적으로 사용됨.
// 주 역할: 선택된 행 스타일링, 하단 테이블 업데이트, (선택적으로) 모달 열기.
// 요청에 따라, 모달은 데이터셀 클릭 시에만 열리도록 수정했으므로, 이 함수의 이름을 변경하거나 역할을 명확히 할 필요가 있음.
// 아래에서는 handleOrderRowClick 이름을 유지하되, 모달 여는 부분은 데이터셀 클릭 리스너에서 직접 처리하도록 함.
// 라디오 change 이벤트에서는 스타일링과 하단 테이블 로드만 수행.
async function handleOrderRowClick(orderData, clickedRow) {
    selectedMrpOrderDataForCalc = orderData;
    

    // JAVASCRIPT 수정: 선택된 행 스타일링 (selected-row 클래스)
	if (itembody) {
	    // 이전에 선택된 행이 있다면 selected-row 클래스 제거
	    const previouslySelectedRow = itembody.querySelector('tr.selected-row');
	    if (previouslySelectedRow) {
	        previouslySelectedRow.classList.remove('selected-row');
	    }
	}
	if (clickedRow) { // clickedRow는 현재 선택된 <tr> 요소
	    clickedRow.classList.add('selected-row'); // 현재 선택된 행에 selected-row 클래스 추가
	}
    
    // JAVASCRIPT 수정: 모달 여는 로직은 데이터 셀 클릭 리스너로 이동. 여기서는 하단 테이블만 업데이트.
    // opendetail(orderData); 
    
    if (orderData.productPrimaryItemIdx !== undefined && orderData.orderQty !== undefined) {
        const productProductionQty = parseFloat(orderData.orderQty || 0);
        await populateMaterialTable(orderData.productPrimaryItemIdx, productProductionQty);
    } else {
        if (materialbody) clearMaterialTable("BOM 표시를 위한 제품 정보가 부족합니다.", materialbody, 7);
    }
}


async function populateMaterialTable(parentProductItemId, productProductionQty) {
    // ... (이전과 동일) ...
    if (!materialbody) { return; }
    materialbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">자재 정보 로딩 중...</td></tr>`;
    try {
        const response = await fetch(`/api/bom/${parentProductItemId}`);
        if (!response.ok) {
            if (response.status === 404) throw new Error(`BOM 정보를 찾을 수 없습니다 (ID: ${parentProductItemId}).`);
            throw new Error(`BOM API 오류! Status: ${response.status}`);
        }
        const bomDetailDto = await response.json();
        materialbody.innerHTML = '';
        if (bomDetailDto && bomDetailDto.components && bomDetailDto.components.length > 0) {
            bomDetailDto.components.forEach(async (component, index) => {
                const row = materialbody.insertRow();
                row.insertCell().textContent = index + 1;
                row.insertCell().textContent = component.subItemCd || '';
                row.insertCell().textContent = component.subItemNm || '';
				
				// 개선된 재고량 처리
				const stockCell = row.insertCell();
				let stockValue;
				let stockDisplayText;

				if (component.subQty === undefined || component.subQty === null) {
				    // API에서 재고량 정보를 제공하지 않는 경우
				    stockDisplayText = '0';
				    stockValue = 0;
				} else if (component.subQty === 0) {
				    // 재고량이 0인 경우
				    stockDisplayText = '0';
				    stockValue = 0;
				} else if (typeof component.subQty === 'number' && !isNaN(component.subQty)) {
				    // 정상적인 숫자 재고량
				    stockDisplayText = component.subQty.toString();
				    stockValue = component.subQty;
				} else {
				    // 기타 오류 상황 (문자열이지만 숫자가 아닌 경우 등)
				    stockDisplayText = '0';
				    stockValue = null;
				}

				stockCell.textContent = stockDisplayText;
				row.dataset.stockvalue = stockValue;
				const useQtyCell = row.insertCell();
              	useQtyCell.textContent = component.useQty || 0;                   // 소요량 (단위 소요량)
                row.dataset.useqty = component.useQty || 0;
                row.insertCell().textContent = component.unitNm || '';
                row.insertCell().textContent = '';
                
                const actionCell = row.insertCell();                          // 구매요청
                actionCell.classList.add('purchase-action-cell'); // 식별 및 스타일링을 위한 클래스
                actionCell.innerHTML = ''; // 초기에는 비워둠
            });
        } else {
            clearMaterialTable("해당 제품의 BOM 구성 자재가 없습니다.", materialbody, 7);
        }
    } catch (error) {
        
        clearMaterialTable(`BOM 정보 로드 실패: ${error.message}`, materialbody, 7);
    }
}
async function handleCalculateButtonClick() {
    

    // --- 상단 유효성 검사 로직 (이전과 동일) ---
    if (!selectedMrpOrderDataForCalc) {
        alert("먼저 첫 번째 테이블에서 MRP 대상 품목을 선택해주세요.");
        return;
    }
    if (!materialbody || materialbody.rows.length === 0 ||
        (materialbody.rows.length === 1 && materialbody.rows[0].cells.length > 0 && materialbody.rows[0].cells[0].classList.contains('nodata'))) {
        alert("먼저 선택된 품목의 자재 목록(BOM)이 하단 두 번째 테이블에 표시되어야 합니다.\n자재 목록이 없다면 계산할 수 없습니다.");
        return;
    }

    const parentOrderQty = parseFloat(selectedMrpOrderDataForCalc.orderQty || 0);
    const parentStockRaw = selectedMrpOrderDataForCalc.productCurrentStock || 0;

    if (parentStockRaw === undefined || isNaN(parseFloat(parentStockRaw)) ||
        selectedMrpOrderDataForCalc.orderQty === undefined || isNaN(parentOrderQty) ) {
         alert("선택된 완제품의 생산수량 또는 현재고 정보가 유효하지 않거나 숫자 형식이 아닙니다.\n백엔드 DTO를 확인해주세요.");
         
         return;
    }
    const parentStock = parseFloat(parentStockRaw);
    // --- 여기까지 유효성 검사 로직 ---

    const materialRows = materialbody.querySelectorAll('tr');
    

    materialRows.forEach((row, index) => {
        if ((row.cells.length > 0 && row.cells[0].classList.contains('nodata')) || row.cells.length < 8) {
            
            return;
        }

        const expectedInputQtyCell = row.cells[6]; // 7번째 TD (투입예상량)
        const statusDisplayCell = row.cells[7];    // 8번째 TD (재고 부족 등 상태 표시용)

        // 8번째 셀(상태 표시 셀) 내용 및 스타일 초기화
        if (statusDisplayCell) {
            statusDisplayCell.innerHTML = ''; // 내용 비우기
            statusDisplayCell.style.color = '';     // 스타일 초기화
            statusDisplayCell.style.fontWeight = ''; // 스타일 초기화
        }

        // 7번째 셀(투입예상량 셀) 스타일 초기화
        expectedInputQtyCell.classList.remove('deficit-warning');
        expectedInputQtyCell.style.color = '';
        expectedInputQtyCell.style.fontWeight = '';

        const materialUnitUseQty = parseFloat(row.dataset.useqty || 0);
        const materialName = row.cells[2].textContent; // 자재명 (디버깅용)
        const stockValue = row.dataset.stockvalue;
        const materialCurrentStock = stockValue !== null ? parseFloat(stockValue) : null;

        

        if (!isNaN(materialUnitUseQty)) { // 단위 소요량이 유효한 숫자인 경우
            const calculatedInputQty = parentOrderQty * materialUnitUseQty;
            expectedInputQtyCell.textContent = calculatedInputQty.toFixed(3); // 7번째 셀에 투입예상량 표시
            

            let applyWarning = false; // 경고 적용 여부 플래그

            // 재고 부족 조건 검사
            if (isNaN(materialCurrentStock) || materialCurrentStock === null) { // 재고 정보가 없거나 NaN인 경우
                applyWarning = true;
                
                 // 이 경우 7번째 셀의 텍스트를 "재고확인필요" 등으로 변경할 수도 있습니다.
            } else if (isNaN(calculatedInputQty)) { // 계산된 투입량이 NaN인 경우 (이 경우는 거의 없어야 함)
                expectedInputQtyCell.textContent = "계산오류";
                
                // 이 경우에도 8번째 셀에 상태를 표시할 수 있습니다.
            } else if (calculatedInputQty > materialCurrentStock) { // 실제 재고 부족
                applyWarning = true;
            }

            // 경고 적용 플래그에 따라 스타일 및 8번째 셀 내용 변경
            if (applyWarning) {
                // 7번째 셀(투입예상량) 스타일 변경
                expectedInputQtyCell.classList.add('deficit-warning');
                expectedInputQtyCell.style.color = 'red';
                expectedInputQtyCell.style.fontWeight = 'bold';
                

                // 8번째 셀에 "재고 부족" 텍스트 표시
                if (statusDisplayCell) {
                    statusDisplayCell.textContent = '재고 부족';
                    statusDisplayCell.style.color = 'red';
                    statusDisplayCell.style.fontWeight = 'bold'; // 강조 효과 (선택 사항)
                }
            } else if (!isNaN(calculatedInputQty)) { // 부족하지 않고, 투입예상량 계산이 정상인 경우
                statusDisplayCell.textContent = '가능';
                statusDisplayCell.style.fontWeight = 'bold'; 
            }
            // calculatedInputQty가 NaN인 경우는 이미 위에서 처리됨

        } else { // 단위 소요량(useqty) 자체가 유효한 숫자가 아닌 경우
            expectedInputQtyCell.textContent = "단위소요량오류";
            
            // 이 경우에도 8번째 셀에 "BOM 확인" 등의 메시지를 표시할 수 있습니다.
            if (statusDisplayCell) {
                statusDisplayCell.textContent = 'BOM 확인';
                statusDisplayCell.style.color = 'orange'; // 예시 색상
            }
        }
    });

    
}
async function opendetail(data) {
    // ... (이전과 동일, 모달 채우는 로직) ...
    openModal();
    const title = document.getElementById('modalTitle');
    if (title) title.textContent = 'MRP 상세 정보 및 BOM 구성';
    const modalForm = document.getElementById('modalForm');
    if (modalForm) {
        modalForm.querySelector('button[name="save"]').style.display = 'none';
        modalForm.querySelector('button[name="edit"]').style.display = 'none';
    }
    

    if (!data || data.productPrimaryItemIdx === undefined || data.orderQty === undefined) {
        
        setInputValueById('modalProductItemNm', "필수 주문 정보가 부족합니다.");
        clearMaterialDetailFields();
        const bomListBody = document.getElementById('bomMaterialListBody');
        if (bomListBody) bomListBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">완제품 정보를 먼저 로드해야 합니다.</td></tr>';
        return;
    }

    const productProductionQty = parseFloat(data.orderQty || 0);
    const parentItemId = data.productPrimaryItemIdx;

    setInputValueById('modalOrderCode', data.orderCode);
    setInputValueById('modalProductProductionQty', productProductionQty);
    setInputValueById('modalProductItemCd', data.productItemCd);
    setInputValueById('modalProductItemNm', data.productItemNm);
    setInputValueById('modalCustomerNm', data.customerNm);
    setInputValueById('modalOrderDate', data.orderDate);
    setInputValueById('modalMrpStatus', data.orderStatusOverall);
    setInputValueById('modalOrderDeliveryDate', data.orderDeliveryDate);
    setInputValueById('modalRemark', data.mrpRemark || '');

    if (data.productCurrentStock !== undefined) {
        setInputValueById('modalProductCurrentStock', data.productCurrentStock);
    } else {
        await fetchCurrentStock(parentItemId, 'modalProductCurrentStock');
    }
    if (data.productivity !== undefined) {
        setInputValueById('modalProductivity', data.productivity);
    } else {
        setInputValueById('modalProductivity', '');
    }
    
    if (parentItemId !== undefined) {
        await fetchAndDisplayBomForModal(parentItemId, productProductionQty); // 모달용 BOM 함수 호출
    } else {
        const bomListBody = document.getElementById('bomMaterialListBody');
        if (bomListBody) bomListBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">BOM 조회를 위한 제품 ID가 없습니다.</td></tr>';
        clearMaterialDetailFields();
    }
}

// --- 나머지 Modal, Order 함수들 ---
let currentTh = null;
let currentOrder = 'desc';
function order(thValue) {  }
function openModal() {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    if (!modal) return;
    if (title) title.textContent = '신규 MRP 등록';
    modal.style.display = 'flex';
    const modalForm = document.getElementById('modalForm');
    if (modalForm) {
        modalForm.querySelector('button[name="save"]').style.display = 'none';
        modalForm.querySelector('button[name="edit"]').style.display = 'none';
    }
}
function closeModal() { const modal = document.getElementById('modal'); if (modal) modal.style.display = 'none';}
function outsideClick(e) { if (e.target.id === 'modal') closeModal();}
function submitModal(event) { event.preventDefault();  closeModal(); }