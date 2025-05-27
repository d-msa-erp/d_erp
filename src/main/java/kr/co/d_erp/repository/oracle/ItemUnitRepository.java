package kr.co.d_erp.repository.oracle;

import org.springframework.data.jpa.repository.JpaRepository;

import kr.co.d_erp.dtos.UnitForItemDto;

public interface ItemUnitRepository extends JpaRepository<UnitForItemDto, Long> {
}
