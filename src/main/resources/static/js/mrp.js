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
    if (materialData.subItemIdx !== undefined) {
        await fetchCurrentStock(materialData.subItemIdx, 'modalSelectedMaterialStock');
    } else {
        setInputValueById('modalSelectedMaterialStock', 'N/A');
    }
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
				materialbody.innerHTML ='<tr><td class="nodata" style="grid-column: span 7;justify-content: center;">선택한 주문번호의 자재 데이터가 없습니다.</td></tr>';  
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
                    order.productionCode || '',
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
         itembody.innerHTML = `<tr><td class="nodata" style="grid-column: span 10; text-align: center; justify-content: center;">조회된 데이터가 없습니다.</td></tr>`;
        }
    } catch (error) {
        console.error("MRP 대상 주문 목록 조회 중 오류:", error);
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
    console.log("Order row selected (handleOrderRowClick for styling/bottom table):", orderData);

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
                const materialStockCell = row.insertCell();
                await fetchCurrentStock(component.subItemIdx, materialStockCell);
                const useQtyCell = row.insertCell();
                useQtyCell.textContent = component.useQty || 0;
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
    // ... (이전과 동일, selectedMrpOrderDataForCalc.productCurrentStock 의 숫자타입 여부 중요) ...
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
    materialRows.forEach(row => {
        if (row.querySelector('.nodata') || row.cells.length < 7) return; 

        const expectedInputQtyCell = row.cells[6]; 
        const materialUnitUseQty = parseFloat(row.dataset.useqty || 0);

        if (deficitQty <= 0) {
            expectedInputQtyCell.textContent = "출고 가능";
        } else {
            if (!isNaN(materialUnitUseQty)) {
                const calculatedInputQty = deficitQty * materialUnitUseQty;
                expectedInputQtyCell.textContent = calculatedInputQty.toFixed(3);
            } else {
                expectedInputQtyCell.textContent = "소요량오류";
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
        modalForm.querySelector('button[name="edit"]').style.display = 'block';
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
        modalForm.querySelector('button[name="save"]').style.display = 'block';
        modalForm.querySelector('button[name="edit"]').style.display = 'none';
    }
}
function closeModal() { const modal = document.getElementById('modal'); if (modal) modal.style.display = 'none';}
function outsideClick(e) { if (e.target.id === 'modal') closeModal();}
function submitModal(event) { event.preventDefault(); console.log('모달 제출 로직 필요'); closeModal(); }