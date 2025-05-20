package kr.co.d_erp.domain;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

// 뷰의 복합 Primary Key를 위한 클래스
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode // JPA 복합 키는 equals와 hashCode를 구현해야 합니다.
public class BomDetailViewId implements Serializable {

    private static final long serialVersionUID = 1L;

    // 뷰의 P_ITEM_CD 컬럼과 매핑
    private String pItemCd;

    // 뷰의 S_ITEM_CD 컬럼과 매핑
    private String sItemCd;

    // 기본 생성자, getter, setter, equals, hashCode 필요
    // Lombok으로 대체
}