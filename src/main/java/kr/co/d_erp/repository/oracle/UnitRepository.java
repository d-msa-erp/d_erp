package kr.co.d_erp.repository.oracle;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.Unit;

@Repository
public interface UnitRepository extends JpaRepository<Unit, Integer> {
    // JpaRepository가 기본 CRUD 메서드를 제공하므로 추가적인 메서드는 필요 없음
    // 필요하다면 findByUnitNm(String unitNm) 등 사용자 정의 메서드 추가 가능
}