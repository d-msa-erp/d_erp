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
        dto.setSItemCd(bomDetailView.getSItemCd());
        dto.setSItemNm(bomDetailView.getSItemNm());
        dto.setCustNm(bomDetailView.getCustNm());
        dto.setCatNm(bomDetailView.getCatNm());
        dto.setUnitNm(bomDetailView.getUnitNm());
        dto.setItemPrice(bomDetailView.getItemPrice());
        // 상위 품목 정보(pItemCd, pItemNm)는 DTO에 포함시키지 않음
        return dto;
    }
}