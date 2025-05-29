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

@Service
@RequiredArgsConstructor
public class StockServiceImpl implements StockService{
	
	private final ItemmstRepository itemMstRepository;
	private final WhmstRepository whMstRepository;
	private final InventoryRepository invenRepository;
	private final ItemUnitRepository itemUnitRepository; // 'i' 소문자로 변경 (인스턴스 변수)
    private final ItemCustomerRepository itemCustomerRepository; // 'i' 소문자로 변경 (인스턴스 변수)
	
	@Override
	public Page<StockDto> getInventoryList(String itemFlagFilter, String searchKeyword, Pageable pageable) {
		String effectiveFlagFilter = (itemFlagFilter != null && !itemFlagFilter.isEmpty()) ? itemFlagFilter : null;
        String effectiveSearchKeyword = (searchKeyword != null && !searchKeyword.isEmpty()) ? searchKeyword : null;
        
        Page<StockProjection> projectionPage = invenRepository.findInventoryDetails(
        		effectiveFlagFilter, 
                effectiveSearchKeyword, // CsearchCat 파라미터 제거
                pageable
            );
        return projectionPage.map(this::mapProjectionToDto);
	}
	
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
                .reMark(p.getReMark()) // Projection과 DTO 필드명 일치 (reMark vs remark)
                .itemFlag(p.getItemFlag())
                .unitIdx(p.getUnitIdx())
                .custIdxForItem(p.getCustIdxForItem())
                .build();
    }
	
	@Override
	public List<UnitDto> getAllUnits() {
		List<UnitForItemDto> units = itemUnitRepository.findAll(); // 필요시 정렬 추가: findAll(Sort.by("unitNm"))
		return units.stream()
                .map(unit -> {
                    Integer unitIdAsInteger = null;
                    if (unit.getUnitIdx() != null) {
                        // Long을 Integer로 변환합니다.
                        // 데이터 손실 가능성(Integer 범위 초과)에 유의해야 합니다.
                        // unitIdx 값이 Integer.MAX_VALUE를 넘지 않는다고 가정합니다.
                        unitIdAsInteger = unit.getUnitIdx().intValue();
                    }
                    return UnitDto.builder()
                            .unitIdx(unitIdAsInteger) // Integer 타입으로 설정
                            .unitNm(unit.getUnitNm())
                            .build();
                })
                .collect(Collectors.toList());
	}
	
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
	
	@Transactional
    @Override
    public StockDto createStockItem(StockRequestDto requestDto) {
        // 1. 연관 엔티티 조회 (단위, 거래처, 창고)
		UnitForItemDto unitMst = itemUnitRepository.findById(requestDto.getUnitIdx())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 단위 ID 입니다: " + requestDto.getUnitIdx()));
		CustomerForItemDto custMst = itemCustomerRepository.findById(requestDto.getCustIdx())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 거래처 ID 입니다: " + requestDto.getCustIdx()));
        Whmst whMst = whMstRepository.findById(requestDto.getWhIdx())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 창고 ID 입니다: " + requestDto.getWhIdx()));

        // 2. 품목 코드 중복 검사 (필요시)
        if (itemMstRepository.existsByItemCd(requestDto.getItemCd())) {
            throw new IllegalArgumentException("이미 존재하는 품목 코드입니다: " + requestDto.getItemCd());
        }

        // 3. 품목 마스터(TB_ITEMMST) 정보 생성 및 저장
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

        // 4. 재고(TB_INVENTORY) 정보 생성 및 저장
        // 동일 창고, 동일 품목 재고가 이미 있는지 확인 후 처리 (여기서는 신규 등록만 가정)
        Optional<Inventory> existingInventory = invenRepository.findByWhIdxAndItemIdx(whMst.getWhIdx(), savedItemMst.getItemIdx());
        if (existingInventory.isPresent()) {
            // 실무에서는 여기서 수량을 합치거나, 예외를 발생시킬 수 있습니다.
            // 여기서는 예외를 발생시키겠습니다. (신규 품목 등록 시 초기 재고는 없어야 한다는 가정)
            throw new IllegalArgumentException("해당 창고에 이미 품목의 재고가 존재합니다. 품목 ID: " + savedItemMst.getItemIdx() + ", 창고 ID: " + whMst.getWhIdx());
        }

        Inventory newInventory = Inventory.builder()
                .whIdx(whMst.getWhIdx()) // WhMst 엔티티 대신 ID를 직접 사용
                .itemIdx(savedItemMst.getItemIdx()) // ItemMst 엔티티 대신 ID를 직접 사용
                .stockQty(requestDto.getQty())
                // createdDate, updatedDate는 Inventory 엔티티의 @PrePersist, @PreUpdate로 자동 설정됨
                .build();
        invenRepository.save(newInventory);

        // 5. 반환할 StockDto 생성 (저장된 정보를 기반으로)
        return convertToStockDto(savedItemMst, newInventory, whMst.getWhNm());
    }

    @Transactional
    @Override
    public StockDto updateStockItem(Long itemIdx, StockRequestDto requestDto) {
        // 1. 수정할 품목 마스터 조회
    	Itemmst itemMstToUpdate = itemMstRepository.findById(itemIdx)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 품목 ID 입니다: " + itemIdx));

    	 System.out.println("Request DTO - unitIdx: " + requestDto.getUnitIdx());
    	    System.out.println("Request DTO - custIdx: " + requestDto.getCustIdx());
    	    System.out.println("Request DTO - whIdx: " + requestDto.getWhIdx());
        // 2. 연관 엔티티 조회 (단위, 거래처, 창고) - 변경될 수 있으므로 ID로 다시 조회
    	UnitForItemDto unitMst = itemUnitRepository.findById(requestDto.getUnitIdx())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 단위 ID 입니다: " + requestDto.getUnitIdx()));
    	CustomerForItemDto custMst = itemCustomerRepository.findById(requestDto.getCustIdx())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 거래처 ID 입니다: " + requestDto.getCustIdx()));
        Whmst whMst = whMstRepository.findById(requestDto.getWhIdx())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 창고 ID 입니다: " + requestDto.getWhIdx()));

        // 3. 품목 마스터(TB_ITEMMST) 정보 업데이트
        itemMstToUpdate.setItemNm(requestDto.getItemNm());
        itemMstToUpdate.setItemSpec(requestDto.getItemSpec());
        itemMstToUpdate.setItemFlag(requestDto.getItemFlag());
        itemMstToUpdate.setUnitForItemDto(unitMst);
        itemMstToUpdate.setCustomerForItemDto(custMst);
        itemMstToUpdate.setItemCost(requestDto.getItemCost());
        itemMstToUpdate.setOptimalInv(requestDto.getOptimalInv());
        itemMstToUpdate.setRemark(requestDto.getRemark());
        // itemCd는 일반적으로 수정하지 않음. 필요시 로직 추가.
        Itemmst updatedItemMst = itemMstRepository.save(itemMstToUpdate);

        // 4. 재고(TB_INVENTORY) 정보 업데이트 또는 생성
        // 특정 품목(itemIdx)의 특정 창고(whIdx) 재고를 찾아서 수량(qty) 업데이트
        Inventory inventoryToUpdate = invenRepository.findByWhIdxAndItemIdx(whMst.getWhIdx(), updatedItemMst.getItemIdx())
                .orElseGet(() -> Inventory.builder() // 해당 창고에 재고가 없으면 새로 생성
                                .whIdx(whMst.getWhIdx())
                                .itemIdx(updatedItemMst.getItemIdx())
                                // createdDate는 @PrePersist로 설정됨
                                .build());
        inventoryToUpdate.setStockQty(requestDto.getQty());
        // updatedDate는 @PreUpdate로 설정됨 (만약 새로 생성된 경우라면 @PrePersist가 먼저 호출됨)
        Inventory updatedInventory = invenRepository.save(inventoryToUpdate);

        // 5. 반환할 StockDto 생성
        return convertToStockDto(updatedItemMst, updatedInventory, whMst.getWhNm());
    }

    // ItemMst와 Inventory 정보를 StockDto로 변환하는 헬퍼 메소드
    private StockDto convertToStockDto(Itemmst itemMst, Inventory inventory, String whNm) {
    	Integer unitIdAsInteger = null;
        if (itemMst.getUnitForItemDto() != null && itemMst.getUnitForItemDto().getUnitIdx() != null) {
            // Long을 Integer로 변환. 데이터 손실 가능성에 유의.
            unitIdAsInteger = itemMst.getUnitForItemDto().getUnitIdx().intValue();
        }
     // optimalInv를 BigDecimal로 변환
        BigDecimal invChange = null;
        if (itemMst.getOptimalInv() != null) {
            // Long을 BigDecimal로 변환합니다.
        	invChange = new BigDecimal(itemMst.getOptimalInv());
        }
        return StockDto.builder()
                .itemIdx(itemMst.getItemIdx())
                .itemCd(itemMst.getItemCd())
                .itemNm(itemMst.getItemNm())
                .itemSpec(itemMst.getItemSpec())
                .itemFlag(itemMst.getItemFlag())
                .unitIdx(unitIdAsInteger)
                .unitNm(itemMst.getUnitForItemDto().getUnitNm()) // StockDto 필드명에 맞춰주세요 (예: unitNm)
                .custIdxForItem(itemMst.getCustomerForItemDto().getCustIdx()) // StockDto 필드명에 맞춰주세요 (예: custIdx)
                .custNm(itemMst.getCustomerForItemDto().getCustNm())   // StockDto 필드명에 맞춰주세요 (예: custNm)
                .itemCost(itemMst.getItemCost())
                .optimalInv(itemMst.getOptimalInv())
                .reMark(itemMst.getRemark()) // StockDto 필드명 reMark에 맞춰 reMark
                .qty(inventory.getStockQty())
                .inv(invChange) // StockDto의 inv는 적정재고이므로 itemMst.optimalInv
                .whNm(whNm)
                // userNm, userTel, userMail 등은 현재 ItemMst나 Inventory에 직접 없으므로,
                // 필요하다면 TB_WHMST의 담당자 정보를 가져오거나 다른 로직 필요. 여기서는 null 또는 기본값.
                // .userNm(whMst.get 담당자().getUserNm())
                .build();
    }
    
    @Override
    public List<WhmstDto> getAllWarehouses() {
    	// whMstRepository
    	List<Whmst> warehouses = whMstRepository.findAll(Sort.by(Sort.Direction.ASC, "whNm"));
    	return warehouses.stream()
                .map(wh -> WhmstDto.builder()
                        .whIdx(wh.getWhIdx())
                        .whNm(wh.getWhNm())
                        .build())
                .collect(Collectors.toList());
    }
}
