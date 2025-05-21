// warehouse.js

// 전역 변수 (필요한 경우)
let currentSortBy = 'whIdx';
let currentOrder = 'asc';
let currentKeyword = '';

// 테이블 데이터 로드 함수
async function loadWarehousesTable(sortBy = currentSortBy, sortDirection = currentOrder, keyword = currentKeyword) {
    currentSortBy = sortBy;
    currentOrder = sortDirection;
    currentKeyword = keyword;

    const tableBody = document.getElementById('warehouseTableBody');
    tableBody.innerHTML = ''; // 기존 데이터 초기화

    try {
        // API 호출 시 정렬 및 검색 파라미터 전달
        const response = await fetch(`/api/warehouses?sortBy=${sortBy}&sortDirection=${sortDirection}&keyword=${keyword}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const warehouses = await response.json();

        if (warehouses.length === 0) {
            // colspan을 8로 변경 (담당자 컬럼 추가로)
            tableBody.innerHTML = '<tr><td class="nodata" style="grid-column: span 8; justify-content: center;">등록된 데이터가 없습니다.</td></tr>';
            return;
        }

        warehouses.forEach(warehouse => {
            const row = document.createElement('tr');
            row.dataset.whIdx = warehouse.whIdx; // 데이터 속성으로 whIdx 저장

            row.innerHTML = `
                <td><input type="checkbox" class="warehouse-checkbox" data-wh-idx="${warehouse.whIdx}" /></td>
                <td>${warehouse.whCd || ''}</td>
                <td>${warehouse.whNm || ''}</td>
                <td>${(warehouse.whType1 === 'Y' ? '자재 ' : '') + (warehouse.whType2 === 'Y' ? '제품 ' : '') + (warehouse.whType3 === 'Y' ? '반품 ' : '').trim() || ''}</td>
                <td>${warehouse.useFlag === 'Y' ? '사용' : '미사용'}</td>
                <td>${warehouse.whLocation || ''}</td>
                <td>${warehouse.remark || ''}</td>
                <td>${warehouse.whUserNm || '미지정'}</td> `;
            // 행 전체 클릭 시 모달 열기 (체크박스 클릭 제외)
            row.addEventListener('click', (event) => {
                if (event.target.type === 'checkbox' || event.target.tagName === 'A') { // A 태그 (화살표) 클릭도 제외
                    return;
                }
                openModal('edit', warehouse.whIdx);
            });
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading warehouses:', error);
        tableBody.innerHTML = '<tr><td class="nodata" style="grid-column: span 8; justify-content: center; color: red;">데이터 로드 실패</td></tr>';
    }
}

// 담당자 목록을 `<select>` 태그에 채우는 함수
async function loadManagersIntoSelect(selectElementId, selectedUserIdx = null) {
    const selectBox = document.getElementById(selectElementId);
    selectBox.innerHTML = ''; // 기존 옵션 비우기

    selectBox.appendChild(createOption('', '담당자를 선택해주세요', true, true)); // 기본 "선택하세요" 옵션

    try {
        const response = await fetch('/api/users/active-for-selection'); // 담당자 목록 API 경로
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const managers = await response.json();

        managers.forEach(user => {
            const option = createOption(user.userIdx, `${user.userNm} (${user.userId})`);
            // selectedUserIdx가 null이 아니며, 현재 user의 userIdx가 selectedUserIdx와 일치하면 선택
            if (selectedUserIdx !== null && String(user.userIdx) === String(selectedUserIdx)) {
                option.selected = true;
            }
            selectBox.appendChild(option);
        });
    } catch (error) {
        console.error("담당자 목록 로드 실패:", error);
        alert("담당자 목록을 불러오는 데 실패했습니다.");
    }
}

// option 엘리먼트 생성 헬퍼 함수
function createOption(value, text, disabled = false, selected = false) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    option.disabled = disabled;
    if (selected) {
        option.selected = true;
    }
    return option;
}


// 정렬 함수
function order(thElement) {
    const newSortBy = thElement.dataset.sortBy;

    if (!newSortBy) {
        console.warn("data-sort-by 속성이 정의되지 않았거나 비어있습니다. 정렬 불가.", thElement);
        return;
    }

    if (currentSortBy === newSortBy) {
        currentOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentOrder = 'asc';
        currentSortBy = newSortBy;
    }

    // 모든 정렬 화살표 초기화
    document.querySelectorAll('th a').forEach(a => {
        a.textContent = '↓'; // 기본 화살표
    });

    // 현재 정렬 기준에 맞는 화살표 업데이트
    const currentThAnchor = thElement.querySelector('a');
    if (currentThAnchor) {
        currentThAnchor.textContent = currentOrder === 'asc' ? '↑' : '↓';
    }

    loadWarehousesTable(currentSortBy, currentOrder, currentKeyword);
}

// 모달 열기/닫기 함수
function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modalForm').reset(); // 폼 초기화
    // 모달 닫을 때 whCd input의 readonly 속성 해제 (신규 등록 시 다시 입력 가능하도록)
    const whCdInput = document.querySelector('#modalForm input[name="whCd"]');
    if (whCdInput) whCdInput.readOnly = false;
}

function outsideClick(event) {
    if (event.target.id === 'modal') {
        closeModal();
    }
}

// 하나의 함수로 신규 등록 및 수정 모달 열기 처리
async function openModal(mode, whIdx = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalForm = document.getElementById('modalForm');
    const saveButton = modalForm.querySelector('button[name="save"]');
    const editButton = modalForm.querySelector('button[name="edit"]');

    const warehouseInfoDiv = document.getElementById('warehouseInfo');
    const warehouseStockSection = modalForm.querySelector('.wh_db');

    modalForm.reset(); // 폼 초기화

    const whIdxInput = modalForm.querySelector('input[name="whIdx"]');
    if (whIdxInput) whIdxInput.value = '';

    const whNmInput = modalForm.querySelector('input[name="whNm"]');
    const whCdInput = modalForm.querySelector('input[name="whCd"]');
    const remarkInput = modalForm.querySelector('input[name="remark"]');
    const whType1Checkbox = modalForm.querySelector('input[name="whType1"]');
    const whType2Checkbox = modalForm.querySelector('input[name="whType2"]');
    const whType3Checkbox = modalForm.querySelector('input[name="whType3"]');
    const useFlagCheckbox = modalForm.querySelector('input[name="useFlag"]');
    const whLocationInput = modalForm.querySelector('input[name="whLocation"]');
    const whUserIdxSelect = document.getElementById('modalWhUserIdx'); // ⭐ select 엘리먼트 가져오기 ⭐

    // 모달 폼에 클래스 추가/제거
    if (mode === 'new') {
        modalForm.classList.add('new-warehouse-form'); // 신규 등록 시 클래스 추가
    } else {
        modalForm.classList.remove('new-warehouse-form'); // 수정 시 클래스 제거
    }

    // --- 모달 모드에 따른 UI 조정 ---
    if (mode === 'new') {
        modalTitle.textContent = '신규 창고 등록';
        saveButton.style.display = 'block';
        editButton.style.display = 'none';

        // 신규 등록 시:
        // 1. '창고 기본 정보'는 항상 보이게 합니다.
        if (warehouseInfoDiv) {
            warehouseInfoDiv.style.display = 'block';
        }
        // 2. '창고 재고' 섹션은 숨깁니다.
        if (warehouseStockSection) {
            warehouseStockSection.style.display = 'none';
        }

        // 신규 등록 시에는 창고 코드 readonly
        if (whCdInput) {
            whCdInput.value = '자동 생성'; // 사용자에게 표시
            whCdInput.readOnly = true; // 읽기 전용
        }
        // 신규 등록 시 사용 여부 기본값 '사용'
        if (useFlagCheckbox) useFlagCheckbox.checked = true;

        // ⭐ 신규 등록 시 담당자 드롭다운 초기화 ⭐
        await loadManagersIntoSelect('modalWhUserIdx');


    } else if (mode === 'edit' && whIdx !== null) {
        modalTitle.textContent = '창고 수정';
        saveButton.style.display = 'none';
        editButton.style.display = 'block';

        // 수정 시:
        // 1. '창고 기본 정보'는 항상 보이게 합니다.
        if (warehouseInfoDiv) {
            warehouseInfoDiv.style.display = 'block';
        }
        // 2. '창고 재고' 섹션은 보이게 합니다.
        if (warehouseStockSection) {
            warehouseStockSection.style.display = 'block';
            // TODO: 재고 데이터를 로드하는 로직 추가 (추후 구현)
        }

        // 수정 시 창고 코드는 변경 불가
        if (whCdInput) whCdInput.readOnly = true;

        // --- 수정 모드 시 데이터 로드 ---
        try {
            const response = await fetch(`/api/warehouses/${whIdx}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const warehouse = await response.json();

            // 가져온 데이터로 폼 필드 채우기
            if (whIdxInput) whIdxInput.value = warehouse.whIdx || '';
            if (whNmInput) whNmInput.value = warehouse.whNm || '';
            if (whCdInput) whCdInput.value = warehouse.whCd || '';
            if (remarkInput) remarkInput.value = warehouse.remark || '';
            if (whType1Checkbox) whType1Checkbox.checked = (warehouse.whType1 === 'Y');
            if (whType2Checkbox) whType2Checkbox.checked = (warehouse.whType2 === 'Y');
            if (whType3Checkbox) whType3Checkbox.checked = (warehouse.whType3 === 'Y');
            if (useFlagCheckbox) useFlagCheckbox.checked = (warehouse.useFlag === 'Y');
            if (whLocationInput) whLocationInput.value = warehouse.whLocation || '';

            // ⭐ 수정 모드 시 담당자 드롭다운 채우고 기존 담당자 선택 ⭐
            await loadManagersIntoSelect('modalWhUserIdx', warehouse.whUserIdx);

        } catch (error) {
            console.error('창고 상세 정보를 불러오는 중 오류 발생:', error);
            alert('창고 정보를 불러오는데 실패했습니다.');
            closeModal();
            return;
        }
    } else {
        console.error("openModal 함수 호출 오류: 유효하지 않은 모드 또는 whIdx가 누락되었습니다.", mode, whIdx);
        alert('모달을 여는 중 오류가 발생했습니다.');
        return;
    }
    modal.style.display = 'flex'; // 모달 표시
}


// 검색 폼 제출 처리 함수
function handleSearchSubmit(event) {
    event.preventDefault(); // 폼의 기본 제출 동작을 막습니다 (페이지 새로고침 방지)
    const keyword = document.getElementById('searchInput').value;
    loadWarehousesTable(currentSortBy, currentOrder, keyword);
}


// 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    loadWarehousesTable(); // 페이지 로드 시 창고 목록 로드

    // ⭐ 검색 버튼 클릭 리스너 제거 (submit으로 변경되었으므로) ⭐
    // document.getElementById('searchButton').addEventListener('click', () => {
    //     const keyword = document.getElementById('searchInput').value;
    //     loadWarehousesTable(currentSortBy, currentOrder, keyword);
    // });

    // 신규등록 버튼
    document.getElementById('newRegistrationButton').addEventListener('click', () => {
        openModal('new');
    });

    // 폼 제출 처리 (등록/수정)
    document.getElementById('modalForm').addEventListener('submit', async (event) => {
        event.preventDefault(); // 기본 폼 제출 방지

        const formData = new FormData(event.target);
        const data = {};
        formData.forEach((value, key) => {
            // 체크박스는 'Y' 또는 'N'으로 변환
            if (key === 'whType1' || key === 'whType2' || key === 'whType3' || key === 'useFlag') {
                data[key] = event.target.elements[key].checked ? 'Y' : 'N';
            } else {
                data[key] = value;
            }
        });

        // 담당자 ID 추가
        data.whUserIdx = document.getElementById('modalWhUserIdx').value;

        // whUserIdx 필수 값 검사
        if (!data.whUserIdx) {
            alert("담당자를 선택해 주세요.");
            return;
        }

        // whIdx가 있으면 수정, 없으면 등록
        const isEditMode = data.whIdx && data.whIdx !== '';
        const url = isEditMode ? `/api/warehouses/${data.whIdx}` : '/api/warehouses';
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                // 서버에서 보낸 에러 메시지가 JSON 형식일 경우 파싱
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.message || `HTTP error! Status: ${response.status}, Message: ${errorText}`);
                } catch (e) {
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
                }
            }

            alert(isEditMode ? '창고 정보가 성공적으로 수정되었습니다.' : '신규 창고가 성공적으로 등록되었습니다.');
            closeModal();
            loadWarehousesTable(); // 데이터 다시 로드하여 업데이트 반영
        } catch (error) {
            console.error('Error saving warehouse:', error);
            alert(`창고 ${isEditMode ? '수정' : '등록'}에 실패했습니다: ${error.message}`);
        }
    });

    // 삭제 버튼
    document.getElementById('deleteButton').addEventListener('click', async () => {
        const checkedCheckboxes = document.querySelectorAll('#warehouseTableBody input[type="checkbox"]:checked');
        const whIdxesToDelete = Array.from(checkedCheckboxes).map(cb => cb.dataset.whIdx);

        if (whIdxesToDelete.length === 0) {
            alert('삭제할 창고를 선택해주세요.');
            return;
        }

        if (!confirm(`${whIdxesToDelete.length}개의 창고를 정말로 삭제하시겠습니까?`)) {
            return;
        }

        try {
            const response = await fetch('/api/warehouses', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(whIdxesToDelete)
            });

            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.message || `HTTP error! Status: ${response.status}, Message: ${errorText}`);
                } catch (e) {
                    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
                }
            }

            alert('선택된 창고가 성공적으로 삭제되었습니다.');
            loadWarehousesTable(); // 데이터 다시 로드하여 삭제 반영
        } catch (error) {
            console.error('Error deleting warehouses:', error);
            alert(`창고 삭제에 실패했습니다: ${error.message}`);
        }
    });

    // 헤더 체크박스 전체 선택/해제
    document.getElementById('selectAllCheckboxes').addEventListener('change', function() {
        const isChecked = this.checked;
        document.querySelectorAll('.warehouse-checkbox').forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    });
});