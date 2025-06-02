package kr.co.d_erp.repository.oracle;

import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;

import kr.co.d_erp.domain.Production;

public interface ProductionRepository extends JpaRepository<Production, Long> {
	long countByProdDate(LocalDate prodDate);
}
