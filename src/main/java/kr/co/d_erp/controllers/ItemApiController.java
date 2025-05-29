package kr.co.d_erp.controllers;

import java.io.IOException;


import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.persistence.EntityNotFoundException;
import kr.co.d_erp.dtos.CatDto;
import kr.co.d_erp.dtos.CustomerForItemDto;
import kr.co.d_erp.dtos.InvenDto;
import kr.co.d_erp.dtos.Item;
import kr.co.d_erp.dtos.ItemDto;
import kr.co.d_erp.dtos.ItemForSelectionDto;
import kr.co.d_erp.dtos.Itemmst;
import kr.co.d_erp.dtos.UnitForItemDto;
import kr.co.d_erp.service.ItemService;

@RestController
@RequestMapping("/api/items")
public class ItemApiController {

	private final ItemService itemService;

	@Autowired
	public ItemApiController(ItemService itemService) {
		this.itemService = itemService;
	}

	private Itemmst mapToItemEntityForCreate(Item.CreateRequest dto) {
        // ItemDto가 실제 JPA 엔티티 클래스라고 가정합니다.
        // 만약 Item.java 자체가 JPA 엔티티라면, Item 객체를 생성해야 합니다.
		Itemmst entity = new Itemmst();
        entity.setItemCd(dto.getItemCd());
        entity.setItemNm(dto.getItemNm());
        entity.setItemSpec(dto.getItemSpec());
        entity.setRemark(dto.getRemark());
        entity.setItemFlag(dto.getItemFlag());
        entity.setOptimalInv(dto.getOptimalInv());
        entity.setItemCost(dto.getItemCost());

        if (dto.getCustIdx() != null) {
            CustomerForItemDto customer = new CustomerForItemDto();
            customer.setCustIdx(dto.getCustIdx());
            entity.setCustomerForItemDto(customer); // 서비스에서 실제 엔티티 조회 후 연결
        }
        if (dto.getItemCat1Id() != null) {
            CatDto cat1 = new CatDto();
            cat1.setCatIdx(dto.getItemCat1Id());
            entity.setCatDto1(cat1); // 서비스에서 실제 엔티티 조회 후 연결
        }
        if (dto.getItemCat2Id() != null) {
            CatDto cat2 = new CatDto();
            cat2.setCatIdx(dto.getItemCat2Id());
            entity.setCatDto2(cat2); // 서비스에서 실제 엔티티 조회 후 연결
        }
        if (dto.getItemUnitId() != null) {
            UnitForItemDto unit = new UnitForItemDto();
            unit.setUnitIdx(dto.getItemUnitId());
            entity.setUnitForItemDto(unit); // 서비스에서 실제 엔티티 조회 후 연결
        }
        return entity;
    }

    private Itemmst mapToItemEntityForUpdate(Item.UpdateRequest dto) {
        // ItemDto가 실제 JPA 엔티티 클래스라고 가정합니다.
    	Itemmst entityUpdates = new Itemmst();
        entityUpdates.setItemNm(dto.getItemNm());
        entityUpdates.setItemSpec(dto.getItemSpec());
        entityUpdates.setRemark(dto.getRemark());
        entityUpdates.setItemFlag(dto.getItemFlag());
        entityUpdates.setOptimalInv(dto.getOptimalInv());
        entityUpdates.setItemCost(dto.getItemCost());

        if (dto.getCustIdx() != null) {
            CustomerForItemDto customer = new CustomerForItemDto(); customer.setCustIdx(dto.getCustIdx());
            entityUpdates.setCustomerForItemDto(customer);
        }
        if (dto.getItemCat1Id() != null) {
            CatDto cat1 = new CatDto(); cat1.setCatIdx(dto.getItemCat1Id());
            entityUpdates.setCatDto1(cat1);
        }
        if (dto.getItemCat2Id() != null) {
            CatDto cat2 = new CatDto(); cat2.setCatIdx(dto.getItemCat2Id());
            entityUpdates.setCatDto2(cat2);
        }
        if (dto.getItemUnitId() != null) {
            UnitForItemDto unit = new UnitForItemDto(); unit.setUnitIdx(dto.getItemUnitId());
            entityUpdates.setUnitForItemDto(unit);
        }
        return entityUpdates;
    }

    private Item.Response mapToItemResponseDto(Itemmst entity) {
        if (entity == null) return null;
        Item.Response dto = new Item.Response();
        dto.setItemIdx(entity.getItemIdx());
        dto.setItemCd(entity.getItemCd());
        dto.setItemNm(entity.getItemNm());
        dto.setItemFlag(entity.getItemFlag());
        dto.setItemSpec(entity.getItemSpec());
        dto.setRemark(entity.getRemark());
        dto.setOptimalInv(entity.getOptimalInv());
        dto.setItemCost(entity.getItemCost()); // ItemDto 엔티티의 itemCost 사용
        Long totalStockQty = 0L;
        if (entity.getInvenDtos() != null) {
            for (InvenDto invenDto : entity.getInvenDtos()) {
                if (invenDto.getStockQty() != null) {
                    totalStockQty += invenDto.getStockQty();
                }
            }
        }
        dto.setQty(totalStockQty);

        if (entity.getCustomerForItemDto() != null) {
            dto.setCustIdx(entity.getCustomerForItemDto().getCustIdx());
            dto.setCustNm(entity.getCustomerForItemDto().getCustNm());
        }
        if (entity.getCatDto1() != null) {
            dto.setItemCat1Id(entity.getCatDto1().getCatIdx());
            dto.setItemCat1Nm(entity.getCatDto1().getCatNm());
        }
        if (entity.getCatDto2() != null) {
            dto.setItemCat2Id(entity.getCatDto2().getCatIdx());
            dto.setItemCat2Nm(entity.getCatDto2().getCatNm());
        }
        if (entity.getUnitForItemDto() != null) {
            dto.setItemUnitId(entity.getUnitForItemDto().getUnitIdx());
            dto.setUnitNm(entity.getUnitForItemDto().getUnitNm());
        }
        // Item.Response DTO에 CYCLE_TIME이 필요하다면 ItemDto 엔티티에서 가져와 설정
        // 예: dto.setCycleTime(entity.getCycleTime()); (ItemDto에 getCycleTime()이 있다고 가정)
        return dto;
    }

    // --- API Endpoints ---

    @GetMapping("/excel")
    public ResponseEntity<byte[]> downloadExcel(
            @RequestParam(value = "CsearchCat", required = false, defaultValue = "") String CsearchCat,
            @RequestParam(value = "CsearchItem", required = false, defaultValue = "") String CsearchItem) {
        try {
            byte[] excelContent = itemService.createExcelFile(CsearchCat, CsearchItem);
            String fileName = "품목_리스트_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx";
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8.toString()).replaceAll("\\+", "%20");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", encodedFileName);
            headers.setContentLength(excelContent.length);

            return new ResponseEntity<>(excelContent, headers, HttpStatus.OK);
        } catch (IOException e) {
            e.printStackTrace(); // 로깅 필요
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkItemCodeUnique(@RequestParam("itemCd") String itemCd) {
        boolean isUnique = itemService.itemCdUnique(itemCd);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isUni", isUnique);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/custs")
    public ResponseEntity<List<CustomerForItemDto>> getAllCustomers() {
        List<CustomerForItemDto> customers = itemService.selectALLCust();
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/cats")
    public ResponseEntity<List<CatDto>> getAllMainCategories() {
        List<CatDto> categories = itemService.selectALLcat1();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/sub/{PARENT_IDX}")
    public ResponseEntity<List<CatDto>> getSubCategoriesByParentId(@PathVariable("PARENT_IDX") Long parentIdx) {
        List<CatDto> categories = itemService.findALLcat2(parentIdx);
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/units")
    public ResponseEntity<List<UnitForItemDto>> getAllUnits() {
        List<UnitForItemDto> units = itemService.selectUnits();
        return ResponseEntity.ok(units);
    }

    @PostMapping
    public ResponseEntity<?> createItem(@RequestBody Item.CreateRequest createRequestDto) {
        try {
            // ItemDto는 JPA 엔티티 클래스 이름으로 가정합니다.
            // 만약 Item.java 자체가 엔티티라면 new Item()으로 변경해야 합니다.
        	Itemmst itemToSave = mapToItemEntityForCreate(createRequestDto);
        	Itemmst savedItem = itemService.insertItem(itemToSave);
            Item.Response responseDto = mapToItemResponseDto(savedItem);
            return new ResponseEntity<>(responseDto, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace(); // 로깅 필요
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("품목 등록 중 서버 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<Page<Item.Response>> getAllItems(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "CsearchCat", required = false) String CsearchCat,
            @RequestParam(value = "CsearchItem", required = false) String CsearchItem) {

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "itemIdx"));
        Page<Itemmst> itemEntityPage; // ItemDto는 JPA 엔티티로 가정

        if (CsearchItem != null && !CsearchItem.trim().isEmpty()) {
            itemEntityPage = itemService.getSearchItem(pageable, CsearchCat, CsearchItem);
        } else {
            itemEntityPage = itemService.getPagingItem(pageable);
        }
        
        Page<Item.Response> itemResponseDtoPage = itemEntityPage.map(this::mapToItemResponseDto);

        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Total-Count", String.valueOf(itemResponseDtoPage.getTotalElements()));
        
        return new ResponseEntity<>(itemResponseDtoPage, headers, HttpStatus.OK);
    }
    
    @GetMapping("/{item_IDX}")
    public ResponseEntity<Item.Response> getItemById(@PathVariable("item_IDX") Long itemIdx) {
        try {
        	Itemmst itemEntity = itemService.getItemById(itemIdx); // ItemDto는 JPA 엔티티로 가정
            Item.Response responseDto = mapToItemResponseDto(itemEntity);
            return ResponseEntity.ok(responseDto);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{item_IDX}")
    public ResponseEntity<?> updateItem(@PathVariable("item_IDX") Long itemIdx,
                                          @RequestBody Item.UpdateRequest updateRequestDto) {
        try {
            // ItemDto는 JPA 엔티티 클래스 이름으로 가정합니다.
        	Itemmst itemUpdates = mapToItemEntityForUpdate(updateRequestDto);
        	Itemmst updatedItem = itemService.updateItem(itemIdx, itemUpdates);
            Item.Response responseDto = mapToItemResponseDto(updatedItem);
            return ResponseEntity.ok(responseDto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace(); // 로깅 필요
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("품목 수정 중 서버 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @PostMapping("/deletes")
    public ResponseEntity<String> deleteItems(@RequestBody List<Long> itemIdxs) {
        if (itemIdxs == null || itemIdxs.isEmpty()) {
            return ResponseEntity.badRequest().body("삭제할 품목 ID가 없습니다.");
        }
        try {
            itemService.deleteItems(itemIdxs);
            return ResponseEntity.ok("선택된 품목이 성공적으로 삭제되었습니다.");
        } catch (Exception e) {
            e.printStackTrace(); // 로깅 필요
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("품목 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}
