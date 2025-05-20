package kr.co.d_erp.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import kr.co.d_erp.dtos.BomDetailDto;
import kr.co.d_erp.service.BomDetailViewService;

import java.util.List;

// BOM 상세 정보 관련 REST API를 처리하는 컨트롤러
@RestController
@RequestMapping("/api/bom") // 기본 URL 경로 설정
@CrossOrigin(origins = "*") // 필요한 경우 CORS 허용 (개발 시 편의, 운영 시에는 특정 origin 지정 권장)
public class BomDetailViewController {

    private final BomDetailViewService bomDetailViewService;

    @Autowired
    public BomDetailViewController(BomDetailViewService bomDetailViewService) {
        this.bomDetailViewService = bomDetailViewService;
    }

    // 모든 BOM 상세 정보를 조회하는 GET 엔드포인트
    // 예: GET /api/bom/details
    @GetMapping("/details")
    public ResponseEntity<List<BomDetailDto>> getBomDetails() {
        List<BomDetailDto> bomDetails = bomDetailViewService.getAllBomDetails();
        // 조회된 데이터 리스트를 HTTP 200 OK 응답과 함께 반환
        return ResponseEntity.ok(bomDetails);
    }
}

