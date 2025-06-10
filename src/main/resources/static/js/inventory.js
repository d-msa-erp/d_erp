// inventory.js - 품목 관리 JavaScript (SeonikItemController 기준 및 모달 옵션 API 연동 가정)

// 전역 변수
let allItemsCache = [];
let currentPage = 1;
let itemsPerPage = 10; // 한 페이지에 표시할 항목 수
let currentSortColumn = 'itemNm';
let currentSortDirection = 'asc';









//===================엑셀과 프린트 ==================================
// ✳️ --- 엑셀 다운로드 관련 함수 ---
async function handleExcelDownload() {
    //console.log("[Excel] handleExcelDownload() 호출됨 - 품목 정보 엑셀 다운로드 시도.");
    const selectedIds = getSelectedItemIds(); // 기존에 있던 선택된 ID 가져오는 함수

    if (selectedIds.length === 0) {
        alert("엑셀로 다운로드할 품목을 먼저 선택해주세요.");
        return;
    }
    //console.log("[Excel] 선택된 품목 ID:", selectedIds);

    try {
        // ✳️ 서버에 엑셀 다운로드 요청 API (새로 만들어야 함)
        // 이 API는 List<Long> itemIdxs를 받아서 해당 품목 정보를 Excel 파일로 반환해야 합니다.
        const response = await fetch('/api/items2/excel-download', { // ✳️ API 경로 예시
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(selectedIds.map(id => parseInt(id))), // ID를 Long 타입으로 변환 (서버 DTO 타입에 맞게)
        });

        if (!response.ok) {
            let errorData = { message: `엑셀 파일 생성에 실패했습니다. 상태: ${response.status}` };
            try {
                const errorResponse = await response.text();
                try { errorData = JSON.parse(errorResponse); } catch (e) { errorData.message = errorResponse; }
            } catch (e) { /* 응답 본문 처리 중 오류 무시 */ }
            throw new Error(errorData.message || `서버 오류: ${response.status}`);
        }

        const disposition = response.headers.get('Content-Disposition');
        let filename = 'inventory_items.xlsx'; // 기본 파일명
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                filename = decodeURIComponent(matches[1].replace(/['"]/g, '').replace(/UTF-8''/i, ''));
            }
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        //console.log("[Excel] 파일 다운로드 시작:", filename);
        // alert('엑셀 파일 다운로드가 시작됩니다.'); // 사용자 알림

    } catch (error) {
        console.error("[Excel] 엑셀 다운로드 중 오류 발생:", error);
        alert(`엑셀 다운로드 오류: ${error.message}`);
    }
}

// ✳️ --- 인쇄 관련 함수 ---
async function handlePrint() {
    //console.log("[Print] handlePrint() 호출됨 - 품목 정보 인쇄 시도.");
    const selectedIds = getSelectedItemIds();

    if (selectedIds.length === 0) {
        alert("인쇄할 품목을 먼저 선택해주세요.");
        return;
    }
    //console.log("[Print] 선택된 품목 ID:", selectedIds);

    // 선택된 ID를 숫자로 변환 (allItemsCache의 itemIdx와 비교하기 위함)
    const selectedNumericIds = selectedIds.map(id => parseInt(id, 10));

    // allItemsCache에서 선택된 품목 정보 필터링
    const itemsToPrint = allItemsCache.filter(item => selectedNumericIds.includes(item.itemIdx));

    if (itemsToPrint.length === 0) {
        alert('선택된 품목 정보를 찾을 수 없습니다. 목록을 새로고침 해주세요.');
        return;
    }

    let printContents = `
        <html>
        <head>
            <title>품목 정보 인쇄</title>
            <style>
                body { font-family: '맑은 고딕', Malgun Gothic, Dotum, sans-serif; margin: 20px; font-size: 10pt; color: #333; }
                .item-print-container { page-break-inside: avoid; border: 1px solid #eee; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
                .item-print-container h2 { font-size: 14pt; margin-top: 0; margin-bottom: 10px; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                .item-info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 5px 15px; }
                .item-info-grid p { margin: 4px 0; font-size: 9.5pt; }
                .item-info-grid strong { display: inline-block; width: 80px; color: #555; font-weight: bold; }
                @media print {
                    body { margin: 0.5cm; } /* 인쇄 여백 조정 */
                    .item-print-container { border: none; box-shadow: none; margin-bottom: 10mm; }
                    h1.print-main-title { display: block !important; font-size: 18pt; text-align: center; margin-bottom: 15mm; }
                }
                h1.print-main-title { display: none; } /* 화면에서는 숨김 */
            </style>
        </head>
        <body>
            <h1 class="print-main-title">선택된 품목 정보</h1>
    `;

    const flagMap = { "01": "자재", "02": "품목" }; // 품목 플래그 매핑

    itemsToPrint.forEach(item => {
        // currentStockQty와 optimalInv는 BigDecimal일 수 있으므로 숫자 포맷팅
        const stockQtyDisplay = (item.currentStockQty !== null && item.currentStockQty !== undefined) ? Number(item.currentStockQty).toLocaleString() : '-';
        const optimalInvDisplay = (item.optimalInv !== null && item.optimalInv !== undefined) ? Number(item.optimalInv).toLocaleString() : '-';
        const itemCostDisplay = (item.itemCost !== null && item.itemCost !== undefined) ? item.itemCost.toLocaleString() : '-';
        const cycleTimeDisplay = (item.cycleTime !== null && item.cycleTime !== undefined) ? Number(item.cycleTime).toLocaleString() : '-';


        printContents += `
            <div class="item-print-container">
                <h2>${item.itemNm || 'N/A'} (코드: ${item.itemCd || 'N/A'})</h2>
                <div class="item-info-grid">
                    <p><strong>분류:</strong> ${flagMap[item.itemFlag] || item.itemFlag || 'N/A'}</p>
                    <p><strong>대분류:</strong> ${item.itemCat1Nm || 'N/A'}</p>
                    <p><strong>소분류:</strong> ${item.itemCat2Nm || 'N/A'}</p>
                    <p><strong>거래처:</strong> ${item.custNm || 'N/A'}</p>
                    <p><strong>규격:</strong> ${item.itemSpec || 'N/A'}</p>
                    <p><strong>단위:</strong> ${item.unitNm || 'N/A'}</p>
                    <p><strong>단가:</strong> ${itemCostDisplay} 원</p>
                    <p><strong>현재고량:</strong> ${stockQtyDisplay}</p>
                    <p><strong>적정재고:</strong> ${optimalInvDisplay}</p>
                    <p><strong>Cycle Time:</strong> ${cycleTimeDisplay}</p>
                </div>
                ${item.remark ? `<p style="margin-top:10px;"><strong>비고:</strong> ${item.remark}</p>` : ''}
            </div>
        `;
    });

    printContents += `</body></html>`;

    const printWindow = window.open('', '_blank', 'height=700,width=900,scrollbars=yes,menubar=yes,toolbar=yes');
    if (printWindow) {
        printWindow.document.write(printContents);
        printWindow.document.close(); // 중요: Firefox에서 이미지 로드 등을 위해 필요
        printWindow.focus(); // 인쇄 창 활성화
        // 인쇄 미리보기 로드를 위해 약간의 지연 후 print() 호출
        setTimeout(() => {
            try {
                printWindow.print();
            } catch (e) {
                console.error("[Print] 인쇄 다이얼로그 호출 중 오류:", e);
                // 일부 브라우저에서는 사용자가 직접 인쇄를 시작해야 할 수 있음
                printWindow.alert("인쇄 중 오류가 발생했습니다. 브라우저의 인쇄 기능을 사용해주세요. (Ctrl+P 또는 Cmd+P)");
            }
            // 자동으로 닫을 필요가 없다면 아래 라인 주석 처리 또는 제거
            // setTimeout(() => { printWindow.close(); }, 1000); // 인쇄 후 잠시 뒤 창 닫기 (선택 사항)
        }, 700); // 700ms 정도면 대부분의 경우 충분
    } else {
        alert("팝업 차단 기능이 활성화되어 있으면 인쇄 창을 열 수 없습니다. 브라우저의 팝업 차단 설정을 확인해주세요.");
    }
}


//===================엑셀과 프린트 ==================================
// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    //console.log('품목 관리 JavaScript 로드됨 (모달 옵션 API 연동 시도)');
    initializeEventListeners();
    loadAndDisplayInitialData();
});

// 이벤트 리스너 초기화
function initializeEventListeners() {
    document.getElementById('searchButton')?.addEventListener('click', handleClientSearchAndFilter);
    document.getElementById('searchItemText')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleClientSearchAndFilter();
    });

    document.getElementById('btn-first-page')?.addEventListener('click', () => goToPage(1));
    document.getElementById('btn-prev-page')?.addEventListener('click', goToPrevPage);
    document.getElementById('btn-next-page')?.addEventListener('click', goToNextPage);
    document.getElementById('btn-last-page')?.addEventListener('click', () => goToPage(getTotalPages(allItemsCache, document.getElementById('searchCatSelect')?.value, document.getElementById('searchItemText')?.value)));

    const pageInput = document.getElementById('currentPageInput');
    if (pageInput) {
        pageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const page = parseInt(this.value, 10);
                const totalPages = getTotalPages(allItemsCache, document.getElementById('searchCatSelect')?.value, document.getElementById('searchItemText')?.value);
                if (page >= 1 && page <= totalPages) {
                    goToPage(page);
                } else {
                    alert('올바른 페이지 번호를 입력해주세요.');
                    this.value = currentPage;
                }
            }
        });
    }

    document.getElementById('checkallItem')?.addEventListener('change', toggleAllCheckboxes);
    document.getElementById('deleteBtn')?.addEventListener('click', handleDeleteSelected);

    document.querySelector('#itemModal .btn-save')?.addEventListener('click', handleSaveItem);
    document.querySelector('#itemModal .btn-edit')?.addEventListener('click', handleUpdateItem);
    document.querySelector('#itemModal .btn-cancel')?.addEventListener('click', () => closeModal('itemModal'));

    document.getElementById('modalItemCat1')?.addEventListener('change', function() {
        const parentCatIdx = this.value;
        loadModalSubCategories(parentCatIdx); // 대분류 변경 시 소분류 로드
    });

    // ✳️ 자재/품목 분류 변경 시 거래처 목록 필터링
    document.getElementById('modalItemFlagSelect')?.addEventListener('change', function() {
        const itemFlag = this.value;
        let bizFlagForCustomer = '';
        if (itemFlag === '01') { // 자재 (Material) -> 발주처 (BIZ_FLAG '01')
            bizFlagForCustomer = '01';
        } else if (itemFlag === '02') { // 품목 (Product) -> 주문처 (BIZ_FLAG '02')
            bizFlagForCustomer = '02';
        }
        // 현재 선택된 거래처 ID를 유지하려고 시도할 수 있으나, 목록이 바뀌므로 일단 새로 로드.
        loadModalCustomersWithOptions(bizFlagForCustomer, null);
    });


    formatNumberInput(document.getElementById('modalItemCost'));
    formatNumberInput(document.getElementById('modalOptimalInv'));
    document.getElementById('modalItemFlagSelect')?.addEventListener('change', autoGenerateItemCd);
    document.getElementById('excelBtn')?.addEventListener('click', handleExcelDownload);
    document.getElementById('printBtn')?.addEventListener('click', handlePrint);
}

// --- 데이터 로딩 및 표시 ---
function loadAndDisplayInitialData() {
    fetch('/api/items2') // SeonikItemController의 전체 품목 조회 API
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
            return response.json();
        })
        .then(data => {
            allItemsCache = Array.isArray(data) ? data : [];
            allItemsCache.forEach(item => {
                 // DTO에 currentStockQty 필드가 있고, Repository에서 채워준다고 가정
                if (item.currentStockQty === undefined) item.currentStockQty = null;
            });
            //console.log('전체 데이터 로드 완료:', allItemsCache.length + '개');
            currentPage = 1;
            applyClientSideFiltersAndPagination();
        })
        .catch(error => {
            console.error('초기 품목 목록 로드 실패:', error);
            const tbody = document.getElementById('itembody');
            if (tbody) tbody.innerHTML = `<tr id="NoitemRow"><td class="nodata" colspan="9">데이터 로드에 실패했습니다. (${error.message})</td></tr>`;
            updatePaginationUI(0, 1, 1);
        });
}

function applyClientSideFiltersAndPagination() {
    let itemsToProcess = [...allItemsCache];
    const searchCategory = document.getElementById('searchCatSelect')?.value;
    const searchTerm = document.getElementById('searchItemText')?.value.toLowerCase().trim();

    if (searchTerm && searchCategory) {
        itemsToProcess = itemsToProcess.filter(item => {
            const valueToSearch = item[searchCategory];
            return valueToSearch !== null && valueToSearch !== undefined &&
                   String(valueToSearch).toLowerCase().includes(searchTerm);
        });
    }

    if (currentSortColumn) {
        itemsToProcess.sort((a, b) => {
            let valA = a[currentSortColumn];
            let valB = b[currentSortColumn];
            if (valA == null && valB == null) return 0;
            if (valA == null) return 1;
            if (valB == null) return -1;
            // currentStockQty는 DTO에서 BigDecimal일 수 있으므로 숫자로 비교
            if (currentSortColumn === 'currentStockQty' || typeof valA === 'number' && typeof valB === 'number') {
                 // BigDecimal을 숫자로 변환하여 비교
                const numA = typeof valA === 'object' && valA !== null && typeof valA.doubleValue === 'function' ? valA.doubleValue() : Number(valA);
                const numB = typeof valB === 'object' && valB !== null && typeof valB.doubleValue === 'function' ? valB.doubleValue() : Number(valB);
                return currentSortDirection === 'asc' ? numA - numB : numB - numA;
            } else {
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();
                if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
                return 0;
            }
        });
    }

    const totalItems = itemsToProcess.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = itemsToProcess.slice(startIndex, startIndex + itemsPerPage);

    displayItemList(paginatedItems);
    updatePaginationUI(totalItems, currentPage, totalPages);
}

function displayItemList(itemsToDisplay) {
    const tbody = document.getElementById('itembody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!itemsToDisplay || itemsToDisplay.length === 0) {
        tbody.innerHTML = `<tr id="NoitemRow"><td class="nodata" colspan="9">조회된 품목이 없습니다.</td></tr>`;
    } else {
        itemsToDisplay.forEach(item => {
            const row = createItemRow(item);
            tbody.appendChild(row);
        });
    }
    document.getElementById('checkallItem').checked = false;
}

function createItemRow(item) {
    const row = document.createElement('tr');
    row.setAttribute('data-item-idx', item.itemIdx);

    const itemNm = item.itemNm || 'N/A';
    const itemCd = item.itemCd || 'N/A';
    const cat1Nm = item.itemCat1Nm || 'N/A';
    const cat2Nm = item.itemCat2Nm || 'N/A';
    const custNm = item.custNm || 'N/A';
    const unitNm = item.unitNm || 'N/A';
    const itemCost = item.itemCost !== null && item.itemCost !== undefined ? item.itemCost.toLocaleString() : '0';
    // currentStockQty는 DTO에서 BigDecimal 타입일 수 있음
    let currentStockQtyDisplay = '-';
    if (item.currentStockQty !== null && item.currentStockQty !== undefined) {
        // BigDecimal 객체라면 toLocaleString() 사용이 적절하지 않을 수 있음. Number로 변환 또는 직접 포맷팅.
        currentStockQtyDisplay = Number(item.currentStockQty).toLocaleString();
    }


    row.innerHTML = `
        <td><input type="checkbox" class="item-checkbox" value="${item.itemIdx}"></td>
        <td class="clickable-cell">${itemNm}</td>
        <td class="clickable-cell">${itemCd}</td>
        <td class="clickable-cell">${cat1Nm}</td>
        <td class="clickable-cell">${cat2Nm}</td>
        <td class="clickable-cell">${custNm}</td>
        <td class="clickable-cell">${unitNm}</td>
        <td class="text-right clickable-cell">${currentStockQtyDisplay}</td>
        <td class="text-right clickable-cell">${itemCost}</td>
    `;

    row.querySelectorAll('.clickable-cell').forEach(cell => {
        cell.addEventListener('click', () => showItemDetailModal(item.itemIdx));
    });
    return row;
}

// --- 검색, 정렬, 페이지네이션 UI 및 로직 (이전과 유사) ---
function handleClientSearchAndFilter() { currentPage = 1; applyClientSideFiltersAndPagination(); }
function order(headerElement) {
    const newSortColumn = headerElement.getAttribute('data-sort-by');
    if (!newSortColumn) return;
    if (currentSortColumn === newSortColumn) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = newSortColumn;
        currentSortDirection = 'asc';
    }
    updateSortArrowsUI(headerElement);
    applyClientSideFiltersAndPagination();
}
function updateSortArrowsUI(activeHeader) {
    document.querySelectorAll('#itemTable th .sort-arrow').forEach(arrow => {
        arrow.innerHTML = '↓'; arrow.style.opacity = '0.3';
    });
    if (activeHeader) {
        const arrowElement = activeHeader.querySelector('.sort-arrow');
        if (arrowElement) {
            arrowElement.innerHTML = currentSortDirection === 'asc' ? '↑' : '↓';
            arrowElement.style.opacity = '1';
        }
    }
}
function updatePaginationUI(totalItems, currentPageNum, totalPagesNum) {
    const pageInfoText = document.getElementById('paginationInfoText');
    if (pageInfoText) pageInfoText.textContent = `총 ${totalItems.toLocaleString()}건 ${currentPageNum}/${totalPagesNum}페이지`;
    const pageInput = document.getElementById('currentPageInput');
    if (pageInput) { pageInput.value = currentPageNum; pageInput.max = totalPagesNum; }
    document.getElementById('btn-first-page').disabled = currentPageNum <= 1;
    document.getElementById('btn-prev-page').disabled = currentPageNum <= 1;
    document.getElementById('btn-next-page').disabled = currentPageNum >= totalPagesNum;
    document.getElementById('btn-last-page').disabled = currentPageNum >= totalPagesNum;
}
function goToPage(pageNumber) {
    const totalPages = getTotalPages(allItemsCache, document.getElementById('searchCatSelect')?.value, document.getElementById('searchItemText')?.value);
    if (pageNumber >= 1 && pageNumber <= totalPages) { currentPage = pageNumber; applyClientSideFiltersAndPagination(); }
}
function goToPrevPage() { if (currentPage > 1) { currentPage--; applyClientSideFiltersAndPagination(); } }
function goToNextPage() {
    const totalPages = getTotalPages(allItemsCache, document.getElementById('searchCatSelect')?.value, document.getElementById('searchItemText')?.value);
    if (currentPage < totalPages) { currentPage++; applyClientSideFiltersAndPagination(); }
}
function getTotalPages(sourceArray, searchCategory, searchTerm) {
    let count = sourceArray.length;
    if (searchTerm && searchCategory) {
        const term = searchTerm.toLowerCase().trim();
        count = sourceArray.filter(item => {
             const valueToSearch = item[searchCategory];
             return valueToSearch !== null && valueToSearch !== undefined && String(valueToSearch).toLowerCase().includes(term);
        }).length;
    }
    return Math.max(1, Math.ceil(count / itemsPerPage));
}

// --- 선택 및 액션 ---
function toggleAllCheckboxes() {
    const checkAll = document.getElementById('checkallItem');
    document.querySelectorAll('.item-checkbox').forEach(checkbox => checkbox.checked = checkAll.checked);
}
function getSelectedItemIds() {
    return Array.from(document.querySelectorAll('.item-checkbox:checked')).map(cb => cb.value);
}
async function handleDeleteSelected() {
    const selectedIds = getSelectedItemIds();
    if (selectedIds.length === 0) { alert('삭제할 품목을 선택해주세요.'); return; }
    if (!confirm(`선택한 ${selectedIds.length}개의 품목을 정말 삭제하시겠습니까?`)) return;
    let successCount = 0, errorMessages = [];
    for (const itemIdx of selectedIds) {
        try {
            const response = await fetch(`/api/items2/${itemIdx}`, { method: 'DELETE' }); //
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ID ${itemIdx}: ${response.status} ${errorText || '삭제 실패'}`);
            }
            successCount++;
        } catch (error) { errorMessages.push(error.message); }
    }
    let alertMessage = "";
    if (successCount > 0) alertMessage += `${successCount}개 품목 삭제 성공.`;
    if (errorMessages.length > 0) alertMessage += `\n일부 삭제 실패:\n- ${errorMessages.join('\n- ')}`;
    alert(alertMessage.trim() || "삭제 처리 중 오류 발생.");
    if (successCount > 0) loadAndDisplayInitialData();
}


// --- 모달 관련 함수 ---
// (HTML에서 onclick="openModal()"로 호출되므로 전역에 있어야 함)
async function openModal() {
    document.getElementById('modalItemForm').reset();
    document.getElementById('modalItemIdx').value = '';
    document.getElementById('modalTitle').textContent = '신규 등록';
    document.querySelector('#itemModal .btn-save').style.display = 'inline-flex';
    document.querySelector('#itemModal .btn-edit').style.display = 'none';
    document.getElementById('modalItemCd').readOnly = true;

    // itemFlag 기본값 또는 이전 값에 따라 bizFlag 결정
    const itemFlag = document.getElementById('modalItemFlagSelect').value;
    let bizFlagForCustomer = '';
    if (itemFlag === '01') bizFlagForCustomer = '01'; // 자재 -> 발주처(BIZ_FLAG '01')
    else if (itemFlag === '02') bizFlagForCustomer = '02'; // 품목 -> 주문처(BIZ_FLAG '02')

    await loadAndPopulateModalOptions(null, bizFlagForCustomer); // itemForUpdate = null (신규), bizFlag 전달
    document.getElementById('itemModal').style.display = 'block';
}

async function showItemDetailModal(itemIdx) {
    const item = allItemsCache.find(i => i.itemIdx === itemIdx);
    if (!item) { alert("품목 정보를 찾을 수 없습니다."); return; }

    document.getElementById('modalItemForm').reset();
    populateModalWithDataFields(item); // 기본 필드 채우기

    let bizFlagForCustomer = '';
    if (item.itemFlag === '01') bizFlagForCustomer = '01'; // 자재 -> 발주처(BIZ_FLAG '01')
    else if (item.itemFlag === '02') bizFlagForCustomer = '02'; // 품목 -> 주문처(BIZ_FLAG '02')

    await loadAndPopulateModalOptions(item, bizFlagForCustomer); // 옵션 로드 및 기존 값 선택, bizFlag 전달

    document.getElementById('modalTitle').textContent = '품목 수정';
    document.querySelector('#itemModal .btn-save').style.display = 'none';
    document.querySelector('#itemModal .btn-edit').style.display = 'inline-flex';
    document.getElementById('modalItemCd').readOnly = false;
    document.getElementById('itemModal').style.display = 'flex';
}

function populateModalWithDataFields(item) { // Select 제외한 기본 필드 채우기
    document.getElementById('modalItemIdx').value = item.itemIdx;
    document.getElementById('modalItemFlagSelect').value = item.itemFlag;
    document.getElementById('modalItemCd').value = item.itemCd;
    document.getElementById('modalItemNm').value = item.itemNm;
    document.getElementById('modalItemSpec').value = item.itemSpec || '';
    document.getElementById('modalItemCost').value = item.itemCost !== null && item.itemCost !== undefined ? item.itemCost.toLocaleString() : '';
    document.getElementById('modalOptimalInv').value = item.optimalInv !== null && item.optimalInv !== undefined ? Number(item.optimalInv).toLocaleString() : ''; // BigDecimal 처리
    document.getElementById('modalRemark').value = item.remark || '';
}

// ✳️ 거래처, 대분류, 단위 옵션 로드 및 선택 (bizFlagForCustomers 파라미터 추가)
async function loadAndPopulateModalOptions(itemToSelectValuesFrom, bizFlagForCustomers) {
    const cat1Select = document.getElementById('modalItemCat1');
    const unitSelect = document.getElementById('modalItemUnit');

    cat1Select.innerHTML = '<option value="">-- 대분류 선택 --</option>';
    unitSelect.innerHTML = '<option value="">-- 단위 선택 --</option>';
    document.getElementById('modalItemCat2').innerHTML = '<option value="">-- 소분류 선택 --</option>';

    // 거래처 로드 (수정됨)
    await loadModalCustomersWithOptions(bizFlagForCustomers, itemToSelectValuesFrom ? itemToSelectValuesFrom.custIdx : null);

    try {
        const [parentCategories, units] = await Promise.all([
            fetch('/api/data/item-categories/parents').then(res => res.ok ? res.json() : Promise.reject([])),
            fetch('/api/data/units').then(res => res.ok ? res.json() : Promise.reject([]))
        ]);

        if (parentCategories && parentCategories.length > 0) {
            parentCategories.forEach(c => cat1Select.add(new Option(c.catNm, c.catIdx)));
        }
        if (units && units.length > 0) {
            units.forEach(u => unitSelect.add(new Option(u.unitNm, u.unitIdx)));
        }

        if (itemToSelectValuesFrom) {
            cat1Select.value = itemToSelectValuesFrom.itemCat1Idx || '';
            if (itemToSelectValuesFrom.itemCat1Idx) {
                await loadModalSubCategories(itemToSelectValuesFrom.itemCat1Idx, itemToSelectValuesFrom.itemCat2Idx);
            }
            unitSelect.value = itemToSelectValuesFrom.unitIdx || '';
             // custIdx는 loadModalCustomersWithOptions에서 처리
        }

    } catch (error) {
        console.error("대분류/단위 옵션 로드 중 오류:", error);
    }
}

// ✳️ bizFlag에 따라 거래처를 로드하는 함수 (분리 및 수정)
async function loadModalCustomersWithOptions(bizFlag, selectedCustIdx) {
    const custSelect = document.getElementById('modalCustNm');
    custSelect.innerHTML = '<option value="">-- 거래처 로딩 중 --</option>';
    let apiUrl = '/api/data/customers'; // 기본 API URL

    if (bizFlag) { // bizFlag가 있으면 쿼리 파라미터로 추가
        apiUrl += `?bizFlag=${bizFlag}`;
    } else {
        // bizFlag가 없으면 (예: itemFlag가 아직 선택되지 않았거나, 모든 거래처를 보여줘야 하는 경우)
        // 기본적으로 모든 거래처를 가져오거나, 또는 선택을 막을 수 있음.
        // CustmstRepository.findCustIdxAndCustNmByBizFlag 는 bizFlag를 필수로 받음.
        // 따라서, bizFlag가 없으면 선택지를 비우거나 "분류를 먼저 선택하세요" 등으로 안내.
        // 여기서는 일단 모든 고객사를 가져오는 것으로 가정하나, 실제 API 동작에 맞춰야 함.
        // 만약 모든 고객사를 가져오는 API가 없다면, 아래 fetch 전에 itemFlag 선택을 유도해야함.
        //console.warn("loadModalCustomersWithOptions: bizFlag가 제공되지 않았습니다. 모든 거래처를 로드 시도합니다.");
         // 또는 custSelect.innerHTML = '<option value="">품목분류를 먼저 선택하세요</option>'; return;
    }

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            // API가 bizFlag 없이 호출됐을 때 에러를 반환한다면 여기서 처리
            if (response.status === 400 && !bizFlag) { // 예: Bad Request (bizFlag 누락)
                 custSelect.innerHTML = '<option value="">품목 분류를 선택해주세요</option>';
                 return;
            }
            throw new Error(`거래처 로드 실패: ${response.status}`);
        }
        const customers = await response.json();

        custSelect.innerHTML = '<option value="">거래처를 선택해주세요</option>';
        if (customers && customers.length > 0) {
            customers.forEach(c => custSelect.add(new Option(c.custNm, c.custIdx))); // CustomerDTO에 custIdx, custNm 가정
        } else if (bizFlag) {
            custSelect.innerHTML = `<option value="">해당 분류의 거래처 없음 (${bizFlag})</option>`;
        }


        if (selectedCustIdx) { // 수정 시 기존 거래처 선택
            custSelect.value = selectedCustIdx;
        }

    } catch (error) {
        console.error("거래처 옵션 로드 중 오류:", error);
        custSelect.innerHTML = '<option value="">거래처 로드 실패</option>';
    }
}


async function loadModalSubCategories(parentCatIdx, selectedSubCatIdx) {
    const cat2Select = document.getElementById('modalItemCat2');
    cat2Select.innerHTML = '<option value="">-- 소분류 선택 --</option>'; // 로딩 전 초기화
    if (!parentCatIdx) return;

    try {
        const response = await fetch(`/api/data/item-categories/children/${parentCatIdx}`);
        if (!response.ok) {
            console.error(`소분류 로드 실패: ${response.status}`);
            cat2Select.innerHTML = '<option value="">로드 실패</option>';
            return;
        }
        const subCategories = await response.json(); // CategoryDto[] 가정
        if (subCategories && subCategories.length > 0) {
            subCategories.forEach(sc => cat2Select.add(new Option(sc.catNm, sc.catIdx)));
        }
        if (selectedSubCatIdx) {
            cat2Select.value = selectedSubCatIdx;
        }
    } catch (error) {
        console.error("소분류 로드 중 예외 발생:", error);
        cat2Select.innerHTML = '<option value="">로드 오류</option>';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}
function outsideClick(event) {
    const modal = document.getElementById('itemModal');
    if (event.target === modal) closeModal('itemModal');
}


// --- 저장 및 수정 ---
function handleSaveItem() {
    const form = document.getElementById('modalItemForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const itemCdValue = document.getElementById('modalItemCd').value;
    // 품목 코드는 자동생성되거나, 수정시에는 이미 있어야함. 신규일때는 자동생성 값 확인.
    if (!itemCdValue && !document.getElementById('modalItemIdx').value) { // 신규 등록인데 품목코드 없는 경우
         alert('품목코드가 생성되지 않았습니다. 자재/품목 분류를 선택하여 코드를 생성해주세요.'); return;
    }


    const itemData = { // DTO 필드에 맞게 데이터 구성
        itemFlag: document.getElementById('modalItemFlagSelect').value,
        itemCd: itemCdValue, itemNm: document.getElementById('modalItemNm').value,
        custIdx: parseInt(document.getElementById('modalCustNm').value) || null,
        itemCat1Idx: parseInt(document.getElementById('modalItemCat1').value) || null,
        itemCat2Idx: parseInt(document.getElementById('modalItemCat2').value) || null,
        itemSpec: document.getElementById('modalItemSpec').value,
        // SeonikItemDto의 unitIdx는 Long, 생성자는 Integer를 받음. ServiceImpl에서 Long으로 변환해줌
        // 여기서는 select의 value (문자열)를 숫자로 변환.
        unitIdx: parseInt(document.getElementById('modalItemUnit').value) || null,
        itemCost: parseFormattedNumber(document.getElementById('modalItemCost').value),
        optimalInv: parseFormattedNumber(document.getElementById('modalOptimalInv').value), // BigDecimal로 DB저장
        cycleTime: null, // cycleTime은 현재 모달에 입력 필드가 없음. 필요시 추가.
        remark: document.getElementById('modalRemark').value,
        currentStockQty: null // 이 값은 조회용. 저장 시에는 보내지 않거나 서버에서 무시. DTO 생성자에 currentStockQty도 있음
    };
    // currentStockQty는 서버에서 계산하므로 DTO에서 제외하거나, 서버에서 DTO 받을 때 무시하도록.
    // SeonikItemDto의 JPA 조회용 생성자에는 currentStockQty가 있음.
    // 하지만 저장/수정용 DTO에는 없어도 됨. 만약 필드가 있다면 null로 보내거나, 서버측 DTO를 분리.
    // 현재 SeonikItemDto는 하나이고, JPA 조회용 생성자에 currentStockQty가 있으므로,
    // 저장/수정 요청 시 이 필드를 보내더라도 서비스 로직(createItem, updateItem)에서 사용하지 않으면 됨.

    //console.log('신규 등록:', itemData);
    fetch('/api/items2', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(itemData)}) //
        .then(async res => { const txt = await res.text(); if (!res.ok) throw new Error(txt || res.statusText); return txt; })
        .then(msg => { alert(msg || "등록 완료"); closeModal('itemModal'); loadAndDisplayInitialData(); })
        .catch(err => { console.error('등록 실패:', err); alert('등록 실패: ' + err.message); });
}

function handleUpdateItem() {
    const form = document.getElementById('modalItemForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const itemIdx = document.getElementById('modalItemIdx').value;
    if (!itemIdx) { alert('수정할 품목 ID가 없습니다.'); return; }

    const itemData = { // DTO 필드에 맞게 데이터 구성
        itemIdx: parseInt(itemIdx),
        itemFlag: document.getElementById('modalItemFlagSelect').value,
        itemCd: document.getElementById('modalItemCd').value,
        itemNm: document.getElementById('modalItemNm').value,
        custIdx: parseInt(document.getElementById('modalCustNm').value) || null,
        itemCat1Idx: parseInt(document.getElementById('modalItemCat1').value) || null,
        itemCat2Idx: parseInt(document.getElementById('modalItemCat2').value) || null,
        itemSpec: document.getElementById('modalItemSpec').value,
        unitIdx: parseInt(document.getElementById('modalItemUnit').value) || null,
        itemCost: parseFormattedNumber(document.getElementById('modalItemCost').value),
        optimalInv: parseFormattedNumber(document.getElementById('modalOptimalInv').value), // BigDecimal
        cycleTime: null, // 필요시 추가
        remark: document.getElementById('modalRemark').value
        // currentStockQty는 보내지 않음
    };
    //console.log('수정:', itemData);
    fetch(`/api/items2/${itemIdx}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(itemData)}) //
        .then(async res => { const txt = await res.text(); if (!res.ok) throw new Error(txt || res.statusText); return txt; })
        .then(msg => { alert(msg || "수정 완료"); closeModal('itemModal'); loadAndDisplayInitialData(); })
        .catch(err => { console.error('수정 실패:', err); alert('수정 실패: ' + err.message); });
}

// --- 유틸리티 함수 ---
function formatNumberInput(inputElem) {
    if (!inputElem) return;
    inputElem.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        // OptimalInv는 BigDecimal이므로 소수점 가능하게 하려면 다른 처리 필요. 여기서는 정수 가정.
        e.target.value = val ? parseInt(val, 10).toLocaleString('ko-KR') : '';
    });
}
function parseFormattedNumber(strVal) {
    if (!strVal) return null;
    // OptimalInv의 경우 DB는 BigDecimal, DTO도 BigDecimal
    // HTML input은 text. JS에서 숫자로 바꿔서 보내면 서버에서 BigDecimal로 변환.
    // 여기서는 일단 정수형 문자열에서 쉼표 제거하고 숫자로 변환.
    const numStr = String(strVal).replace(/,/g, '');
    const num = parseFloat(numStr); // 소수점도 고려하려면 parseFloat
    return isNaN(num) ? null : num;
}

function autoGenerateItemCd() {
    const itemFlag = document.getElementById('modalItemFlagSelect').value;
    const itemCdField = document.getElementById('modalItemCd');
    const isNew = !document.getElementById('modalItemIdx').value; // itemIdx가 없으면 신규

    if (itemCdField && isNew) { // 신규 등록 시에만 자동 생성
        if (itemFlag) {
            const prefix = itemFlag === '01' ? 'RM' : (itemFlag === '02' ? 'PD' : '');
            // 간단한 랜덤 숫자 추가 (실제로는 서버에서 중복되지 않게 생성하는 것이 좋음)
            const randomNumber = Math.floor(10000 + Math.random() * 90000); // 5자리 랜덤 숫자
            itemCdField.value = prefix + randomNumber;
            itemCdField.readOnly = true; // 자동 생성 후 읽기 전용
        } else {
            itemCdField.value = ''; // 분류 선택 안됐으면 비움
            itemCdField.readOnly = true; // 직접 입력 방지
            itemCdField.placeholder = '분류 선택 시 자동 생성';
        }
    } else if (itemCdField && !isNew) {
         // 수정 시에는 품목코드 편집 가능 (정책에 따라 readOnly = false 유지)
        itemCdField.readOnly = false;
    }
}