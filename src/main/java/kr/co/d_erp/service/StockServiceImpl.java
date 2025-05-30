package kr.co.d_erp.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import kr.co.d_erp.domain.Inventory;
import kr.co.d_erp.domain.Whmst;
import kr.co.d_erp.dtos.CustomerDTO;
import kr.co.d_erp.dtos.CustomerForItemDto;
import kr.co.d_erp.dtos.Itemmst;
import kr.co.d_erp.dtos.StockDto;
import kr.co.d_erp.dtos.StockDto.StockDtoBuilder;
import kr.co.d_erp.dtos.StockForResponseDto;
import kr.co.d_erp.dtos.StockInvRequestDto;
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

	private final ItemUnitRepository itemUnitRepository; // 'i' 소문자로 변경 (인스턴스 변수)
    private final ItemCustomerRepository itemCustomerRepository; // 'i' 소문자로 변경 (인스턴스 변수)
    private final InventoryService inventoryService;
	
    
    @Override
    public List<StockForResponseDto> getAllItemForStock() {
    	 List<Itemmst> allItems = itemMstRepository.findAll(Sort.by(Sort.Direction.ASC, "itemNm")); // 품목명으로 정렬
    	    return allItems.stream().map(item -> {
	    	    Integer unitIdxAsInteger = null;
	            String unitName = null;
	            if (item.getUnitForItemDto() != null) { // 필드명 변경에 따른 getter 변경 및 null 체크
	                if (item.getUnitForItemDto().getUnitIdx() != null) {
	                    unitIdxAsInteger = item.getUnitForItemDto().getUnitIdx().intValue(); // Long -> Integer 변환
	                }
	                unitName = item.getUnitForItemDto().getUnitNm();
	            }
	
	            Long customerIdx = null;
	            String customerName = null;
	            if (item.getCustomerForItemDto() != null) { // 필드명 변경에 따른 getter 변경 및 null 체크
	                customerIdx = item.getCustomerForItemDto().getCustIdx();
	                customerName = item.getCustomerForItemDto().getCustNm();
	            }
    	    	return StockForResponseDto.builder()
    	            .itemIdx(item.getItemIdx())
    	            .itemCd(item.getItemCd())
    	            .itemNm(item.getItemNm())
    	            .itemCost(item.getItemCost())
    	            .optimalInv(item.getOptimalInv())
    	            .unitIdx(unitIdxAsInteger)
                    .unitNm(unitName)
                    .custIdx(customerIdx)
                    .custNm(customerName)
    	            .itemSpec(item.getItemSpec())
    	            .build();
    	    }).collect(Collectors.toList());
    	    
    }
  
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

                .invIdx(p.getInvIdx())
                .reMark(p.getReMark()) // Projection과 DTO 필드명 일치 (reMark vs remark)

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
	

	@Override
	public List<StockInvRequestDto> getAllItemsForStockRegistration() {
		List<Itemmst> allItems = itemMstRepository.findAll(Sort.by(Sort.Direction.ASC, "itemNm")); // 품목명으로 정렬
	    return allItems.stream().map(item -> {
	        Integer unitIdxAsInteger = null;
	        String unitName = null;
	        if (item.getUnitForItemDto() != null) {
	            if (item.getUnitForItemDto().getUnitIdx() != null) {
	                unitIdxAsInteger = item.getUnitForItemDto().getUnitIdx().intValue();
	            }
	            unitName = item.getUnitForItemDto().getUnitNm();
	        }

	        Long customerIdx = null;
	        String customerName = null;
	        if (item.getCustomerForItemDto() != null) {
	            customerIdx = item.getCustomerForItemDto().getCustIdx();
	            customerName = item.getCustomerForItemDto().getCustNm();
	        }

	        BigDecimal optimalInvBigDecimal = item.getOptimalInv() != null ? BigDecimal.valueOf(item.getOptimalInv()) : null;
	        BigDecimal itemCostFromItemMst = item.getItemCost() != null ? BigDecimal.valueOf(item.getItemCost()) : null; // Itemmst의 itemCost

	        // StockInvRequestDto의 필드에 맞춰서 값을 설정합니다.
	        // originalInvTransIdx, transDate, unitPrice는 Itemmst에서 직접 가져올 수 없으므로
	        // null 또는 기본값을 사용하거나, 별도의 로직(예: 최근 입고 정보 조회)으로 채워야 합니다.
	        // 여기서는 Itemmst 정보만으로 채울 수 있는 필드에 집중합니다.

	        return StockInvRequestDto.builder()
	                .itemIdx(item.getItemIdx())
	                .itemCd(item.getItemCd())
	                .itemNm(item.getItemNm())
	                .itemSpec(item.getItemSpec())
	                .itemFlag(item.getItemFlag())
	                .unitIdx(unitIdxAsInteger != null ? unitIdxAsInteger.longValue() : null) // StockInvRequestDto.unitIdx가 Long 타입이라고 가정
	                .unitNm(unitName)
	                .custIdx(customerIdx)
	                .custNm(customerName)
	                // .unitPrice(null) // Itemmst에 입고 시점 단가가 없다면 null 또는 Itemmst의 현재 단가(itemCostFromItemMst) 사용
	                .currentItemCost(itemCostFromItemMst) // Itemmst의 현재 단가를 currentItemCost 필드에 매핑
	                .optimalInv(optimalInvBigDecimal)
	                // .originalInvTransIdx(null) // Itemmst 정보만으로는 알 수 없음
	                // .transDate(null)           // Itemmst 정보만으로는 알 수 없음
	                .build();
	    }).collect(Collectors.toList());
	}
	
	@Transactional
	@Override
	public StockDto createInventoryDirectly(StockRequestDto requestDto) {
		System.out.println("StockServiceImpl - createInventoryDirectly 호출됨. DTO: " + requestDto);

		Long itemIdx = requestDto.getItemIdx();
        Long whIdx = requestDto.getWhIdx();
        BigDecimal qty = requestDto.getQty();

        if (itemIdx == null || whIdx == null || qty == null) {
            throw new IllegalArgumentException("품목 ID, 창고 ID, 수량은 필수입니다.");
        }
        if (qty.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("수량은 0보다 커야 합니다.");
        }

        Long currentUserId = null; // TODO: 실제 사용자 ID 로직 추가
        

        this.inventoryService.increaseStock(whIdx, itemIdx, qty, currentUserId);
        
        System.out.println("inventoryService.increaseStock 호출 완료: whIdx=" + whIdx + ", itemIdx=" + itemIdx + ", qty=" + qty);

        StockDto resultDto = new StockDto();
        resultDto.setItemIdx(itemIdx);
        resultDto.setWhIdx(whIdx);
        
        Optional<Inventory> updatedInventoryOpt = invenRepository.findByWhIdxAndItemIdx(whIdx, itemIdx);
        if (updatedInventoryOpt.isPresent()) {
            Inventory updatedInventory = updatedInventoryOpt.get();
            resultDto.setQty(updatedInventory.getStockQty());   // 실제 DB에 저장된 최신 수량
            resultDto.setInvIdx(updatedInventory.getInvIdx()); // TB_INVENTORY의 PK
        } else {
            // 이 경우는 발생하면 안되지만, 예외 처리 또는 기본값 설정
            System.err.println("createInventoryDirectly: 재고 증가 후 해당 재고를 찾을 수 없습니다! whIdx=" + whIdx + ", itemIdx=" + itemIdx);
            resultDto.setQty(qty); // 임시로 요청 수량 사용
        }      
        
        System.out.println("재고 직접 등록 처리 완료, 임시 StockDto 반환.");
        return resultDto;
    }
	
	@Override
	public void deleteInventoriesByInvIdxs(List<Long> invIdxs) {
		// TODO Auto-generated method stub
		
	}
    
	public StockDto updateStockItem(Long invIdx, StockRequestDto requestDto) {
        System.out.println("StockServiceImpl - updateStockItem 호출됨. invIdx: " + invIdx + ", DTO: " + requestDto);

        // 1. invIdx로 TB_INVENTORY 레코드 조회
        Inventory inventoryToUpdate = invenRepository.findById(invIdx)
                .orElseThrow(() -> new EntityNotFoundException("존재하지 않는 재고 ID 입니다: " + invIdx));

        // 2. TB_INVENTORY의 "보관 창고", "비고" 업데이트
        boolean inventoryChanged = false;

        // 2.1. 보관 창고 (whIdx) 업데이트
        if (requestDto.getWhIdx() != null && !requestDto.getWhIdx().equals(inventoryToUpdate.getWhIdx())) {
            // Whmst newWhmst = whMstRepository.findById(requestDto.getWhIdx()) // Whmst 엔티티를 직접 참조하는 경우
            //         .orElseThrow(() -> new EntityNotFoundException("존재하지 않는 창고 ID 입니다: " + requestDto.getWhIdx()));
            // inventoryToUpdate.setWhmst(newWhmst); 
            inventoryToUpdate.setWhIdx(requestDto.getWhIdx()); // Inventory 엔티티가 whIdx를 Long으로 직접 가지는 경우
            inventoryChanged = true;
            System.out.println("재고의 보관 창고 변경: " + requestDto.getWhIdx());
        }


        if (inventoryChanged) {
            inventoryToUpdate.setUpdatedDate(LocalDateTime.now()); // 수정일시 업데이트
            updatedInventory = invenRepository.save(inventoryToUpdate); // 변경된 경우에만 저장
        } else {
            updatedInventory = inventoryToUpdate; // 변경 없으면 기존 객체 사용
        }
        System.out.println("TB_INVENTORY 업데이트 확인: " + updatedInventory.getInvIdx());


        // 3. 관련된 TB_ITEMMST의 "단위", "매입처" 업데이트
        Long itemMasterIdx = inventoryToUpdate.getItemIdx(); // Inventory에서 Item ID 가져오기
        Itemmst itemMstToUpdate = itemMstRepository.findById(itemMasterIdx)
                .orElseThrow(() -> new EntityNotFoundException("존재하지 않는 품목 ID 입니다: " + itemMasterIdx));
        
        boolean itemMstChanged = false;

        // 3.1. 단위 (unitIdx) 업데이트
        if (requestDto.getUnitIdx() != null && 
            (itemMstToUpdate.getUnitForItemDto() == null || !requestDto.getUnitIdx().equals(itemMstToUpdate.getUnitForItemDto().getUnitIdx()))) {
            UnitForItemDto unitMst = itemUnitRepository.findById(requestDto.getUnitIdx())
                    .orElseThrow(() -> new EntityNotFoundException("존재하지 않는 단위 ID 입니다: " + requestDto.getUnitIdx()));
            itemMstToUpdate.setUnitForItemDto(unitMst);
            itemMstChanged = true;
            System.out.println("품목 단위 변경: " + unitMst.getUnitIdx());
        }

        // 3.2. 매입처 (custIdx) 업데이트
        if (requestDto.getCustIdx() != null &&
            (itemMstToUpdate.getCustomerForItemDto() == null || !requestDto.getCustIdx().equals(itemMstToUpdate.getCustomerForItemDto().getCustIdx()))) {
            CustomerForItemDto custMst = itemCustomerRepository.findById(requestDto.getCustIdx())
                    .orElseThrow(() -> new EntityNotFoundException("존재하지 않는 거래처 ID 입니다: " + requestDto.getCustIdx()));
            itemMstToUpdate.setCustomerForItemDto(custMst);
            itemMstChanged = true;
            System.out.println("품목 주거래처 변경: " + custMst.getCustIdx());
        }
        
        // 품목 마스터의 비고는 이 메소드에서 수정하지 않음 (재고 비고만 처리)

        Itemmst updatedItemMst = itemMstToUpdate; 
        if (itemMstChanged) {
            // Itemmst 엔티티에 updatedDate 필드가 있다면 여기서 설정
            // itemMstToUpdate.setUpdatedDate(LocalDateTime.now()); 
            updatedItemMst = itemMstRepository.save(itemMstToUpdate);
            System.out.println("TB_ITEMMST 업데이트 완료: " + updatedItemMst.getItemIdx());
        }

        // 4. 반환할 StockDto 생성
        Whmst finalWhmst = whMstRepository.findById(updatedInventory.getWhIdx()).orElse(null);
        String finalWhNm = (finalWhmst != null) ? finalWhmst.getWhNm() : "N/A";
        
        return convertToStockDto(updatedItemMst, updatedInventory, finalWhNm, finalWhmst);
    }
    
    private Inventory updatedInventory; // 이 필드는 멤버 변수로 있을 필요가 없습니다. updateStockItem 메소드 내 지역변수로 사용하세요.


    // convertToStockDto 헬퍼 메소드 수정 (Whmst 객체를 받아 창고 담당자 정보도 포함 가능하도록)
    private StockDto convertToStockDto(Itemmst itemMst, Inventory inventory, String whNm, Whmst warehouse) {
        Integer unitIdAsInteger = null;
        String unitName = null;
        if (itemMst.getUnitForItemDto() != null) {
            unitName = itemMst.getUnitForItemDto().getUnitNm();
            if (itemMst.getUnitForItemDto().getUnitIdx() != null) {
                unitIdAsInteger = itemMst.getUnitForItemDto().getUnitIdx().intValue();
            }
        }

        Long custIdxForItemVal = null;
        String custNameForItem = null;
        if (itemMst.getCustomerForItemDto() != null) {
            custIdxForItemVal = itemMst.getCustomerForItemDto().getCustIdx();
            custNameForItem = itemMst.getCustomerForItemDto().getCustNm();
        }

        BigDecimal invOptimalBigDecimal = null; 
        if (itemMst.getOptimalInv() != null) { 
            invOptimalBigDecimal = new BigDecimal(itemMst.getOptimalInv());
        }

        StockDtoBuilder builder = StockDto.builder()
                .invIdx(inventory.getInvIdx())               
                .itemIdx(itemMst.getItemIdx())             
                .itemCd(itemMst.getItemCd())               
                .itemNm(itemMst.getItemNm())               
                .itemSpec(itemMst.getItemSpec())           
                .itemFlag(itemMst.getItemFlag())           
                .unitIdx(unitIdAsInteger) // StockDto.unitIdx는 Integer
                .unitNm(unitName)                          
                .custIdxForItem(custIdxForItemVal) // StockDto.custIdxForItem은 Long         
                .custNm(custNameForItem)                   
                .itemCost(itemMst.getItemCost()) // StockDto.itemCost는 Double
                .optimalInv(itemMst.getOptimalInv()) // StockDto.optimalInv는 Long      
                .qty(inventory.getStockQty()) // StockDto.qty는 BigDecimal             
                .inv(invOptimalBigDecimal) // StockDto.inv는 BigDecimal                
                .whIdx(inventory.getWhIdx())               
                .whNm(whNm);


        return builder.build();
    }
    
    /**
     * 모든 활성 창고 목록을 조회합니다 (useFlag = 'Y')
     * @return 활성 창고 목록
     */
    @Override
    public List<WhmstDto> getAllWarehouses() {
        // 활성 창고만 조회 (useFlag = 'Y')
        List<Whmst> warehouses = whMstRepository.findByUseFlagOrderByWhNmAsc("Y");
        return warehouses.stream()
            .map(wh -> WhmstDto.builder()
                .whIdx(wh.getWhIdx())
                .whNm(wh.getWhNm())
                .build())
            .collect(Collectors.toList());
    }

    @Transactional
    @Override
    public void deleteInventories(List<Long> invIdxs) {
    	if (invIdxs == null || invIdxs.isEmpty()) {
            throw new IllegalArgumentException("삭제할 재고 ID 목록이 비어있습니다.");
        }
        // 방법 2: Spring Data JPA가 메소드 이름으로 생성하는 쿼리 사용
        invenRepository.deleteByInvIdxIn(invIdxs);
    }
    
    
    @Override
    public byte[] createExcelFile(String itemFlagFilter, String searchKeyword) throws IOException {
    	// 1. 데이터 조회
        // Excel에는 모든 데이터를 넣기 위해 페이지네이션 없이 조회하거나 매우 큰 페이지로 조회
        // 여기서는 예시로 Pageable.unpaged() 또는 매우 큰 size를 사용합니다.
        // 참고: Pageable.unpaged()는 Spring Boot 2.2+ 에서 사용 가능하며, 
        // 그 이전 버전이거나 많은 데이터로 메모리 문제가 우려되면 스트리밍 방식이나 별도 쿼리 고려
        Pageable allDataPageable = PageRequest.of(0, Integer.MAX_VALUE, Sort.by("itemNm").ascending()); // 예: 품목명 오름차순 정렬, 모든 데이터
        
        // getInventoryList 메소드가 String itemFlagFilter, String searchKeyword, Pageable pageable을 받으므로 그대로 활용
        Page<StockDto> stockPage = getInventoryList(itemFlagFilter, searchKeyword, allDataPageable);
        List<StockDto> stocks = stockPage.getContent();

        // 2. Excel 워크북 및 시트 생성
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("재고 목록");

            // 3. 헤더 폰트 및 스타일 설정
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.BLUE_GREY.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCellStyle.setAlignment(HorizontalAlignment.CENTER);

            // 4. 헤더 행 생성
            String[] columns = {"품목코드", "품목명", "규격", "현재고", "단위", "창고명", "창고담당자", "적정재고", "기본매입처", "비고"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            // 5. 데이터 행 채우기
            int rowNum = 1;
            for (StockDto stock : stocks) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(stock.getItemCd() != null ? stock.getItemCd() : "");
                row.createCell(1).setCellValue(stock.getItemNm() != null ? stock.getItemNm() : "");
                row.createCell(2).setCellValue(stock.getItemSpec() != null ? stock.getItemSpec() : "");
                // BigDecimal은 doubleValue() 또는 toString()으로 변환하여 셀에 입력
                row.createCell(3).setCellValue(stock.getQty() != null ? stock.getQty().doubleValue() : 0.0);
                row.createCell(4).setCellValue(stock.getUnitNm() != null ? stock.getUnitNm() : "");
                row.createCell(5).setCellValue(stock.getWhNm() != null ? stock.getWhNm() : "");
                row.createCell(6).setCellValue(stock.getUserNm() != null ? stock.getUserNm() : ""); // 창고 담당자
                row.createCell(7).setCellValue(stock.getInv() != null ? stock.getInv().doubleValue() : (stock.getOptimalInv() != null ? stock.getOptimalInv() : 0.0)); // 적정재고
                row.createCell(8).setCellValue(stock.getCustNm() != null ? stock.getCustNm() : ""); // 기본 매입처명
                row.createCell(9).setCellValue(stock.getReMark() != null ? stock.getReMark() : "");
            }

            // 6. 컬럼 너비 자동 조정
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }
}

