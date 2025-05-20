package kr.co.d_erp.service;

import kr.co.d_erp.domain.BomDetailView;
import kr.co.d_erp.dtos.BomDetailDto;
import kr.co.d_erp.repository.oracle.BomDetailViewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

// BomDetailViewService 구현체
@Service
public class BomDetailViewServiceImpl implements BomDetailViewService {

    private final BomDetailViewRepository bomDefailViewRepository;

    private final BomDetailViewRepository bomDetailViewRepository;

    @Autowired
    public BomDetailViewServiceImpl(BomDetailViewRepository bomDetailViewRepository, BomDetailViewRepository bomDefailViewRepository) {
        this.bomDetailViewRepository = bomDetailViewRepository;
        this.bomDefailViewRepository = bomDefailViewRepository;
    }

    @Override
    public List<BomDetailDto> getAllBomDetails() {
        // Repository를 사용하여 뷰의 모든 데이터를 조회
        List<BomDetailView> bomDetails = bomDetailViewRepository.findAll();

        // 조회된 Entity 리스트를 DTO 리스트로 변환
        return bomDetails.stream()
                .map(this::convertToDto) // 각 Entity를 DTO로 변환하는 메서드 호출
                .collect(Collectors.toList());
    }

    // BomDetailView Entity를 BomDetailDto로 변환하는 헬퍼 메서드
    private BomDetailDto convertToDto(BomDetailView bomDetailView) {
        BomDetailDto dto = new BomDetailDto();
        // --- 상위 품목(완제품) 정보 매핑 ---
        dto.setPitemCd(bomDetailView.getPItemCd());
        dto.setPitemNm(bomDetailView.getPItemNm());
        dto.setPitemFlag(bomDetailView.getPItemFlag());
        dto.setPUnitNm(bomDetailView.getPUnitNm());
        dto.setPCustNm(bomDetailView.getPCustNm());       // 상위 품목 고객사 추가
        dto.setPCycleTime(bomDetailView.getPCycleTime()); // 상위 품목 생산성(Cycle Time) 추가

        // --- 하위 품목(원자재) 정보 매핑 ---
        dto.setSitemCd(bomDetailView.getSItemCd());
        dto.setSitemNm(bomDetailView.getSItemNm());
        dto.setSitemFlag(bomDetailView.getSItemFlag());
        dto.setSUnitNm(bomDetailView.getSUnitNm());
        dto.setSCustNm(bomDetailView.getSCustNm());       // 하위 품목 고객사 추가

        // --- BOM 및 원가 관련 정보 매핑 ---
        // 소요량 필드명 변경: getBomUseQty()
        dto.setBomUseQty(bomDetailView.getBomUseQty());
        // 하위 품목 개별 단가 필드명 변경: getSItemUnitPrice()
        dto.setSItemUnitPrice(bomDetailView.getSItemUnitPrice());
        // 하위 품목 계산된 원가 필드명 추가: getSItemCalculatedCost()
        dto.setSItemCalculatedCost(bomDetailView.getSItemCalculatedCost());
        // 상위 품목의 총 원자재 원가 필드 추가: getPTotalRawMaterialCost()
        dto.setPTotalRawMaterialCost(bomDetailView.getPTotalRawMaterialCost());

        // --- 기타 정보 매핑 ---
        dto.setCatNm(bomDetailView.getCatNm());
        return dto;
    }
}