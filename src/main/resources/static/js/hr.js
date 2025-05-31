// 전역 변수로 현재 정렬 기준, 방향, 검색어, 페이징 정보를 저장
let currentSortBy = 'userId'; // 초기 정렬 기준 (아이디)
let currentOrder = 'desc';        // 초기 정렬 방향 (내림차순)
let currentKeyword = '';          // 검색 기능이 있다면 현재 검색어를 저장할 변수
let currentPage = 0;              // 현재 페이지 (0부터 시작)
let pageSize = 10;                // 페이지 크기
let totalPages = 0;               // 전체 페이지 수
let totalElements = 0;            // 전체 요소 수

// 유틸리티 함수들 (전역 범위에 정의)
function extractNumbers(inputString) {
    if (typeof inputString !== 'string') {
        return '';
    }
    return inputString.replace(/[^0-9]/g, '');
}

function isValidPhoneNumber(phoneNumber) {
    return phoneNumber.length >= 10;
}

function isValidEmail(email) {
    if (typeof email !== 'string' || email.trim() === '') {
        return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// 현재 날짜를 YYYY-MM-DD 형식으로 반환하는 함수
function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Modal 닫기 함수 (전역 범위에 정의)
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
    }
    const modalForm = document.getElementById('modalForm');
    if (modalForm) {
        modalForm.reset();
        const userIdxInput = modalForm.querySelector('input[name="userIdx"]');
        if (userIdxInput) userIdxInput.value = '';
        const userPswdInput = modalForm.querySelector('input[name="userPswd"]');
        if (userPswdInput) userPswdInput.required = true; // 모달 닫을 때 비밀번호 필드의 required 속성 초기화
    }
}

// Modal 외부 클릭 시 닫기 함수 (전역 범위에 정의)
function outsideClick(e) {
    const modal = document.getElementById('modal');
    if (e.target === modal) {
        closeModal();
    }
}

// 하나의 공유 Modal 열기 함수 (전역 범위에 정의)
async function openSharedModal(mode, userIdx = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalForm = document.getElementById('modalForm');
    const saveButton = modalForm ? modalForm.querySelector('button[name="save"]') : null;
    const editButton = modalForm ? modalForm.querySelector('button[name="edit"]') : null;
    const userIdxInput = modalForm ? modalForm.querySelector('input[name="userIdx"]') : null;
    const userIdInput = modalForm ? modalForm.querySelector('input[name="userId"]') : null;
    const userPswdInput = modalForm ? modalForm.querySelector('input[name="userPswd"]') : null;

    if (!modal || !modalForm || !modalTitle) {
        console.error('모달 관련 요소를 찾을 수 없습니다.');
        return;
    }

    modalForm.reset();
    if (userIdxInput) userIdxInput.value = '';
    if (userIdInput) userIdInput.readOnly = false;
    if (saveButton) saveButton.style.display = 'none';
    if (editButton) editButton.style.display = 'none';
    if (userPswdInput) userPswdInput.required = true;

    if (mode === 'new') {
        modalTitle.textContent = '신규 사원 등록';
        if (saveButton) saveButton.style.display = 'block';
        if (userIdInput) userIdInput.focus();

    } else if (mode === 'edit' && userIdx !== null) {
        modalTitle.textContent = '사원 수정';
        if (editButton) editButton.style.display = 'block';
        if (userIdInput) userIdInput.readOnly = true;
        if (userPswdInput) userPswdInput.required = false;

        const detailApiUrl = `/api/users/${userIdx}`;
        try {
            const response = await fetch(detailApiUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const userData = await response.json();

            if (userIdxInput) userIdxInput.value = userData.userIdx || '';
            if (userIdInput) userIdInput.value = userData.userId || '';
            if (userPswdInput) userPswdInput.value = '';

            const userNmInput = modalForm.querySelector('input[name="userNm"]');
            if (userNmInput) userNmInput.value = userData.userNm || '';
            const userEmailInput = modalForm.querySelector('input[name="userEmail"]');
            if (userEmailInput) userEmailInput.value = userData.userEmail || '';
            const userTelInput = modalForm.querySelector('input[name="userTel"]');
            if (userTelInput) userTelInput.value = userData.userTel || '';
            const userHpInput = modalForm.querySelector('input[name="userHp"]');
            if (userHpInput) userHpInput.value = userData.userHp || '';
            const hireDtInput = modalForm.querySelector('input[name="hireDt"]');
            if (hireDtInput) hireDtInput.value = userData.hireDt || '';
            const retireDtInput = modalForm.querySelector('input[name="retireDt"]');
            if (retireDtInput) retireDtInput.value = userData.retireDt || '';

            const userRoleSelect = modalForm.querySelector('select[name="userRole"]');
            if (userRoleSelect && userData.userRole) userRoleSelect.value = userData.userRole;
            const userDeptSelect = modalForm.querySelector('select[name="userDept"]');
            if (userDeptSelect && userData.userDept) userDeptSelect.value = userData.userDept;
            const userPositionSelect = modalForm.querySelector('select[name="userPosition"]');
            if (userPositionSelect && userData.userPosition) userPositionSelect.value = userData.userPosition;
            const userStatusSelect = modalForm.querySelector('select[name="userStatus"]');
            if (userData.userStatus) userStatusSelect.value = userData.userStatus;

        } catch (error) {
            console.error('사용자 상세 정보를 불러오는 중 오류 발생:', error);
            alert('사용자 정보를 불러오는데 실패했습니다.');
            closeModal();
            return;
        }
    } else {
        console.error('openSharedModal 함수 호출 오류: 유효하지 않은 모드 또는 userIdx가 누락되었습니다.', mode, userIdx);
        alert('모달을 여는 중 오류가 발생했습니다.');
        return;
    }

    modal.style.display = 'flex';
}

// 정적 UI 업데이트 함수
function updateStaticPaginationUI() {
    const totalRecordsElement = document.getElementById('totalRecords');
    const currentPageDisplayElement = document.getElementById('currentPageDisplay');
    const totalPagesDisplayElement = document.getElementById('totalPagesDisplay');
    const pageNumberInput = document.getElementById('pageNumberInput');
    const btnFirstPage = document.getElementById('btn-first-page');
    const btnPrevPage = document.getElementById('btn-prev-page');
    const btnNextPage = document.getElementById('btn-next-page');
    const btnLastPage = document.getElementById('btn-last-page');

    // 페이지 정보 업데이트
    if (totalRecordsElement) totalRecordsElement.textContent = totalElements;
    if (currentPageDisplayElement) currentPageDisplayElement.textContent = currentPage + 1;
    if (totalPagesDisplayElement) totalPagesDisplayElement.textContent = totalPages;
    if (pageNumberInput) {
        pageNumberInput.value = currentPage + 1;
        pageNumberInput.max = totalPages;
    }

    // 버튼 상태 업데이트
    if (btnFirstPage) btnFirstPage.disabled = currentPage === 0;
    if (btnPrevPage) btnPrevPage.disabled = currentPage === 0;
    if (btnNextPage) btnNextPage.disabled = currentPage >= totalPages - 1;
    if (btnLastPage) btnLastPage.disabled = currentPage >= totalPages - 1;
}

// 정적 페이징 버튼 이벤트 초기화 함수
function initStaticPaginationEvents() {
    const btnFirstPage = document.getElementById('btn-first-page');
    const btnPrevPage = document.getElementById('btn-prev-page');
    const btnNextPage = document.getElementById('btn-next-page');
    const btnLastPage = document.getElementById('btn-last-page');
    const pageNumberInput = document.getElementById('pageNumberInput');

    if (btnFirstPage) {
        btnFirstPage.addEventListener('click', () => {
            currentPage = 0;
            loadUsersTableWithPaging(currentSortBy, currentOrder, currentKeyword);
        });
    }

    if (btnPrevPage) {
        btnPrevPage.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                loadUsersTableWithPaging(currentSortBy, currentOrder, currentKeyword);
            }
        });
    }

    if (btnNextPage) {
        btnNextPage.addEventListener('click', () => {
            if (currentPage < totalPages - 1) {
                currentPage++;
                loadUsersTableWithPaging(currentSortBy, currentOrder, currentKeyword);
            }
        });
    }

    if (btnLastPage) {
        btnLastPage.addEventListener('click', () => {
            currentPage = totalPages - 1;
            loadUsersTableWithPaging(currentSortBy, currentOrder, currentKeyword);
        });
    }

    if (pageNumberInput) {
        pageNumberInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const newPage = parseInt(pageNumberInput.value) - 1;
                if (newPage >= 0 && newPage < totalPages && newPage !== currentPage) {
                    currentPage = newPage;
                    loadUsersTableWithPaging(currentSortBy, currentOrder, currentKeyword);
                }
            }
        });

        pageNumberInput.addEventListener('blur', () => {
            const newPage = parseInt(pageNumberInput.value) - 1;
            if (newPage >= 0 && newPage < totalPages && newPage !== currentPage) {
                currentPage = newPage;
                loadUsersTableWithPaging(currentSortBy, currentOrder, currentKeyword);
            } else {
                pageNumberInput.value = currentPage + 1;
            }
        });
    }
}

// --- 페이징을 지원하는 사원 목록 로드 함수 ---
async function loadUsersTableWithPaging(sortBy, sortDirection, keyword = '') {
    const tableBody = document.getElementById('userTableBody');
    if (!tableBody) {
        console.warn("ID가 'userTableBody'인 요소를 찾을 수 없습니다.");
        return;
    }
    tableBody.innerHTML = '<tr><td colspan="8">데이터 로딩 중...</td></tr>';

    try {
        let url = `/api/users/paged?page=${currentPage}&size=${pageSize}&sortBy=${sortBy}&sortDirection=${sortDirection}`;
        if (keyword) {
            url += `&keyword=${encodeURIComponent(keyword)}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
        }
        const pageData = await response.json();

        // 페이징 정보 업데이트
        totalPages = pageData.totalPages;
        totalElements = pageData.totalElements;
        const users = pageData.content;

        tableBody.innerHTML = '';

        if (users && users.length > 0) {
            users.forEach(user => {
                const row = document.createElement('tr');
                row.dataset.userIdx = user.userIdx;
                row.onclick = () => openSharedModal('edit', user.userIdx);

                const checkboxCell = document.createElement('td');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
				checkbox.dataset.userIdx = user.userIdx;
                checkbox.addEventListener('click', (event) => {
                    event.stopPropagation();
                });
                checkboxCell.appendChild(checkbox);
                row.appendChild(checkboxCell);

                const nameCell = document.createElement('td');
                nameCell.textContent = user.userNm || '';
                row.appendChild(nameCell);

                const userIdCell = document.createElement('td');
                userIdCell.textContent = user.userId || '';
                row.appendChild(userIdCell);

                const userTelCell = document.createElement('td');
                userTelCell.textContent = user.userTel || '';
                row.appendChild(userTelCell);

                const userHpCell = document.createElement('td');
                userHpCell.textContent = user.userHp || '';
                row.appendChild(userHpCell);

                const userDeptCell = document.createElement('td');
                userDeptCell.textContent = user.userDept || '';
                row.appendChild(userDeptCell);

                const userPositionCell = document.createElement('td');
                userPositionCell.textContent = user.userPosition || '';
                row.appendChild(userPositionCell);

                // --- 재직상태 변환 로직 적용 ---
                const userStatusCell = document.createElement('td');
                const statusCode = user.userStatus;
                let statusText = '';
                if (statusCode == '01') {
                    statusText = '재직중';
                } else if (statusCode == '02') {
                    statusText = '퇴사';
                } else if (statusCode == '03') {
                    statusText = '휴직';
                } else if (statusCode == '04') {
                    statusText = '대기';
                } else if (statusCode == '05') {
                    statusText = '정직';
                } else if (statusCode) {
                    statusText = `코드: ${statusCode}`;
                } else {
                    statusText = '';
                }
                userStatusCell.textContent = statusText;
                row.appendChild(userStatusCell);
                // --- 재직상태 변환 로직 끝 ---

                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td class="nodata" style="grid-column: span 8;justify-content: center;">등록된 데이터가 없습니다.</td>
                </tr>
            `;
        }

        // 현재 정렬 상태를 UI에 반영하는 로직
		const allArrows = document.querySelectorAll("th a");
		allArrows.forEach(a => {
		    a.textContent = '↓';                 // 모두 ↓로 초기화
		    a.style.opacity = '0.3';             // 연하게 처리
		    a.style.color = '#000';              // 색은 검정 유지
		    a.style.visibility = 'visible';      // 항상 보이게 처리 (감추지 않음)
		});

		const activeTh = document.querySelector(`th[data-sort-by="${sortBy}"]`);
		if (activeTh) {
		    const activeArrow = activeTh.querySelector('a');
		    if (activeArrow) {
		        activeArrow.textContent = sortDirection === 'asc' ? '↑' : '↓';
		        activeArrow.style.opacity = '1';   // 진하게
		    }
		}

        // 정적 페이징 UI 업데이트
        updateStaticPaginationUI();

        // 전체 선택 체크박스 상태 초기화
        const selectAllCheckbox = document.querySelector('thead input[type="checkbox"]');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }

    } catch (error) {
        console.error('데이터를 불러오는 중 오류가 발생했습니다:', error);
        tableBody.innerHTML = `<tr><td colspan="8" style="color: red; text-align: center;">데이터 로딩 실패: ${error.message}</td></tr>`;
    }
}

// --- 기존 loadUsersTable 함수를 페이징 버전으로 리다이렉트 ---
async function loadUsersTable(sortBy, sortDirection, keyword = '') {
    // 기존 함수 호출을 페이징 함수로 리다이렉트
    await loadUsersTableWithPaging(sortBy, sortDirection, keyword);
}

// 정렬 함수 (글로벌로 정의)
function order(thElement) {
    const newSortBy = thElement.dataset.sortBy;

    if (currentSortBy === newSortBy) {
        currentOrder = currentOrder === 'desc' ? 'asc' : 'desc';
    } else {
        currentOrder = 'asc';
        currentSortBy = newSortBy;
    }

    // 정렬 변경 시 첫 페이지로 이동
    currentPage = 0;
    loadUsersTableWithPaging(currentSortBy, currentOrder, currentKeyword);
}

// 재직상태 변경 시 퇴사일 자동 설정 함수
function handleStatusChange(statusSelect) {
    const retireDtInput = document.querySelector('input[name="retireDt"]');
    if (!retireDtInput) return;

    if (statusSelect.value === '02') { // 퇴사 선택 시
        if (!retireDtInput.value) { // 퇴사일이 비어있을 때만 자동 설정
            retireDtInput.value = getCurrentDate();
            console.log('퇴사 상태 선택 - 오늘 날짜로 퇴사일 자동 설정:', retireDtInput.value);
        }
    }
}

// 퇴사일 변경 시 재직상태 자동 설정 함수
function handleRetireDateChange(retireDtInput) {
    const userStatusSelect = document.querySelector('select[name="userStatus"]');
    if (!userStatusSelect) return;

    if (retireDtInput.value) { // 퇴사일이 입력되었을 때
        const retireDate = new Date(retireDtInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 시간 부분 제거하여 날짜만 비교
        retireDate.setHours(0, 0, 0, 0);

        if (retireDate <= today) { // 퇴사일이 오늘이거나 과거일 때만
            if (userStatusSelect.value !== '02') { // 현재 상태가 퇴사가 아니라면
                userStatusSelect.value = '02'; // 퇴사로 변경
                console.log('퇴사일 입력 (오늘/과거) - 재직상태를 퇴사로 자동 변경');
            }
        } else { // 퇴사일이 미래일 때
            console.log('퇴사일이 미래 날짜입니다. 퇴사일이 되면 자동으로 퇴사 처리됩니다.');
            // 미래 날짜인 경우 상태를 변경하지 않음 (퇴사 예정 상태 유지)
        }
    } else { // 퇴사일이 삭제되었을 때
        if (userStatusSelect.value === '02') { // 현재 상태가 퇴사라면
            userStatusSelect.value = '01'; // 재직중으로 변경
            console.log('퇴사일 삭제 - 재직상태를 재직중으로 자동 변경');
        }
    }
}

// --- 페이지 로드 후 실행될 코드 (하나의 DOMContentLoaded 리스너로 통합) ---
document.addEventListener('DOMContentLoaded', () => {
    // 초기 로딩 시 사원 목록을 가져옴 (페이징 지원)
    loadUsersTableWithPaging(currentSortBy, currentOrder, currentKeyword);

    // 정적 페이징 이벤트 초기화
    initStaticPaginationEvents();

    // 요소들을 변수에 할당
    const modalForm = document.getElementById('modalForm');
    const userTelInput = document.getElementById('userTelInput');
    const userHpInput = document.getElementById('userHpInput');
    const userEmailInput = document.getElementById('userEmailInput');
    const deleteButton = document.querySelector('.table-wrapper > div:nth-child(1) > div > button:nth-child(3)');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const selectAllCheckbox = document.querySelector('thead input[type="checkbox"]');

    // 재직상태 및 퇴사일 자동 처리 이벤트 리스너 추가
    if (modalForm) {
        const userStatusSelect = modalForm.querySelector('select[name="userStatus"]');
        const retireDtInput = modalForm.querySelector('input[name="retireDt"]');

        if (userStatusSelect) {
            userStatusSelect.addEventListener('change', () => {
                handleStatusChange(userStatusSelect);
            });
        }

        if (retireDtInput) {
            retireDtInput.addEventListener('change', () => {
                handleRetireDateChange(retireDtInput);
            });
        }
    }

    // 전화번호 입력 필드 이벤트 리스너
    if (userTelInput) {
        userTelInput.addEventListener('input', (event) => {
            event.target.value = extractNumbers(event.target.value);
        });
    }

    if (userHpInput) {
        userHpInput.addEventListener('input', (event) => {
            event.target.value = extractNumbers(event.target.value);
        });
    }

    // 검색 버튼 클릭 이벤트 리스너
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', () => {
            currentKeyword = searchInput.value;
            currentPage = 0; // 검색 시 첫 페이지로 이동
            loadUsersTableWithPaging(currentSortBy, currentOrder, currentKeyword);
        });
        // Enter 키로 검색 기능 추가
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // 기본 폼 제출 방지
                searchButton.click();
            }
        });
    }

    // --- 폼 제출 핸들러 (사원 추가/수정) ---
    if (modalForm) {
        modalForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(modalForm);
            const userData = Object.fromEntries(formData.entries());

            // 유효성 검사
            if (userData.userTel) {
                if (!isValidPhoneNumber(userData.userTel)) {
                    alert('직통번호는 숫자만 포함하여 10자 이상이어야 합니다.');
                    if (userTelInput) userTelInput.focus();
                    return;
                }
            }
            if (userData.userHp) {
                if (!isValidPhoneNumber(userData.userHp)) {
                    alert('휴대폰 번호는 숫자만 포함하여 10자 이상이어야 합니다.');
                    if (userHpInput) userHpInput.focus();
                    return;
                }
            }

            if (userData.userEmail) {
                if (!isValidEmail(userData.userEmail)) {
                    alert('유효한 이메일 주소를 입력해주세요.');
                    if (userEmailInput) userEmailInput.focus();
                    return;
                }
            }
            // 신규 등록 시 비밀번호 필수 검사
            const isNewUser = !userData.userIdx;
            if (isNewUser && (!userData.userPswd || userData.userPswd.trim() === '')) {
                alert('신규 등록 시 비밀번호는 필수입니다.');
                modalForm.querySelector('input[name="userPswd"]').focus();
                return;
            }

            const userIdxToProcess = userData.userIdx;

            let method;
            let submitApiUrl;
            let successMessage;
            let errorMessagePrefix;

            if (userIdxToProcess) { // 기존 사원 수정
                method = 'PUT';
                submitApiUrl = `/api/users/${userIdxToProcess}`;
                successMessage = '사원 정보가 수정되었습니다.';
                errorMessagePrefix = '사원 수정';
                // 비밀번호 필드가 비어있으면 전송하지 않음 (기존 비밀번호 유지)
                if (!userData.userPswd || userData.userPswd.trim() === '') {
                    delete userData.userPswd;
                }
            } else { // 신규 사원 등록
                method = 'POST';
                submitApiUrl = `/api/users`;
                successMessage = '신규 사원이 등록되었습니다.';
                errorMessagePrefix = '신규 사원 등록';
                delete userData.userIdx; // 신규 등록 시 userIdx는 서버에서 생성
                
                //에러확인용 로그 				
                console.log("신규 등록 시 서버로 전송 직전 userData:", JSON.stringify(userData, null, 2));
            }

            console.log(`${errorMessagePrefix} 데이터:`, userData);
            console.log(`API 호출: ${method} ${submitApiUrl}`);

            try {
                const response = await fetch(submitApiUrl, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
                }

                console.log(`${errorMessagePrefix} 성공`);
                alert(successMessage);

                closeModal();
                loadUsersTableWithPaging(currentSortBy, currentOrder, currentKeyword); // 작업 후 테이블 새로 고침

            } catch (error) {
                console.error(`${errorMessagePrefix} 중 오류 발생:`, error);
                alert(`${errorMessagePrefix}에 실패했습니다. 오류: ` + error.message);
            }
        });
    } else {
        console.warn("모달 폼 요소(modalForm)를 찾을 수 없습니다. 폼 제출 기능이 작동하지 않습니다.");
    }

    // --- 삭제 버튼 클릭 이벤트 리스너 ---
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            const checkedCheckboxes = document.querySelectorAll('#userTableBody input[type="checkbox"]:checked');
            const userIdxsToDelete = Array.from(checkedCheckboxes).map(checkbox => {
                return checkbox.closest('tr').dataset.userIdx;
            });

            if (userIdxsToDelete.length === 0) {
                alert('삭제할 사원을 선택해주세요.');
                return;
            }

            if (!confirm(`${userIdxsToDelete.length}명의 사원을 정말 삭제하시겠습니까?`)) {
                return;
            }

            try {
                const response = await fetch(`/api/users/delete`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userIdxsToDelete)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
                }

                alert('선택된 사원 정보가 성공적으로 삭제되었습니다.');
                loadUsersTableWithPaging(currentSortBy, currentOrder, currentKeyword); // 삭제 후 테이블 새로 고침

            } catch (error) {
                console.error('사원 삭제 중 오류 발생:', error);
                alert('담당자로 설정된 사원입니다.');
            }
        });
    }

    // 테이블 첫 번째 td (체크박스) 클릭 시 이벤트 전파 중지
    document.querySelectorAll('table').forEach(table => {
        const firstCells = table.querySelectorAll('tbody tr td:first-child');
        firstCells.forEach(td => {
            td.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        });
    });

    // 전체 선택 체크박스
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (event) => {
            const isChecked = event.target.checked;
            const rowCheckboxes = document.querySelectorAll('#userTableBody input[type="checkbox"]');
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });
    }
});