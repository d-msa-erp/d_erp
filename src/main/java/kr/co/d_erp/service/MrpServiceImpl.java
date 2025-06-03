package kr.co.d_erp.service;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.co.d_erp.domain.MrpDetailView;
import kr.co.d_erp.domain.SalesView;
import kr.co.d_erp.dtos.BomItemDetailDto;
import kr.co.d_erp.dtos.MrpFirstDto;
import kr.co.d_erp.dtos.MrpFirstDtoProjection;
import kr.co.d_erp.dtos.MrpSecondDto;
import kr.co.d_erp.repository.oracle.MrpDetailViewRepository;


import lombok.RequiredArgsConstructor;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MrpServiceImpl implements MrpService {

    private final MrpDetailViewRepository mrpviewRepo;
    private final BomService bomService; // BomService 주입

    @Override
    public Page<MrpFirstDto> findMrpTargetOrders(String orderTypeFilter, String searchKeyword, Pageable pageable) {
        String effectiveOrderTypeFilter = (orderTypeFilter != null && !orderTypeFilter.isEmpty()) ? orderTypeFilter : null;
        String effectiveSearchKeyword = (searchKeyword != null && !searchKeyword.isEmpty()) ? searchKeyword : null;

        // 네이티브 쿼리를 사용하여 고유한 주문/완제품 정보를 가져옵니다.
        Page<MrpFirstDtoProjection> projectionPage = mrpviewRepo.findUniqueMrpTargetOrders(
            effectiveOrderTypeFilter,
            effectiveSearchKeyword,
            pageable
        );
        
        return projectionPage.map(this::mapProjectionToMrpFirstDto);
    }

    private MrpFirstDto mapProjectionToMrpFirstDto(MrpFirstDtoProjection projection) {
        if (projection == null) return null;
        return MrpFirstDto.builder()
                .orderIdx(projection.getOrderIdx())
                .orderCode(projection.getOrderCode())
                .prodCd(projection.getProdCd())
                .orderType(projection.getOrderType())
                .orderDate(projection.getOrderDate())
                .orderDeliveryDate(projection.getOrderDeliveryDate())
                .customerNm(projection.getCustomerNm())
                .productPrimaryItemIdx(projection.getProductPrimaryItemIdx())
                .productItemCd(projection.getProductItemCd())
                .productItemNm(projection.getProductItemNm())
                .productItemSpec(projection.getProductItemSpec())
                .orderQty(projection.getOrderQty()) // 완제품 총 생산 수량
                .productUnitNm(projection.getProductUnitNm())
                .productCurrentStock(projection.getProductCurrentStock())
                .productivity(projection.getProductivity()) 
                .remark(projection.getRemark())
                .orderStatusOverall(projection.getOrderStatusOverall())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MrpSecondDto> findMrpResults(Long orderIdx, Pageable pageable) {
        Page<MrpDetailView> viewResultsPage;
        if (orderIdx != null) {
            viewResultsPage = mrpviewRepo.findByOrderIdx(orderIdx, pageable);
        } else {
            viewResultsPage = mrpviewRepo.findAll(pageable); 
        }
        return viewResultsPage.map(this::mapViewToMrpSecondDto);
    }

    // MrpDetailView (자재 레벨)를 MrpSecondDto로 변환하는 함수
    private MrpSecondDto mapViewToMrpSecondDto(MrpDetailView viewdto) {
        if (viewdto == null) return null;
        MrpSecondDto dto = new MrpSecondDto();
        // ... (이전 답변의 MrpSecondDto 매핑 로직 유지) ...
        // 이 함수는 MrpDetailView (MRP_RESULT_DETAILS 뷰의 한 행)를 MrpSecondDto로 변환합니다.
        // MrpSecondDto는 여전히 자재 중심의 상세 정보를 포함할 수 있습니다.
        dto.setMrpIdx(viewdto.getMrpIdx());
        dto.setOrderIdx(viewdto.getOrderIdx());
        dto.setOrderCode(viewdto.getOrderCode());
        dto.setOrderType(viewdto.getOrderType());
        dto.setOrderDate(viewdto.getOrderDate());
        dto.setOrderDeliveryDate(viewdto.getOrderDeliveryDate());
        dto.setCustomerNm(viewdto.getCustomerNm());
        dto.setProductPrimaryItemIdx(viewdto.getProductPrimaryItemIdx());
        dto.setProductItemCd(viewdto.getProductItemCd());
        dto.setProductItemNm(viewdto.getProductItemNm());
        dto.setOrderQty(viewdto.getOrderQty()); // 완제품 총 생산 수량 (MrpDetailView에 이 필드가 있어야 함)

        dto.setProductUnitNm(viewdto.getProductUnitNm());
        // MrpDetailView 엔티티에 getProductionCode(), getProductivity()가 있다면 매핑 가능
        // dto.setProductionCode(viewdto.getProductionCode()); 
        // dto.setProductivity(viewdto.getProductivity());   

        dto.setMaterialItemIdx(viewdto.getMaterialItemIdx());
        dto.setMaterialItemCd(viewdto.getMaterialItemCd());
        dto.setMaterialItemNm(viewdto.getMaterialItemNm());
        dto.setMaterialItemSpec(viewdto.getMaterialItemSpec());
        dto.setMaterialUnitIdx(viewdto.getMaterialUnitIdx());
        dto.setMaterialUnitNm(viewdto.getMaterialUnitNm());
        dto.setRequiredQty(viewdto.getRequiredQty()); // 자재별 소요량
        dto.setCalculatedCost(viewdto.getCalculatedCost());
        dto.setRequireDate(viewdto.getRequireDate());
        dto.setMrpStatus(viewdto.getMrpStatus());
        dto.setMrpRemark(viewdto.getMrpRemark());
        dto.setMrpCreatedDate(viewdto.getMrpCreatedDate());
        dto.setMrpUpdatedDate(viewdto.getMrpUpdatedDate());
        dto.setOrderStatusOverall(viewdto.getOrderStatusOverall());
        dto.setExpectedInputQty(viewdto.getRequiredQty());
        dto.setProdCd(viewdto.getProdCd());
        return dto;
    }

    @Override
    public BomItemDetailDto getBomDetailsForMrp(Long parentItemId) {
        return bomService.getBomDetails(parentItemId);
    }
    
}