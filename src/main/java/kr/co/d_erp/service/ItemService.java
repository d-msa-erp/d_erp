//package kr.co.d_erp.service;
//
//import java.io.ByteArrayOutputStream;
//import java.io.IOException;
//import java.util.List;
//import java.util.stream.Collectors;
//
//import org.apache.poi.ss.usermodel.Cell;
//import org.apache.poi.ss.usermodel.CellStyle;
//import org.apache.poi.ss.usermodel.Font;
//import org.apache.poi.ss.usermodel.Row;
//import org.apache.poi.ss.usermodel.Sheet;
//import org.apache.poi.ss.usermodel.Workbook;
//import org.apache.poi.xssf.usermodel.XSSFWorkbook;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.Pageable;
//import org.springframework.data.domain.Sort;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import jakarta.persistence.EntityNotFoundException;
//import kr.co.d_erp.dtos.CatDto;
//import kr.co.d_erp.dtos.CustomerForItemDto;
//import kr.co.d_erp.dtos.InvenDto;
//import kr.co.d_erp.dtos.ItemForSelectionDto;
//import kr.co.d_erp.dtos.Itemmst;
//import kr.co.d_erp.dtos.UnitForItemDto;
//import kr.co.d_erp.repository.oracle.ItemCatRepository;
//import kr.co.d_erp.repository.oracle.ItemCustomerRepository;
//import kr.co.d_erp.repository.oracle.ItemInvenRepository;
//import kr.co.d_erp.repository.oracle.ItemUnitRepository;
//import kr.co.d_erp.repository.oracle.ItemmstRepository;
//import kr.co.d_erp.dtos.Item; // Item.CreateRequest, Item.UpdateRequest, Item.Response 사용을 위해
//
//@Service
//public class ItemService {
//
//    private final ItemmstRepository itemmstRepository;
//    private final ItemCatRepository itemCatRepository;
//    private final ItemCustomerRepository itemCustomerRepository;
//    private final ItemInvenRepository itemInvenRepository;
//    private final ItemUnitRepository itemUnitRepository;
//
//    public ItemService(ItemmstRepository itemmstRepository,
//                       ItemCatRepository itemCatRepository,
//                       ItemCustomerRepository itemCustomerRepository,
//                       ItemInvenRepository itemInvenRepository,
//                       ItemUnitRepository itemUnitRepository) {
//        this.itemmstRepository = itemmstRepository;
//        this.itemCatRepository = itemCatRepository;
//        this.itemCustomerRepository = itemCustomerRepository;
//        this.itemInvenRepository = itemInvenRepository;
//        this.itemUnitRepository = itemUnitRepository;
//    }
//
//    @Transactional
//    public void deleteItems(List<Long> itemIdxs) {
//        itemmstRepository.deleteAllByIdInBatch(itemIdxs);
//    }
//
//    @Transactional(readOnly = true)
//    public byte[] createExcelFile(String CsearchCat, String CsearchItem) throws IOException {
//        List<Itemmst> items = itemmstRepository.findForExcel(CsearchCat, CsearchItem);
//
//        Workbook workbook = new XSSFWorkbook();
//        Sheet sheet = workbook.createSheet("품목 리스트");
//
//        String[] headers = {"품목 코드", "품목명", "대분류", "소분류", "거래처명", "단위", "수량", "품목원가", "규격", "비고", "품목구분"};
//        Row headerRow = sheet.createRow(0);
//        CellStyle headerStyle = workbook.createCellStyle();
//        Font headerFont = workbook.createFont();
//        headerFont.setBold(true);
//        headerStyle.setFont(headerFont);
//        for (int i = 0; i < headers.length; i++) {
//            Cell cell = headerRow.createCell(i);
//            cell.setCellValue(headers[i]);
//            cell.setCellStyle(headerStyle);
//        }
//
//        int rowNum = 1;
//        for (Itemmst item : items) {
//            Row row = sheet.createRow(rowNum++);
//            row.createCell(0).setCellValue(item.getItemCd());
//            row.createCell(1).setCellValue(item.getItemNm());
//            row.createCell(2).setCellValue(item.getCatDto1() != null ? item.getCatDto1().getCatNm() : "");
//            row.createCell(3).setCellValue(item.getCatDto2() != null ? item.getCatDto2().getCatNm() : "");
//            row.createCell(4).setCellValue(item.getCustomerForItemDto() != null ? item.getCustomerForItemDto().getCustNm() : "");
//            row.createCell(5).setCellValue(item.getUnitForItemDto() != null ? item.getUnitForItemDto().getUnitNm() : "");
//
//            Long totalStockQty = 0L;
//            if (item.getInvenDto() != null) {
//                for (InvenDto invenDto : item.getInvenDto()) {
//                    if (invenDto.getStockQty() != null) {
//                        totalStockQty += invenDto.getStockQty();
//                    }
//                }
//            }
//            row.createCell(6).setCellValue(totalStockQty);
//
//            row.createCell(7).setCellValue(item.getItemCost() != null ? item.getItemCost() : 0.0);
//            row.createCell(8).setCellValue(item.getItemSpec());
//            row.createCell(9).setCellValue(item.getRemark());
//            row.createCell(10).setCellValue(item.getItemFlag());
//        }
//
//        for (int i = 0; i < headers.length; i++) {
//            sheet.autoSizeColumn(i);
//        }
//
//        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
//        workbook.write(outputStream);
//        workbook.close();
//        return outputStream.toByteArray();
//    }
//
//    @Transactional(readOnly = true)
//    public Page<Itemmst> getSearchItem(Pageable pageable, String CsearchCat, String CsearchItem) {
//        return itemmstRepository.findWithJoinsAndSearch(CsearchCat, CsearchItem, pageable);
//    }
//
//    @Transactional(readOnly = true)
//    public long getTotalSearchItemCount(String CsearchCat, String CsearchItem) {
//        return itemmstRepository.countWithSearch(CsearchCat, CsearchItem);
//    }
//
//    @Transactional(readOnly = true)
//    public Page<Itemmst> getPagingItem(Pageable pageable) {
//        return itemmstRepository.findAllWithJoins(pageable);
//    }
//
//    @Transactional(readOnly = true)
//    public long getTotalItemCount() {
//        return itemmstRepository.count();
//    }
//
//    @Transactional(readOnly = true)
//    public Itemmst getItemById(Long itemIdx) {
//        // findById() 호출 시 Fetch Join된 데이터가 필요하다면, ItemmstRepository에 별도 JPQL 쿼리 정의
//        return itemmstRepository.findById(itemIdx)
//                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + itemIdx));
//    }
//
//    @Transactional
//    public Itemmst updateItem(Long itemIdx, Item.UpdateRequest updateRequest) {
//        Itemmst existingItem = itemmstRepository.findById(itemIdx)
//                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + itemIdx));
//
//        existingItem.setItemNm(updateRequest.getItemNm());
//        existingItem.setItemSpec(updateRequest.getItemSpec());
//        existingItem.setItemCost(updateRequest.getItemCost());
//        existingItem.setRemark(updateRequest.getRemark());
//        existingItem.setOptimalInv(updateRequest.getOptimalInv());
//        existingItem.setItemFlag(updateRequest.getItemFlag());
//
//        if (updateRequest.getCustIdx() != null) {
//            CustomerForItemDto customer = itemCustomerRepository.findById(updateRequest.getCustIdx())
//                    .orElseThrow(() -> new EntityNotFoundException("Customer not found with ID: " + updateRequest.getCustIdx()));
//            existingItem.setCustomerForItemDto(customer);
//        } else {
//            existingItem.setCustomerForItemDto(null);
//        }
//        
//        if (updateRequest.getItemCat1Id() != null) {
//            CatDto cat1 = itemCatRepository.findById(updateRequest.getItemCat1Id())
//                    .orElseThrow(() -> new EntityNotFoundException("Category 1 not found with ID: " + updateRequest.getItemCat1Id()));
//            existingItem.setCatDto1(cat1);
//        } else {
//            existingItem.setCatDto1(null);
//        }
//        
//        if (updateRequest.getItemCat2Id() != null && existingItem.getCatDto1() != null) {
//            CatDto cat2 = itemCatRepository.findById(updateRequest.getItemCat2Id())
//                    .filter(c -> c.getParentIdx() != null && c.getParentIdx().equals(existingItem.getCatDto1().getCatIdx()))
//                    .orElseThrow(() -> new EntityNotFoundException("Category 2 not found or not child of Category 1"));
//            existingItem.setCatDto2(cat2);
//        } else {
//            existingItem.setCatDto2(null);
//        }
//        
//        if (updateRequest.getItemUnitId() != null) {
//            UnitForItemDto unit = itemUnitRepository.findById(updateRequest.getItemUnitId())
//                    .orElseThrow(() -> new EntityNotFoundException("Unit not found with ID: " + updateRequest.getItemUnitId()));
//            existingItem.setUnitForItemDto(unit);
//        } else {
//            existingItem.setUnitForItemDto(null);
//        }
//
//        return itemmstRepository.save(existingItem);
//    }
//
//    @Transactional(readOnly = true)
//    public List<CustomerForItemDto> selectAllCustomers() {
//        return itemCustomerRepository.findAll(Sort.by(Sort.Direction.ASC, "custNm"));
//    }
//
//    @Transactional(readOnly = true)
//    public List<CatDto> selectAllMainCategories() {
//        return itemCatRepository.findByParentIdxIsNullOrderByCatIdx();
//    }
//
//    @Transactional(readOnly = true)
//    public List<CatDto> findSubCategoriesByParentId(Long parentIdx) {
//        return itemCatRepository.findByParentIdxOrderByCatIdx(parentIdx);
//    }
//
//    @Transactional(readOnly = true)
//    public List<UnitForItemDto> selectAllUnits() {
//        return itemUnitRepository.findAll(Sort.by(Sort.Direction.ASC, "unitNm"));
//    }
//
//    @Transactional(readOnly = true)
//    public boolean isItemCdUnique(String itemCd) {
//        return !itemmstRepository.existsByItemCd(itemCd);
//    }
//    
//    @Transactional
//    public Itemmst insertItem(Item.CreateRequest createRequest) {
//        if (itemmstRepository.existsByItemCd(createRequest.getItemCd().trim())) {
//            throw new IllegalArgumentException("품목 코드 '" + createRequest.getItemCd() + "'는 사용중입니다.");
//        }
//
//        Itemmst itemToSave = new Itemmst();
//        itemToSave.setItemCd(createRequest.getItemCd());
//        itemToSave.setItemNm(createRequest.getItemNm());
//        itemToSave.setItemSpec(createRequest.getItemSpec());
//        itemToSave.setRemark(createRequest.getRemark());
//        itemToSave.setItemFlag(createRequest.getItemFlag());
//        itemToSave.setOptimalInv(createRequest.getOptimalInv());
//        itemToSave.setItemCost(createRequest.getItemCost());
//
//        if (createRequest.getCustIdx() != null) {
//            CustomerForItemDto customer = itemCustomerRepository.findById(createRequest.getCustIdx())
//                .orElseThrow(() -> new EntityNotFoundException("Customer not found with ID: " + createRequest.getCustIdx()));
//            itemToSave.setCustomerForItemDto(customer);
//        } else {
//             throw new IllegalArgumentException("거래처 정보가 유효하지 않습니다.");
//        }
//
//        if (createRequest.getItemCat1Id() != null) {
//            CatDto cat1 = itemCatRepository.findById(createRequest.getItemCat1Id())
//                .orElseThrow(() -> new EntityNotFoundException("Category 1 not found with ID: " + createRequest.getItemCat1Id()));
//            itemToSave.setCatDto1(cat1);
//        } else {
//            throw new IllegalArgumentException("대분류 정보가 유효하지 않습니다.");
//        }
//        
//        if (createRequest.getItemCat2Id() != null) {
//            CatDto cat2 = itemCatRepository.findById(createRequest.getItemCat2Id())
//                .orElseThrow(() -> new EntityNotFoundException("Category 2 not found with ID: " + createRequest.getItemCat2Id()));
//            if (cat2.getParentIdx() == null || !cat2.getParentIdx().equals(itemToSave.getCatDto1().getCatIdx())) {
//                 throw new IllegalArgumentException("소분류가 선택된 대분류에 속하지 않습니다.");
//            }
//            itemToSave.setCatDto2(cat2);
//        } else {
//            itemToSave.setCatDto2(null);
//        }
//
//        if (createRequest.getItemUnitId() != null) {
//             UnitForItemDto unit = itemUnitRepository.findById(createRequest.getItemUnitId())
//                .orElseThrow(() -> new EntityNotFoundException("Unit not found with ID: " + createRequest.getItemUnitId()));
//            itemToSave.setUnitForItemDto(unit);
//        } else {
//            throw new IllegalArgumentException("단위 정보가 유효하지 않습니다.");
//        }
//        
//        return itemmstRepository.save(itemToSave);
//    }
//
//    @Transactional(readOnly = true)
//   public List<ItemForSelectionDto> findActiveItemsForSelection() {
//      return itemmstRepository.findAllForSelection(Sort.by(Sort.Direction.ASC, "itemNm"));
//   }
//}