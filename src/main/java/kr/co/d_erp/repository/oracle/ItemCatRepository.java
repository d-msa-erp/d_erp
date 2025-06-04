package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.domain.ItemCategory; // ✳️ 실제 ItemCategory 엔티티로 변경
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

// ✳️ JpaRepository의 제네릭 타입을 ItemCategory 엔티티와 그것의 PK 타입(Long)으로 변경
public interface ItemCatRepository extends JpaRepository<ItemCategory, Long> {

    // ItemCategory 엔티티의 'parentCategory' 필드가 null인 것을 찾고, 'catNm'으로 오름차순 정렬
    // (ItemCategory 엔티티에 'catNm' 필드가 있고, 'parentCategory'라는 ItemCategory 타입의 필드가 있다고 가정)
    List<ItemCategory> findByParentCategoryIsNullOrderByCatNmAsc();

    // ItemCategory 엔티티의 'parentCategory' 필드의 'catIdx'가 주어진 parentCatId와 일치하는 것을 찾고, 'catNm'으로 오름차순 정렬
    // (ItemCategory 엔티티에 'parentCategory' 필드가 있고, 그 필드의 타입인 ItemCategory 엔티티에 'catIdx' 필드가 있다고 가정)
    List<ItemCategory> findByParentCategory_CatIdxOrderByCatNmAsc(Long parentCatId);
}