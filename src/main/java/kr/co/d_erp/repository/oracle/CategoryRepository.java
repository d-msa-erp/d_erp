package kr.co.d_erp.repository.oracle;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import kr.co.d_erp.domain.Category;

public interface CategoryRepository  extends JpaRepository<Category, Integer>{
    // JpaRepository가 기본 CRUD 메서드를 제공하므로 추가적인 메서드는 필요 없음
    // 필요하다면 findByUnitNm(String unitNm) 등 사용자 정의 메서드 추가 가능
	List<Category> findByParentIdx(Integer parentIdx);
}
