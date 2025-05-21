package kr.co.d_erp.controllers; // 패키지 이름이 controllers로 되어 있다면 이대로 유지

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController; // @RestController 임포트

import kr.co.d_erp.dtos.WhmstDto; // WhmstDto 임포트
import kr.co.d_erp.service.WhmstService;
import lombok.RequiredArgsConstructor;

@RestController // RESTful API를 위한 컨트롤러. @ResponseBody 자동 포함.
@RequestMapping("/api/warehouses") // 클래스 레벨에서 공통 경로 설정
@RequiredArgsConstructor
public class WhmstController {

    private final WhmstService whmstService;

    // 창고 데이터 API 엔드포인트 (정렬 및 검색 지원)
    @GetMapping
    public ResponseEntity<List<WhmstDto>> getWarehouses( // List<Whmst> -> List<WhmstDto> 반환 타입 변경
            @RequestParam(name = "sortBy", defaultValue = "whIdx") String sortBy,
            @RequestParam(name = "sortDirection", defaultValue = "asc") String sortDirection,
            @RequestParam(name = "keyword", required = false) String keyword) {

        // 서비스 계층에서 DTO 리스트를 반환하도록 변경했으므로, 여기서도 DTO를 받도록 변경
        List<WhmstDto> warehouses = whmstService.findAllWarehouses(sortBy, sortDirection, keyword);
        return ResponseEntity.ok(warehouses);
    }

    /**
     * 신규 창고 등록 API
     * POST /api/warehouses
     * @param whmstDto 등록할 창고 정보 (JSON 형태로 받음)
     * @return 등록된 창고 정보와 HTTP 상태 코드
     */
    @PostMapping
    public ResponseEntity<WhmstDto> createWhmst(@RequestBody WhmstDto whmstDto) {
        try {
            // 필수 필드 검사 (WH_NM, WH_LOCATION은 여전히 필수)
            // WH_CD는 DB 트리거가 자동 생성하므로 여기서는 검사하지 않습니다.
            if (whmstDto.getWhNm() == null || whmstDto.getWhNm().trim().isEmpty() ||
                whmstDto.getWhLocation() == null || whmstDto.getWhLocation().trim().isEmpty()) {
                System.err.println("필수 입력 필드(창고명, 창고위치)가 누락되었습니다.");
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST); // 400 Bad Request
            }

            // 서비스 계층의 createWhmst 메서드 호출
            WhmstDto createdWhmst = whmstService.createWhmst(whmstDto);
            return new ResponseEntity<>(createdWhmst, HttpStatus.CREATED); // 201 Created (성공적으로 생성됨)
        } catch (Exception e) {
            // 예외 발생 시 로그 출력 및 500 Internal Server Error 반환
            System.err.println("창고 등록 중 오류 발생: " + e.getMessage());
            // 실제 운영 환경에서는 더 구체적인 예외 처리 및 사용자에게 의미 있는 메시지 반환 필요
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 특정 창고 단건 조회 API
     * GET /api/warehouses/{whIdx}
     * @param whIdx 조회할 창고의 고유 번호
     * @return 조회된 창고 정보와 HTTP 상태 코드
     */
    @GetMapping("/{whIdx}")
    public ResponseEntity<WhmstDto> getWhmstById(@PathVariable Long whIdx) {
        try {
            WhmstDto whmst = whmstService.getWhmstById(whIdx);
            if (whmst != null) {
                return new ResponseEntity<>(whmst, HttpStatus.OK); // 200 OK
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND); // 404 Not Found
            }
        } catch (Exception e) {
            System.err.println("창고 단건 조회 중 오류 발생: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR); // 500 Internal Server Error
        }
    }
}