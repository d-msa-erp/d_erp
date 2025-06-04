// === 전역 변수 ===
let currentSortBy = 'invTransIdx'; // 현재 정렬 기준 컬럼
let currentOrder = 'desc'; // 현재 정렬 순서 (asc, desc)
let currentPage = 1; // 현재 페이지 번호
let totalPages = 1; // 전체 페이지 수
const pageSize = 10; // 한 페이지에 보여줄 항목 수
let currentInvTransIdxForModal = null; // 모달에서 사용 중인 현재 입고 거래 ID

// 검색 필터 객체
let searchFilters = {
    transDateFrom: '', // 검색 조건: 입고일 시작
    transDateTo: '',   // 검색 조건: 입고일 종료
    itemIdx: '',       // 검색 조건: 품목 ID
    custIdx: '',       // 검색 조건: 거래처 ID
    userIdx: '',       // 검색 조건: 담당자 ID
    whIdx: '',         // 검색 조건: 창고 ID
    transStatus: ''    // 검색 조건: 입고 상태
};

// 데이터리스트용 데이터 배열 (검색 영역)
let searchItemsData = [];      // 품목 목록
let searchCustsData = [];      // 거래처 목록
let searchWarehousesData = []; // 창고 목록
let searchManagersData = [];   // 담당자 목록

// 데이터리스트용 데이터 배열 (모달 영역)
let modalItemsData = [];      // 품목 목록
let modalCustsData = [];      // 거래처 목록
let modalWarehousesData = []; // 창고 목록
let modalManagersData = [];   // 담당자 목록

// === UI 컨트롤 요소 가져오기 ===
const receivingTableBody = document.querySelector('#receivingTable tbody');
const selectAllCheckboxes = document.getElementById('selectAllCheckboxes'); // 전체 선택 체크박스
const searchButton = document.getElementById('searchButton'); // 검색 버튼
const resetSearchButton = document.getElementById('resetSearchButton'); // 검색 초기화 버튼
const newRegistrationButton = document.getElementById('newRegistrationButton'); // 신규 등록 버튼
const deleteButton = document.getElementById('deleteButton'); // 삭제 버튼
const modal = document.getElementById('receivingModal'); // 모달
const modalTitle = document.getElementById('modalTitle'); // 모달 제목
const modalForm = document.getElementById('modalForm'); // 모달 폼
const saveButton = modalForm.querySelector('button[name="save"]'); // 모달 저장 버튼
const editButton = modalForm.querySelector('button[name="edit"]'); // 모달 수정 버튼
const totalRecordsSpan = document.getElementById('totalRecords'); // 총 레코드 수 표시
const currentPageSpan = document.getElementById('currentPage'); // 현재 페이지 번호 표시
const totalPagesSpan = document.getElementById('totalPages'); // 전체 페이지 수 표시
const pageNumberInput = document.getElementById('pageNumberInput'); // 페이지 번호 직접 입력
const btnFirstPage = document.getElementById('btn-first-page'); // 첫 페이지 버튼
const btnPrevPage = document.getElementById('btn-prev-page'); // 이전 페이지 버튼
const btnNextPage = document.getElementById('btn-next-page'); // 다음 페이지 버튼
const btnLastPage = document.getElementById('btn-last-page'); // 마지막 페이지 버튼

// 검색 필드 입력 요소
const searchTransDateFromInput = document.getElementById('searchTransDateFrom');
const searchTransDateToInput = document.getElementById('searchTransDateTo');
const searchItemNmInput = document.getElementById('searchItemNm');
const searchHiddenItemIdxInput = document.getElementById('searchHiddenItemIdx');
const searchCustNmInput = document.getElementById('searchCustNm');
const searchHiddenCustIdxInput = document.getElementById('searchHiddenCustIdx');
const searchUserNmInput = document.getElementById('searchUserNm');
const searchHiddenUserIdxInput = document.getElementById('searchHiddenUserIdx');
const searchWhNmInput = document.getElementById('searchWhNm');
const searchHiddenWhIdxInput = document.getElementById('searchHiddenWhIdx');
const searchTransStatusSelect = document.getElementById('searchTransStatus');

// 모달 입력 요소
const modalTransCode = document.getElementById('modalTransCode');
const modalTransDate = document.getElementById('modalTransDate');
const modalTransQty = document.getElementById('modalTransQty');
const modalUnitPrice = document.getElementById('modalUnitPrice');
const modalRemark = document.getElementById('modalRemark');
const modalTransStatusSelect = document.getElementById('modalTransStatus');
const modalInvTransIdx = document.getElementById('modalInvTransIdx');
const modalTransStatusGroup = document.getElementById('modalTransStatusGroup'); // 모달 내 상태 선택 그룹

const modalCustNmInput = document.getElementById('modalCustNm');
const modalHiddenCustIdxInput = document.getElementById('modalHiddenCustIdx');
const modalItemNmInput = document.getElementById('modalItemNm');
const modalHiddenItemIdxInput = document.getElementById('modalHiddenItemIdx');
const modalWhNmInput = document.getElementById('modalWhNm');
const modalHiddenWhIdxInput = document.getElementById('modalHiddenWhIdx');
const modalUserNmInput = document.getElementById('modalUserNm');
const modalHiddenUserIdxInput = document.getElementById('modalHiddenUserIdx');

// === 날짜 범위 검증 함수 ===
function setupDateRangeValidation() {
    if (!searchTransDateFromInput || !searchTransDateToInput) {
        console.warn('날짜 입력 필드를 찾을 수 없습니다.');
        return;
    }

    // 시작 날짜 변경 시 종료 날짜의 최소값 설정
    searchTransDateFromInput.addEventListener('change', function() {
        const fromDate = this.value;
        if (fromDate) {
            // 종료 날짜의 최소값을 시작 날짜로 설정
            searchTransDateToInput.min = fromDate;
            
            // 만약 현재 종료 날짜가 시작 날짜보다 이전이라면 초기화
            if (searchTransDateToInput.value && searchTransDateToInput.value < fromDate) {
                searchTransDateToInput.value = '';
            }
        } else {
            // 시작 날짜가 비어있으면 종료 날짜의 최소값 제한 해제
            searchTransDateToInput.removeAttribute('min');
        }
    });

    // 종료 날짜 변경 시 시작 날짜의 최대값 설정
    searchTransDateToInput.addEventListener('change', function() {
        const toDate = this.value;
        if (toDate) {
            // 시작 날짜의 최대값을 종료 날짜로 설정
            searchTransDateFromInput.max = toDate;
            
            // 만약 현재 시작 날짜가 종료 날짜보다 이후라면 초기화
            if (searchTransDateFromInput.value && searchTransDateFromInput.value > toDate) {
                searchTransDateFromInput.value = '';
            }
        } else {
            // 종료 날짜가 비어있으면 시작 날짜의 최대값 제한 해제
            searchTransDateFromInput.removeAttribute('max');
        }
    });
}

// === 계산된 필드 정렬을 위한 함수 ===
function sortTableByTotalAmount(data, order) {
    return data.sort((a, b) => {
        const totalA = (parseFloat(a.transQty) || 0) * (parseFloat(a.unitPrice) || 0);
        const totalB = (parseFloat(b.transQty) || 0) * (parseFloat(b.unitPrice) || 0);
        return order === 'asc' ? totalA - totalB : totalB - totalA;
    });
}

// === 테이블 데이터 로드 함수 ===
async function loadReceivingTable(page = currentPage, sortBy = currentSortBy, sortDirection = currentOrder, filters = searchFilters) {
    currentPage = page;
    currentSortBy = sortBy;
    currentOrder = sortDirection;
    searchFilters = filters;
    receivingTableBody.innerHTML = ''; // 테이블 내용 초기화

    // 총액 정렬인 경우 서버에서 정렬하지 않고 클라이언트에서 처리
    let serverSortBy = sortBy;
    let serverSortDirection = sortDirection;
    let isClientSideSort = false;
    
    if (sortBy === 'totalAmount') {
        // 총액 정렬은 클라이언트에서 처리하므로 서버에는 기본 정렬로 요청
        serverSortBy = 'invTransIdx';
        serverSortDirection = 'desc';
        isClientSideSort = true;
    }

    // API 요청을 위한 쿼리 파라미터 구성
    const queryParams = new URLSearchParams({
        page: currentPage,
        size: pageSize,
        sortBy: serverSortBy,
        sortDirection: serverSortDirection,
        ...(filters.transDateFrom && { transDateFrom: filters.transDateFrom }),
        ...(filters.transDateTo && { transDateTo: filters.transDateTo }),
        ...(filters.itemIdx && { itemIdx: filters.itemIdx }),
        ...(filters.custIdx && { custIdx: filters.custIdx }),
        ...(filters.userIdx && { userIdx: filters.userIdx }),
        ...(filters.whIdx && { whIdx: filters.whIdx }),
        ...(filters.transStatus && { transStatus: filters.transStatus }),
    });

    try {
        const response = await fetch(`/api/inv-transactions?${queryParams.toString()}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`입고 목록 조회 오류: HTTP 상태 ${response.status}`, errorText);
            throw new Error(`HTTP 오류! 상태: ${response.status}, 메시지: ${errorText}`);
        }
        const responseData = await response.json();
        let invTransactions = responseData.content || []; // 입고 거래 목록
        totalPages = responseData.totalPages || 1; // 전체 페이지 수 업데이트
        const totalElements = responseData.totalElements || 0; // 전체 항목 수 업데이트

        // 클라이언트 사이드 정렬 (총액)
        if (isClientSideSort && invTransactions.length > 0) {
            invTransactions = sortTableByTotalAmount(invTransactions, sortDirection);
        }

        // 페이지네이션 정보 업데이트
        totalRecordsSpan.textContent = totalElements;
        currentPageSpan.textContent = currentPage;
        totalPagesSpan.textContent = totalPages;
        pageNumberInput.value = currentPage;
        btnFirstPage.disabled = currentPage === 1;
        btnPrevPage.disabled = currentPage === 1;
        btnNextPage.disabled = currentPage === totalPages || totalPages === 0;
        btnLastPage.disabled = currentPage === totalPages || totalPages === 0;
        pageNumberInput.max = totalPages > 0 ? totalPages : 1;

        if (invTransactions.length === 0) {
            displayNoDataMessage(receivingTableBody, 11); // 데이터 없음 메시지 표시
            return;
        }

        // 테이블 행 생성 및 데이터 바인딩
        invTransactions.forEach(trans => {
            const row = document.createElement('tr');
            row.dataset.invTransIdx = trans.invTransIdx; // 행에 ID 저장 (상세보기 시 사용)
            const totalAmount = (trans.transQty && trans.unitPrice) ? (parseFloat(trans.transQty) * parseFloat(trans.unitPrice)) : 0; // 총액 계산

            row.innerHTML = `
                <td><input type="checkbox" class="trans-checkbox" data-inv-trans-idx="${trans.invTransIdx}" /></td>
                <td>${trans.invTransCode || ''}</td>
                <td>${formatDate(trans.transDate) || ''}</td>
                <td>${trans.itemNm || ''} ${trans.itemCd ? '(' + trans.itemCd + ')' : ''}</td>
                <td>${trans.custNm || ''}</td>
                <td>${trans.transQty !== null ? Number(trans.transQty).toLocaleString() : '0'}</td>
                <td>${trans.unitPrice !== null ? Number(trans.unitPrice).toLocaleString() : '0'}</td>
                <td>${totalAmount.toLocaleString()}</td>
                <td>${trans.whNm || ''}</td>
                <td>${trans.userNm || '미지정'}</td>
                <td>${getTransStatusText(trans.transStatus) || ''}</td>
            `;
            // 행 클릭 시 상세 정보 모달 열기 (체크박스 클릭 제외)
            row.addEventListener('click', (event) => {
                if (event.target.type === 'checkbox') return;
                openModal('view', trans.invTransIdx);
            });
            receivingTableBody.appendChild(row);
        });

        // 정렬 화살표 업데이트
        updateSortArrows(sortBy, sortDirection);

    } catch (error) {
        console.error('입고 데이터 로드 중 오류:', error);
        displayNoDataMessage(receivingTableBody, 11, true); // 오류 메시지 표시
    }
}

// 정렬 화살표 업데이트 함수
function updateSortArrows(sortBy, sortDirection) {
    // 모든 정렬 화살표 초기화
    document.querySelectorAll('#receivingTable thead th .sort-arrow').forEach(arrow => {
        arrow.textContent = '↓';
        arrow.classList.remove('active');
    });

    // 현재 정렬 컬럼의 화살표 활성화
    const currentThArrow = document.querySelector(`#receivingTable thead th[data-sort-by="${sortBy}"] .sort-arrow`);
    if (currentThArrow) {
        currentThArrow.textContent = sortDirection === 'asc' ? '↑' : '↓';
        currentThArrow.classList.add('active');
    }
}

// 테이블에 "데이터 없음" 또는 "오류 발생" 메시지를 표시하는 함수
function displayNoDataMessage(tableBodyElement, colspanCount, isError = false) {
    const message = isError ? '데이터를 불러오는 중 오류가 발생했습니다.' : '등록된 데이터가 없습니다.';
    tableBodyElement.innerHTML = `<tr><td class="nodata" colspan="${colspanCount}" style="color: ${isError ? 'red' : '#666'}; padding: 20px;">${message}</td></tr>`;
}

// 테이블 헤더 클릭 시 정렬 기능
document.querySelectorAll('#receivingTable thead th[data-sort-by]').forEach(th => {
    th.addEventListener('click', function() { order(this); });
});

function order(thElement) {
    const newSortBy = thElement.dataset.sortBy;
    if (!newSortBy) return; // 정렬 기준 컬럼이 없으면 중단

    if (currentSortBy === newSortBy) {
        currentOrder = currentOrder === 'asc' ? 'desc' : 'asc'; // 정렬 순서 변경
    } else {
        currentSortBy = newSortBy; // 정렬 기준 변경
        currentOrder = 'asc'; // 기본 오름차순
    }

    loadReceivingTable(1, currentSortBy, currentOrder, searchFilters); // 변경된 정렬 기준으로 테이블 다시 로드
}

// 모달 열기 함수 (신규 등록/상세 보기)
async function openModal(mode, invTransIdx = null) {
    modalForm.reset(); // 폼 초기화
    currentInvTransIdxForModal = invTransIdx; // 현재 모달에서 사용하는 ID 업데이트

    // 모든 입력 필드 초기화 및 유효성 메시지 제거
    [modalCustNmInput, modalHiddenCustIdxInput, modalItemNmInput, modalHiddenItemIdxInput,
     modalWhNmInput, modalHiddenWhIdxInput, modalUserNmInput, modalHiddenUserIdxInput]
     .forEach(input => {
         input.value = '';
         if(input.type !== 'hidden') input.setCustomValidity('');
     });

    saveButton.style.display = 'none'; // 저장 버튼 숨김
    editButton.style.display = 'none'; // 수정 버튼 숨김
    modalTransCode.readOnly = true; // 입고 코드 필드 읽기 전용
    // modalTransStatusGroup.style.display = 'none'; // 상태 선택 그룹 숨김 (아래에서 모드별로 제어)

    try {
        // 모달용 데이터리스트 데이터 로드 (품목은 거래처에 따라 동적 로드될 수 있음)
        await loadModalDatalistData();
    } catch (error) {
        console.error("모달용 Datalist 로드 중 에러:", error);
    }

    if (mode === 'new') { // 신규 등록 모드
        modalTitle.textContent = '신규 입고 등록';
        saveButton.style.display = 'block'; // 저장 버튼 표시
        modalTransCode.value = '자동 생성'; // 입고 코드 기본값
        modalTransDate.value = new Date().toISOString().substring(0, 10); // 입고일 기본값 (오늘)
        modalInvTransIdx.value = ''; // ID 필드 초기화
        modalTransStatusGroup.style.display = 'flex'; // 상태 선택 그룹 표시
        modalTransStatusSelect.value = 'R1'; // 상태 기본값 'R1' (입고전) 설정

        // 신규 등록 모드에서는 모든 필드가 입력 가능하도록 설정 (거래 코드 제외)
        const allInputs = modalForm.querySelectorAll('input:not([type="hidden"]), textarea, select');
        allInputs.forEach(input => {
            if (input.tagName === 'SELECT') {
                input.disabled = false;
            } else {
                input.readOnly = false;
            }
        });
        
        // 거래 코드만 읽기 전용으로 설정
        modalTransCode.readOnly = true;

        // `loadModalDatalistData`에서 모든 품목을 초기에 로드함.
        // `modalCustNmInput`의 change 이벤트 리스너가 거래처 선택 시 품목 필터링을 처리함.
    } else if (mode === 'view' && invTransIdx !== null) { // 상세 보기 (수정) 모드
        editButton.style.display = 'block'; // 수정 버튼 표시
        modalTransStatusGroup.style.display = 'flex'; // 상태 선택 그룹 표시

        try {
            const response = await fetch(`/api/inv-transactions/${invTransIdx}`);
            if (!response.ok) {
                throw new Error(`HTTP 오류! 상태: ${response.status}, 메시지: ${await response.text()}`);
            }
            const transaction = await response.json(); // 상세 정보 가져오기

            // 거래처가 있는 경우, 해당 거래처의 품목으로 모달 품목 리스트를 다시 로드
            if (transaction.custIdx) {
                await loadModalItemsDatalist(transaction.custIdx);
            } else {
                // 거래처가 없는 경우, 모든 품목을 로드 (이전에 필터링 되었을 수 있으므로)
                await loadModalItemsDatalist();
            }

            // 폼 필드에 데이터 채우기
            modalInvTransIdx.value = transaction.invTransIdx || '';
            modalTransCode.value = transaction.invTransCode || '';
            modalTransDate.value = formatDateToInput(transaction.transDate) || '';
            modalTransQty.value = transaction.transQty || '';
            modalUnitPrice.value = transaction.unitPrice || '';
            modalRemark.value = transaction.remark || transaction.invTransRemark || ''; // API 응답 필드명에 따라 remark 또는 invTransRemark 사용
            modalTransStatusSelect.value = transaction.transStatus || '';

            // 데이터리스트 관련 필드 값 설정
            setModalDatalistValue('modalCustNm', 'modalHiddenCustIdx', modalCustsData, transaction.custIdx);
            setModalDatalistValue('modalItemNm', 'modalHiddenItemIdx', modalItemsData, transaction.itemIdx); // modalItemsData는 위에서 custIdx에 따라 업데이트됨
            setModalDatalistValue('modalWhNm', 'modalHiddenWhIdx', modalWarehousesData, transaction.whIdx);
            setModalDatalistValue('modalUserNm', 'modalHiddenUserIdx', modalManagersData, transaction.userIdx);

            // 주문과 연결되어 있는지 확인하여 모달 제목 및 필드 제어
            const orderCode = transaction.orderCode;
            if (orderCode && (orderCode.charAt(0) === 'S' || orderCode.charAt(0) === 'P')) {
                // 주문과 연결된 경우: 제목을 "주문번호 : 주문번호" 형식으로 변경
                modalTitle.textContent = `주문번호 : ${orderCode}`;
                
                // 상태를 제외한 모든 입력 필드를 readonly로 설정
                const allInputs = modalForm.querySelectorAll('input:not([type="hidden"]), textarea');
                allInputs.forEach(input => {
                    input.readOnly = true;
                });
                
                // 모든 select 요소를 찾아서 상태 select를 제외하고 disabled 설정
                const allSelects = modalForm.querySelectorAll('select');
                allSelects.forEach(select => {
                    if (select !== modalTransStatusSelect) {
                        select.disabled = true;
                    }
                });
                
                // 상태 선택은 활성화 상태로 유지
                modalTransStatusSelect.disabled = false;
                
                console.log(`주문 코드(${orderCode})와 연결된 입고 - 상태만 변경 가능`);
            } else {
                // 주문과 연결되지 않은 경우: 기존 제목 유지
                modalTitle.textContent = '입고 상세 정보';
                
                // 모든 필드 수정 가능 (거래 코드 제외)
                const allInputs = modalForm.querySelectorAll('input:not([type="hidden"]), textarea, select');
                allInputs.forEach(input => {
                    if (input.tagName === 'SELECT') {
                        input.disabled = false;
                    } else {
                        input.readOnly = false;
                    }
                });
                
                // 거래 코드만 읽기 전용으로 유지
                modalTransCode.readOnly = true;
            }

            // 모든 경우에서 상태 선택은 항상 수정 가능하도록 보장
            modalTransStatusSelect.disabled = false;

        } catch (error) {
            console.error('입고 상세 정보 로드 오류:', error);
            alert('입고 정보를 불러오는데 실패했습니다: ' + error.message);
            closeModal(); // 오류 발생 시 모달 닫기
            return;
        }
    } else {
        alert('모달을 여는 중 오류가 발생했습니다.');
        return;
    }
    modal.style.display = 'flex'; // 모달 표시
}

// 모달 닫기 함수
function closeModal() {
    modal.style.display = 'none'; // 모달 숨김
    modalForm.reset(); // 폼 초기화
    currentInvTransIdxForModal = null; // 현재 모달 ID 초기화
    
    // 유효성 메시지 초기화
    [modalCustNmInput, modalItemNmInput, modalWhNmInput, modalUserNmInput, modalTransStatusSelect].forEach(input => {
        input.setCustomValidity('');
        if (input.tagName === 'SELECT') input.selectedIndex = 0; // Selectbox는 첫번째 옵션으로 (예: "상태를 선택해주세요")
    });

    // readonly/disabled 상태 초기화 (다음 모달 열기를 위해)
    const allInputs = modalForm.querySelectorAll('input:not([type="hidden"]), textarea, select');
    allInputs.forEach(input => {
        if (input.tagName === 'SELECT') {
            input.disabled = false;
        } else {
            input.readOnly = false;
        }
    });
    
    // 입고 코드 필드는 항상 readonly로 유지
    modalTransCode.readOnly = true;

    // 모달이 닫힐 때, 다음 사용을 위해 모달 품목 리스트를 전체 품목으로 리셋 (선택 사항)
    loadModalItemsDatalist().catch(err => console.error("모달 닫을 때 품목 리스트 리셋 오류:", err));
}

// 모달 외부 클릭 시 닫기
function outsideClick(e) {
    if (e.target.id === 'receivingModal') {
        closeModal();
    }
}

// === 데이터리스트 로드 함수 (검색 필드 - 품목) ===
async function loadSearchItemsDatalist(custIdx = null) {
    let itemApiUrl = '/api/items/active-for-selection';
    // custIdx가 유효한 값일 경우, URL에 추가 (숫자 또는 문자열 ID 처리)
    if (custIdx !== null && custIdx !== undefined && String(custIdx).trim() !== '') {
        itemApiUrl += `?custIdx=${encodeURIComponent(String(custIdx))}`;
    }
    try {
        const itemResponse = await fetch(itemApiUrl);
        if (itemResponse.ok) {
            searchItemsData = await itemResponse.json();
        } else {
            console.error('검색용 품목 목록 조회 오류:', await itemResponse.text());
            searchItemsData = [];
        }
    } catch (error) {
        console.error("검색용 품목 데이터리스트 로드 실패:", error);
        searchItemsData = [];
    }
    populateDatalist('searchItemsDatalist', searchItemsData, 'itemNm', 'itemCd', 'itemIdx');
}

// === 데이터리스트 로드 함수 (모달용 - 품목) ===
async function loadModalItemsDatalist(custIdx = null) {
    let itemApiUrl = '/api/items/active-for-selection';
    // custIdx가 유효한 값일 경우, URL에 추가 (숫자 또는 문자열 ID 처리)
    if (custIdx !== null && custIdx !== undefined && String(custIdx).trim() !== '') {
        itemApiUrl += `?custIdx=${encodeURIComponent(String(custIdx))}`;
    }
    try {
        const itemResponse = await fetch(itemApiUrl);
        if (itemResponse.ok) {
            modalItemsData = await itemResponse.json();
        } else {
            console.error('모달용 품목 목록 조회 오류:', await itemResponse.text());
            modalItemsData = [];
        }
    } catch (error) {
        console.error("모달용 품목 데이터리스트 로드 실패:", error);
        modalItemsData = [];
    }
    populateDatalist('modalItemsDatalist', modalItemsData, 'itemNm', 'itemCd', 'itemIdx');
}

// === 데이터리스트 로드 함수 (검색용 - 품목 외) ===
async function loadSearchDatalistData() {
    try {
        await Promise.all([
            loadSearchItemsDatalist(), // 검색용 전체 품목 초기 로드
            (async () => {
                const custResponse = await fetch('/api/customers/active-for-selection?bizFlag=01'); // bizFlag=01 (매입처)
                if (custResponse.ok) searchCustsData = await custResponse.json();
                else console.error('검색용 거래처 목록 조회 오류:', await custResponse.text());
                populateDatalist('searchCustsDatalist', searchCustsData, 'custNm', 'custCd', 'custIdx');
            })(),
            (async () => {
                const warehouseResponse = await fetch('/api/warehouses/active-for-selection');
                if (warehouseResponse.ok) searchWarehousesData = await warehouseResponse.json();
                else console.error('검색용 창고 목록 조회 오류:', await warehouseResponse.text());
                populateDatalist('searchWarehousesDatalist', searchWarehousesData, 'whNm', 'whCd', 'whIdx');
            })(),
            (async () => {
                const managerResponse = await fetch('/api/users/active-for-selection');
                if (managerResponse.ok) searchManagersData = await managerResponse.json();
                else console.error('검색용 담당자 목록 조회 오류:', await managerResponse.text());
                populateDatalist('searchManagersDatalist', searchManagersData, 'userNm', 'userId', 'userIdx');
            })()
        ]);
    } catch (error) {
        console.error("검색용 데이터리스트 로드 실패:", error);
    }
}

// === 데이터리스트 로드 함수 (모달용 - 전체) ===
async function loadModalDatalistData() {
    try {
        // 모달용 품목 리스트를 먼저 로드 (초기에는 전체 품목)
        const loadItemsPromise = loadModalItemsDatalist();

        // 나머지 모달용 데이터리스트 (거래처, 창고, 담당자) 병렬 로드
        const [custRes, warehouseRes, managerRes] = await Promise.all([
            fetch('/api/customers/active-for-selection?bizFlag=01'), // bizFlag=01 (매입처)
            fetch('/api/warehouses/active-for-selection'),
            fetch('/api/users/active-for-selection')
        ]);

        // 품목 로드가 완료될 때까지 대기
        await loadItemsPromise;

        // 각 API 응답 처리 및 데이터리스트 채우기
        if (custRes.ok) modalCustsData = await custRes.json();
        else console.error('모달용 거래처 목록 조회 오류:', await custRes.text());

        if (warehouseRes.ok) modalWarehousesData = await warehouseRes.json();
        else console.error('모달용 창고 목록 조회 오류:', await warehouseRes.text());

        if (managerRes.ok) modalManagersData = await managerRes.json();
        else console.error('모달용 담당자 목록 조회 오류:', await managerRes.text());

        // `populateDatalist`는 각 `load...ItemsDatalist` 함수 내부 또는 여기서 호출
        // 품목은 `loadModalItemsDatalist` 내부에서 이미 `populateDatalist`가 호출됨
        populateDatalist('modalCustsDatalist', modalCustsData, 'custNm', 'custCd', 'custIdx');
        populateDatalist('modalWarehousesDatalist', modalWarehousesData, 'whNm', 'whCd', 'whIdx');
        populateDatalist('modalManagersDatalist', modalManagersData, 'userNm', 'userId', 'userIdx');

    } catch (error) {
        console.error("모달용 데이터리스트 로드 실패:", error);
    }
}

// 데이터리스트에 <option> 요소를 채우는 함수
function populateDatalist(datalistId, dataArray, displayField, codeField, idxField) {
    const datalist = document.getElementById(datalistId);
    if (!datalist) {
        console.warn(`Datalist ID '${datalistId}'를 찾을 수 없습니다.`);
        return;
    }
    datalist.innerHTML = ''; // 기존 옵션 초기화
    if (!Array.isArray(dataArray)) {
        console.warn(`'${datalistId}'에 대한 데이터가 배열이 아닙니다.`);
        return;
    }
    dataArray.forEach(item => {
        const option = document.createElement('option');
        const displayValue = item[displayField] || 'N/A'; // 표시될 값
        const codeValue = item[codeField] || 'N/A';       // 코드 값 (괄호 안에 표시)
        option.value = `${displayValue} (${codeValue})`;   // <option>의 실제 값
        option.dataset.idx = item[idxField];               // data-idx 속성에 ID 저장
        datalist.appendChild(option);
    });
}

// 데이터리스트 입력 필드에 대한 이벤트 리스너 설정 함수
function setupDatalistInputListener(inputId, hiddenInputId, displayField, codeField, idxField, required = false) {
    const inputElement = document.getElementById(inputId); // 화면에 보이는 입력 필드
    const hiddenInputElement = document.getElementById(hiddenInputId); // 실제 ID 값을 저장할 숨겨진 필드

    if (!inputElement || !hiddenInputElement) {
        console.warn(`데이터리스트 설정 오류: ${inputId} 또는 ${hiddenInputId} 요소를 찾을 수 없습니다.`);
        return;
    }
    if (required) inputElement.required = true; // 필수 입력 필드 설정

    const handler = () => {
        const inputValue = inputElement.value; // 사용자가 입력하거나 선택한 값
        let currentDatalistArray; // 현재 입력 필드에 해당하는 데이터리스트 배열

        // 입력 필드 ID에 따라 사용할 데이터리스트 배열 결정
        if (inputId.startsWith('search')) { // 검색 영역
            if (inputId.includes('Item')) currentDatalistArray = searchItemsData;
            else if (inputId.includes('Cust')) currentDatalistArray = searchCustsData;
            else if (inputId.includes('Wh')) currentDatalistArray = searchWarehousesData;
            else if (inputId.includes('Manager') || inputId.includes('User')) currentDatalistArray = searchManagersData;
        } else { // 모달 영역
            if (inputId.includes('Item')) currentDatalistArray = modalItemsData;
            else if (inputId.includes('Cust')) currentDatalistArray = modalCustsData;
            else if (inputId.includes('Wh')) currentDatalistArray = modalWarehousesData;
            else if (inputId.includes('Manager') || inputId.includes('User')) currentDatalistArray = modalManagersData;
        }
        currentDatalistArray = currentDatalistArray || []; // 데이터리스트가 비어있을 경우 빈 배열로 초기화

        // 데이터리스트가 비어있고 사용자가 뭔가를 입력한 경우
        if (!Array.isArray(currentDatalistArray) || currentDatalistArray.length === 0 && inputValue.trim() !== '') {
            hiddenInputElement.value = '';
            if (required) inputElement.setCustomValidity('선택할 목록이 없거나 로딩 중입니다.');
            else inputElement.setCustomValidity('');
            return;
        }

        // 입력된 값과 일치하는 항목을 데이터리스트에서 찾기
        const matchedItem = currentDatalistArray.find(data => `${data[displayField] || ''} (${data[codeField] || ''})` === inputValue);

        if (matchedItem) { // 일치하는 항목이 있는 경우
            hiddenInputElement.value = matchedItem[idxField]; // 숨겨진 필드에 ID 값 설정
            inputElement.setCustomValidity(''); // 유효성 메시지 제거
        } else { // 일치하는 항목이 없는 경우
            hiddenInputElement.value = ''; // ID 값 초기화
            if (inputValue.trim() !== '') { // 사용자가 뭔가를 입력했지만 목록에 없는 경우
                inputElement.setCustomValidity('목록에 있는 유효한 항목을 선택하거나, 입력 값을 확인해주세요.');
            } else if (required) { // 필수 입력 필드인데 값이 없는 경우
                inputElement.setCustomValidity('필수 항목입니다. 목록에서 항목을 선택해주세요.');
            } else { // 선택 입력 필드인데 값이 없는 경우
                inputElement.setCustomValidity('');
            }
        }
    };
    // input 이벤트(값이 변경될 때마다)와 change 이벤트(포커스 잃을 때 값이 변경된 경우)에 핸들러 연결
    inputElement.addEventListener('input', handler);
    inputElement.addEventListener('change', handler);
}

// 모달의 데이터리스트 필드 값을 설정하는 함수 (상세 보기 시 사용)
function setModalDatalistValue(inputElementId, hiddenInputId, datalistData, selectedIdx) {
    const input = document.getElementById(inputElementId);
    const hiddenInput = document.getElementById(hiddenInputId);

    if (!input || !hiddenInput) return;
    input.setCustomValidity(''); // 기존 유효성 메시지 초기화

    if (selectedIdx === null || selectedIdx === undefined || String(selectedIdx).trim() === '') {
        input.value = '';
        hiddenInput.value = '';
        return;
    }

    if (!Array.isArray(datalistData) || datalistData.length === 0) {
        console.warn(`${inputElementId}에 대한 데이터리스트가 비어있습니다. ID ${selectedIdx}를 설정할 수 없습니다.`);
        input.value = '';
        hiddenInput.value = '';
        if (input.required) input.setCustomValidity('선택할 목록이 없습니다. 데이터 로딩을 확인하세요.');
        return;
    }

    // 데이터 객체에서 실제 ID 필드명 동적 추론 (예: itemIdx, custIdx 등)
    const idxFieldName = (() => {
        if (inputElementId.toLowerCase().includes('item')) return 'itemIdx';
        if (inputElementId.toLowerCase().includes('cust')) return 'custIdx';
        if (inputElementId.toLowerCase().includes('wh')) return 'whIdx';
        if (inputElementId.toLowerCase().includes('user')) return 'userIdx';
        if (datalistData.length > 0) { // 데이터가 있다면 첫 번째 항목 기준으로 추론 시도
            const firstItem = datalistData[0];
            if (firstItem.hasOwnProperty('itemIdx')) return 'itemIdx';
            if (firstItem.hasOwnProperty('custIdx')) return 'custIdx';
            if (firstItem.hasOwnProperty('whIdx')) return 'whIdx';
            if (firstItem.hasOwnProperty('userIdx')) return 'userIdx';
        }
        return 'id'; // 기본 ID 필드명
    })();

    // selectedIdx와 일치하는 항목 찾기
    const selectedItem = datalistData.find(item => String(item[idxFieldName]) === String(selectedIdx));

    if (selectedItem) {
        // 표시될 이름 필드명과 코드 필드명 동적 추론
        const displayField = selectedItem.hasOwnProperty('itemNm') ? 'itemNm' : selectedItem.hasOwnProperty('custNm') ? 'custNm' : selectedItem.hasOwnProperty('whNm') ? 'whNm' : selectedItem.hasOwnProperty('userNm') ? 'userNm' : 'name';
        const codeField = selectedItem.hasOwnProperty('itemCd') ? 'itemCd' : selectedItem.hasOwnProperty('custCd') ? 'custCd' : selectedItem.hasOwnProperty('whCd') ? 'whCd' : selectedItem.hasOwnProperty('userId') ? 'userId' : 'code';

        input.value = `${selectedItem[displayField] || ''} (${selectedItem[codeField] || ''})`;
        hiddenInput.value = selectedItem[idxFieldName];
        input.setCustomValidity('');
    } else {
        input.value = '';
        hiddenInput.value = '';
        console.warn(`${inputElementId}에서 ID ${selectedIdx}에 해당하는 항목을 찾지 못했습니다. 목록이 필터링되었거나 항목이 비활성화되었을 수 있습니다.`);
        if (input.required) input.setCustomValidity('선택된 값이 현재 목록에 없습니다. 필터 조건을 확인하세요.');
    }
}

// 날짜 문자열을 'YYYY-MM-DD' 형식으로 변환 (input[type="date"]용)
function formatDateToInput(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return ''; // 유효하지 않은 날짜면 빈 문자열 반환
        return date.toISOString().substring(0, 10);
    } catch (e) {
        return '';
    }
}

// 날짜 문자열을 'YYYY.MM.DD' 형식으로 변환 (테이블 표시용)
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}.${month}.${day}`;
    } catch (e) {
        return '';
    }
}

// 입출고 상태 코드를 텍스트로 변환
function getTransStatusText(statusCode) {
    const statusMap = {
        'R1': '입고전', 'R2': '가입고', 'R3': '입고완료',
        'S1': '출고전', 'S2': '출고완료'
        // 필요에 따라 다른 상태 코드 추가
    };
    return statusMap[statusCode] || statusCode || ''; // 맵에 없으면 원본 코드 반환
}

// DOMContentLoaded 이벤트: 페이지 로드가 완료되면 실행
document.addEventListener('DOMContentLoaded', () => {
    // 날짜 범위 검증 기능 초기화
    setupDateRangeValidation();

    // 검색용 데이터리스트 로드 및 관련 입력 필드 리스너 설정
    loadSearchDatalistData().then(() => {
        setupDatalistInputListener('searchItemNm', 'searchHiddenItemIdx', 'itemNm', 'itemCd', 'itemIdx');
        setupDatalistInputListener('searchCustNm', 'searchHiddenCustIdx', 'custNm', 'custCd', 'custIdx');
        setupDatalistInputListener('searchWhNm', 'searchHiddenWhIdx', 'whNm', 'whCd', 'whIdx');
        setupDatalistInputListener('searchUserNm', 'searchHiddenUserIdx', 'userNm', 'userId', 'userIdx');

        // 검색 영역: 거래처 선택 변경 시 품목 데이터리스트 업데이트
        searchCustNmInput.addEventListener('change', () => {
            const selectedCustIdx = searchHiddenCustIdxInput.value;
            searchItemNmInput.value = ''; // 품목 입력 필드 초기화
            searchHiddenItemIdxInput.value = ''; // 품목 hidden ID 필드 초기화
            searchItemNmInput.setCustomValidity(''); // 품목 입력 필드 유효성 상태 초기화
            loadSearchItemsDatalist(selectedCustIdx); // 선택된 거래처에 따라 품목 데이터리스트 새로고침
        });
    });

    // 모달용 데이터리스트 관련 입력 필드 리스너 설정
    setupDatalistInputListener('modalItemNm', 'modalHiddenItemIdx', 'itemNm', 'itemCd', 'itemIdx', true); // 품목 (필수)
    setupDatalistInputListener('modalCustNm', 'modalHiddenCustIdx', 'custNm', 'custCd', 'custIdx', true); // 거래처 (필수)
    setupDatalistInputListener('modalWhNm', 'modalHiddenWhIdx', 'whNm', 'whCd', 'whIdx', true);    // 창고 (필수)
    setupDatalistInputListener('modalUserNm', 'modalHiddenUserIdx', 'userNm', 'userId', 'userIdx', false); // 담당자 (선택)

    // 모달 영역: 거래처 선택 변경 시 품목 데이터리스트 업데이트
    modalCustNmInput.addEventListener('change', () => {
        const selectedCustIdx = modalHiddenCustIdxInput.value;
        modalItemNmInput.value = ''; // 품목 입력 필드 초기화
        modalHiddenItemIdxInput.value = ''; // 품목 hidden ID 필드 초기화
        modalItemNmInput.setCustomValidity(''); // 품목 입력 필드 유효성 상태 초기화
        loadModalItemsDatalist(selectedCustIdx); // 선택된 거래처에 따라 모달 품목 데이터리스트 새로고침
    });

    // 초기 입고 테이블 로드
    loadReceivingTable();

    // 검색 버튼 클릭 이벤트
    searchButton.addEventListener('click', (event) => {
        event.preventDefault(); // 폼 기본 제출 방지
        searchFilters = {
            transDateFrom: searchTransDateFromInput.value,
            transDateTo: searchTransDateToInput.value,
            itemIdx: searchHiddenItemIdxInput.value,
            custIdx: searchHiddenCustIdxInput.value,
            userIdx: searchHiddenUserIdxInput.value,
            whIdx: searchHiddenWhIdxInput.value,
            transStatus: searchTransStatusSelect.value
        };
        loadReceivingTable(1, currentSortBy, currentOrder, searchFilters); // 새 검색 조건으로 1페이지부터 로드
    });

    // 검색 폼 내 입력 필드에서 Enter 키 입력 또는 Select 변경 시 자동 검색
    document.querySelectorAll('#receivingForm input[type="text"],#receivingForm input[type="date"],#receivingForm select').forEach(input => {
        input.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                searchButton.click(); // Enter 입력 시 검색 버튼 클릭
            }
        });
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', () => searchButton.click()); // Select 변경 시 검색 버튼 클릭
        }
    });

    // 검색 초기화 버튼 클릭 이벤트
    resetSearchButton.addEventListener('click', () => {
        document.getElementById('receivingForm').reset(); // 폼 리셋
        // 숨겨진 ID 필드 및 유효성 메시지 초기화
        [searchHiddenItemIdxInput, searchHiddenCustIdxInput, searchHiddenUserIdxInput, searchHiddenWhIdxInput]
            .forEach(input => {
                input.value = '';
                const visibleInputId = input.id.replace('Hidden','').replace('Idx','Nm');
                const visibleInput = document.getElementById(visibleInputId);
                if(visibleInput) visibleInput.setCustomValidity('');
            });
        searchFilters = { transDateFrom:'', transDateTo:'', itemIdx:'', custIdx:'', userIdx:'', whIdx:'', transStatus:'' }; // 검색 필터 초기화
        currentSortBy = 'invTransIdx'; // 정렬 기준 초기화
        currentOrder = 'desc';       // 정렬 순서 초기화

        // 정렬 화살표 초기화
        updateSortArrows(currentSortBy, currentOrder);
        
        // 날짜 범위 제한 초기화
        searchTransDateFromInput.removeAttribute('max');
        searchTransDateToInput.removeAttribute('min');
        
        loadSearchItemsDatalist(); // 품목 데이터리스트 전체로 리셋 (거래처 필터 없음)
        loadReceivingTable(1, currentSortBy, currentOrder, searchFilters); // 초기 상태로 테이블 로드
    });

    // 신규 등록 버튼 클릭 이벤트
    newRegistrationButton.addEventListener('click', () => openModal('new'));

    // 테이블 전체 선택/해제 체크박스 이벤트
    selectAllCheckboxes.addEventListener('change', function() {
        document.querySelectorAll('.trans-checkbox').forEach(cb => cb.checked = this.checked);
    });

    // 테이블 개별 체크박스 변경 시 전체 선택 체크박스 상태 업데이트
    receivingTableBody.addEventListener('change', function(event) {
        if (event.target.classList.contains('trans-checkbox')) {
            const allCB = document.querySelectorAll('.trans-checkbox');
            const checkedCB = document.querySelectorAll('.trans-checkbox:checked');
            selectAllCheckboxes.checked = allCB.length > 0 && allCB.length === checkedCB.length;
        }
    });

    // 모달 폼 제출 (등록/수정) 이벤트
    modalForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // 기본 제출 방지
        if (!modalForm.checkValidity()) { // HTML5 기본 유효성 검사
            modalForm.reportValidity(); // 유효하지 않으면 메시지 표시
            return;
        }

        // 데이터리스트 기반 필수 입력 필드 추가 검증 (숨겨진 ID 값이 있는지 확인)
        const requiredModalDatalistInputs = [
            { visible: modalItemNmInput, hidden: modalHiddenItemIdxInput, name: "품목" },
            { visible: modalCustNmInput, hidden: modalHiddenCustIdxInput, name: "거래처" },
            { visible: modalWhNmInput, hidden: modalHiddenWhIdxInput, name: "입고 창고" }
        ];
        for (const field of requiredModalDatalistInputs) {
            if (field.visible.required && !field.hidden.value) { // 필수인데 숨겨진 ID 값이 없는 경우
                if (field.visible.value.trim() === '') { // 보이는 필드도 비어있으면
                    field.visible.setCustomValidity('필수 항목입니다. 목록에서 선택해주세요.');
                } else { // 보이는 필드에 값은 있으나 목록에 없는 값일 경우
                    field.visible.setCustomValidity('목록에 있는 유효한 항목을 선택해주세요.');
                }
                modalForm.reportValidity();
                return;
            }
        }

        const formData = new FormData(event.target);
        const isEditMode = formData.get('invTransIdx') && formData.get('invTransIdx') !== ''; // 수정 모드 여부 확인
        const data = { // API로 전송할 데이터 구성
            invTransIdx: formData.get('invTransIdx') || null,
            invTransCode: formData.get('invTransCode') === '자동 생성' ? null : formData.get('invTransCode'),
            transType: 'R', // 입고 유형 (현재 페이지는 입고 관리이므로 'R' 고정)
            whIdx: parseInt(formData.get('whIdx')),
            transDate: formData.get('transDate'),
            transQty: parseInt(formData.get('transQty')),
            unitPrice: parseFloat(formData.get('unitPrice')),
            transStatus: formData.get('transStatus'), // 모달에서 선택된 상태 값 사용
            userIdx: formData.get('userIdx') ? parseInt(formData.get('userIdx')) : null, // 담당자 (선택)
            itemIdx: parseInt(formData.get('itemIdx')),
            custIdx: parseInt(formData.get('custIdx')),
            remark: formData.get('remark')
        };

        // 상태 값이 비어있는 경우 (예: 사용자가 "상태를 선택해주세요"를 그대로 둔 경우) 기본값 'R1' 사용
        if (!data.transStatus) {
            data.transStatus = 'R1';
        }

        const url = isEditMode ? `/api/inv-transactions/${data.invTransIdx}` : '/api/inv-transactions';
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `HTTP 오류! ${response.status}: ${errorText}`;
                try { // 서버에서 JSON 형태의 오류 메시지를 보냈을 경우 파싱 시도
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                } catch (e) { /* 파싱 실패 시 기존 오류 메시지 사용 */ }
                throw new Error(errorMessage);
            }
            alert(isEditMode ? '입고 정보가 성공적으로 수정되었습니다.' : '새 입고가 성공적으로 등록되었습니다.');
            closeModal();
            // 테이블 새로고침 (수정 모드면 현재 페이지, 등록 모드면 1페이지)
            loadReceivingTable(isEditMode ? currentPage : 1, currentSortBy, currentOrder, searchFilters);
        } catch (error) {
            console.error('입고 정보 저장 오류:', error);
            alert(`입고 ${isEditMode ? '수정' : '등록'}에 실패했습니다: ${error.message}`);
        }
    });

    // 삭제 버튼 클릭 이벤트
    deleteButton.addEventListener('click', async () => {
        const checkedCBs = document.querySelectorAll('.trans-checkbox:checked'); // 선택된 체크박스들
        const idsToDelete = Array.from(checkedCBs).map(cb => cb.dataset.invTransIdx); // 삭제할 ID 목록

        if (idsToDelete.length === 0) {
            alert('삭제할 입고 항목을 선택해주세요.');
            return;
        }
        if (!confirm(`${idsToDelete.length}개 입고 항목을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`)) {
            return;
        }

        try {
            const response = await fetch('/api/inv-transactions', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(idsToDelete)
            });
            // 204 No Content도 성공으로 간주
            if (!response.ok && response.status !== 204) {
                const errorText = await response.text();
                let errorMessage = `HTTP 오류! ${response.status}: ${errorText}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                } catch (e) { /* 파싱 실패 시 기존 오류 메시지 사용 */ }
                throw new Error(errorMessage);
            }
            alert('선택된 입고 항목이 삭제되었습니다.');

            // 삭제 후 현재 페이지에 아이템이 없으면 이전 페이지로 이동 (선택적)
            const newTotal = parseInt(totalRecordsSpan.textContent) - idsToDelete.length;
            if (newTotal <= (currentPage - 1) * pageSize && currentPage > 1) {
                currentPage--;
            }
            loadReceivingTable(currentPage, currentSortBy, currentOrder, searchFilters); // 테이블 새로고침
            selectAllCheckboxes.checked = false; // 전체 선택 해제
        } catch (error) {
            console.error('입고 항목 삭제 오류:', error);
            alert(`입고 항목 삭제 실패: ${error.message}`);
        }
    });

    // 페이지네이션 버튼 이벤트
    btnFirstPage.addEventListener('click', () => loadReceivingTable(1, currentSortBy, currentOrder, searchFilters));
    btnPrevPage.addEventListener('click', () => {
        if (currentPage > 1) loadReceivingTable(currentPage - 1, currentSortBy, currentOrder, searchFilters);
    });
    btnNextPage.addEventListener('click', () => {
        if (currentPage < totalPages) loadReceivingTable(currentPage + 1, currentSortBy, currentOrder, searchFilters);
    });
    btnLastPage.addEventListener('click', () => loadReceivingTable(totalPages, currentSortBy, currentOrder, searchFilters));

    // 페이지 번호 직접 입력 후 Enter 또는 focusout 시 이동
    pageNumberInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            let page = parseInt(pageNumberInput.value);
            if (isNaN(page) || page < 1) page = 1;
            if (page > totalPages && totalPages > 0) page = totalPages;
            else if (totalPages === 0) page = 1; // 데이터가 없을 경우 1페이지로
            loadReceivingTable(page, currentSortBy, currentOrder, searchFilters);
        }
    });
    pageNumberInput.addEventListener('blur', () => { // 포커스 아웃 시에도 유효성 검사 및 페이지 이동
        let page = parseInt(pageNumberInput.value);
        if (isNaN(page) || page < 1) page = 1;
        if (page > totalPages && totalPages > 0) page = totalPages;
        else if (totalPages === 0) page = 1;
        pageNumberInput.value = page; // 유효한 페이지 번호로 input 값 업데이트 (선택적)
        // loadReceivingTable(page, currentSortBy, currentOrder, searchFilters); // blur 시 자동 이동은 사용자 경험에 따라 결정
    });
});