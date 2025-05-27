package kr.co.d_erp.controllers;

import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import kr.co.d_erp.dtos.CategoryDto;
import kr.co.d_erp.service.CategoryService;
import kr.co.d_erp.service.CategoryServiceImpl;

@RestController
@RequestMapping("/api/category")
@CrossOrigin(origins = "*")
public class CategoryController {

	private final CategoryServiceImpl categoryServiceImpl;
	private final CategoryService catService;

	public CategoryController(CategoryService catService, CategoryServiceImpl categoryServiceImpl) {
		this.catService = catService;
		this.categoryServiceImpl = categoryServiceImpl;
	}

	// 조회용
	@GetMapping("/details")
	public ResponseEntity<List<CategoryDto>> getAllCats() {
		List<CategoryDto> cats = catService.getAllCats();
		return ResponseEntity.ok(cats);

	}

	// 카테고리 추가용 (대분류/소분류 모두 가능)
	@PostMapping("/add")
	public ResponseEntity<CategoryDto> addCategory(@RequestBody CategoryDto categoryDto) {
		CategoryDto savedCategory = catService.saveCategory(categoryDto); // saveCategory로 변경
		return ResponseEntity.status(HttpStatus.CREATED).body(savedCategory);
	}

	// 카테고리 삭제용
	@DeleteMapping("/delete/{catIdx}")
	public ResponseEntity<Void> deleteCategory(@PathVariable Integer catIdx) {
		catService.deleteCategory(catIdx);
		return ResponseEntity.noContent().build();
	}
	
	// ----------- 예외 핸들러 추가 -----------
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> handleIllegalStateException(IllegalStateException ex) {
        // IllegalStateException이 발생하면 HTTP 409 Conflict 상태 코드와 함께 예외 메시지를 반환합니다.
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<String> handleNoSuchElementException(NoSuchElementException ex) {
        // NoSuchElementException이 발생하면 HTTP 404 Not Found 상태 코드와 함께 예외 메시지를 반환합니다.
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGenericException(Exception ex) {
        // 그 외 모든 예외에 대해 HTTP 500 Internal Server Error 상태 코드와 함께 일반적인 메시지를 반환합니다.
        // 운영 환경에서는 실제 오류 메시지 대신 "서버 오류가 발생했습니다."와 같이 더 일반적인 메시지를 사용하는 것이 좋습니다.
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("처리 중 오류가 발생했습니다: " + ex.getMessage());
    }
    

}
