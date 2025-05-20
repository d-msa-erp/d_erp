package kr.co.d_erp.repository.oracle;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.BomDetailView;
import kr.co.d_erp.domain.BomDetailViewId;

// BomDetailView Entity와 BomDetailViewId Primary Key를 사용하는 Repository
@Repository
public interface BomDetailViewRepository extends JpaRepository<BomDetailView, BomDetailViewId> {
    // JpaRepository는 findAll(), findById() 등 기본적인 CRUD 메서드를 제공합니다.
    // 추가적인 조회 메서드가 필요하면 여기에 선언할 수 있습니다.
}