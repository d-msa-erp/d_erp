package kr.co.d_erp.repository.oracle;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import kr.co.d_erp.dtos.UnitForItemDto;


public interface ItemUnitRepository extends JpaRepository<UnitForItemDto, Long> {
	
	@Override
    List<UnitForItemDto> findAll();
}
