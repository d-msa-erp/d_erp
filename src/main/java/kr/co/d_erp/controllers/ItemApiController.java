package kr.co.d_erp.controllers;

import java.util.List;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
	    
	    @GetMapping
	    public ResponseEntity<List<Item>> getAllItems(
	            @RequestParam(value = "page", defaultValue = "1") int page,
	            @RequestParam(value = "size", defaultValue = "10") int size) {
	        Pageable pageable = PageRequest.of(page - 1, size); // Spring Data Pageable 사용 (간편)
	        List<Item> items = itemService.getPagingItem(pageable);
	        long totalCount = itemService.getTotalItemCount();

	        HttpHeaders headers = new HttpHeaders();
	        headers.add("X-Total-Count", String.valueOf(totalCount));
	        //test
	        return new ResponseEntity<>(items, headers, HttpStatus.OK);
	    }
	    
	    
	    @PutMapping("/{item_IDX}") // 또는 @PatchMapping("/{itemIdx}")
	    public ResponseEntity<Item> updateItem(@PathVariable("item_IDX") int item_IDX, @RequestBody
	    		Item updatedItem) {
	        Item existingItem = itemService.getItemById(item_IDX); // 수정할 품목이 있는지 확인

	        if (existingItem == null) {
	        	
	        	
	            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // 해당 ID의 품목이 없으면 404 반환
	        }

	        updatedItem.setITEM_IDX(item_IDX); // ID 설정 (URL에서 가져온 ID 사용)
	        itemService.updateItem(updatedItem); // 서비스 계층에 업데이트 요청
	        Item updated = itemService.getItemById(item_IDX); // 업데이트된 품목 정보 다시 조회
	        return new ResponseEntity<>(updated, HttpStatus.OK); // 성공 시 200 OK와 업데이트된 정보 반환
	        // 또는 return new ResponseEntity<>(HttpStatus.NO_CONTENT); // 성공 시 204 No Content 반환
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
