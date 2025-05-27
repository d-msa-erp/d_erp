package kr.co.d_erp.repository.oracle;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import kr.co.d_erp.dtos.InvenDto;

public interface ItemInvenRepository extends JpaRepository<InvenDto, Long> {
	Optional<InvenDto> findByItem_ItemIdx(Long itemIdx);
}
