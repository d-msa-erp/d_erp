// =====================================================================================
// 전역 변수 선언
// =====================================================================================
let allProductsForSelection = [];
let allRawMaterialsForSelection = [];
let currentlyEditingComponentState = {
    bomIdx: null, subItemIdx: null, itemCd: '', itemNm: '',
    useQty: 1, unitNm: '', itemPrice: 0, lossRt: 0,
    remark: '', itemFlag: '01', subItemMasterCost: 0
};
let originalParentItemIdForUpdate = null; // 수정 시 대상이 되는 상위 품목의 itemIdx
let draggedRow = null;

// --- 검색, 정렬, 페이지네이션을 위한 전역 변수 ---
let allBomData = [];        // 서버로부터 받은 BOM 요약 목록 원본
let currentPage = 1;        // 현재 보고 있는 페이지 번호
const itemsPerPage = 10;    // 페이지 당 항목 수 (outbound.js의 pageSize와 동일하게 가정)
let currentSearchTerm = ''; // 현재 검색어
let currentSortColumn = 'pitemCd'; // 현재 정렬 기준 컬럼명 (API 필드명 기준)
let currentSortOrder = 'asc';   // 현재 정렬 순서 ('asc' 또는 'desc')


// =====================================================================================
// 유틸리티 함수
// =====================================================================================
function getSelectedSubItemIds() {
    const rows = document.querySelectorAll('#bomDetailTbody tr[data-sub-item-idx]');
    return Array.from(rows).map(row => Number(row.dataset.subItemIdx));
}

// =====================================================================================
// 초기화 및 메인 이벤트 리스너
// =====================================================================================
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM 로드 완료, 초기 데이터 로딩 시작");
    loadAllItemsForSelection(); // 품목/원자재 선택 목록 미리 로드
    loadMainBomSummaryList();   // 메인 BOM 목록 로드

    // --- 검색 이벤트 리스너 ---
    const searchInput = document.getElementById('mainSearchInput');
    const searchButton = document.getElementById('mainSearchButton'); // HTML과 ID 일치

    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // 폼 제출 방지
                performSearch();
            }
        });
    }

    function performSearch() {
        currentSearchTerm = searchInput ? searchInput.value.trim() : '';
        currentPage = 1; // 검색 시 첫 페이지로
        renderTable();     // 테이블 다시 그리기
    }

    // --- 페이지네이션 이벤트 리스너 (outbound.js 참고하여 표준화) ---
    document.getElementById('btn-first-page')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage = 1;
            renderTable();
        }
    });
    document.getElementById('btn-prev-page')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    document.getElementById('btn-next-page')?.addEventListener('click', () => {
        const totalPages = Math.ceil((getFilteredAndSortedData() || []).length / itemsPerPage) ||1;
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
    document.getElementById('btn-last-page')?.addEventListener('click', () => {
        const totalPages = Math.ceil((getFilteredAndSortedData() || []).length / itemsPerPage) || 1;
        if (currentPage < totalPages) {
            currentPage = totalPages;
            renderTable();
        }
    });
    document.getElementById('pageInput')?.addEventListener('change', (e) => { // 직접 페이지 입력 후 Enter 또는 focusout
        const totalPages = Math.ceil((getFilteredAndSortedData() || []).length / itemsPerPage) || 1;
        let newPage = parseInt(e.target.value, 10);
        if (isNaN(newPage) || newPage < 1) {
            newPage = 1;
        } else if (newPage > totalPages) {
            newPage = totalPages;
        }
        currentPage = newPage;
        renderTable();
        e.target.value = currentPage; // 입력 값 보정
    });
     document.getElementById('pageInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // 'change' 이벤트를 발생시켜 위쪽의 change 리스너가 동작하도록 함
            document.getElementById('pageInput').dispatchEvent(new Event('change'));
        }
    });


    // --- 모달 내 검색 리스너 ---
    const searchParentInput = document.getElementById('searchParentInput');
    const searchRawInput = document.getElementById('searchRawInput');

    if (searchParentInput) {
        searchParentInput.addEventListener('input', () => {
            const term = searchParentInput.value.trim().toLowerCase();
            const selectedRadio = document.querySelector('input[name="parent-item-select"]:checked');
            const currentSelectedId = selectedRadio ? Number(selectedRadio.value) : null;
            const filtered = allProductsForSelection.filter(item =>
                (currentSelectedId && item.itemIdx === currentSelectedId) || // 항상 선택된 항목은 보이도록
                (term === '' || String(item.itemIdx).includes(term) || (item.itemCd || '').toLowerCase().includes(term) || (item.itemNm || '').toLowerCase().includes(term))
            );
            populateProductSelectionTable(filtered, currentSelectedId);
        });
    }

    if (searchRawInput) {
        searchRawInput.addEventListener('input', () => {
            const term = searchRawInput.value.trim().toLowerCase();
            const selectedIdsInBom = getSelectedSubItemIds(); // 현재 BOM에 구성된 자재 ID 목록
            const filtered = allRawMaterialsForSelection.filter(item =>
                selectedIdsInBom.includes(item.itemIdx) || // 항상 BOM에 구성된 항목은 보이도록
                (term === '' || String(item.itemIdx).includes(term) || (item.itemCd || '').toLowerCase().includes(term) || (item.itemNm || '').toLowerCase().includes(term))
            );
            populateRawMaterialSelectionTable(filtered); // 선택된 항목은 체크된 상태로 표시됨
        });
    }

    // --- 하위 품목 편집 필드 리스너 ---
    const useQtyInput = document.getElementById('componentUseQty');
    const lossRtInput = document.getElementById('componentLossRt');
    const componentRemarkInput = document.getElementById('componentRemark');
    if (useQtyInput) useQtyInput.addEventListener('input', handleComponentEditInputChange);
    if (lossRtInput) lossRtInput.addEventListener('input', handleComponentEditInputChange);
    if (componentRemarkInput) componentRemarkInput.addEventListener('input', handleComponentEditInputChange);

    // --- 모달 저장/수정 버튼 리스너 ---
    const modalForm = document.getElementById('modalForm'); // 폼 자체에 대한 이벤트 리스너 고려 가능
    const editButton = modalForm?.querySelector('button[name="edit"]');
    const saveButton = modalForm?.querySelector('button[name="save"]');
    if (editButton) editButton.addEventListener('click', handleBomUpdate);
    if (saveButton) saveButton.addEventListener('click', handleBomSave);


    // --- 상위 품목 선택(라디오) 리스너 ---
    const productTbody = document.getElementById('productSelectionTbody');
    if (productTbody) {
        // 이벤트 위임을 사용하여 동적으로 추가된 라디오 버튼에도 이벤트가 적용되도록 함
        productTbody.addEventListener('change', function (event) { 
            if (event.target.type === 'radio' && event.target.name === 'parent-item-select') {
                handleParentItemSelection(event.target);
            }
        });
    }
    
    // --- 테이블 전체 선택/해제 체크박스 리스너 ---
    const selectAllCheckbox = document.getElementById('selectAllBOMCheckbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function () {
            const isChecked = this.checked;
            document.querySelectorAll('#bomTbody input[type="checkbox"][name="bom_select"]').forEach(cb => {
                cb.checked = isChecked;
            });
        });
    }
    
    // --- 테이블 개별 체크박스 변경 시 전체 선택 체크박스 상태 업데이트 ---
    const bomTbodyForCheckbox = document.getElementById('bomTbody');
    if (bomTbodyForCheckbox) {
        bomTbodyForCheckbox.addEventListener('change', function(event) {
            if (event.target.matches('input[type="checkbox"][name="bom_select"]')) {
                if (selectAllCheckbox) {
                    const allCheckboxes = bomTbodyForCheckbox.querySelectorAll('input[type="checkbox"][name="bom_select"]');
                    const checkedCheckboxes = bomTbodyForCheckbox.querySelectorAll('input[type="checkbox"][name="bom_select"]:checked');
                    selectAllCheckbox.checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
                }
            }
        });
    }
});

// =====================================================================================
// 데이터 렌더링 함수 (검색, 정렬, 페이지네이션 적용)
// =====================================================================================
function getFilteredAndSortedData() {
    let filteredData = [...allBomData]; // 원본 배열 복사

    if (currentSearchTerm) {
        const lowerCaseTerm = currentSearchTerm.toLowerCase();
        filteredData = filteredData.filter(item =>
            // item 객체의 모든 값에 대해 검색어 포함 여부 확인
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(lowerCaseTerm)
            )
        );
    }

    // 정렬 적용
    filteredData.sort((a, b) => {
        let valA = a[currentSortColumn];
        let valB = b[currentSortColumn];

        // 숫자형 필드(단가) 특별 처리
        if (currentSortColumn === 'ptotalRawMaterialCost') {
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        } else { // 그 외 문자열로 비교
            valA = String(valA || '').toLowerCase(); // null 또는 undefined 방지
            valB = String(valB || '').toLowerCase(); // null 또는 undefined 방지
        }

        if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    return filteredData;
}

function renderTable() {
    const tbody = document.getElementById('bomTbody');
    if (!tbody) return;
    tbody.innerHTML = ''; // 기존 내용 삭제

    const filteredData = getFilteredAndSortedData();
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1; // 전체 페이지 수 (최소 1)

    // 현재 페이지가 유효 범위를 벗어나지 않도록 조정
    currentPage = Math.max(1, Math.min(currentPage, totalPages));

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex); // 현재 페이지에 표시할 데이터
    
    if (pageData.length === 0) {
        // 테이블 헤더의 th 개수를 동적으로 가져와 colspan 설정
        const colSpan = document.querySelectorAll('#bomTable thead th').length || 6; // 기본값 6
        tbody.innerHTML = `<tr><td colspan="${colSpan}" class="nodata">${currentSearchTerm ? '검색 결과가 없습니다.' : '등록된 BOM이 없습니다.'}</td></tr>`;
    } else {
        pageData.forEach(item => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            // data-id는 BOM 요약 목록에서 상위 품목의 itemIdx를 의미함 (BOM 자체의 ID가 아님)
            tr.setAttribute('data-id', item.itemIdx); 
            tr.innerHTML = `
                <td onclick="event.stopPropagation()"><input type="checkbox" name="bom_select"></td>
                <td>${item.pitemCd || ''}</td>
                <td>${item.pitemNm || ''}</td>
                <td>${item.catNm || ''}</td>
                <td>${item.punitNm || ''}</td>
                <td>${(item.ptotalRawMaterialCost != null ? Math.round(item.ptotalRawMaterialCost).toLocaleString() : '0')}원</td>
            `;
            // 행 클릭 시 상세 정보 조회
            tr.addEventListener('click', function() {
                const parentItemIdForBom = this.getAttribute('data-id'); // 상위 품목의 itemIdx
                fetchBomDetails(parentItemIdForBom);
            });
            tbody.appendChild(tr);
        });
    }
    updatePaginationControls(totalItems, totalPages); // 페이지네이션 UI 업데이트
    updateSortIndicators(); // 정렬 지시자(화살표) UI 업데이트
     // 현재 페이지의 체크박스 상태에 따라 전체 선택 체크박스 상태 업데이트
    const selectAllCheckbox = document.getElementById('selectAllBOMCheckbox');
    if (selectAllCheckbox) {
        const allCheckboxesInPage = tbody.querySelectorAll('input[type="checkbox"][name="bom_select"]');
        const checkedCheckboxesInPage = tbody.querySelectorAll('input[type="checkbox"][name="bom_select"]:checked');
        selectAllCheckbox.checked = allCheckboxesInPage.length > 0 && allCheckboxesInPage.length === checkedCheckboxesInPage.length;
    }
}

function updatePaginationControls(totalItems, totalPages) {
    const paginationInfoEl = document.getElementById('paginationInfo');
    const pageInputEl = document.getElementById('pageInput'); // HTML id와 일치
    const btnFirstPageEl = document.getElementById('btn-first-page');
    const btnPrevPageEl = document.getElementById('btn-prev-page');
    const btnNextPageEl = document.getElementById('btn-next-page');
    const btnLastPageEl = document.getElementById('btn-last-page');


    if (paginationInfoEl) paginationInfoEl.textContent = `총 ${totalItems}건 ${currentPage}/${totalPages}페이지`;
    if (pageInputEl) {
         pageInputEl.value = currentPage;
         pageInputEl.max = totalPages; // input max 속성 설정
    }
    // 버튼 활성화/비활성화 상태 업데이트
    if(btnFirstPageEl) btnFirstPageEl.disabled = (currentPage === 1);
    if(btnPrevPageEl) btnPrevPageEl.disabled = (currentPage === 1);
    if(btnNextPageEl) btnNextPageEl.disabled = (currentPage === totalPages || totalPages === 0); // totalPages가 0일때도 비활성화
    if(btnLastPageEl) btnLastPageEl.disabled = (currentPage === totalPages || totalPages === 0); // totalPages가 0일때도 비활성화
}


function updateSortIndicators() {
    document.querySelectorAll("#bomTable thead th[data-sort-by]").forEach(th => { // HTML의 data-sort-by 사용
        const a = th.querySelector('a.sort-arrow'); // 클래스명 .sort-arrow로 변경 (HTML과 일치)
        if (a) {
            a.classList.remove('active'); // 먼저 모든 active 클래스 제거
            a.style.opacity = 0.3; // 기본 비활성 스타일 (CSS에서도 정의했지만 JS에서도 명시)
            if (th.dataset.sortBy === currentSortColumn) {
                a.textContent = currentSortOrder === 'asc' ? '↑' : '↓';
                a.classList.add('active');
                a.style.opacity = 1; // 활성 스타일
            } else {
                a.textContent = '↓'; // 기본 아래 화살표
            }
        }
    });
}

// =====================================================================================
// 데이터 로딩 함수
// =====================================================================================
function loadMainBomSummaryList() {
    fetch('/api/bom/summary')
        .then(res => {
            if (!res.ok) return res.text().then(text => { throw new Error(`BOM 요약 API 오류: ${res.status} ${text}`); });
            return res.json();
        })
        .then(data => {
            allBomData = data || []; // null일 경우 빈 배열로 초기화
            currentPage = 1;       // 데이터 로드 시 첫 페이지로
            renderTable();         // 테이블 다시 그리기
        })
        .catch(err => {
            console.error("BOM 목록 로딩 실패:", err);
            const tbody = document.getElementById('bomTbody');
            if(tbody) {
                 const colSpan = document.querySelectorAll('#bomTable thead th').length || 6;
                 tbody.innerHTML = `<tr><td colspan="${colSpan}" class="nodata">BOM 목록을 불러오는데 실패했습니다. 관리자에게 문의하세요.</td></tr>`;
            }
            allBomData = []; // 오류 발생 시 빈 배열로
            renderTable();   // 페이지네이션 등 UI 업데이트
        });
}

async function loadAllItemsForSelection() {
    console.log("loadAllItemsForSelection 시작");
    try {
        // flag 02: 완제품/반제품 (BOM의 상위 품목이 될 수 있는 것들)
        const productsResponse = await fetch('/api/bom/flag/02'); 
        if (productsResponse.ok) {
            allProductsForSelection = await productsResponse.json();
        } else { 
            console.error("제품(상위품목용) 목록 로딩 실패:", productsResponse.statusText); 
            allProductsForSelection = []; 
        }

        // flag 01: 원자재 (BOM의 하위 품목이 될 수 있는 것들)
        const rawMaterialsResponse = await fetch('/api/bom/flag/01');
        if (rawMaterialsResponse.ok) {
            allRawMaterialsForSelection = await rawMaterialsResponse.json();
        } else { 
            console.error("원자재(하위품목용) 목록 로딩 실패:", rawMaterialsResponse.statusText); 
            allRawMaterialsForSelection = []; 
        }
        
        console.log("선택용 데이터 로딩 완료: 품목(상위)", allProductsForSelection.length, "개, 원자재(하위)", allRawMaterialsForSelection.length, "개");
    } catch (error) {
        console.error("선택용 품목/원자재 로딩 중 전체 오류:", error);
        allProductsForSelection = [];
        allRawMaterialsForSelection = [];
    }
}

// =====================================================================================
// 정렬 함수 (HTML에서 onclick="order(this)"로 호출됨)
// =====================================================================================
function order(thElement) {
    const newSortColumn = thElement.dataset.sortBy; // HTML의 data-sort-by 사용
    if (!newSortColumn) return;

    if (currentSortColumn === newSortColumn) {
        currentSortOrder = (currentSortOrder === 'asc') ? 'desc' : 'asc';
    } else {
        currentSortColumn = newSortColumn;
        currentSortOrder = 'asc'; // 새로운 컬럼 클릭 시 기본 오름차순
    }
    renderTable(); // 정렬 후 테이블 다시 그리기
}

// =====================================================================================
// 모달 및 BOM 상세/편집 관련 함수들
// =====================================================================================

function updateTargetBom5RowField(subItemIdx, fieldName, value) {
    // BOM 구성 테이블(bomTab5)의 특정 행, 특정 필드 값을 업데이트
    const targetRow = findComponentInBomTab5(subItemIdx);
    if (!targetRow) return;

    let inputSelector = '';
    switch (fieldName.toLowerCase()) {
        case 'useqty': inputSelector = '.bom5-use-qty'; break;
        case 'lossrt': inputSelector = '.bom5-loss-rt'; break;
        case 'remark': inputSelector = '.bom5-remark'; break;
        case 'itemprice': inputSelector = '.bom5-item-price'; break; // 단가 필드
        default: console.warn("알 수 없는 필드명:", fieldName); return;
    }
    const inputField = targetRow.querySelector(inputSelector);
    if (inputField) inputField.value = value;
}

function handleComponentEditInputChange(event) {
    // 하위 품목 상세/편집 영역의 input 값이 변경될 때 호출됨
    const fieldId = event.target.id; // 예: componentUseQty
    // 'component' 접두어 제거하고 소문자로 변환하여 필드명 추출
    const fieldName = fieldId.startsWith('component') ? fieldId.substring('component'.length).toLowerCase() : fieldId.toLowerCase();
    
    let value = event.target.type === 'number' ? parseFloat(event.target.value) : event.target.value;
    if (event.target.type === 'number' && isNaN(value)) value = 0; // 숫자가 아니면 0으로

    const subItemIdxValue = document.getElementById('editingComponentSubItemIdx').value;

    if (subItemIdxValue) { // 현재 편집 중인 하위 품목이 있을 때만
        const subItemIdx = Number(subItemIdxValue);

        // 현재 편집 상태 객체(currentlyEditingComponentState) 업데이트
        if (fieldName === 'useqty') currentlyEditingComponentState.useQty = value;
        if (fieldName === 'lossrt') currentlyEditingComponentState.lossRt = value;
        if (fieldName === 'remark') currentlyEditingComponentState.remark = value;
        // itemPrice는 calculateAndDisplayComponentLineCost에서 업데이트되므로 여기서 직접 수정하지 않음

        // BOM 구성 테이블(bomTab5)의 해당 행에도 값 반영 (소요량, 로스율, 비고)
        if (fieldName === 'useqty' || fieldName === 'lossrt') {
            updateTargetBom5RowField(subItemIdx, fieldName, value);
            calculateAndDisplayComponentLineCost(); // 소요량이나 로스율 변경 시 단가 재계산
        } else if (fieldName === 'remark') {
            updateTargetBom5RowField(subItemIdx, 'remark', value);
        }
    }
}

async function openModal() { // 신규 등록용 모달 열기
    console.log("openModal (신규) 호출됨");
    originalParentItemIdForUpdate = null; // 신규 등록이므로 수정 대상 ID 없음
    
    const modalForm = document.getElementById('modalForm');
    if (modalForm) modalForm.reset(); // 폼 내용 초기화 (input, textarea 등)

    // 검색 필드 초기화
    const searchParentInput = document.getElementById('searchParentInput');
    const searchRawInput = document.getElementById('searchRawInput');
    if (searchParentInput) searchParentInput.value = '';
    if (searchRawInput) searchRawInput.value = '';

    // 모달 제목 설정
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = '신규 BOM 등록';

    // 상위 품목 정보 필드 초기화
    const modalParentItemCd = document.getElementById('modalParentItemCd');
    const modalParentItemNm = document.getElementById('modalParentItemNm');
    const modalParentCycleTime = document.getElementById('modalParentCycleTime');
    const modalParentRemark = document.getElementById('modalParentRemark');
    if (modalParentItemCd) modalParentItemCd.value = '';
    if (modalParentItemNm) modalParentItemNm.value = '';
    if (modalParentCycleTime) modalParentCycleTime.value = ''; // 또는 기본값 설정
    if (modalParentRemark) modalParentRemark.value = '';

    clearComponentEditFields(); // 하위 품목 편집 영역 초기화

    // 하위 품목 구성 테이블 초기화
    const bomDetailTbody = document.getElementById('bomDetailTbody');
    if (bomDetailTbody) {
        const colSpan = document.querySelectorAll('#modalForm .bomTab5 thead th').length || 8; // a끔 colSpan 동적 계산
        bomDetailTbody.innerHTML = `<tr><td class="nodata" colspan="${colSpan}">새 BOM에 원자재를 추가하세요.</td></tr>`;
    }
    
    // 품목/원자재 선택 테이블 다시 로드 (이미 로드된 데이터 사용)
    // await loadAllItemsForSelection(); // DOMContentLoaded에서 이미 호출했으므로, 필요 시 선택적 호출
    populateProductSelectionTable(); // 전체 품목 목록으로 (선택된 것 없이)
    populateRawMaterialSelectionTable(); // 전체 원자재 목록으로 (선택된 것 없이)

    // 버튼 상태 설정
    const saveButton = document.querySelector('#modalForm button[name="save"]');
    const editButton = document.querySelector('#modalForm button[name="edit"]');
    if (saveButton) saveButton.style.display = 'inline-flex'; // 등록 버튼 보이기
    if (editButton) editButton.style.display = 'none';    // 수정 버튼 숨기기

    // 모달 표시
    const modalElement = document.getElementById('modal');
    if (modalElement) modalElement.style.display = 'flex';
}

function openDetailModal() { // 상세/수정 모드 진입 시 (fetchBomDetails 성공 후 호출됨)
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'BOM 상세 정보'; // 제목 변경

    // 버튼 상태 설정
    const saveButton = document.querySelector('#modalForm button[name="save"]');
    const editButton = document.querySelector('#modalForm button[name="edit"]');
    if (saveButton) saveButton.style.display = 'none';    // 등록 버튼 숨기기
    if (editButton) editButton.style.display = 'inline-flex'; // 수정 버튼 보이기

    // 모달 표시
    const modalElement = document.getElementById('modal');
    if (modalElement) modalElement.style.display = 'flex';
}

function closeModal(modalId = 'modal') {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
        modalElement.style.display = 'none';
        // 모달 닫을 때 폼 초기화 (선택사항, 필요에 따라)
        const form = modalElement.querySelector('form');
        if (form) form.reset(); // HTML reset()은 input, textarea 등을 초기화

        if (modalId === 'modal') { // 메인 BOM 모달 특정 초기화
            clearComponentEditFields(); // 하위 품목 편집 영역 초기화
            const bomDetailTbody = document.getElementById('bomDetailTbody');
            if (bomDetailTbody) {
                 const colSpan = document.querySelectorAll('#modalForm .bomTab5 thead th').length || 8;
                 bomDetailTbody.innerHTML = `<tr><td class="nodata" colspan="${colSpan}">데이터를 선택하세요.</td></tr>`;
            }
            originalParentItemIdForUpdate = null; // 수정 대상 ID 초기화
            // 상위/하위 품목 선택 테이블도 초기화 (검색어 제거, 선택 해제 등)
            const searchParentInput = document.getElementById('searchParentInput');
            const searchRawInput = document.getElementById('searchRawInput');
            if (searchParentInput) searchParentInput.value = '';
            if (searchRawInput) searchRawInput.value = '';
            populateProductSelectionTable();
            populateRawMaterialSelectionTable();
        }
    }
}

function outsideClick(e, modalId = 'modal') { // 모달 바깥 클릭 시 닫기
    if (e.target.id === modalId) { // 모달 배경 클릭 시
        closeModal(modalId);
    }
}

async function fetchBomDetails(parentItemId) { // 파라미터는 상위 품목의 itemIdx
    console.log("fetchBomDetails 시작, 상위 품목 ID (itemIdx):", parentItemId);
    originalParentItemIdForUpdate = parentItemId; // 수정 시 이 ID를 사용
    if (!parentItemId) {
        console.warn("fetchBomDetails: parentItemId가 제공되지 않았습니다.");
        return;
    }

    // 모달 내 검색 필드 초기화
    const searchParentInput = document.getElementById('searchParentInput');
    const searchRawInput = document.getElementById('searchRawInput');
    if(searchParentInput) searchParentInput.value = '';
    if(searchRawInput) searchRawInput.value = '';

    // 품목/원자재 선택 목록 데이터가 없으면 로드 (보통은 이미 로드되어 있음)
    if (allProductsForSelection.length === 0 || allRawMaterialsForSelection.length === 0) {
        console.log("선택용 품목/원자재 목록이 비어있어 다시 로드합니다.");
        await loadAllItemsForSelection();
    }

    // API 호출: /api/bom/{parentItemIdx}
    fetch(`/api/bom/${parentItemId}`) 
        .then(response => {
            if (response.ok) return response.json();
            if (response.status === 404) { 
                console.warn(`BOM 상세 정보 없음 (404), 상위품목 ID: ${parentItemId}. 신규 등록처럼 처리 시도.`);
                // 해당 parentItemId로 상위 품목 정보만 찾아 기본값으로 채움
                const parentProductInfo = allProductsForSelection.find(p => p.itemIdx == parentItemId);
                if (parentProductInfo) {
                     populateBomDetailsModal({ // 기본 정보만 채움
                        itemIdx: parentProductInfo.itemIdx,
                        itemCd: parentProductInfo.itemCd,
                        itemNm: parentProductInfo.itemNm,
                        cycleTime: null, // 또는 기본값, 서버에서 가져올 수도 있음
                        remark: '',
                        components: [] // 구성품 없음
                    });
                     // 상위 품목 선택 테이블에서 해당 품목을 'checked' 상태로
                     populateProductSelectionTable(allProductsForSelection, parentItemId);
                     populateRawMaterialSelectionTable(); // 원자재는 초기화
                     openDetailModal(); // 수정 모드로 열지만 내용은 비어있거나 기본값
                } else {
                    alert('선택된 상위 품목 정보를 찾을 수 없습니다. 목록을 확인해주세요.');
                    closeModal('modal'); // 상위 품목 정보도 없으면 모달 닫기
                }
                return null; // 404 처리 후 null 반환하여 다음 then 체인에서 data가 null임을 알림
            }
            // 기타 서버 오류 (500 등)
            return response.text().then(text => { throw new Error(`BOM 상세 조회 서버 오류: ${response.status} ${text} - URL: ${response.url}`); });
        })
        .then(data => {
            if (data) { // 성공적으로 BOM 데이터 수신 (null이 아님)
                populateBomDetailsModal(data); // 폼에 데이터 채우기
                populateProductSelectionTable(allProductsForSelection, data.itemIdx);
                populateRawMaterialSelectionTable(); // 하위 품목 선택 테이블은 이미 BOM에 포함된 자재들이 체크됨
                openDetailModal(); // 상세/수정 모드로 모달 열기
            } else if (response && response.status !== 404) { 
                // 404가 아닌데 data가 null인 경우는 위에서 처리되었거나, 예외적인 상황
                console.log("BOM 상세 정보: 데이터가 null이지만 404는 아님. (이미 처리됨)");
            }
        })
        .catch(error => {
            console.error('BOM 상세 정보 조회 실패:', error);
            alert('BOM 상세 정보를 불러오는 중 오류가 발생했습니다: ' + error.message + '\n콘솔을 확인해주세요.');
        });
}


function populateBomDetailsModal(data) { // BOM 상세 데이터로 모달 채우기
    if (!data || data.itemIdx == null) { // data가 null이거나 itemIdx (상위품목 ID)가 없으면 유효하지 않음
        console.error("populateBomDetailsModal: 유효하지 않은 BOM 데이터입니다. 상위 품목 정보가 없습니다.", data); 
        // alert("BOM 정보를 채울 수 없습니다. 상위 품목 데이터가 누락되었습니다.");
        // 필요 시 여기서 폼을 완전히 초기화하거나 사용자에게 명확한 알림
        // closeModal('modal'); // 또는 모달을 닫아버림
        return; 
    }

    // 상위 품목 정보 채우기
    document.getElementById('modalParentItemCd').value = data.itemCd || '';
    document.getElementById('modalParentItemNm').value = data.itemNm || '';
    document.getElementById('modalParentCycleTime').value = data.cycleTime != null ? data.cycleTime : '';
    document.getElementById('modalParentRemark').value = data.remark || '';

    const detailTbody = document.getElementById('bomDetailTbody');
    if(!detailTbody) return;
    detailTbody.innerHTML = ''; // 기존 하위 품목 목록 삭제
    clearComponentEditFields(); // 하위 품목 편집 영역 초기화

    if (!data.components || data.components.length === 0) {
        const colSpan = document.querySelectorAll('#modalForm .bomTab5 thead th').length || 8;
        detailTbody.innerHTML = `<tr><td class="nodata" colspan="${colSpan}">등록된 하위 품목이 없습니다.</td></tr>`;
    } else {
        // data.components 배열 (BOM 구성품 목록)을 사용하여 테이블 채우기
        data.components.forEach(component => {
            // component 객체에 subItemMasterCost가 포함되어 오는지 확인 필요.
            // 없다면, allRawMaterialsForSelection에서 찾아야 함.
            if (component.subItemMasterCost == null) {
                const rawMaterial = allRawMaterialsForSelection.find(rm => rm.itemIdx === component.subItemIdx);
                component.subItemMasterCost = rawMaterial ? rawMaterial.itemCost : 0;
            }
            addComponentToBomTab5(component, data.itemNm); // 상위 품목명(data.itemNm) 전달
        });
    }
    updateBomTab5RowNumbers(); // 행 번호 업데이트
}


function populateProductSelectionTable(list = allProductsForSelection, selectedParentItemId = null) {
    // 상위 품목 선택 테이블(라디오 버튼) 채우기
    const productTbody = document.getElementById('productSelectionTbody');
    if(!productTbody) return;
    productTbody.innerHTML = '';

    // 현재 선택되어야 할 ID 결정 (파라미터 > 현재 체크된 라디오)
    const effectiveSelectedId = selectedParentItemId !== null ? 
                                Number(selectedParentItemId) : 
                                (document.querySelector('input[name="parent-item-select"]:checked') ? 
                                 Number(document.querySelector('input[name="parent-item-select"]:checked').value) : null);

    if (!list || list.length === 0) {
        const colSpan = document.querySelectorAll('#modalForm .bomTab2 table:first-of-type thead th').length || 6;
        productTbody.innerHTML = `<tr><td colspan="${colSpan}" class="nodata">표시할 품목(상위)이 없습니다.</td></tr>`;
        return;
    }

    list.forEach((item) => {
        const isChecked = effectiveSelectedId !== null && Number(item.itemIdx) === effectiveSelectedId;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.itemIdx}</td>
          <td>${item.itemCd || ''}</td>
          <td>${item.itemNm || ''}</td>
          <td>${item.itemSpec || ''}</td>
          <td>${item.unitNm || ''}</td>
          <td><input type="radio" name="parent-item-select" value="${item.itemIdx}" ${isChecked ? 'checked' : ''}></td>
        `;
        productTbody.appendChild(tr);
        // 만약 이 항목이 선택된 항목이라면 (isChecked), 상위 정보 필드도 업데이트
        if (isChecked) {
            handleParentItemSelection(tr.querySelector('input[type="radio"]'));
        }
    });
}


function populateRawMaterialSelectionTable(list = allRawMaterialsForSelection) {
    // 하위 원자재 선택 테이블(체크박스) 채우기
    const rawMaterialTbody = document.getElementById('rawMaterialSelectionTbody');
    if(!rawMaterialTbody) return;
    rawMaterialTbody.innerHTML = '';
    
    const selectedSubItemIdsInBom = getSelectedSubItemIds(); // 현재 BOM 구성 테이블(bomDetailTbody)에 있는 자재 ID들

    if (!list || list.length === 0) {
        const colSpan = document.querySelectorAll('#modalForm .bomTab2 table:last-of-type thead th').length || 6;
        rawMaterialTbody.innerHTML = `<tr><td colspan="${colSpan}" class="nodata">표시할 원자재(하위)가 없습니다.</td></tr>`;
        return;
    }

    list.forEach((item) => {
        // 이 원자재가 이미 BOM 구성 테이블에 포함되어 있다면 체크된 상태로 표시
        const isChecked = selectedSubItemIdsInBom.includes(Number(item.itemIdx));
        const itemMasterCost = item.itemCost != null ? item.itemCost : 0; // 원자재의 기준 단가

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.itemIdx}</td>
          <td>${item.itemCd || ''}</td>
          <td>${item.itemNm || ''}</td>
          <td>${item.itemSpec || ''}</td>
          <td>${item.unitNm || ''}</td>
          <td><input type="checkbox" class="raw-material-checkbox" value="${item.itemIdx}"
                   data-item-cd="${item.itemCd || ''}" data-item-nm="${item.itemNm || ''}"
                   data-unit-nm="${item.unitNm || ''}" data-item-spec="${item.itemSpec || ''}"
                   data-item-cost="${itemMasterCost}" ${isChecked ? 'checked' : ''}></td>
        `;
        rawMaterialTbody.appendChild(tr);
    });
    addRawMaterialCheckboxListeners(); // 테이블 내용 변경 후 이벤트 리스너 다시 연결
}


function addRawMaterialCheckboxListeners() { // 원자재 선택 체크박스 이벤트 리스너 설정
    document.querySelectorAll('#rawMaterialSelectionTbody .raw-material-checkbox').forEach(checkbox => {
        checkbox.removeEventListener('change', handleRawMaterialCheckboxChange); // 중복 리스너 방지
        checkbox.addEventListener('change', handleRawMaterialCheckboxChange);
    });
}

function handleRawMaterialCheckboxChange(event) { // 원자재 체크박스 값 변경 시
    const checkbox = event.target;
    const subItemIdx = Number(checkbox.value);
    const itemCd = checkbox.dataset.itemCd;
    const itemNm = checkbox.dataset.itemNm;
    const unitNm = checkbox.dataset.unitNm;
    const itemMasterCost = parseFloat(checkbox.dataset.itemCost) || 0; // 기준 단가

    clearComponentEditFields(); // 하위 품목 상세/편집 영역 초기화

    if (checkbox.checked) { // 원자재를 BOM에 추가하는 경우
        currentlyEditingComponentState = { // 새 구성품에 대한 상태 초기화
            bomIdx: null, // 아직 서버에 저장된 bom_detail의 PK가 없으므로 null
            subItemIdx: subItemIdx,
            itemCd: itemCd, itemNm: itemNm,
            useQty: 1, unitNm: unitNm, // 기본 소요량 1
            subItemMasterCost: itemMasterCost, // 기준 단가 저장
            lossRt: 0, remark: '', itemFlag: '01', // 원자재 플래그, 기본 로스율 0
            itemPrice: 0 // 단가는 calculateAndDisplayComponentLineCost에서 계산됨
        };
        populateComponentEditFields(currentlyEditingComponentState, null); // 편집 영역 채우기
        
        // BOM 구성 테이블(bomTab5)에 아직 없는 경우에만 추가
        if (!findComponentInBomTab5(subItemIdx)) {
            const parentItemNmEl = document.getElementById('modalParentItemNm');
            const parentItemNmValue = parentItemNmEl ? parentItemNmEl.value : '';
            const newRowData = { ...currentlyEditingComponentState }; // 현재 상태 복사하여 전달
            addComponentToBomTab5(newRowData, parentItemNmValue);
        }
    } else { // 원자재를 BOM에서 제거하는 경우
        removeComponentFromBomTab5(subItemIdx);
        // 만약 제거된 항목이 현재 편집 중이던 항목이면, 편집 영역도 초기화
        const editingSubItemIdxEl = document.getElementById('editingComponentSubItemIdx');
        if (editingSubItemIdxEl && Number(editingSubItemIdxEl.value) === subItemIdx) {
            clearComponentEditFields();
        }
    }
    updateBomTab5RowNumbers(); // 행 번호 업데이트
}


function findComponentInBomTab5(subItemIdxToFind) { // BOM 구성 테이블에서 특정 하위 품목 행 찾기
    const bomDetailTbody = document.getElementById('bomDetailTbody');
    if (!bomDetailTbody) return null;
    return bomDetailTbody.querySelector(`tr[data-sub-item-idx="${subItemIdxToFind}"]`);
}

function addComponentToBomTab5(componentData, parentItemName = '') { // BOM 구성 테이블에 행 추가
    const detailTbody = document.getElementById('bomDetailTbody');
    if (!detailTbody) return;

    const noDataRow = detailTbody.querySelector('td.nodata');
    if (noDataRow) detailTbody.innerHTML = ''; // "데이터 없음" 메시지 행 삭제

    const tr = document.createElement('tr');
    // data-sub-item-idx는 이 하위 품목의 고유 itemIdx
    tr.setAttribute('data-sub-item-idx', String(componentData.subItemIdx));
    // data-bom-idx는 이 특정 BOM 구성 라인의 DB PK (bom_detail_id 등), 신규 시에는 없음
    if (componentData.bomIdx != null) tr.setAttribute('data-bom-idx', componentData.bomIdx); 

    const itemType = componentData.itemFlag === '01' ? '원자재' : 
                     (componentData.itemFlag === '02' ? '제품/반제품' : '기타'); // 품목 구분
    const useQuantity = componentData.useQty != null ? parseFloat(componentData.useQty) : 1;
    const lossRate = componentData.lossRt != null ? parseFloat(componentData.lossRt) : 0;
    // subItemMasterCost는 이 하위 품목 자체의 기준 단가
    const masterCost = componentData.subItemMasterCost != null ? parseFloat(componentData.subItemMasterCost) : 0;
    const remarkText = componentData.remark || '';
    const unitNameText = componentData.unitNm || ''; // 하위 품목의 단위
    const subItemNameText = componentData.subItemNm || ''; // 하위 품목명

    let lineItemPrice = 0; // 이 BOM 구성 라인의 총 단가 (소요량 * 보정단가)
    // itemPrice가 componentData에 명시적으로 있으면 (기존 BOM 데이터 로드 시) 그 값을 우선 사용
    if (componentData.itemPrice != null) { 
        lineItemPrice = parseFloat(componentData.itemPrice);
    } 
    // 없으면 (새로 추가하거나, 기준단가/소요량/로스율로 재계산 필요 시)
    else if (masterCost > 0) { 
        const effectiveLossRate = lossRate / 100;
        if (effectiveLossRate < 1 && (1 - effectiveLossRate) !== 0) { // 로스율 100% 미만
            lineItemPrice = (useQuantity / (1 - effectiveLossRate)) * masterCost;
        } else if (effectiveLossRate >= 1) { // 로스율 100% 이상
            lineItemPrice = Infinity; // 계산 불가 또는 매우 큰 값으로 표시
        } else { // 로스율 0% 또는 유효하지 않은 값
            lineItemPrice = useQuantity * masterCost;
        }
    }
    const roundedLinePrice = isFinite(lineItemPrice) ? Math.round(lineItemPrice) : '계산불가';
    
    const displayParentName = parentItemName || document.getElementById('modalParentItemNm')?.value || '';

    tr.innerHTML = `
        <td class="drag-handle"><span class="material-symbols-outlined">drag_indicator</span></td>
        <td></td> <td>${displayParentName}</td> <td>${subItemNameText} (${itemType})</td> <td><input type="number" class="bom5-input bom5-use-qty" value="${useQuantity}" step="any" oninput="updateLineDataFromBom5Input(this, ${componentData.subItemIdx}, 'useQty')"></td>
        <td><input type="number" class="bom5-input bom5-loss-rt" value="${lossRate}" step="any" oninput="updateLineDataFromBom5Input(this, ${componentData.subItemIdx}, 'lossRt')">%</td>
        <td><input type="number" class="bom5-input bom5-item-price" value="${roundedLinePrice}" ${isFinite(lineItemPrice) ? '' : 'readonly style="color:red;"'} oninput="updateLineDataFromBom5Input(this, ${componentData.subItemIdx}, 'itemPrice', true)">원</td>
        <td><input type="text" class="bom5-input bom5-remark" value="${remarkText}" oninput="updateLineDataFromBom5Input(this, ${componentData.subItemIdx}, 'remark')"></td>
    `;

    // 드래그 핸들 및 이벤트 리스너 설정
    const dragHandle = tr.querySelector('.drag-handle');
    if (dragHandle) {
        dragHandle.setAttribute('draggable', 'true');
        dragHandle.addEventListener('dragstart', handleDragStart);
    }
    // 행 전체에 대한 드래그 관련 이벤트 리스너
    tr.addEventListener('dragover', handleDragOver);
    tr.addEventListener('drop', handleDrop);
    tr.addEventListener('dragenter', handleDragEnter);
    tr.addEventListener('dragleave', handleDragLeave);
    tr.addEventListener('dragend', handleDragEnd);

    // 행 클릭 시 하위 품목 편집 영역에 정보 표시하는 이벤트 리스너
    tr.addEventListener('click', (event) => {
        // 드래그 핸들 또는 input 내부 클릭 시는 제외
        if (event.target.closest('.drag-handle') || event.target.tagName.toLowerCase() === 'input' || draggedRow) {
            event.stopPropagation(); return; 
        }

        const currentSubItemIdx = Number(tr.dataset.subItemIdx);
        // 해당 하위 품목의 원본 마스터 데이터 찾기 (코드, 단위, 기준단가 등 가져오기 위해)
        let originalItemData = allRawMaterialsForSelection.find(i => i.itemIdx === currentSubItemIdx) ||
                               allProductsForSelection.find(i => i.itemIdx === currentSubItemIdx); // 제품/반제품도 하위로 올 수 있음
        
        // componentData (DB에서 로드된 값)의 subItemMasterCost가 있으면 사용, 없으면 originalItemData에서 찾음
        const masterCostForEdit = componentData.subItemMasterCost != null ? componentData.subItemMasterCost : 
                                 (originalItemData ? originalItemData.itemCost : 0);

        const currentRowData = {
            bomIdx: tr.dataset.bomIdx ? Number(tr.dataset.bomIdx) : null, // 이 구성 라인의 고유 ID (DB PK)
            subItemIdx: currentSubItemIdx, // 하위 품목의 itemIdx
            subItemCd: originalItemData ? originalItemData.itemCd : (componentData.subItemCd || ''),
            subItemNm: originalItemData ? originalItemData.itemNm : (componentData.subItemNm || subItemNameText),
            useQty: parseFloat(tr.querySelector('.bom5-use-qty').value),
            unitNm: originalItemData ? originalItemData.unitNm : (componentData.unitNm || unitNameText),
            itemFlag: componentData.itemFlag || (originalItemData ? originalItemData.itemFlag : '01'), // 품목구분
            lossRt: parseFloat(tr.querySelector('.bom5-loss-rt').value),
            itemPrice: parseFloat(tr.querySelector('.bom5-item-price').value) || 0, // 현재 테이블에 표시된 단가
            remark: tr.querySelector('.bom5-remark').value,
            subItemMasterCost: masterCostForEdit // 기준단가 정보를 편집 영역으로 전달
        };
        populateComponentEditFields(currentRowData, tr); // 편집 영역 채우기
    });

    detailTbody.appendChild(tr);
    updateBomTab5RowNumbers(); // 행 추가 후 번호 업데이트
}


function removeComponentFromBomTab5(subItemIdxToRemove) { // BOM 구성 테이블에서 행 삭제
    const rowToRemove = findComponentInBomTab5(subItemIdxToRemove);
    if (rowToRemove) rowToRemove.remove();

    const detailTbody = document.getElementById('bomDetailTbody');
    if (detailTbody && detailTbody.children.length === 0 && !detailTbody.querySelector('td.nodata')) {
        // nodata 메시지 표시 (컬럼 수 동적 계산)
        const colSpan = document.querySelectorAll('#modalForm .bomTab5 thead th').length || 8;
        detailTbody.innerHTML = `<tr><td class="nodata" colspan="${colSpan}">등록된 하위 품목이 없습니다.</td></tr>`;
    }
    updateBomTab5RowNumbers(); // 행 삭제 후 번호 업데이트
}

function clearComponentEditFields() { // 하위 품목 편집 영역 필드 초기화
    document.getElementById('componentItemCd').value = '';
    document.getElementById('componentItemNm').value = '';
    document.getElementById('componentUnitNm').value = '';
    document.getElementById('componentUseQty').value = '1'; // 기본값 1
    document.getElementById('componentItemPrice').value = '0'; // 기본값 0
    document.getElementById('componentLossRt').value = '0'; // 기본값 0
    document.getElementById('componentRemark').value = '';
    document.getElementById('editingComponentBomIdx').value = ''; // 이 구성 라인의 DB ID (bom_detail_id 등)
    document.getElementById('editingComponentSubItemIdx').value = ''; // 이 하위 품목의 item_idx

    currentlyEditingComponentState = { // 전역 편집 상태 객체 초기화
        bomIdx: null, subItemIdx: null, itemCd: '', itemNm: '',
        useQty: 1, unitNm: '', itemPrice: 0, lossRt: 0,
        remark: '', itemFlag: '01', subItemMasterCost: 0
    };
    // BOM 구성 테이블(bomTab5)에서 '선택됨' 표시(CSS 클래스) 제거
    document.querySelectorAll('#bomDetailTbody tr.selected-row-for-edit').forEach(row => {
        row.classList.remove('selected-row-for-edit');
    });
}

function updateBomTab5RowNumbers() { // BOM 구성 테이블 행 번호(No.) 업데이트
    const detailTbody = document.getElementById('bomDetailTbody');
    if (!detailTbody) return;
    const rows = detailTbody.querySelectorAll('tr:not(:has(td.nodata))'); // nodata 메시지 행 제외
    rows.forEach((row, index) => {
        const secondNumberCell = row.querySelector('td:nth-child(2)'); // No. 컬럼 (두 번째 td)
        if (secondNumberCell) secondNumberCell.textContent = index + 1;
    });
}

function populateComponentEditFields(componentData, clickedRow) { // 하위 품목 편집 영역 채우기
    // 다른 행의 '선택됨' CSS 클래스 제거
    document.querySelectorAll('#bomDetailTbody tr.selected-row-for-edit').forEach(row => {
        row.classList.remove('selected-row-for-edit');
    });
    // 현재 클릭된 행에 '선택됨' CSS 클래스 추가 (CSS에서 .selected-row-for-edit 정의 필요)
    if (clickedRow) clickedRow.classList.add('selected-row-for-edit');

    // 전역 편집 상태 객체(currentlyEditingComponentState) 업데이트
    currentlyEditingComponentState = { ...componentData }; // 전달받은 모든 속성 복사
    // 숫자 필드는 확실히 숫자로 변환
    currentlyEditingComponentState.subItemIdx = Number(componentData.subItemIdx || (componentData.itemIdx || null));
    currentlyEditingComponentState.useQty = componentData.useQty != null ? parseFloat(componentData.useQty) : 1;
    currentlyEditingComponentState.lossRt = componentData.lossRt != null ? parseFloat(componentData.lossRt) : 0;
    // itemPrice는 계산된 값이므로, 상태에는 기준단가(subItemMasterCost)를 확실히 저장하는 것이 중요
    currentlyEditingComponentState.subItemMasterCost = componentData.subItemMasterCost != null ? parseFloat(componentData.subItemMasterCost) : 0;
    // currentlyEditingComponentState.itemPrice는 calculateAndDisplayComponentLineCost에 의해 최종 결정됨

    // 편집 영역의 각 input 필드 채우기
    document.getElementById('componentItemCd').value = currentlyEditingComponentState.subItemCd || (componentData.itemCd || '');
    document.getElementById('componentItemNm').value = currentlyEditingComponentState.subItemNm || (componentData.itemNm || '');
    document.getElementById('componentUnitNm').value = currentlyEditingComponentState.unitNm || '';
    document.getElementById('componentUseQty').value = currentlyEditingComponentState.useQty;
    document.getElementById('componentLossRt').value = currentlyEditingComponentState.lossRt;
    document.getElementById('componentRemark').value = currentlyEditingComponentState.remark || '';
    document.getElementById('editingComponentBomIdx').value = currentlyEditingComponentState.bomIdx || ''; // 이 구성 라인의 DB ID
    document.getElementById('editingComponentSubItemIdx').value = currentlyEditingComponentState.subItemIdx || ''; // 하위 품목의 itemIdx

    calculateAndDisplayComponentLineCost(); // 기준단가, 소요량, 로스율을 바탕으로 단가 재계산 및 표시
}


function calculateAndDisplayComponentLineCost() { // 하위 품목 단가(line item price) 계산 및 표시
    const useQtyInput = document.getElementById('componentUseQty');
    const lossRtInput = document.getElementById('componentLossRt');
    const lineAmountDisplayField = document.getElementById('componentItemPrice'); // 단가 표시 필드

    let useQty = parseFloat(useQtyInput?.value) || 0; // 소요량
    let lossRt = parseFloat(lossRtInput?.value) || 0; // 로스율(%)
    // 전역 상태(currentlyEditingComponentState)에서 기준 단가(masterCost) 가져오기
    const masterCost = currentlyEditingComponentState.subItemMasterCost || 0;

    // 입력값 유효성 검사 및 보정
    if (useQty < 0) { if(useQtyInput) useQtyInput.value = 0; useQty = 0; }
    if (lossRt < 0) { if(lossRtInput) lossRtInput.value = 0; lossRt = 0; }
    if (lossRt >= 100) { if(lossRtInput) lossRtInput.value = 99.99; lossRt = 99.99; } // 100% 이상 로스율은 99.99로 제한 (또는 오류 처리)

    let calculatedAmount = 0;
    if (masterCost > 0) { // 기준 단가가 있어야 계산 가능
        const effectiveLossRate = lossRt / 100; // 로스율을 소수로 변환 (예: 5% -> 0.05)
        if (effectiveLossRate < 1 && (1 - effectiveLossRate) !== 0) { // 로스율 100% 미만, 0으로 나누기 방지
            calculatedAmount = (useQty / (1 - effectiveLossRate)) * masterCost;
        } else if (effectiveLossRate >= 1) { // 로스율 100% 또는 그 이상
            calculatedAmount = Infinity; // 계산 불가 또는 매우 큰 값으로 처리
        } else { // 로스율이 0%이거나 유효하지 않은 경우 (예: 음수 로스율은 위에서 0으로 보정됨)
            calculatedAmount = useQty * masterCost;
        }
    }
    
    const roundedAmount = isFinite(calculatedAmount) ? Math.round(calculatedAmount) : '계산불가';
    if (lineAmountDisplayField) lineAmountDisplayField.value = roundedAmount;

    // 전역 상태(currentlyEditingComponentState)의 itemPrice (이 라인의 총 단가) 업데이트
    currentlyEditingComponentState.itemPrice = isFinite(calculatedAmount) ? Math.round(calculatedAmount) : 0; // 상태에는 숫자로 저장

    // BOM 구성 테이블(bomTab5)의 해당 행에도 단가 업데이트
    if (currentlyEditingComponentState.subItemIdx) {
        const rowInBomTab5 = findComponentInBomTab5(currentlyEditingComponentState.subItemIdx);
        if (rowInBomTab5) {
            const itemPriceCellInput = rowInBomTab5.querySelector('.bom5-item-price');
            if (itemPriceCellInput) {
                 itemPriceCellInput.value = roundedAmount;
                 // 계산 불가 시 readonly 및 스타일 변경
                 itemPriceCellInput.readOnly = !isFinite(calculatedAmount);
                 itemPriceCellInput.style.color = isFinite(calculatedAmount) ? '' : 'red';
            }
        }
    }
}


function updateLineDataFromBom5Input(inputElement, subItemIdx, fieldName, isPriceField = false) {
    // BOM 구성 테이블(bomTab5) 내의 input에서 직접 값을 수정했을 때 호출됨
    let value = inputElement.type === 'number' ? parseFloat(inputElement.value) : inputElement.value;
    if (inputElement.type === 'number' && isNaN(value)) value = 0;

    const targetRow = findComponentInBomTab5(subItemIdx); // 수정된 input이 속한 행
    if (!targetRow) return;

    // 현재 하위 품목 상세/편집 영역에서 이 품목을 편집 중인지 확인
    const editingSubItemIdxEl = document.getElementById('editingComponentSubItemIdx');
    const isCurrentlyEditingThisItemInDetailForm = editingSubItemIdxEl && (Number(editingSubItemIdxEl.value) === subItemIdx);

    if (isCurrentlyEditingThisItemInDetailForm) { // 만약 상세 편집 영역과 동기화해야 한다면
        // 상세 편집 영역의 해당 필드 값도 업데이트
        if (fieldName === 'useqty') { document.getElementById('componentUseQty').value = value; currentlyEditingComponentState.useQty = value; }
        if (fieldName === 'lossrt') { document.getElementById('componentLossRt').value = value; currentlyEditingComponentState.lossRt = value; }
        if (fieldName === 'remark') { document.getElementById('componentRemark').value = value; currentlyEditingComponentState.remark = value; }
        
        // 테이블에서 직접 '단가'를 수정한 경우 (isPriceField === true)
        if (fieldName === 'itemprice' && isPriceField) {
            const roundedValue = Math.round(value); // 정수로 반올림
            document.getElementById('componentItemPrice').value = roundedValue;
            currentlyEditingComponentState.itemPrice = roundedValue;
            // 중요: 이 경우, 사용자가 직접 단가를 입력했으므로, 기준단가/소요량/로스율 기반의 자동계산을 덮어쓰는 것으로 간주할 수 있음.
            // 또는, 이 입력 필드를 readonly로 만들고 자동계산만 되도록 하는 정책도 가능. 현재 HTML은 입력 가능.
        }

        // 테이블에서 소요량이나 로스율이 변경된 경우 (그리고 단가를 직접 수정한 경우가 아니면) 상세 편집 영역의 단가도 재계산
        if ((fieldName === 'useqty' || fieldName === 'lossrt') && !isPriceField) {
            calculateAndDisplayComponentLineCost(); // 상세 편집 영역 및 테이블의 단가 필드 모두 업데이트
        }
    } else { 
        // 상세 편집 영역과 별개로, 테이블에서만 값을 변경한 경우
        // (예: 다른 품목이 상세 편집 영역에 로드되어 있을 때 테이블의 다른 행을 직접 수정)
        // 이 경우, 해당 행의 단가는 기준단가를 다시 찾아 재계산해야 함.
        if (fieldName === 'useqty' || fieldName === 'lossrt') {
            const currentUseQty = (fieldName === 'useqty') ? value : parseFloat(targetRow.querySelector('.bom5-use-qty').value) || 0;
            const currentLossRt = (fieldName === 'lossrt') ? value : parseFloat(targetRow.querySelector('.bom5-loss-rt').value) || 0;
            
            // 해당 품목의 기준단가(masterCost)를 찾아야 함.
            // 이상적으로는 addComponentToBomTab5 시점에 `data-master-cost` 등으로 행에 저장해두는 것이 좋음.
            const itemData = allRawMaterialsForSelection.find(i => i.itemIdx === subItemIdx) || 
                             allProductsForSelection.find(i => i.itemIdx === subItemIdx); 
            const masterCostForRow = itemData ? (itemData.itemCost || 0) : 0; // 임시 방편

            let newPrice = 0;
            if (masterCostForRow > 0) {
                const effectiveLossRate = currentLossRt / 100;
                 if (effectiveLossRate < 1 && (1 - effectiveLossRate) !== 0) {
                    newPrice = (currentUseQty / (1 - effectiveLossRate)) * masterCostForRow;
                } else if (effectiveLossRate >=1) { // 로스율 100% 이상
                    newPrice = Infinity;
                } else { // 로스율 0% 또는 유효하지 않음
                    newPrice = currentUseQty * masterCostForRow;
                }
            }
            const priceInputInRow = targetRow.querySelector('.bom5-item-price');
            const roundedNewPrice = isFinite(newPrice) ? Math.round(newPrice) : '계산불가';
            if (priceInputInRow) { // 테이블 행의 단가 필드 직접 업데이트
                priceInputInRow.value = roundedNewPrice;
                priceInputInRow.readOnly = !isFinite(newPrice); // 계산 불가 시 readonly
                priceInputInRow.style.color = isFinite(newPrice) ? '' : 'red'; // 계산 불가 시 색상 변경
            }
        }
        // 테이블에서 비고나 단가를 직접 수정한 경우, 해당 input 값은 이미 변경된 상태.
        // 단, 이 변경이 currentlyEditingComponentState와 자동으로 동기화되지는 않음.
    }
}


async function handleBomSave() { // 신규 BOM 저장
    const selectedParentRadio = document.querySelector('input[name="parent-item-select"]:checked');
    if (!selectedParentRadio) { alert("BOM을 저장할 상위 품목을 선택하세요."); return; }

    const parentItemId = Number(selectedParentRadio.value);
    if (!parentItemId || isNaN(parentItemId)) { alert("선택된 상위 품목의 ID가 유효하지 않습니다."); return; }
    
    const parentCycleTimeEl = document.getElementById('modalParentCycleTime');
    const parentRemarkEl = document.getElementById('modalParentRemark');

    // 생산성(cycleTime) 필드 유효성 검사 (HTML에서 required이지만 JS에서도 확인)
    if (parentCycleTimeEl && parentCycleTimeEl.value.trim() === '') {
        alert("생산성을 입력해주세요.");
        parentCycleTimeEl.focus();
        return;
    }
    const parentCycleTimeValue = parseFloat(parentCycleTimeEl.value);
    if (isNaN(parentCycleTimeValue) || parentCycleTimeValue < 0) { // 숫자가 아니거나 음수인 경우
        alert("유효한 생산성을 입력해주세요 (숫자, 0 이상).");
        parentCycleTimeEl.focus();
        return;
    }


    const bomSaveRequest = {
        parentItemIdx: parentItemId, // 상위 품목의 itemIdx
        parentCycleTime: parentCycleTimeValue,
        parentRemark: parentRemarkEl ? parentRemarkEl.value : '',
        components: [] // 하위 구성품 목록
    };

    const rows = document.querySelectorAll('#bomDetailTbody tr:not(:has(td.nodata))'); // 데이터가 있는 행만
    let isValidForSave = true; // 전체 유효성 플래그
    
    // 하위 품목이 하나도 없는 BOM도 등록 가능한지 정책에 따라 결정.
    // 현재는 하위 품목이 없어도 등록 시도 (서버에서 최종 유효성 검사)
    // if (rows.length === 0) {
    //     alert("하위 품목을 하나 이상 추가해주세요.");
    //     return; // 또는 빈 components 배열로 그대로 진행
    // }

    rows.forEach((row, index) => {
        if (!isValidForSave) return; // 이미 오류 발견 시 더 이상 처리 안 함

        const subItemIdx = Number(row.dataset.subItemIdx);
        // 각 행에서 input 요소들 찾기
        const useQtyInput = row.querySelector('.bom5-use-qty');
        const lossRateInput = row.querySelector('.bom5-loss-rt');
        const itemPriceInput = row.querySelector('.bom5-item-price'); // 이 값은 화면 표시용 계산값
        const remarkInput = row.querySelector('.bom5-remark');

        // 필수 input 요소들이 모두 존재하는지 확인
        if (!subItemIdx || isNaN(subItemIdx) || !useQtyInput || !lossRateInput || !itemPriceInput || !remarkInput) {
            console.error("BOM 저장 오류: 행에서 필수 input 요소를 찾을 수 없습니다.", row);
            isValidForSave = false; 
            return; 
        }
        const useQty = parseFloat(useQtyInput.value);
        // 소요량은 0보다 커야 함 (정책에 따라 0도 허용 가능)
        if (isNaN(useQty) || useQty <= 0) { 
            alert(`"${row.querySelector('td:nth-child(4)')?.textContent || '하위품목'}"의 소요량은 0보다 커야 합니다.`);
            useQtyInput.focus();
            isValidForSave = false;
            return;
        }

        bomSaveRequest.components.push({
            subItemIdx: subItemIdx, // 하위 품목의 itemIdx
            useQty: useQty,
            lossRate: parseFloat(lossRateInput.value) || 0, // NaN이면 0으로
            itemPrice: parseFloat(itemPriceInput.value) || 0, // 화면에 계산된 단가, 서버에서 재검증/재계산 가능
            remark: remarkInput.value || '',
            seqNo: index + 1 // 순서 번호 (1부터 시작)
        });
    });

    if (!isValidForSave) {
        // 이미 위에서 각 필드에 대한 상세 알림이 있었으므로, 추가적인 일반 알림은 생략 가능
        // alert("BOM 데이터에 오류가 있습니다. 각 하위 품목의 정보를 확인해주세요."); 
        return;
    }

    console.log("BOM 저장 요청 데이터:", JSON.stringify(bomSaveRequest, null, 2));

    try {
        const response = await fetch(`/api/bom/save`, { // API 엔드포인트 확인 필요
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bomSaveRequest)
        });
        if (response.ok) {
            alert('BOM이 성공적으로 등록되었습니다.');
            closeModal('modal'); // 성공 시 모달 닫기
            loadMainBomSummaryList(); // 메인 BOM 목록 새로고침
        } else { // HTTP 오류 응답 (4xx, 5xx 등)
            // 서버에서 JSON 형태의 오류 메시지를 보낼 경우 파싱 시도
            const errorData = await response.json().catch(() => ({ message: response.statusText || '알 수 없는 서버 오류' }));
            alert(`BOM 등록 실패: ${errorData.message}`);
        }
    } catch (error) { // 네트워크 오류 등 fetch 자체 실패
        console.error('BOM 등록 중 통신 오류:', error);
        alert('BOM 등록 중 통신 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
    }
}

async function handleBomUpdate() { // BOM 수정
    if (!originalParentItemIdForUpdate) { // 수정 대상 BOM의 상위 품목 ID (itemIdx)
        alert("수정할 대상 BOM이 선택되지 않았습니다. 목록에서 BOM을 선택 후 다시 시도해주세요.");
        return;
    }

    const parentCycleTimeEl = document.getElementById('modalParentCycleTime');
    const parentRemarkEl = document.getElementById('modalParentRemark');

    // 생산성(cycleTime) 필드 유효성 검사
    if (parentCycleTimeEl && parentCycleTimeEl.value.trim() === '') {
        alert("생산성을 입력해주세요.");
        parentCycleTimeEl.focus();
        return;
    }
    const parentCycleTimeValue = parseFloat(parentCycleTimeEl.value);
    if (isNaN(parentCycleTimeValue) || parentCycleTimeValue < 0) {
        alert("유효한 생산성을 입력해주세요 (숫자, 0 이상).");
        parentCycleTimeEl.focus();
        return;
    }


    const bomUpdateRequest = {
        // parentItemIdx는 URL 파라미터로 전달되므로, body에는 보통 포함하지 않음 (API 설계에 따라 다름)
        parentCycleTime: parentCycleTimeValue,
        parentRemark: parentRemarkEl ? parentRemarkEl.value : '',
        components: [] // 수정된 하위 구성품 목록
    };

    const rows = document.querySelectorAll('#bomDetailTbody tr:not(:has(td.nodata))');
    let isValidForUpdate = true; // 전체 유효성 플래그

    // 하위 품목이 없는 상태로의 업데이트(즉, 모든 구성품 삭제)도 유효한 시나리오일 수 있음.
    if (rows.length === 0) {
        if (!confirm("모든 하위 품목이 삭제됩니다. 이대로 BOM을 수정하시겠습니까?")) {
            return; // 사용자가 취소하면 함수 종료
        }
    }

    rows.forEach((row, index) => {
        if (!isValidForUpdate) return;

        const subItemIdx = Number(row.dataset.subItemIdx);
        const useQtyInput = row.querySelector('.bom5-use-qty');
        const lossRateInput = row.querySelector('.bom5-loss-rt');
        const itemPriceInput = row.querySelector('.bom5-item-price');
        const remarkInput = row.querySelector('.bom5-remark');

        if (!subItemIdx || isNaN(subItemIdx) || !useQtyInput || !lossRateInput || !itemPriceInput || !remarkInput) {
            isValidForUpdate = false; return;
        }
        const useQty = parseFloat(useQtyInput.value);
        if (isNaN(useQty) || useQty <= 0) { // 소요량 0 이하 체크
            alert(`"${row.querySelector('td:nth-child(4)')?.textContent || '하위품목'}"의 소요량은 0보다 커야 합니다.`);
            useQtyInput.focus();
            isValidForUpdate = false;
            return;
        }

        bomUpdateRequest.components.push({
            subItemIdx, // 하위 품목의 itemIdx
            useQty: useQty,
            lossRate: parseFloat(lossRateInput.value) || 0,
            itemPrice: parseFloat(itemPriceInput.value) || 0, // 화면 표시 단가
            remark: remarkInput.value || '',
            seqNo: index + 1 // 순서
        });
    });

    if (!isValidForUpdate) {
        // alert("BOM 데이터에 오류가 있어 수정을 진행할 수 없습니다.");
        return;
    }
    
    console.log("BOM 수정 요청 데이터:", JSON.stringify(bomUpdateRequest, null, 2));

    try {
        const response = await fetch(`/api/bom/${originalParentItemIdForUpdate}`, { // URL에 상위 품목 ID 포함
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bomUpdateRequest)
        });
        if (response.ok) {
            alert('BOM이 성공적으로 수정되었습니다.');
            closeModal('modal');
            loadMainBomSummaryList(); // 메인 목록 새로고침
        } else {
            const errorData = await response.json().catch(() => ({ message: response.statusText || '알 수 없는 서버 오류'}));
            alert(`BOM 수정 실패: ${errorData.message}`);
        }
    } catch (error) {
        console.error('BOM 수정 오류:', error);
        alert('BOM 수정 중 통신 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
    }
}


// --- 드래그 앤 드롭 핸들러 ---
function handleDragStart(e) { // 드래그 시작 시
    draggedRow = this.closest('tr'); // 'this'는 드래그 핸들(td)
    if (!draggedRow) { e.preventDefault(); return; } // 드래그 대상 행이 없으면 중단
    e.dataTransfer.effectAllowed = 'move'; // 드롭 효과 설정
    // dataTransfer는 필수는 아니지만, 복잡한 로직 시 데이터 전달용으로 사용 가능
    e.dataTransfer.setData('text/plain', draggedRow.dataset.subItemIdx || 'unknown'); 
    // 드래그 중인 행에 시각적 효과를 주기 위해 클래스 추가 (약간의 지연 후)
    setTimeout(() => { if(draggedRow) draggedRow.classList.add('dragging'); }, 0); 
}
function handleDragOver(e) { // 드롭 가능한 영역 위로 지나갈 때
    e.preventDefault(); // 기본 동작(드롭 방지)을 막아야 drop 이벤트 발생
    e.dataTransfer.dropEffect = 'move'; // 드롭 효과 표시
    return false; // 일부 브라우저 호환성
}
function handleDragEnter(e) { // 드롭 가능한 영역에 들어왔을 때
    e.preventDefault();
    const targetRow = this.closest('tr'); // 'this'는 이벤트가 발생한 행(tr)
    // 자기 자신 위 또는 nodata 행 위에는 'over' 스타일(드롭 위치 표시) 적용 안 함
    if (targetRow && draggedRow && targetRow !== draggedRow && !targetRow.querySelector('td.nodata')) {
        targetRow.classList.add('over'); // 드롭 위치 예상 스타일 적용
    }
}
function handleDragLeave(e) { // 드롭 가능한 영역에서 나갔을 때
    const targetRow = this.closest('tr');
    if (targetRow) targetRow.classList.remove('over'); // 'over' 스타일 제거
}
function handleDrop(e) { // 드롭했을 때 (실제 위치 변경)
    e.stopPropagation(); // 이벤트 전파 중지
    e.preventDefault();  // 기본 동작(예: 링크 이동) 방지
    const targetRow = this.closest('tr'); // 'this'는 드롭된 행(tr)

    // 유효한 드롭인지 확인 (자기 자신 위, nodata 행 위, 드래그된 행이 없을 경우 제외)
    if (!draggedRow || !targetRow || draggedRow === targetRow || targetRow.querySelector('td.nodata')) {
        if(targetRow) targetRow.classList.remove('over'); // 'over' 스타일 정리
        // draggedRow 참조는 handleDragEnd에서 초기화
        return false;
    }
    
    const rect = targetRow.getBoundingClientRect(); // 타겟 행의 위치 및 크기 정보
    const dropY = e.clientY - rect.top; // 타겟 행 내에서의 Y 좌표 (마우스 위치)

    // 타겟 행의 중간보다 위에 드롭했으면 타겟 행의 '앞'에, 아니면 '뒤'에 삽입
    if (dropY < targetRow.offsetHeight / 2) {
        targetRow.parentNode.insertBefore(draggedRow, targetRow);
    } else {
        targetRow.parentNode.insertBefore(draggedRow, targetRow.nextSibling);
    }
    
    targetRow.classList.remove('over'); // 'over' 스타일 정리
    // draggedRow의 'dragging' 클래스는 handleDragEnd에서 일괄 정리
    return false;
}
function handleDragEnd(e) { // 드래그 종료 (성공/실패 여부와 관계없이 항상 호출됨)
    // 모든 행의 'over' 및 'dragging' 스타일 정리
    document.querySelectorAll('#bomDetailTbody tr').forEach(row => {
        row.classList.remove('over', 'dragging');
    });
    updateBomTab5RowNumbers(); // 행 순서 변경 후 번호 다시 매기기
    draggedRow = null; // 드래그된 행 참조 초기화 (중요)
}


function handleParentItemSelection(selectedRadio) { // 상위 품목 라디오 버튼 선택 시
    if (!selectedRadio) return;
    const selectedItemIdx = Number(selectedRadio.value);
    // allProductsForSelection 배열에서 선택된 품목 정보 찾기
    const selectedProduct = allProductsForSelection.find(item => item.itemIdx === selectedItemIdx);

    const modalParentItemCd = document.getElementById('modalParentItemCd');
    const modalParentItemNm = document.getElementById('modalParentItemNm');

    if (selectedProduct) { // 선택된 품목 정보가 있으면 해당 값으로 필드 채우기
        if(modalParentItemCd) modalParentItemCd.value = selectedProduct.itemCd || '';
        if(modalParentItemNm) modalParentItemNm.value = selectedProduct.itemNm || '';
        // 추가적으로, 선택된 상위 품목에 따라 생산성, 비고 등의 기본값을 가져올 수도 있음
        // 예: document.getElementById('modalParentCycleTime').value = selectedProduct.defaultCycleTime || '';
        // 예: document.getElementById('modalParentRemark').value = selectedProduct.defaultRemark || '';
    } else { // 선택된 품목 정보가 없는 경우 (일어나기 어려움)
        if(modalParentItemCd) modalParentItemCd.value = '';
        if(modalParentItemNm) modalParentItemNm.value = '';
    }
}

// --- 분류/단위 관리 모달 열기 함수 ---
// (실제 내용은 bomCategory.js, bomUnit.js에 정의되어 있다고 가정)
function openCategoryModal() {
    const modalCategory = document.getElementById('modal-category');
    if(modalCategory) modalCategory.style.display = 'flex';
    // bomCategory.js의 loadCategories() 함수 호출 (해당 파일에 정의되어 있다고 가정)
    if (typeof loadCategories === "function") { 
        loadCategories(); 
    } else {
        console.warn("loadCategories 함수를 찾을 수 없습니다. bomCategory.js 파일 및 함수 정의를 확인해주세요.");
    }
}
function openSpecModal() { // 단위 관리 모달 (이전엔 Spec으로 되어 있었음)
    const modalSpec = document.getElementById('modal-spec');
    if(modalSpec) modalSpec.style.display = 'flex';
    // bomUnit.js의 loadUnits() 함수 호출 (해당 파일에 정의되어 있다고 가정)
     if (typeof loadUnits === "function") { 
        loadUnits(); 
    } else {
        console.warn("loadUnits 함수를 찾을 수 없습니다. bomUnit.js 파일 및 함수 정의를 확인해주세요.");
    }
}

// 참고: 분류/단위 저장 로직 등은 각 bomCategory.js, bomUnit.js 파일 내에 구현되어야 합니다.
// 예시: document.getElementById('categoryForm').addEventListener('submit', saveCategories);
// 예시: document.getElementById('unitForm').addEventListener('submit', saveOrAddUnit);