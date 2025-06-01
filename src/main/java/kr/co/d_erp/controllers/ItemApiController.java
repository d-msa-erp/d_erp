package kr.co.d_erp.controllers;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
import kr.co.d_erp.dtos.Itemmst;
import kr.co.d_erp.dtos.UnitForItemDto;
import kr.co.d_erp.service.ItemService;

@RestController
@RequestMapping("/api/items")
public class ItemApiController {

	private final ItemService itemService;

	public ItemApiController(ItemService itemService) {
		this.itemService = itemService;
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
        dto.setItemCost(entity.getItemCost());

        Long totalStockQty = 0L;
        if (entity.getInvenDto() != null) {
            for (InvenDto invenDto : entity.getInvenDto()) {
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
        dto.setCycleTime(entity.getCycleTime()); // cycleTime 필드 추가

        return dto;
    }

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
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkItemCodeUnique(@RequestParam("itemCd") String itemCd) {
        boolean isUnique = itemService.isItemCdUnique(itemCd);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isUni", isUnique);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/custs")
    public ResponseEntity<List<CustomerForItemDto>> getAllCustomers() {
        List<CustomerForItemDto> customers = itemService.selectAllCustomers();
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/cats")
    public ResponseEntity<List<CatDto>> getAllMainCategories() {
        List<CatDto> categories = itemService.selectAllMainCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/sub/{PARENT_IDX}")
    public ResponseEntity<List<CatDto>> getSubCategoriesByParentId(@PathVariable("PARENT_IDX") Long parentIdx) {
        List<CatDto> categories = itemService.findSubCategoriesByParentId(parentIdx);
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/units")
    public ResponseEntity<List<UnitForItemDto>> getAllUnits() {
        List<UnitForItemDto> units = itemService.selectAllUnits();
        return ResponseEntity.ok(units);
    }

    @PostMapping
    public ResponseEntity<?> createItem(@RequestBody Item.CreateRequest createRequestDto) {
        try {
            Itemmst savedItem = itemService.insertItem(createRequestDto);
            Item.Response responseDto = mapToItemResponseDto(savedItem);
            return new ResponseEntity<>(responseDto, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
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
        Page<Itemmst> itemEntityPage;

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
            Itemmst itemEntity = itemService.getItemById(itemIdx);
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
            Itemmst updatedItem = itemService.updateItem(itemIdx, updateRequestDto);
            Item.Response responseDto = mapToItemResponseDto(updatedItem);
            return ResponseEntity.ok(responseDto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
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
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("품목 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}