// purchase.js

let itemList = []; // 품목 리스트를 담을 배열
const companyCustMap = new Map(); // 거래처명에 따른 idx를 담을 map
let warehouseOptions = []; // 창고 목록 전역 변수

let currentPage = 0; // API는 0-based, UI는 1-based로 표시
let totalPages = 1;
let sortBy = 'deliveryDate'; // 기본 정렬: 납기예정일
let sortDirection = 'asc';   // 기본 오름차순
let currentEditingOrderIdx = null; // 수정 중인 발주의 orderIdx (openModal에서 사용)


document.addEventListener('DOMContentLoaded', () => {
    // --- "적정 재고 미달 품목" 박스 토글 로직 ---
    const toggleBtn = document.getElementById("toggleLowStockBtn");
    const lowStockWrapper = document.getElementById("lowInventoryBoxWrapper");
    const lowStockContent = lowStockWrapper ? lowStockWrapper.querySelector('.low-inventory-content') : null; // 실제 내용 영역
    const toggleBtnIcon = toggleBtn ? toggleBtn.querySelector('.material-symbols-outlined') : null;

    if (toggleBtn && lowStockWrapper && lowStockContent && toggleBtnIcon) {
        // 초기 상태 설정 (CSS에서 .initially-minimized 클래스로 제어하도록 HTML 수정 권장)
        // 여기서는 JS로 초기 상태를 명시적으로 설정 (예: 기본적으로 확장)
        if (lowStockWrapper.classList.contains('initially-minimized')) { // HTML에 이 클래스가 있다면
            lowStockWrapper.classList.remove('expanded');
            lowStockWrapper.classList.add('minimized'); // CSS에서 .minimized 스타일 정의 필요
            lowStockContent.style.display = "none";
            toggleBtnIcon.textContent = 'inventory_2'; // 열기 아이콘 (예시)
            toggleBtn.title = "적정 재고 미달 품목 보기";
        } else { // 기본은 확장된 상태로 가정
            lowStockWrapper.classList.add('expanded');
            lowStockWrapper.classList.remove('minimized');
            lowStockContent.style.display = "flex"; // 또는 "block"
            toggleBtnIcon.textContent = 'chevron_left'; // 접기/닫기 아이콘 (예시)
            toggleBtn.title = "목록 숨기기";
        }

        toggleBtn.addEventListener("click", function(event) {
            event.stopPropagation();
            lowStockWrapper.classList.toggle('expanded');
            lowStockWrapper.classList.toggle('minimized');

            if (lowStockWrapper.classList.contains('expanded')) {
                lowStockContent.style.display = "flex"; // 또는 "block"
                this.title = "목록 숨기기";
                toggleBtnIcon.textContent = 'chevron_left';
            } else {
                lowStockContent.style.display = "none";
                this.title = "적정 재고 미달 품목 보기";
                toggleBtnIcon.textContent = 'inventory_2';
            }
        });
    }
    // --- "적정 재고 미달 품목" 박스 토글 로직 끝 ---

    loadPurchases(sortBy, sortDirection, currentPage); // 초기 발주 목록 로드
    loadLowInventoryItems(); // 적정 재고 미달 품목 로드

    // --- 나머지 DOMContentLoaded 내의 이벤트 리스너들 (이전 코드와 동일) ---
	const selectAllMainCb = document.getElementById('selectAllCheckbox');
	if (selectAllMainCb) selectAllMainCb.addEventListener('change', function() {
		document.querySelectorAll('#purchasesTableBody .purchase-checkbox').forEach(cb => {
			cb.checked = this.checked;
		});
	});

	document.getElementById("btn-first-page")?.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage = 0;
            loadPurchases(sortBy, sortDirection, currentPage);
        }
    });
	document.getElementById("btn-prev-page")?.addEventListener('click', () => {
		if (currentPage > 0) {
			currentPage--;
			loadPurchases(sortBy, sortDirection, currentPage);
		}
	});
	document.getElementById("btn-next-page")?.addEventListener('click', () => {
		if (currentPage < totalPages - 1) {
			currentPage++;
			loadPurchases(sortBy, sortDirection, currentPage);
		}
	});
    document.getElementById("btn-last-page")?.addEventListener('click', () => {
         if (currentPage < totalPages - 1) {
            currentPage = totalPages - 1;
            loadPurchases(sortBy, sortDirection, currentPage);
        }
    });

	const currentPageInputVal = document.getElementById("currentPageInput"); // 변수명 변경
    if (currentPageInputVal) {
        currentPageInputVal.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const page = parseInt(e.target.value);
                if (!isNaN(page) && page >= 1 && page <= totalPages) {
                    currentPage = page - 1;
                    loadPurchases(sortBy, sortDirection, currentPage);
                } else {
                    alert('올바른 페이지 번호를 입력하세요.');
                    e.target.value = currentPage + 1;
                }
            }
        });
        currentPageInputVal.addEventListener('blur', (e) => {
             const page = parseInt(e.target.value);
            if (isNaN(page) || page < 1 || page > totalPages) {
                e.target.value = currentPage + 1;
            }
        });
    }

    const searchButton = document.querySelector('.search-action-buttons .btn-search');
	if (searchButton) searchButton.addEventListener('click', searchItems);
    const searchInput = document.getElementById('searchInput');
	if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchItems();
            }
        });
    }
	document.getElementById('searchTransStatus')?.addEventListener('change', searchItems);

    const resetSearchBtn = document.getElementById('resetSearchPurchaseBtn');
    if(resetSearchBtn) {
        resetSearchBtn.addEventListener('click', () => {
            document.getElementById('searchTransStatus').value = "";
            document.getElementById('searchInput').value = "";
            currentPage = 0;
            loadPurchases(sortBy, sortDirection, currentPage);
        });
    }
    
    const purchasesTableBody = document.getElementById('purchasesTableBody');
    if (purchasesTableBody) {
        purchasesTableBody.addEventListener('change', function(event){
            if(event.target.classList.contains('purchase-checkbox')){
                updateSelectAllCheckboxStatus();
            }
        });
    }
    
    const itemNameInput = document.getElementById("itemName");
    if(itemNameInput) itemNameInput.addEventListener("change", handleItemNameChange);

    const companySearchInput = document.getElementById("companySearchInput");
    if(companySearchInput) companySearchInput.addEventListener("change", handleCompanyChange);
    
    const whSearchInput = document.getElementById('whSearchInput');
    if (whSearchInput) whSearchInput.addEventListener('input', handleWarehouseInputChange);

    const saveBtn = document.getElementById("saveBtn");
    const editBtn = document.getElementById("editBtn");
    if(saveBtn) saveBtn.addEventListener('click', savePurchaseOrder);
    if(editBtn) editBtn.addEventListener('click', editPurchaseOrder);
    
    const deletePurchaseBtn = document.getElementById('deletePurchaseBtn');
    if(deletePurchaseBtn) deletePurchaseBtn.addEventListener('click', deleteSelectedPurchases);

    // 적정 재고 미달 품목 클릭 시 모달 열기 (이벤트 위임)
    const lowStockNoticeContainer = document.getElementById('lowStockNotice');
    if (lowStockNoticeContainer) {
        lowStockNoticeContainer.addEventListener('click', function(e) {
            const target = e.target.closest('.low-item');
            if (target && target.dataset.item) {
                try {
                    const data = JSON.parse(target.dataset.item.replace(/&apos;/g, "'"));
                    openModal(data); // 신규 등록 모드를 열되, data 객체 전달
                } catch (parseError) {
                    console.error("적정 재고 미달 품목 데이터 파싱 오류:", parseError);
                    alert("선택한 품목 정보를 처리하는 중 오류가 발생했습니다.");
                }
            }
        });
    }

}); // DOMContentLoaded 종료


function updateSelectAllCheckboxStatus() {
    const selectAllMainCb = document.getElementById('selectAllCheckbox');
    const itemCheckboxes = document.querySelectorAll('#purchasesTableBody .purchase-checkbox');
    const checkedCount = document.querySelectorAll('#purchasesTableBody .purchase-checkbox:checked').length;

    if (selectAllMainCb) {
        selectAllMainCb.checked = itemCheckboxes.length > 0 && itemCheckboxes.length === checkedCount;
        selectAllMainCb.indeterminate = checkedCount > 0 && checkedCount < itemCheckboxes.length;
    }
}

async function loadPurchases(pSortBy, pSortDirection, pPage = 0) {
    sortBy = pSortBy;
    sortDirection = pSortDirection;
    currentPage = pPage; // API는 0-based page

    const purchasesTableBody = document.getElementById('purchasesTableBody');
    const noDataRow = document.getElementById('NoPurchaseRow');
    const paginationInfoEl = document.getElementById('paginationInfo');
    const currentPageInputEl = document.getElementById('currentPageInput');
    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');
    const btnFirst = document.getElementById('btn-first-page');
    const btnLast = document.getElementById('btn-last-page');

    if (!purchasesTableBody || !noDataRow) {
        console.warn("발주 테이블 관련 요소를 찾을 수 없습니다.");
        return;
    }
    
    const status = document.getElementById('searchTransStatus').value;
    const keyword = document.getElementById('searchInput').value.trim();

    const apiUrl = `/api/orders/purchases?sortBy=${sortBy}&sortDirection=${sortDirection}&page=${currentPage}&status=${status}&keyword=${encodeURIComponent(keyword)}`;
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const pageData = await response.json();
        purchasesTableBody.innerHTML = ''; 
        
        totalPages = pageData.totalPages || 1;
        // currentPage는 이미 함수 파라미터로 0-based로 설정됨
        const totalElements = pageData.totalElements || 0;

        if (paginationInfoEl) paginationInfoEl.textContent = `총 ${totalElements}건 ${currentPage + 1}/${totalPages}페이지`;
        if (currentPageInputEl) {
            currentPageInputEl.value = currentPage + 1; // UI는 1-based
            currentPageInputEl.max = totalPages;
        }
        if(btnFirst) btnFirst.disabled = (currentPage === 0);
        if(btnPrev) btnPrev.disabled = (currentPage === 0);
        if(btnNext) btnNext.disabled = (currentPage >= totalPages - 1);
        if(btnLast) btnLast.disabled = (currentPage >= totalPages - 1);

        if (pageData.content && pageData.content.length > 0) {
            noDataRow.style.display = 'none';
            renderPurchases(pageData.content);
        } else {
            noDataRow.style.display = '';
            const nodataCell = noDataRow.querySelector('.nodata');
            if(nodataCell) nodataCell.textContent = '조회된 발주 데이터가 없습니다.';
        }
    } catch (error) {
        console.error('발주 데이터 로딩 실패:', error);
        noDataRow.style.display = '';
        const nodataCell = noDataRow.querySelector('.nodata');
        if(nodataCell) {
            nodataCell.textContent = '데이터 로딩 중 오류가 발생했습니다.';
            nodataCell.style.color = 'red';
        }
    }
    updateSelectAllCheckboxStatus();
}

function renderPurchases(purchasesContent) { // 함수명 변경 없음, 파라미터명 명확히
    const purchasesTableBody = document.getElementById('purchasesTableBody');
    // purchasesTableBody.innerHTML = ''; // loadPurchases에서 이미 처리

    purchasesContent.forEach(purchase => {
        const row = purchasesTableBody.insertRow();
        row.dataset.orderIdx = purchase.orderIdx;
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => openModal(purchase));

        const checkboxCell = row.insertCell();
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('purchase-checkbox');
        checkbox.dataset.orderIdx = purchase.orderIdx;
        checkbox.addEventListener('click', (e) => e.stopPropagation());
        checkboxCell.appendChild(checkbox);

        row.insertCell().textContent = purchase.itemCode || '';
        row.insertCell().textContent = purchase.itemName || '';
        row.insertCell().textContent = purchase.customerName || '';
        const qtyCell = row.insertCell();
        qtyCell.textContent = purchase.quantity ? purchase.quantity.toLocaleString() : '0';
        qtyCell.style.textAlign = 'right';
        row.insertCell().textContent = purchase.orderDate ? formatDate(purchase.orderDate) : '';
        const priceCell = row.insertCell();
        priceCell.textContent = purchase.totalPrice ? formatCurrencyKR(purchase.totalPrice) : '0원';
        priceCell.style.textAlign = 'right';
        row.insertCell().textContent = purchase.userName || '';
        
        const statusCell = row.insertCell();
        const statusSpan = document.createElement('span');
        statusSpan.classList.add('status-tag'); // CSS 스타일링을 위한 클래스
        let statusText = '';
        if (purchase.orderStatus === 'P1') {
            statusText = '입고대기';
            statusSpan.classList.add('status-P1'); // 상태별 클래스
        } else if (purchase.orderStatus === 'P2') { // JS에는 P3가 없으므로 P2를 입고완료로 간주
            statusText = '입고완료';
            statusSpan.classList.add('status-P2');
        } else {
            statusText = purchase.orderStatus || '알 수 없음';
            statusSpan.classList.add('status-unknown');
        }
        statusSpan.textContent = statusText;
        statusCell.appendChild(statusSpan);
    });
}

function searchItems() {
    currentPage = 0; 
    loadPurchases(sortBy, sortDirection, currentPage);
}

function order(columnName) {
    if (sortBy === columnName) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortBy = columnName;
        sortDirection = 'asc';
    }
    document.querySelectorAll(".purchase-main-table thead th a.sort-arrow").forEach(a => {
        const th = a.closest('th');
        if (th.getAttribute('onclick') !== `order('${sortBy}')`) {
             a.textContent = '↓';
             a.classList.remove('active');
        }
    });
    const currentArrow = document.querySelector(`.purchase-main-table th[onclick="order('${sortBy}')"] a.sort-arrow`);
    if(currentArrow){
        currentArrow.textContent = sortDirection === 'asc' ? '↑' : '↓';
        currentArrow.classList.add('active');
    }
    currentPage = 0;
    loadPurchases(sortBy, sortDirection, currentPage);
}

async function loadItems() {
    try {
        const response = await fetch('/api/inventory/qty');
        if (!response.ok) throw new Error("자재 목록 서버 오류");
        itemList = await response.json(); // 전역 itemList 업데이트

        const itemNameDataList = document.getElementById("itemList");
        if (!itemNameDataList) return;
        itemNameDataList.innerHTML = "";

        const uniqueItemNames = [...new Set(itemList.map(item => item.itemNm))];
        uniqueItemNames.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            itemNameDataList.appendChild(option);
        });
    } catch (err) {
        console.error("자재 목록 불러오기 실패:", err);
    }
}

async function handleItemNameChange() {
    const selectedItemName = document.getElementById("itemName").value;
    const itemCodeInput = document.getElementById("itemCode");
    const unitPriceInput = document.getElementById("unitPrice");
    const itemIdxInput = document.getElementById("itemIdx");
    const currentInventorySpan = document.getElementById("currentInventory");
    const optimalInventorySpan = document.getElementById("optimalInventory");
    const companySearchInput = document.getElementById("companySearchInput");
    const selectedCustIdxInput = document.getElementById("selectedCustIdx");

    if (!selectedItemName) {
        itemCodeInput.value = '';
        unitPriceInput.value = '';
        itemIdxInput.value = '';
        currentInventorySpan.textContent = '0';
        optimalInventorySpan.textContent = '0';
        companySearchInput.value = '';
        selectedCustIdxInput.value = '';
        currentInventorySpan.classList.remove('low-stock-alert');
        return;
    }

    const matchingItems = itemList.filter(item => item.itemNm === selectedItemName);
    if (matchingItems.length === 0) { // 일치하는 품목이 itemList에 없을 경우
        itemCodeInput.value = '품목 정보 없음';
        unitPriceInput.value = '';
        itemIdxInput.value = ''; // itemIdx도 초기화
        currentInventorySpan.textContent = '0';
        optimalInventorySpan.textContent = '0';
        currentInventorySpan.classList.remove('low-stock-alert');
        // 거래처 정보는 그대로 두거나, 사용자가 직접 선택하도록 유도
        return;
    }

    const firstMatch = matchingItems[0];
    itemIdxInput.value = firstMatch.itemIdx || '';
    itemCodeInput.value = firstMatch.itemCd || '';
    unitPriceInput.value = firstMatch.itemCost != null ? formatCurrencyKR(firstMatch.itemCost) : ''; // 단가 포맷팅

    optimalInventorySpan.textContent = firstMatch.optimalInv != null ? firstMatch.optimalInv.toLocaleString() : '0';

    try { // 현재고는 항상 API로 조회
        const stockResponse = await fetch(`/api/inventory/total-stock?itemIdx=${firstMatch.itemIdx}`);
        if (!stockResponse.ok) throw new Error('재고 조회 실패');
        const totalStock = await stockResponse.json();
        const currentStock = totalStock != null ? Number(totalStock) : 0;
        currentInventorySpan.textContent = currentStock.toLocaleString();

        const optimal = Number(firstMatch.optimalInv ?? 0);
        if (currentStock < optimal) {
            currentInventorySpan.classList.add('low-stock-alert');
        } else {
            currentInventorySpan.classList.remove('low-stock-alert');
        }
    } catch (err) {
        console.error("현재고 조회 오류:", err);
        currentInventorySpan.textContent = "조회 실패";
        currentInventorySpan.classList.remove('low-stock-alert');
    }

    const companyDataList = document.getElementById("companyList");
    companyDataList.innerHTML = "";
    companyCustMap.clear();

    if (firstMatch.custIdx && firstMatch.custNm) {
        companyCustMap.set(firstMatch.custNm, firstMatch.custIdx);
        const option = document.createElement("option");
        option.value = firstMatch.custNm;
        companyDataList.appendChild(option);
        companySearchInput.value = firstMatch.custNm;
        selectedCustIdxInput.value = firstMatch.custIdx;
    } else {
        loadCompaniesForDatalist(); // 기본 거래처 없으면 전체 목록 로드
    }
}

async function loadCompaniesForDatalist() {
    const companyDataList = document.getElementById("companyList");
    const companySearchInput = document.getElementById("companySearchInput");
    const selectedCustIdxInput = document.getElementById("selectedCustIdx");

    if(!companyDataList || !companySearchInput || !selectedCustIdxInput) return;

    companyDataList.innerHTML = "";
    companyCustMap.clear();
    // 신규/수정 시에는 값을 비워둠 (사용자 선택 유도)
    // companySearchInput.value = '';
    // selectedCustIdxInput.value = '';

    try {
        const response = await fetch('/api/customers/active-for-selection?bizFlag=01'); // 발주처(01)
        if (!response.ok) throw new Error("발주처 목록 서버 오류");
        const companies = await response.json();
        companies.forEach(company => {
            companyCustMap.set(company.custNm, company.custIdx); // 이름으로 ID 매핑
            const option = document.createElement("option");
            option.value = company.custNm; // DTO의 custNm 사용
            // option.dataset.custCd = company.custCd; // 필요시 코드도 저장
            companyDataList.appendChild(option);
        });
    } catch (err) {
        console.error("발주처 목록 불러오기 실패:", err);
    }
}

function handleCompanyChange() {
    const selectedCompanyName = document.getElementById("companySearchInput").value;
    const selectedCustIdxInput = document.getElementById("selectedCustIdx");
    if (companyCustMap.has(selectedCompanyName)) {
        selectedCustIdxInput.value = companyCustMap.get(selectedCompanyName);
    } else {
        // 목록에 없는 값을 직접 입력했을 때, ID는 비워둠 (서버에서 이름으로 검색 또는 신규 처리 필요)
        selectedCustIdxInput.value = '';
    }
}

async function loadWarehouse() {
    const whDataList = document.getElementById("whList");
    if (!whDataList) return;
    whDataList.innerHTML = '';
    warehouseOptions = [];
    try {
        const response = await fetch('/api/warehouses/active-for-selection');
        if (!response.ok) throw new Error('창고 데이터 요청 실패');
        const warehouses = await response.json();
        warehouses.forEach(wh => {
            const option = document.createElement('option');
            option.value = wh.whNm;
            option.dataset.idx = wh.whIdx;
            whDataList.appendChild(option);
            warehouseOptions.push(option);
        });
    } catch (err) {
        console.error("창고 목록 로드 오류:", err);
    }
}

function handleWarehouseInputChange() {
    const keyword = this.value; // 여기서 this는 input#whSearchInput
    const selectedWhIdxInput = document.getElementById('selectedwhIdx');
    
    // 입력된 이름과 정확히 일치하는 옵션 찾기
    const selectedOption = warehouseOptions.find(option => option.value === keyword);
    if (selectedOption) {
        selectedWhIdxInput.value = selectedOption.dataset.idx;
    } else {
        selectedWhIdxInput.value = ''; // 일치하는 값 없으면 ID 비움
    }
}

function setOrderDate() {
    const orderDateInput = document.getElementById('orderDate');
    if (orderDateInput) {
        orderDateInput.value = new Date().toISOString().substring(0, 10);
    }
}

function fetchOrderNo() {
    fetch('/api/orders/getno?orderType=P')
        .then(response => {
            if (!response.ok) throw new Error('발주번호 요청 실패');
            return response.json();
        })
        .then(data => {
            document.getElementById("orderNo").value = data.orderNo;
        })
        .catch(error => {
            console.error('신규 발주번호 요청 실패:', error);
            document.getElementById("orderNo").value = "Error"; // 오류 발생 시 표시
        });
}


async function openModal(data = null) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('modalForm');
    const saveButton = document.getElementById('saveBtn');
    const editButton = document.getElementById('editBtn');

    form.reset();
    currentEditingOrderIdx = null;
    document.getElementById('currentInventory').classList.remove('low-stock-alert');

    await loadItems(); // 항상 최신 품목 목록 로드
    await loadCompaniesForDatalist(); // 항상 최신 발주처 목록 로드
    await loadWarehouse();    // 항상 최신 창고 목록 로드

    if (data && data.orderIdx) { // 수정 모드 (테이블 행 클릭 또는 API 상세 조회 후)
        title.textContent = '발주 정보 수정';
        currentEditingOrderIdx = data.orderIdx;
        if(saveButton) saveButton.style.display = 'none';
        if(editButton) editButton.style.display = 'inline-flex';

        document.getElementById('orderNo').value = data.orderCode || '';
        document.getElementById('itemIdx').value = data.itemIdx || '';
        document.getElementById('itemName').value = data.itemName || '';
        
        // 자재명 변경에 따른 자동완성 로직 트리거 (재고, 단가, 코드 등 불러오기)
        // 주의: 이 이벤트가 완료된 후 나머지 필드를 설정해야 할 수 있음 (비동기 처리)
        await handleItemNameChange(); // await로 동기적 처리 시도

        // handleItemNameChange가 끝난 후 값 설정 (덮어쓰기 방지)
        document.getElementById('quantity').value = data.quantity || data.orderQty || ''; // API 필드명 확인 필요
        document.getElementById('selectedCustIdx').value = data.custIdx || '';
        document.getElementById('companySearchInput').value = data.customerName || '';
        document.getElementById('selectedwhIdx').value = data.expectedWhIdx || '';
        document.getElementById('whSearchInput').value = data.expectedWhName || '';

        document.getElementById('orderDate').value = data.orderDate ? formatDate(data.orderDate) : '';
        document.getElementById('deliveryDate').value = data.deliveryDate ? formatDate(data.deliveryDate) : '';
        document.getElementById('remark').value = data.remark || '';
        
        // 단가와 자재코드는 handleItemNameChange에서 설정되므로, 
        // data 객체에 더 정확한 값이 있다면 여기서 다시 설정 (API 응답 기준)
        if (data.unitPrice != null) document.getElementById('unitPrice').value = formatCurrencyKR(data.unitPrice);
        if (data.itemCode) document.getElementById('itemCode').value = data.itemCode;


    } else { // 신규 등록 또는 적정 재고 미달 품목 클릭 시
        title.textContent = '신규 발주 등록';
        if(saveButton) saveButton.style.display = 'inline-flex';
        if(editButton) editButton.style.display = 'none';
        setOrderDate();
        fetchOrderNo();

        if (data && data.origin === 'lowInventory') { // 적정 재고 미달 품목 클릭
            document.getElementById('itemIdx').value = data.itemIdx || '';
            document.getElementById('itemName').value = data.itemNm || '';
            await handleItemNameChange(); // 자재명 변경에 따른 자동완성 (비동기로 호출됨)
            // 재고 정보는 handleItemNameChange에서 업데이트됨
        } else { // 순수 신규 등록
             document.getElementById('currentInventory').textContent = '0';
             document.getElementById('optimalInventory').textContent = '0';
        }
    }
    modal.style.display = 'flex';
}

function savePurchaseOrder() {
    if (!validateModalForm()) return;
    const orderData = getModalFormData();
    orderData.orderStatus = 'P1';
    
    console.log("신규 발주 저장 요청:", orderData);
    fetch('/api/orders/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
    })
    .then(handleResponse)
    .then(data => {
        alert(data.message || '발주가 성공적으로 등록되었습니다.');
        closeModal();
        loadPurchases(sortBy, sortDirection, 0);
        loadLowInventoryItems();
    })
    .catch(handleError);
}

function editPurchaseOrder() {
    if (!currentEditingOrderIdx) { alert("수정할 발주를 선택해주세요."); return; }
    if (!validateModalForm()) return;
    const orderData = getModalFormData();
    
    console.log("발주 수정 요청:", orderData);
    fetch(`/api/orders/update/${currentEditingOrderIdx}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
    })
    .then(handleResponse)
    .then(data => {
        alert(data.message || '발주 정보가 성공적으로 수정되었습니다.');
        closeModal();
        loadPurchases(sortBy, sortDirection, currentPage); // 수정 후 현재 페이지 유지
        loadLowInventoryItems();
    })
    .catch(handleError);
}

function getModalFormData() {
    const orderCode = document.getElementById("orderNo").value;
    const itemIdx = document.getElementById("itemIdx").value;
    const quantity = document.getElementById("quantity").value;
    const custIdx = document.getElementById("selectedCustIdx").value;
    const expectedWhIdx = document.getElementById("selectedwhIdx").value;
    const orderDate = document.getElementById("orderDate").value;
    const deliveryDate = document.getElementById("deliveryDate").value;
    const remark = document.getElementById("remark").value;
    const userIdx = document.getElementById("userIdx").value;
    const unitPrice = unformatCurrencyKR(document.getElementById("unitPrice").value);

    return {
        orderCode, orderType: 'P',
        itemIdx: itemIdx ? parseInt(itemIdx) : null,
        orderQty: quantity ? parseInt(quantity) : null,
        custIdx: custIdx ? parseInt(custIdx) : null,
        expectedWhIdx: expectedWhIdx ? parseInt(expectedWhIdx) : null,
        orderDate, deliveryDate, remark,
        userIdx: userIdx ? parseInt(userIdx) : null,
        unitPrice: unitPrice
    };
}

function validateModalForm() {
    const itemName = document.getElementById("itemName").value;
    const itemIdx = document.getElementById("itemIdx").value;
    const quantity = document.getElementById("quantity").value;
    const companySearchInput = document.getElementById("companySearchInput").value;
    const selectedCustIdx = document.getElementById("selectedCustIdx").value;
    const whSearchInput = document.getElementById("whSearchInput").value;
    const selectedwhIdx = document.getElementById("selectedwhIdx").value;
    const deliveryDate = document.getElementById("deliveryDate").value;
    const orderDate = document.getElementById("orderDate").value;

    if (!itemName.trim() || !itemIdx) { alert('자재를 선택해주세요.'); return false; }
    if (!quantity || parseInt(quantity) <= 0) { alert('발주 수량은 1 이상이어야 합니다.'); return false; }
    if (!companySearchInput.trim() || !selectedCustIdx) { alert('발주처를 선택해주세요.'); return false; }
    if (!whSearchInput.trim() || !selectedwhIdx) { alert('입고 예정 창고를 선택해주세요.'); return false; }
    if (!deliveryDate) { alert('납기 예정일을 입력해주세요.'); return false; }
    
    const orderDt = new Date(orderDate);
    const deliveryDt = new Date(deliveryDate);
    // 날짜의 시간 부분을 제거하고 비교 (YYYY-MM-DD 형식으로만 비교)
    orderDt.setHours(0,0,0,0);
    deliveryDt.setHours(0,0,0,0);

    if (deliveryDt < orderDt) {
        alert("납기예정일은 발주일보다 빠를 수 없습니다.");
        return false;
    }
    return true;
}

function handleResponse(response) { // fetch 응답 공통 처리
    if (!response.ok) return response.json().then(err => { throw new Error(err.message || '요청 처리 실패'); });
    // 성공 시 JSON 응답이 없거나 text일 수 있음
    return response.text().then(text => text ? JSON.parse(text) : {});
}
function handleError(error) { // fetch 오류 공통 처리
    alert('요청 처리 중 오류: ' + error.message);
    console.error(error);
}


function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modalForm').reset();
    document.getElementById('currentInventory').classList.remove('low-stock-alert');
    currentEditingOrderIdx = null;
}

function outsideClick(event) {
    if (event.target.id === 'modal') {
        closeModal();
    }
}

async function loadLowInventoryItems() {
    console.log("[LIL] loadLowInventoryItems 함수 시작");
    try {
        const response = await fetch('/api/inventory/qty-low');
        console.log("[LIL] API 응답 상태:", response.status);
        if (!response.ok) {
            console.error("[LIL] 서버 응답 오류:", response.statusText);
            throw new Error(`서버 응답 오류: ${response.status}`);
        }
        const items = await response.json();
        console.log("[LIL] API로부터 받은 데이터:", items);

        const container = document.getElementById('lowStockNotice');
        if(!container) {
            console.warn("[LIL] lowStockNotice 요소를 찾을 수 없습니다.");
            return;
        }
        container.innerHTML = ''; // 이전 내용 비우기

        if (items.length === 0) {
            container.innerHTML = "<p style='color:#555; font-style:italic;'>모든 품목이 적정 재고 이상입니다.</p>";
            return;
        }

        const listHeader = document.createElement('p');
        listHeader.className = 'info-text'; // CSS 클래스 적용
        listHeader.innerHTML = `🚨 적정 재고 미달 품목 (<strong>${items.length}</strong>건):`;
        container.appendChild(listHeader);

        const ul = document.createElement('ul');
        ul.style.listStyleType = 'none';
        ul.style.paddingLeft = '0'; // 기본 ul 패딩 제거

        items.forEach(item => {
            const itemDataForModal = {
                origin: 'lowInventory',
                itemIdx: item.itemIdx,
                itemNm: item.itemNm,
                itemCd: item.itemCd,
                itemCost: item.itemCost,
                optimalInv: item.optimalInv,
                totalStockQty: item.totalStockQty, // 서버 응답 필드명 확인 필요
                custIdx: item.custIdx, // 기본 거래처 정보 (있다면)
                custNm: item.custNm   // 기본 거래처 정보 (있다면)
            };
            const li = document.createElement('li');
            li.className = 'low-item';
            li.dataset.item = JSON.stringify(itemDataForModal).replace(/'/g, "&apos;");
            li.innerHTML = `<strong>${item.itemNm || '이름없음'}</strong> (${item.itemCd || '코드없음'}) <br><span class="stock-info">현재고: ${item.totalStockQty != null ? item.totalStockQty.toLocaleString() : 'N/A'}, 적정: ${item.optimalInv != null ? item.optimalInv.toLocaleString() : 'N/A'}</span>`;
            ul.appendChild(li);
        });
        container.appendChild(ul);

    } catch (error) {
        console.error('[LIL] 재고 부족 품목 데이터를 불러오는 데 실패했습니다.', error);
        const container = document.getElementById('lowStockNotice');
        if(container) container.innerHTML = "<p style='color:red;'>재고 부족 품목 정보를 불러오는 중 오류가 발생했습니다.</p>";
    }
}

function downloadExcel() {
    const status = document.getElementById('searchTransStatus').value;
    const keyword = document.getElementById('searchInput').value.trim();
    // API는 page가 0부터 시작하므로, 엑셀은 전체 데이터를 위해 page 파라미터를 보내지 않거나, 서버에서 모든 페이지를 처리하도록 함
    const url = `/api/orders/purchase/excel?sortBy=${sortBy}&sortDirection=${sortDirection}&status=${status}&keyword=${encodeURIComponent(keyword)}`;
    window.open(url, '_blank');
}

async function printSelectedPurchase() {
    const checkedCheckboxes = document.querySelectorAll('#purchasesTableBody input.purchase-checkbox:checked');
    if (checkedCheckboxes.length === 0) {
        alert("인쇄할 발주 항목을 선택해주세요.");
        return;
    }
    const selectedOrderIdxes = Array.from(checkedCheckboxes).map(cb => cb.closest('tr').dataset.orderIdx);
    
    if (selectedOrderIdxes.length === 0) return;

    const fetchUrl = `/api/orders/print?orderType=P&ids=${selectedOrderIdxes.join(',')}`;

    let printContents = `
        <html>
        <head>
            <title>발주 내역 인쇄</title>
            <style>
                body { font-family: '맑은 고딕', Malgun Gothic, Dotum, sans-serif; margin: 20px; font-size: 10pt; color: #333; }
                .purchase-order { page-break-inside: avoid; border: 1px solid #ccc; padding: 20px; margin-bottom: 25px; border-radius: 5px; background-color: #fff; }
                .purchase-order h2 { font-size: 16pt; margin-top: 0; margin-bottom: 15px; color: #007bff; border-bottom: 2px solid #0056b3; padding-bottom: 8px; text-align:center; }
                .order-info { margin-bottom: 15px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 20px; }
                .order-info p { margin: 4px 0; font-size: 10pt; }
                .order-info strong { display: inline-block; width: 90px; color: #555; font-weight: bold; }
                .items-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                .items-table th, .items-table td { border: 1px solid #bbb; padding: 8px 10px; text-align: left; vertical-align: top; font-size: 9.5pt; }
                .items-table th { background-color: #f0f4f7; font-weight: bold; text-align: center; }
                .items-table td.number { text-align: right; }
                .status-tag.status-P1 { color: #e65100; background-color: #ffe0b2; padding: 2px 6px; border-radius: 10px; font-size: 0.85em;}
                .status-tag.status-P2 { color: #2e7d32; background-color: #c8e6c9; padding: 2px 6px; border-radius: 10px; font-size: 0.85em;}
                .total-amount { margin-top:15px; text-align:right; font-size:11pt; font-weight:bold; }
                @media print {
                    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .purchase-order { border: 1px solid #ccc !important; box-shadow: none; margin-bottom: 20mm; }
                    h1.print-main-title { display: block !important; font-size: 20pt; text-align: center; margin-bottom: 25px; }
                }
                h1.print-main-title { display: none; }
            </style>
        </head>
        <body>
            <div class="print-area-wrapper">
            <h1 class="print-main-title">발주 내역서</h1>`;

    try {
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`인쇄 데이터 요청 실패: ${res.statusText}`);
        const ordersToPrint = await res.json(); // 서버가 List<발주상세DTO> 형태를 반환한다고 가정

        ordersToPrint.forEach(order => { // order는 개별 발주 정보 (orderCode, customerName 등 포함)
            printContents += `<div class="purchase-order">`;
            printContents += `<h2>발주서 (${order.orderCode || '번호 없음'})</h2>`;
            printContents += `<div class="order-info">`;
            printContents += `<p><strong>발 주 처:</strong> ${order.customerName || ''}</p>`;
            printContents += `<p><strong>발 주 일:</strong> ${order.orderDate ? formatDate(order.orderDate) : ''}</p>`;
            printContents += `<p><strong>납기예정일:</strong> ${order.deliveryDate ? formatDate(order.deliveryDate) : ''}</p>`;
            printContents += `<p><strong>발주담당자:</strong> ${order.userName || ''}</p>`;
            printContents += `<p><strong>입고창고:</strong> ${order.expectedWhName || ''}</p>`; // DTO에 expectedWhName 필드 필요
            const statusText = order.orderStatus === 'P1' ? '입고대기' : (order.orderStatus === 'P2' ? '입고완료' : order.orderStatus);
            printContents += `<p><strong>처리상태:</strong> <span class="status-tag status-${order.orderStatus}">${statusText}</span></p>`;
            printContents += `<p style="grid-column: span 2;"><strong>비&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;고:</strong> ${order.remark || ''}</p>`;
            printContents += `</div>`;

            // 발주 품목 테이블 (order.items가 해당 발주의 품목 리스트라고 가정)
            if (order.items && order.items.length > 0) {
                printContents += `<table class="items-table">`;
                printContents += `<thead><tr><th>No</th><th>자재번호</th><th>자재명</th><th>수량</th><th>단가</th><th>총액</th></tr></thead>`;
                printContents += `<tbody>`;
                order.items.forEach((item, index) => { // item은 개별 발주 품목 정보
                    printContents += `
                        <tr>
                            <td style="text-align:center;">${index + 1}</td>
                            <td>${item.itemCode || ''}</td>
                            <td>${item.itemName || ''}</td>
                            <td class="number">${item.quantity ? item.quantity.toLocaleString() : '0'}</td>
                            <td class="number">${item.unitPrice ? formatCurrencyKR(item.unitPrice) : '0원'}</td>
                            <td class="number">${item.totalPrice ? formatCurrencyKR(item.totalPrice) : '0원'}</td>
                        </tr>
                    `;
                });
                printContents += `</tbody></table>`;
                 // 전체 발주 금액 (order 객체에 이 정보가 있다고 가정)
                printContents += `<div class="total-amount">총 발주 금액: ${order.totalOrderAmount ? formatCurrencyKR(order.totalOrderAmount) : '0원'}</div>`;
            } else {
                printContents += `<p>발주 품목 정보가 없습니다.</p>`;
            }
            printContents += `</div>`; // purchase-order div 닫기
        });

    } catch (e) {
        console.error("[Print] 발주 인쇄 데이터 로딩/처리 오류:", e);
        printContents += `<p style="color:red;">선택된 발주 정보를 인쇄용으로 불러오는 중 오류가 발생했습니다: ${e.message}</p>`;
    }

    printContents += `</div></body></html>`;

    const printWindow = window.open('', '_blank', 'height=700,width=900,scrollbars=yes');
    if (printWindow) {
        printWindow.document.write(printContents);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            try { printWindow.print(); }
            catch (printError) {
                console.error("인쇄 대화상자 오류:", printError);
                printWindow.alert("인쇄 대화상자를 열 수 없습니다. 브라우저 설정을 확인해주세요.");
            }
        }, 700);
    } else {
        alert("팝업 차단 기능이 활성화되어 인쇄 창을 열 수 없습니다.");
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    // return date.toLocaleDateString('ko-KR'); // YYYY. MM. DD. 형식
    return date.toISOString().substring(0,10); // YYYY-MM-DD 형식
}