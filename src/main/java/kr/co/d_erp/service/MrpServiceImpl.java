package kr.co.d_erp.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import kr.co.d_erp.domain.MrpDetailView;
import kr.co.d_erp.dtos.MrpSecondDto;
import kr.co.d_erp.repository.oracle.ItemCustomerRepository;
import kr.co.d_erp.repository.oracle.ItemInvenRepository;
import kr.co.d_erp.repository.oracle.ItemUnitRepository;
import kr.co.d_erp.repository.oracle.ItemmstRepository;
import kr.co.d_erp.repository.oracle.MrpDetailViewRepository;
import kr.co.d_erp.repository.oracle.MrpRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MrpServiceImpl implements MrpService {
    // ... 필드 주입 ...
    private final ItemInvenRepository invenRepository; // 필드명이 invenRepository로 잘 되어 있음
    private final MrpRepository mrpRepository;
    private final ItemUnitRepository unitRepository;
    private final ItemCustomerRepository custRepository;
    private final ItemmstRepository itemmstRepository;
    private final MrpDetailViewRepository mrpviewRepo;
    
    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Page<MrpSecondDto> findMrpTargetOrders(String orderTypeFilter, String searchKeyword, Pageable pageable) {
    	// orderTypeFilter가 null이거나 비어있으면 null로 처리하여 JPQL의 IS NULL 조건이 동작하도록 함 (선택 사항)
        String effectiveOrderTypeFilter = (orderTypeFilter != null && !orderTypeFilter.isEmpty()) ? orderTypeFilter : null;
        String effectiveSearchKeyword = (searchKeyword != null && !searchKeyword.isEmpty()) ? searchKeyword : null;

        Page<MrpDetailView> mrpDetailViewPage = mrpviewRepo.findOrdersForMrp(effectiveOrderTypeFilter, effectiveSearchKeyword, pageable);
        return mrpDetailViewPage.map(this::mapviewdtoToMrpSecondDto); // 기존 변환 메소드 재활용
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<MrpSecondDto> findMrpResults(Long orderIdx, Pageable pageable) {
        // Specification 등을 사용하여 동적 쿼리 생성 가능
        Page<MrpDetailView> viewResultsPage;
        if (orderIdx != null) {
            viewResultsPage = mrpviewRepo.findByOrderIdx(orderIdx, pageable);
        } else {
            // TODO: orderId가 없을 때의 전체 조회 또는 다른 기본 필터링 조건 적용
            viewResultsPage = mrpviewRepo.findAll(pageable); // 예시
        }

        // MrpResultDetailView 엔티티를 MrpSecondDto로 변환
        return viewResultsPage.map(this::mapviewdtoToMrpSecondDto);
    }

    private MrpSecondDto mapviewdtoToMrpSecondDto(MrpDetailView viewdto) {
        if (viewdto == null) return null;
        MrpSecondDto dto = new MrpSecondDto();
        dto.setMrpIdx(viewdto.getMrpIdx());
        dto.setOrderIdx(viewdto.getOrderIdx());
        dto.setOrderCode(viewdto.getOrderCode());
        dto.setOrderType(viewdto.getOrderType());
        dto.setOrderDate(viewdto.getOrderDate()); // LocalDate -> LocalDate (직접 할당)
        dto.setOrderDeliveryDate(viewdto.getOrderDeliveryDate()); // LocalDate -> LocalDate (직접 할당)
        dto.setCustomerNm(viewdto.getCustomerNm());

        dto.setProductPrimaryItemIdx(viewdto.getProductPrimaryItemIdx());
        dto.setProductItemCd(viewdto.getProductItemCd());
        dto.setProductItemNm(viewdto.getProductItemNm());

        dto.setMaterialItemIdx(viewdto.getMaterialItemIdx());
        dto.setMaterialItemCd(viewdto.getMaterialItemCd());
        dto.setMaterialItemNm(viewdto.getMaterialItemNm());
        dto.setMaterialItemSpec(viewdto.getMaterialItemSpec());

        dto.setMaterialUnitIdx(viewdto.getMaterialUnitIdx());
        dto.setMaterialUnitNm(viewdto.getMaterialUnitNm());

        dto.setRequiredQty(viewdto.getRequiredQty());
        dto.setCalculatedCost(viewdto.getCalculatedCost());

        dto.setRequireDate(viewdto.getRequireDate()); // LocalDate/LocalDateTime -> LocalDate/LocalDateTime (타입 일치 시 직접 할당)
        dto.setMrpStatus(viewdto.getMrpStatus());
        dto.setMrpRemark(viewdto.getMrpRemark());
        dto.setMrpCreatedDate(viewdto.getMrpCreatedDate()); // LocalDateTime -> LocalDateTime (직접 할당)
        dto.setMrpUpdatedDate(viewdto.getMrpUpdatedDate()); // LocalDateTime -> LocalDateTime (직접 할당)
        dto.setOrderStatusOverall(viewdto.getOrderStatusOverall());

        // expectedInputQty는 뷰에 컬럼이 없으므로, 별도 로직으로 채우거나 기본값 설정
        dto.setExpectedInputQty(viewdto.getRequiredQty()); // 예시: 우선 소요량과 동일하게

        return dto;
    }

}