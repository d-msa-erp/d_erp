package kr.co.d_erp.service;

import java.util.List;

import kr.co.d_erp.dtos.CategoryDto;

public interface CategoryService {
	// 전부 출력용
	List<CategoryDto> getAllCats();

	// 카테고리 저장용(대분류, 소분류 모두 가능하도록 변경)
	CategoryDto saveCategory(CategoryDto catDto);

	// 카테고리 삭제용 (catIdx에 로 구분 대분류/소분류 모두 삭제 가능)
	void deleteCategory(Integer catIdx);

}
