package kr.co.d_erp.repository.oracle;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import kr.co.d_erp.domain.Usermst;

import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsermstRepository extends JpaRepository<Usermst, Long> {

	// 사용자 ID로 조회 (중복 방지 등에 사용 가능)
	Optional<Usermst> findByUserId(String userId);

	// 이메일로 조회 (중복 방지 등에 사용 가능)
	Optional<Usermst> findByUserEmail(String userEmail);
	
	/**
	 * 키워드를 사용하여 여러 필드에서 사용자를 검색하고 정렬합니다. 키워드가 없으면 모든 사용자를 반환합니다. 정렬은 Service 계층에서
	 * 전달받은 Sort 객체에 의해 처리됩니다.
	 */
	@Query("SELECT u FROM Usermst u WHERE " + "(:keyword IS NULL OR :keyword = '' OR " + // 키워드가 없거나 비어있으면 모든 결과를 포함
			"LOWER(u.userNm) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
			+ "LOWER(u.userId) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
			+ "LOWER(u.userTel) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
			+ "LOWER(u.userHp) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
			+ "LOWER(u.userDept) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
			+ "LOWER(u.userPosition) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
			+ "LOWER(u.userStatus) LIKE LOWER(CONCAT('%', :keyword, '%')))" // 모든 검색 필드에 대한 조건
	)
	List<Usermst> findAllUsersByKeyword(@Param("keyword") String keyword, Sort sort);

	/**
	 * 페이징과 키워드 검색을 지원하는 사용자 조회 메서드
	 */
	@Query("SELECT u FROM Usermst u WHERE " + "(:keyword IS NULL OR :keyword = '' OR " + 
			"LOWER(u.userNm) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
			+ "LOWER(u.userId) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
			+ "LOWER(u.userTel) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
			+ "LOWER(u.userHp) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
			+ "LOWER(u.userDept) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
			+ "LOWER(u.userPosition) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
			+ "LOWER(u.userStatus) LIKE LOWER(CONCAT('%', :keyword, '%')))"
	)
	Page<Usermst> findAllUsersByKeywordWithPaging(@Param("keyword") String keyword, Pageable pageable);

	// 창고 담당자 셀렉트에 사용
	// USER_STATUS가 '01'인 사용자만 조회하는 메소드
	List<Usermst> findByUserStatus(String userStatus);

}