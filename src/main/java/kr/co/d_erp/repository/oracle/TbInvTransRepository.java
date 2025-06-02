package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.domain.TbInvTrans;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TbInvTransRepository extends JpaRepository<TbInvTrans, Long> {
    // 필요한 경우 여기에 사용자 정의 조회 메소드 추가
	List<TbInvTrans> findByTbOrder_OrderIdx(Long orderIdx); // 삭제를 위해 추가
}