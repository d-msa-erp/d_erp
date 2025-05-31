document.addEventListener('DOMContentLoaded', function() {
    const itemTableBody = document.getElementById('itembody');
    const noDataRow = document.getElementById('NoitemRow'); // HTML ID 변경사항 반영
    const prevPageButton = document.getElementById('btn-prev-page');
    const nextPageButton = document.getElementById('btn-next-page');
    const firstPageButton = document.getElementById('btn-first-page'); // 첫 페이지 버튼
    const lastPageButton = document.getElementById('btn-last-page');  // 마지막 페이지 버튼
    const currentPageInput = document.getElementById('currentPageInput');
    const paginationInfoText = document.getElementById('paginationInfoText'); // HTML ID 변경사항 반영

    const excelDownBtn = document.getElementById('excelBtn');
    const printBtn = document.getElementById('printBtn'); // 인쇄 버튼

    const searchCatSelect = document.getElementById('searchCatSelect');
    const searchItemText = document.getElementById('searchItemText');
    const searchButton = document.getElementById('searchButton');
    
    const deleteBtn = document.getElementById('deleteBtn');
    const checkallItemCheckbox = document.getElementById('checkallItem'); // 전체 선택 체크박스

    let currentPage = 1; // 현재 페이지 (1부터 시작)
    let totalPages = 1;  // 전체 페이지 수
    const pageSize = 10; // 한 페이지에 보여줄 항목 수

    let currentSortBy = 'itemIdx'; // 기본 정렬 컬럼 (서버 DTO 필드명 또는 API 정렬 파라미터명)
    let currentSortOrder = 'desc'; // 기본 정렬 순서 (내림차순)

    // 품목 목록 조회 및 렌더링 함수
    function fetchItems(page) {
        currentPage = page; // 요청하는 페이지로 현재 페이지 업데이트
        const CsearchCat = searchCatSelect.value;
        const CsearchItem = searchItemText.value.trim();

        let url = `/api/items?page=${page - 1}&size=${pageSize}&sort=${currentSortBy},${currentSortOrder}`; // Spring Pageable은 page가 0부터 시작
        if (CsearchItem !== '') {
            url += `&${CsearchCat}=${encodeURIComponent(CsearchItem)}`; // 검색 조건 추가
        }
        
        fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); // Page<ItemResponse> 객체를 기대
        })
        .then(pageData => {
            console.log('서버 응답 데이터 (Page):', pageData);

            const items = pageData.content || [];
            totalPages = pageData.totalPages || 1;
            const totalCount = pageData.totalElements || 0;
            // currentPage는 이미 page 파라미터로 설정되었음 (1-based)

            if (paginationInfoText) paginationInfoText.textContent = `총 ${totalCount}건 ${currentPage}/${totalPages}페이지`;
            if (prevPageButton) prevPageButton.disabled = currentPage === 1;
            if (nextPageButton) nextPageButton.disabled = currentPage === totalPages || totalPages === 0;
            if (firstPageButton) firstPageButton.disabled = currentPage === 1;
            if (lastPageButton) lastPageButton.disabled = currentPage === totalPages || totalPages === 0;
            if (currentPageInput) currentPageInput.value = currentPage;
            if (currentPageInput) currentPageInput.max = totalPages;


            itemTableBody.innerHTML = ''; // 기존 목록 삭제
            if (items.length > 0) {
                if (noDataRow) noDataRow.style.display = 'none';
                items.forEach(item => {
                    const row = itemTableBody.insertRow();
                    row.style.cursor = 'pointer';
                    row.dataset.item = JSON.stringify(item); // 행 전체 데이터 저장
                    row.addEventListener('click', () => openModal(item));

                    const checkboxCell = row.insertCell();
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.classList.add('item-checkbox');
                    checkbox.dataset.itemIdx = item.itemIdx; // itemIdx 저장
                    checkbox.addEventListener('click', (e) => e.stopPropagation());
                    checkbox.addEventListener('change', updateCheckAllItemState);
                    checkboxCell.appendChild(checkbox);
                    checkboxCell.addEventListener('click', (e) => e.stopPropagation());
                    
                    row.insertCell().textContent = item.itemNm || "";
                    row.insertCell().textContent = item.itemCd || "";
                    row.insertCell().textContent = item.itemCat1Nm || "";
                    row.insertCell().textContent = item.itemCat2Nm || "";
                    row.insertCell().textContent = item.custNm || "";
                    row.insertCell().textContent = item.unitNm || "";
                    row.insertCell().textContent = item.qty === null || item.qty === undefined ? "0" : item.qty.toLocaleString();
                    row.insertCell().textContent = formatCurrencyKR(item.itemCost);
                });
            } else {
                if (noDataRow) {
                    noDataRow.style.display = ''; // '데이터 없음' 행 표시
                    const nodataCell = noDataRow.querySelector('.nodata');
                    if (nodataCell) nodataCell.colSpan = document.querySelectorAll('#itemTable thead th').length;
                }
                if (totalPages === 0) totalPages = 1; // 페이지가 0일 때 UI 깨짐 방지
                if (paginationInfoText) paginationInfoText.textContent = `총 0건 ${currentPage}/${totalPages}페이지`;
            }
            updateCheckAllItemState(); // 전체 선택 체크박스 상태 업데이트
        })
        .catch(error => {
            console.error('데이터를 가져오는 중 오류 발생:', error);
            itemTableBody.innerHTML = '';
            if (noDataRow) {
                noDataRow.style.display = '';
                const nodataCell = noDataRow.querySelector('.nodata');
                if (nodataCell) nodataCell.colSpan = document.querySelectorAll('#itemTable thead th').length;
                if (nodataCell) nodataCell.textContent = '데이터 로딩 중 오류가 발생했습니다.';
            }
            if (paginationInfoText) paginationInfoText.textContent = '총 0건 1/1페이지';
            if (prevPageButton) prevPageButton.disabled = true;
            if (nextPageButton) nextPageButton.disabled = true;
            if (firstPageButton) firstPageButton.disabled = true;
            if (lastPageButton) lastPageButton.disabled = true;

        });
    }

    // 페이지네이션 버튼 이벤트 리스너
    if (firstPageButton) firstPageButton.addEventListener('click', () => { if (currentPage > 1) fetchItems(1); });
    if (prevPageButton) prevPageButton.addEventListener('click', () => { if (currentPage > 1) fetchItems(currentPage - 1); });
    if (nextPageButton) nextPageButton.addEventListener('click', () => { if (currentPage < totalPages) fetchItems(currentPage + 1); });
    if (lastPageButton) lastPageButton.addEventListener('click', () => { if (currentPage < totalPages) fetchItems(totalPages); });
    
    if (currentPageInput) {
        currentPageInput.addEventListener('change', function() {
            let pageNumber = parseInt(this.value);
            if (isNaN(pageNumber) || pageNumber < 1) {
                pageNumber = 1;
            } else if (pageNumber > totalPages) {
                pageNumber = totalPages;
            }
            fetchItems(pageNumber);
        });
         currentPageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.dispatchEvent(new Event('change'));
            }
        });
    }

    // 검색 버튼 이벤트
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            fetchItems(1); // 검색 시 첫 페이지부터
        });
    }
    if (searchItemText) {
         searchItemText.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchButton.click();
            }
        });
    }


    // 삭제 버튼 이벤트
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            const checkedItemsData = [];
            const itemCheckboxes = itemTableBody.querySelectorAll('input.item-checkbox:checked');
            
            itemCheckboxes.forEach(checkbox => {
                checkedItemsData.push(checkbox.dataset.itemIdx); // data-item-idx 값 사용
            });

            if (checkedItemsData.length === 0) {
                alert('삭제할 항목을 선택해주세요.');
                return;
            }

            if (confirm(`선택된 항목 ${checkedItemsData.length} 개를 정말 삭제하시겠습니까?`)) {
                fetch(`/api/items/deletes`, { // 복수 삭제 API 엔드포인트
                    method: 'DELETE', // DELETE 메소드 사용 권장 (또는 POST)
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(checkedItemsData) // itemIdx 배열 전송
                })
                .then(response =>{
                    if(response.ok){
                        return response.text(); // 성공 메시지를 text로 받음
                    } else {
                        return response.json().then(error => { throw new Error(error.message || '삭제 실패'); });
                    }
                })
                .then(message => {
                    alert(message || '선택된 항목이 삭제되었습니다.'); 
                    fetchItems(currentPage); // 현재 페이지 데이터 다시 로드
                })
                .catch(error => {
                    console.error('삭제 중 오류 발생:', error);
                    alert('삭제에 실패했습니다: ' + error.message);
                });
            }
        });
    }
       
    // 전체 선택 체크박스 상태 업데이트 함수
    function updateCheckAllItemState() {
        if (!checkallItemCheckbox || !itemTableBody) return;
        const itemCheckboxes = itemTableBody.querySelectorAll('.item-checkbox');
        const checkedCount = itemTableBody.querySelectorAll('.item-checkbox:checked').length;
        checkallItemCheckbox.checked = (itemCheckboxes.length > 0 && checkedCount === itemCheckboxes.length);
        checkallItemCheckbox.indeterminate = checkedCount > 0 && checkedCount < itemCheckboxes.length;
    }

    // 전체 선택 체크박스 이벤트
    if (checkallItemCheckbox) {
        checkallItemCheckbox.addEventListener('change', function() {
            const itemCheckboxes = itemTableBody.querySelectorAll('.item-checkbox');
            itemCheckboxes.forEach(checkbox => { checkbox.checked = this.checked; });
        });
    }
    // 개별 체크박스 변경 시 전체 선택 상태 업데이트 (이벤트 위임)
    if (itemTableBody) {
        itemTableBody.addEventListener('change', function(event) {
            if (event.target.classList.contains('item-checkbox')) {
                updateCheckAllItemState();
            }
        });
    }
        
    // 엑셀 다운로드 버튼 이벤트
    if (excelDownBtn) {
        excelDownBtn.addEventListener('click', function() {
            const exCsearchCat = searchCatSelect.value;
            const exCsearchItem = searchItemText.value.trim();
            let downUrl = `/api/items/excel`; // Excel 다운로드 API 엔드포인트
            const params = new URLSearchParams();
            if (exCsearchCat && exCsearchCat.trim() !== '') { params.append('searchCat', exCsearchCat); } // API 파라미터명에 맞게 수정
            if (exCsearchItem && exCsearchItem.trim() !== '') { params.append('searchItem', exCsearchItem); }
            
            // 현재 정렬 조건도 추가
            params.append('sort', `${currentSortBy},${currentSortOrder}`);

            if (params.toString()) { downUrl += '?' + params.toString(); }
            
            window.open(downUrl, '_blank'); // 새 창/탭에서 다운로드
        });
    }

    // 인쇄 버튼 이벤트 (선택 사항 - 구현 필요 시)
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            alert('인쇄 기능은 현재 준비 중입니다.');
            // window.print(); // 간단한 전체 페이지 인쇄
        });
    }
           
    // 초기 데이터 로딩 (1페이지)
    fetchItems(currentPage);
}); // DOMContentLoaded 종료

// 통화 형식 포맷 함수 (숫자 -> "1,234원")
function formatCurrencyKR(value) {
    if (value === null || value === undefined || isNaN(parseFloat(value))) {
        return "0원"; // 기본값 또는 빈 문자열
    }
    const number = parseFloat(value);
    return number.toLocaleString('ko-KR') + "원";
}

// 통화 형식 문자열에서 숫자만 추출하는 함수 ("1,234원" -> 1234)
function unformatCurrencyKR(formattedValue) {
    if (typeof formattedValue !== 'string') {
        const num = parseFloat(formattedValue);
        return isNaN(num) ? null : num;
    }
    const numericString = formattedValue.replace(/[원,]/g, ""); 
    const numValue = parseFloat(numericString);
    return isNaN(numValue) ? null : numValue;
}

// 테이블 헤더 클릭 시 정렬 (전역 함수로 변경)
let currentSortBy = 'itemIdx'; // inventory.js 범위 내 전역 변수
let currentSortOrder = 'desc'; // inventory.js 범위 내 전역 변수

function order(thElement) {
    const newSortBy = thElement.dataset.sortBy; // HTML에서 data-sort-by 속성 사용
    if (!newSortBy) return;

    // 모든 헤더의 정렬 화살표 초기화
    document.querySelectorAll("#itemTable thead th[data-sort-by] a.sort-arrow").forEach(a => {
        if (a.closest('th') !== thElement) {
            a.textContent = '↓';
            a.classList.remove('active');
        }
    });

    if (currentSortBy === newSortBy) {
        currentSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';
    } else {
        currentSortBy = newSortBy;
        currentSortOrder = 'asc'; // 새 컬럼 클릭 시 기본 오름차순
    }

    const arrow = thElement.querySelector('a.sort-arrow');
    if (arrow) {
        arrow.textContent = currentSortOrder === 'asc' ? '↑' : '↓';
        arrow.classList.add('active');
    }
    
    // fetchItems 함수가 currentPage를 1부터 시작하는 것으로 가정하고 호출
    // inventory.js 상단의 fetchItems 함수는 page를 1부터 받아서 API 호출 시 page-1로 변환함
    window.fetchItems(1); // 정렬 변경 시 첫 페이지부터 다시 로드 (fetchItems를 전역으로 접근 가능해야 함)
                          // 또는, 이 order 함수를 DOMContentLoaded 내에 정의하고 fetchItems 직접 호출
}

// 품목 코드 자동 생성 함수 (모달 내에서 사용)
async function createItemCD() {
    const itemCodeInput = document.getElementById('modalItemCd'); // 모달 내 품목코드 input ID
    const itemFlagSelect = document.getElementById('modalItemFlagSelect'); // 모달 내 분류 select ID
    if (!itemCodeInput || !itemFlagSelect) return;

    const selectedFlag = itemFlagSelect.value;
    if (!selectedFlag) { // 분류 미선택 시
        itemCodeInput.value = '';
        itemCodeInput.placeholder = '분류를 먼저 선택해주세요';
        itemCodeInput.readOnly = true;
        return;
    }
    itemCodeInput.readOnly = false; // 임시로 false (값을 설정하기 위해)
    let isUni = false;
    let Icode = '';
    let prefix = '';

    if (selectedFlag === '01') { prefix = 'R'; } // 자재
    else if (selectedFlag === '02') { prefix = 'P'; } // 품목
    else {
        console.error('유효하지 않은 자재/품목 분류 값:', selectedFlag);
        itemCodeInput.value = '분류 선택 오류';
        itemCodeInput.readOnly = true;
        return;
    }

    // 실제로는 유니크한 코드를 보장하기 위해 서버와 통신해야 함
    // 여기서는 예시로 랜덤 코드 생성 (서버 API 호출로 대체 필요)
    while(!isUni){
        let ranNumPart = '';
        for (let i = 0; i < 8; i++) { // 8자리 난수
            ranNumPart += Math.floor(Math.random() * 10);
        }
        Icode = prefix + ranNumPart;
        try{
            const response = await fetch(`/api/items/check-cd?itemCd=${Icode}`); // 품목코드 중복확인 API
            if(!response.ok){ throw new Error(`서버 오류: ${response.status}`); }
            const data = await response.json(); // { isUnique: true/false } 형태의 응답 기대
            isUni = data.isUnique; // 서버 응답에 따라 isUni 설정
            if(!isUni) console.warn(`품목코드 ${Icode}는 사용중입니다. 재시도합니다.`);
        } catch (error) {
            alert('품목 코드 중복 확인 중 오류가 발생했습니다.');
            console.error('품목코드 중복 확인 오류:',error);
            itemCodeInput.value= ''; // 오류 시 초기화
            itemCodeInput.readOnly = true;
            return; 
        }
    }
    itemCodeInput.value = Icode;
    itemCodeInput.readOnly = true; // 최종적으로 읽기 전용 설정
}

// 드롭다운 목록 채우기 함수들 (모달 내에서 사용)
async function populateSelectWithOptions(selectElementId, apiUrl, valueField, textField, prompt, selectedValue = null) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) return;
    selectElement.innerHTML = `<option value="">${prompt}</option>`; // 기본 옵션
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) { throw new Error(`데이터 로드 실패: ${response.status} (${apiUrl})`); }
        const dataArray = await response.json();
        dataArray.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueField];
            option.textContent = item[textField];
            selectElement.appendChild(option);
        });
        if (selectedValue !== null) {
            selectElement.value = selectedValue;
        }
    } catch (error) {
        console.error(`${prompt} 목록 로드 실패:`, error);
        // alert(`${prompt} 목록을 불러오는 중 오류 발생`);
    }
}

// 대분류 선택 시 소분류 목록 업데이트
const modalItemCat1Select = document.getElementById('modalItemCat1');
if (modalItemCat1Select) {
    modalItemCat1Select.addEventListener('change', async function() {
        const parentCatIdx = this.value;
        const modalItemCat2Select = document.getElementById('modalItemCat2');
        if (!modalItemCat2Select) return;

        modalItemCat2Select.innerHTML = '<option value="">소분류를 선택해주세요</option>';
        modalItemCat2Select.disabled = true;
        if (parentCatIdx) {
            try {
                const response = await fetch(`/api/items/subcategories/${parentCatIdx}`); // 소분류 API 엔드포인트
                if (!response.ok) { throw new Error(`소분류 로드 실패: ${response.status}`); }
                const subCategories = await response.json();
                if (subCategories && subCategories.length > 0) {
                    modalItemCat2Select.disabled = false;
                    subCategories.forEach(subCat => {
                        const option = document.createElement('option');
                        option.value = subCat.catIdx; // DTO 필드명 확인 필요
                        option.textContent = subCat.catNm; // DTO 필드명 확인 필요
                        modalItemCat2Select.appendChild(option);
                    });
                } else {
                    modalItemCat2Select.innerHTML = '<option value="">하위 소분류 없음</option>';
                }
            } catch (error) {
                console.error('소분류 목록 로드 실패:', error);
            }
        }
    });
}


// 모달 열기/닫기 및 폼 제출 함수
let currentEditItemIdx = null; // 수정 중인 품목의 ID (itemIdx)

function openModal(item = null) {
    const modal = document.getElementById('itemModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('modalItemForm');
    if (!modal || !title || !form) return;

    form.reset(); // 폼 초기화
    document.querySelectorAll('#modalItemForm .error-message').forEach(el => el.remove()); // 기존 에러 메시지 제거
    document.querySelectorAll('#modalItemForm input, #modalItemForm select, #modalItemForm textarea').forEach(el => el.classList.remove('input-error'));


    currentEditItemIdx = null; // 초기화
    const itemCodeInput = document.getElementById('modalItemCd');
    const itemFlagSelect = document.getElementById('modalItemFlagSelect');
    
    // 드롭다운 목록 채우기 (항상 최신 데이터로)
    populateSelectWithOptions('modalCustNm', '/api/items/custs', 'custIdx', 'custNm', '거래처를 선택해주세요');
    populateSelectWithOptions('modalItemCat1', '/api/items/categories', 'catIdx', 'catNm', '대분류를 선택해주세요');
    // 소분류는 대분류 선택 시 동적으로 로드됨, 초기화
    const modalItemCat2Select = document.getElementById('modalItemCat2');
    if (modalItemCat2Select) {
        modalItemCat2Select.innerHTML = '<option value="">소분류를 선택해주세요</option>';
        modalItemCat2Select.disabled = true;
    }
    populateSelectWithOptions('modalItemUnit', '/api/items/units', 'unitIdx', 'unitNm', '단위를 선택하세요');


    if (item) { // 수정 모드 (item은 ItemResponse DTO)
        title.textContent = '품목 수정';
        form.querySelector('button[name="save"]').style.display = 'none';
        form.querySelector('button[name="edit"]').style.display = 'inline-flex';
        currentEditItemIdx = item.itemIdx;

        document.getElementById('modalItemIdx').value = item.itemIdx || "";
        itemFlagSelect.value = item.itemFlag || "";
        itemFlagSelect.disabled = true; // 수정 시 분류 변경 불가 (정책에 따라)
        itemCodeInput.value = item.itemCd || "";
        itemCodeInput.readOnly = true; // 품목 코드는 수정 불가

        document.getElementById('modalItemNm').value = item.itemNm || "";
        document.getElementById('modalCustNm').value = item.custIdx || ""; // selectedValue로 설정하기 위해 populateSelectWithOptions 수정 필요
        document.getElementById('modalItemCat1').value = item.itemCat1Id || "";
        // 대분류 설정 후 소분류 로드 및 설정
        if (item.itemCat1Id && modalItemCat2Select) {
            populateSelectWithOptions(`modalItemCat2`, `/api/items/subcategories/${item.itemCat1Id}`, 'catIdx', 'catNm', '소분류를 선택해주세요', item.itemCat2Id);
            modalItemCat2Select.disabled = false;
        }
        document.getElementById('modalItemSpec').value = item.itemSpec || "";
        document.getElementById('modalItemUnit').value = item.itemUnitId || "";
        document.getElementById('modalItemCost').value = item.itemCost === null || item.itemCost === undefined ? "" : item.itemCost;
        document.getElementById('modalOptimalInv').value = item.optimalInv === null || item.optimalInv === undefined ? "" : item.optimalInv;
        document.getElementById('modalRemark').value = item.remark || "";

    } else { // 신규 등록 모드
        title.textContent = '신규 품목 등록';
        form.querySelector('button[name="save"]').style.display = 'inline-flex';
        form.querySelector('button[name="edit"]').style.display = 'none';

        itemFlagSelect.value = '';
        itemFlagSelect.disabled = false; // 신규 등록 시 분류 선택 가능
        itemCodeInput.value = '';
        itemCodeInput.placeholder = '분류 선택 시 자동 생성';
        itemCodeInput.readOnly = true;
    }
    modal.style.display = 'flex';
}

// 모달 닫기 함수
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}
// 모달 외부 클릭 시 닫기 (HTML onclick에서 호출)
function outsideClick(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
}

// 자재/품목 분류 변경 시 품목 코드 자동 생성 리스너
const modalItemFlagSelect = document.getElementById('modalItemFlagSelect');
if (modalItemFlagSelect) {
    modalItemFlagSelect.addEventListener('change', function() {
        if (this.value && document.getElementById('modalTitle').textContent === '신규 품목 등록') { // 신규 등록 모드에서만
            createItemCD();
        } else if (!this.value) {
            const itemCodeInput = document.getElementById('modalItemCd');
            if(itemCodeInput) {
                itemCodeInput.value = '';
                itemCodeInput.placeholder = '분류를 먼저 선택해주세요';
                itemCodeInput.readOnly = true;
            }
        }
    });
}

// 모달 폼 제출 처리 (등록/수정 공통 로직)
const modalItemForm = document.getElementById('modalItemForm');
if (modalItemForm) {
    modalItemForm.addEventListener('submit', async function(event) { // submit 이벤트가 아닌 버튼 클릭으로 변경
        event.preventDefault(); // 기본 폼 제출 방지
    });
    // 등록 버튼 클릭
    modalItemForm.querySelector('button[name="save"]')?.addEventListener('click', async () => {
        const payload = gatherModalFormData();
        if (!payload) return; // 유효성 검사 실패 시

        console.log("전송될 신규 품목 데이터 (payload):", payload);
        try {
            const response = await fetch(`/api/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: '품목 등록 실패' }));
                throw new Error(errorData.message || response.statusText);
            }
            alert('새로운 품목이 등록되었습니다.');
            closeModal('itemModal');
            fetchItems(1); // 첫 페이지로 가서 목록 새로고침
        } catch (error) {
            alert('품목 등록 중 오류 발생: ' + error.message);
            console.error('품목 등록 오류:', error);
        }
    });

    // 수정 버튼 클릭
    modalItemForm.querySelector('button[name="edit"]')?.addEventListener('click', async () => {
        if (!currentEditItemIdx) {
            alert("수정할 품목 정보가 없습니다.");
            return;
        }
        const payload = gatherModalFormData();
        if (!payload) return; // 유효성 검사 실패 시

        console.log("전송될 수정 품목 데이터 (payload):", payload);
        try {
            const response = await fetch(`/api/items/${currentEditItemIdx}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: '품목 수정 실패' }));
                throw new Error(errorData.message || response.statusText);
            }
            alert('품목 데이터가 수정되었습니다.');
            closeModal('itemModal');
            fetchItems(currentPage); // 현재 페이지 목록 새로고침
        } catch (error) {
            alert('품목 수정 중 오류 발생: ' + error.message);
            console.error('품목 수정 오류:', error);
        }
    });
}

// 모달 폼 데이터 수집 및 유효성 검사 함수
function gatherModalFormData() {
    const form = document.getElementById('modalItemForm');
    const itemFlag = form.item_FLAG.value;
    const itemCd = form.item_CD.value;
    const itemNm = form.item_NM.value;
    const custIdx = form.cust_NM.value ? parseInt(form.cust_NM.value) : null;
    const itemCat1Id = form.item_CATX1.value ? parseInt(form.item_CATX1.value) : null;
    const itemCat2Id = form.item_CATX2.value ? parseInt(form.item_CATX2.value) : null;
    const itemSpec = form.item_SPEC.value;
    const itemUnitId = form.item_UNIT.value ? parseInt(form.item_UNIT.value) : null;
    const itemCostStr = form.item_COST.value;
    const optimalInvStr = form.optimal_INV.value;
    const remark = form.remark.value;

    // 유효성 검사
    if (!itemFlag) { alert("자재/품목 분류를 선택해주세요."); return null; }
    if (!itemCd && document.getElementById('modalTitle').textContent === '신규 품목 등록') { alert("품목코드가 생성되지 않았습니다. 분류를 다시 선택해보세요."); return null; }
    if (!itemNm.trim()) { alert("품목명은 필수 입력 사항입니다."); return null; }
    if (!custIdx) { alert("거래처를 선택해주세요."); return null; }
    if (!itemCat1Id) { alert("대분류를 선택해주세요."); return null; }
    // 소분류는 대분류에 따라 선택사항일 수 있음. 여기서는 일단 필수 아님으로 처리.
    if (!itemUnitId) { alert("단위를 선택해주세요."); return null; }
    
    const itemCost = itemCostStr ? parseFloat(unformatCurrencyKR(itemCostStr)) : null; // unformat 후 숫자 변환
    if (itemCost === null || isNaN(itemCost) || itemCost < 0) { alert("단가는 유효한 숫자(0 이상)여야 합니다."); return null; }
    
    const optimalInv = optimalInvStr ? parseInt(optimalInvStr) : null;
    if (optimalInv !== null && (isNaN(optimalInv) || optimalInv < 0)) { alert("적정재고는 유효한 숫자(0 이상)여야 합니다."); return null; }


    const payload = {
        itemFlag, itemCd, itemNm, itemSpec, remark, custIdx,
        itemCat1Id, itemCat2Id, itemUnitId,
        optimalInv: optimalInv === null ? 0 : optimalInv, // null이면 0으로
        itemCost: itemCost === null ? 0 : itemCost,       // null이면 0으로
    };
    return payload;
}