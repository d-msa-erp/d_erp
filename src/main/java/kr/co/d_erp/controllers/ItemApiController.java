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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

import kr.co.d_erp.dtos.Item;
import kr.co.d_erp.service.ItemService;

@RestController
@RequestMapping("/api/items")
public class ItemApiController {


	   private final ItemService itemService;

	    @Autowired
	    public ItemApiController(ItemService itemService) {
	        this.itemService = itemService;
	    }
	    
	    @GetMapping("/excel")
	    public ResponseEntity<byte[]> downloadExcel(
	            @RequestParam(value = "CsearchCat", required = false, defaultValue = "") String CsearchCat,
	            @RequestParam(value = "CsearchItem", required = false, defaultValue = "") String CsearchItem
	    ) {
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
	    
	    
	    //품목 코드 중복 확인 및 자동 생성 메소드
	    @GetMapping("/check")
	    public Map<String, Boolean> checkCode(@RequestParam("itemCd") String itemCd){
	    	boolean isUni = itemService.itemCdUnique(itemCd);
	    	Map<String, Boolean> response = new HashMap<>();
	    	response.put("isUni", isUni);
	    	return response;
	    }
	    
	    //거래처 목록 메소드
	    @GetMapping("/custs")
	    public ResponseEntity<List<Item>> getCustomers() {
	        List<Item> customers = itemService.selectALLCust();
	        return new ResponseEntity<>(customers, HttpStatus.OK);
	    }
	    
	    //대분류 목록 메소드
	    @GetMapping("/cats")
	    public ResponseEntity<List<Item>> selectALLcat1() {
	        List<Item> Cat1 = itemService.selectALLcat1();
	        return ResponseEntity.ok(Cat1);
	    }
	    
	    //대분류에 속한 소분류 조회
	    @GetMapping("/sub/{PARENT_IDX}")
	    public ResponseEntity<List<Item>> findALLcat2(@PathVariable("PARENT_IDX") int PARENT_IDX) {
	        List<Item> Cat2 = itemService.findALLcat2(PARENT_IDX);
	        return ResponseEntity.ok(Cat2);
	    }
	    
	    //단위 목록 조회 메소드
	    @GetMapping("/units")
	    public ResponseEntity<List<Item>> selectUnits() {
	        try {
	            List<Item> units = itemService.selectUnits();
	            return ResponseEntity.ok(units);
	        } catch (Exception e) {
	            System.err.println("단위 목록 로드 중 오류 발생: " + e.getMessage());
	            e.printStackTrace();
	            return ResponseEntity.status(500).body(null); // 오류 발생 시 500 응답
	        }
	    }
	    
	    
	    //품목 신규 등록 메소드
	    @PostMapping
	    public ResponseEntity<String> createItem(@RequestBody Item item) {
	        try {
	            itemService.insertItem(item);
	            return new ResponseEntity<>("품목이 성공적으로 등록되었습니다.", HttpStatus.CREATED); // 201 Created
	        } catch (IllegalArgumentException e) {
	            // 품목 코드 중복 등 유효성 검사 실패 시
	            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST); // 400 Bad Request
	        } catch (Exception e) {
	            e.printStackTrace();
	            System.out.println(e.getMessage());
	            return new ResponseEntity<>("품목 등록 중 서버 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR); // 500 Internal Server Error
	        }
	    }
	    
	    //품목 리스트 출력 메소드
	    @GetMapping
	    public ResponseEntity<List<Item>> getAllItems(
	            @RequestParam(value = "page", defaultValue = "1") int page,
	            @RequestParam(value = "size", defaultValue = "10") int size,
	            @RequestParam(value = "CsearchCat", required = false) String CsearchCat,
	            @RequestParam(value =  "CsearchItem", required = false) String CsearchItem) {
	        
	    	Pageable pageable = PageRequest.of(page - 1, size); // Spring Data Pageable 사용 (간편)
	        
	    	List<Item> items;
	        long totalCount;
	        
	        if(CsearchItem != null && !CsearchItem.trim().isEmpty()) {
	        	items = itemService.getSearchItem(pageable, CsearchCat, CsearchItem);
	        	totalCount = itemService.getTotalSearchItemCount(CsearchCat, CsearchItem);
	        }else {
	        	items = itemService.getPagingItem(pageable);
	        	totalCount = itemService.getTotalItemCount();
	        }
	        HttpHeaders headers = new HttpHeaders();
	        headers.add("X-Total-Count", String.valueOf(totalCount));
	        //test
	        return new ResponseEntity<>(items, headers, HttpStatus.OK);
	    }
	    
	    
	    //품목 데이터 업데이트 메소드
	    @PutMapping("/{item_IDX}") // 또는 @PatchMapping("/{itemIdx}")
	    public ResponseEntity<Item> updateItem(@PathVariable("item_IDX") int item_IDX, @RequestBody
	    		Item updatedItem) {
	    	
	    	System.out.println("updatedItem.getITEM_NM(): " + updatedItem.getITEM_NM());
	        System.out.println("updatedItem.getITEM_CD(): " + updatedItem.getITEM_CD());
	        System.out.println("updatedItem.getCUST_NM(): " + updatedItem.getCUST_NM());
	        System.out.println("updatedItem.getCUST_IDX(): " + updatedItem.getCUST_IDX());
	        Item existingItem = itemService.getItemById(item_IDX); // 수정할 품목이 있는지 확인

	        if (existingItem == null) {
	            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // 해당 ID의 품목이 없으면 404 반환
	        }
	        	existingItem.setITEM_NM(updatedItem.getITEM_NM());
	        	existingItem.setCUST_NM(updatedItem.getCUST_NM());
	        	existingItem.setITEM_SPEC(updatedItem.getITEM_SPEC());
	        	existingItem.setITEM_COST(updatedItem.getITEM_COST());
	        	existingItem.setREMARK(updatedItem.getREMARK());
	        	existingItem.setOPTIMAL_INV(updatedItem.getOPTIMAL_INV());
	        	
	            existingItem.setCUST_IDX(updatedItem.getCUST_IDX()); 
	            existingItem.setCUST_NM(updatedItem.getCUST_NM()); 
	        	
	        try {
	        	itemService.updateItem(existingItem);

	        }catch (IllegalArgumentException e) {
	        	e.getMessage();
	        	return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
				
			}catch (Exception e) {
				e.printStackTrace();
				return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
			}

	        updatedItem.setITEM_IDX(item_IDX); // ID 설정 (URL에서 가져온 ID 사용)
	        
	        Item updated = itemService.getItemById(item_IDX); // 업데이트된 품목 정보 다시 조회
	        return new ResponseEntity<>(updated, HttpStatus.OK); // 성공 시 200 OK와 업데이트된 정보 반환
	        
	    }
	    
	    //삭제 메소드
	    @PostMapping("/deletes")
	    public ResponseEntity<String> deleteItem(@RequestBody List<Integer> itemIdx){
	    	if (itemIdx == null || itemIdx.isEmpty()) {
	            return ResponseEntity.badRequest().body("삭제할 품목 ID가 없습니다.");
	        }
	        try {
	            itemService.deleteItems(itemIdx);
	            return ResponseEntity.ok("선택된 품목이 성공적으로 삭제되었습니다.");
	        } catch (Exception e) {
	            // 상세한 예외 로깅
	            e.printStackTrace();
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("품목 삭제 중 오류가 발생했습니다: " + e.getMessage());
	        }
	    }
	    
	    /*
	    @GetMapping("/Item") // 예시 URL
	    public String getItemList(Model m) {
	    List<Item> itemList = itemService.getAllItem();
	    m.addAttribute("items", itemList); // Model에 데이터를 담아서 View로 전달합니다.
	    return "/inventory.html"; // Thymeleaf 템플릿 이름 (예시)
	    } 
	    */ 
	    
}
