package kr.co.d_erp.service;

import kr.co.d_erp.domain.WarehouseInventoryDetailView;
import kr.co.d_erp.dtos.WarehouseInventoryDetailDto;
import kr.co.d_erp.repository.oracle.WarehouseInventoryDetailViewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WarehouseService {

    private final WarehouseInventoryDetailViewRepository warehouseInventoryDetailViewRepository;

    public List<WarehouseInventoryDetailDto> getAllWarehouseInventoryDetails() {
        return warehouseInventoryDetailViewRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<WarehouseInventoryDetailDto> getWarehouseInventoryDetailsByWhIdx(Long whIdx) {
        return warehouseInventoryDetailViewRepository.findByWhIdx(whIdx).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<WarehouseInventoryDetailDto> getWarehouseInventoryDetailsByWhCd(String whCd) {
        return warehouseInventoryDetailViewRepository.findByWhCd(whCd).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private WarehouseInventoryDetailDto convertToDto(WarehouseInventoryDetailView view) {
        // Builder 패턴을 사용하여 DTO 객체 생성 및 필드 설정
        return WarehouseInventoryDetailDto.builder()
                // Warehouse Info
                .whIdx(view.getWhIdx())
                .whCd(view.getWhCd())
                .whNm(view.getWhNm())
                .whRemark(view.getWhRemark())
                .whType1(view.getWhType1())
                .whType2(view.getWhType2())
                .whType3(view.getWhType3())
                .useFlag(view.getUseFlag())
                .whLocation(view.getWhLocation())

                // Warehouse User Info
                .whUserId(view.getWhUserId())
                .whUserNm(view.getWhUserNm())
                .whUserEmail(view.getWhUserEmail())
                .whUserTel(view.getWhUserTel())
                .whUserHp(view.getWhUserHp())
                .whUserDept(view.getWhUserDept())
                .whUserPosition(view.getWhUserPosition())

                // Inventory Info
                .invIdx(view.getInvIdx())
                .stockQty(view.getStockQty())
                .invCreatedDate(view.getInvCreatedDate())
                .invUpdatedDate(view.getInvUpdatedDate())

                // Item Info
                .itemIdx(view.getItemIdx())
                .itemCd(view.getItemCd())
                .itemNm(view.getItemNm())
                .itemFlag(view.getItemFlag())
                .itemSpec(view.getItemSpec())
                .itemCost(view.getItemCost())
                .optimalInv(view.getOptimalInv())
                .cycleTime(view.getCycleTime())
                .itemRemark(view.getItemRemark())

                // Item Category Info
                .itemCat1Cd(view.getItemCat1Cd())
                .itemCat1Nm(view.getItemCat1Nm())
                .itemCat2Cd(view.getItemCat2Cd())
                .itemCat2Nm(view.getItemCat2Nm())

                // Item Unit Info
                .itemUnitNm(view.getItemUnitNm())

                // Item Customer Info
                .itemCustCd(view.getItemCustCd())
                .itemCustNm(view.getItemCustNm())
                .build();
    }
}