package kr.co.d_erp.repository.oracle;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.Itemmst;

@Repository
public interface ItemmstRepository extends JpaRepository<Itemmst, Long>{

	
}
