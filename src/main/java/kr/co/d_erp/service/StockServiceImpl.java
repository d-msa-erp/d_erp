package kr.co.d_erp.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import kr.co.d_erp.domain.Inventory;
import kr.co.d_erp.domain.Whmst;
import kr.co.d_erp.dtos.CustomerDTO;
import kr.co.d_erp.dtos.CustomerForItemDto;
import kr.co.d_erp.dtos.Itemmst;
import kr.co.d_erp.dtos.StockDto;
import kr.co.d_erp.dtos.StockProjection;
import kr.co.d_erp.dtos.StockRequestDto;
import kr.co.d_erp.dtos.UnitDto;
import kr.co.d_erp.dtos.UnitForItemDto;
import kr.co.d_erp.dtos.WhmstDto;
import kr.co.d_erp.repository.oracle.InventoryRepository;
import kr.co.d_erp.repository.oracle.ItemCustomerRepository;
import kr.co.d_erp.repository.oracle.ItemUnitRepository;
import kr.co.d_erp.repository.oracle.ItemmstRepository;
import kr.co.d_erp.repository.oracle.WhmstRepository;
import lombok.RequiredArgsConstructor;

/**
 * 재고 관리 서비스 구현체
 * 재고 조회, 등록, 수정 및 관련 기준 정보 관리 기능을 제공합니다.
 */
@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService{
	
	private final ItemmstRepository itemMstRepository;
	private final WhmstRepository whMstRepository;
	private final InventoryRepository invenRepository;
	private final ItemUnitRepository itemUnitRepository; 
    private final ItemCustomerRepository itemCustomerRepository; 
	
	/**
	 * 재고 목록을 페이징하여 조회합니다.
	 * @param itemFlagFilter 품목 구분 필터 (자재/제품)
	 * @param searchKeyword 검색어
	 * @param pageable 페이징 정보
	 * @return 페이징된 재고 목록
	 */
	@Override
	public Page<StockDto> getInventoryList(String itemFlagFilter, String searchKeyword, Pageable pageable) {
		String effectiveFlagFilter = (itemFlagFilter != null && !itemFlagFilter.isEmpty()) ? itemFlagFilter : null;
        String effectiveSearchKeyword = (searchKeyword != null && !searchKeyword.isEmpty()) ? searchKeyword : null;
        
        Page<StockProjection> projectionPage = invenRepository.findInventoryDetails(
        		effectiveFlagFilter, 
                effectiveSearchKeyword,
                pageable
            );
        return projectionPage.map(this::mapProjectionToDto);
	}
	
	/**
	 * StockProjection을 StockDto로 변환합니다.
	 * @param p 변환할 StockProjection 객체
	 * @return 변환된 StockDto 객체
	 */
	private StockDto mapProjectionToDto(StockProjection p) {
        if (p == null) return null;
        return StockDto.builder()
        		.itemIdx(p.getItemIdx())
                .itemNm(p.getItemNm())
                .itemCd(p.getItemCd())
                .itemCost(p.getItemCost())
                .unitNm(p.getUnitNm())
                .qty(p.getQty())
                .inv(p.getInv())
                .whIdx(p.getWhIdx())
                .whNm(p.getWhNm())
                .itemSpec(p.getItemSpec())
                .custNm(p.getCustNm())
                .userNm(p.getUserNm())
                .userTel(p.getUserTel())
                .userMail(p.getUserMail())
                .reMark(p.getReMark()) 
                .itemFlag(p.getItemFlag())
                .unitIdx(p.getUnitIdx())
                .custIdxForItem(p.getCustIdxForItem())
                .build();
    }
	
	/**
	 * 모든 단위 목록을 조회합니다.
	 * @return 모든 단위 목록
	 */
	@Override
	public List<UnitDto> getAllUnits() {
		List<UnitForItemDto> units = itemUnitRepository.findAll();
		return units.stream()
                .map(unit -> {
                    Integer unitIdAsInteger = null;
                    if (unit.getUnitIdx() != null) {
                        unitIdAsInteger = unit.getUnitIdx().intValue();
                    }
                    return UnitDto.builder()
                            .unitIdx(unitIdAsInteger)
                            .unitNm(unit.getUnitNm())
                            .build();
                })
                .collect(Collectors.toList());
	}
	
	/**
	 * 사업 유형별 거래처 목록을 조회합니다.
	 * @param bizFlag 사업 유형 구분
	 * @return 해당 사업 유형의 거래처 목록
	 */
	@Override
	public List<CustomerDTO> getCustomersByBizFlag(String bizFlag) {
		 List<CustomerForItemDto> customers = itemCustomerRepository.findByBizFlagOrderByCustNmAsc(bizFlag);
	        return customers.stream()
	                .map(customer -> CustomerDTO.builder()
	                        .custIdx(customer.getCustIdx())
	                        .custNm(customer.getCustNm())
	                        .build())
	                .collect(Collectors.toList());
	}
	
	/**
	 * 새로운 재고 품목을 등록합니다.
	 * @param requestDto 등록할 재고 품목 정보
	 * @return 등록된 재고 품목 정보
	 */
	@Transactional
    @Override
    public StockDto createStockItem(StockRequestDto requestDto) {
		UnitForItemDto unitMst = itemUnitRepository.findById(requestDto.getUnitIdx())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 단위 ID 입니다: " + requestDto.getUnitIdx()));
		CustomerForItemDto custMst = itemCustomerRepository.findById(requestDto.getCustIdx())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 거래처 ID 입니다: " + requestDto.getCustIdx()));
        Whmst whMst = whMstRepository.findById(requestDto.getWhIdx())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 창고 ID 입니다: " + requestDto.getWhIdx()));

        if (itemMstRepository.existsByItemCd(requestDto.getItemCd())) {
            throw new IllegalArgumentException("이미 존재하는 품목 코드입니다: " + requestDto.getItemCd());
        }

        Itemmst newItemMst = Itemmst.builder()
                .itemCd(requestDto.getItemCd())
                .itemNm(requestDto.getItemNm())
                .itemSpec(requestDto.getItemSpec())
                .itemFlag(requestDto.getItemFlag())
                .UnitForItemDto(unitMst)
                .CustomerForItemDto(custMst)
                .itemCost(requestDto.getItemCost())
                .optimalInv(requestDto.getOptimalInv())
                .remark(requestDto.getRemark())
                .build();
        Itemmst savedItemMst = itemMstRepository.save(newItemMst);

        Optional<Inventory> existingInventory = invenRepository.findByWhIdxAndItemIdx(whMst.getWhIdx(), savedItemMst.getItemIdx());
        if (existingInventory.isPresent()) {
            throw new IllegalArgumentException("해당 창고에 이미 품목의 재고가 존재합니다. 품목 ID: " + savedItemMst.getItemIdx() + ", 창고 ID: " + whMst.getWhIdx());
        }

        Inventory newInventory = Inventory.builder()
                .whIdx(whMst.getWhIdx())
                .itemIdx(savedItemMst.getItemIdx())
                .stockQty(requestDto.getQty())
                .build();
        invenRepository.save(newInventory);

        return convertToStockDto(savedItemMst, newInventory, whMst.getWhNm());
    }

    /**
     * 기존 재고 품목 정보를 수정합니다.
     * @param itemIdx 수정할 품목 ID
     * @param requestDto 수정할 재고 품목 정보
     * @return 수정된 재고 품목 정보
     */
    @Transactional
    @Override
    public StockDto updateStockItem(Long itemIdx, StockRequestDto requestDto) {
    	Itemmst itemMstToUpdate = itemMstRepository.findById(itemIdx)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 품목 ID 입니다: " + itemIdx));

    	UnitForItemDto unitMst = itemUnitRepository.findById(requestDto.getUnitIdx())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 단위 ID 입니다: " + requestDto.getUnitIdx()));
    	CustomerForItemDto custMst = itemCustomerRepository.findById(requestDto.getCustIdx())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 거래처 ID 입니다: " + requestDto.getCustIdx()));
        Whmst whMst = whMstRepository.findById(requestDto.getWhIdx())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 창고 ID 입니다: " + requestDto.getWhIdx()));

        itemMstToUpdate.setItemNm(requestDto.getItemNm());
        itemMstToUpdate.setItemSpec(requestDto.getItemSpec());
        itemMstToUpdate.setItemFlag(requestDto.getItemFlag());
        itemMstToUpdate.setUnitForItemDto(unitMst);
        itemMstToUpdate.setCustomerForItemDto(custMst);
        itemMstToUpdate.setItemCost(requestDto.getItemCost());
        itemMstToUpdate.setOptimalInv(requestDto.getOptimalInv());
        itemMstToUpdate.setRemark(requestDto.getRemark());
        Itemmst updatedItemMst = itemMstRepository.save(itemMstToUpdate);

        Inventory inventoryToUpdate = invenRepository.findByWhIdxAndItemIdx(whMst.getWhIdx(), updatedItemMst.getItemIdx())
                .orElseGet(() -> Inventory.builder()
                                .whIdx(whMst.getWhIdx())
                                .itemIdx(updatedItemMst.getItemIdx())
                                .build());
        inventoryToUpdate.setStockQty(requestDto.getQty());
        Inventory updatedInventory = invenRepository.save(inventoryToUpdate);

        return convertToStockDto(updatedItemMst, updatedInventory, whMst.getWhNm());
    }

    /**
     * 품목 마스터와 재고 정보를 StockDto로 변환합니다.
     * @param itemMst 품목 마스터 정보
     * @param inventory 재고 정보
     * @param whNm 창고명
     * @return 변환된 StockDto 객체
     */
    private StockDto convertToStockDto(Itemmst itemMst, Inventory inventory, String whNm) {
    	Integer unitIdAsInteger = null;
        if (itemMst.getUnitForItemDto() != null && itemMst.getUnitForItemDto().getUnitIdx() != null) {
            unitIdAsInteger = itemMst.getUnitForItemDto().getUnitIdx().intValue();
        }
        
        BigDecimal invChange = null;
        if (itemMst.getOptimalInv() != null) {
        	invChange = new BigDecimal(itemMst.getOptimalInv());
        }
        
        return StockDto.builder()
                .itemIdx(itemMst.getItemIdx())
                .itemCd(itemMst.getItemCd())
                .itemNm(itemMst.getItemNm())
                .itemSpec(itemMst.getItemSpec())
                .itemFlag(itemMst.getItemFlag())
                .unitIdx(unitIdAsInteger)
                .unitNm(itemMst.getUnitForItemDto().getUnitNm())
                .custIdxForItem(itemMst.getCustomerForItemDto().getCustIdx())
                .custNm(itemMst.getCustomerForItemDto().getCustNm())
                .itemCost(itemMst.getItemCost())
                .optimalInv(itemMst.getOptimalInv())
                .reMark(itemMst.getRemark())
                .qty(inventory.getStockQty())
                .inv(invChange)
                .whNm(whNm)
                .build();
    }
    
    /**
     * 모든 창고 목록을 조회합니다.
     * @return 모든 창고 목록
     */
    @Override
    public List<WhmstDto> getAllWarehouses() {
    	List<Whmst> warehouses = whMstRepository.findAll(Sort.by(Sort.Direction.ASC, "whNm"));
    	return warehouses.stream()
                .map(wh -> WhmstDto.builder()
                        .whIdx(wh.getWhIdx())
                        .whNm(wh.getWhNm())
                        .build())
                .collect(Collectors.toList());
    }
}