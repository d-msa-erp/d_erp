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
                console.error("Error formatting date for ID " + elementId + ":", value, e);
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

function clearMaterialTable(message, tableBody, colspan) {
    if (tableBody) {
        tableBody.innerHTML = `<tr><td class="nodata" style="grid-column: span ${colspan}; justify-content: center;">${message}</td></tr>`;
    }
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
	
	let calculatedProductivity = '';
	if (totalRequiredMaterialQty > 0) {
	    // 생산성 = 완제품 생산수량 (prodQty) / 선택된 자재의 총 소요량 (totalRequiredMaterialQty)
	    calculatedProductivity = (prodQty / totalRequiredMaterialQty).toFixed(3); // 소수점 4자리까지 (예시)
	} else if (prodQty > 0 && totalRequiredMaterialQty === 0) {
	    // 자재 소요량이 0인데 생산량이 있다면 (예: 서비스 품목, 또는 오류 상황)
	    calculatedProductivity = 'N/A (소요량0)'; 
	} else {
	    calculatedProductivity = '0'; // 그 외 (둘 다 0이거나, prodQty가 0일 때)
	}
	// 'modalProductivity' ID를 가진 input 필드에 계산된 값을 설정합니다.
	setInputValueById('modalProductivity', calculatedProductivity);
}

async function fetchAndDisplayBomForModal(parentProductItemId, productProductionQty) {
    const bomListBody = document.getElementById('bomMaterialListBody');
    if (!bomListBody) {
        console.error("bomMaterialListBody (모달 내 BOM 목록) 요소를 찾을 수 없습니다.");
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
        console.error(`제품 ID [${parentProductItemId}]에 대한 BOM 정보 조회 중 오류:`, error);
        bomListBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">BOM 정보 로드 실패: ${error.message}</td></tr>`;
    }
}

function mrpexceldownload() {
	console.log("엑셀 다운로드 버튼 클릭됨 (클라이언트 생성 방식)");

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
	            // 예: ws['!merges'] = [{s: {r:0, c:0}, e: {r:0, c:orderHeaders[0].length-1}}];
	            // aoa_to_sheet는 셀 병합을 직접 지원하지 않으므로, 복잡한 병합은 추가 작업 필요
	            // 간단히 하려면, 섹션 제목을 한 셀에만 두거나, 여러 셀에 걸쳐 표시되도록 빈 셀을 옆에 추가
	       }
	       ws['!cols'] = colsWidth;


	       // --- 4. 워크북 생성 및 다운로드 ---
	       const wb = XLSX.utils.book_new();
	       XLSX.utils.book_append_sheet(wb, ws, "MRP 데이터"); // 시트 이름 설정

	       const fileName = `MRP_DATA_${orderInfo.orderCode || '데이터'}.xlsx`;
	       XLSX.writeFile(wb, fileName);

	       console.log("엑셀 파일 생성 및 다운로드 완료 (클라이언트 생성 방식):", fileName);

	   } catch (error) {
	       console.error("클라이언트 사이드 엑셀 생성 중 오류 발생:", error);
	       alert("엑셀 파일을 생성하는 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
	   }
}



// --- 페이지 로드 시 실행되는 메인 로직 및 이벤트 핸들러 ---
document.addEventListener('DOMContentLoaded', () => {
    mrpSearchText = document.getElementById('mrpSearchText');
    mrpSearchBtn = document.getElementById('mrpSearchBtn');
    itembody = document.getElementById('itembody');
    materialbody = document.getElementById('materialbody');

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
			if (materialbody) { // materialbody 요소가 실제로 존재하는지 확인 후
				materialbody.innerHTML ='<tr><td class="nodata" style="grid-column: 1 / -1;justify-content: center;">선택한 주문번호의 자재 데이터가 없습니다.</td></tr>';  
			}
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
                        console.log("Radio selected for order:", order);

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
					order.prodCd || 'null',
                    order.productItemCd || '',
                    order.productItemNm || '',
                    order.customerNm || '',
                    (order.productCurrentStock !== undefined ? order.productCurrentStock : 'N/A(재고없음)'),
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
                        }
                        // 모달은 데이터 셀 클릭 시에는 항상 열리도록 한다.
                        opendetail(order); // 데이터 셀 클릭 시 모달 호출
                    });
                });
            });
        } else {
         itembody.innerHTML = `<tr><td class="nodata" style="grid-column: span 10; text-align: center; justify-content: center;">조회된 데이터가 없습니다.</td></tr>`;
        }
    } catch (error) {
        console.error("MRP 대상 주문 목록 조회 중 오류:", error);
        if (itembody) itembody.innerHTML = `<tr><td class="nodata" colspan="10" style="text-align: center;">데이터를 불러오는 중 오류가 발생했습니다. (API: ${url.split('?')[0]})</td></tr>`;
    }
}

async function populateMaterialTable(parentProductItemId, productProductionQty) {
    if (!materialbody) { console.error("materialbody 요소를 찾을 수 없습니다."); return; }
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
				    stockDisplayText = '오류';
				    stockValue = null;
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
				    stockDisplayText = '오류';
				    stockValue = null;
				}

				stockCell.textContent = stockDisplayText;
				row.dataset.stockvalue = stockValue;
				
				const useQtyCell = row.insertCell();
              	useQtyCell.textContent = component.useQty || 0;                   // 소요량 (단위 소요량)
                row.dataset.useqty = component.useQty || 0;
                row.insertCell().textContent = component.unitNm || '';
                row.insertCell().textContent = '';
            });
        } else {
            clearMaterialTable("해당 제품의 BOM 구성 자재가 없습니다.", materialbody, 7);
        }
    } catch (error) {
        console.error(`ID [${parentProductItemId}] BOM 조회 오류(populateMaterialTable):`, error);
        clearMaterialTable(`BOM 정보 로드 실패: ${error.message}`, materialbody, 7);
    }
}

async function handleCalculateButtonClick() {
    console.log("계산 버튼 클릭됨");
    
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
    const parentStock = parseFloat(selectedMrpOrderDataForCalc.productCurrentStock || 0); 
    
    if (selectedMrpOrderDataForCalc.productCurrentStock === undefined || isNaN(parentStock) || 
        selectedMrpOrderDataForCalc.orderQty === undefined || isNaN(parentOrderQty) ) { // orderQty도 숫자여야 함
         alert("선택된 완제품의 생산수량 또는 현재고 정보가 유효하지 않거나 숫자 형식이 아닙니다.\n백엔드 DTO를 확인해주세요.");
         console.error("계산에 필요한 완제품 정보 오류:", selectedMrpOrderDataForCalc);
         return;
    }

    const deficitQty = parentOrderQty - parentStock;
    console.log(`계산 시작: 완제품 생산수량=${parentOrderQty}, 완제품 현재고=${parentStock}, 부족수량=${deficitQty}`);

    const materialRows = materialbody.querySelectorAll('tr');
    console.log(`처리할 자재 행 개수: ${materialRows.length}`);
    
    materialRows.forEach((row, index) => {
		if (row.querySelector('.nodata') || row.cells.length < 7) {
            console.log(`행 ${index} 스킵: 데이터 없음 또는 셀 부족`);
            return; // 헤더나 빈 행 제외
        }

        const materialStockCell = row.cells[3]; // "재고량" 셀 (0-indexed: NO, 자재코드, 자재명, 재고량)
        const expectedInputQtyCell = row.cells[6]; // "투입예상량" 셀
        const materialUnitUseQty = parseFloat(row.dataset.useqty || 0);
        const materialName = row.cells[2].textContent; // 자재명 (디버깅용)
        
        // 개선된 재고량 값 추출
        const stockValue = row.dataset.stockvalue;
        const materialCurrentStock = stockValue !== null ? parseFloat(stockValue) : null;

        console.log(`처리 중인 자재: ${materialName}`);

		// 스타일 초기화를 위해 기존 경고 클래스 제거
		expectedInputQtyCell.classList.remove('deficit-warning');
		expectedInputQtyCell.style.color = '';
		expectedInputQtyCell.style.fontWeight = '';

		if (deficitQty <= 0) {
		    expectedInputQtyCell.textContent = "출고 가능";
            console.log(`${materialName}: 출고 가능 (부족수량 ${deficitQty})`);
		} else {
		    if (!isNaN(materialUnitUseQty)) {
		        const calculatedInputQty = deficitQty * materialUnitUseQty;
		        expectedInputQtyCell.textContent = calculatedInputQty.toFixed(3);

                console.log(`${materialName}: 재고=${materialCurrentStock}, 투입예상=${calculatedInputQty.toFixed(3)}`);

		        // 개선된 재고량 비교 로직 - NaN 케이스 포함
		        if (isNaN(materialCurrentStock) || 
                    materialCurrentStock === null ||
                    materialCurrentStock === 0 || 
                    isNaN(calculatedInputQty) ||
                    (materialCurrentStock !== null && !isNaN(materialCurrentStock) && calculatedInputQty > materialCurrentStock)) {
		            
                    // CSS 클래스와 직접 스타일링 모두 적용
                    expectedInputQtyCell.classList.add('deficit-warning');
                    expectedInputQtyCell.style.color = 'red';
                    expectedInputQtyCell.style.fontWeight = 'bold';
                    
                    console.log(`${materialName}: 경고 적용됨 (빨간색) - 재고:${materialCurrentStock}, 투입:${calculatedInputQty.toFixed(3)}`);
		        } else {
                    console.log(`${materialName}: 정상 (경고 없음)`);
                }
		    } else {
		        expectedInputQtyCell.textContent = "소요량오류";
                console.log(`${materialName}: 소요량 오류`);
		    }
		}
    });
    
    console.log("계산 완료");
}

async function opendetail(data) {
    openModal();
    const title = document.getElementById('modalTitle');
    if (title) title.textContent = 'MRP 상세 정보 및 BOM 구성';
    const modalForm = document.getElementById('modalForm');
    if (modalForm) {
        modalForm.querySelector('button[name="save"]').style.display = 'none';
        modalForm.querySelector('button[name="edit"]').style.display = 'none';
    }
    console.log("opendetail called with data:", data);

    if (!data || data.productPrimaryItemIdx === undefined || data.orderQty === undefined) {
        console.error("MRP 주문 데이터에 productPrimaryItemIdx 또는 orderQty(생산수량)가 없습니다.", data);
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
function order(thValue) { console.log("정렬 기능 호출됨"); }
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
function submitModal(event) { event.preventDefault(); console.log('모달 제출 로직 필요'); closeModal(); }