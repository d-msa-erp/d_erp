let currentTh = null;
let currentOrder = 'desc';

// 정렬 함수
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
    // 정렬 로직 추가하기 + 리로드
}

// 신규 등록 Modal 열기 함수
function openNewModal() {
    // 모달 폼 초기화
    const newModalForm = document.getElementById('newModalForm');

    if (newModalForm) {
        newModalForm.reset(); // 폼 내용 초기화
        // 필요하다면 userIdx 숨김 필드 초기화
        const editingUserIdxInput = newModalForm.querySelector('input[name="userIdx"]');
        if (editingUserIdxInput) editingUserIdxInput.value = '';
    }

    const newModal = document.getElementById('newModal');

    if (newModal) {
        newModal.style.display = 'flex'; // 신규 등록 모달 표시
    }
     // 버튼 상태 설정은 HTML에서 display 스타일로 이미 되어 있어야 함
}

// Modal 닫기 함수 (어떤 모달을 닫을지 인자로 받음)
function closeModal(modalId) {
    const newModal = document.getElementById('newModal');
    const editModal = document.getElementById('editModal');

    if (modalId === 'newModal' && newModal) {
        newModal.style.display = 'none';
    } else if (modalId === 'editModal' && editModal) {
        editModal.style.display = 'none';
    }
    // 특정 모달 ID가 주어지지 않으면 열려있는 모달 모두 숨김 (안전 장치)
    if (!modalId) {
         if (newModal) newModal.style.display = 'none';
         if (editModal) editModal.style.display = 'none';
    }
}

// Modal 외부 클릭 시 닫기 함수 (어떤 모달이 열려 있는지 확인 - 전역)
function outsideClick(e) {
     const newModal = document.getElementById('newModal');
     const editModal = document.getElementById('editModal');

    if (e.target === newModal) { // 클릭된 요소가 신규 등록 모달 배경이면
        closeModal('newModal');
    } else if (e.target === editModal) { // 클릭된 요소가 수정 모달 배경이면
        closeModal('editModal');
    }
}


// --- 페이지 로드 후 실행될 코드 ---
document.addEventListener('DOMContentLoaded', () => {
	// 데이터를 채울 tbody 요소를 가져옴
	const userTableBody = document.getElementById('userTableBody');
    // 모달 폼 요소 가져옴 (모달 자체는 전역에서 접근)
    const newModalForm = document.getElementById('newModalForm');
    const editModalForm = document.getElementById('editModalForm');


	// userTableBody 요소가 없으면 스크립트 실행 중지
	if (!userTableBody) {
		console.warn("ID가 'userTableBody'인 요소를 찾을 수 없습니다.");
		return; // 요소가 없으면 더 이상 진행하지 않습니다.
	}
     // 모달 폼 요소도 없다면 경고
     if (!newModalForm || !editModalForm) {
        console.warn("신규 또는 수정 모달 폼 요소를 찾을 수 없습니다.");
        // 계속 진행할 수도 있지만, 폼 관련 기능은 작동하지 않음
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

					// 클릭 이벤트 핸들러 연결: opendatail 함수 호출
					row.onclick = opendatail; // opendatail는 이 DOMContentLoaded 스코프 내에 정의될 예정

					// 테이블 헤더 순서에 맞춰 셀을 생성하고 데이터 채우기
					// 헤더 순서: 체크박스, 이름, ID, 직통번호, H.P, 부서, 직책, 재직상태

					// 체크박스 셀 (첫 번째 컬럼) - 클릭 시 이벤트 전파 중지
					const checkboxCell = document.createElement('td');
					const checkbox = document.createElement('input');
					checkbox.type = 'checkbox';
                    checkbox.addEventListener('click', (event) => {
                         event.stopPropagation(); // 체크박스 클릭 시 행 클릭 이벤트 방지
                    });
                    // 필요하다면 체크박스에 user.userIdx 같은 값을 data 속성으로 저장
                    // checkbox.dataset.userIdx = user.userIdx;
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
				// 데이터가 없을 경우 메시지 표시
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


    // 테이블 행 클릭 시 호출될 async 함수 opendatail (수정 Modal 열기 및 데이터 채우기)
    async function opendatail() {
        // 'this'는 클릭된 <tr> 요소
        const clickedRow = this;

        // 행에 저장된 userIdx 값을 data 속성에서 가져옴 
        const userIdx = clickedRow.dataset.userIdx;

        if (!userIdx) {
            console.error('클릭된 행에서 사용자 ID를 찾을 수 없습니다.');
            alert('사용자 정보를 가져올 수 없습니다.');
            return; // userIdx가 없으면 함수 실행 중지
        }

        // 사원 수정 모달 열기
        editModal.style.display = 'flex'; // 수정 모달 표시

        // userIdx를 사용하여 특정 사용자 상세 정보를 가져오는 API 호출
        const detailApiUrl = `${apiUrl}/${userIdx}`; // 특정 사용자 조회 API URL (userIdx를 경로 변수로 사용)
        try {
            const response = await fetch(detailApiUrl); // API 호출

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const userData = await response.json(); // 단일 사용자 정보를 JSON으로 파싱

            // 가져온 userData 객체의 필드 값으로 사원 수정 모달 폼 (editModalForm)의 입력 필드를 채웁니다.
            // HTML의 editModalForm 내 입력 필드들에 name 속성이 올바르게 설정되어 있어야 합니다!
            // DTO 필드명(SNAKE_CASE) -> JSON 필드명(camelCase) 매핑에 주의

            // 숨겨진 input 필드에 userIdx 저장 (수정/삭제 시 필요)
            const editingUserIdxInput = editModalForm.querySelector('input[name="userIdx"]');
             if (editingUserIdxInput) editingUserIdxInput.value = userData.userIdx || ''; // userIdx 필드가 DTO에 있다고 가정

            // 텍스트 입력 필드 채우기 (name 속성 사용)
            // 비밀번호는 보통 수정 시 값을 자동으로 채우지 않습니다.
            const userIdInput = editModalForm.querySelector('input[name="userId"]');
            if (userIdInput) userIdInput.value = userData.userId || '';
            const userPswdInput = editModalForm.querySelector('input[name="userPswd"]');
            if (userPswdInput) userPswdInput.value = ''; // 수정 시 비밀번호 필드는 비워둠 (보안)

            const userNmInput = editModalForm.querySelector('input[name="userNm"]');
             if (userNmInput) userNmInput.value = userData.userNm || '';

            const userEMailInput = editModalForm.querySelector('input[name="userEMail"]');
             if (userEMailInput) userEMailInput.value = userData.userEmail || '';

            const userTelInput = editModalForm.querySelector('input[name="userTel"]');
             if (userTelInput) userTelInput.value = userData.userTel || '';

            const userHpInput = editModalForm.querySelector('input[name="userHp"]');
             if (userHpInput) userHpInput.value = userData.userHp || '';


            // 날짜 입력 필드 채우기 (name 속성 사용)
            // API 응답에서 'YYYY-MM-DD' 형식의 문자열로 넘어와야 input type="date"에 잘 들어갑니다.
            const hireDtInput = editModalForm.querySelector('input[name="hireDt"]');
             if (hireDtInput) hireDtInput.value = userData.hireDt || '';

            const retireDtInput = editModalForm.querySelector('input[name="retireDt"]');
             if (retireDtInput) retireDtInput.value = userData.retireDt || '';


            // Select 박스 값 설정 (name 속성과 option의 value 속성 일치 필요)
            const userRoleSelect = editModalForm.querySelector('select[name="userRole"]');
             if (userRoleSelect && userData.userRole) userRoleSelect.value = userData.userRole;

            const userDeptSelect = editModalForm.querySelector('select[name="userDept"]');
             if (userDeptSelect && userData.userDept) userDeptSelect.value = userData.userDept;

            const userPositionSelect = editModalForm.querySelector('select[name="userPosition"]');
             if (userPositionSelect && userData.userPosition) userPositionSelect.value = userData.userPosition;


            // Radio 버튼 값 설정 (name 속성과 value 속성 일치 필요)
            if (userData.userStatus) {
                const statusRadios = editModalForm.querySelectorAll('input[name="userStatus"][type="radio"]');
                statusRadios.forEach(radio => {
                    if (radio.value === userData.userStatus) {
                        radio.checked = true;
                    } else {
                        radio.checked = false; // 다른 라디오 버튼 체크 해제
                    }
                });
            }

        } catch (error) {
            // 오류 발생 시
            console.error('사용자 상세 정보를 불러오는 중 오류 발생:', error);
            alert('사용자 정보를 불러오는데 실패했습니다.'); // 사용자에게 알림
            closeModal('editModal'); // 오류 발생 시 수정 모달 닫기
        }
    }


    // --- 폼 제출 핸들러 (각 모달 폼에 대해 별도로 구현) ---

    // 신규 등록 폼 제출 핸들러
    if (newModalForm) { // 폼 요소가 있을 경우에만 이벤트 리스너 연결
        newModalForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // 폼 기본 제출 방지

            // 폼 데이터 수집 (FormData 객체 사용 추천)
            const formData = new FormData(newModalForm);
            const userData = Object.fromEntries(formData.entries()); // FormData를 일반 객체로 변환

            console.log('신규 사원 등록 데이터:', userData);

            // 신규 등록 API 호출 (예: POST /api/users)
            try {
                 const response = await fetch(apiUrl, { // apiUrl은 /api/users
                     method: 'POST', // 신규 등록은 보통 POST 메소드
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
                 // const result = await response.json(); // 백엔드에서 응답 본문에 저장된 사원 정보를 담는다면 파싱
                 console.log('신규 사원 등록 성공'); // result 사용 안 할 경우 로그 단순화
                 alert('신규 사원이 등록되었습니다.'); // 사용자에게 알림

                 closeModal('newModal'); // 신규 등록 모달 닫기
                 loadUsersTable(); // 테이블 데이터 새로고침 (필요시)

            } catch (error) {
                console.error('신규 사원 등록 중 오류 발생:', error);
                alert('신규 사원 등록에 실패했습니다. 오류: ' + error.message); // 사용자에게 알림
            }
        });
    } else {
        console.warn("신규 등록 폼 요소(newModalForm)를 찾을 수 없습니다. 신규 등록 기능을 사용할 수 없습니다.");
    }


    // 사원 수정 폼 제출 핸들러
    if (editModalForm) { // 폼 요소가 있을 경우에만 이벤트 리스너 연결
         editModalForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // 폼 기본 제출 방지

            // 폼 데이터 수집 (userIdx 포함)
            const formData = new FormData(editModalForm);
            const userData = Object.fromEntries(formData.entries()); // FormData를 일반 객체로 변환

            // userIdx는 숨김 필드에서 가져와야 합니다.
            const userIdxToEdit = userData.userIdx; // FormData에서 userIdx 가져오기
             if (!userIdxToEdit) {
                console.error('수정할 사용자 ID가 없습니다.');
                alert('수정 오류: 사용자 정보를 찾을 수 없습니다.');
                return;
            }

            console.log('사원 수정 데이터 (userIdx:', userIdxToEdit, '):', userData);

            // 사원 수정 API 호출 (예: PUT /api/users/{userIdx})
            const updateApiUrl = `${apiUrl}/${userIdxToEdit}`; // 수정할 특정 사용자의 URL
            try {
                 const response = await fetch(updateApiUrl, {
                     method: 'PUT', // 수정은 보통 PUT 메소드
                      headers: {
                         'Content-Type': 'application/json'
                         // 필요시 인증 헤더 등 추가
                     },
                     body: JSON.stringify(userData) // 수정 데이터 전송
                 });

                 if (!response.ok) {
                     const errorText = await response.text();
                     throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
                 }

                  // 성공 시
                 // const result = await response.json(); // 백엔드에서 응답 본문에 수정된 사원 정보를 담는다면 파싱
                 console.log('사원 수정 성공'); // result 사용 안 할 경우 로그 단순화
                 alert('사원 정보가 수정되었습니다.'); // 사용자에게 알림

                 closeModal('editModal'); // 수정 모달 닫기
                 loadUsersTable(); // 테이블 데이터 새로고침 (필요시)

            } catch (error) {
                console.error('사원 수정 중 오류 발생:', error);
                alert('사원 수정에 실패했습니다. 오류: ' + error.message); // 사용자에게 알림
            }
        });
    } else {
         console.warn("사원 수정 폼 요소(editModalForm)를 찾을 수 없습니다. 사원 수정 기능을 사용할 수 없습니다.");
    }


    // ★★★ 통합: 테이블 첫 번째 td (체크박스) 클릭 시 이벤트 전파 중지 ★★★
    // 기존의 두 번째 DOMContentLoaded 리스너 내용이 이 위치로 이동하고 통합되었습니다.
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