// --- 전역 변수 ---
const pageSize = 10;
let currentPage = 1;
let totalPages = 1;
let currentSortTh = null;
let currentSortOrder = 'desc';

// --- DOM 요소 참조 변수 ---
let itemTableBody, noDataRow,
    prevPageButton, nextPageButton, currentPageInput,
    totalCountSpan, currentPageSpan,
    itemFlagSelect, searchItemText, searchButton,
    deleteBtn, checkallItemCheckbox;
    // excelDownBtn; // 엑셀 버튼은 현재 코드에서 제외

// --- Helper Functions ---
function setInputValue(form, name, value) {
    const element = form.querySelector(`[name="${name}"]`);
    if (element) {
        if (element.type === 'date' && value) {
            try {
                let dateStr = value.toString();
                if (dateStr.includes('T')) dateStr = dateStr.substring(0, 10);
                else if (dateStr.length > 10 && /^\d{4}-\d{2}-\d{2}/.test(dateStr.substring(0,10))) dateStr = dateStr.substring(0, 10);
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) element.value = dateStr;
                else {
                   const d = new Date(value);
                   element.value = `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
                }
            } catch (e) { element.value = ''; console.error("Error formatting date for name " + name + ":", value, e); }
        } else {
            element.value = (value === null || value === undefined) ? '' : value;
        }
    }
}

function formatCurrencyKR(value) {
    if (value === null || value === undefined || isNaN(parseFloat(value))) return "";
    return parseFloat(value).toLocaleString('ko-KR') + "원";
}

function unformatCurrencyKR(formattedValue) {
    if (typeof formattedValue !== 'string') {
        const num = parseFloat(formattedValue);
        return isNaN(num) ? null : num;
    }
    const numericString = formattedValue.replace(/[원,]/g, "");
    const numValue = parseFloat(numericString);
    return isNaN(numValue) ? null : numValue;
}

// --- 데이터 로딩 및 테이블 렌더링 ---
async function fetchItems(page, itemFlag = null, keyword = null, sortProperty = null, sortDirection = null) {
    currentPage = page;
    const currentItemFlag = itemFlagSelect ? itemFlagSelect.value : ""; // HTML의 itemFlagSelect 사용
    const currentKeyword = searchItemText ? searchItemText.value.trim() : "";

    // URL 생성 시, searchKeyword는 함수 파라미터 keyword를 사용합니다.
    let url = `/api/stocks?page=${page - 1}&size=${pageSize}`; // API 경로 확인!

    if (itemFlag) { // itemFlagSelect에서 직접 받은 값 사용
        url += `&itemFlagFilter=${encodeURIComponent(itemFlag)}`;
    }
    if (keyword && keyword.trim() !== "") { // 함수 파라미터 keyword 사용
        url += `&searchKeyword=${encodeURIComponent(keyword.trim())}`;
    }

    if (sortProperty && sortDirection) {
        url += `&sort=${encodeURIComponent(sortProperty)},${encodeURIComponent(sortDirection)}`;
    } else if (currentSortTh && currentSortTh.dataset.sortProperty && currentSortOrder) {
         url += `&sort=${encodeURIComponent(currentSortTh.dataset.sortProperty)},${encodeURIComponent(currentSortOrder)}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) { // API 호출 자체가 실패한 경우 (404, 500 등)
            // JAVASCRIPT 수정: 구체적인 오류 메시지 표시
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}. URL: ${url}`);
        }
        const pageData = await response.json();

        if (!itemTableBody) return;
        itemTableBody.innerHTML = '';

        const items = pageData.content || [];
        const totalElements = pageData.totalElements || 0;
        totalPages = pageData.totalPages || Math.ceil(totalElements / pageSize) || 1;
        currentPage = pageData.number !== undefined ? pageData.number + 1 : page;

        if (totalCountSpan) totalCountSpan.textContent = `총 ${totalElements}건`;
        if (currentPageSpan) currentPageSpan.textContent = `${currentPage}/${totalPages}페이지`;
        if (prevPageButton) prevPageButton.disabled = currentPage === 1;
        if (nextPageButton) nextPageButton.disabled = currentPage === totalPages || totalPages === 0;
        if (currentPageInput) currentPageInput.value = currentPage;

        if (items.length > 0) {
            if (noDataRow) noDataRow.style.display = 'none';
            items.forEach(item => {
                const row = itemTableBody.insertRow();
                row.style.cursor = 'pointer';
                row.dataset.item = JSON.stringify(item);
                row.addEventListener('click', (event) => {
                    if (event.target.type !== 'checkbox' && event.target.closest('td') !== row.cells[0]) {
                        openModal(item);
                    }
                });
                const checkboxCell = row.insertCell();
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.classList.add('item-checkbox');
                checkbox.dataset.itemIdx = item.itemIdx;
                checkbox.addEventListener('click', (e) => e.stopPropagation());
                checkboxCell.appendChild(checkbox);
                row.insertCell().textContent = item.itemCd || "";
                row.insertCell().textContent = item.itemNm || "";
                row.insertCell().textContent = item.qty === null || item.qty === undefined ? "0" : item.qty;
                row.insertCell().textContent = item.inv === null || item.inv === undefined ? "" : item.inv;
                row.insertCell().textContent = item.whNm || "";
                row.insertCell().textContent = item.unitNm || "";
            });
            if (checkallItemCheckbox) updateCheckAllItemState();
        } else { // items.length === 0
            if (noDataRow) noDataRow.style.display = 'none'; // 기존 noDataRow는 숨김
            let message = "조회된 데이터가 없습니다.";
            // JAVASCRIPT 수정: 검색어가 있었는데 결과가 없으면 다른 메시지
            if (currentKeyword.trim() !== "") { // 함수 호출 시 전달된 keyword 사용
                message = `"${currentKeyword}"에 해당하는 자재/품목명이 존재하지 않습니다.`;
            }
            // JAVASCRIPT 수정: colspan 대신 grid-column 스타일 사용 및 메시지 적용
            itemTableBody.innerHTML = `<tr><td class="nodata" style="grid-column: span 7; text-align: center; justify-content: center;">${message}</td></tr>`;
            totalPages = 1;
            if (currentPageSpan) currentPageSpan.textContent = `1/1페이지`;
            if (currentPageInput) currentPageInput.value = 1;
            if (prevPageButton) prevPageButton.disabled = true;
            if (nextPageButton) nextPageButton.disabled = true;
        }
    } catch (error) {
        console.error("데이터 조회 중 오류:", error);
        if (itemTableBody) {
            // JAVASCRIPT 수정: colspan 대신 grid-column 스타일 사용
            itemTableBody.innerHTML = `<tr><td class="nodata" style="grid-column: span 7; text-align: center; justify-content: center;">데이터를 불러오는 중 오류가 발생했습니다.</td></tr>`;
        }
        if (totalCountSpan) totalCountSpan.textContent = '총 0건';
        if (currentPageSpan) currentPageSpan.textContent = '1/1페이지';
        if (prevPageButton) prevPageButton.disabled = true;
        if (nextPageButton) nextPageButton.disabled = true;
        if (currentPageInput) currentPageInput.value = 1;
    }
}

// --- 페이지 로드 시 실행 ---
document.addEventListener('DOMContentLoaded', () => {
    itemTableBody = document.getElementById('itembody');
    //noDataRow = itemTableBody ? itemTableBody.querySelector('tr .nodata')?.closest('tr') : null;

    prevPageButton = document.getElementById('btn-prev-page');
    nextPageButton = document.getElementById('btn-next-page');
    currentPageInput = document.querySelector('.pagination-wrap input[type="text"]');
    totalCountSpan = document.querySelector('.pagination-wrap span:first-child');
    currentPageSpan = document.querySelector('.pagination-wrap span:nth-child(2)');
    
    itemFlagSelect = document.getElementById('itemFlagSelect');
    searchItemText = document.getElementById('searchItemText');
    searchButton = document.getElementById('searchButton');
    deleteBtn = document.getElementById('deleteBtn');
    checkallItemCheckbox = document.getElementById('checkallItem');
    // excelDownBtn = document.getElementById('excelBtn'); // 필요시 ID 할당

    fetchItems(1);

	if (prevPageButton) {
	        prevPageButton.addEventListener('click', () => {
	            if (currentPage > 1) {
	                // 현재 필터와 검색어 값을 가져옵니다.
	                const flagFilter = itemFlagSelect ? itemFlagSelect.value : "";
	                const keyword = searchItemText ? searchItemText.value.trim() : "";
	                fetchItems(currentPage - 1, flagFilter, keyword, currentSortTh?.dataset.sortProperty, currentSortOrder);
	            }
	        });
	    }
	    if (nextPageButton) {
	        nextPageButton.addEventListener('click', () => {
	            if (currentPage < totalPages) {
	                // 현재 필터와 검색어 값을 가져옵니다.
	                const flagFilter = itemFlagSelect ? itemFlagSelect.value : "";
	                const keyword = searchItemText ? searchItemText.value.trim() : "";
	                fetchItems(currentPage + 1, flagFilter, keyword, currentSortTh?.dataset.sortProperty, currentSortOrder);
	            }
	        });
	    }
	    if (currentPageInput) {
	        currentPageInput.addEventListener('change', function() {
	            const pageNumber = parseInt(this.value);
	            if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
	                // 현재 필터와 검색어 값을 가져옵니다.
	                const flagFilter = itemFlagSelect ? itemFlagSelect.value : "";
	                const keyword = searchItemText ? searchItemText.value.trim() : "";
	                fetchItems(pageNumber, flagFilter, keyword, currentSortTh?.dataset.sortProperty, currentSortOrder);
	            } else {
	                alert('유효한 페이지 번호를 입력하세요.');
	                this.value = currentPage; // 잘못된 입력 시 현재 페이지로 복원
	            }
	        });
	    }
    
	if (searchButton) {
	        searchButton.addEventListener('click', function() {
				event.preventDefault();
	            // JAVASCRIPT 수정: 검색 버튼 클릭 시 itemFlagSelect와 searchItemText의 현재 값을 사용
	            const flagFilter = itemFlagSelect ? itemFlagSelect.value : "";
	            const keyword = searchItemText ? searchItemText.value.trim() : "";
	            //fetchItems(1, flagFilter, keyword); // 첫 페이지로, 필터와 키워드 전달
				fetchItems(1, flagFilter, keyword, currentSortTh?.dataset.sortProperty, currentSortOrder); 
	        });
	    }
    if (searchItemText) {
        searchItemText.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                if (searchButton) searchButton.click();
            }
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            const checkedItemsIdx = [];
            if (!itemTableBody) return;
            itemTableBody.querySelectorAll('input.item-checkbox:checked').forEach(checkbox => {
                if(checkbox.dataset.itemIdx) checkedItemsIdx.push(parseInt(checkbox.dataset.itemIdx));
            });

            if (checkedItemsIdx.length === 0) {
                alert('삭제할 항목을 선택해주세요.'); return;
            }
            if (confirm(`선택된 ${checkedItemsIdx.length}개 항목을 정말 삭제하시겠습니까?`)) {
                fetch(`/api/items/deletes`, { // JAVASCRIPT 수정: API 경로를 /api/stock/items/deletes 등으로 변경 필요
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(checkedItemsIdx)
                })
                .then(response => {
                    if (response.ok) return response.text().then(text => text || "삭제되었습니다.");
                    else return response.json().then(err => { throw new Error(err.message || '삭제 실패'); });
                })
                .then(message => {
                    alert(message);
                    const newCurrentPage = (itemTableBody.rows.length === checkedItemsIdx.length && currentPage > 1 && items.length === checkedItemsIdx.length) ? currentPage - 1 : currentPage;
                    fetchItems(newCurrentPage); 
                })
                .catch(error => {
                    console.error('삭제 중 오류 발생:', error);
                    alert('삭제 처리 중 오류가 발생했습니다: ' + error.message);
                });
            }
        });
    }
    
    if (checkallItemCheckbox) { /* ... (이전과 동일) ... */ }
    if (itemTableBody) { /* ... (이전과 동일) ... */ }
    // 엑셀 버튼 리스너 (필요시 구현)
});

function updateCheckAllItemState() { /* ... (이전과 동일) ... */ }

// --- 모달 관련 함수들 ---
async function openModal(item = null) { // item은 StockDto
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('modalForm');
    if (!modal || !title || !form) return;
    form.reset();
	
	console.log("모달 오픈 시 전달된 item 객체:", JSON.stringify(item, null, 2)); // item 전체 내용 확인
	    if (item) {
			console.log("전달된 품목 ID (item.itemIdx):", item.itemIdx);
			        console.log("전달된 창고 ID (item.whIdx):", item.whIdx); // 중요!
			        console.log("전달된 단위 ID (item.unitIdx):", item.unitIdx);
			        console.log("전달된 매입처 ID (item.custIdxForItem):", item.custIdxForItem);
			    }
	    

    const itemCodeInput = form.querySelector('input[name="item_CD"]'); // HTML 폼 내 name 속성 일치 필요
    const saveButton = form.querySelector('button[name="save"]');
    const editButton = form.querySelector('button[name="edit"]');
    
	// 단위 드롭다운 채우기 및 선택
	 // *** 백엔드 StockDto에 item.unitIdx (단위 ID)가 포함되어야 합니다. ***
	 await loadAndSetUnits(item ? item.unitIdx : null);

	 // 매입처 드롭다운 채우기 및 선택
	 // *** 백엔드 StockDto에 item.custIdx (매입처 ID)가 포함되어야 합니다. ***
	 await loadAndSetCustomers(item ? item.custIdxForItem : null);

	 await loadAndSetWarehouses(item ? item.whIdx : null); // 창고 목록 로드 및 선택 호출 추가

    if (item) { // 수정 모드
        title.textContent = '자재/품목 정보 수정';
        if (saveButton) saveButton.style.display = 'none';
        if (editButton) editButton.style.display = 'block';

        if (itemCodeInput) {
            itemCodeInput.value = item.itemCd || "";
            itemCodeInput.readOnly = true;
        }
        setInputValue(form, 'item_IDX', item.itemIdx);       // name="item_IDX" (hidden)
		setInputValue(form, 'inv_IDX', item.invIdx);
        setInputValue(form, 'item_NM', item.itemNm);         // name="item_NM"
        setInputValue(form, 'item_COST', formatCurrencyKR(item.itemCost)); // name="item_COST"
        setInputValue(form, 'optimal_INV', item.inv);        // name="optimal_INV" (DTO의 inv 필드)
        setInputValue(form, 'item_SPEC', item.itemSpec);     // name="item_SPEC"
        setInputValue(form, 'remark', item.reMark);          // name="remark" (DTO의 reMark 필드)
		setInputValue(form, 'wh_NM', item.whNm); // 예시: 창고명 표시
		setInputValue(form, 'wh_idx', item.whIdx);       // 예시: hidden input에 창고 ID 설정
		setInputValue(form, 'qty', item.qty);
        // 모달 HTML의 name 속성에 맞춰서 값 설정
        
        // setInputValue(form, 'unit_select_name', item.unitIdx); // 단위 select (name="unit_select_name")
        // setInputValue(form, 'cust_select_name', item.custIdx); // 거래처 select (name="cust_select_name")
        // setInputValue(form, 'user_name_input', item.userNm); // 담당자명 (name="user_name_input")
        // ... 기타 필드들 ...

		setInputValue(form, 'user_NM', item.userNm);         // 담당자명 - name="user_NM" 필요
        setInputValue(form, 'user_TEL', item.userTel);       // 담당자 전화번호 - name="user_TEL" 필요
        setInputValue(form, 'user_MAIL', item.userMail);     // 담당자 이메일 - name="user_MAIL" 필요
				
        if (editButton) {
            const newEditButton = editButton.cloneNode(true);
            editButton.parentNode.replaceChild(newEditButton, editButton);
            newEditButton.addEventListener('click', (e) => {
				 e.preventDefault(); 
				 console.log("수정 버튼 클릭 시 전달되는 item.itemIdx:", item.itemIdx);
				 if (item.itemIdx === null || item.itemIdx === undefined) {
				     alert("오류: 수정할 품목의 ID가 없습니다. (item.itemIdx is null or undefined)");
				     return; // ID가 없으면 updateItem 호출 중단
				 }
				 updateItem(item.itemIdx);
			  });
        }
    } else { // 신규 등록 모드
        title.textContent = '신규 자재/품목 등록';
        if (saveButton) saveButton.style.display = 'block';
        if (editButton) editButton.style.display = 'none';
        if (itemCodeInput) {
             itemCodeInput.readOnly = true; // 자동생성 후 잠금
             createItemCD(itemCodeInput); 
        }
        setInputValue(form, 'item_COST', formatCurrencyKR(0));
        // 기타 필드 초기화
        // ...

        if (saveButton) {
            const newSaveButton = saveButton.cloneNode(true);
            saveButton.parentNode.replaceChild(newSaveButton, saveButton);
            newSaveButton.addEventListener('click', submitModal);
        }
    }
    modal.style.display = 'flex';
}

function closeModal() { 
    const modal = document.getElementById('modal'); 
    if (modal) modal.style.display = 'none';
}
function outsideClick(e) { if (e.target.id === 'modal') closeModal(); }

async function submitModal(event) { // 신규 등록
    event.preventDefault();
    const form = document.getElementById('modalForm');
    const formData = new FormData(form);
    const formProps = Object.fromEntries(formData.entries());
    const rawItemCost = unformatCurrencyKR(formProps.item_COST);

    // HTML의 itemFlagSelect (메인 화면) 값을 사용하거나, 모달 내에 itemFlag를 선택하는 요소가 있어야 함
    const currentItemFlagValue = itemFlagSelect ? itemFlagSelect.value : '01'; // 예시

    const payload = {
        itemCd: formProps.item_CD,
        itemNm: formProps.item_NM,
        itemSpec: formProps.item_SPEC,
        remark: formProps.remark,
        custIdx: formProps.cust_NM ? parseInt(formProps.cust_NM) : null,
        unitIdx: formProps.item_UNIT ? parseInt(formProps.item_UNIT) : null, // DTO에 itemUnitId가 있다면
        optimalInv: formProps.optimal_INV ? parseInt(formProps.optimal_INV) : null,
        itemCost: rawItemCost,
        itemFlag: currentItemFlagValue, // 선택된 itemFlag 값 사용
        qty: formProps.qty ? parseInt(formProps.qty) : 0, // 모달에 수량(현재고) 입력 필드(name="qty") 필요
        whIdx: formProps.wh_idx ? parseInt(formProps.wh_idx) : null // 모달에 창고 선택 필드(name="wh_idx") 필요
    };
    console.log("신규 품목 데이터:", payload);

	if (!payload.itemNm?.trim()) { alert("자재/품목명은 필수입니다."); return; }
	if (payload.unitIdx === null) { alert("단위를 선택해주세요."); return; }   
    // ... 추가 유효성 검사 ...

    try {
        const response = await fetch(`/api/stocks`, { // JAVASCRIPT 수정: API 경로를 /api/stock/items 등으로 변경 필요
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            alert('새 품목이 등록되었습니다.');
            closeModal();
            fetchItems(1); 
        } else {
            const errorData = await response.json().catch(() => ({ message: '등록 중 오류 발생' }));
            alert(`품목 등록 실패: ${errorData.message || response.statusText}`);
        }
    } catch (error) {
        console.error('품목 등록 API 호출 오류:', error);
        alert('품목 등록 중 오류가 발생했습니다.');
    }
}

async function updateItem(itemIdx) { // 수정
    const form = document.getElementById('modalForm');
    const formData = new FormData(form);
    const formProps = Object.fromEntries(formData.entries());
    const rawItemCost = unformatCurrencyKR(formProps.item_COST);

    const payload = {
        itemNm: formProps.item_NM,
        itemSpec: formProps.item_SPEC,
        remark: formProps.remark,
        custIdx: formProps.cust_NM ? parseInt(formProps.cust_NM) : null,
        unitIdx: formProps.item_UNIT ? parseInt(formProps.item_UNIT) : null,
        optimalInv: formProps.optimal_INV ? parseInt(formProps.optimal_INV) : null,
        itemCost: rawItemCost,
        itemFlag: formProps.item_FLAG, // 모달 폼에 name="item_FLAG" (hidden 또는 select) 필요
        qty: formProps.qty ? parseInt(formProps.qty) : undefined,
        whIdx: formProps.wh_idx ? parseInt(formProps.wh_idx) : null
    };
    console.log(`수정 품목 데이터 (ID: ${itemIdx}):`, payload);

    try {
        const response = await fetch(`/api/stocks/${itemIdx}`, { // JAVASCRIPT 수정: API 경로를 /api/stock/items/{itemIdx} 등으로 변경 필요
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            alert('품목 정보가 수정되었습니다.');
            closeModal();
            fetchItems(currentPage);
        } else {
            const errorData = await response.json().catch(() => ({ message: '수정 중 오류 발생' }));
            alert(`품목 수정 실패: ${errorData.message || response.statusText}`);
        }
    } catch (error) {
        console.error('품목 수정 API 호출 오류:', error);
        alert('품목 수정 중 오류가 발생했습니다.');
    }
}

// --- 드롭다운 로드 함수들 (실제 API 호출 로직으로 채워야 함) ---
async function createItemCD(itemCodeInputElement) {
    if (!itemCodeInputElement) return;
    // 예시: const response = await fetch(`/api/items/generate-item-cd`); const data = await response.text();
    const tempCd = "ITEM" + Math.floor(Math.random() * 9000 + 1000); 
    itemCodeInputElement.value = tempCd;
    itemCodeInputElement.readOnly = true; // 자동 생성 후 수정 불가 처리
    console.log(`임시 품목 코드 생성: ${tempCd}. 실제 API 연동 필요.`);
}
async function loadAndSetUnits(selectedUnitId = null) {
    const unitSelectElement = document.querySelector('#modalForm select[name="item_UNIT"]');
    if (!unitSelectElement) return;

    unitSelectElement.innerHTML = '<option value="">단위를 선택해주세요</option>'; // 초기화

    try {
        // 실제 단위 목록 API 엔드포인트로 수정해주세요. (예: /api/units)
        const response = await fetch('/api/stocks/unit'); // 가정된 API 경로
        if (!response.ok) {
            throw new Error(`단위 정보 로드 실패: ${response.statusText}`);
        }
        const units = await response.json(); // 예: [{ unitIdx: 1, unitNm: "EA" }, ...]

        units.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit.unitIdx; // <option value="단위ID">
            option.textContent = unit.unitNm; // <option>단위명</option>
            if (selectedUnitId && unit.unitIdx === selectedUnitId) {
                option.selected = true;
            }
            unitSelectElement.appendChild(option);
        });
    } catch (error) {
        console.error("단위 목록 로드 중 오류:", error);
        // 사용자에게 오류 알림 (필요시)
    }
}

async function loadAndSetCustomers(selectedCustId = null) {
    const custSelectElement = document.querySelector('#modalForm select[name="cust_NM"]');
    if (!custSelectElement) return;

    custSelectElement.innerHTML = '<option value="">매입처를 선택해주세요</option>'; // 초기화

    try {
        // 실제 매입처 목록 API 엔드포인트로 수정해주세요. (예: /api/customers?bizFlag=01)
        const bizFlagForPurchase = '01';
        const response = await fetch(`/api/stocks/cust?bizFlag=${bizFlagForPurchase}`); // 가정된 API 경로
        if (!response.ok) {
            throw new Error(`매입처 정보 로드 실패: ${response.statusText}`);
        }
        const customers = await response.json(); // 예: [{ custIdx: 1, custNm: "매입처A" }, ...]

        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.custIdx; // <option value="거래처ID">
            option.textContent = customer.custNm; // <option>거래처명</option>
            if (selectedCustId && customer.custIdx === selectedCustId) {
                option.selected = true;
            }
            custSelectElement.appendChild(option);
        });
    } catch (error) {
        console.error("매입처 목록 로드 중 오류:", error);
        // 사용자에게 오류 알림 (필요시)
    }
}

async function loadAndSetWarehouses(selectedWhId = null) {
    const whSelectElement = document.querySelector('#modalForm select[name="wh_idx"]');
    if (!whSelectElement) {
        console.error("Warehouse select element with name 'wh_idx' not found!");
        return;
    }

    whSelectElement.innerHTML = '<option value="">-- 창고를 선택해주세요 --</option>'; // 초기화

    try {
        // 백엔드에 창고 목록을 가져오는 API 엔드포인트가 필요합니다. (예: /api/warehouses)
        // 이 API는 GET 요청 시 [{ whIdx: 1, whNm: "창고A" }, ...] 형태의 JSON을 반환해야 합니다.
        const response = await fetch('/api/stocks/wh'); // (예시 API 경로, 실제 구현된 경로로 수정)
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`창고 정보 로드 실패: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const warehouses = await response.json();

        warehouses.forEach(wh => {
            const option = document.createElement('option');
            option.value = wh.whIdx; // value에는 창고 ID
            option.textContent = wh.whNm; // 보이는 텍스트는 창고명
            if (selectedWhId !== null && Number(wh.whIdx) === Number(selectedWhId)) {
                option.selected = true;
            }
            whSelectElement.appendChild(option);
        });
    } catch (error) {
        console.error("창고 목록 로드 중 오류:", error);
        // 사용자에게 오류 알림 (필요시)
        whSelectElement.innerHTML += '<option value="" disabled>창고 로딩 실패</option>';
    }
}

// 정렬 함수
let currentTh = null; 
let currentOrder = 'desc'; 
function order(thValue) {
    const tbody = document.getElementById('itembody');
	if (!tbody || !thValue) return;
    const headerText = thValue.textContent.replace(/[↓↑]/g, '').trim();
    let sortProperty = thValue.dataset.sortProperty; 

    if (!sortProperty) { // dataset이 없다면 헤더 텍스트 기반으로 추론
        switch (headerText) {
            case '자재/품목코드': sortProperty = 'itemCd'; break;
            case '자재/품목명': sortProperty = 'itemNm'; break;
            case '수량': sortProperty = 'Qty'; break;
            case '적정재고': sortProperty = 'Inv'; break; // DTO 필드명 inv
            case '창고명': sortProperty = 'whNm'; break;
            case '단위': sortProperty = 'unitNm'; break;
            default: console.warn(`정렬 속성 알 수 없음: ${headerText}`); return;
        }
        thValue.dataset.sortProperty = sortProperty;
    }

    if (currentSortTh === thValue) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        if(currentSortTh && currentSortTh.querySelector('a')) currentSortTh.querySelector('a').textContent = '↓';
        currentSortOrder = 'asc';
        currentSortTh = thValue;
    }
    
    const arrow = currentSortTh.querySelector('a');
    if(arrow) arrow.textContent = currentSortOrder === 'asc' ? '↑' : '↓';
    else { // a 태그가 없다면 동적으로 생성 (최초 클릭 시)
        const newArrow = document.createElement('a');
        newArrow.textContent = currentSortOrder === 'asc' ? '↑' : '↓';
        currentSortTh.appendChild(newArrow);
    }
    
    fetchItems(1, itemFlagSelect?.value, searchItemText?.value.trim(), sortProperty, currentSortOrder);
}