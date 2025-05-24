package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.domain.VInvTransactionDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface VInvTransactionDetailsRepository extends JpaRepository<VInvTransactionDetails, Long>, JpaSpecificationExecutor<VInvTransactionDetails> {
    // JpaRepository는 기본적인 CRUD 메소드 (findById, findAll 등)를 제공합니다.
    // JpaSpecificationExecutor는 Specification을 사용한 동적 쿼리 실행을 지원합니다.
    // VInvTransactionDetails는 읽기 전용이므로, save, delete 등의 메소드는 의미가 없거나 에러를 발생시킬 수 있습니다.
}