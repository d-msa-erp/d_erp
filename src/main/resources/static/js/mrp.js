// --- 전역 변수 ---
const mrpPageSize = 10;
let currentSelectedOrderId = null;

// --- DOM 요소 참조 변수 (DOMContentLoaded에서 할당) ---
let mrpSearchText, mrpSearchBtn, itembody, materialbody, checkAllOrdersCheckbox;

// --- Helper Functions ---

function setInputValueById(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = (value === null || value === undefined) ? '' : value;
    }
}

// 현재고 API가 없으므로, 이 함수는 실제 재고를 가져오지 못하고 메시지를 표시합니다.
async function fetchCurrentStock(itemIdx, targetInputIdOrCell) {
    const message = 'N/A (재고API없음)';
    if (typeof targetInputIdOrCell === 'string') {
        setInputValueById(targetInputIdOrCell, message);
    } else if (targetInputIdOrCell && targetInputIdOrCell.textContent !== undefined) {
        targetInputIdOrCell.textContent = message;
    }
    // 실제 API 호출 로직은 주석 처리 또는 삭제
    /*
    if (!itemIdx && itemIdx !== 0) {
        // ... N/A 처리 ...
        return null;
    }
    try {
        const response = await fetch(`/api/stock/${itemIdx}`);
        if (!response.ok) {
            throw new Error(`현재고 조회 API 오류! Status: ${response.status}`);
        }
        const stockData = await response.json();
        const stockQty = stockData.stockQty !== undefined ? stockData.stockQty : '데이터 없음';
        // ... 값 설정 ...
        return stockData.stockQty;
    } catch (error) {
        // ... 오류 처리 ...
        return null;
    }
    */
    return null; // 임시 반환
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
    const materialUnitCost = parseFloat(materialData.subItemMasterCost || 0); // BomListItemDto의 subItemMasterCost 사용
    const prodQty = parseFloat(productProductionQty || 0);

    const totalRequiredMaterialQty = bomUnitQty * prodQty;
    const totalCalculatedCost = totalRequiredMaterialQty * materialUnitCost;

    setInputValueById('modalSelectedMaterialCode', materialData.subItemCd);
    setInputValueById('modalSelectedMaterialName', materialData.subItemNm);
    setInputValueById('modalSelectedMaterialUnit', materialData.unitNm);
    setInputValueById('modalCalculatedMaterialQty', totalRequiredMaterialQty.toFixed(3));
    setInputValueById('modalCalculatedMaterialCost', totalCalculatedCost.toFixed(2));

    // 원자재 현재고 조회 (API 없음)
    if (materialData.subItemIdx !== undefined) {
        // await fetchCurrentStock(materialData.subItemIdx, 'modalSelectedMaterialStock'); // API 없으므로 주석 처리
        setInputValueById('modalSelectedMaterialStock', 'N/A (재고API 없음)');
    } else {
        setInputValueById('modalSelectedMaterialStock', 'N/A');
    }
}

async function fetchAndDisplayBom(parentProductItemId, productProductionQty) {
    const bomListBody = document.getElementById('bomMaterialListBody');
    if (!bomListBody) {
        console.error("bomMaterialListBody 요소를 찾을 수 없습니다.");
        clearMaterialDetailFields();
        return;
    }
    bomListBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">BOM 정보 로딩 중...</td></tr>`;
    clearMaterialDetailFields();

    try {
        const response = await fetch(`/api/bom/${parentProductItemId}`); // 백엔드 BomController 호출
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`BOM 정보를 찾을 수 없습니다 (제품 ID: ${parentProductItemId}).`);
            }
            throw new Error(`BOM API 오류! Status: ${response.status}`);
        }
        const bomDetailDto = await response.json(); // BomItemDetailDto 구조 기대

        bomListBody.innerHTML = '';
        if (bomDetailDto && bomDetailDto.components && bomDetailDto.components.length > 0) {
            const parentProductName = bomDetailDto.itemNm || document.getElementById('modalProductItemNm')?.value || '완제품';

            bomDetailDto.components.forEach((component, index) => { // component는 BomListItemDto 와 유사한 구조
                const row = bomListBody.insertRow();
                row.style.cursor = 'pointer';

                row.insertCell().textContent = component.seqNo || (index + 1);
                row.insertCell().textContent = parentProductName;
                row.insertCell().textContent = component.subItemNm || '';
                row.insertCell().textContent = component.useQty || 0;      // BomListItemDto의 useQty
                row.insertCell().textContent = component.lossRt || 0;      // BomListItemDto의 lossRt
                row.insertCell().textContent = component.subItemMasterCost || 0; // BomListItemDto의 subItemMasterCost
                row.insertCell().textContent = component.remark || '';     // BomListItemDto의 remark

                row.addEventListener('click', async () => {
                    bomListBody.querySelectorAll('tr').forEach(tr => tr.classList.remove('selected-material-row'));
                    row.classList.add('selected-material-row');
                    await displayMaterialDetailsInForm(component, productProductionQty);
                });
            });

            if (bomDetailDto.components.length > 0) {
                const firstRowInBom = bomListBody.rows[0];
                if (firstRowInBom) {
                    firstRowInBom.classList.add('selected-material-row');
                }
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
    checkAllOrdersCheckbox = document.getElementById('checkAllOrders');

    fetchMrpTargetOrders('');

    if (mrpSearchBtn) {
        mrpSearchBtn.addEventListener('click', (event) => {
            event.preventDefault();
            const searchTerm = mrpSearchText.value.trim();
            fetchMrpTargetOrders(searchTerm);
            if (materialbody) clearMaterialTable("상단에서 주문/계획을 선택해주세요.");
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

    if (checkAllOrdersCheckbox) {
        checkAllOrdersCheckbox.addEventListener('change', function() {
            if (!itembody) return;
            const checkboxes = itembody.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => checkbox.checked = this.checked);
        });
    }

    if (itembody && checkAllOrdersCheckbox) {
        itembody.addEventListener('change', function(event) {
            if (event.target.type === 'checkbox' && event.target !== checkAllOrdersCheckbox) {
                updateCheckAllOrdersState();
            }
        });
    }
});

function updateCheckAllOrdersState() {
    if (!itembody || !checkAllOrdersCheckbox) return;
    const allCheckboxes = itembody.querySelectorAll('input[type="checkbox"]');
    const checkedCheckboxes = itembody.querySelectorAll('input[type="checkbox"]:checked');
    checkAllOrdersCheckbox.checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
}

async function fetchMrpTargetOrders(searchKeyword) {
    let url = `/api/mrp/orders?page=0&size=${mrpPageSize}`; // 백엔드 MrpController에 해당 API 존재
    if (searchKeyword) {
        url += `&searchKeyword=${encodeURIComponent(searchKeyword)}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
        const pageData = await response.json(); // Page<MrpSecondDto> 기대

        if (!itembody) {
            console.error("itembody 요소를 찾을 수 없습니다.");
            return;
        }
        itembody.innerHTML = '';

        if (pageData && pageData.content && pageData.content.length > 0) {
            for (const order of pageData.content) { // order는 MrpSecondDto 객체
                const row = itembody.insertRow();
                row.style.cursor = 'pointer';
                
                row.addEventListener('click', (event) => {
                    const clickedCell = event.target.closest('td');
                    const firstCell = row.cells[0];
                    if (clickedCell !== firstCell) {
                        handleOrderRowClick(order, row);
                    }
                });

                const cellCheckbox = row.insertCell();
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = order.orderIdx || ''; // MrpSecondDto의 orderIdx
                checkbox.onclick = (e) => e.stopPropagation();
                cellCheckbox.appendChild(checkbox);
                cellCheckbox.addEventListener('click', (e) => e.stopPropagation());

                row.insertCell().textContent = order.orderCode || '';
                row.insertCell().textContent = order.productionCode || ''; // MrpSecondDto에 이 필드가 없다면 빈 값
                row.insertCell().textContent = order.productItemCd || '';   // MrpSecondDto의 productItemCd
                row.insertCell().textContent = order.productItemNm || '';   // MrpSecondDto의 productItemNm
                row.insertCell().textContent = order.customerNm || '';
                
                const stockCell = row.insertCell(); // "규격" 대신 "현재고량"
                stockCell.textContent = 'N/A (재고API없음)';
                // 만약 MrpSecondDto에 'productCurrentStock'과 같은 필드로 현재고가 포함된다면:
                // stockCell.textContent = order.productCurrentStock !== undefined ? order.productCurrentStock : 'N/A';
                
                // MrpSecondDto에 제품 단위(productUnitNm 등) 필드가 필요합니다. materialUnitNm은 자재 단위입니다.
                row.insertCell().textContent = order.productUnitNm || order.unitNm || ''; 
                // MrpSecondDto의 requiredQty를 생산수량으로 가정. 정확한 필드명으로 대체 필요.
                row.insertCell().textContent = order.requiredQty === null || order.requiredQty === undefined ? '' : order.requiredQty; 
                row.insertCell().textContent = order.productivity || ''; // MrpSecondDto에 이 필드가 없다면 빈 값
            }
        } else {
            itembody.innerHTML = `<tr><td class="nodata" colspan="10" style="text-align: center;">조회된 데이터가 없습니다.</td></tr>`;
        }

        if (checkAllOrdersCheckbox) checkAllOrdersCheckbox.checked = false;
        updateCheckAllOrdersState();

    } catch (error) {
        console.error("MRP 대상 주문 목록 조회 중 오류:", error);
        if (itembody) {
            itembody.innerHTML = `<tr><td class="nodata" colspan="10" style="text-align: center;">데이터를 불러오는 중 오류가 발생했습니다. (API: ${url.split('?')[0]})</td></tr>`;
        }
    }
}

function handleOrderRowClick(orderData, clickedRow) {
    currentSelectedOrderId = orderData.orderIdx; // MrpSecondDto의 orderIdx 사용
    console.log("Order row clicked, ID:", currentSelectedOrderId, "Data:", orderData);

    if (itembody) {
        const previouslySelectedRow = itembody.querySelector('tr.selected-row');
        if (previouslySelectedRow) {
            previouslySelectedRow.classList.remove('selected-row');
        }
    }
    if (clickedRow) {
        clickedRow.classList.add('selected-row');
    }
    
    // fetchMrpMaterialRequirements(currentSelectedOrderId); // 페이지 하단 두 번째 테이블용, 필요시 호출
    
    opendetail(orderData); // 전달하는 orderData는 MrpSecondDto 객체
}

async function opendetail(data) { // data는 MrpSecondDto 객체
    openModal();
    const title = document.getElementById('modalTitle');
    if (title) title.textContent = 'MRP 상세 정보 및 BOM 구성';
    
    const modalForm = document.getElementById('modalForm');
    if (modalForm) {
        const saveButton = modalForm.querySelector('button[name="save"]');
        const editButton = modalForm.querySelector('button[name="edit"]');
        if (saveButton) saveButton.style.display = 'none';
        if (editButton) editButton.style.display = 'block';
    }
    console.log("opendetail called with data:", data);

    // MrpSecondDto의 필드명을 사용하여 필수 값 확인
    if (!data || data.productPrimaryItemIdx === undefined || data.requiredQty === undefined) {
        console.error("MRP 주문 데이터에 productPrimaryItemIdx 또는 requiredQty(생산수량으로 가정)가 없습니다.", data);
        setInputValueById('modalProductItemNm', "필수 주문 정보(제품ID 또는 생산수량)가 부족합니다.");
        clearMaterialDetailFields();
        const bomListBody = document.getElementById('bomMaterialListBody');
        if (bomListBody) bomListBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">완제품 정보를 먼저 로드해야 합니다.</td></tr>';
        return;
    }

    // MrpSecondDto의 필드명을 사용하여 값 할당
    const productProductionQty = parseFloat(data.requiredQty || 0); // data.requiredQty를 생산수량으로 사용
    const parentItemId = data.productPrimaryItemIdx; // data.productPrimaryItemIdx를 완제품 ID로 사용

    setInputValueById('modalProductItemCd', data.productItemCd);
    setInputValueById('modalProductItemNm', data.productItemNm);
    setInputValueById('modalProductProductionQty', productProductionQty);
    setInputValueById('modalRemark', data.mrpRemark || ''); // MrpSecondDto의 mrpRemark 사용

    // 완제품 현재고 조회 (API 없음)
    setInputValueById('modalProductCurrentStock', 'N/A (재고API 없음)');
    // if (parentItemId !== undefined) {
    //    await fetchCurrentStock(parentItemId, 'modalProductCurrentStock');
    // }
    
    if (parentItemId !== undefined) {
        await fetchAndDisplayBom(parentItemId, productProductionQty);
    } else {
        const bomListBody = document.getElementById('bomMaterialListBody');
        if (bomListBody) bomListBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">BOM 조회를 위한 제품 ID가 없습니다.</td></tr>';
        clearMaterialDetailFields();
    }
}

// --- 나머지 함수들 (fetchMrpMaterialRequirements, clearMaterialTable, order, 모달 열고 닫는 함수 등) ---
// (이전 답변과 동일하게 유지)
async function fetchMrpMaterialRequirements(orderId) {
    if (!materialbody) { return; }
    if (!orderId) { clearMaterialTable("먼저 상단 목록에서 주문을 선택해주세요."); return; }
    const url = `/api/mrp/results?orderIdx=${orderId}&page=0&size=1000`;

    try {
        const response = await fetch(url);
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        const pageData = await response.json();
        const materials = pageData.content;
        materialbody.innerHTML = '';
        if (materials && materials.length > 0) {
            materials.forEach((material, index) => {
                const row = materialbody.insertRow();
                row.insertCell().textContent = index + 1;
                row.insertCell().textContent = material.materialItemCd || '';
                row.insertCell().textContent = material.materialItemNm || '';
                row.insertCell().textContent = material.materialItemSpec || '';
                row.insertCell().textContent = material.requiredQty ?? '';
                row.insertCell().textContent = material.materialUnitNm || '';
                row.insertCell().textContent = material.expectedInputQty ?? '';
            });
        } else {
            clearMaterialTable("해당 주문에 대한 자재 소요량 데이터가 없습니다.");
        }
    } catch (error) {
        console.error(`자재 소요량 목록 조회 중 오류 (Order ID: ${orderId}):`, error);
        clearMaterialTable(`자재 소요량 데이터를 불러오는 중 오류가 발생했습니다.`);
    }
}

function clearMaterialTable(message = "상단에서 주문/계획을 선택해주세요.") {
    if (materialbody) {
        materialbody.innerHTML = `<tr><td class="nodata" colspan="7" style="text-align: center;">${message}</td></tr>`;
    }
}

let currentTh = null;
let currentOrder = 'desc';

function order(thValue) {
    console.log("정렬 기능 호출됨 - 실제 데이터 정렬 로직 필요 (API 호출 연동)");
}

function openModal() {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    if (!modal) return;
    if (title) title.textContent = '신규 MRP 등록';
    modal.style.display = 'flex';
    const modalForm = document.getElementById('modalForm');
    if (modalForm) {
        const saveButton = modalForm.querySelector('button[name="save"]');
        const editButton = modalForm.querySelector('button[name="edit"]');
        if (saveButton) saveButton.style.display = 'block';
        if (editButton) editButton.style.display = 'none';
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'none';
}

function outsideClick(e) {
    if (e.target.id === 'modal') {
        closeModal();
    }
}

function submitModal(event) {
    event.preventDefault();
    console.log('모달 제출 로직 필요');
    closeModal();
}