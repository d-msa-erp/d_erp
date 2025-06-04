package kr.co.d_erp.service;

import kr.co.d_erp.domain.*; // Custmst, ItemCategory, Unit, Inventory, SeonikItem 등
import kr.co.d_erp.dtos.*;    // SeonikItemDto, CustomerDTO, CategoryDto, UnitDto
import kr.co.d_erp.repository.oracle.*; // 모든 관련 Repository import
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
// import java.util.Date; // Inventory 엔티티에서 @PrePersist 등으로 처리 시 직접 사용 안 함
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SeonikItemServiceImpl implements SeonikItemService {

    private final SeonikItemRepository seonikItemRepository;
    private final CustmstRepository custmstRepository;
    private final ItemCatRepository itemCatRepository;       // ItemCategory 엔티티를 다룸
    private final UnitRepository unitRepository;             // Unit 엔티티를 다룸
    private final InventoryRepository inventoryRepository;   // Inventory 엔티티를 다룸

    @PersistenceContext
    private final EntityManager em;

    @Override
    @Transactional(readOnly = true)
    public List<SeonikItemDto> getAllItems() {
        // SeonikItemRepository의 JPQL이 SeonikItemDto에 currentStockQty까지 채워서 반환
        return seonikItemRepository.findAllItemsWithJoins();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SeonikItemDto> getItemsByFlag(String itemFlag) {
        // SeonikItemRepository의 JPQL이 SeonikItemDto에 currentStockQty까지 채워서 반환
        return seonikItemRepository.findItemsWithJoinsByFlag(itemFlag);
    }

    @Override
    public void createItem(SeonikItemDto dto) {
        // SeonikItemDto의 unitIdx는 Integer, ItemCategory 관련 Idx는 Long으로 가정
        Unit itemUnitRef = em.getReference(Unit.class, dto.getUnitIdx());
        ItemCategory cat1Ref = em.getReference(ItemCategory.class, dto.getItemCat1Idx());
        ItemCategory cat2Ref = em.getReference(ItemCategory.class, dto.getItemCat2Idx());

        SeonikItem item = SeonikItem.builder()
                .itemCd(dto.getItemCd())
                .itemNm(dto.getItemNm())
                .itemFlag(dto.getItemFlag())
                .itemCat1(cat1Ref)
                .itemCat2(cat2Ref)
                .customer(em.getReference(Custmst.class, dto.getCustIdx()))
                .itemSpec(dto.getItemSpec())
                .itemUnit(itemUnitRef)
                .itemCost(dto.getItemCost())
                .optimalInv(dto.getOptimalInv())
                .cycleTime(dto.getCycleTime())
                .remark(dto.getRemark())
                .build();
        em.persist(item); // item.itemIdx 자동 생성 (IDENTITY 전략 사용 시)


    }

    @Override
    public void updateItem(Long itemIdx, SeonikItemDto dto) {
        SeonikItem item = em.find(SeonikItem.class, itemIdx);
        if (item == null) {
            throw new IllegalArgumentException("품목 ID " + itemIdx + "에 해당하는 품목이 존재하지 않습니다.");
        }

        Unit itemUnitRef = em.getReference(Unit.class, dto.getUnitIdx());
        ItemCategory cat1Ref = em.getReference(ItemCategory.class, dto.getItemCat1Idx());
        ItemCategory cat2Ref = em.getReference(ItemCategory.class, dto.getItemCat2Idx());

        item.setItemCd(dto.getItemCd());
        item.setItemNm(dto.getItemNm());
        item.setItemFlag(dto.getItemFlag());
        item.setItemCat1(cat1Ref);
        item.setItemCat2(cat2Ref);
        item.setCustomer(em.getReference(Custmst.class, dto.getCustIdx()));
        item.setItemSpec(dto.getItemSpec());
        item.setItemUnit(itemUnitRef);
        item.setItemCost(dto.getItemCost());
        item.setOptimalInv(dto.getOptimalInv());
        item.setCycleTime(dto.getCycleTime());
        item.setRemark(dto.getRemark());
        // 현재고량은 이 DTO를 통해 직접 수정하지 않고, 별도의 입출고 트랜잭션으로 TB_INVENTORY에서 관리됨.
    }

    @Override
    public void deleteItem(Long itemIdx) {
        SeonikItem item = em.find(SeonikItem.class, itemIdx);
        if (item != null) {
            // 품목 삭제 전, 해당 품목과 관련된 모든 창고의 재고 정보를 먼저 삭제
            inventoryRepository.deleteByItemIdx(itemIdx);
            em.remove(item); // 그 후 품목 마스터에서 품목을 삭제
        } else {
            throw new IllegalArgumentException("품목 ID " + itemIdx + "에 해당하는 품목이 존재하지 않습니다.");
        }
    }

    // --- 모달 옵션 데이터 조회 메소드 구현 ---
    @Override
    @Transactional(readOnly = true)
    public List<CustomerDTO> getAllCustomerOptions(String bizFlag) {
        // CustmstRepository가 CustomerDTO 목록을 반환 (kr.co.d_erp.dtos.CustomerDTO 사용)
        return custmstRepository.findCustIdxAndCustNmByBizFlag(bizFlag);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getParentItemCategoryOptions() {
        // ItemCatRepository는 ItemCategory 엔티티 목록을 반환
        List<ItemCategory> parentCategories = itemCatRepository.findByParentCategoryIsNullOrderByCatNmAsc();
        // ItemCategory 엔티티 목록을 CategoryDto 목록으로 변환
        return parentCategories.stream()
                .map(cat -> new CategoryDto(
                        cat.getCatIdx() != null ? cat.getCatIdx().intValue() : null, // Long to Integer
                        cat.getCatCd(),
                        cat.getCatNm(),
                        null, // 부모 카테고리이므로 parentIdx는 null
                        cat.getRemark()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getChildItemCategoryOptions(Long parentCategoryIdx) {
        List<ItemCategory> childCategories = itemCatRepository.findByParentCategory_CatIdxOrderByCatNmAsc(parentCategoryIdx);
        return childCategories.stream()
                .map(cat -> new CategoryDto(
                        cat.getCatIdx() != null ? cat.getCatIdx().intValue() : null, // Long to Integer
                        cat.getCatCd(),
                        cat.getCatNm(),
                        // 자식의 parentIdx는 매개변수로 받은 parentCategoryIdx와 같음. CategoryDto의 parentIdx가 Integer이므로 변환.
                        parentCategoryIdx != null ? parentCategoryIdx.intValue() : null,
                        cat.getRemark()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitDto> getAllUnitOptions() {
        // UnitRepository는 Unit 엔티티 목록을 반환 (Unit PK는 Integer)
        List<Unit> units = unitRepository.findAll(); // 필요시 정렬 추가: unitRepository.findAll(Sort.by("unitNm"))
        // Unit 엔티티 목록을 UnitDto 목록으로 변환
        return units.stream()
                .map(unit -> new UnitDto(unit.getUnitIdx(), unit.getUnitNm())) // Unit 엔티티의 getter 가정
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SeonikItemDto> getItemsByIdxs(List<Long> itemIdxs) {
        if (itemIdxs == null || itemIdxs.isEmpty()) {
            return List.of(); // 빈 리스트 반환
        }
        // SeonikItemRepository에 itemIdx 목록으로 조회하는 JPQL 메소드 필요
        // 예: @Query("SELECT new ... FROM SeonikItem i JOIN ... WHERE i.itemIdx IN :itemIdxs")
        // return seonikItemRepository.findItemsWithJoinsByIdxs(itemIdxs);
        // 위 메소드가 없다면, 각 ID에 대해 findById를 호출하거나 (N+1 문제),
        // 또는 모든 데이터를 가져와 필터링 (비효율적). JPQL IN 절 사용이 가장 좋음.
        // 여기서는 JPQL IN 절을 사용하는 메소드가 SeonikItemRepository에 추가되었다고 가정합니다.
        // 또는, 아래와 같이 getAllItems() 후 필터링 (데이터 양이 적을 때만 고려)
        List<SeonikItemDto> allItems = seonikItemRepository.findAllItemsWithJoins();
        return allItems.stream()
                .filter(item -> itemIdxs.contains(item.getItemIdx()))
                .collect(Collectors.toList());
        // ✳️ 더 나은 방법: SeonikItemRepository에 List<Long> itemIdxs를 받아 조회하는 메소드 추가
        // 예: List<SeonikItemDto> findDtosByIdxIn(List<Long> itemIdxs);
    }


    @Override
    public byte[] createItemsExcelFile(List<SeonikItemDto> items) throws IOException {
        Workbook workbook = new XSSFWorkbook(); // .xlsx 확장자용
        Sheet sheet = workbook.createSheet("품목 정보");

        // 헤더 스타일
        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);

        // 헤더 행 생성
        String[] headers = {"품목코드", "품목명", "자재/품목", "대분류", "소분류", "거래처", "단위", "현재고량", "단가", "규격", "적정재고", "CycleTime", "비고"};
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // 데이터 행 생성
        int rowNum = 1;
        Map<String, String> flagMap = Map.of("01", "자재", "02", "품목");

        for (SeonikItemDto item : items) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(item.getItemCd());
            row.createCell(1).setCellValue(item.getItemNm());
            row.createCell(2).setCellValue(flagMap.getOrDefault(item.getItemFlag(), item.getItemFlag()));
            row.createCell(3).setCellValue(item.getItemCat1Nm());
            row.createCell(4).setCellValue(item.getItemCat2Nm());
            row.createCell(5).setCellValue(item.getCustNm());
            row.createCell(6).setCellValue(item.getUnitNm());
            // 숫자 타입은 Double로 변환하여 셀에 설정 (Apache POI는 숫자 타입 셀을 선호)
            Cell stockCell = row.createCell(7);
            if (item.getCurrentStockQty() != null) stockCell.setCellValue(item.getCurrentStockQty().doubleValue()); else stockCell.setCellValue("");
            
            Cell costCell = row.createCell(8);
            if (item.getItemCost() != null) costCell.setCellValue(item.getItemCost().doubleValue()); else costCell.setCellValue("");
            
            row.createCell(9).setCellValue(item.getItemSpec());

            Cell optimalInvCell = row.createCell(10);
            if (item.getOptimalInv() != null) optimalInvCell.setCellValue(item.getOptimalInv().doubleValue()); else optimalInvCell.setCellValue("");

            Cell cycleTimeCell = row.createCell(11);
            if (item.getCycleTime() != null) cycleTimeCell.setCellValue(item.getCycleTime().doubleValue()); else cycleTimeCell.setCellValue("");
            
            row.createCell(12).setCellValue(item.getRemark());
        }

        // 컬럼 너비 자동 조정
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();
        return outputStream.toByteArray();
    }
    
    
}