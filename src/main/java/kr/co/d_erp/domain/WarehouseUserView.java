package kr.co.d_erp.domain;

import com.mongodb.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Immutable // 이 엔티티는 읽기 전용임을 나타냄
@Table(name = "VW_WAREHOUSE_USER_INFO") // 뷰 이름 지정
// 또는 @Subselect("SELECT WH_IDX, WH_CD, WH_NM, WH_USER_NM, WH_USER_ID FROM VW_WAREHOUSE_USER_INFO")
// @Synchronize({"TB_WHMST", "TB_USERMST"}) // 관련 테이블 변경 시 캐시 동기화
public class WarehouseUserView {
    @Id
    @Column(name = "WH_IDX")
    private Long whIdx;
    // 나머지 뷰 컬럼들도 필드로 매핑
    @Column(name = "WH_CD")
    private String whCd;
    @Column(name = "WH_NM")
    private String whNm;
    @Column(name = "WH_USER_NM")
    private String whUserNm;
    @Column(name = "WH_USER_ID")
    private String whUserId;
}