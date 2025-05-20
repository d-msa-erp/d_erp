let currentTh = null;
let currentOrder = 'desc';

// 정렬 함수 (전역)
function order(thValue) {
	const allArrows = document.querySelectorAll("th a");
	allArrows.forEach(a => a.textContent = '↓');

	if (currentTh === thValue) {
		currentOrder = currentOrder === 'desc' ? 'asc' : 'desc';
	} else {
		currentOrder = 'asc';
		currentTh = thValue;
	}

	const arrow = thValue.querySelector('a');
	arrow.textContent = currentOrder === 'asc' ? '↑' : '↓';
    // 실제 정렬 로직은 이 함수에 추가되어야 합니다. (데이터 재 로드 또는 정렬)
}

// 하나의 공유 Modal 열기 함수 (모드와 userIdx를 인자로 받음)
async function openSharedModal(mode, userIdx = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalForm = document.getElementById('modalForm');
    const saveButton = modalForm ? modalForm.querySelector('button[name="save"]') : null;
    const editButton = modalForm ? modalForm.querySelector('button[name="edit"]') : null;
    const userIdxInput = modalForm ? modalForm.querySelector('input[name="userIdx"]') : null;
    const userIdInput = modalForm ? modalForm.querySelector('input[name="userId"]') : null; // ID 입력 필드


    if (!modal || !modalForm || !modalTitle) {
        console.error('모달 관련 요소를 찾을 수 없습니다.');
        return; // 필수 요소 없으면 중지
    }

    // 폼 초기화 및 userIdx 숨김 필드 비우기
    modalForm.reset();
    if (userIdxInput) userIdxInput.value = '';
    if (userIdInput) userIdInput.readOnly = false; // ID 필드 쓰기 가능하게 (신규 등록용)
    if (saveButton) saveButton.style.display = 'none'; // 일단 두 버튼 모두 숨김
    if (editButton) editButton.style.display = 'none';


    if (mode === 'new') {
        // 신규 등록 모드
        modalTitle.textContent = '신규 사원 등록';
        if (saveButton) saveButton.style.display = 'block'; // 등록 버튼 표시
        if (userIdInput) userIdInput.focus(); // ID 필드에 포커스
        // password 필드를 required로 만듭니다. (HTML에서 이미 설정)

    } else if (mode === 'edit' && userIdx !== null) {
        // 사원 수정 모드
        modalTitle.textContent = '사원 수정';
        if (editButton) editButton.style.display = 'block'; // 수정 버튼 표시
        if (userIdInput) userIdInput.readOnly = true; // ID 필드 읽기 전용으로 (수정 불가)
        // password 필드의 required 속성을 제거하거나 false로 설정합니다. (HTML에서 조정)
        // 예: modalForm.querySelector('input[name="userPswd"]').required = false;


        // userIdx를 사용하여 특정 사용자 상세 정보를 가져오는 API 호출
        const detailApiUrl = `/api/users/${userIdx}`; // 특정 사용자 조회 API URL
        try {
            const response = await fetch(detailApiUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const userData = await response.json(); // 단일 사용자 정보 파싱

            // 가져온 userData 객체의 필드 값으로 모달 폼의 입력 필드를 채웁니다.
            // HTML의 modalForm 내 입력 필드들에 name 속성이 올바르게 설정되어 있어야 합니다!
            // DTO 필드명(SNAKE_CASE) -> JSON 필드명(camelCase) 매핑에 주의

            // userIdx 숨김 필드 채우기
            if (userIdxInput) userIdxInput.value = userData.userIdx || ''; // userIdx 필드가 DTO에 있다고 가정

            // 텍스트/날짜 입력 필드 채우기
            if (userIdInput) userIdInput.value = userData.userId || '';
            // modalForm.querySelector('input[name="userPswd"]').value = ''; // 수정 시 비밀번호 필드는 비워둠
            const userNmInput = modalForm.querySelector('input[name="userNm"]');
            if (userNmInput) userNmInput.value = userData.userNm || '';
            const userEmailInput = modalForm.querySelector('input[name="userEmail"]');
            if (userEmailInput) userEmailInput.value = userData.userEmail || '';
            const userTelInput = modalForm.querySelector('input[name="userTel"]');
            if (userTelInput) userTelInput.value = userData.userTel || '';
            const userHpInput = modalForm.querySelector('input[name="userHp"]');
            if (userHpInput) userHpInput.value = userData.userHp || '';
            const hireDtInput = modalForm.querySelector('input[name="hireDt"]');
            if (hireDtInput) hireDtInput.value = userData.hireDt || ''; // 'YYYY-MM-DD' 형식
            const retireDtInput = modalForm.querySelector('input[name="retireDt"]');
            if (retireDtInput) retireDtInput.value = userData.retireDt || ''; // 'YYYY-MM-DD' 형식

            // Select 박스 값 설정
            const userRoleSelect = modalForm.querySelector('select[name="userRole"]');
            if (userRoleSelect && userData.userRole) userRoleSelect.value = userData.userRole;
            const userDeptSelect = modalForm.querySelector('select[name="userDept"]');
            if (userDeptSelect && userData.userDept) userDeptSelect.value = userData.userDept;
            const userPositionSelect = modalForm.querySelector('select[name="userPosition"]');
            if (userPositionSelect && userData.userPosition) userPositionSelect.value = userData.userPosition;

            // Radio 버튼 값 설정
            if (userData.userStatus) {
                const statusRadios = modalForm.querySelectorAll('input[name="userStatus"][type="radio"]');
                statusRadios.forEach(radio => {
                    if (radio.value === userData.userStatus) {
                        radio.checked = true;
                    } else {
                        radio.checked = false;
                    }
                });
            }

        } catch (error) {
            console.error('사용자 상세 정보를 불러오는 중 오류 발생:', error);
            alert('사용자 정보를 불러오는데 실패했습니다.');
            closeModal(); // 오류 발생 시 모달 닫기
            return; // 오류 발생 시 모달 열지 않고 종료
        }
    } else {
         console.error('openSharedModal 함수 호출 오류: 유효하지 않은 모드 또는 userIdx가 누락되었습니다.', mode, userIdx);
         alert('모달을 여는 중 오류가 발생했습니다.');
         return; // 오류 발생 시 모달 열지 않고 종료
    }

    // 모든 설정이 완료되면 모달 표시
    modal.style.display = 'flex';
}


// Modal 닫기 함수 (하나의 모달 대상 - 전역)
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none'; // 모달 숨김
    }
    // 모달 닫을 때 폼 내용 초기화 (선택 사항이지만, 다음번 모달 열 때 깨끗하게 시작하기 좋음)
    const modalForm = document.getElementById('modalForm');
    if (modalForm) {
        modalForm.reset();
         // userIdx 숨김 필드 초기화
        const userIdxInput = modalForm.querySelector('input[name="userIdx"]');
        if (userIdxInput) userIdxInput.value = '';
    }
}

// Modal 외부 클릭 시 닫기 함수 (하나의 모달 대상 - 전역)
function outsideClick(e) {
     const modal = document.getElementById('modal');
    if (e.target === modal) { // 클릭된 요소가 모달 배경이면
        closeModal(); // 모달 닫기
    }
}


// --- 페이지 로드 후 실행될 코드 ---
document.addEventListener('DOMContentLoaded', () => {
	// 데이터를 채울 tbody 요소를 가져옴
	const userTableBody = document.getElementById('userTableBody');
    // ★★★ 수정: 하나의 모달 폼 요소만 가져옴 ★★★
    const modalForm = document.getElementById('modalForm');


	// userTableBody 요소가 없으면 스크립트 실행 중지
	if (!userTableBody) {
		console.warn("ID가 'userTableBody'인 요소를 찾을 수 없습니다.");
		return; // 요소가 없으면 더 이상 진행하지 않습니다.
	}
     // 모달 폼 요소도 없다면 경고
     if (!modalForm) {
        console.warn("모달 폼 요소(modalForm)를 찾을 수 없습니다. 폼 관련 기능이 작동하지 않습니다.");
     }


	// API 엔드포인트 URL 설정
	const apiUrl = '/api/users'; // 사원 목록 조회 및 등록/수정/삭제 기본 URL

	// API를 호출하여 사용자 데이터를 가져오고 테이블을 업데이트하는 비동기 함수
	async function loadUsersTable() {
		try {
			// API 호출
			const response = await fetch(apiUrl);

			// 응답 상태 확인
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// 응답을 JSON 형식으로 파싱 (사용자 목록 배열)
			const users = await response.json();

			// 기존 tbody 내용을 지웁니다.
			userTableBody.innerHTML = '';

			// 가져온 사용자 데이터로 테이블 행 생성
			if (users && users.length > 0) {
				users.forEach(user => {
					const row = document.createElement('tr');

					// 행에 userIdx 값을 data 속성으로 저장
					row.dataset.userIdx = user.userIdx; // user.userIdx는 API 응답 JSON의 필드명

					// ★★★ 수정: 클릭 이벤트 핸들러는 openSharedModal 함수를 'edit' 모드로 호출 ★★★
					// userIdx를 인자로 전달합니다.
					row.onclick = () => openSharedModal('edit', user.userIdx);

					// 테이블 헤더 순서에 맞춰 셀을 생성하고 데이터 채우기
					// ... (셀 생성 및 데이터 채우는 코드 그대로 유지 - 이전 hr.js 내용 참고) ...
                    // 체크박스 셀 (첫 번째 컬럼) - 클릭 시 이벤트 전파 중지
					const checkboxCell = document.createElement('td');
					const checkbox = document.createElement('input');
					checkbox.type = 'checkbox';
                    checkbox.addEventListener('click', (event) => {
                         event.stopPropagation(); // 체크박스 클릭 시 행 클릭 이벤트 방지
                    });
					checkboxCell.appendChild(checkbox);
					row.appendChild(checkboxCell);

					// 이름 (두 번째 컬럼): DTO 필드 USER_NM -> JSON userNm
					const nameCell = document.createElement('td');
					nameCell.textContent = user.userNm || '';
					row.appendChild(nameCell);

					// ID (세 번째 컬럼): DTO 필드 USER_ID -> JSON userId
					const userIdCell = document.createElement('td');
					userIdCell.textContent = user.userId || '';
					row.appendChild(userIdCell);

					// 직통번호 (네 번째 컬럼): DTO 필드 USER_TEL -> JSON userTel
					const userTelCell = document.createElement('td');
					userTelCell.textContent = user.userTel || '';
					row.appendChild(userTelCell);

					// H.P (다섯 번째 컬럼): DTO 필드 USER_HP -> JSON userHp
					const userHpCell = document.createElement('td');
					userHpCell.textContent = user.userHp || '';
					row.appendChild(userHpCell);

					// 부서 (여섯 번째 컬럼): DTO 필드 USER_DEPT -> JSON userDept
					const userDeptCell = document.createElement('td');
					userDeptCell.textContent = user.userDept || '';
					row.appendChild(userDeptCell);

					// 직책 (일곱 번째 컬럼): DTO 필드 USER_POSITION -> JSON userPosition
					const userPositionCell = document.createElement('td');
					userPositionCell.textContent = user.userPosition || '';
					row.appendChild(userPositionCell);

					// 재직상태 (여덟 번째 컬럼): DTO 필드 USER_STATUS -> JSON userStatus
					const userStatusCell = document.createElement('td');
					const statusCode = user.userStatus; // API에서 받은 상태 코드 값

					let statusText = ''; // 테이블에 표시할 텍스트를 저장할 변수

					// 상태 코드에 따라 표시할 텍스트 결정
					if (statusCode === '01') {
						statusText = '재직중';
					} else if (statusCode === '02') {
						statusText = '퇴사';
					} else if (statusCode === '03') {
                         statusText = '휴직';
                    } else if (statusCode === '04') {
                         statusText = '대기';
                    } else if (statusCode === '05') {
                         statusText = '정직';
                    }
                    else if (statusCode) {
						// 정의되지 않은 다른 코드
						statusText = `코드: ${statusCode}`; // 코드를 그대로 표시
					} else {
						// 상태 코드가 null이거나 비어있는 경우
						statusText = '';
					}
					userStatusCell.textContent = statusText; // 변환된 텍스트를 셀에 설정

					row.appendChild(userStatusCell);


					// 생성된 행을 tbody에 추가
					userTableBody.appendChild(row);
				});
			} else {
				// 데이터가 없을 경우 메시지 표시 (이전과 동일)
				userTableBody.innerHTML = `
					<tr>
						<td class="nodata" style="grid-column: span 8;justify-content: center;">등록된 데이터가 없습니다.</td>
					</tr>
				`;
			}

		} catch (error) {
			// 오류 발생 시 콘솔에 로그 출력 및 테이블에 오류 메시지 표시
			console.error('데이터를 불러오는 중 오류가 발생했습니다:', error);
			userTableBody.innerHTML = ''; // 기존 내용 지우기
			const errorRow = document.createElement('tr');
			const errorCell = document.createElement('td');
			errorCell.colSpan = 8; // 테이블 컬럼 수에 맞게 colspan 조정
			errorCell.textContent = '데이터 로딩 실패: ' + error.message; // 오류 메시지 간략 표시
			errorCell.style.color = 'red';
			errorCell.style.textAlign = 'center';
			errorRow.appendChild(errorCell);
			userTableBody.appendChild(errorRow);
		}
	}

	// 페이지 로드 시 데이터 로딩 함수 호출
	loadUsersTable();


    // --- 폼 제출 핸들러 (하나의 모달 폼에 대해 구현) ---

    // ★★★ 수정: 모달 폼 제출 핸들러 (신규 등록/수정 분기) ★★★
    if (modalForm) { // 폼 요소가 있을 경우에만 이벤트 리스너 연결
        modalForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // 폼 기본 제출 방지

            // 폼 데이터 수집
            const formData = new FormData(modalForm);
            const userData = Object.fromEntries(formData.entries()); // FormData를 일반 객체로 변환

            // userIdx 값을 확인하여 신규 등록(POST)인지 수정(PUT)인지 판단
            const userIdxToProcess = userData.userIdx; // userIdx 숨김 필드 값

            let method;
            let submitApiUrl;
            let successMessage;
            let errorMessagePrefix;

            if (userIdxToProcess) {
                // userIdx가 있으면 수정 (PUT 요청)
                method = 'PUT';
                submitApiUrl = `${apiUrl}/${userIdxToProcess}`; // 수정할 특정 사용자의 URL
                successMessage = '사원 정보가 수정되었습니다.';
                errorMessagePrefix = '사원 수정';
            } else {
                // userIdx가 없으면 신규 등록 (POST 요청)
                method = 'POST';
                submitApiUrl = apiUrl; // 신규 등록 URL (/api/users)
                successMessage = '신규 사원이 등록되었습니다.';
                errorMessagePrefix = '신규 사원 등록';
                 // 신규 등록 시에는 userIdx를 데이터에서 제외 (백엔드에서 자동 생성)
                 delete userData.userIdx;

                 // 신규 등록 시 비밀번호 필드가 비어있으면 제출 중단 (required는 HTML에서 처리)
                 if (!userData.userPswd || userData.userPswd.trim() === '') {
                     alert('신규 등록 시 비밀번호는 필수입니다.');
                     return; // 제출 중단
                 }
            }

            console.log(`${errorMessagePrefix} 데이터:`, userData);
             console.log(`API 호출: ${method} ${submitApiUrl}`);


            // API 호출 (POST 또는 PUT)
            try {
                 const response = await fetch(submitApiUrl, {
                     method: method,
                     headers: {
                         'Content-Type': 'application/json' // JSON 형식으로 보낼 때 헤더 설정
                         // 필요시 인증 헤더 등 추가
                     },
                     body: JSON.stringify(userData) // JavaScript 객체를 JSON 문자열로 변환하여 전송
                 });

                 if (!response.ok) {
                     // 백엔드에서 상태 코드나 오류 메시지를 어떻게 주는지에 따라 분기 처리
                     const errorText = await response.text();
                     throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
                 }

                 // 성공 시
                 // const result = await response.json(); // 백엔드에서 응답 본문에 정보를 담는다면 파싱
                 console.log(`${errorMessagePrefix} 성공`);
                 alert(successMessage); // 사용자에게 알림

                 closeModal(); // 모달 닫기
                 loadUsersTable(); // 테이블 데이터 새로고침 (필요시)

            } catch (error) {
                console.error(`${errorMessagePrefix} 중 오류 발생:`, error);
                alert(`${errorMessagePrefix}에 실패했습니다. 오류: ` + error.message); // 사용자에게 알림
            }
        });
    } else {
         console.warn("모달 폼 요소(modalForm)를 찾을 수 없습니다. 폼 제출 기능이 작동하지 않습니다.");
    }


    // --- 나머지 JavaScript 함수들 ---

    // 정렬 함수 (그대로 유지)
    // let currentTh = null; // 전역으로 이동됨
    // let currentOrder = 'desc'; // 전역으로 이동됨
    // function order(thValue) { ... } // 전역으로 이동됨

    // 통합: 테이블 첫 번째 td (체크박스) 클릭 시 이벤트 전파 중지
    document.querySelectorAll('table').forEach(table => {
        const firstCells = table.querySelectorAll('tbody tr td:first-child');
        firstCells.forEach(td => {
            td.addEventListener('click', (event) => {
                event.stopPropagation(); // td 클릭 시 행 클릭 이벤트 방지
            });
        });
    });

    // submitModal 함수는 이제 사용되지 않으므로 제거하거나 주석 처리할 수 있습니다.
    /*
    function submitModal(event) {
        event.preventDefault();
        const siteName = document.querySelector('#modalForm input[name="siteName"]').value;
        console.log(currentTab + ' 등록됨:', siteName);
        closeModal();
    }
    */

}); // 최상단 DOMContentLoaded 리스너 끝