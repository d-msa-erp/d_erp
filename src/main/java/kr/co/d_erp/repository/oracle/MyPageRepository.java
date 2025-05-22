package kr.co.d_erp.repository.oracle;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.Login;

@Repository
public interface MyPageRepository extends JpaRepository<Login, Long>{
	Optional<Login> findByUserId(String userId);
}
