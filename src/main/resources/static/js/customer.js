// customer.js

window.currentBizFlag = '02'; // 기본 탭 설정 ('02': 거래처)
let currentTh = 'custIdx';    // 기본 정렬 컬럼 (DB 필드명 또는 API 정렬 파라미터명)
let currentOrder = 'desc';  // 기본 정렬 순서 (내림차순)
window.currentCustIdx = null; // 수정을 위한 현재 고객 ID 저장용
let currentPage = 0; // 현재 페이지 (0부터 시작하는 페이징 기준)
let currentTotalPages = 1; // 전체 페이지 수

// 고객 목록을 가져오는 함수
async function loadCustomers(bizFlag, sortBy = currentTh, sortDirection = currentOrder, keyword = '') {
    const customerTableBody = document.getElementById('customerTableBody');
    if (!customerTableBody) {
        //console.warn("ID가 'customerTableBody'인 요소를 찾을 수 없습니다.");
        return;
    }
    currentTh = sortBy; // 현재 정렬 기준 업데이트
    currentOrder = sortDirection; // 현재 정렬 순서 업데이트

    // API URL 구성 (페이지 번호는 0부터 시작)
    const apiUrl = `/api/customer/${bizFlag}?sortBy=${sortBy}&sortDirection=${sortDirection}&keyword=${encodeURIComponent(keyword)}&page=${currentPage}&size=10`; // 페이지 크기 10으로 고정

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP 오류! 상태: ${response.status}`);
        }
        const pageData = await response.json(); // Spring Page 객체 전체를 받음

        currentTotalPages = pageData.totalPages || 1;
        renderCustomers(pageData.content || []); // 실제 데이터는 content 배열에 있음
        updatePaginationControls(pageData.totalElements || 0, currentTotalPages, pageData.number + 1); // 페이지네이션 UI 업데이트

    } catch (error) {
        console.error('데이터 로딩 실패:', error);
        const colSpan = document.querySelectorAll('#customerTable thead th').length || 5;
        renderErrorMessage('데이터 로딩 중 오류가 발생했습니다.', 'customerTableBody', colSpan);
        updatePaginationControls(0,1,1); // 오류 시 페이지네이션 초기화
    }
}

// 테이블에 고객 데이터를 렌더링하는 함수
function renderCustomers(customers) {
    const customerTableBody = document.getElementById('customerTableBody');
    customerTableBody.innerHTML = ''; // 기존 내용 초기화

    if (customers && customers.length > 0) {
        customers.forEach(cust => {
            const row = document.createElement('tr');
            row.dataset.id = cust.custIdx; // 행에 custIdx 저장
            row.style.cursor = 'pointer';
            row.onclick = () => openCustomerDetail(cust.custIdx); // 행 클릭 시 상세 모달

            // 체크박스 셀
            const checkboxCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('customer-checkbox'); // CSS 클래스 추가
            checkbox.dataset.custId = cust.custIdx; // 삭제 등을 위해 ID 저장
            checkbox.onclick = (event) => { // 체크박스 클릭 시 행 클릭 이벤트 전파 중단
                event.stopPropagation();
            };
            checkbox.addEventListener('change', updateSelectAllCheckboxState); // 개별 체크박스 변경 시 전체선택 상태 업데이트
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);

            // 데이터 셀 (거래처명, 대표자명, 연락처, 이메일 순서대로)
            // HTML a head의 data-key와 일치하는 필드명 사용
            ['custNm', 'presidentNm', 'bizTel', 'custEmail'].forEach(key => {
                const cell = document.createElement('td');
                cell.textContent = cust[key] || ''; // null일 경우 빈 문자열
                row.appendChild(cell);
            });
            customerTableBody.appendChild(row);
        });
    } else {
        const colSpan = document.querySelectorAll('#customerTable thead th').length || 5;
        renderNoDataMessage('등록된 데이터가 없습니다.', 'customerTableBody', colSpan);
    }
    updateSelectAllCheckboxState(); // 테이블 렌더링 후 전체선택 체크박스 상태 초기화
}

// "데이터 없음" 또는 오류 메시지를 테이블 본문에 표시하는 함수 (colspan 동적 계산)
function renderNoDataMessage(message, tableBodyId, defaultColspan) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const colSpan = document.querySelectorAll(`#${tableBody.closest('table').id} thead th`).length || defaultColspan;
    const noDataRow = `<tr><td class="nodata" colspan="${colSpan}">${message}</td></tr>`;
    tableBody.innerHTML = noDataRow;
}
function renderErrorMessage(message, tableBodyId, defaultColspan) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const colSpan = document.querySelectorAll(`#${tableBody.closest('table').id} thead th`).length || defaultColspan;
    const errorRow = `<tr><td class="nodata" colspan="${colSpan}" style="color:red;">${message}</td></tr>`;
    tableBody.innerHTML = errorRow;
}

// 전체 선택 체크박스 상태 업데이트 함수
function updateSelectAllCheckboxState() {
    const selectAllMainCheckbox = document.getElementById('selectAllCheckbox');
    if (!selectAllMainCheckbox) return;
    const checkboxes = document.querySelectorAll('#customerTableBody input[type="checkbox"].customer-checkbox');
    const checkedCount = document.querySelectorAll('#customerTableBody input[type="checkbox"].customer-checkbox:checked').length;
    selectAllMainCheckbox.checked = checkboxes.length > 0 && checkboxes.length === checkedCount;
    selectAllMainCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}


// 페이지네이션 UI 업데이트 함수
function updatePaginationControls(totalElements, totalPages, pageNumber) { // pageNumber는 1부터 시작
    const paginationInfoEl = document.getElementById('paginationInfo');
    const currentPageInputEl = document.getElementById('currentPageInput');
    const btnFirstPageEl = document.getElementById('btn-first-page');
    const btnPrevPageEl = document.getElementById('btn-prev-page');
    const btnNextPageEl = document.getElementById('btn-next-page');
    const btnLastPageEl = document.getElementById('btn-last-page');

    if (paginationInfoEl) paginationInfoEl.textContent = `총 ${totalElements}건 ${pageNumber}/${totalPages}페이지`;
    if (currentPageInputEl) {
        currentPageInputEl.value = pageNumber;
        currentPageInputEl.max = totalPages;
    }
    if (btnFirstPageEl) btnFirstPageEl.disabled = (pageNumber === 1);
    if (btnPrevPageEl) btnPrevPageEl.disabled = (pageNumber === 1);
    if (btnNextPageEl) btnNextPageEl.disabled = (pageNumber === totalPages || totalPages === 0);
    if (btnLastPageEl) btnLastPageEl.disabled = (pageNumber === totalPages || totalPages === 0);
}


// 테이블 헤더 컬럼명 변경 (거래처/발주처) 및 테이블 제목 변경
function updateTableHeaderAndTitle(bizFlag) {
    const nameHeader = document.getElementById('customerNameHeader'); // th 요소의 ID
    const tableTitle = document.getElementById('tableTitle'); // h4 내 span의 ID
    const newHeaderText = bizFlag === '01' ? '발주처명' : '거래처명';
    const newTableTitleText = bizFlag === '01' ? '발주처 목록' : '거래처 목록';

    if (nameHeader) {
        const arrowElement = nameHeader.querySelector('a.sort-arrow'); // 정렬 화살표 <a> 태그
        nameHeader.firstChild.nodeValue = newHeaderText; // 텍스트 노드만 변경하여 화살표 유지
    }
    if (tableTitle) {
        tableTitle.textContent = newTableTitleText;
    }
}

// 탭 전환 함수
function switchTab(tabElement, bizFlag) {
    document.querySelectorAll('.customer-tabs .tab').forEach(span => {
        span.classList.remove('active');
    });
    tabElement.classList.add('active');
    window.currentBizFlag = bizFlag; // 전역 bizFlag 업데이트
    updateTableHeaderAndTitle(bizFlag); // 헤더와 테이블 제목 업데이트
    currentPage = 0; // 탭 변경 시 첫 페이지로
    loadCustomers(bizFlag, 'custIdx', 'desc', document.getElementById('searchInput').value.trim()); // 정렬 초기화 및 현재 검색어로 로드
}

// === 상세 모달 내 품목 정보 로드 (extraTab) ===
async function loadItemsForExtraTab(custIdx) {
    const itemTableBody = document.getElementById('itemTableBody');
    if (!itemTableBody) {
        //console.warn("ID가 'itemTableBody'인 요소를 찾을 수 없습니다.");
        return;
    }
    itemTableBody.innerHTML = `<tr><td colspan="2" class="nodata">품목 정보 로딩 중...</td></tr>`; // 로딩 메시지

    try {
        const response = await fetch(`/api/items/active-for-selection?custIdx=${custIdx}`);
        if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
        const items = await response.json();
        itemTableBody.innerHTML = ''; // 이전 내용 지우기

        if (items && items.length > 0) {
            items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.itemNm || ''}</td>
                    <td>${item.itemCd || ''}</td>
                `;
                itemTableBody.appendChild(row);
            });
        } else {
            renderNoDataMessage('이 거래처에 등록된 품목이 없습니다.', 'itemTableBody', 2);
        }
    } catch (error) {
        console.error('품목 데이터 로딩 실패:', error);
        renderErrorMessage('품목 정보를 불러오는데 실패했습니다.', 'itemTableBody', 2);
    }
}

// 상세 정보 모달 내 탭 전환 함수
function switchModalTab(tabId) {
    const modalDetailContent = document.querySelector('#modal-detail .modal-content');
    if (!modalDetailContent) return;

    const tabButtons = modalDetailContent.querySelectorAll('.modal-tabs .tab-button');
    const tabContents = modalDetailContent.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    const buttonToActivate = modalDetailContent.querySelector(`.modal-tabs .tab-button[onclick="switchModalTab('${tabId}')"]`);
    const contentToActivate = modalDetailContent.querySelector(`.tab-content#${tabId}`);

    if (buttonToActivate) buttonToActivate.classList.add('active');
    if (contentToActivate) contentToActivate.classList.add('active');

    // 상세 모달의 수정 버튼 표시 여부 결정 (정보 탭에서만 활성화)
    const modalDetailForm = document.querySelector('#modal-detail #modalDetailForm');
    if (modalDetailForm) {
        const editButton = modalDetailForm.querySelector('button[name="edit"]');
        if (editButton) {
            editButton.style.display = (tabId === 'infoTab') ? 'inline-flex' : 'none';
        }
    }
    // "품목 정보" 탭이 활성화될 때 품목 정보 로드
    if (tabId === 'extraTab' && window.currentCustIdx) {
        loadItemsForExtraTab(window.currentCustIdx);
    }
}

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', () => {
    // 탭 스위칭 이벤트 리스너 (이미 switchTab 함수에서 처리)
    // const tabs = document.querySelectorAll('.customer-tabs .tab');
    // tabs.forEach(tab => {
    //     tab.addEventListener('click', function() {
    //         switchTab(this, this.dataset.bizflag);
    //     });
    // });

    // 신규 등록 모달 폼 처리
    const modalNewForm = document.querySelector('#modal-new #modalNewForm');
    if (modalNewForm) {
        const saveNewBtn = modalNewForm.querySelector('button[name="save"]');
        if (saveNewBtn) {
            saveNewBtn.addEventListener('click', saveCustomer); // 'submit' 대신 'click'으로 변경하여 유효성 검사 후 수동 제출
        }
    }

    // 상세 정보 모달 폼 처리 (수정)
    const modalDetailForm = document.querySelector('#modal-detail #modalDetailForm');
    if (modalDetailForm) {
        const editBtn = modalDetailForm.querySelector('button[name="edit"]');
        if (editBtn) {
            editBtn.addEventListener('click', editCustomer); // 'submit' 대신 'click'으로 변경
        }
    }

    // 입력 필드 유효성 검사 이벤트 리스너 (신규 등록 모달)
    const newEmailInput = document.getElementById('newCustEmail');
    const newPhoneInput = document.getElementById('newBizTel');
    const newBizNoInput = document.getElementById('newBizNo');
    const newCompNoInput = document.getElementById('newCompNo'); // 법인번호 -> 사업장번호

    if (newEmailInput) newEmailInput.addEventListener('blur', () => validateInput(newEmailInput, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, '유효한 이메일을 입력해주세요.'));
    if (newPhoneInput) {
        newPhoneInput.addEventListener('input', () => newPhoneInput.value = formatPhoneNumber(newPhoneInput.value)); // 자동 하이픈 추가
        newPhoneInput.addEventListener('blur', () => validateInput(newPhoneInput, /^\d{2,3}-\d{3,4}-\d{4}$/, '연락처는 (02-123-4567 또는 010-1234-5678) 형식입니다.', true));
    }
    if (newBizNoInput) {
        newBizNoInput.addEventListener('input', () => newBizNoInput.value = formatBizNumber(newBizNoInput.value)); // 자동 하이픈 추가
        newBizNoInput.addEventListener('blur', () => validateInput(newBizNoInput, /^\d{3}-\d{2}-\d{5}$/, '사업자번호는 10자리 숫자(XXX-XX-XXXXX)입니다.', true));
    }
    if (newCompNoInput) { // 사업장번호 (구 법인번호)
        newCompNoInput.addEventListener('input', () => newCompNoInput.value = newCompNoInput.value.replace(/\D/g, '').slice(0, 13));
        newCompNoInput.addEventListener('blur', () => { // 선택적 입력이므로 값이 있을 때만 검사
            if (newCompNoInput.value.trim()) {
                validateInput(newCompNoInput, /^(\d{10}|\d{13})$/, '사업장번호는 10자리 또는 13자리 숫자로 입력해주세요.');
            } else { // 값이 없으면 유효성 검사 통과 (에러 스타일 제거)
                clearInputError(newCompNoInput);
            }
        });
    }
     // 상세 정보 모달 유효성 검사 이벤트 리스너
    const detailEmailInput = document.getElementById('detailCustEmail');
    const detailPhoneInput = document.getElementById('detailBizTel');
    const detailBizNoInput = document.getElementById('detailBizNo');
    const detailCompNoInput = document.getElementById('detailCompNo');
	const newBizFax = document.getElementById('newBizFax');
	if (newBizFax) {
	    newBizFax.addEventListener('input', () => {
	        newBizFax.value = formatPhoneNumber(newBizFax.value);
	    });
	}

	const detailBizFax = document.getElementById('detailBizFax');
	if (detailBizFax) {
	    detailBizFax.addEventListener('input', () => {
	        detailBizFax.value = formatPhoneNumber(detailBizFax.value);
	    });
	}
	
    if (detailEmailInput) detailEmailInput.addEventListener('blur', () => validateInput(detailEmailInput, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, '유효한 이메일을 입력해주세요.'));
    if (detailPhoneInput) {
        detailPhoneInput.addEventListener('input', () => detailPhoneInput.value = formatPhoneNumber(detailPhoneInput.value));
        detailPhoneInput.addEventListener('blur', () => validateInput(detailPhoneInput, /^\d{2,3}-\d{3,4}-\d{4}$/, '연락처는 (02-123-4567 또는 010-1234-5678) 형식입니다.', true));
    }
    if (detailBizNoInput) {
        detailBizNoInput.addEventListener('input', () => detailBizNoInput.value = formatBizNumber(detailBizNoInput.value));
        detailBizNoInput.addEventListener('blur', () => validateInput(detailBizNoInput, /^\d{3}-\d{2}-\d{5}$/, '사업자번호는 10자리 숫자(XXX-XX-XXXXX)입니다.', true));
    }
    if (detailCompNoInput) {
        detailCompNoInput.addEventListener('input', () => detailCompNoInput.value = detailCompNoInput.value.replace(/\D/g, '').slice(0, 13));
        detailCompNoInput.addEventListener('blur', () => {
            if (detailCompNoInput.value.trim()) {
                validateInput(detailCompNoInput, /^(\d{10}|\d{13})$/, '사업장번호는 10자리 또는 13자리 숫자로 입력해주세요.');
            } else {
                clearInputError(detailCompNoInput);
            }
        });
    }


    // 초기 탭 로드
    const initialActiveTab = document.querySelector('.customer-tabs .tab.active');
    if (initialActiveTab) {
        window.currentBizFlag = initialActiveTab.dataset.bizflag;
        updateTableHeaderAndTitle(window.currentBizFlag);
        loadCustomers(window.currentBizFlag, currentTh, currentOrder, '');
    } else { // 활성 탭이 없으면 첫 번째 탭을 기본으로
        const firstTab = document.querySelector('.customer-tabs .tab');
        if (firstTab) {
            firstTab.classList.add('active');
            window.currentBizFlag = firstTab.dataset.bizflag;
            updateTableHeaderAndTitle(window.currentBizFlag);
            loadCustomers(window.currentBizFlag, currentTh, currentOrder, '');
        } else { // 탭 요소가 아예 없는 비상 상황
            updateTableHeaderAndTitle('02'); // 기본 '거래처'
            loadCustomers('02');
        }
    }

    // 검색 버튼 이벤트 리스너
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', () => {
        const keyword = document.getElementById('searchInput').value.trim();
        // 검색어가 필수는 아님. 빈 문자열이면 전체 목록 조회
        currentPage = 0; // 검색 시 첫 페이지로
        loadCustomers(window.currentBizFlag, 'custIdx', 'desc', keyword); // 검색 시 정렬 초기화
    });
    // 검색 입력창 Enter 키 이벤트 리스너
    const searchKeywordInput = document.getElementById('searchInput');
    if(searchKeywordInput) {
        searchKeywordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchBtn.click();
            }
        });
    }


    // 선택 삭제 버튼 이벤트 리스너
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    if (deleteBtn) deleteBtn.addEventListener('click', deleteSelectedCustomers);

    // 메인 테이블 전체 선택 체크박스 이벤트 리스너
    const selectAllMainCb = document.getElementById('selectAllCheckbox'); 
    if (selectAllMainCb) selectAllMainCb.addEventListener('change', function() {
        document.querySelectorAll('#customerTableBody .customer-checkbox').forEach(cb => {
            cb.checked = this.checked;
        });
    });

    // 페이지네이션 버튼 이벤트 리스너 (위에서 이미 개별적으로 설정됨, 필요시 그룹으로 묶어 관리)
    const paginationControlsDiv = document.querySelector('.pagination-controls');
    if (paginationControlsDiv) {
        paginationControlsDiv.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (!button) return;

            const id = button.id;
            let newPage = currentPage; // 현재 페이지 (0-based)

            if (id === 'btn-first-page') newPage = 0;
            else if (id === 'btn-prev-page' && currentPage > 0) newPage--;
            else if (id === 'btn-next-page' && currentPage < currentTotalPages - 1) newPage++;
            else if (id === 'btn-last-page') newPage = currentTotalPages - 1;
            
            if (newPage !== currentPage) {
                currentPage = newPage;
                loadCustomers(window.currentBizFlag, currentTh, currentOrder, document.getElementById('searchInput').value.trim());
            }
        });
        // 페이지 직접 입력 처리 (input 'change' 이벤트)
        document.getElementById('currentPageInput')?.addEventListener('change', (e) => {
            let targetPage = parseInt(e.target.value, 10) -1; // 0-based로 변환
             if (isNaN(targetPage) || targetPage < 0) {
                targetPage = 0;
            } else if (targetPage >= currentTotalPages) {
                targetPage = currentTotalPages - 1;
            }
            if (targetPage !== currentPage) {
                currentPage = targetPage;
                loadCustomers(window.currentBizFlag, currentTh, currentOrder, document.getElementById('searchInput').value.trim());
            } else { // 입력값이 현재 페이지와 같거나 유효하지 않아 변경되지 않은 경우, input 값을 현재 페이지로 복원
                 e.target.value = currentPage + 1;
            }
        });
    }

}); // DOMContentLoaded 종료

// 입력값 유효성 검사 함수 (에러 메시지 표시 개선)
function validateInput(inputElement, regex, errorMessage, isRequired = false) {
    const value = inputElement.value.trim();
    let isValid = true;
    
    // 기존 에러 메시지 삭제 (선택 사항: inputElement 다음에 표시할 경우)
    // const existingErrorMsg = inputElement.nextElementSibling;
    // if (existingErrorMsg && existingErrorMsg.classList.contains('validation-error-message')) {
    //     existingErrorMsg.remove();
    // }

    if (isRequired && !value) { // 필수 입력인데 값이 없는 경우
        isValid = false;
    } else if (value && !regex.test(value)) { // 값이 있는데 정규식에 맞지 않는 경우
        isValid = false;
    }

    if (!isValid) {
        inputElement.style.borderColor = 'red';
        inputElement.classList.add('error'); // 에러 클래스 추가 (CSS 스타일링용)
        // 에러 메시지를 inputElement 다음에 삽입 (선택 사항)
        // const errorMsgElement = document.createElement('div');
        // errorMsgElement.textContent = errorMessage;
        // errorMsgElement.classList.add('validation-error-message'); // CSS 스타일링용
        // errorMsgElement.style.color = 'red';
        // errorMsgElement.style.fontSize = '12px';
        // inputElement.parentNode.insertBefore(errorMsgElement, inputElement.nextSibling);
        //console.warn("Validation Error for:", inputElement.name, "-", errorMessage);
    } else {
        clearInputError(inputElement);
    }
    return isValid;
}
// 입력 필드 에러 스타일 제거 함수
function clearInputError(inputElement) {
    inputElement.style.borderColor = ''; // 기본 테두리로
    inputElement.classList.remove('error'); // 에러 클래스 제거
}


// 상세 정보 모달 열기 (데이터 수정용)
async function openCustomerDetail(custIdx) {
    if (!custIdx) {
        console.error("상세 정보를 열기 위한 custIdx가 없습니다.");
        return;
    }
    window.currentCustIdx = custIdx; // 현재 보고 있는 고객 ID 업데이트

    try {
        const response = await fetch(`/api/customer/detail/${custIdx}`);
        if (!response.ok) throw new Error(`데이터 로딩 실패 (상태: ${response.status})`);
        const data = await response.json();
        openModal(data, window.currentBizFlag); // 모달 열기 함수 호출 (수정 모드)
    } catch (error) {
        console.error('상세 데이터 로딩 실패:', error);
        alert('상세 데이터를 불러오는 데 실패했습니다: ' + error.message);
    }
}

// 모달 열기 (신규 등록 또는 상세 정보/수정)
function openModal(data = null, bizFlag) { // data가 있으면 수정 모드, 없으면 신규 모드
    let modalToDisplayId = data ? 'modal-detail' : 'modal-new';
    const modalToDisplay = document.getElementById(modalToDisplayId);
    if (!modalToDisplay) { console.error(`모달 ID '${modalToDisplayId}'를 찾을 수 없습니다.`); return; }

    const formInModal = modalToDisplay.querySelector('form'); // 각 모달의 form (ID로 특정하는 것이 더 안전)
    if (!formInModal) { console.error(`모달 '${modalToDisplayId}' 내에 form 요소를 찾을 수 없습니다.`); return; }

    // 모든 input 필드의 에러 스타일 초기화
    modalToDisplay.querySelectorAll('input').forEach(input => clearInputError(input));

    const titleElId = data ? 'modalDetailTitle' : 'modalTitleNew';
    const titleEl = document.getElementById(titleElId);
    const saveButton = formInModal.querySelector('button[name="save"]');
    const editButton = formInModal.querySelector('button[name="edit"]');


    if (data) { // 상세 정보/수정 모드
        if (titleEl) titleEl.textContent = (bizFlag === '01' ? '발주처 정보 수정' : '거래처 정보 수정');
        if (saveButton) saveButton.style.display = 'none';
        if (editButton) editButton.style.display = 'inline-flex';

        // 폼 필드에 데이터 채우기 (각 모달의 폼 ID를 사용하여 명확히 구분)
        const detailForm = document.getElementById('modalDetailForm');
        if (detailForm) {
            detailForm.querySelector('#detailCustNm').value = data.custNm || '';
            detailForm.querySelector('#detailPresidentNm').value = data.presidentNm || '';
            detailForm.querySelector('#detailBizNo').value = formatBizNumber(data.bizNo || '');
            detailForm.querySelector('#detailBizTel').value = formatPhoneNumber(data.bizTel || '');
            detailForm.querySelector('#detailCustEmail').value = data.custEmail || '';
            detailForm.querySelector('#detailBizFax').value = formatPhoneNumber(data.bizFax || ''); // 팩스도 전화번호 형식
            detailForm.querySelector('#detailBizCond').value = data.bizCond || '';
            detailForm.querySelector('#detailBizItem').value = data.bizItem || '';
            detailForm.querySelector('#detailCompEmpNm').value = data.compEmpNm || '';
            detailForm.querySelector('#detailCompNo').value = data.compNo || ''; // 사업장번호
            detailForm.querySelector('#detailBizAddr').value = data.bizAddr || '';
        }
        window.currentCustIdx = data.custIdx; // 수정 대상 ID 설정

        // 상세 모달 첫 번째 탭(기본 정보) 활성화 및 품목 정보 로드
        if (modalToDisplayId === 'modal-detail') {
            switchModalTab('infoTab'); // 기본 정보 탭을 기본으로 표시
        }

    } else { // 신규 등록 모드
        if (titleEl) titleEl.textContent = (bizFlag === '01' ? '발주처 신규 등록' : '거래처 신규 등록');
        if (saveButton) saveButton.style.display = 'inline-flex';
        if (editButton) editButton.style.display = 'none';
        formInModal.reset(); // 폼 내용 초기화
        window.currentCustIdx = null; // 신규 등록 시 ID 없음
    }

    modalToDisplay.style.display = 'flex'; // 모달 표시
}

// 모달 닫기 함수
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        const form = modal.querySelector('form');
        if (form) {
            form.reset(); // 폼 내용 초기화
             // 모든 input 필드의 에러 스타일 초기화
            form.querySelectorAll('input.error').forEach(input => clearInputError(input));
        }
        if (modalId === 'modal-detail') { // 상세 모달 닫을 때 품목 정보 테이블 초기화
             const itemTableBody = document.getElementById('itemTableBody');
             if(itemTableBody) itemTableBody.innerHTML = '';
        }
    }
}
function outsideClick(e){

	closeModal(e.target.id);
}
// 고객 정보 수정 함수
async function editCustomer() {
    const form = document.getElementById('modalDetailForm'); // 상세 모달의 폼 ID
    if (!form) return;

    let isValid = true;
    // 상세 모달 내 필드 ID로 변경하여 유효성 검사
    isValid &= validateInput(form.querySelector('#detailCustNm'), /.+/, '회사명은 필수입니다.', true);
    isValid &= validateInput(form.querySelector('#detailPresidentNm'), /.+/, '대표자명은 필수입니다.', true);
    isValid &= validateInput(form.querySelector('#detailBizNo'), /^\d{3}-\d{2}-\d{5}$/, '사업자번호는 10자리 숫자(XXX-XX-XXXXX)입니다.', true);
    isValid &= validateInput(form.querySelector('#detailBizTel'), /^\d{2,3}-\d{3,4}-\d{4}$/, '연락처는 (02-123-4567 또는 010-1234-5678) 형식입니다.', true);

    const emailField = form.querySelector('#detailCustEmail');
    if (emailField.value.trim()) { // 이메일은 선택 사항이므로 값이 있을 때만 검사
        isValid &= validateInput(emailField, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, '유효한 이메일 주소를 입력해주세요.');
    }
    const compNoField = form.querySelector('#detailCompNo'); // 사업장번호
    if (compNoField.value.trim()) {
        isValid &= validateInput(compNoField, /^(\d{10}|\d{13})$/, '사업장번호는 10 또는 13자리 숫자로 입력해주세요.');
    }
    const faxField = form.querySelector('#detailBizFax');
    if (faxField.value.trim()) { // 팩스도 선택 사항
        isValid &= validateInput(faxField, /^\d{2,3}-\d{3,4}-\d{4}$/, 'Fax 번호는 유효한 전화번호 형식이어야 합니다.');
    }

    if (!isValid) {
        alert('입력 값을 다시 확인해주세요.');
        return;
    }

    // FormData를 사용하여 폼 데이터 수집
    const formData = new FormData(form);
    const updatedCustomer = { 
        custIdx: window.currentCustIdx, // 수정 대상의 custIdx 포함
        bizFlag: window.currentBizFlag  // 현재 탭의 bizFlag 포함
    }; 
    for (let [key, value] of formData.entries()) {
        // 숫자 형식 필드에서 하이픈 제거 (서버에서 숫자만 받도록)
        if (['bizNo', 'bizTel', 'bizFax', 'compNo'].includes(key)) {
            updatedCustomer[key] = value.replace(/\D/g, '');
        } else {
            updatedCustomer[key] = value.trim();
        }
    }
    //console.log("수정 데이터:", updatedCustomer);

    try {
        const response = await fetch(`/api/customer/update/${window.currentCustIdx}`, { // 경로에 custIdx 포함
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCustomer)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`수정 실패 (상태: ${response.status}): ${errorText}`);
        }
        alert('거래처 정보가 성공적으로 수정되었습니다!');
        closeModal('modal-detail');
        // 현재 활성 탭의 목록을 다시 로드 (정렬 상태 유지, 검색어는 초기화 또는 유지 선택)
        loadCustomers(window.currentBizFlag, currentTh, currentOrder, document.getElementById('searchInput').value.trim());
    } catch (error) {
        console.error('수정 오류:', error);
        alert(`수정 중 오류가 발생했습니다: ${error.message}`);
    }
}

// 신규 고객 정보 저장 함수
async function saveCustomer() {
    const form = document.getElementById('modalNewForm'); // 신규 등록 모달의 폼 ID
    if (!form) return;

    let isValid = true;
    // 신규 등록 모달 내 필드 ID로 유효성 검사
    isValid &= validateInput(form.querySelector('#newCustNm'), /.+/, '회사명은 필수입니다.', true);
    isValid &= validateInput(form.querySelector('#newPresidentNm'), /.+/, '대표자명은 필수입니다.', true);
    isValid &= validateInput(form.querySelector('#newBizNo'), /^\d{3}-\d{2}-\d{5}$/, '사업자번호는 10자리 숫자(XXX-XX-XXXXX)입니다.', true);
    isValid &= validateInput(form.querySelector('#newBizTel'), /^\d{2,3}-\d{3,4}-\d{4}$/, '연락처는 (02-123-4567 또는 010-1234-5678) 형식입니다.', true);

    const emailField = form.querySelector('#newCustEmail');
    if (emailField.value.trim()) {
        isValid &= validateInput(emailField, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, '유효한 이메일 주소를 입력해주세요.');
    }
    const compNoField = form.querySelector('#newCompNo'); // 사업장번호
    if (compNoField.value.trim()) {
        isValid &= validateInput(compNoField, /^(\d{10}|\d{13})$/, '사업장번호는 10 또는 13자리 숫자로 입력해주세요.');
    }
     const faxField = form.querySelector('#newBizFax');
    if (faxField.value.trim()) {
        isValid &= validateInput(faxField, /^\d{2,3}-\d{3,4}-\d{4}$/, 'Fax 번호는 유효한 전화번호 형식이어야 합니다.');
    }


    if (!isValid) {
        alert('입력 값을 다시 확인해주세요.');
        return;
    }

    const formData = new FormData(form);
    const newCustomer = { bizFlag: window.currentBizFlag }; // 현재 활성 탭의 bizFlag 포함
    for (let [key, value] of formData.entries()) {
         if (['bizNo', 'bizTel', 'bizFax', 'compNo'].includes(key)) {
            newCustomer[key] = value.replace(/\D/g, '');
        } else {
            newCustomer[key] = value.trim();
        }
    }
    //console.log("신규 등록 데이터:", newCustomer);

    try {
        const response = await fetch('/api/customer/save', { // 신규 등록 API 엔드포인트
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCustomer)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`등록 실패 (상태: ${response.status}): ${errorText}`);
        }
        alert('신규 거래처가 성공적으로 등록되었습니다!');
        closeModal('modal-new');
        currentPage = 0; // 등록 후 첫 페이지로 이동
        loadCustomers(window.currentBizFlag, 'custIdx', 'desc'); // 최신순(ID역순)으로 목록 다시 로드
    } catch (error) {
        console.error('등록 오류:', error);
        alert(`등록 중 오류가 발생했습니다: ${error.message}`);
    }
}

// 선택된 고객들 삭제 함수
function deleteSelectedCustomers() {
    const checkboxes = document.querySelectorAll('#customerTableBody input[type="checkbox"].customer-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('삭제할 항목을 선택해주세요.');
        return;
    }
    if (!confirm(`선택된 ${checkboxes.length}개의 항목을 정말 삭제하시겠습니까?\n삭제된 데이터는 복구가 불가능합니다.`)) {
        return;
    }

    const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.custId);

    fetch('/api/customer/delete', { // 삭제 API 엔드포인트
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedIds) // ID 목록을 JSON 배열로 전송
    })
    .then(async response => {
        if (!response.ok) { // 200-299 범위가 아닐 때
            const message = await response.text().catch(() => `삭제 실패 (상태: ${response.status})`);
            throw new Error(message);
        }
        // 성공 시 (200 OK 또는 204 No Content 등)
        if (response.status === 204) return null; // No Content면 파싱할 내용 없음
        return response.json().catch(() => null); // JSON 파싱 시도, 실패하면 null
    })
    .then(() => {
        alert('선택된 항목이 삭제되었습니다.');
        // 현재 페이지의 항목이 모두 삭제되어 페이지가 비게 될 경우, 이전 페이지로 이동하는 로직 추가 가능
        const totalItemsAfterDelete = (document.querySelectorAll('#customerTableBody tr:not(:has(td.nodata))').length) - selectedIds.length;
        if (totalItemsAfterDelete === 0 && currentPage > 0) {
            currentPage--;
        }
        loadCustomers(window.currentBizFlag, currentTh, currentOrder, document.getElementById('searchInput').value.trim()); // 목록 새로고침
        const selectAllMainCb = document.getElementById('selectAllCheckbox');
        if (selectAllMainCb) selectAllMainCb.checked = false; // 전체 선택 해제
    })
    .catch(err => {
        console.error('삭제 처리 중 오류:', err);
        alert(err.message || '삭제 처리 중 오류가 발생했습니다.');
    });
}

// 테이블 헤더 클릭 시 정렬 함수
function order(thElement) {
    // 모든 헤더의 정렬 화살표 초기화 (색상 및 방향)
    document.querySelectorAll("#customerTable thead th[data-key] a.sort-arrow").forEach(a => {
        if (a.closest('th') !== thElement) { // 현재 클릭된 헤더가 아니면
            a.textContent = '↓';        // 기본 아래 화살표
            a.classList.remove('active'); // active 클래스 제거 (CSS에서 opacity 조절)
        }
    });

    const key = thElement.dataset.key; // 정렬 기준 필드명 (data-key 속성값)
    if (currentTh === key) { // 이미 현재 정렬 기준 컬럼이면 순서만 변경
        currentOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    } else { // 다른 컬럼 클릭 시
        currentTh = key;         // 정렬 기준 변경
        currentOrder = 'asc';    // 기본 오름차순으로 설정
    }

    currentPage = 0; // 정렬 변경 시 첫 페이지로
    
    // 클릭된 헤더의 화살표 업데이트
    const arrow = thElement.querySelector('a.sort-arrow');
    if (arrow) {
        arrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
        arrow.classList.add('active'); // active 클래스 추가
    }
    
    loadCustomers(window.currentBizFlag, currentTh, currentOrder, document.getElementById('searchInput').value.trim()); // 정렬된 데이터로 목록 다시 로드
}

// 엑셀 다운로드 함수
function downloadExcel() {
    // 현재 활성화된 탭(bizFlag), 검색어, 정렬 기준을 모두 포함하여 요청
    const keyword = document.getElementById('searchInput').value.trim();
    const apiUrl = `/api/customer/excel/${window.currentBizFlag}?sortBy=${currentTh}&sortDirection=${currentOrder}&keyword=${encodeURIComponent(keyword)}`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {throw new Error(text || "엑셀 다운로드에 실패했습니다.")});
            }
            // 파일 이름 추출 시도 (Content-Disposition 헤더 확인)
            const disposition = response.headers.get('Content-Disposition');
            let filename = `customers-${window.currentBizFlag}-data.xlsx`; // 기본 파일명
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }
            return response.blob().then(blob => ({ blob, filename }));
        })
        .then(({ blob, filename }) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename; // 추출했거나 기본 설정된 파일명
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        })
        .catch(err => {
            alert("엑셀 다운로드 중 오류가 발생했습니다: " + err.message);
            console.error("엑셀 다운로드 오류 상세:", err);
        });
}

// 선택된 거래처 상세 정보 인쇄 함수
async function printSelectedCustomerDetails() {
    const checkedCheckboxes = document.querySelectorAll('#customerTableBody input.customer-checkbox:checked');
    if (checkedCheckboxes.length === 0) {
        alert("인쇄할 거래처를 선택해주세요.");
        return;
    }

    const selectedCustomerIds = Array.from(checkedCheckboxes).map(cb => cb.dataset.custId);
    const fetchUrl = `/api/customer/print?${selectedCustomerIds.map(id => `ids=${id}`).join('&')}`;

    let printContents = `
        <html>
        <head>
            <title>거래처 상세 정보 인쇄</title>
            <style>
                body { font-family: '맑은 고딕', Malgun Gothic, Dotum, sans-serif; margin: 20px; font-size: 10pt; color: #333; }
                .customer-container { page-break-inside: avoid; border: 1px solid #ccc; padding: 20px; margin-bottom: 25px; border-radius: 5px; background-color: #fff; }
                .customer-container h2 { font-size: 16pt; margin-top: 0; margin-bottom: 15px; color: #1a237e; border-bottom: 2px solid #3949ab; padding-bottom: 8px; }
                .detail-info { margin-bottom: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 20px; }
                .detail-info p { margin: 6px 0; font-size: 10.5pt; display: flex; align-items: center; }
                .detail-info strong { display: inline-block; width: 100px; color: #555; font-weight: bold; flex-shrink: 0; }
                @media print {
                    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; } /* 배경색/이미지 인쇄 옵션 */
                    .customer-container { border: 1px solid #ccc !important; box-shadow: none; margin-bottom: 20mm; } /* 인쇄 시 테두리 유지 */
                    h1.print-main-title { display: block !important; font-size: 20pt; text-align: center; margin-bottom: 25px; }
                    /* 불필요한 UI 요소 숨기기 */
                    body > div:not(.print-area-wrapper) { display: none; } 
                }
                h1.print-main-title { display: none; } /* 화면에서는 숨김 */
            </style>
        </head>
        <body>
            <div class="print-area-wrapper"> <h1 class="print-main-title">선택된 거래처 상세 정보</h1>
    `;

    try {
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`인쇄 데이터 요청 실패: ${res.status}`);

        const customersToPrint = await res.json();

        customersToPrint.forEach(customer => {
            printContents += `<div class="customer-container">`;
            printContents += `<h2>${customer.custNm || '거래처명 없음'}</h2>`;
            printContents += `<div class="detail-info">`;
            printContents += `<p><strong>사업자 번호:</strong> ${formatBizNumber(customer.bizNo || '')}</p>`;
            printContents += `<p><strong>대표자명:</strong> ${customer.presidentNm || ''}</p>`;
            printContents += `<p><strong>이메일:</strong> ${customer.custEmail || ''}</p>`;
            printContents += `<p><strong>연락처:</strong> ${formatPhoneNumber(customer.bizTel || '')}</p>`;
            printContents += `<p><strong>주소:</strong> ${customer.bizAddr || ''}</p>`;
            printContents += `<p><strong>업태:</strong> ${customer.bizCond || ''}</p>`; // 업태
            printContents += `<p><strong>종목:</strong> ${customer.bizItem || ''}</p>`; // 종목
            printContents += `<p><strong>담당자:</strong> ${customer.compEmpNm || ''}</p>`;
            printContents += `<p><strong>사업장번호:</strong> ${customer.compNo || ''}</p>`; // 사업장번호
            printContents += `<p><strong>팩스:</strong> ${formatPhoneNumber(customer.bizFax || '')}</p>`; // 팩스
            printContents += `</div>`;
            printContents += `</div>`;
        });

    } catch (e) {
        console.error("[Print] 거래처 인쇄 데이터 로딩 오류:", e);
        printContents += `<p style="color:red;">선택된 거래처 정보를 불러오는 중 오류가 발생했습니다: ${e.message}</p>`;
    }

    printContents += `</div></body></html>`; // print-area-wrapper 닫기

    const printWindow = window.open('', '_blank', 'height=700,width=900,scrollbars=yes');
    if (printWindow) {
        printWindow.document.write(printContents);
        printWindow.document.close();
        printWindow.focus(); // 새 창/탭에 포커스
        // setTimeout을 사용하여 내용이 완전히 로드된 후 인쇄 대화상자 호출
        setTimeout(() => {
            try {
                printWindow.print();
            } catch (printError) {
                console.error("인쇄 대화상자 호출 오류:", printError);
                // 사용자에게 수동으로 인쇄하라는 메시지 표시 가능
                printWindow.alert("인쇄 대화상자를 자동으로 열 수 없습니다. 브라우저의 인쇄 기능을 사용해주세요 (Ctrl+P 또는 Cmd+P).");
            }
            // 사용자가 인쇄를 취소하거나 완료한 후 창을 닫을지 여부는 상황에 따라 결정
            // printWindow.close(); // 자동으로 창 닫기 (사용자가 인쇄 내용을 검토할 시간 없이 닫힐 수 있음)
        }, 700); // 700ms 지연 (필요시 조정)
    } else {
        alert("팝업 차단 기능이 활성화되어 인쇄 창을 열 수 없습니다. 팝업 차단을 해제한 후 다시 시도해주세요.");
    }
}

// 전화번호 자동 하이픈 함수
function formatPhoneNumber(value) {
    if (!value) return "";
    value = value.replace(/\D/g, ""); // 숫자만 추출
    if (value.length < 3) return value;
    if (value.startsWith("02")) { // 서울 지역번호
        if (value.length < 3) return value;
        if (value.length < 6) return value.replace(/(\d{2})(\d+)/, "$1-$2");
        if (value.length < 10) return value.replace(/(\d{2})(\d{3,4})(\d+)/, "$1-$2-$3");
        return value.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3").slice(0, 12);
    } else { // 그 외 지역번호 또는 휴대폰
        if (value.length < 4) return value;
        if (value.length < 7) return value.replace(/(\d{3})(\d+)/, "$1-$2");
        if (value.length < 11) return value.replace(/(\d{3})(\d{3,4})(\d+)/, "$1-$2-$3");
        return value.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3").slice(0, 13);
    }
}

// 사업자번호 자동 하이픈 함수
function formatBizNumber(value) {
    if (!value) return "";
    value = value.replace(/\D/g, ""); // 숫자만 추출
    if (value.length <= 3) return value;
    if (value.length <= 5) return value.replace(/(\d{3})(\d+)/, "$1-$2");
    return value.replace(/(\d{3})(\d{2})(\d+)/, "$1-$2-$3").slice(0, 12); // XXX-XX-XXXXX
}