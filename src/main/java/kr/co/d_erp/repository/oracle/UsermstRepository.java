package kr.co.d_erp.repository.oracle;

import kr.co.d_erp.dtos.Usermst;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsermstRepository extends JpaRepository<Usermst, Long> {

    // 사용자 ID로 조회 (중복 방지 등에 사용 가능)
    Optional<Usermst> findByUserId(String userId);

    // 이메일로 조회 (중복 방지 등에 사용 가능)
    Optional<Usermst> findByUserEmail(String userEmail);

    // 필요한 경우 다른 커스텀 쿼리 메서드 추가
}