// /js/bomExcel.js
console.log("[Excel] bomExcel.js 로드 확인");

/**
 * 선택된 BOM 항목들의 상세 정보를 엑셀 파일로 다운로드하도록 서버에 요청합니다.
 */
async function downloadSelectedBOMDetailsAsExcel() {
    console.log("[Excel] downloadSelectedBOMDetailsAsExcel() 호출됨 - 선택된 BOM 상세 정보 엑셀 다운로드 시도.");

    const checkedCheckboxes = document.querySelectorAll('#bomTbody input[type="checkbox"]:checked');
    if (checkedCheckboxes.length === 0) {
        alert("엑셀로 다운로드할 항목을 먼저 선택해주세요.");
        return;
    }

    const selectedItemIds = Array.from(checkedCheckboxes).map(cb => cb.closest('tr').dataset.id);
    console.log("[Excel] 선택된 BOM ID:", selectedItemIds);

    // 사용자에게 파일 생성 중임을 알리는 UI 피드백 (선택 사항)
    // 예: 로딩 스피너 표시
    // document.getElementById('loadingSpinner').style.display = 'block';

    try {
        // 백엔드의 엑셀 생성 API 엔드포인트 (실제 주소로 변경 필요)
        const response = await fetch('/api/bom/download-excel-details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: selectedItemIds }), // 선택된 ID 목록을 JSON 형태로 전송
        });

        if (!response.ok) {
            // 서버에서 오류 메시지를 JSON 형태로 보냈을 경우 처리
            let errorData = { message: `엑셀 파일 생성에 실패했습니다. 상태: ${response.status}` };
            try {
                errorData = await response.json();
            } catch (e) {
                // JSON 파싱 실패 시 기본 메시지 사용
            }
            throw new Error(errorData.message || `서버 오류: ${response.status}`);
        }

        // 서버에서 파일 이름을 Content-Disposition 헤더로 보내주는 경우
        const disposition = response.headers.get('Content-Disposition');
        let filename = 'bom_details.xlsx'; // 기본 파일명
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        const blob = await response.blob(); // 응답 본문을 Blob 객체로 변환
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename; // 다운로드될 파일명 설정
        document.body.appendChild(a);
        a.click();
        a.remove(); // 생성된 링크 제거
        window.URL.revokeObjectURL(downloadUrl); // URL 해제

        console.log("[Excel] 파일 다운로드 시작:", filename);

    } catch (error) {
        console.error("[Excel] 엑셀 다운로드 중 오류 발생:", error);
        alert(`엑셀 다운로드 오류: ${error.message}`);
    } finally {
        // 로딩 스피너 숨기기
        // document.getElementById('loadingSpinner').style.display = 'none';
    }
}