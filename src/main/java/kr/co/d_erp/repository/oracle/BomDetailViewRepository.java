package kr.co.d_erp.repository.oracle;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.BomDetailView;
import kr.co.d_erp.domain.BomDetailViewId;

// BomDetailView Entity와 BomDetailViewId Primary Key를 사용하는 Repository
@Repository
public interface BomDetailViewRepository extends JpaRepository<BomDetailView, BomDetailViewId> {
	
}