document.addEventListener('DOMContentLoaded', () => {
    // 데이터를 채울 tbody 요소를 가져옵니다.
    const userTableBody = document.getElementById('userTableBody');

    // userTableBody 요소가 없으면 스크립트 실행 중지 (th:if 때문에 없을 수 있음)
    if (!userTableBody) {
        console.warn("ID가 'userTableBody'인 요소를 찾을 수 없습니다. th:if 조건 확인 필요.");
        return; // 요소가 없으면 더 이상 진행하지 않습니다.
    }

    // API 엔드포인트 URL 설정 (실제 백엔드 API URL로 변경해야 합니다!)
    // 예시: 백엔드 컨트롤러의 @RequestMapping과 @GetMapping 경로를 조합하세요.
    const apiUrl = '/api/users'; // <--- 실제 API 엔드포인트 URL로 변경하세요.

    // API를 호출하여 사용자 데이터를 가져오고 테이블을 업데이트하는 비동기 함수
    async function loadUsersTable() {
        try {
            // API 호출
            const response = await fetch(apiUrl);

            // 응답 상태 확인
            if (!response.ok) {
                // 200 OK가 아닌 경우 오류 처리
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 응답을 JSON 형식으로 파싱
            const users = await response.json();

            // 기존 tbody 내용을 지웁니다.
            userTableBody.innerHTML = '';

            // 가져온 사용자 데이터로 테이블 행 생성
            if (users && users.length > 0) {
                users.forEach(user => {
                    const row = document.createElement('tr');
                    // 클릭 이벤트 핸들러 연결 (opendatail 함수는 별도로 정의되어 있어야 합니다)
                    // 행 클릭 시 해당 user 객체 정보를 함께 넘겨주는 것도 고려할 수 있습니다.
                    // 예: row.onclick = () => opendatail(user);
                    row.onclick = opendatail; // opendatail 함수는 아래 예시 참고

                    // 테이블 헤더 순서에 맞춰 셀을 생성하고 데이터 채우기
                    // 헤더 순서: 체크박스, 이름, ID, 직통번호, H.P, 부서, 직책, 재직상태

                    // 체크박스 셀 (첫 번째 컬럼)
                    const checkboxCell = document.createElement('td');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    // 필요하다면 체크박스에 user.USER_IDX 또는 user.userId 같은 값을 data 속성으로 저장해 둘 수 있습니다.
                    // checkbox.dataset.userIdx = user.userIdx; // DTO에 USER_IDX가 Integer로 있음
                    checkboxCell.appendChild(checkbox);
                    row.appendChild(checkboxCell);

                    // 이름 (두 번째 컬럼): DTO 필드 USER_NM -> JSON userNm
                    const nameCell = document.createElement('td');
                    nameCell.textContent = user.userNm || ''; // user.userNm 사용
                    row.appendChild(nameCell);

                    // ID (세 번째 컬럼): DTO 필드 USER_ID -> JSON userId
                    const userIdCell = document.createElement('td');
                    userIdCell.textContent = user.userId || ''; // user.userId 사용
                    row.appendChild(userIdCell);

                    // 직통번호 (네 번째 컬럼): DTO 필드 USER_TEL -> JSON userTel
                    const userTelCell = document.createElement('td');
                    userTelCell.textContent = user.userTel || ''; // user.userTel 사용
                    row.appendChild(userTelCell);

                    // H.P (다섯 번째 컬럼): DTO 필드 USER_HP -> JSON userHp
                    const userHpCell = document.createElement('td');
                    userHpCell.textContent = user.userHp || ''; // user.userHp 사용
                    row.appendChild(userHpCell);

                    // 부서 (여섯 번째 컬럼): DTO 필드 USER_DEPT -> JSON userDept
                    const userDeptCell = document.createElement('td');
                    userDeptCell.textContent = user.userDept || ''; // user.userDept 사용
                    row.appendChild(userDeptCell);

                    // 직책 (일곱 번째 컬럼): DTO 필드 USER_POSITION -> JSON userPosition
                    const userPositionCell = document.createElement('td');
                    userPositionCell.textContent = user.userPosition || ''; // user.userPosition 사용
                    row.appendChild(userPositionCell);

                    // 재직상태 (여덟 번째 컬럼): DTO 필드 USER_STATUS -> JSON userStatus
                    const userStatusCell = document.createElement('td');
                    // 필요하다면 '01', '02' 등의 코드를 '재직중', '퇴사' 등으로 변환하는 로직 추가
                    userStatusCell.textContent = user.userStatus || ''; // user.userStatus 사용
                    row.appendChild(userStatusCell);

                    // 생성된 행을 tbody에 추가
                    userTableBody.appendChild(row);
                });
            } else {
                // 데이터가 없을 경우 메시지 표시
                 const noDataRow = document.createElement('tr');
                 const noDataCell = document.createElement('td');
                 noDataCell.colSpan = 8; // 테이블 컬럼 수에 맞게 colspan 조정 (체크박스 포함 총 8개 컬럼)
                 noDataCell.textContent = '등록된 사용자 데이터가 없습니다.';
                 noDataCell.style.textAlign = 'center';
                 noDataRow.appendChild(noDataCell);
                 userTableBody.appendChild(noDataRow);
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
});

// opendatail 함수 정의 (테이블 행 클릭 시 실행될 함수) - 예시
// 이 함수는 별도의 <script> 태그나 파일에 정의되어 있을 수도 있습니다.
function opendatail() {
    // 클릭된 행에 대한 상세 정보를 처리하는 로직을 여기에 작성합니다.
    // 예: 클릭된 행의 데이터를 가져와서 상세 페이지로 이동하거나 모달 창을 띄우는 등
    console.log('테이블 행이 클릭되었습니다.');
    // this 는 클릭된 <tr> 요소를 가리킵니다.
    // 만약 loadUsersTable 함수에서 row.onclick = () => opendatail(user); 와 같이 사용자 객체를 넘겼다면
    // 여기서는 function opendatail(userData) { ... } 와 같이 userData 매개변수로 사용자 정보에 접근할 수 있습니다.
}

// opendatail 함수 정의 (테이블 행 클릭 시 실행될 함수)
// 이 함수는 별도의 <script> 태그나 파일에 정의되어 있을 수도 있습니다.
function opendatail() {
    // 클릭된 행에 대한 상세 정보를 처리하는 로직을 여기에 작성합니다.
    // 예: 클릭된 행의 데이터를 가져와서 상세 페이지로 이동하거나 모달 창을 띄우는 등
    console.log('테이블 행이 클릭되었습니다.');
    // this 는 클릭된 <tr> 요소를 가리킵니다.
    // 예: 두 번째 셀(인덱스 1)인 이름 가져오기
    // const userName = this.cells[1].textContent;
    // console.log('클릭된 사용자 이름:', userName);
}




// 프론트 자스코드 
let currentTh = null;
        let currentOrder = 'desc';

        function order(thValue) {//정렬
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
        }

        //Modal ~ 
        function openModal() {
            const title = document.getElementById('modalTitle');
            title.textContent = '신규 사원 등록';
            document.getElementById('modal').style.display = 'flex';
            document.querySelector('#modalForm button[name="save"]').style.display = 'block';
            document.querySelector('#modalForm button[name="edit"]').style.display = 'none';
        }

        function closeModal() {
            document.getElementById('modal').style.display = 'none';
        }

        function outsideClick(e) {
            if (e.target.id === 'modal') {
                closeModal();
            }
        }



        function submitModal(event) {
            event.preventDefault();
            const siteName = document.querySelector('#modalForm input[name="siteName"]').value;
            console.log(currentTab + ' 등록됨:', siteName);
            closeModal();
        }

        //테이블 클릭 시 출력되는 modal
        function opendatail() {
            openModal();
            document.getElementById('modalTitle').textContent = '사원 수정';

            document.querySelector('#modalForm button[name="save"]').style.display = 'none';
            document.querySelector('#modalForm button[name="edit"]').style.display = 'block';
        }

        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('table').forEach(table => {
                const firstCells = table.querySelectorAll('tbody tr td:first-child');
                firstCells.forEach(td => {
                    td.setAttribute('onclick', 'event.stopPropagation()');
                });
            });
        });