package kr.co.d_erp.service;


import java.util.List;

import kr.co.d_erp.dtos.BomDetailDto;

// BOM 상세 정보를 조회하는 서비스 인터페이스
public interface BomDetailViewService {

    // 모든 BOM 상세 정보를 DTO 리스트 형태로 반환
    List<BomDetailDto> getAllBomDetails();
}