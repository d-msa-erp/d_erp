// /js/bomExcel.js
//console.log("[Excel] bomExcel.js 로드 확인");

async function downloadSelectedBOMDetailsAsExcel() {
    //console.log("[Excel] downloadSelectedBOMDetailsAsExcel() 호출됨 - 선택된 BOM 상세 정보 엑셀 다운로드 시도.");

    const checkedCheckboxes = document.querySelectorAll('#bomTbody input[type="checkbox"]:checked');
    if (checkedCheckboxes.length === 0) {
        alert("엑셀로 다운로드할 항목을 먼저 선택해주세요.");
        return;
    }

    const selectedItemIds = Array.from(checkedCheckboxes).map(cb => cb.closest('tr').dataset.id);
    //console.log("[Excel] 선택된 BOM ID:", selectedItemIds);

    try {
        const response = await fetch('/api/bom/download-excel-details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // === body 수정: 객체로 감싸지 않고 배열 자체를 JSON으로 변환 ===
            body: JSON.stringify(selectedItemIds), 
        });

        if (!response.ok) {
            let errorData = { message: `엑셀 파일 생성에 실패했습니다. 상태: ${response.status}` };
            try {
                // 서버에서 JSON 형태의 오류 메시지를 보낼 경우를 대비
                const errorResponse = await response.text(); // 먼저 텍스트로 받고
                try {
                    errorData = JSON.parse(errorResponse); // JSON 파싱 시도
                } catch (e) {
                    errorData.message = errorResponse; // 파싱 실패 시 텍스트 그대로 사용
                }

            } catch (e) {
                // 오류 응답 본문 처리 중 추가 오류 발생 시
            }
            throw new Error(errorData.message || `서버 오류: ${response.status}`);
        }

        const disposition = response.headers.get('Content-Disposition');
        let filename = 'bom_details.xlsx';
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                filename = decodeURIComponent(matches[1].replace(/['"]/g, '').replace(/UTF-8''/i, ''));
            }
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none'; // 화면에 보이지 않도록
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a); // 요소 제거
        window.URL.revokeObjectURL(downloadUrl);

        //console.log("[Excel] 파일 다운로드 시작:", filename);

    } catch (error) {
        console.error("[Excel] 엑셀 다운로드 중 오류 발생:", error);
        alert(`엑셀 다운로드 오류: ${error.message}`);
    }
}