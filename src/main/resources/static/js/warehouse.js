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
        const response = await fetch(`/api/warehouses?sortBy=${sortBy}&sortDirection=${sortDirection}&keyword=${keyword}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const warehouses = await response.json();

        if (warehouses.length === 0) {
            tableBody.innerHTML = '<tr><td class="nodata" style="grid-column: span 7; justify-content: center;">등록된 데이터가 없습니다.</td></tr>';
            return;
        }

        warehouses.forEach(warehouse => {
            const row = document.createElement('tr');
            row.dataset.whIdx = warehouse.whIdx; // 데이터 속성으로 whIdx 저장

            row.innerHTML = `
                <td><input type="checkbox" data-wh-idx="${warehouse.whIdx}" /></td>
                <td>${warehouse.whCd || ''}</td>
                <td>${warehouse.whNm || ''}</td>
                <td>${(warehouse.whType1 === 'Y' ? '자재 ' : '') + (warehouse.whType2 === 'Y' ? '제품 ' : '') + (warehouse.whType3 === 'Y' ? '반품 ' : '').trim() || ''}</td>
                <td>${warehouse.useFlag === 'Y' ? '사용' : '미사용'}</td>
                <td>${warehouse.whLocation || ''}</td>
                <td>${warehouse.remark || ''}</td>
            `;
            row.addEventListener('click', (event) => {
                // 체크박스 클릭은 제외
                if (event.target.type === 'checkbox') {
                    return;
                }
                openModal('edit', warehouse.whIdx);
            });
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading warehouses:', error);
        tableBody.innerHTML = '<tr><td class="nodata" style="grid-column: span 7; justify-content: center; color: red;">데이터 로드 실패</td></tr>';
    }
}

// 정렬 함수
function order(thElement) {
    const newSortBy = thElement.dataset.sortBy;

    console.log('클릭된 TH의 data-sort-by:', newSortBy); // 디버깅 로그

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
    const currentTh = document.querySelector(`th[data-sort-by="${currentSortBy}"] a`);
    if (currentTh) {
        currentTh.textContent = currentOrder === 'asc' ? '↑' : '↓';
    }

    loadWarehousesTable(currentSortBy, currentOrder, currentKeyword);
}

// 모달 열기/닫기 함수
function closeModal() {
    document.getElementById('modal').style.display = 'none';
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
    // const whUserIdxInput = modalForm.querySelector('input[name="whUserIdx"]'); // 삭제됨

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

        // 신규 등록 시에는 창고 코드 수정 가능
        if (whCdInput) whCdInput.readOnly = false;
        // 신규 등록 시 사용 여부 기본값 '사용'
        if (useFlagCheckbox) useFlagCheckbox.checked = true;


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
            // if (whUserIdxInput) whUserIdxInput.value = warehouse.whUserIdx || ''; // 삭제됨

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
    modal.style.display = 'flex';
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    loadWarehousesTable(); // 페이지 로드 시 창고 목록 로드

    // 검색 버튼
    document.getElementById('searchButton').addEventListener('click', () => {
        const keyword = document.getElementById('searchInput').value;
        loadWarehousesTable(currentSortBy, currentOrder, keyword);
    });

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

        // whUserIdx는 백엔드에서 처리하므로 프론트엔드에서 넘기지 않습니다.
        // delete data.whUserIdx; // 필요시 주석 해제하여 명시적으로 제거

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
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
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
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
            }

            alert('선택된 창고가 성공적으로 삭제되었습니다.');
            loadWarehousesTable(); // 데이터 다시 로드하여 삭제 반영
        } catch (error) {
            console.error('Error deleting warehouses:', error);
            alert(`창고 삭제에 실패했습니다: ${error.message}`);
        }
    });
});