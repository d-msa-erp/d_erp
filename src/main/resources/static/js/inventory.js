// inventory.js - 품목 관리 JavaScript (ItemController 구조에 맞춰 수정)

// 전역 변수
let currentPage = 1;
let totalPages = 1;
let currentSize = 20;
let currentSort = 'itemNm';
let currentDirection = 'asc';

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('품목 관리 JavaScript 로드됨');
    initializeEventListeners();
    loadItemList();
});

// 이벤트 리스너 초기화
function initializeEventListeners() {
    // 검색 버튼
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }
    
    // 검색 입력 필드 엔터키
    const searchInput = document.getElementById('searchItemText');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // 페이지네이션 버튼들
    const firstPageBtn = document.getElementById('btn-first-page');
    const prevPageBtn = document.getElementById('btn-prev-page');
    const nextPageBtn = document.getElementById('btn-next-page');
    const lastPageBtn = document.getElementById('btn-last-page');
    
    if (firstPageBtn) firstPageBtn.addEventListener('click', () => goToPage(1));
    if (prevPageBtn) prevPageBtn.addEventListener('click', goToPrevPage);
    if (nextPageBtn) nextPageBtn.addEventListener('click', goToNextPage);
    if (lastPageBtn) lastPageBtn.addEventListener('click', () => goToPage(totalPages));
    
    // 페이지 직접 입력
    const pageInput = document.getElementById('currentPageInput');
    if (pageInput) {
        pageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const page = parseInt(this.value);
                if (page >= 1 && page <= totalPages) {
                    goToPage(page);
                } else {
                    alert('올바른 페이지 번호를 입력해주세요.');
                    this.value = currentPage;
                }
            }
        });
    }
    
    // 전체 선택 체크박스
    const checkAllBox = document.getElementById('checkallItem');
    if (checkAllBox) {
        checkAllBox.addEventListener('change', toggleAllCheckboxes);
    }
    
    // 삭제 버튼
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDelete);
    }
    
    // 엑셀 다운로드 버튼
    const excelBtn = document.getElementById('excelBtn');
    if (excelBtn) {
        excelBtn.addEventListener('click', handleExcelDownload);
    }
    
    // 인쇄 버튼
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', handlePrint);
    }
}

// 품목 목록 로드
function loadItemList() {
    console.log('품목 목록 로드 시작');
    
    // 검색 조건 수집
    const searchCat = getSearchCategory();
    const searchItem = getSearchItem();
    
    const params = new URLSearchParams({
        page: currentPage - 1,
        size: currentSize,
        sort: currentSort,
        direction: currentDirection
    });
    
    if (searchCat) params.append('searchCat', searchCat);
    if (searchItem) params.append('searchItem', searchItem);
    
    console.log('요청 파라미터:', params.toString());
    
    // ItemController의 실제 경로에 맞춰 수정
    fetch(`/api/items/list?${params}`)
        .then(response => {
            console.log('응답 상태:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('조회된 데이터:', data);
            displayItemList(data.content || []);
            updatePagination(data);
        })
        .catch(error => {
            console.error('품목 목록 로드 실패:', error);
            alert('품목 목록을 불러오는데 실패했습니다: ' + error.message);
        });
}

// 검색 카테고리 추출
function getSearchCategory() {
    const searchCatSelect = document.getElementById('searchCatSelect');
    if (!searchCatSelect) return '';
    
    const value = searchCatSelect.value;
    const mapping = {
        'itemNm': 'ItemName',
        'itemCd': 'itemCd',
        'custNm': 'custNm'
    };
    return mapping[value] || '';
}

// 검색어 추출
function getSearchItem() {
    const searchInput = document.getElementById('searchItemText');
    return searchInput ? searchInput.value.trim() : '';
}

// 품목 목록 표시
function displayItemList(items) {
    console.log('품목 목록 표시:', items.length + '개');
    
    const tbody = document.getElementById('itembody');
    const noDataRow = document.getElementById('NoitemRow');
    
    if (!tbody) {
        console.error('itembody 요소를 찾을 수 없습니다');
        return;
    }
    
    // 기존 데이터 행 제거 (NoitemRow 제외)
    const existingRows = tbody.querySelectorAll('tr:not(#NoitemRow)');
    existingRows.forEach(row => row.remove());
    
    if (!items || items.length === 0) {
        if (noDataRow) noDataRow.style.display = 'table-row';
        return;
    }
    
    if (noDataRow) noDataRow.style.display = 'none';
    
    items.forEach(item => {
        const row = createItemRow(item);
        tbody.appendChild(row);
    });
    
    // 전체 선택 체크박스 초기화
    const checkAllBox = document.getElementById('checkallItem');
    if (checkAllBox) checkAllBox.checked = false;
}

// 품목 행 생성
function createItemRow(item) {
    const row = document.createElement('tr');
    row.setAttribute('data-item-idx', item.itemIdx);
    
    // 안전한 값 추출
    const itemNm = item.itemNm || '';
    const itemCd = item.itemCd || '';
    const cat1Nm = (item.catDto1 && item.catDto1.catNm) ? item.catDto1.catNm : '';
    const cat2Nm = (item.catDto2 && item.catDto2.catNm) ? item.catDto2.catNm : '';
    const custNm = (item.customerForItemDto && item.customerForItemDto.custNm) ? item.customerForItemDto.custNm : '';
    const unitNm = (item.unitForItemDto && item.unitForItemDto.unitNm) ? item.unitForItemDto.unitNm : '';
    const itemCost = item.itemCost || 0;
    
    // 재고량 API로 별도 조회 (비동기)
    const currentQtyCell = `<td class="text-right" id="qty-${item.itemIdx}">-</td>`;
    
    row.innerHTML = `
        <td><input type="checkbox" class="item-checkbox" value="${item.itemIdx}" data-item-idx="${item.itemIdx}"></td>
        <td>${itemNm}</td>
        <td>${itemCd}</td>
        <td>${cat1Nm}</td>
        <td>${cat2Nm}</td>
        <td>${custNm}</td>
        <td>${unitNm}</td>
        ${currentQtyCell}
        <td class="text-right">${itemCost.toLocaleString()}</td>
    `;
    
    // 재고량 비동기 로드
    loadStockQty(item.itemIdx);
    
    // 행 클릭 이벤트 (체크박스 제외)
    row.addEventListener('click', function(e) {
        if (e.target.type !== 'checkbox') {
            showItemDetail(item.itemIdx);
        }
    });
    
    return row;
}

// 재고량 비동기 로드
function loadStockQty(itemIdx) {
    fetch(`/api/items/${itemIdx}/stock`)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return { stockQty: 0 };
        })
        .then(data => {
            const qtyCell = document.getElementById(`qty-${itemIdx}`);
            if (qtyCell) {
                qtyCell.textContent = (data.stockQty || 0).toLocaleString();
            }
        })
        .catch(error => {
            console.error(`재고량 조회 실패 - itemIdx: ${itemIdx}`, error);
            const qtyCell = document.getElementById(`qty-${itemIdx}`);
            if (qtyCell) {
                qtyCell.textContent = '0';
            }
        });
}

// 페이지네이션 업데이트
function updatePagination(pageData) {
    currentPage = pageData.currentPage || 1;
    totalPages = pageData.totalPages || 1;
    
    // 페이지 정보 텍스트 업데이트
    const pageInfoText = document.getElementById('paginationInfoText');
    if (pageInfoText) {
        const totalElements = pageData.totalElements || 0;
        pageInfoText.textContent = `총 ${totalElements.toLocaleString()}건 ${currentPage}/${totalPages}페이지`;
    }
    
    // 현재 페이지 입력 필드 업데이트
    const pageInput = document.getElementById('currentPageInput');
    if (pageInput) {
        pageInput.value = currentPage;
        pageInput.max = totalPages;
    }
    
    // 페이지네이션 버튼 상태 업데이트
    const firstPageBtn = document.getElementById('btn-first-page');
    const prevPageBtn = document.getElementById('btn-prev-page');
    const nextPageBtn = document.getElementById('btn-next-page');
    const lastPageBtn = document.getElementById('btn-last-page');
    
    if (firstPageBtn) firstPageBtn.disabled = currentPage <= 1;
    if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
    if (lastPageBtn) lastPageBtn.disabled = currentPage >= totalPages;
}

// 검색 처리
function handleSearch() {
    console.log('검색 실행');
    currentPage = 1; // 검색 시 첫 페이지로 이동
    loadItemList();
}

// 정렬 처리
function order(headerElement) {
    const sortBy = headerElement.getAttribute('data-sort-by');
    
    if (currentSort === sortBy) {
        // 같은 컬럼 클릭 시 방향 토글
        currentDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // 다른 컬럼 클릭 시 오름차순으로 초기화
        currentSort = sortBy;
        currentDirection = 'asc';
    }
    
    // 정렬 화살표 업데이트
    updateSortArrows(headerElement);
    
    // 목록 새로고침
    loadItemList();
}

// 정렬 화살표 업데이트
function updateSortArrows(activeHeader) {
    // 모든 화살표 초기화
    document.querySelectorAll('.sort-arrow').forEach(arrow => {
        arrow.textContent = '↓';
        arrow.style.opacity = '0.3';
    });
    
    // 활성 화살표 업데이트
    const arrow = activeHeader.querySelector('.sort-arrow');
    if (arrow) {
        arrow.textContent = currentDirection === 'asc' ? '↑' : '↓';
        arrow.style.opacity = '1';
    }
}

// 페이지 이동
function goToPage(page) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
        currentPage = page;
        loadItemList();
    }
}

function goToPrevPage() {
    if (currentPage > 1) {
        goToPage(currentPage - 1);
    }
}

function goToNextPage() {
    if (currentPage < totalPages) {
        goToPage(currentPage + 1);
    }
}

// 전체 선택/해제
function toggleAllCheckboxes() {
    const checkAll = document.getElementById('checkallItem');
    const itemCheckboxes = document.querySelectorAll('.item-checkbox');
    
    if (checkAll && itemCheckboxes) {
        itemCheckboxes.forEach(checkbox => {
            checkbox.checked = checkAll.checked;
        });
    }
}

// 선택된 품목 ID 배열 반환
function getSelectedItemIds() {
    const selectedCheckboxes = document.querySelectorAll('.item-checkbox:checked');
    return Array.from(selectedCheckboxes).map(cb => cb.getAttribute('data-item-idx'));
}

// 삭제 처리
function handleDelete() {
    const selectedIds = getSelectedItemIds();
    
    if (selectedIds.length === 0) {
        alert('삭제할 품목을 선택해주세요.');
        return;
    }
    
    if (!confirm(`선택한 ${selectedIds.length}개의 품목을 삭제하시겠습니까?`)) {
        return;
    }
    
    fetch('/api/items/delete', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedIds)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        if (result.success) {
            alert('선택한 품목이 삭제되었습니다.');
            loadItemList();
        } else {
            alert('삭제 중 오류가 발생했습니다: ' + (result.message || ''));
        }
    })
    .catch(error => {
        console.error('삭제 실패:', error);
        alert('삭제 중 오류가 발생했습니다: ' + error.message);
    });
}

// 엑셀 다운로드
function handleExcelDownload() {
    const selectedIds = getSelectedItemIds();
    
    if (selectedIds.length === 0) {
        alert('엑셀로 다운로드할 품목을 먼저 선택해주세요.');
        return;
    }

    fetch('/api/items/download-excel-details', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedIds)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 파일명 추출
        const disposition = response.headers.get('Content-Disposition');
        let filename = 'item_details.xlsx';
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                filename = decodeURIComponent(matches[1].replace(/['"]/g, '').replace(/UTF-8''/i, ''));
            }
        }
        
        return response.blob().then(blob => ({ blob, filename }));
    })
    .then(({ blob, filename }) => {
        // 파일 다운로드
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        
        alert('엑셀 파일이 다운로드되었습니다.');
    })
    .catch(error => {
        console.error('엑셀 다운로드 실패:', error);
        alert(`엑셀 다운로드 오류: ${error.message}`);
    });
}

// 인쇄
function handlePrint() {
    const selectedIds = getSelectedItemIds();
    
    if (selectedIds.length === 0) {
        alert('인쇄할 품목을 먼저 선택해주세요.');
        return;
    }

    printSelectedItemDetails(selectedIds);
}

// 선택된 품목 인쇄
async function printSelectedItemDetails(selectedItemIds) {
    let printContents = `
        <html>
        <head>
            <title>품목 상세 정보 인쇄</title>
            <style>
                body { font-family: '맑은 고딕', sans-serif; margin: 20px; font-size: 10pt; }
                .item-container { border: 1px solid #ccc; padding: 20px; margin-bottom: 25px; page-break-inside: avoid; }
                .item-container h2 { font-size: 16pt; margin-top: 0; color: #1a237e; border-bottom: 2px solid #3949ab; padding-bottom: 8px; }
                .item-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 20px; margin-bottom: 20px; }
                .item-info p { margin: 6px 0; }
                .item-info strong { color: #555; font-weight: bold; width: 100px; display: inline-block; }
                @media print { 
                    body { margin: 0; } 
                    .item-container { border: none; margin-bottom: 20mm; }
                }
            </style>
        </head>
        <body>
            <h1>선택된 품목 상세 정보</h1>
    `;

    try {
        for (const itemId of selectedItemIds) {
            try {
                const response = await fetch(`/api/items/${itemId}`);
                if (!response.ok) {
                    printContents += `
                        <div class="item-container">
                            <h2>품목 ID: ${itemId}</h2>
                            <p>이 품목의 정보를 불러오는데 실패했습니다.</p>
                        </div>`;
                    continue;
                }
                
                const itemData = await response.json();
                
                // 재고량 조회
                let stockQty = 0;
                try {
                    const stockResponse = await fetch(`/api/items/${itemId}/stock`);
                    if (stockResponse.ok) {
                        const stockData = await stockResponse.json();
                        stockQty = stockData.stockQty || 0;
                    }
                } catch (stockError) {
                    console.error('재고량 조회 실패:', stockError);
                }
                
                const getFlagName = (flagCode) => {
                    return flagCode === '01' ? '자재' : flagCode === '02' ? '품목' : 'N/A';
                };
                
                const formatNumber = (value) => {
                    return value ? value.toLocaleString() : 'N/A';
                };
                
                printContents += `
                    <div class="item-container">
                        <h2>${itemData.itemNm || 'N/A'} (코드: ${itemData.itemCd || 'N/A'})</h2>
                        <div class="item-info">
                            <p><strong>품목분류:</strong> ${getFlagName(itemData.itemFlag)}</p>
                            <p><strong>규격:</strong> ${itemData.itemSpec || 'N/A'}</p>
                            <p><strong>단가:</strong> ${formatNumber(itemData.itemCost)}원</p>
                            <p><strong>적정재고:</strong> ${formatNumber(itemData.optimalInv)}</p>
                            <p><strong>현재고량:</strong> ${formatNumber(stockQty)}</p>
                            <p><strong>거래처:</strong> ${(itemData.customerForItemDto && itemData.customerForItemDto.custNm) || 'N/A'}</p>
                            <p><strong>대분류:</strong> ${(itemData.catDto1 && itemData.catDto1.catNm) || 'N/A'}</p>
                            <p><strong>소분류:</strong> ${(itemData.catDto2 && itemData.catDto2.catNm) || 'N/A'}</p>
                            <p><strong>단위:</strong> ${(itemData.unitForItemDto && itemData.unitForItemDto.unitNm) || 'N/A'}</p>
                        </div>
                        ${itemData.remark ? `<p><strong>비고:</strong> ${itemData.remark}</p>` : ''}
                    </div>`;
                    
            } catch (err) {
                printContents += `
                    <div class="item-container">
                        <h2>품목 ID: ${itemId}</h2>
                        <p>오류: ${err.message}</p>
                    </div>`;
            }
        }
    } catch (error) {
        printContents += `<div class="item-container"><p>처리 중 오류가 발생했습니다: ${error.message}</p></div>`;
    }

    printContents += `</body></html>`;

    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    if (printWindow) {
        printWindow.document.write(printContents);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    } else {
        alert("팝업 차단이 설정되어 있어 인쇄 창을 열 수 없습니다.");
    }
}

// 품목 상세 보기 (모달)
function showItemDetail(itemIdx) {
    fetch(`/api/items/${itemIdx}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(item => {
            populateModal(item);
            const modal = document.getElementById('itemModal');
            if (modal) {
                modal.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('품목 상세 조회 실패:', error);
            alert('품목 정보를 불러오는데 실패했습니다: ' + error.message);
        });
}

// 모달에 데이터 채우기
function populateModal(item) {
    const setFieldValue = (id, value) => {
        const field = document.getElementById(id);
        if (field) field.value = value || '';
    };
    
    setFieldValue('modalItemIdx', item.itemIdx);
    setFieldValue('modalItemFlagSelect', item.itemFlag);
    setFieldValue('modalItemCd', item.itemCd);
    setFieldValue('modalItemNm', item.itemNm);
    setFieldValue('modalItemSpec', item.itemSpec);
    setFieldValue('modalItemCost', item.itemCost);
    setFieldValue('modalOptimalInv', item.optimalInv);
    setFieldValue('modalRemark', item.remark);
    
    // 연관 데이터 설정
    if (item.customerForItemDto) {
        setFieldValue('modalCustNm', item.customerForItemDto.custIdx);
    }
    if (item.catDto1) {
        setFieldValue('modalItemCat1', item.catDto1.catIdx);
    }
    if (item.catDto2) {
        setFieldValue('modalItemCat2', item.catDto2.catIdx);
    }
    if (item.unitForItemDto) {
        setFieldValue('modalItemUnit', item.unitForItemDto.unitIdx);
    }
}

// 모달 닫기
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// 모달 외부 클릭 시 닫기
function outsideClick(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
}

// 신규 등록 모달 열기
function openModal() {
    const modal = document.getElementById('itemModal');
    if (modal) {
        // 폼 초기화
        const form = document.getElementById('modalItemForm');
        if (form) form.reset();
        
        modal.style.display = 'block';
        
        // 모달 옵션들 로드
        loadModalOptions();
    }
}

// 모달 옵션들 로드
function loadModalOptions() {
    // 거래처 목록 로드
    loadModalCustomers();
    // 대분류 목록 로드
    loadModalCategories();
    // 단위 목록 로드
    loadModalUnits();
}

function loadModalCustomers() {
    fetch('/api/items/customers')
        .then(response => response.json())
        .then(customers => {
            const select = document.getElementById('modalCustNm');
            if (select) {
                select.innerHTML = '<option value="">거래처를 선택해주세요</option>';
                
                customers.forEach(customer => {
                    const option = document.createElement('option');
                    option.value = customer.custIdx;
                    option.textContent = customer.custNm;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('거래처 옵션 로드 실패:', error);
        });
}

function loadModalCategories() {
    fetch('/api/items/categories/parent')
        .then(response => response.json())
        .then(categories => {
            const select = document.getElementById('modalItemCat1');
            if (select) {
                select.innerHTML = '<option value="">대분류를 선택해주세요</option>';
                
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.catIdx;
                    option.textContent = category.catNm;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('대분류 옵션 로드 실패:', error);
        });
}

function loadModalUnits() {
    fetch('/api/items/units')
        .then(response => response.json())
        .then(units => {
            const select = document.getElementById('modalItemUnit');
            if (select) {
                select.innerHTML = '<option value="">단위를 선택하세요</option>';
                
                units.forEach(unit => {
                    const option = document.createElement('option');
                    option.value = unit.unitIdx;
                    option.textContent = unit.unitNm;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('단위 옵션 로드 실패:', error);
        });
}

console.log('inventory.js 로드 완료');