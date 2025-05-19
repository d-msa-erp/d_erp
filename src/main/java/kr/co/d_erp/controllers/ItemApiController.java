package kr.co.d_erp.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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

	    
	    
	    
	    
	    
	    
	    
	    
	    
	    /*
	    @GetMapping("/Item") // 예시 URL
	    public String getItemList(Model m) {
	    List<Item> itemList = itemService.getAllItem();
	    m.addAttribute("items", itemList); // Model에 데이터를 담아서 View로 전달합니다.
	    return "/inventory.html"; // Thymeleaf 템플릿 이름 (예시)
	    } 
	    */ 
	    
}
