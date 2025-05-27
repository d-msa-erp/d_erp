package kr.co.d_erp.repository.oracle;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import kr.co.d_erp.dtos.CatDto;

public interface ItemCatRepository extends JpaRepository<CatDto, Long> {
	List<CatDto> findByParentIdxOrderByCatIdx(Long parentIdx);
    List<CatDto> findByParentIdxIsNullOrderByCatIdx();
}
