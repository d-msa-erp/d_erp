package kr.co.d_erp.service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import kr.co.d_erp.domain.Category;
import kr.co.d_erp.dtos.CategoryDto;
import kr.co.d_erp.repository.oracle.CategoryRepository;

@Service
public class CategoryServiceImpl implements CategoryService {
	private final CategoryRepository catRepo;

	private CategoryDto convertToDto(Category cat) {
		return new CategoryDto(cat.getCatIdx(), cat.getCatCd(), cat.getCatNm(), cat.getParentIdx(), cat.getReMark());
	}

	private Category convertToEntity(CategoryDto dto) {
		Category cat = new Category();
		cat.setCatIdx(dto.getCatIdx()); // 추가: 업데이트 시 필요
		cat.setCatCd(dto.getCatCd());
		cat.setCatNm(dto.getCatNm());
		cat.setParentIdx(dto.getParentIdx());
		cat.setReMark(dto.getReMark());
		return cat;
	}

	@Autowired
	public CategoryServiceImpl(CategoryRepository catRepo) {
		this.catRepo = catRepo;
	}

	@Override
	public List<CategoryDto> getAllCats() {
		return catRepo.findAll().stream().map(this::convertToDto).collect(Collectors.toList());
	}

	@Override
	public CategoryDto saveCategory(CategoryDto catDto) { // saveMainCat -> saveCategory로 이름 변경
		// DTO to Entity
		Category entity = convertToEntity(catDto);
		// 저장
		Category saved = catRepo.save(entity);
		// 엔티티 to DTO
		return convertToDto(saved);
	}

	@Transactional
	@Override
	public void deleteCategory(Integer catIdx) {
		// 1. 해당 카테고리가 존재하는지 확인
		if (!catRepo.existsById(catIdx)) {
			throw new NoSuchElementException("해당 ID의 카테고리를 찾을 수 없습니다: " + catIdx);
		}

		// 2. 삭제하려는 카테고리 정보 가져오기
		Category categoryToDelete = catRepo.findById(catIdx)
											.orElseThrow(() -> new NoSuchElementException("카테고리를 찾을 수 없습니다."));

		// 3. 삭제하려는 카테고리가 대분류인지 확인 (parentIdx가 null인 경우)
		if (categoryToDelete.getParentIdx() == null) {
			// 대분류인 경우, 소분류가 존재하는지 확인
			List<Category> childCategories = catRepo.findByParentIdx(catIdx);
			if (!childCategories.isEmpty()) {
				throw new IllegalStateException("해당 대분류에 소분류가 존재하여 삭제할 수 없습니다.");
			}
		}
		// 4. 카테고리 삭제
		catRepo.deleteById(catIdx);
	}
}